export interface SelectedListItem {
    /** Small uppercase eyebrow, e.g. "GRANTED" or "JOURNAL - 2026" */
    label: string;
    title: string;
    /** Muted line under the title (venue, application number, ...) */
    subtitle: string;
    /** Optional link; renders the card as an anchor when provided */
    href?: string;
}

interface SelectedListProps {
    heading: string;
    items: SelectedListItem[];
    className?: string;
}

const glass =
    "bg-[var(--color-surface)] bg-[linear-gradient(90deg,rgba(255,255,255,0.02)_0%,rgba(0,0,0,0.02)_47.08%,rgba(255,255,255,0.02)_100%)] " +
    "shadow-[inset_4px_0_4px_0_rgba(255,255,255,0.25),inset_0_2px_5px_0_rgba(255,255,255,0.54),2px_2px_120px_0_rgba(0,0,0,0.12)]";

const Chevron = () => (
    <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute bottom-6 right-6 h-6 w-6 shrink-0 transition-transform duration-200 group-hover:translate-x-1 sm:bottom-8 sm:right-8 lg:bottom-10 lg:right-12"
        aria-hidden="true"
    >
        <path
            d="M9.00005 6C9.00005 6 15 10.4189 15 12C15 13.5812 9 18 9 18"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            stroke="#0F172A"
        />
    </svg>
);

const cardClass = `group relative flex flex-col items-start overflow-hidden rounded-[36px] px-6 py-6 sm:rounded-[48px] sm:px-8 sm:py-8 lg:rounded-[64px] lg:px-12 lg:py-10 ${glass}`;

const Card = ({ label, title, subtitle, href }: SelectedListItem) => {
    const content = (
        <>
            <div className="flex w-full flex-col items-start gap-2 pr-8 lg:pr-0">
                <p className="font-['Google_Sans_Flex',sans-serif] text-base font-semibold uppercase leading-tight text-[var(--color-text-secondary)]">
                    {label}
                </p>
                <div className="flex w-full flex-col items-start gap-3">
                    <h3 className="w-full font-['Google_Sans_Flex',sans-serif] text-lg font-medium leading-tight text-[var(--color-text-primary)] sm:text-2xl">
                        {title}
                    </h3>
                    <p className="w-full font-['Google_Sans_Flex',sans-serif] text-base leading-tight text-[var(--color-text-secondary)]">
                        {subtitle}
                    </p>
                </div>
            </div>
            <Chevron />
        </>
    );

    return href ? (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${cardClass} transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-strong)]/50`}
        >
            {content}
        </a>
    ) : (
        <article className={cardClass}>{content}</article>
    );
};

export const SelectedList = ({ heading, items, className = "" }: SelectedListProps) => (
    <section className={`w-full px-3 py-12 sm:px-6 lg:px-12 ${className}`}>
        <div
            className={`mx-auto flex max-w-7xl flex-col items-center gap-8 rounded-[36px] px-4 pb-6 pt-8 sm:rounded-[48px] sm:px-8 sm:pb-10 sm:pt-10 lg:rounded-[64px] lg:px-[60px] lg:pb-[60px] lg:pt-12 ${glass}`}
        >
            <h2 className="text-center font-['Google_Sans_Flex',sans-serif] text-[28px] font-medium leading-tight text-[var(--color-text-primary)] sm:text-[32px]">
                {heading}
            </h2>
            <div className="flex w-full flex-col gap-8">
                {items.map((item) => (
                    <Card key={`${item.label}-${item.title}`} {...item} />
                ))}
            </div>
        </div>
    </section>
);

export default SelectedList;