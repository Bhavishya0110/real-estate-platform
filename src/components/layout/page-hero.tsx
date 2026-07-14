import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/container";

/**
 * The banner that opens every non-home page.
 *
 * One component means the navy-and-gold masthead, the breadcrumb and the type
 * scale can never drift apart across fourteen routes.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  breadcrumb,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  /** Trail after Home. The last entry renders as the current page. */
  breadcrumb: { label: string; href?: string }[];
}) {
  return (
    <section className="relative isolate overflow-hidden bg-navy-900 pt-32 pb-16 sm:pt-36 sm:pb-20 lg:pt-44 lg:pb-24">
      {/* Same architectural grid + gold aura as the homepage hero, so the
          brand reads as one system rather than a set of templates. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(#C9A84C 1px, transparent 1px), linear-gradient(90deg, #C9A84C 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute -top-24 -right-32 -z-10 size-[28rem] rounded-full bg-gold-500/10 blur-[120px]"
      />

      <Container>
        {/* --- Breadcrumb (SEO + orientation) ---------------------------- */}
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-navy-300">
            <li>
              <Link href="/" className="transition-colors hover:text-gold-500">
                Home
              </Link>
            </li>

            {breadcrumb.map((crumb, index) => {
              const last = index === breadcrumb.length - 1;

              return (
                <li key={crumb.label} className="flex items-center gap-2">
                  <ChevronRight
                    className="size-3 text-navy-500"
                    aria-hidden="true"
                  />
                  {last || !crumb.href ? (
                    <span aria-current="page" className="text-gold-500">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="transition-colors hover:text-gold-500"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="mt-8 max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="gold-rule shrink-0" aria-hidden="true" />
            <span className="eyebrow text-gold-500">{eyebrow}</span>
          </div>

          <h1 className="mt-5 text-[2.25rem] leading-[1.1] text-white sm:text-5xl lg:text-6xl">
            {title}
          </h1>

          {description ? (
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-navy-200 sm:text-lg">
              {description}
            </p>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
