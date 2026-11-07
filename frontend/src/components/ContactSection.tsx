import Button from "./Button";

interface ContactSectionProps {
    heading?: string;
    description?: string;
    cta?: { label: string; href: string };
    className?: string;
}

export const ContactSection = ({
    heading = "Interested in collaborating or discussing my research?",
    description = "I’m open to considered academic conversations across machine learning, healthcare, and interdisciplinary research.",
    cta = { label: "Get in Touch", href: "/contact" },
    className = "",
}: ContactSectionProps) => {
    return (
        <section className={`w-full px-4 py-16 sm:px-6 lg:py-24 ${className}`}>
            <div className="mx-auto flex w-full max-w-[742px] flex-col items-center gap-8">
                <div className="flex w-full flex-col items-start gap-4">
                    <h2 className="w-full text-balance text-center font-['Google_Sans_Flex',sans-serif] text-[32px] font-medium leading-[1.3] text-[#131A28] sm:text-[44px] lg:text-[54px]">
                        {heading}
                    </h2>
                    <p className="w-full text-center font-['Google_Sans_Flex',sans-serif] text-base leading-tight text-[#5B6478]">
                        {description}
                    </p>
                </div>
                <Button variant="accent" text={cta.label} href={cta.href} />
            </div>
        </section>
    );
};

export default ContactSection;