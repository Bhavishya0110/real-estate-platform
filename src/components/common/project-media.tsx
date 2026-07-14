import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";

/**
 * Project imagery.
 *
 * The BRD assumes photography will be supplied by the business (§8 Assumptions).
 * Until it is, we render a deterministic architectural motif in brand colours
 * rather than a grey box — so the page still reads as premium.
 *
 * The moment `project.image` is populated, this renders the real photo instead.
 * No caller has to change.
 */

/** Four navy washes, picked deterministically so a project always looks the same. */
const washes = [
  "from-navy-900 via-navy-800 to-navy-700",
  "from-navy-950 via-navy-900 to-navy-700",
  "from-navy-800 via-navy-700 to-navy-600",
  "from-navy-900 via-navy-700 to-navy-800",
];

function hashToIndex(value: string, buckets: number) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash % buckets;
}

export function ProjectMedia({
  project,
  className,
  priority = false,
}: {
  project: Project;
  className?: string;
  priority?: boolean;
}) {
  if (project.image) {
    return (
      <Image
        src={project.image}
        alt={`${project.name} — ${project.tagline}`}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
        className={cn("object-cover", className)}
      />
    );
  }

  const wash = washes[hashToIndex(project.slug, washes.length)];

  return (
    <div
      role="img"
      aria-label={`${project.name} — ${project.tagline}`}
      className={cn(
        "absolute inset-0 bg-gradient-to-br",
        wash,
        className,
      )}
    >
      {/* Architectural skyline motif — pure CSS/SVG, no network request. */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.14]"
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="jms-gold-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Tower blocks */}
        <g fill="url(#jms-gold-fade)">
          <rect x="28" y="150" width="46" height="150" />
          <rect x="86" y="104" width="34" height="196" />
          <rect x="132" y="168" width="52" height="132" />
          <rect x="196" y="82" width="40" height="218" />
          <rect x="248" y="140" width="30" height="160" />
          <rect x="290" y="112" width="48" height="188" />
          <rect x="350" y="176" width="30" height="124" />
        </g>

        {/* Window grid */}
        <g fill="#0D1B2A" opacity="0.5">
          {Array.from({ length: 7 }).map((_, col) =>
            Array.from({ length: 9 }).map((__, row) => (
              <rect
                key={`${col}-${row}`}
                x={36 + col * 52}
                y={120 + row * 20}
                width="7"
                height="9"
              />
            )),
          )}
        </g>
      </svg>

      {/* Gold horizon line + vignette for depth */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-500/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-transparent to-transparent" />
    </div>
  );
}
