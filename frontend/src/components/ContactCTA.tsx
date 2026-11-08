import React from "react";
import Button from "./Button";

interface ContactCTAProps {
  onContactClick?: () => void;
  contactHref?: string;
}

export const ContactCTA: React.FC<ContactCTAProps> = ({
  onContactClick,
  contactHref = "#contact",
}) => {
  return (
    <section className="w-full py-16 sm:py-20 md:py-24 px-4 sm:px-6 flex justify-center items-center font-['Google_Sans',_sans-serif]">
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center text-center">
        {/* Main Heading */}
        <h2 className="text-[28px] sm:text-[38px] md:text-[46px] font-semibold text-[var(--color-text-heading)] tracking-tight leading-[1.18] max-w-[620px]">
          Interested in collaborating or discussing my research?
        </h2>

        {/* Subtitle description */}
        <p className="mt-4 sm:mt-5 text-[14px] sm:text-[15px] md:text-[16px] text-[var(--color-text-muted)] font-normal leading-relaxed max-w-[500px]">
          I’m open to considered academic conversations across machine
          learning, healthcare, and interdisciplinary research.
        </p>

        {/* Button Wrapper: Full width on small mobile, auto width centered on tablet/desktop */}
        <div className="mt-8 sm:mt-10 w-full sm:w-auto flex justify-center px-2 sm:px-0">
          <Button
            text="Get in Touch"
            href={contactHref}
            onClick={onContactClick}
            className="w-full sm:w-auto px-8 h-12 text-[15px] sm:text-[16px] font-medium"
          />
        </div>
      </div>
    </section>
  );
};

export default ContactCTA;