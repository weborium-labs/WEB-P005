import SelectedList, { type SelectedListItem } from "./SelectedList";
import { usePageSection } from "../hooks/usePageContent";
import { resolveHref, resolveList, resolveText } from "../lib/sectionFallback";

interface Patent {
    status: "granted" | "published";
    title: string;
    applicationNo: string;
    href?: string;
}

interface SelectedPatentsProps {
    /**
     * When set, content loads from that page document's `list` section with
     * the key `selected-patents` (the home page holds two `list` sections).
     */
    pageSlug?: string;
    heading?: string;
    items?: Patent[];
    className?: string;
}

const defaultItems: Patent[] = [
    {
        status: "granted",
        title: "AI-powered mood detection wrist band for children",
        applicationNo: "466626-001",
    },
    {
        status: "granted",
        title: "AI based gesture control system for medical drones",
        applicationNo: "466582-001",
    },
    {
        status: "published",
        title:
            "Machine Learning based Single-Cell RNA Sequencing for Targeted Anticancer Drug Discovery",
        applicationNo: "202421052344",
    },
];

const toPatentCards = (items: Patent[]): SelectedListItem[] =>
    items.map((p) => ({
        label: p.status,
        title: p.title,
        subtitle: `Application No. ${p.applicationNo}`,
        href: p.href,
    }));

export const SelectedPatents = ({
    pageSlug,
    heading = "Selected Patents",
    items = defaultItems,
    className,
}: SelectedPatentsProps) => {
    const resolved = usePageSection(pageSlug, "list", "selected-patents");

    if (resolved.outcome === "hidden") return null;

    const section = resolved.outcome === "section" ? resolved.section : null;
    const title = section ? resolveText(section.heading, heading) : heading;

    const cards = resolveList(
        section?.items?.filter((item) => Boolean(item.title?.trim())),
        (list) =>
            list.map((item) => ({
                label: resolveText(item.label, "patent"),
                title: item.title as string,
                subtitle: resolveText(item.subtitle, ""),
                href: resolveHref(item.href, ""),
            })),
        toPatentCards(items),
    );

    return <SelectedList heading={title} className={className} items={cards} />;
};

export default SelectedPatents;
