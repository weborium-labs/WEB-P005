import { usePageSection } from "../../hooks/usePageContent";
import { resolveList, resolveText } from "../../lib/sectionFallback";

interface FocusArea {
    title: string;
    description: string;
}

interface FocusAreasProps {
    /**
     * Document that owns the canonical interest list. The home document is the
     * single source of truth for research interests; this page presents the
     * same rows in a different (numbered, editorial) layout instead of
     * duplicating the copy.
     */
    sourceSlug?: string;
}

/**
 * "Areas of focus" — a numbered editorial list.
 *
 * Unlike the home page's icon cards, the rows are separated by hairlines and
 * indexed (`01`, `02`, …), which is what visually separates the two pages.
 *
 * CMS-only block (like `TextSection`/`CardsSection`): it renders the moment the
 * document arrives and nothing before that, so there is no second copy of the
 * interests text to keep in sync.
 */
const FocusAreas = ({ sourceSlug = "home" }: FocusAreasProps) => {
    const resolved = usePageSection(sourceSlug, "interests");

    if (resolved.outcome !== "section") return null;

    const heading = resolveText(resolved.section.heading, "Areas of focus");
    const areas: FocusArea[] = resolveList(
        resolved.section.items?.filter((item) => Boolean(item.title?.trim())),
        (items) =>
            items.map((item) => ({
                title: resolveText(item.title, ""),
                description: resolveText(item.description, ""),
            })),
        [],
    );

    if (areas.length === 0) return null;

    return (
        <section className="w-full border-t border-[var(--color-border)] bg-[var(--color-background-alt)] px-4 py-14 sm:px-8 lg:px-12 lg:py-20">
            <div className="mx-auto max-w-[1280px]">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <h2
                        data-reveal
                        className="text-[26px] font-medium leading-tight tracking-[-0.01em] text-[var(--color-text-primary)] sm:text-[32px]"
                    >
                        {heading}
                    </h2>
                    <p
                        data-reveal
                        className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--color-text-muted)]"
                    >
                        Research
                    </p>
                </div>

                <ol className="mt-8 border-t border-[var(--color-border)]">
                    {areas.map((area, index) => (
                        <li
                            key={area.title || `focus-${index}`}
                            data-reveal
                            className="group grid grid-cols-1 gap-2 border-b border-[var(--color-border)] px-1 py-6 transition-colors duration-200 hover:bg-[var(--color-surface-hover)] sm:grid-cols-[64px_minmax(0,320px)_minmax(0,1fr)] sm:items-baseline sm:gap-6 sm:px-2"
                        >
                            <span
                                aria-hidden="true"
                                className="text-[13px] font-semibold tabular-nums tracking-[0.16em] text-[var(--color-text-faint)] transition-colors duration-200 group-hover:text-[var(--color-primary)]"
                            >
                                {String(index + 1).padStart(2, "0")}
                            </span>
                            <h3 className="text-[18px] font-semibold leading-snug text-[var(--color-text-heading)] sm:text-[20px]">
                                {area.title}
                            </h3>
                            <p className="text-[15px] leading-relaxed text-[var(--color-text-subtle)]">
                                {area.description}
                            </p>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
};

export default FocusAreas;
