import type { ReactNode } from "react";
import {
    AiHealthcareIcon,
    ComputationalBiologyIcon,
    MachineLearningIcon,
    MedicalImagingIcon,
} from "./ResearchIcons";

interface Interest {
    title: string;
    description: string;
    icon: ReactNode;
}

interface ResearchInterestsProps {
    heading?: string;
    items?: Interest[];
    className?: string;
}

const glass =
    "bg-white bg-[linear-gradient(90deg,rgba(255,255,255,0.02)_0%,rgba(0,0,0,0.02)_47.08%,rgba(255,255,255,0.02)_100%)] " +
    "shadow-[inset_4px_0_4px_0_rgba(255,255,255,0.25),inset_0_2px_5px_0_rgba(255,255,255,0.54),2px_2px_120px_0_rgba(0,0,0,0.12)]";

const defaultItems: Interest[] = [
    {
        title: "Machine & Deep Learning",
        description:
            "Hybrid, attention-based and ensemble models for classification and prediction.",
        icon: <MachineLearningIcon />,
    },
    {
        title: "Medical Imaging",
        description:
            "Segmentation and classification across cancer, retinal, thyroid and brain imaging.",
        icon: <MedicalImagingIcon />,
    },
    {
        title: "Computational Biology",
        description:
            "Computational methods for biological sequences and disease control.",
        icon: <ComputationalBiologyIcon />,
    },
    {
        title: "AI in Healthcare",
        description:
            "AI-driven diagnosis, clinical text analysis and anti-cancer drug response.",
        icon: <AiHealthcareIcon />,
    },
];

export const ResearchInterests = ({
    heading = "Research Interests",
    items = defaultItems,
    className = "",
}: ResearchInterestsProps) => {
    return (
        <section className={`w-full px-3 py-12 sm:px-6 lg:px-12 ${className}`}>
            <div className="mx-auto flex max-w-[856px] flex-col items-center gap-9">
                <h2 className="text-center font-['Google_Sans_Flex',sans-serif] text-[28px] font-medium leading-tight text-[#131A28] sm:text-[32px]">
                    {heading}
                </h2>

                <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-x-12 lg:gap-y-8">
                    {items.map((item) => (
                        <article
                            key={item.title}
                            className={`flex flex-col items-start gap-3 overflow-hidden rounded-[36px] p-6 sm:rounded-[48px] sm:p-8 lg:rounded-[64px] lg:px-12 lg:py-10 ${glass}`}
                        >
                            <div className="flex flex-col items-start gap-4">
                                {item.icon}
                                <h3 className="font-['Google_Sans_Flex',sans-serif] text-2xl font-medium leading-tight text-[#131A28]">
                                    {item.title}
                                </h3>
                            </div>
                            <p className="max-w-[305px] font-['Google_Sans_Flex',sans-serif] text-base leading-tight text-[#5B6478]">
                                {item.description}
                            </p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ResearchInterests;