import Button from "./Button";
import { usePageSection } from "../hooks/usePageContent";
import { resolveHref, resolveText } from "../lib/sectionFallback";

interface ContactSectionProps {
    /** When set, content loads from that page document's `cta` section. */
    pageSlug?: string;
    heading?: string;
    description?: string;
    cta?: { label: string; href: string };
    className?: string;
}

export const ContactSection = ({
    pageSlug,
    heading = "Interested in collaborating or discussing my research?",
    description = "I’m open to considered academic conversations across machine learning, healthcare, and interdisciplinary research.",
    cta = { label: "Get in Touch", href: "/contact" },
    className = "",
}: ContactSectionProps) => {
    const resolved = usePageSection(pageSlug, "cta");

    if (resolved.outcome === "hidden") return null;

    const section = resolved.outcome === "section" ? resolved.section : null;

    const title = section ? resolveText(section.heading, heading) : heading;
    const text = section ? resolveText(section.description, description) : description;
    const link = section?.cta
        ? {
              label: resolveText(section.cta.label, cta.label),
              href: resolveHref(section.cta.href, cta.href),
          }
        : cta;

    return (
        <section className={`w-full px-4 py-16 sm:px-6 lg:py-24 ${className}`}>
            <div className="mx-auto flex w-full max-w-[742px] flex-col items-center gap-8">
                <div className="flex w-full flex-col items-start gap-4">
                    <h2 className="w-full text-balance text-center font-['Google_Sans_Flex',sans-serif] text-[32px] font-medium leading-[1.3] text-[var(--color-text-primary)] sm:text-[44px] lg:text-[54px]">
                        {title}
                    </h2>
                    <p className="w-full text-center font-['Google_Sans_Flex',sans-serif] text-base leading-tight text-[var(--color-text-secondary)]">
                        {text}
                    </p>
                </div>
                <Button variant="accent" text={link.label} href={link.href} />
            </div>
        </section>
    );
};

export default ContactSection;