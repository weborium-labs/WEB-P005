import SelectedList, { type SelectedListItem } from "./SelectedList";
import { usePageSection } from "../hooks/usePageContent";
import { resolveHref, resolveList, resolveText } from "../lib/sectionFallback";

interface ResearchItem {
    type: "journal" | "conference";
    year: number | string;
    title: string;
    venue: string;
    href?: string;
}

interface SelectedResearchProps {
    /**
     * When set, content loads from that page document's `list` section with
     * the key `selected-research` (the home page holds two `list` sections).
     */
    pageSlug?: string;
    heading?: string;
    items?: ResearchItem[];
    className?: string;
}

const defaultItems: ResearchItem[] = [
    {
        type: "journal",
        year: 2026,
        title:
            "A Comprehensive Study to Enhance Colorectal Cancer Diagnosis Using Hybrid Deep Learning Approaches: Comparative Analysis with Existing State of the Art Techniques",
        venue: "Archives of Computational Methods in Engineering SCIE IF 12.9",
    },
    {
        type: "conference",
        year: 2025,
        title:
            "AI enabled healthcare systems using textual data with a BERT and deep learning model",
        venue: "IEEE ICERECT 2025",
    },
    {
        type: "journal",
        year: 2023,
        title:
            "CTDN (convolutional temporal based deep neural network): an improvised stacked hybrid computational approach for anticancer drug response prediction",
        venue: "Computational Biology and Chemistry 105",
    },
];

const toResearchCards = (items: ResearchItem[]): SelectedListItem[] =>
    items.map((r) => ({
        label: `${r.type} - ${r.year}`,
        title: r.title,
        subtitle: r.venue,
        href: r.href,
    }));

export const SelectedResearch = ({
    pageSlug,
    heading = "Selected Research",
    items = defaultItems,
    className,
}: SelectedResearchProps) => {
    const resolved = usePageSection(pageSlug, "list", "selected-research");

    if (resolved.outcome === "hidden") return null;

    const section = resolved.outcome === "section" ? resolved.section : null;
    const title = section ? resolveText(section.heading, heading) : heading;

    // API rows already carry eyebrow/title/venue, so they pass through
    // directly; a missing `items` field keeps the static rows, while an
    // intentionally empty array renders an empty list.
    const cards = resolveList(
        section?.items?.filter((item) => Boolean(item.title?.trim())),
        (list) =>
            list.map((item) => ({
                label: resolveText(item.label, "research"),
                title: item.title as string,
                subtitle: resolveText(item.subtitle, ""),
                href: resolveHref(item.href, ""),
            })),
        toResearchCards(items),
    );

    return <SelectedList heading={title} className={className} items={cards} />;
};

export default SelectedResearch;
