#!/usr/bin/env node
/**
 * Exercises the lead-capture write path against the real database.
 *
 * Mirrors `PrismaLeadRepository.create` exactly — same transaction, same
 * contact upsert on normalised phone — because the interesting claim is not
 * "a row was inserted" but "the same person enquiring twice becomes one contact
 * with two leads". That is the whole point of introducing `contacts`, and it is
 * only true if the dedup key behaves.
 *
 * Cleans up after itself, so it is safe to run against a live database.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const problems = [];
const line = () => console.log("-".repeat(60));

// A number no real visitor will hold, so a failed cleanup cannot collide with
// genuine data.
const TEST_PHONE_RAW = "+91 90000 00001";
const TEST_PHONE_E164 = "+919000000001";

function normalizePhone(raw) {
  const text = String(raw ?? "").trim();
  const hasPlus = text.startsWith("+");
  const digits = text.replace(/\D/g, "");
  if (!digits) return "";
  if (hasPlus) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}

async function captureLead({ name, phone, email, message, sourceSlug, interest }) {
  const phoneNormalized = normalizePhone(phone);

  // Reference lookups happen outside the transaction, exactly as the repository
  // does — holding a transaction open across them is what produced P2028.
  const [source, stage, project, count] = await Promise.all([
    prisma.leadSource.findUnique({ where: { slug: sourceSlug } }),
    prisma.leadStage.findFirst({ where: { slug: "new", pipeline: { isDefault: true } } }),
    interest
      ? prisma.project.findFirst({
          where: { name: interest, deletedAt: null },
          select: { id: true },
        })
      : Promise.resolve(null),
    prisma.lead.count(),
  ]);
  if (!source) throw new Error(`Unknown lead source "${sourceSlug}"`);
  if (!stage) throw new Error("No default pipeline configured");

  return prisma.$transaction(async (tx) => {
    const contact = await tx.contact.upsert({
      where: { phoneNormalized },
      update: { fullName: name, ...(email ? { email } : {}) },
      create: {
        phoneNormalized,
        phoneRaw: phone,
        fullName: name,
        email: email ?? null,
      },
    });

    const lead = await tx.lead.create({
      data: {
        reference: `TEST-${Date.now()}-${count}`,
        contactId: contact.id,
        sourceId: source.id,
        stageId: stage.id,
        projectId: project?.id ?? null,
        message: message ?? null,
        lastActivityAt: new Date(),
      },
      include: { contact: true, source: true, stage: true, project: true },
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
  }, { maxWait: 15_000, timeout: 30_000 });
}

async function main() {
  line();
  console.log("WRITE PATH VERIFICATION");
  line();

  // Start clean in case a previous run was interrupted.
  await prisma.contact.deleteMany({ where: { phoneNormalized: TEST_PHONE_E164 } });

  const before = await prisma.lead.count();

  // 1 — capture from the contact form
  const first = await captureLead({
    name: "Verification Buyer",
    phone: TEST_PHONE_RAW,
    email: "verify@example.com",
    message: "Interested in a 3 BHK.",
    sourceSlug: "contact-form",
    interest: "The Pearl",
  });
  console.log(`lead 1 captured   ref=${first.reference} contact=${first.contact.id.slice(0, 8)}…`);
  console.log(`  project matched  ${first.project?.name ?? "(none)"}`);
  if (!first.project) problems.push("project interest did not resolve to a relation");

  // 2 — the SAME person, via the chatbot, phone written differently
  const second = await captureLead({
    name: "Verification Buyer",
    phone: "9000000001", // bare 10 digits — must normalise to the same contact
    sourceSlug: "chatbot-callback",
  });
  console.log(`lead 2 captured   ref=${second.reference} contact=${second.contact.id.slice(0, 8)}…`);

  if (first.contact.id !== second.contact.id) {
    problems.push(
      "the same phone in two formats produced two contacts — dedup is broken",
    );
  } else {
    console.log("  DEDUP OK         both leads share one contact");
  }

  const contactLeads = await prisma.lead.count({
    where: { contactId: first.contact.id },
  });
  console.log(`  leads on contact ${contactLeads}`);
  if (contactLeads !== 2) problems.push(`expected 2 leads on the contact, got ${contactLeads}`);

  const activities = await prisma.leadActivity.count({
    where: { leadId: { in: [first.id, second.id] } },
  });
  console.log(`  timeline entries ${activities}`);
  if (activities !== 2) problems.push("lead activities were not written");

  // 3 — callback capture reuses the same contact
  const callback = await prisma.callbackRequest.create({
    data: {
      contactId: first.contact.id,
      name: "Verification Buyer",
      phone: TEST_PHONE_RAW,
      preferredTimeLabel: "Tomorrow morning",
      unansweredQuestion: "Do you have a 5 BHK?",
      status: "new",
    },
  });
  console.log(`callback captured ${callback.id.slice(0, 8)}… linked to same contact`);

  // 4 — soft delete keeps the row but hides it
  await prisma.lead.update({ where: { id: second.id }, data: { deletedAt: new Date() } });
  const visible = await prisma.lead.count({
    where: { contactId: first.contact.id, deletedAt: null },
  });
  console.log(`after soft delete visible leads = ${visible} (row retained)`);
  if (visible !== 1) problems.push("soft delete did not hide exactly one lead");

  // ---------------------------------------------------------------- cleanup
  await prisma.leadActivity.deleteMany({ where: { leadId: { in: [first.id, second.id] } } });
  await prisma.callbackRequest.deleteMany({ where: { contactId: first.contact.id } });
  await prisma.lead.deleteMany({ where: { contactId: first.contact.id } });
  await prisma.contact.deleteMany({ where: { phoneNormalized: TEST_PHONE_E164 } });

  const after = await prisma.lead.count();
  console.log(`cleanup complete  leads before=${before} after=${after}`);
  if (before !== after) problems.push("cleanup left rows behind");

  line();
  if (problems.length > 0) {
    console.log(`${problems.length} PROBLEM(S):`);
    problems.forEach((p) => console.log(`  ✗ ${p}`));
    process.exitCode = 1;
  } else {
    console.log("WRITE PATH VERIFIED");
  }
  line();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
