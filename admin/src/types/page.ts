/**
 * Shared contracts for the page-level CMS.
 *
 * These mirror `backend/src/models/page.model.ts` and
 * `backend/src/schemas/page.schema.ts`; keep the two in sync.
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
export type PageStatus = "draft" | "published";

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
  /** Stable identifier inside the document — used as the React key. */
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
  visible: boolean;
  order: number;
}

export interface PageSeo {
  title?: string;
  description?: string;
  keywords?: string[];
}

export interface Page {
  _id: string;
  slug: string;
  title: string;
  status: PageStatus;
  content: { sections: Section[] };
  seo: PageSeo;
  /** Optimistic-concurrency token; echoed back as `expectedVersion` on save. */
  version: number;
  createdAt: string;
  updatedAt: string;
}

/** Body accepted by POST /pages. */
export interface CreatePagePayload {
  slug: string;
  title: string;
  status: PageStatus;
  content: { sections: Section[] };
  seo: PageSeo;
}

/** Body accepted by PUT /pages/:id — whole-document replacement. */
export interface ReplacePagePayload extends CreatePagePayload {
  expectedVersion?: number;
}

export interface OverviewStats {
  pages: { total: number; published: number; draft: number };
  publications: number;
  glimpses: number;
  navigation: { navbars: number; subnavbars: number };
  media: number;
  themes: { total: number; active: number };
  recentlyUpdated: Array<{
    _id: string;
    slug: string;
    title: string;
    status: PageStatus;
    version: number;
    updatedAt: string;
  }>;
}

export interface MediaItem {
  _id: string;
  url: string;
  public_id: string;
  alt: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  folder: string;
  createdAt: string;
}

export interface MediaListResponse {
  total: number;
  items: MediaItem[];
  page: number;
  limit: number;
  pages: number;
}
