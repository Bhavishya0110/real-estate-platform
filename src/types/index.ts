/**
 * Domain types for the JMS Group platform.
 *
 * These types are the single contract between the UI and the data layer.
 * Today they are satisfied by local JSON (see `src/lib/data`).
 * Tomorrow they will be satisfied by Prisma models — the UI must not change.
 */

export type ProjectCategory =
  | "Residential"
  | "Commercial"
  | "Plots"
  | "Senior Living"
  | "Luxury";

export type ProjectStatus =
  | "Ongoing"
  | "Ready to Move"
  | "Pre-Launch"
  | "Available"
  | "Upcoming";

export interface Project {
  /** Stable identifier — becomes the Prisma primary key. */
  id: string;
  /** SEO-friendly URL segment — BRD §7 requires friendly URLs. */
  slug: string;
  name: string;
  category: ProjectCategory;
  status: ProjectStatus;
  /** Marketing tagline / USP straight from the BRD portfolio table. */
  tagline: string;
  description: string;
  location: string;
  city: string;
  /** Display-ready price band, e.g. "₹ 1.45 Cr onwards". */
  priceLabel: string;
  /** Numeric floor price in INR — used for sorting and budget filters. */
  priceFrom: number;
  configurations: string[];
  areaRange: string;
  possession: string;
  reraId: string;
  amenities: string[];
  /** Feature flags from the BRD "Key Features" column. */
  highlights: string[];
  hasVirtualTour: boolean;
  hasBrochure: boolean;
  featured: boolean;
  /** Optional photography. Absent today — a branded placeholder renders instead. */
  image?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  projectName: string;
  rating: number;
  quote: string;
  /** Video testimonials are required by BRD §5 Testimonials. */
  type: "text" | "video";
  avatarInitials: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  publishedAt: string;
  readTimeMinutes: number;
}

export interface Job {
  id: string;
  slug: string;
  title: string;
  department: string;
  type: "Full-time" | "Part-time" | "Contract";
  location: string;
  experience: string;
}

export interface Stat {
  id: string;
  value: number;
  suffix: string;
  label: string;
}

export interface ValuePillar {
  id: string;
  title: string;
  description: string;
  /** Name of a lucide-react icon, resolved by the UI. */
  icon: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface SiteConfig {
  name: string;
  legalName: string;
  tagline: string;
  positioning: string;
  description: string;
  vision: string;
  mission: string;
  foundedYear: number;
  phone: string;
  landline: string;
  whatsapp: string;
  email: string;
  address: string;
  /** Empty until the business supplies it — the UI hides the row when blank. */
  reraNumber: string;
  social: { label: string; href: string }[];
}
