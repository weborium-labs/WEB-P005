import TrophyIcon from "./TrophyIcons";
import { usePageSection } from "../hooks/usePageContent";
import { resolveList, resolveText } from "../lib/sectionFallback";

interface Milestone {
    year: string;
    role: string;
    institution: string;
}

interface JourneyProps {
    /** When set, content loads from that page document's `milestones` section. */
    pageSlug?: string;
    heading?: string;
    milestones?: Milestone[];
    className?: string;
}

const defaultMilestones: Milestone[] = [
    { year: "2014", role: "B.E., IT", institution: "(University of Jammu - 70%)" },
    { year: "2017", role: "M.Tech., CSE", institution: "(University of Jammu - 8.31 CGPA)" },
    {
        year: "2018",
        role: "Contractual Asst. Professor",
        institution: "(Yogananda College of Engineering & Technology)",
    },
    {
        year: "2018 - 2023",
        role: "Ph.D. Scholar",
        institution: "(Shri Mata Vaishno Devi University)",
    },
    {
        year: "2023-Present",
        role: "Asst. Professor",
        institution: "(Pandit Deendayal Energy University)",
    },
];

const font = "font-['Google_Sans_Flex',sans-serif]";

const Dot = ({ className = "" }: { className?: string }) => (
    <span
        aria-hidden="true"
        className={`absolute left-1/2 z-10 h-[14px] w-[14px] -translate-x-1/2 rounded-full bg-[var(--color-primary)] bg-[linear-gradient(225deg,#2F55F0_50%,#5A7CFB_85.36%,#88C7FF_120.71%)] ${className}`}
    />
);

/** 1px connector (52px tall) with a small cap; `cap` says which end carries it */
const Stem = ({ cap, className = "" }: { cap: "top" | "bottom"; className?: string }) => (
    <span
        aria-hidden="true"
        className={`absolute left-1/2 h-[52px] w-px -translate-x-1/2 ${className}`}
    >
        <span className="absolute inset-x-0 top-[3px] bottom-[3px] bg-[var(--color-text-faint)]" />
        <span
            className={`absolute left-1/2 h-[5.33px] w-[5.33px] -translate-x-1/2 rounded-full bg-[var(--color-text-faint)] ${cap === "top" ? "top-0" : "bottom-0"
                }`}
        />
    </span>
);

const Year = ({ children, className = "" }: { children: string; className?: string }) => (
    <p
        className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-center text-lg font-bold leading-tight text-[var(--color-text-secondary)] ${font} ${className}`}
    >
        {children}
    </p>
);

const Label = ({ role, institution, className = "" }: Omit<Milestone, "year"> & { className?: string }) => (
    <p
        className={`absolute left-1/2 w-[151px] max-w-full -translate-x-1/2 text-center text-base leading-tight text-[var(--color-text-primary)] ${font} ${className}`}
    >
        <span className="block font-bold">{role}</span>
        <span className="block">{institution}</span>
    </p>
);

export const Journey = ({
    pageSlug,
    heading = "Journey",
    milestones = defaultMilestones,
    className = "",
}: JourneyProps) => {
    const resolved = usePageSection(pageSlug, "milestones");

    if (resolved.outcome === "hidden") return null;

    const section = resolved.outcome === "section" ? resolved.section : null;
    const title = section ? resolveText(section.heading, heading) : heading;

    // CMS rows use label / title / subtitle for year / role / institution.
    const rows = resolveList(
        section?.items?.filter((item) => Boolean(item.title?.trim() || item.label?.trim())),
        (list) =>
            list.map((item) => ({
                year: resolveText(item.label, ""),
                role: resolveText(item.title, ""),
                institution: resolveText(item.subtitle, ""),
            })),
        milestones,
    );

    return (
        <section className={`w-full px-3 py-12 sm:px-6 lg:px-12 ${className}`}>
            <div className="mx-auto flex max-w-[1296px] flex-col items-center gap-10 lg:gap-16">
                <div data-reveal className="flex flex-col items-center justify-center gap-4 text-center">
                    <TrophyIcon />
                    <h2 className={`text-[28px] font-medium leading-tight text-[var(--color-text-primary)] sm:text-[32px] ${font}`}>
                        {title}
                    </h2>
                </div>

                {/* Desktop: horizontal alternating timeline */}
                <div className="relative hidden h-[294px] w-full lg:block">
                    <div
                        aria-hidden="true"
                        className="absolute left-0 right-0 top-[127px] h-[2px] bg-[var(--color-text-primary)]"
                    />
                    <ol className="relative mx-auto grid h-full w-[96.8%] grid-cols-5">
                        {rows.map((m, i) => {
                            const textBelow = i % 2 === 0;
                            return (
                                <li key={`${m.year}-${m.role}`} data-reveal className="relative h-full">
                                    {textBelow ? (
                                        <>
                                            <Year className="top-[85px]">{m.year}</Year>
                                            <Dot className="top-[120px]" />
                                            <Stem cap="bottom" className="top-[133px]" />
                                            <Label role={m.role} institution={m.institution} className="top-[194px]" />
                                        </>
                                    ) : (
                                        <>
                                            <Label role={m.role} institution={m.institution} className="top-0" />
                                            <Stem cap="top" className="top-[72px]" />
                                            <Dot className="top-[120px]" />
                                            <Year className="top-[146px]">{m.year}</Year>
                                        </>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </div>

                {/* Mobile / tablet: vertical timeline */}
                <ol className="relative w-full max-w-md lg:hidden">
                    <span
                        aria-hidden="true"
                        className="absolute bottom-2 left-[6px] top-2 w-[2px] bg-[var(--color-text-primary)]"
                    />
                    {rows.map((m) => (
                        <li key={`${m.year}-${m.role}`} data-reveal className="relative pb-8 pl-9 last:pb-0">
                            <span
                                aria-hidden="true"
                                className="absolute left-0 top-1 h-[14px] w-[14px] rounded-full bg-[var(--color-primary)] bg-[linear-gradient(225deg,#2F55F0_50%,#5A7CFB_85.36%,#88C7FF_120.71%)]"
                            />
                            <p className={`text-lg font-bold leading-tight text-[var(--color-text-secondary)] ${font}`}>{m.year}</p>
                            <p className={`mt-1 text-base leading-tight text-[var(--color-text-primary)] ${font}`}>
                                <span className="block font-bold">{m.role}</span>
                                <span className="block">{m.institution}</span>
                            </p>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
};

export default Journey;