import type { ReactNode } from "react";
import Hero from "../Hero";
import AboutSection from "../AboutSection";
import ResearchInterests from "../ResearchInterests";
import SelectedResearch from "../SelectedResearch";
import SelectedPatents from "../SelectedPatents";
import SelectedList from "../SelectedList";
import Journey from "../Journey";
import ContactSection from "../ContactSection";
import TextSection from "../TextSection";
import CardsSection from "../CardsSection";
import type { PageDocument, Section, SectionType } from "../../types/page";

/**
 * Controlled section registry for CMS-rendered routes.
 *
 * This is the **only** place a stored `section.type` becomes React markup.
 * The registry is a fixed table of already-shipped components — the database
 * never supplies code, JSX, HTML or a component name, so a compromised or
 * malformed document cannot render arbitrary markup.
 *
 * Types that resolve themselves from the page document (`hero`, `about`,
 * `interests`, `milestones`, `cta`, `list` research/patents) are mounted with
 * their `pageSlug` and read the section that was already fetched (the resolved
 * document is primed into the page cache by `CmsRoute`). `text` / `cards` are
 * rendered directly from the resolved section, keyed by `section.key`.
 *
 * `chrome` belongs to the Navbar (never rendered here) and `footer` is rendered
 * once, at the end of the page, by `CmsRoute`.
 */

/** Maps a `list` section key to the dedicated component that owns it. */
const LIST_COMPONENTS: Partial<Record<string, (props: { pageSlug: string }) => ReactNode>> = {
  "selected-research": (props) => <SelectedResearch {...props} />,
  "selected-patents": (props) => <SelectedPatents {...props} />,
};

/** CMS rows to the shared `SelectedList` card shape (missing fields tolerated). */
const toListItems = (section: Section) =>
  (section.items ?? [])
    .filter((item) => Boolean(item.title?.trim() || item.label?.trim()))
    .map((item) => ({
      label: item.label?.trim() || "",
      title: item.title?.trim() || item.label?.trim() || "",
      subtitle: (item.subtitle ?? item.description ?? "").trim(),
      ...(item.href ? { href: item.href } : {}),
    }));

const GenericList = ({ section }: { section: Section }) => (
  <SelectedList
    heading={
      section.heading?.trim() ||
      section.subtitle?.trim() ||
      section.key.replace(/-/g, " ")
    }
    items={toListItems(section)}
  />
);

const registry: Record<
  SectionType,
  (page: PageDocument, section: Section) => ReactNode
> = {
  hero: (page) => <Hero pageSlug={page.slug} />,
  about: (page) => <AboutSection pageSlug={page.slug} />,
  interests: (page) => <ResearchInterests pageSlug={page.slug} />,
  list: (page, section) => {
    const Dedicated = LIST_COMPONENTS[section.key];
    if (Dedicated) return <Dedicated pageSlug={page.slug} />;
    return <GenericList section={section} />;
  },
  milestones: (page) => <Journey pageSlug={page.slug} />,
  cta: (page) => <ContactSection pageSlug={page.slug} />,
  text: (page, section) => (
    <TextSection pageSlug={page.slug} sectionKey={section.key} />
  ),
  cards: (page, section) => (
    <CardsSection pageSlug={page.slug} sectionKey={section.key} />
  ),
  footer: () => null, // rendered once by CmsRoute after the content
  chrome: () => null, // owned by the Navbar
};

/**
 * Renders one visible section of a resolved page document.
 *
 * Exported as a component (rather than a plain function) so the file stays
 * fast-refresh compatible: this module exports React components only.
 */
export const SectionRenderer = ({
  page,
  section,
}: {
  page: PageDocument;
  section: Section;
}): ReactNode => {
  const render = registry[section.type];
  return <>{render ? render(page, section) : null}</>;
};

export default SectionRenderer;
