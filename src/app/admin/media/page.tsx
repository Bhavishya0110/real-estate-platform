import type { Metadata } from "next";
import { PlaceholderModule } from "@/features/admin/components/placeholder-module";

export const metadata: Metadata = { title: "Media Library" };

export default function AdminMediaPage() {
  return (
    <PlaceholderModule
      title="Media Library"
      description="Central storage for project photography, drone footage, floor plans and brochures."
      planned={[
        "Upload and organise images, video and PDFs by project.",
        "Automatic responsive derivatives and modern formats.",
        "Alt text on every asset, enforced before publishing.",
        "Object storage (S3 or Cloudinary) behind a repository interface.",
        "Replace the branded placeholder artwork as real photography lands.",
      ]}
    />
  );
}
