import type { ReactNode } from "react";
import Button from "./Button";
import SocialPill from "./SocialPill";
import { GoogleScholarIcon, LinkedInIcon, PdfIcon } from "./Icons";

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

export const Hero = ({
    headline = ["Researching Intelligence.", "Building Impact."],
    description = "Computer Science researcher and educator specializing in AI, deep learning, medical imaging, and computational approaches to healthcare, with a focus on translating research into intelligent solutions.",
    primaryCta = { label: "View Research", href: "/research/publications" },
    secondaryCta = { label: "View Resume", href: "/resume.pdf" },
    socials = defaultSocials,
    imageSrc = DEFAULT_AVATAR,
    imageAlt = "Dr. Davinder Paul Singh",
    className = "",
}: HeroProps) => {
    return (
        <section
            className={`w-full px-3 pt-28 pb-12 sm:px-6 sm:pt-36 lg:px-12 ${className}`}
        >
            <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
                {/* Left: copy + CTAs */}
                <div className="flex flex-col items-start">
                    <h1 className="font-['Google_Sans_Flex',sans-serif] text-[40px] font-medium leading-[1.15] tracking-[-0.02em] text-[#131A28] sm:text-[48px] lg:text-[56px]">
                        {headline.map((line) => (
                            <span key={line} className="block">
                                {line}
                            </span>
                        ))}
                    </h1>

                    <p className="mt-6 max-w-[620px] font-['Google_Sans_Flex',sans-serif] text-[16px] leading-[1.25] text-[#5b6178]">
                        {description}
                    </p>

                    <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-8">
                        <Button
                            variant="accent"
                            text={primaryCta.label}
                            href={primaryCta.href}
                        />
                        <Button
                            variant="soft"
                            text={secondaryCta.label}
                            href={secondaryCta.href}
                            external
                            icon={<PdfIcon />}
                        />
                    </div>
                </div>

                {/* Right: photo + social pills */}
                <div className="mx-auto flex w-full max-w-[400px] flex-col items-center gap-6 lg:mx-0">
                    <img
                        src={imageSrc}
                        alt={imageAlt}
                        draggable={false}
                        className="aspect-square w-full rounded-[56px] object-cover sm:rounded-[72px]"
                    />
                    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
                        {socials.map((s) => (
                            <SocialPill key={s.label} label={s.label} href={s.href} icon={s.icon} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;