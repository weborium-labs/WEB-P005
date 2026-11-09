import Button from "../Button";
import { ChevronRightIcon } from "../Icons";
import { usePageSection } from "../../hooks/usePageContent";
import { resolveHref, resolveList, resolveText } from "../../lib/sectionFallback";
import type { SectionStat } from "../../types/page";

interface AboutProfileProps {
    /** Page document the biography reads from. */
    pageSlug?: string;
}

// Same image the Navbar/Hero use for the avatar.
const DEFAULT_AVATAR =
    "https://pub-4288b22fbd4c41f8ae1e48c844c96685.r2.dev/weborium/Dr.%20Davinder%20Paul%20Singh.jpeg";

const DEFAULT_NAME = "Dr. Davinder Paul Singh";
const DEFAULT_ROLE = "Assistant Professor · PDEU";

const DEFAULT_BIO =
    'Dr. Davinder Paul Singh is currently working as an Assistant Professor in the Department of Computer Science and Engineering at Pandit Deendayal Energy University, Gandhinagar, Gujarat. He has completed his Ph.D. from Shri Mata Vaishno Devi University, Katra, Jammu and Kashmir. He has also qualified UGC- NET JRF in computer science with All India Rank 100. He has published various articles in SCI journals and International Conferences of repute. Dr. Davinder Paul Singh has also won several best paper presentation awards including "Best Paper Award" for his CSI article. His primary areas of interest include Artificial Intelligence, Machine Learning, Deep Learning, Computational Biology and Drug Discovery.';

const DEFAULT_STATS: SectionStat[] = [
    { value: "24+", label: "Journal Papers" },
    { value: "23+", label: "Conference Papers" },
    { value: "2", label: "Patents Granted" },
    { value: "7", label: "Patents Published" },
];

const DEFAULT_LATEST = [
    "Published new research in leading SCIE-indexed journals.",
    "Contributed to new research in AI-driven cancer diagnosis and medical imaging.",
    "Filed new patents focused on AI and IoT-based healthcare solutions.",
];

/** Standing credentials — the short facts a reader wants before the biography. */
const CREDENTIALS = [
    { title: "Ph.D., Computer Science", detail: "Shri Mata Vaishno Devi University, Katra" },
    { title: "UGC-NET JRF · AIR 100", detail: "Computer Science & Engineering, 2022" },
    {
        title: "Editorial board roles",
        detail: "Medicon · PriMera Scientific Engineering (PSEN)",
    },
];

const eyebrow =
    "text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--color-text-muted)]";

/**
 * Biography block: sticky portrait + credentials on the left, the long-form bio
 * with an editorial drop cap, a hairline stat grid and the latest highlights on
 * the right.
 *
 * Reads the `about` document's `about` section (bio, stats, latest, CTA) and
 * its `hero` section (portrait); static defaults render until the API answers.
 */
const AboutProfile = ({ pageSlug = "about" }: AboutProfileProps) => {
    const about = usePageSection(pageSlug, "about");
    const hero = usePageSection(pageSlug, "hero");

    if (about.outcome === "hidden") return null;

    const section = about.outcome === "section" ? about.section : null;
    const heroSection = hero.outcome === "section" ? hero.section : null;

    const bio = resolveText(section?.description, DEFAULT_BIO);
    const stats: SectionStat[] = section?.stats ?? DEFAULT_STATS;
    const latestHeading = resolveText(section?.subtitle, "Latest");
    const latest = resolveList(
        section?.items,
        (items) =>
            items
                .map((item) => item.title?.trim() || item.description?.trim() || "")
                .filter(Boolean),
        DEFAULT_LATEST,
    );
    const link = section?.cta
        ? {
              label: resolveText(section.cta.label, "View About Me"),
              href: resolveHref(section.cta.href, "/about"),
          }
        : { label: "View About Me", href: "/about" };

    const portrait = heroSection?.image?.url || DEFAULT_AVATAR;
    const portraitAlt = heroSection?.image?.alt || DEFAULT_NAME;

    return (
        <section className="w-full px-4 py-14 sm:px-8 lg:px-12 lg:py-20">
            <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-10 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-16">
                {/* Left: portrait + standing credentials (sticky on desktop) */}
                <div className="lg:sticky lg:top-28 lg:self-start">
                    <figure
                        data-reveal
                        className="overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-sm"
                    >
                        <img
                            src={portrait}
                            alt={portraitAlt}
                            draggable={false}
                            className="aspect-square w-full rounded-[18px] object-cover"
                        />
                        <figcaption className="px-3 py-3 text-center">
                            <p className="text-[15px] font-semibold text-[var(--color-text-heading)]">
                                {DEFAULT_NAME}
                            </p>
                            <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                                {DEFAULT_ROLE}
                            </p>
                        </figcaption>
                    </figure>

                    <ul
                        data-reveal
                        className="mt-6 divide-y divide-[var(--color-border)] overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)]"
                    >
                        {CREDENTIALS.map((credential) => (
                            <li key={credential.title} className="px-5 py-4">
                                <p className="text-[14px] font-semibold text-[var(--color-text-heading)]">
                                    {credential.title}
                                </p>
                                <p className="mt-1 text-[13px] leading-snug text-[var(--color-text-subtle)]">
                                    {credential.detail}
                                </p>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Right: biography */}
                <div>
                    <p data-reveal className={eyebrow}>
                        Biography
                    </p>

                    <p
                        data-reveal
                        className="mt-5 text-[16px] leading-[1.75] text-[var(--color-text-body)] first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-[54px] first-letter:font-medium first-letter:leading-[0.82] first-letter:text-[var(--color-primary)]"
                    >
                        {bio}
                    </p>

                    {/* At-a-glance figures — hairline grid, unlike the home glass cards */}
                    <dl
                        data-reveal
                        className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-4"
                    >
                        {stats.map((stat) => (
                            <div
                                key={`${stat.value}-${stat.label}`}
                                className="bg-[var(--color-surface)] px-5 py-5"
                            >
                                <dt className="text-[26px] font-semibold leading-none text-[var(--color-text-primary)]">
                                    {stat.value}
                                </dt>
                                <dd className="mt-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                                    {stat.label}
                                </dd>
                            </div>
                        ))}
                    </dl>

                    {latest.length > 0 && (
                        <div data-reveal className="mt-10">
                            <p className={eyebrow}>{latestHeading}</p>
                            <ul className="mt-4 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
                                {latest.map((item) => (
                                    <li
                                        key={item}
                                        className="flex gap-3 py-3.5 text-[15px] leading-snug text-[var(--color-text-body)]"
                                    >
                                        <span
                                            aria-hidden="true"
                                            className="text-[var(--color-primary)]"
                                        >
                                            —
                                        </span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div data-reveal className="mt-8">
                        <Button
                            variant="soft"
                            text={link.label}
                            href={link.href}
                            icon={<ChevronRightIcon />}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutProfile;
