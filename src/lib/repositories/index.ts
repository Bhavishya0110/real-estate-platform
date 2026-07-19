import { isDatabaseConfigured } from "@/lib/db";
import {
  JsonContentRepository,
  JsonProjectRepository,
  JsonSiteConfigRepository,
} from "./json/content.repository";
import {
  JsonCallbackRepository,
  JsonLeadRepository,
} from "./leads.repository";
import { EnvUserRepository } from "./users.repository";
import {
  PrismaContentRepository,
  PrismaSiteConfigRepository,
} from "./prisma/content.repository";
import {
  PrismaCallbackRepository,
  PrismaLeadRepository,
} from "./prisma/leads.repository";
import { PrismaProjectRepository } from "./prisma/projects.repository";
import { PrismaUserRepository } from "./prisma/users.repository";
import type {
  ContentReadRepository,
  ProjectReadRepository,
  SiteConfigRepository,
} from "./content.types";
import type {
  CallbackRequest,
  CreateCallbackInput,
  CrudRepository,
  Lead,
  NotificationService,
  UserRepository,
} from "./types";
import type { CreateLeadInput } from "./types";

/**
 * COMPOSITION ROOT
 *
 * The single place that decides which implementation backs each contract.
 *
 * PostgreSQL when it is configured, the JSON fixtures when it is not. That
 * fallback is not indecision — it is what lets the repository be swapped
 * without the site going dark: a clone with no credentials still builds and
 * runs, and a misconfigured deployment degrades to static content instead of
 * throwing a connection error on every render.
 *
 * Nothing that consumes these knows or cares which one it got.
 *
 * SERVER ONLY — these reach the database and the filesystem.
 */

const useDatabase = isDatabaseConfigured();

/* ------------------------------------------------------------- catalogue -- */

export const projectRepository: ProjectReadRepository = useDatabase
  ? new PrismaProjectRepository()
  : new JsonProjectRepository();

export const contentRepository: ContentReadRepository = useDatabase
  ? new PrismaContentRepository()
  : new JsonContentRepository();

export const siteConfigRepository: SiteConfigRepository = useDatabase
  ? new PrismaSiteConfigRepository()
  : new JsonSiteConfigRepository();

/* ------------------------------------------------------------------ leads -- */

export const leadRepository: CrudRepository<Lead, CreateLeadInput> = useDatabase
  ? new PrismaLeadRepository()
  : new JsonLeadRepository();

export const callbackRepository: CrudRepository<
  CallbackRequest,
  CreateCallbackInput
> = useDatabase ? new PrismaCallbackRepository() : new JsonCallbackRepository();

/* ----------------------------------------------------------------- users -- */

/**
 * Operator accounts.
 *
 * PostgreSQL-backed when configured; the environment-configured implementation
 * otherwise. Both satisfy `UserRepository`, and both verify the same PBKDF2
 * hash format — so migrating an operator into the database does not reset
 * their password or invalidate their session.
 */
export const userRepository: UserRepository = useDatabase
  ? new PrismaUserRepository()
  : new EnvUserRepository();

/* --------------------------------------------------------- notifications -- */

/**
 * A notification service that records intent without sending anything.
 *
 * Still the honest implementation: no transport is configured, so rather than
 * pretending to notify, this logs what *would* be sent. The `notifications`,
 * `notification_deliveries` and `notification_preferences` tables now exist to
 * receive it — wiring a real transport is one class and one line here.
 */
class LoggingNotificationService implements NotificationService {
  async notifyLead(lead: Lead): Promise<void> {
    console.info(
      `[notification] New ${lead.source} lead: ${lead.name} (${lead.phone})`,
    );
  }

  async notifyCallback(request: CallbackRequest): Promise<void> {
    console.info(
      `[notification] Callback requested by ${request.name} (${request.phone}) for ${request.preferredTime}`,
    );
  }
}

export const notificationService: NotificationService =
  new LoggingNotificationService();

/** Which backing store is live — surfaced on the admin dashboard. */
export const dataSource: "postgresql" | "json" = useDatabase ? "postgresql" : "json";

export * from "./types";
export type * from "./content.types";
