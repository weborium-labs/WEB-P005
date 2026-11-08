import type { ReactNode } from "react";
import Button from "./Button";
import SocialPill from "./SocialPill";
import { GoogleScholarIcon, LinkedInIcon, PdfIcon } from "./Icons";
import { usePageSection } from "../hooks/usePageContent";
import type { SectionItem } from "../types/page";

// Same image the Navbar uses for its avatar
const DEFAULT_AVATAR =
    "https://pub-4288b22fbd4c41f8ae1e48c844c96685.r2.dev/weborium/Dr.%20Davinder%20Paul%20Singh.jpeg";

interface HeroLink {
    label: string;
    href: string;
}

interface HeroSocial extends HeroLink {
    icon: ReactNode;
}

interface HeroProps {
    /**
     * When set, the hero renders from that page document's `hero` section and
     * falls back to the static defaults below while the API is pending or
     * unreachable.
     */
    pageSlug?: string;
    /** Each entry renders on its own line */
    headline?: string[];
    description?: string;
    primaryCta?: HeroLink;
    secondaryCta?: HeroLink;
    socials?: HeroSocial[];
    imageSrc?: string;
    imageAlt?: string;
    className?: string;
}

const defaultSocials: HeroSocial[] = [
    {
        label: "Google Scholar",
        href: "https://scholar.google.com",
        icon: <GoogleScholarIcon />,
    },
    {
        label: "LinkedIn",
        href: "https://www.linkedin.com",
        icon: <LinkedInIcon />,
    },
];

/** Resolves the `icon` key stored in a section item to a rendered glyph. */
const socialIcon = (key?: string): ReactNode => {
    switch ((key ?? "").toLowerCase()) {
        case "scholar":
            return <GoogleScholarIcon />;
        case "linkedin":
            return <LinkedInIcon />;
        case "pdf":
        case "resume":
            return <PdfIcon />;
        default:
            return null;
    }
};

/** Maps CMS social rows to the pill component, dropping unusable entries. */
const toSocials = (items: SectionItem[] | undefined): HeroSocial[] | undefined => {
    if (!items) return undefined;
    return items
        .filter((item) => Boolean(item.label) && Boolean(item.href))
        .map((item) => ({
            label: item.label as string,
            href: item.href as string,
            icon: socialIcon(item.icon),
        }));
};

export const Hero = ({
    pageSlug,
    headline = ["Researching Intelligence.", "Building Impact."],
    description = "Computer Science researcher and educator specializing in AI, deep learning, medical imaging, and computational approaches to healthcare, with a focus on translating research into intelligent solutions.",
    primaryCta = { label: "View Research", href: "/research/publications" },
    secondaryCta = { label: "View Resume", href: "/resume.pdf" },
    socials = defaultSocials,
    imageSrc = DEFAULT_AVATAR,
    imageAlt = "Dr. Davinder Paul Singh",
    className = "",
}: HeroProps) => {
    const resolved = usePageSection(pageSlug, "hero");

    // The admin removed (or hid) the hero: render nothing instead of stale copy.
    if (resolved.outcome === "hidden") return null;

    const section = resolved.outcome === "section" ? resolved.section : null;

    // Static defaults stay on screen until — and unless — valid API data lands.
    const lines = section?.headline?.length ? section.headline : headline;
    const text = section?.description?.trim() || description;
    const primary = section?.primaryButton ?? primaryCta;
    const secondary = section?.secondaryButton ?? secondaryCta;
    const image = section?.image?.url || imageSrc;
    const alt = section?.image?.alt || imageAlt;
    const dynamicSocials = toSocials(section?.items) ?? socials;
    // A section that intentionally publishes no social links renders none.
    const visibleSocials = section && section.items ? dynamicSocials : socials;

    return (
        <section
            className={`w-full px-3 pt-28 pb-12 sm:px-6 sm:pt-36 lg:px-12 ${className}`}
        >
            <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
                {/* Left: copy + CTAs */}
                <div className="flex flex-col items-start">
                    <h1 className="font-['Google_Sans_Flex',sans-serif] text-[40px] font-medium leading-[1.15] tracking-[-0.02em] text-[var(--color-text-primary)] sm:text-[48px] lg:text-[56px]">
                        {lines.map((line) => (
                            <span key={line} className="block">
                                {line}
                            </span>
                        ))}
                    </h1>

                    <p className="mt-6 max-w-[620px] font-['Google_Sans_Flex',sans-serif] text-[16px] leading-[1.25] text-[var(--color-text-hero)]">
                        {text}
                    </p>

                    <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-8">
                        <Button
                            variant="accent"
                            text={primary.label}
                            href={primary.href}
                        />
                        <Button
                            variant="soft"
                            text={secondary.label}
                            href={secondary.href}
                            external
                            icon={<PdfIcon />}
                        />
                    </div>
                </div>

                {/* Right: photo + social pills */}
                <div className="mx-auto flex w-full max-w-[400px] flex-col items-center gap-6 lg:mx-0">
                    <img
                        src={image}
                        alt={alt}
                        draggable={false}
                        className="aspect-square w-full rounded-[56px] object-cover sm:rounded-[72px]"
                    />
                    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
                        {visibleSocials.map((s) => (
                            <SocialPill key={s.label} label={s.label} href={s.href} icon={s.icon} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;