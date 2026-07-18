import type { Metadata } from "next";
import {
  AdminBadge,
  AdminEmpty,
  AdminPageHeader,
  AdminTable,
  ReadOnlyNotice,
} from "@/features/admin/components/admin-ui";
import { getTestimonials } from "@/lib/data/content";

export const metadata: Metadata = { title: "Testimonials" };

export default async function AdminTestimonialsPage() {
  const testimonials = await getTestimonials();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Testimonials"
        description="Verified reviews shown on the homepage and the testimonials page."
      />

      <ReadOnlyNotice resource="customer reviews" />

      <AdminTable
        columns={["Customer", "Project", "Rating", "Type", "Quote"]}
        empty={
          testimonials.length === 0 ? (
            <AdminEmpty
              title="No testimonials yet"
              description="Published reviews will appear here."
            />
          ) : undefined
        }
      >
        {testimonials.map((testimonial) => (
          <tr key={testimonial.id} className="hover:bg-white/[0.02]">
            <td className="px-4 py-3">
              <p className="font-medium text-white">{testimonial.name}</p>
              <p className="text-xs text-navy-500">{testimonial.role}</p>
            </td>
            <td className="px-4 py-3 text-navy-300">
              {testimonial.projectName}
            </td>
            <td className="px-4 py-3 text-navy-300 tabular-nums">
              {testimonial.rating} / 5
            </td>
            <td className="px-4 py-3">
              <AdminBadge tone={testimonial.type === "video" ? "gold" : "neutral"}>
                {testimonial.type}
              </AdminBadge>
            </td>
            <td className="px-4 py-3">
              <p className="max-w-md truncate text-xs text-navy-400">
                {testimonial.quote}
              </p>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
