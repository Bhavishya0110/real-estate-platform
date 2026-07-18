import { Construction } from "lucide-react";
import { AdminCard, AdminPageHeader } from "./admin-ui";

/**
 * A module whose UI is scaffolded but whose editing surface arrives with the
 * database.
 *
 * States exactly what exists today and what is still to come, rather than
 * showing controls that do nothing — a dead "Save" button is worse than an
 * honest note.
 */
export function PlaceholderModule({
  title,
  description,
  reads,
  planned,
}: {
  title: string;
  description: string;
  /** What this screen can already read, if anything. */
  reads?: React.ReactNode;
  planned: string[];
}) {
  return (
    <div className="space-y-6">
      <AdminPageHeader title={title} description={description} />

      {reads}

      <AdminCard>
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-sm border border-gold-500/30 text-gold-400">
            <Construction className="size-5" aria-hidden="true" />
          </span>

          <div className="min-w-0">
            <h2 className="font-display text-lg text-white">
              Editing arrives with the database
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-navy-400">
              The repository interfaces and server actions this module needs
              already exist. What is missing is durable storage — which is exactly
              what the PostgreSQL migration provides.
            </p>

            <ul className="mt-5 space-y-2.5">
              {planned.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm text-navy-300"
                >
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold-500"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
