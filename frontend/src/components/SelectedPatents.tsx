import SelectedList from "./SelectedList";

interface Patent {
    status: "granted" | "published";
    title: string;
    applicationNo: string;
    href?: string;
}

interface SelectedPatentsProps {
    heading?: string;
    items?: Patent[];
    className?: string;
}

const defaultItems: Patent[] = [
    {
        status: "granted",
        title: "AI-powered mood detection wrist band for children",
        applicationNo: "466626-001",
    },
    {
        status: "granted",
        title: "AI based gesture control system for medical drones",
        applicationNo: "466582-001",
    },
    {
        status: "published",
        title:
            "Machine Learning based Single-Cell RNA Sequencing for Targeted Anticancer Drug Discovery",
        applicationNo: "202421052344",
    },
];

export const SelectedPatents = ({
    heading = "Selected Patents",
    items = defaultItems,
    className,
}: SelectedPatentsProps) => (
    <SelectedList
        heading={heading}
        className={className}
        items={items.map((p) => ({
            label: p.status,
            title: p.title,
            subtitle: `Application No. ${p.applicationNo}`,
            href: p.href,
        }))}
    />
);

export default SelectedPatents;