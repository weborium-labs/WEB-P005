import type { ReactNode } from "react";

interface SocialPillProps {
    label: string;
    href: string;
    icon: ReactNode;
    className?: string;
}

const SocialPill = ({ label, href, icon, className = "" }: SocialPillProps) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={
            "inline-flex items-center gap-4 whitespace-nowrap rounded-full border border-[var(--color-surface)] bg-[var(--color-surface)]/70 px-6 py-3 " +
            "font-['Google_Sans_Flex',sans-serif] text-[16px] leading-[26px] font-normal not-italic text-[var(--color-text-primary)] " +
            "shadow-[0_2px_10px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-px hover:bg-[var(--color-surface)] hover:shadow-[0_6px_16px_rgba(15,23,42,0.08)] " +
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-strong)]/50 focus-visible:ring-offset-2 " +
            className
        }
    >
        {icon}
        {label}
    </a>
);

export default SocialPill;