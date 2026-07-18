import { PageSkeleton } from "@/components/common/skeleton";

/**
 * Route-level loading UI. Because it mirrors the real page's layout, the
 * content that replaces it lands in the same place — no cumulative layout shift.
 */
export default function Loading() {
  return <PageSkeleton />;
}
