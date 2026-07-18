import { createId, readCollection, withCollection } from "./json-store";
import type {
  CallbackRequest,
  CreateCallbackInput,
  CreateLeadInput,
  CrudRepository,
  Lead,
} from "./types";

/**
 * JSON-backed implementations of the lead and callback contracts.
 *
 * SERVER ONLY. The Prisma versions will be new classes implementing the same
 * interfaces — every consumer keeps working untouched.
 */

const LEADS_FILE = "leads.json";
const CALLBACKS_FILE = "callbacks.json";

export class JsonLeadRepository
  implements CrudRepository<Lead, CreateLeadInput>
{
  async findAll(): Promise<Lead[]> {
    const rows = await readCollection<Lead>(LEADS_FILE);
    // Newest first — the order an advisor wants to work the queue in.
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async findById(id: string): Promise<Lead | null> {
    const rows = await readCollection<Lead>(LEADS_FILE);
    return rows.find((row) => row.id === id) ?? null;
  }

  async count(): Promise<number> {
    return (await readCollection<Lead>(LEADS_FILE)).length;
  }

  async create(input: CreateLeadInput): Promise<Lead> {
    const lead: Lead = {
      ...input,
      id: createId("lead"),
      createdAt: new Date().toISOString(),
      status: "new",
    };

    return withCollection<Lead, Lead>(LEADS_FILE, (rows) => ({
      rows: [...rows, lead],
      result: lead,
    }));
  }

  async update(id: string, input: Partial<CreateLeadInput>): Promise<Lead | null> {
    return withCollection<Lead, Lead | null>(LEADS_FILE, (rows) => {
      const index = rows.findIndex((row) => row.id === id);
      if (index === -1) return { rows, result: null };

      const updated = { ...rows[index], ...input };
      const next = [...rows];
      next[index] = updated;
      return { rows: next, result: updated };
    });
  }

  async delete(id: string): Promise<boolean> {
    return withCollection<Lead, boolean>(LEADS_FILE, (rows) => {
      const next = rows.filter((row) => row.id !== id);
      return { rows: next, result: next.length !== rows.length };
    });
  }
}

export class JsonCallbackRepository
  implements CrudRepository<CallbackRequest, CreateCallbackInput>
{
  async findAll(): Promise<CallbackRequest[]> {
    const rows = await readCollection<CallbackRequest>(CALLBACKS_FILE);
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async findById(id: string): Promise<CallbackRequest | null> {
    const rows = await readCollection<CallbackRequest>(CALLBACKS_FILE);
    return rows.find((row) => row.id === id) ?? null;
  }

  async count(): Promise<number> {
    return (await readCollection<CallbackRequest>(CALLBACKS_FILE)).length;
  }

  async create(input: CreateCallbackInput): Promise<CallbackRequest> {
    const request: CallbackRequest = {
      ...input,
      id: createId("cb"),
      createdAt: new Date().toISOString(),
      status: "new",
    };

    return withCollection<CallbackRequest, CallbackRequest>(
      CALLBACKS_FILE,
      (rows) => ({ rows: [...rows, request], result: request }),
    );
  }

  async update(
    id: string,
    input: Partial<CreateCallbackInput>,
  ): Promise<CallbackRequest | null> {
    return withCollection<CallbackRequest, CallbackRequest | null>(
      CALLBACKS_FILE,
      (rows) => {
        const index = rows.findIndex((row) => row.id === id);
        if (index === -1) return { rows, result: null };

        const updated = { ...rows[index], ...input };
        const next = [...rows];
        next[index] = updated;
        return { rows: next, result: updated };
      },
    );
  }

  async delete(id: string): Promise<boolean> {
    return withCollection<CallbackRequest, boolean>(CALLBACKS_FILE, (rows) => {
      const next = rows.filter((row) => row.id !== id);
      return { rows: next, result: next.length !== rows.length };
    });
  }
}
