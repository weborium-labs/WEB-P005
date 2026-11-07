/**
 * Typed contracts for the page-level CMS documents.
 *
 * Mirrors `backend/src/models/page.model.ts` — keep the two in sync.
 * These are intentionally structural (no classes) so the public site can
 * validate a payload coming over the wire before rendering it.
 */

export const SECTION_TYPES = [
  "hero",
  "about",
  "interests",
  "list",
  "milestones",
  "cta",
  "text",
  "cards",
  "footer",
  "chrome",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export interface SectionImage {
  url: string;
  public_id?: string;
  alt?: string;
}

export interface SectionButton {
  label: string;
  href: string;
}

export interface SectionStat {
  value: string;
  label: string;
}

export interface SectionItem {
  label?: string;
  title?: string;
  description?: string;
  subtitle?: string;
  href?: string;
  external?: boolean;
  icon?: string;
  image?: SectionImage;
  children?: SectionItem[];
}

export interface Section {
  key: string;
  type: SectionType;
  heading?: string;
  headline?: string[];
  subtitle?: string;
  description?: string;
  body?: string;
  image?: SectionImage;
  primaryButton?: SectionButton;
  secondaryButton?: SectionButton;
  cta?: SectionButton;
  stats?: SectionStat[];
  items?: SectionItem[];
  visible?: boolean;
  order?: number;
}

export interface PageSeo {
  title?: string;
  description?: string;
  keywords?: string[];
}

export interface PageDocument {
  _id: string;
  slug: string;
  title: string;
  status: "draft" | "published";
  content: { sections: Section[] };
  seo?: PageSeo;
  version?: number;
}
