import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  AdminBadge,
  AdminEmpty,
  AdminPageHeader,
  AdminTable,
  ReadOnlyNotice,
} from "@/features/admin/components/admin-ui";
import { getBlogPosts } from "@/lib/data/content";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Blogs" };

export default async function AdminBlogsPage() {
  const posts = await getBlogPosts();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Blogs"
        description="Articles published to the insights section."
      />

      <ReadOnlyNotice resource="published articles" />

      <AdminTable
        columns={["Title", "Category", "Author", "Published", "Read time", ""]}
        empty={
          posts.length === 0 ? (
            <AdminEmpty
              title="No articles yet"
              description="Published articles will appear here."
            />
          ) : undefined
        }
      >
        {posts.map((post) => (
          <tr key={post.id} className="hover:bg-white/[0.02]">
            <td className="px-4 py-3">
              <p className="max-w-md truncate font-medium text-white">
                {post.title}
              </p>
              <p className="text-xs text-navy-500">{post.slug}</p>
            </td>
            <td className="px-4 py-3">
              <AdminBadge tone="gold">{post.category}</AdminBadge>
            </td>
            <td className="px-4 py-3 text-navy-300">{post.author}</td>
            <td className="px-4 py-3 text-xs text-navy-400">
              {formatDate(post.publishedAt)}
            </td>
            <td className="px-4 py-3 text-navy-300">
              {post.readTimeMinutes} min
            </td>
            <td className="px-4 py-3 text-right">
              <Link
                href={`/blog/${post.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-xs text-gold-400 hover:underline"
              >
                View
                <ExternalLink className="size-3" aria-hidden="true" />
              </Link>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
