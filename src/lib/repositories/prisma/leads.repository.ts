import "server-only";

import { prisma } from "@/lib/db";
import type {
  CallbackRequest,
  CreateCallbackInput,
  CreateLeadInput,
  CrudRepository,
  Lead,
  LeadStatus,
} from "../types";

/**
 * LEADS AND CALLBACKS, ON POSTGRESQL
 *
 * SERVER ONLY. Implements exactly the interfaces the JSON versions did —
 * `CrudRepository<Lead, CreateLeadInput>` — so the server actions, the admin
 * tables and the chatbot are untouched by this swap.
 *
 * What changes underneath is that a submission is no longer an isolated row.
 * A person becomes a `contact`, deduplicated on normalised phone, and the lead
 * hangs off them — so the same buyer enquiring three times is one contact with
 * three leads rather than three strangers who happen to share a number.
 */

/**
 * Interactive-transaction limits.
 *
 * Prisma's defaults are a 2s wait and a 5s budget, which assume a database on
 * the same continent. This one is a Supabase pooler in ap-northeast-1 where a
 * single round trip costs the better part of a second, so a three-statement
 * transaction can exceed the default budget and abort with P2028 — losing a
 * captured lead at the moment a visitor pressed Send.
 *
 * The real fix is fewer statements inside the transaction (reference lookups
 * are hoisted out below, since they need no transactional consistency); these
 * bounds are the safety margin around that.
 */
const TRANSACTION_OPTIONS = { maxWait: 15_000, timeout: 30_000 } as const;

/** E.164, matching the seed's normalisation so imports and live capture agree. */
function normalizePhone(raw: string): string {
  const text = String(raw ?? "").trim();
  const hasPlus = text.startsWith("+");
  const digits = text.replace(/\D/g, "");
  if (!digits) return "";
  if (hasPlus) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}

function splitName(fullName: string) {
  const parts = String(fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: null, lastName: null };
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

/** LEAD-2026-000123 — quotable on a phone call, unlike a UUID. */
async function nextReference(prefix: string): Promise<string> {
  const year = new Date().getUTCFullYear();
  const count = await prisma.lead.count({
    where: { createdAt: { gte: new Date(Date.UTC(year, 0, 1)) } },
  });
  return `${prefix}-${year}-${String(count + 1).padStart(6, "0")}`;
}

export class PrismaLeadRepository
  implements CrudRepository<Lead, CreateLeadInput>
{
  private async toDomain(row: {
    id: string;
    createdAt: Date;
    message: string | null;
    contact: { fullName: string; phoneRaw: string; email: string | null };
    source: { slug: string };
    stage: { slug: string };
    project: { name: string } | null;
  }): Promise<Lead> {
    return {
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      source: row.source.slug as Lead["source"],
      status: row.stage.slug as LeadStatus,
      name: row.contact.fullName,
      phone: row.contact.phoneRaw,
      ...(row.contact.email ? { email: row.contact.email } : {}),
      ...(row.project?.name ? { interest: row.project.name } : {}),
      ...(row.message ? { message: row.message } : {}),
    };
  }

  private static readonly INCLUDE = {
    contact: true,
    source: true,
    stage: true,
    project: true,
  } as const;

  async findAll(): Promise<Lead[]> {
    const rows = await prisma.lead.findMany({
      where: { deletedAt: null },
      include: PrismaLeadRepository.INCLUDE,
      orderBy: { createdAt: "desc" },
    });
    return Promise.all(rows.map((row) => this.toDomain(row)));
  }

  async findById(id: string): Promise<Lead | null> {
    const row = await prisma.lead.findFirst({
      where: { id, deletedAt: null },
      include: PrismaLeadRepository.INCLUDE,
    });
    return row ? this.toDomain(row) : null;
  }

  async count(): Promise<number> {
    return prisma.lead.count({ where: { deletedAt: null } });
  }

  /**
   * Captures a lead.
   *
   * Wrapped in a transaction because it writes three things — the contact, the
   * lead, and the activity that opens its timeline. A half-written lead (a
   * contact with no enquiry attached) would be invisible to the sales queue
   * while still occupying the phone number's unique slot.
   */
  async create(input: CreateLeadInput): Promise<Lead> {
    const phoneNormalized = normalizePhone(input.phone);
    const { firstName, lastName } = splitName(input.name);

    /* Reference data and the running number are read *before* the transaction
       opens. They are stable rows that need no transactional consistency, and
       every statement inside an interactive transaction holds it open for
       another network round trip. */
    const [source, stage, project, reference] = await Promise.all([
      prisma.leadSource.findUnique({ where: { slug: input.source } }),
      prisma.leadStage.findFirst({
        where: { slug: "new", pipeline: { isDefault: true } },
      }),
      input.interest
        ? prisma.project.findFirst({
            where: { name: input.interest, deletedAt: null },
            select: { id: true },
          })
        : Promise.resolve(null),
      nextReference("LEAD"),
    ]);

    if (!source) throw new Error(`Unknown lead source "${input.source}".`);
    if (!stage) throw new Error("No default pipeline configured.");

    const row = await prisma.$transaction(async (tx) => {
      const contact = await tx.contact.upsert({
        where: { phoneNormalized },
        update: {
          fullName: input.name,
          ...(input.email ? { email: input.email } : {}),
        },
        create: {
          phoneNormalized,
          phoneRaw: input.phone,
          fullName: input.name,
          firstName,
          lastName,
          email: input.email ?? null,
        },
      });

      const lead = await tx.lead.create({
        data: {
          reference,
          contactId: contact.id,
          sourceId: source.id,
          stageId: stage.id,
          projectId: project?.id ?? null,
          message: input.message ?? null,
          lastActivityAt: new Date(),
        },
        include: PrismaLeadRepository.INCLUDE,
      });

      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          type: "SYSTEM",
          subject: "Lead captured",
          body: `Captured from ${source.name}.`,
        },
      });

      return lead;
    }, TRANSACTION_OPTIONS);

    return this.toDomain(row);
  }

  async update(id: string, input: Partial<CreateLeadInput>): Promise<Lead | null> {
    const existing = await prisma.lead.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, contactId: true },
    });
    if (!existing) return null;

    const row = await prisma.$transaction(async (tx) => {
      if (input.name || input.phone || input.email) {
        await tx.contact.update({
          where: { id: existing.contactId },
          data: {
            ...(input.name ? { fullName: input.name } : {}),
            ...(input.phone
              ? { phoneRaw: input.phone, phoneNormalized: normalizePhone(input.phone) }
              : {}),
            ...(input.email ? { email: input.email } : {}),
          },
        });
      }

      return tx.lead.update({
        where: { id },
        data: {
          ...(input.message !== undefined ? { message: input.message } : {}),
          lastActivityAt: new Date(),
        },
        include: PrismaLeadRepository.INCLUDE,
      });
    }, TRANSACTION_OPTIONS);

    return this.toDomain(row);
  }

  /** Soft delete — a lead is a business record, and someone always wants it back. */
  async delete(id: string): Promise<boolean> {
    const result = await prisma.lead.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return result.count > 0;
  }
}

