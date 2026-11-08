import type { SectionType } from "../types/page";

/** Which optional field groups a section type actually renders. */
export interface SectionConfig {
  label: string;
  headline?: boolean;
  heading?: boolean;
  subtitle?: boolean;
  subtitleLabel?: string;
  description?: boolean;
  descriptionLabel?: string;
  body?: boolean;
  bodyLabel?: string;
  image?: boolean;
  buttons?: Array<"primaryButton" | "secondaryButton">;
  cta?: boolean;
  stats?: boolean;
  statsLabel?: string;
  items?: {
    addLabel: string;
    label?: string;
    title?: string;
    description?: string;
    subtitle?: string;
    href?: boolean;
    external?: boolean;
    icon?: boolean;
    children?: boolean;
  };
}

export const BUTTON_LABELS = {
  primaryButton: { group: "Primary button", label: "Label", href: "Link" },
  secondaryButton: { group: "Secondary button", label: "Label", href: "Link" },
} as const;

export const SECTION_CONFIG: Record<SectionType, SectionConfig> = {
  hero: {
    label: "Hero",
    headline: true,
    description: true,
    descriptionLabel: "Description",
    image: true,
    buttons: ["primaryButton", "secondaryButton"],
    items: { addLabel: "Add social link", label: "Label", href: true, icon: true },
  },
  about: {
    label: "About",
    heading: true,
    description: true,
    subtitle: true,
    subtitleLabel: "\"Latest\" card title",
    cta: true,
    stats: true,
    statsLabel: "Statistics",
    items: { addLabel: "Add latest item", title: "Item text" },
  },
  interests: {
    label: "Research interests",
    heading: true,
    items: { addLabel: "Add interest", title: "Title", description: "Description", icon: true },
  },
  list: {
    label: "Card list",
    heading: true,
    items: {
      addLabel: "Add item",
      label: "Eyebrow",
      title: "Title",
      subtitle: "Subtitle",
      href: true,
      external: true,
    },
  },
  milestones: {
    label: "Timeline",
    heading: true,
    items: { addLabel: "Add milestone", label: "Year", title: "Role", subtitle: "Institution" },
  },
  cta: {
    label: "Call to action",
    heading: true,
    description: true,
    cta: true,
  },
  text: {
    label: "Text block",
    heading: true,
    description: true,
    body: true,
    bodyLabel: "Long text",
    stats: true,
    statsLabel: "Statistics (optional)",
  },
  cards: {
    label: "Card grid",
    heading: true,
    items: { addLabel: "Add card", title: "Title", description: "Description", href: true },
  },
  footer: {
    label: "Footer",
    heading: true,
    subtitle: true,
    subtitleLabel: "Copyright line",
    description: true,
    descriptionLabel: "Role / address line",
    body: true,
    bodyLabel: "Bottom-left note",
    items: { addLabel: "Add column", label: "Column title", children: true },
  },
  chrome: {
    label: "Header chrome",
    description: true,
    descriptionLabel: "Image alt text",
    image: true,
    buttons: ["primaryButton"],
  },
};
