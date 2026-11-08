import { TrophyIcon } from "./TrophyIcons";

interface Honor {
    title: string;
    description: string;
}

interface HonorsProps {
    heading?: string;
    items?: Honor[];
    className?: string;
}

const glass =
    "bg-[var(--color-surface)] bg-[linear-gradient(90deg,rgba(255,255,255,0.02)_0%,rgba(0,0,0,0.02)_47.08%,rgba(255,255,255,0.02)_100%)] " +
    "shadow-[inset_4px_0_4px_0_rgba(255,255,255,0.25),inset_0_2px_5px_0_rgba(255,255,255,0.54),2px_2px_120px_0_rgba(0,0,0,0.12)]";

const defaultItems: Honor[] = [
    { title: "AIR 100", description: "UGC NET-JRF 2022 - Computer Science & Engineering" },
    {
        title: "2 Editorial Board Roles",
        description: "Medicon and PriMera Scientific Engineering (PSEN)",
    },
    {
        title: "Best Paper / Poster",
        description: "Awards won for research presentations at conferences",
    },
    {
        title: "Academic Distinction",
        description: "Always a distinction-holder from school to college and university",
    },
];

export const Honors = ({
    heading = "Honors & Achievements",
    items = defaultItems,
    className = "",
}: HonorsProps) => {
    return (
        <section className={`w-full px-3 py-12 sm:px-6 lg:px-12 ${className}`}>
            <div
                className={`mx-auto flex max-w-[1296px] flex-col items-center rounded-[36px] px-4 pb-10 pt-8 sm:rounded-[48px] sm:px-8 sm:pt-10 lg:rounded-[64px] lg:pb-[84px] ${glass}`}
            >
                <TrophyIcon />

                <h2 className="mt-4 text-center font-['Google_Sans_Flex',sans-serif] text-[28px] font-medium leading-tight text-[var(--color-text-primary)] sm:text-[32px]">
                    {heading}
                </h2>

                <ul className="mt-9 grid w-full max-w-[978px] grid-cols-1 gap-4 md:grid-cols-2 lg:gap-x-[60px] lg:gap-y-8">
                    {items.map((item) => (
                        <li
                            key={item.title}
                            className={`flex flex-col items-start rounded-[32px] px-6 py-4 ${glass}`}
                        >
                            <span className="font-['Google_Sans_Flex',sans-serif] text-[28px] font-medium leading-[1.15] text-[var(--color-text-primary)] sm:text-[32px] lg:text-[40px]">
                                {item.title}
                            </span>
                            <span className="font-['Google_Sans_Flex',sans-serif] text-base font-medium leading-6 text-[var(--color-text-secondary)]">
                                {item.description}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
};

export default Honors;