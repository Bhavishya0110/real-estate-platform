import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * A tiny append-and-read JSON collection store.
 *
 * SERVER ONLY. Imported exclusively from server components and server actions —
 * never from a `"use client"` module.
 *
 * This is deliberately the least clever thing that satisfies the repository
 * contract before PostgreSQL arrives:
 *   • Runtime data lives in `data-runtime/`, separate from the seeded content in
 *     `src/data/`, so captured leads never mix with editorial fixtures.
 *   • Writes are serialised through an in-process promise chain, which is enough
 *     for a single Node process and honest about not being enough for more.
 *
 * Known limitation, stated plainly: a read-only or ephemeral filesystem (most
 * serverless hosts) will not persist these writes between invocations. That is
 * acceptable precisely because this is the placeholder the database replaces.
 */

const ROOT = path.join(process.cwd(), "data-runtime");

/** Serialises writes per file so two concurrent creates cannot clobber. */
const writeQueues = new Map<string, Promise<unknown>>();

async function readCollection<T>(file: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(path.join(ROOT, file), "utf8");
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    // Missing file or unreadable content both mean "nothing stored yet".
    return [];
  }
}

async function writeCollection<T>(file: string, rows: T[]): Promise<void> {
  await fs.mkdir(ROOT, { recursive: true });
  await fs.writeFile(
    path.join(ROOT, file),
    JSON.stringify(rows, null, 2),
    "utf8",
  );
}

/**
 * Runs `mutate` against the current contents and persists the result, with
 * writes to the same file queued behind one another.
 */
export function withCollection<T, R>(
  file: string,
  mutate: (rows: T[]) => { rows: T[]; result: R },
): Promise<R> {
  const previous = writeQueues.get(file) ?? Promise.resolve();

  const next = previous
    .catch(() => undefined) // a failed earlier write must not poison the queue
    .then(async () => {
      const rows = await readCollection<T>(file);
      const { rows: updated, result } = mutate(rows);
      await writeCollection(file, updated);
      return result;
    });

  writeQueues.set(file, next);
  return next;
}

export { readCollection };

/** Sortable, collision-resistant enough for a placeholder store. */
export function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
