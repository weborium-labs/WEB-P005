import Button from "./Button";
import { ChevronRightIcon } from "./Icons";
import { usePageSection } from "../hooks/usePageContent";

interface Stat {
    value: string;
    label: string;
}

interface AboutSectionProps {
    /** When set, content loads from that page document's `about` section. */
    pageSlug?: string;
    heading?: string;
    stats?: Stat[];
    description?: string;
    cta?: { label: string; href: string };
    latestTitle?: string;
    latestItems?: string[];
    className?: string;
}

const glass =
    "bg-[var(--color-surface)] bg-[linear-gradient(90deg,rgba(255,255,255,0.02)_0%,rgba(0,0,0,0.02)_47.08%,rgba(255,255,255,0.02)_100%)] " +
    "shadow-[inset_4px_0_4px_0_rgba(255,255,255,0.25),inset_0_2px_5px_0_rgba(255,255,255,0.54),2px_2px_120px_0_rgba(0,0,0,0.12)]";

const defaultStats: Stat[] = [
    { value: "24+", label: "Journal Papers" },
    { value: "23+", label: "Conference Papers" },
    { value: "2", label: "Patents Granted" },
    { value: "7", label: "Patents Published" },
];

const defaultLatest = [
    "Published new research in leading SCIE-indexed journals.",
    "Contributed to new research in AI-driven cancer diagnosis and medical imaging.",
    "Filed new patents focused on AI and IoT-based healthcare solutions.",
];

const defaultDescription =
    'Dr. Davinder Paul Singh is currently working as an Assistant Professor in the Department of Computer Science and Engineering at Pandit Deendayal Energy University, Gandhinagar, Gujarat. He has completed his Ph.D. from Shri Mata Vaishno Devi University, Katra, Jammu and Kashmir. He has also qualified UGC- NET JRF in computer science with All India Rank 100. He has published various articles in SCI journals and International Conferences of repute. Dr. Davinder Paul Singh has also won several best paper presentation awards including "Best Paper Award" for his CSI article. His primary areas of interest include Artificial Intelligence, Machine Learning, Deep Learning, Computational Biology and Drug Discovery.';

const StatCard = ({ value, label }: Stat) => (
    <div data-reveal className={`flex flex-col items-start rounded-[32px] px-6 py-4 ${glass}`}>
        <span className="font-['Google_Sans_Flex',sans-serif] text-[40px] font-medium leading-none text-[var(--color-text-primary)]">
            {value}
        </span>
        <span className="mt-0 font-['Google_Sans_Flex',sans-serif] text-base font-medium leading-6 text-[var(--color-text-secondary)]">
            {label}
        </span>
    </div>
);

export const AboutSection = ({
    pageSlug,
    heading = "Research with rigour, teaching with purpose",
    stats = defaultStats,
    description = defaultDescription,
    cta = { label: "View About Me", href: "/about" },
    latestTitle = "Latest",
    latestItems = defaultLatest,
    className = "",
}: AboutSectionProps) => {
    const resolved = usePageSection(pageSlug, "about");

    // Admin removed or hid this block — render nothing rather than stale copy.
    if (resolved.outcome === "hidden") return null;

    const section = resolved.outcome === "section" ? resolved.section : null;

    const title = section?.heading?.trim() || heading;
    const bio = section?.description?.trim() || description;
    const link = section?.cta ?? cta;
    const latestHeading = section?.subtitle?.trim() || latestTitle;
    // `stats` present (even empty) in the API payload wins over the defaults;
    // an absent field keeps the static fallback.
    const statCards: Stat[] = section?.stats ?? stats;
    const latest: string[] = section?.items
        ? section.items
              .map((item) => item.title?.trim() || item.description?.trim() || "")
              .filter(Boolean)
        : latestItems;

    return (
        <section className={`w-full px-3 py-12 sm:px-6 lg:px-12 ${className}`}>
            <div className="mx-auto max-w-7xl">
                {/* Main glass card */}
                <div
                    className={`relative z-10 grid grid-cols-1 gap-8 rounded-[36px] p-6 sm:rounded-[48px] sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,670px)] lg:gap-12 lg:rounded-[64px] lg:px-12 lg:py-10 ${glass}`}
                >
                    {/* Left: heading + stats */}
                    <div className="flex flex-col items-start gap-6">
                        <h2
                            data-reveal
                            className="max-w-[332px] font-['Google_Sans_Flex',sans-serif] text-[28px] font-medium leading-tight text-[var(--color-text-primary)] sm:text-[32px]"
                        >
                            {title}
                        </h2>
                        <div className="flex flex-wrap gap-x-4 gap-y-3">
                            {statCards.map((s) => (
                                <StatCard key={`${s.value}-${s.label}`} {...s} />
                            ))}
                        </div>
                    </div>

                    {/* Right: bio + CTA */}
                    <div data-reveal className="flex flex-col items-start gap-6">
                        <p className="w-full text-justify font-['Google_Sans_Flex',sans-serif] text-base leading-tight text-[var(--color-text-secondary)] sm:text-xl">
                            {bio}
                        </p>
                        <Button
                            variant="soft"
                            text={link.label}
                            href={link.href}
                            icon={<ChevronRightIcon />}
                        />
                    </div>
                </div>

                {/* "Latest" card tucked behind the main card.
            Top corners are square so its straight side edges run cleanly out from under
            the main card; the main card's shadow (z-10) falls across its top. */}
                <div
                    data-reveal
                    className="relative z-0 mx-9 -mt-12 rounded-b-[36px] rounded-t-none bg-[var(--color-surface-raised)] bg-[linear-gradient(90deg,rgba(255,255,255,0.02)_0%,rgba(0,0,0,0.02)_47.08%,rgba(255,255,255,0.02)_100%)] px-6 pb-8 pt-[72px] text-center shadow-[inset_4px_0_4px_0_rgba(255,255,255,0.25),2px_2px_120px_0_rgba(0,0,0,0.12)] sm:mx-12 sm:rounded-b-[48px] lg:mx-[72px] lg:rounded-b-[64px]"
                >
                    <h3 className="font-['Google_Sans_Flex',sans-serif] text-[28px] font-medium leading-tight text-[var(--color-text-primary)] sm:text-[32px]">
                        {latestHeading}
                    </h3>
                    <ul className="mt-3 flex flex-col gap-4">
                        {latest.map((item) => (
                            <li
                                key={item}
                                className="font-['Google_Sans_Flex',sans-serif] text-base leading-tight text-[var(--color-text-secondary)] sm:text-xl"
                            >
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
};

export default AboutSection;