export class PrismaCallbackRepository
  implements CrudRepository<CallbackRequest, CreateCallbackInput>
{
  private toDomain(row: {
    id: string;
    createdAt: Date;
    status: string;
    name: string;
    phone: string;
    preferredTimeLabel: string;
    message: string | null;
    unansweredQuestion: string | null;
  }): CallbackRequest {
    return {
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      status: row.status as LeadStatus,
      name: row.name,
      phone: row.phone,
      preferredTime: row.preferredTimeLabel,
      ...(row.message ? { message: row.message } : {}),
      ...(row.unansweredQuestion
        ? { unansweredQuestion: row.unansweredQuestion }
        : {}),
    };
  }

  async findAll(): Promise<CallbackRequest[]> {
    const rows = await prisma.callbackRequest.findMany({
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findById(id: string): Promise<CallbackRequest | null> {
    const row = await prisma.callbackRequest.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async count(): Promise<number> {
    return prisma.callbackRequest.count();
  }

  async create(input: CreateCallbackInput): Promise<CallbackRequest> {
    const phoneNormalized = normalizePhone(input.phone);
    const { firstName, lastName } = splitName(input.name);

    const row = await prisma.$transaction(async (tx) => {
      // A callback is also a person we now know — the same person who fills in
      // the contact form later must not become a second contact.
      const contact = phoneNormalized
        ? await tx.contact.upsert({
            where: { phoneNormalized },
            update: { fullName: input.name },
            create: {
              phoneNormalized,
              phoneRaw: input.phone,
              fullName: input.name,
              firstName,
              lastName,
            },
          })
        : null;

      return tx.callbackRequest.create({
        data: {
          contactId: contact?.id ?? null,
          name: input.name,
          phone: input.phone,
          preferredTimeLabel: input.preferredTime,
          message: input.message ?? null,
          unansweredQuestion: input.unansweredQuestion ?? null,
          status: "new",
        },
      });
    }, TRANSACTION_OPTIONS);

    return this.toDomain(row);
  }

  async update(
    id: string,
    input: Partial<CreateCallbackInput>,
  ): Promise<CallbackRequest | null> {
    const existing = await prisma.callbackRequest.findUnique({ where: { id } });
    if (!existing) return null;

    const row = await prisma.callbackRequest.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.phone ? { phone: input.phone } : {}),
        ...(input.preferredTime ? { preferredTimeLabel: input.preferredTime } : {}),
        ...(input.message !== undefined ? { message: input.message } : {}),
      },
    });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<boolean> {
    const result = await prisma.callbackRequest.deleteMany({ where: { id } });
    return result.count > 0;
  }
}
