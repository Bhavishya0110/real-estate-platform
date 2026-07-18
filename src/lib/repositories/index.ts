import {
  JsonCallbackRepository,
  JsonLeadRepository,
} from "./leads.repository";
import { EnvUserRepository } from "./users.repository";
import type {
  CallbackRequest,
  Lead,
  NotificationService,
  UserRepository,
} from "./types";

/**
 * COMPOSITION ROOT
 *
 * The single place that decides which implementation backs each contract.
 * Swapping JSON for PostgreSQL is a change to these three lines:
 *
 *   export const leadRepository = new PrismaLeadRepository(prisma);
 *   export const callbackRepository = new PrismaCallbackRepository(prisma);
 *   export const notificationService = new EmailNotificationService(mailer);
 *
 * Nothing that consumes them needs to know.
 *
 * SERVER ONLY — these reach the filesystem.
 */

export const leadRepository = new JsonLeadRepository();
export const callbackRepository = new JsonCallbackRepository();

/**
 * Operator accounts.
 *
 * Environment-configured today; `new PrismaUserRepository(prisma)` tomorrow,
 * with no change to the login action or the admin layout.
 */
export const userRepository: UserRepository = new EnvUserRepository();

/**
 * A notification service that records intent without sending anything.
 *
 * The brief rules out email and messaging providers for now, so rather than
 * pretending to notify, this logs what *would* be sent. Swapping in a real
 * transport later is one line above — no caller changes.
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

export * from "./types";
