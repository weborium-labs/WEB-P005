import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import apiClient from "../api/apiClient";
import { usePageHeader, usePageSeo } from "../hooks/usePageContent";

interface MentorshipItem {
  id: string;
  studentName?: string;
  title: string;
  category?: string;
  link?: string;
}

// Exact content from your Figma mockup
const defaultMentorshipData: MentorshipItem[] = [
  {
    id: "m-1",
    studentName: "Siya Patel",
    title: "Smart Pharmaceutical Systems: Deep Learning Model, Dashboard, and Website Development",
    category: "AI & Deep Learning",
  },
  {
    id: "m-2",
    studentName: "Aarav Shrestha",
    title: "Creating an Intuitive Real-Time Web Trading Interface at WealthAffinity Softech",
    category: "Large-Scale Web Platform",
  },
  {
    id: "m-3",
    studentName: "Meet Vaghasia",
    title: "School ERP System Implementation and Customization",
    category: "Enterprise Software",
  },
  {
    id: "m-4",
    studentName: "Prithvi Vijaykumar Thakkar",
    title: "Kanoon Konnect – Where Law Meets You",
    category: "LegalTech Platform",
  },
  {
    id: "m-5",
    studentName: "Vatsalya Rathi",
    title: "Improving the Efficiency of Big Data Driven Applications and Optimising Real-Time Data Engineering Workflows by Leveraging PySpark for Smarter Decision Making",
    category: "Big Data & Data Engineering",
  },
  {
    id: "m-6",
    studentName: "Rishi Parvez Desai",
    title: "VoteApp: A Scalable Microservices with Kubernetes, Terraform, and Azure DevOps",
    category: "Cloud & DevOps",
  },
  {
    id: "m-7",
    studentName: "Anshi Chaturvedi",
    title: "Conga Revenue Lifecycle Management",
    category: "Enterprise Software",
  },
  {
    id: "m-8",
    studentName: "Dhruvi Bharat Unadkat",
    title: "Optimizing Golf Club Management – A Multiuser Platform",
    category: "Web Applications",
  },
  {
    id: "m-9",
    studentName: "Divraj Dixit",
    title: "QR Code Attendance",
    category: "IoT & Mobile Application",
  },
  {
    id: "m-10",
    studentName: "Khushi Vala",
    title: "DARA PMS",
    category: "Property Management",
  },
  {
    id: "m-11",
    studentName: "Kewal Dave",
    title: "AI-Driven Image and Video Analytics for Real-Time Posture Detection and Safety Monitoring in Industry",
    category: "Pure Computer Vision",
  },
];

const PAGE_SLUG = "mentorship";

