/**
 * REPOSITORY CONTRACTS
 *
 * The formal seam between the application and its storage. Every repository in
 * the app implements one of these interfaces, and nothing outside
 * `src/lib/repositories` and `src/lib/data` may touch a data source directly.
 *
 * Migrating to PostgreSQL + Prisma means writing new classes that satisfy these
 * same interfaces and swapping them in `src/lib/repositories/index.ts`. No page,
 * component or service changes.
 *
 * Everything is async already, precisely so that swap is invisible.
 */

/** Read-only access to a collection. */
export interface ReadRepository<T, Id = string> {
  findAll(): Promise<T[]>;
  findById(id: Id): Promise<T | null>;
  count(): Promise<number>;
}

/** Write access. Split from reads so read-only sources stay honest about it. */
export interface WriteRepository<T, CreateInput, Id = string> {
  create(input: CreateInput): Promise<T>;
  update(id: Id, input: Partial<CreateInput>): Promise<T | null>;
  delete(id: Id): Promise<boolean>;
}

/** The common case: a collection that can be both read and written. */
export interface CrudRepository<T, CreateInput, Id = string>
  extends ReadRepository<T, Id>,
    WriteRepository<T, CreateInput, Id> {}

/* ------------------------------------------------------------------ leads */

export type LeadSource =
  | "contact-form"
  | "chatbot-callback"
  | "project-enquiry"
  | "newsletter";

export type LeadStatus = "new" | "contacted" | "qualified" | "closed";

/** An enquiry captured anywhere on the site. */
export interface Lead {
  id: string;
  createdAt: string;
  source: LeadSource;
  status: LeadStatus;
  name: string;
  phone: string;
  email?: string;
  /** The project the visitor was looking at, when known. */
  interest?: string;
  message?: string;
}

export type CreateLeadInput = Omit<Lead, "id" | "createdAt" | "status">;

/* -------------------------------------------------------- callback requests */

export interface CallbackRequest {
  id: string;
  createdAt: string;
  status: LeadStatus;
  name: string;
  phone: string;
  /** Free-text window the visitor asked for, e.g. "Tomorrow morning". */
  preferredTime: string;
  message?: string;
  /** What the assistant could not answer, so the advisor has context. */
  unansweredQuestion?: string;
}

export type CreateCallbackInput = Omit<
  CallbackRequest,
  "id" | "createdAt" | "status"
>;

/* ------------------------------------------------------------ notifications */

/**
 * Where a captured lead should be announced.
 *
 * Implementations are deliberately absent for now — the brief rules out email
 * and messaging providers at this stage. The interface exists so that adding
 * one later is a new class plus one line in the composition root, rather than a
 * change threaded through the form and the chatbot.
 */
export interface NotificationService {
  /** Announce a new lead. Must never throw into the caller's happy path. */
  notifyLead(lead: Lead): Promise<void>;
  notifyCallback(request: CallbackRequest): Promise<void>;
}
