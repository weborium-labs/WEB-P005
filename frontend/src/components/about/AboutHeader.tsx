import { usePageSection } from "../../hooks/usePageContent";
import { resolveText } from "../../lib/sectionFallback";

interface AboutHeaderProps {
    /** Page document the masthead reads from. */
    pageSlug?: string;
}

const DEFAULT_TITLE = "Research with rigour, teaching with purpose";

/**
 * Identity facts shown under the statement. The public site keeps these in one
 * place (the footer document carries the same role line), so they are static
 * here rather than invented per page.
 */
const META = [
    { label: "Role", value: "Assistant Professor" },
    { label: "Department", value: "Computer Science & Engineering" },
    { label: "Location", value: "Gandhinagar, Gujarat, India" },
];

/**
 * About masthead.
 *
 * Deliberately *not* the home hero: a full-width editorial band (eyebrow,
 * statement, identity line) replaces the two-column portrait hero, so `/` and
 * `/about` read as different documents from the first pixel.
 */
const AboutHeader = ({ pageSlug = "about" }: AboutHeaderProps) => {
    const resolved = usePageSection(pageSlug, "about");

    // Admin hid the block — render nothing rather than stale copy.
    if (resolved.outcome === "hidden") return null;

    const section = resolved.outcome === "section" ? resolved.section : null;
    const title = resolveText(section?.heading, DEFAULT_TITLE);

    return (
        <header className="relative overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-background-alt)]">
            {/* Soft brand wash — decorative, token-driven, never blocks input. */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(75%_110%_at_8%_0%,color-mix(in_srgb,var(--color-primary-light)_45%,transparent)_0%,transparent_60%)]"
            />
            <div className="relative mx-auto w-full max-w-[1280px] px-4 pb-10 pt-32 sm:px-8 sm:pb-12 sm:pt-36 lg:px-12">
                <p
                    data-reveal
                    className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--color-text-muted)]"
                >
                    About
                </p>

                <h1
                    data-reveal
                    className="mt-5 max-w-[20ch] text-[34px] font-medium leading-[1.08] tracking-[-0.02em] text-[var(--color-text-primary)] sm:text-[44px] lg:text-[56px]"
                >
                    {title}
                </h1>

                <dl
                    data-reveal
                    className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-[13px]"
                >
                    {META.map((entry) => (
                        <div key={entry.label} className="flex items-baseline gap-2.5">
                            <dt className="uppercase tracking-[0.16em] text-[var(--color-text-faint)]">
                                {entry.label}
                            </dt>
                            <dd className="font-medium text-[var(--color-text-body)]">
                                {entry.value}
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>
        </header>
    );
};

export default AboutHeader;