export const MentorshipPage: React.FC = () => {
  usePageSeo(PAGE_SLUG);
  const { heading: pageHeading, description: pageDescription, stats: pageStats } =
    usePageHeader(PAGE_SLUG);
  // `undefined` = no API answer yet (keep the static badge); `[]` = the admin
  // cleared the stat block, so nothing renders.
  const mentorStat =
    pageStats === undefined ? { value: "10+", label: "Students Mentored" } : pageStats[0];
  const [mentorshipList, setMentorshipList] = useState<MentorshipItem[]>(defaultMentorshipData);
  const [loading, setLoading] = useState<boolean>(true);

  const slugify = (text: string) =>
    (text || "")
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

  useEffect(() => {
    const fetchMentorshipContent = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get("/navbars");
        const navbars = res.data?.data || res.data || [];

        let matchedData: any = null;

        // Traverse navbars to find "Mentorship"
        for (const nav of navbars) {
          const navLabel = (nav.item_name || "").toLowerCase();
          if (navLabel.includes("mentor") || slugify(navLabel) === "mentorship") {
            matchedData = nav;
            break;
          }

          const subItems = nav.sub_items || [];
          const matchedSub = subItems.find((sub: any) => {
            const subLabel = (sub.item_name || "").toLowerCase();
            return subLabel.includes("mentor") || slugify(subLabel) === "mentorship";
          });

          if (matchedSub) {
            matchedData = matchedSub;
            break;
          }
        }

        if (matchedData && matchedData.page_content) {
          const raw = matchedData.page_content;
          let parsed: MentorshipItem[] = [];

          if (Array.isArray(raw)) {
            parsed = raw.map((item: any, idx: number) => ({
              id: item._id || `m-dyn-${idx}`,
              studentName: item.studentName || item.student_name || item.subtitle || "",
              title: item.title || item.name || (typeof item === "string" ? item : ""),
              category: item.category || item.tag || "",
              link: item.link,
            }));
          } else if (typeof raw === "string" && raw.trim().length > 0) {
            try {
              const json = JSON.parse(raw);
              if (Array.isArray(json)) {
                parsed = json.map((item: any, idx: number) => ({
                  id: item._id || `m-dyn-${idx}`,
                  studentName: item.studentName || item.student_name || "",
                  title: item.title || item.name || "",
                  category: item.category || "",
                  link: item.link,
                }));
              }
            } catch {
              // Pipe format: Student Name | Project Title | Category
              parsed = raw
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line, idx) => {
                  const parts = line.split("|").map((p) => p.trim());
                  return {
                    id: `m-dyn-${idx}`,
                    studentName: parts.length > 2 ? parts[0] : "",
                    title: parts.length > 2 ? parts[1] : parts[0],
                    category: parts.length > 2 ? parts[2] : parts[1] || "",
                  };
                });
            }
          }

          if (parsed.length > 0) {
            setMentorshipList(parsed);
          }
        }
      } catch (err) {
        console.warn("Using fallback mentorship data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMentorshipContent();
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col justify-between font-['IBM_Plex_Sans',sans-serif] selection:bg-blue-100 selection:text-blue-900">
      
      {/* 1. Header Navigation */}
      <Navbar />

      {/* 2. Main Content */}
      <main className="w-full max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 pt-28 sm:pt-36 pb-20 flex-1">
        
        {/* Title Header */}
        <div className="pb-6 sm:pb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-[#111827] tracking-tight leading-tight">
            {pageHeading ?? "Mentorship"}
          </h1>
        </div>

        {/* Counter Badge & Intro Section */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 pb-10 sm:pb-12 border-b border-[#F0F2F5]">
          {/* 10+ Students Mentored Rounded Card */}
          {mentorStat && (
            <div className="flex flex-col items-center justify-center bg-[#F9FAFB] border border-[#E5E7EB] rounded-[24px] sm:rounded-[28px] px-6 py-4 min-w-[140px] w-fit shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#111827] leading-none">
                {mentorStat.value}
              </span>
              <span className="text-[12px] sm:text-[13px] font-medium text-[#6B7280] mt-1 text-center whitespace-nowrap">
                {mentorStat.label}
              </span>
            </div>
          )}

          {/* Subtext description */}
          <p className="text-xs sm:text-[13.5px] text-[#6B7280] leading-relaxed max-w-2xl">
            {pageDescription ??
              "I have guided students and early-career researchers across numerous research publications, projects, and academic outcomes. A dedicated directory of supervised students and projects will be listed here once finalized."}
          </p>
        </div>

        {/* Mentorship Project Cards (2 columns on Desktop, 1 column on Tablet/Mobile) */}
        <div className="pt-8">
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="w-full h-32 rounded-[28px] sm:rounded-[36px] bg-white border border-[#E5E7EB] animate-pulse p-6"
                >
                  <div className="h-4 w-28 bg-gray-200 rounded-full" />
                  <div className="mt-3 h-5 w-4/5 bg-gray-100 rounded-full" />
                  <div className="mt-3 h-3 w-1/3 bg-gray-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {mentorshipList.map((item) => {
                const CardInner = (
                  <div className="flex items-center justify-between w-full h-full gap-4">
                    <div className="flex flex-col justify-center flex-1">
                      {/* Student Name */}
                      {item.studentName && (
                        <span className="text-[11px] sm:text-[12px] font-medium text-[#9CA3AF] tracking-wide mb-1">
                          {item.studentName}
                        </span>
                      )}

                      {/* Project Title */}
                      <h2 className="text-[14.5px] sm:text-[15.5px] font-semibold text-[#111827] leading-snug line-clamp-2">
                        {item.title}
                      </h2>

                      {/* Category Tag */}
                      {item.category && (
                        <span className="mt-2 text-[11px] sm:text-[12px] font-normal text-[#9CA3AF]">
                          {item.category}
                        </span>
                      )}
                    </div>

                    {/* Chevron Arrow */}
                    <div className="shrink-0 flex items-center justify-center pl-2">
                      <svg
                        width="8"
                        height="14"
                        viewBox="0 0 8 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="stroke-[#9CA3AF] group-hover:stroke-[#111827] group-hover:translate-x-0.5 transition-all duration-200"
                      >
                        <path
                          d="M0.75005 0.75C0.75005 0.75 6.75 5.1689 6.75 6.75C6.75 8.3312 0.75 12.75 0.75 12.75"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                );

                return item.link ? (
                  <a
                    key={item.id}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center bg-white border border-[#E5E7EB] hover:border-[#CBD5E1] px-6 sm:px-8 py-5 rounded-[24px] sm:rounded-[32px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200"
                  >
                    {CardInner}
                  </a>
                ) : (
                  <div
                    key={item.id}
                    className="group flex items-center bg-white border border-[#E5E7EB] hover:border-[#CBD5E1] px-6 sm:px-8 py-5 rounded-[24px] sm:rounded-[32px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 cursor-default"
                  >
                    {CardInner}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* 3. Footer */}
      <Footer pageSlug="footer" />
    </div>
  );
};

export default MentorshipPage;