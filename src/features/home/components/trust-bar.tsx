import { Container } from "@/components/ui/container";
import { getStats } from "@/lib/data/content";
import { Counter } from "./counter";

/**
 * BRD Home blueprint §03 — Trust Bar:
 * 6 animated counters — Years · Projects · Happy Families · RERA Certified ·
 * Awards · ISO.
 */
export async function TrustBar() {
  const stats = await getStats();

  return (
    <section
      aria-label="Company credentials"
      className="border-y border-border bg-navy-50"
    >
      <Container>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-8 py-10 sm:gap-x-6 sm:gap-y-10 sm:py-12 md:grid-cols-3 lg:grid-cols-6 lg:py-14">
          {stats.map((stat) => (
            <div key={stat.id} className="text-center">
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <p className="font-display text-3xl text-navy-900 sm:text-4xl lg:text-[2.75rem]">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-1.5 text-[11px] leading-snug font-medium tracking-wide text-muted-foreground sm:mt-2 sm:text-xs">
                  {stat.label}
                </p>
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
