import SelectedList from "./SelectedList";

interface ResearchItem {
    type: "journal" | "conference";
    year: number | string;
    title: string;
    venue: string;
    href?: string;
}

interface SelectedResearchProps {
    heading?: string;
    items?: ResearchItem[];
    className?: string;
}

const defaultItems: ResearchItem[] = [
    {
        type: "journal",
        year: 2026,
        title:
            "A Comprehensive Study to Enhance Colorectal Cancer Diagnosis Using Hybrid Deep Learning Approaches: Comparative Analysis with Existing State of the Art Techniques",
        venue: "Archives of Computational Methods in Engineering SCIE IF 12.9",
    },
    {
        type: "conference",
        year: 2025,
        title:
            "AI enabled healthcare systems using textual data with a BERT and deep learning model",
        venue: "IEEE ICERECT 2025",
    },
    {
        type: "journal",
        year: 2023,
        title:
            "CTDN (convolutional temporal based deep neural network): an improvised stacked hybrid computational approach for anticancer drug response prediction",
        venue: "Computational Biology and Chemistry 105",
    },
];

export const SelectedResearch = ({
    heading = "Selected Research",
    items = defaultItems,
    className,
}: SelectedResearchProps) => (
    <SelectedList
        heading={heading}
        className={className}
        items={items.map((r) => ({
            label: `${r.type} - ${r.year}`,
            title: r.title,
            subtitle: r.venue,
            href: r.href,
        }))}
    />
);

export default SelectedResearch;