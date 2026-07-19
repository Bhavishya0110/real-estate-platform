import "server-only";

import { prisma } from "@/lib/db";
import { publicUrl } from "@/lib/storage";
import type { Project, ProjectCategory } from "@/types";
import type { ProjectReadRepository } from "../content.types";
import { PROJECT_INCLUDE, toProject } from "./mappers";

/**
 * PROJECTS, FROM POSTGRESQL
 *
 * SERVER ONLY.
 *
 * Notes on the query shapes, since they are the difference between this
 * scaling and not:
 *   • Every read is a single query with `include` — never a list followed by a
 *     lookup per row. Fourteen projects would forgive an N+1; five hundred
 *     would not, and the shape is set now.
 *   • Only published, non-deleted rows are visible, which is exactly what the
 *     `projects_live_idx` partial index covers.
 *   • Ordering is done in Postgres, not in JavaScript after the fact.
 */

const LIVE = { publishStatus: "PUBLISHED" as const, deletedAt: null };

/** Resolves the hero image URL, if the project has one attached. */
function heroUrl(row: {
  media: { media: { bucket: string; storagePath: string } }[];
}): string | null {
  const hero = row.media[0]?.media;
  if (!hero) return null;
  // Hero images live in a public bucket, so a permanent CDN URL is correct and
  // avoids signing a URL on every render.
  return publicUrl(hero.bucket, hero.storagePath);
}

export class PrismaProjectRepository implements ProjectReadRepository {
  async findAll(): Promise<Project[]> {
    const rows = await prisma.project.findMany({
      where: LIVE,
      include: PROJECT_INCLUDE,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return rows.map((row) => toProject(row, heroUrl(row)));
  }

  async findFeatured(limit = 6): Promise<Project[]> {
    // Featured first, then the rest, so the grid is never short of `limit` —
    // the same rule the JSON implementation applied, expressed as an ordering
    // rather than two passes and a concatenation.
    const rows = await prisma.project.findMany({
      where: LIVE,
      include: PROJECT_INCLUDE,
      orderBy: [
        { isFeatured: "desc" },
        { featuredRank: { sort: "asc", nulls: "last" } },
        { sortOrder: "asc" },
      ],
      take: limit,
    });
    return rows.map((row) => toProject(row, heroUrl(row)));
  }

  async findBySlug(slug: string): Promise<Project | null> {
    const row = await prisma.project.findFirst({
      where: { slug, ...LIVE },
      include: PROJECT_INCLUDE,
    });
    return row ? toProject(row, heroUrl(row)) : null;
  }

  async findResidential(): Promise<Project[]> {
    // The residential/commercial split lives in the category row, not in a
    // hardcoded array — adding a category no longer means editing code.
    const rows = await prisma.project.findMany({
      where: { ...LIVE, category: { isResidential: true } },
      include: PROJECT_INCLUDE,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return rows.map((row) => toProject(row, heroUrl(row)));
  }

  async findCommercial(): Promise<Project[]> {
    const rows = await prisma.project.findMany({
      where: { ...LIVE, category: { isCommercial: true } },
      include: PROJECT_INCLUDE,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return rows.map((row) => toProject(row, heroUrl(row)));
  }

  async findRelated(slug: string, limit = 3): Promise<Project[]> {
    const current = await prisma.project.findFirst({
      where: { slug, ...LIVE },
      select: { id: true, categoryId: true },
    });

    if (!current) {
      const fallback = await prisma.project.findMany({
        where: LIVE,
        include: PROJECT_INCLUDE,
        orderBy: { sortOrder: "asc" },
        take: limit,
      });
      return fallback.map((row) => toProject(row, heroUrl(row)));
    }

    // Same category first, then anything else, never the current project.
    const sameCategory = await prisma.project.findMany({
      where: { ...LIVE, categoryId: current.categoryId, id: { not: current.id } },
      include: PROJECT_INCLUDE,
      orderBy: { sortOrder: "asc" },
      take: limit,
    });

    if (sameCategory.length >= limit) {
      return sameCategory.map((row) => toProject(row, heroUrl(row)));
    }

    const rest = await prisma.project.findMany({
      where: {
        ...LIVE,
        categoryId: { not: current.categoryId },
        id: { not: current.id },
      },
      include: PROJECT_INCLUDE,
      orderBy: { sortOrder: "asc" },
      take: limit - sameCategory.length,
    });

    return [...sameCategory, ...rest].map((row) => toProject(row, heroUrl(row)));
  }

  async categories(): Promise<ProjectCategory[]> {
    // Distinct categories that actually have a live project behind them, so a
    // filter tab never leads to an empty result.
    const rows = await prisma.projectCategory.findMany({
      where: { isActive: true, projects: { some: LIVE } },
      orderBy: { sortOrder: "asc" },
      select: { name: true },
    });
    return rows.map((row) => row.name as ProjectCategory);
  }

  async count(): Promise<number> {
    return prisma.project.count({ where: LIVE });
  }
}
