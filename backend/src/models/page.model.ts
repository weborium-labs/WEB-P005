import { Document, model, Schema, Types } from "mongoose";

/**
 * Page-level CMS document.
 *
 * A `Page` is the unit of document-level editing: one stable `_id` + one stable
 * `slug` identify a manageable page (or a global content block such as the
 * footer). Content is stored as an ordered list of typed sections so related
 * page content lives in a single document while independent entities
 * (publications, glimpses, navigation) stay in their own collections.
 */

export const SECTION_TYPES = [
  /** Hero banner: headline lines, description, image, CTAs, socials */
  "hero",
  /** About block: heading, bio, stats, CTA, "latest" list */
  "about",
  /** Research interest cards */
  "interests",
  /** Generic eyebrow/title/subtitle card list (selected research, patents) */
  "list",
  /** Journey timeline milestones */
  "milestones",
  /** Centered call-to-action block (contact) */
  "cta",
  /** Heading + prose block (page chrome for list pages) */
  "text",
  /** Title/description card grid (courses, editorial board) */
  "cards",
  /** Site footer: identity, link columns, bottom bar */
  "footer",
  /** Global chrome: brand avatar + header CTA */
  "chrome",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];
export type PageStatus = "draft" | "published";

/** An image reference. `public_id` lets the media library manage Cloudinary assets. */
export interface ISectionImage {
  url: string;
  public_id?: string;
  alt?: string;
}

export interface ISectionButton {
  label: string;
  href: string;
}

export interface ISectionStat {
  value: string;
  label: string;
}

/**
 * Repeatable content row. Field usage depends on the owning section type:
 *  - `list`        -> label / title / subtitle / href
 *  - `milestones`  -> label (year) / title (role) / subtitle (institution)
 *  - `cards`       -> title / description / href
 *  - `footer`      -> label (column title) + `children` (links)
 *  - `hero` socials -> label / href / icon
 *  - `interests`   -> title / description / icon
 */
export interface ISectionItem {
  label?: string;
  title?: string;
  description?: string;
  subtitle?: string;
  href?: string;
  external?: boolean;
  /** Icon key resolved by the frontend renderer (e.g. "scholar", "linkedin"). */
  icon?: string;
  image?: ISectionImage;
  children?: ISectionItem[];
}

export interface ISection {
  /** Stable identifier inside the document; used by the admin editor as a React key. */
  key: string;
  type: SectionType;
  heading?: string;
  /** `hero` only — each entry renders on its own line. */
  headline?: string[];
  subtitle?: string;
  description?: string;
  /** Long-form text (`text`, `footer` bottom bar). */
  body?: string;
  image?: ISectionImage;
  primaryButton?: ISectionButton;
  secondaryButton?: ISectionButton;
  cta?: ISectionButton;
  stats?: ISectionStat[];
  items?: ISectionItem[];
  /** Hidden sections stay stored but are not rendered publicly. */
  visible: boolean;
  order: number;
}

export interface IPageSeo {
  title?: string;
  description?: string;
  keywords?: string[];
}

export interface IPage extends Document {
  _id: Types.ObjectId;
  slug: string;
  title: string;
  status: PageStatus;
  content: { sections: ISection[] };
  seo: IPageSeo;
  /** Optimistic-concurrency token; incremented on every successful write. */
  version: number;
  user_id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SectionImageSchema = new Schema<ISectionImage>(
  {
    url: { type: String, required: true, trim: true },
    public_id: { type: String, trim: true },
    alt: { type: String, trim: true },
  },
  { _id: false },
);

const SectionButtonSchema = new Schema<ISectionButton>(
  {
    label: { type: String, required: true, trim: true },
    href: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const SectionStatSchema = new Schema<ISectionStat>(
  {
    value: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const sectionItemFields = {
  label: { type: String, trim: true },
  title: { type: String, trim: true },
  description: { type: String, trim: true },
  subtitle: { type: String, trim: true },
  href: { type: String, trim: true },
  external: { type: Boolean },
  icon: { type: String, trim: true },
  image: SectionImageSchema,
};

/**
 * Leaf rows (no nesting) are defined first so `children` can reference them
 * without a self-referential initializer — footer columns hold links, and
 * nothing deeper is ever stored.
 */
const SectionItemLeafSchema = new Schema<ISectionItem>(sectionItemFields, { _id: false });

const SectionItemSchema = new Schema<ISectionItem>(
  {
    ...sectionItemFields,
    children: { type: [SectionItemLeafSchema], default: undefined },
  },
  { _id: false },
);

const SectionSchema = new Schema<ISection>(
  {
    key: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: SECTION_TYPES },
    heading: { type: String, trim: true },
    headline: { type: [String], default: undefined },
    subtitle: { type: String, trim: true },
    description: { type: String, trim: true },
    body: { type: String, trim: true },
    image: SectionImageSchema,
    primaryButton: SectionButtonSchema,
    secondaryButton: SectionButtonSchema,
    cta: SectionButtonSchema,
    stats: { type: [SectionStatSchema], default: undefined },
    items: { type: [SectionItemSchema], default: undefined },
    visible: { type: Boolean, required: true, default: true },
    order: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

const PageSchema = new Schema<IPage>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    title: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      required: true,
      index: true,
    },
    content: {
      sections: { type: [SectionSchema], default: [] },
    },
    seo: {
      title: { type: String, trim: true },
      description: { type: String, trim: true },
      keywords: { type: [String], default: undefined },
    },
    version: { type: Number, required: true, default: 1 },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

// Compound index supporting the admin listing filter (`?status=`).
PageSchema.index({ status: 1, slug: 1 });

export const Page = model<IPage>("Page", PageSchema);
export default Page;
