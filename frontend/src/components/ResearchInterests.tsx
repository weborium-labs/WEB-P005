import type { ReactNode } from "react";
import {
    AiHealthcareIcon,
    ComputationalBiologyIcon,
    MachineLearningIcon,
    MedicalImagingIcon,
} from "./ResearchIcons";
import { usePageSection } from "../hooks/usePageContent";
import { resolveList, resolveText } from "../lib/sectionFallback";

interface Interest {
    title: string;
    description: string;
    icon: ReactNode;
}

interface ResearchInterestsProps {
    /** When set, content loads from that page document's `interests` section. */
    pageSlug?: string;
    heading?: string;
    items?: Interest[];
    className?: string;
}

const glass =
    "bg-[var(--color-surface)] bg-[linear-gradient(90deg,rgba(255,255,255,0.02)_0%,rgba(0,0,0,0.02)_47.08%,rgba(255,255,255,0.02)_100%)] " +
    "shadow-[inset_4px_0_4px_0_rgba(255,255,255,0.25),inset_0_2px_5px_0_rgba(255,255,255,0.54),2px_2px_120px_0_rgba(0,0,0,0.12)]";

const defaultItems: Interest[] = [
    {
        title: "Machine & Deep Learning",
        description:
            "Hybrid, attention-based and ensemble models for classification and prediction.",
        icon: <MachineLearningIcon />,
    },
    {
        title: "Medical Imaging",
        description:
            "Segmentation and classification across cancer, retinal, thyroid and brain imaging.",
        icon: <MedicalImagingIcon />,
    },
    {
        title: "Computational Biology",
        description:
            "Computational methods for biological sequences and disease control.",
        icon: <ComputationalBiologyIcon />,
    },
    {
        title: "AI in Healthcare",
        description:
            "AI-driven diagnosis, clinical text analysis and anti-cancer drug response.",
        icon: <AiHealthcareIcon />,
    },
];

/** Icon keys stored in the CMS map to the hand-drawn SVG set. */
const ICONS: Record<string, ReactNode> = {
    "machine-learning": <MachineLearningIcon />,
    "medical-imaging": <MedicalImagingIcon />,
    "computational-biology": <ComputationalBiologyIcon />,
    "ai-healthcare": <AiHealthcareIcon />,
};

/** Fallback glyphs, cycled through when a row carries no (known) icon key. */
const DEFAULT_ICONS: { key: string; node: ReactNode }[] = [
    { key: "machine-learning", node: <MachineLearningIcon /> },
    { key: "medical-imaging", node: <MedicalImagingIcon /> },
    { key: "computational-biology", node: <ComputationalBiologyIcon /> },
    { key: "ai-healthcare", node: <AiHealthcareIcon /> },
];

/** Resolves the icon for one card: stored key first, otherwise the cycle. */
const iconFor = (key: string | undefined, index: number): ReactNode => {
    if (key && key in ICONS) return ICONS[key];
    return DEFAULT_ICONS[index % DEFAULT_ICONS.length].node;
};

export const ResearchInterests = ({
    pageSlug,
    heading = "Research Interests",
    items = defaultItems,
    className = "",
}: ResearchInterestsProps) => {
    const resolved = usePageSection(pageSlug, "interests");

    if (resolved.outcome === "hidden") return null;

    const section = resolved.outcome === "section" ? resolved.section : null;

    const title = section ? resolveText(section.heading, heading) : heading;
    // An empty `items` array from the API is honoured (nothing to show);
    // a missing field keeps the static cards.
    const cards = resolveList(
        section?.items?.filter((item) => Boolean(item.title?.trim())),
        (list) =>
            list.map((item, index) => ({
                title: resolveText(item.title, ""),
                description: resolveText(item.description, ""),
                icon: iconFor(item.icon, index),
            })),
        items,
    );

    return (
        <section className={`w-full px-3 py-12 sm:px-6 lg:px-12 ${className}`}>
            <div className="mx-auto flex max-w-[856px] flex-col items-center gap-9">
                <h2 className="text-center font-['Google_Sans_Flex',sans-serif] text-[28px] font-medium leading-tight text-[var(--color-text-primary)] sm:text-[32px]">
                    {title}
                </h2>

                <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-x-12 lg:gap-y-8">
                    {cards.map((item) => (
                        <article
                            key={item.title}
                            className={`flex flex-col items-start gap-3 overflow-hidden rounded-[36px] p-6 sm:rounded-[48px] sm:p-8 lg:rounded-[64px] lg:px-12 lg:py-10 ${glass}`}
                        >
                            <div className="flex flex-col items-start gap-4">
                                {item.icon}
                                <h3 className="font-['Google_Sans_Flex',sans-serif] text-2xl font-medium leading-tight text-[var(--color-text-primary)]">
                                    {item.title}
                                </h3>
                            </div>
                            <p className="max-w-[305px] font-['Google_Sans_Flex',sans-serif] text-base leading-tight text-[var(--color-text-secondary)]">
                                {item.description}
                            </p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ResearchInterests;