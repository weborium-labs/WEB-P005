import React, { useEffect, useState, useMemo } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import apiClient from "../api/apiClient";
import { usePageHeader, usePageSeo } from "../hooks/usePageContent";

interface PatentItem {
  id: string;
  status: "GRANTED" | "PUBLISHED";
  title: string;
  applicationNumber: string;
  link?: string;
}

// Exact dataset from your Figma mockup
const defaultPatents: PatentItem[] = [
  // Granted Patents
  {
    id: "pat-g-1",
    status: "GRANTED",
    title: "AI-powered mood detection wrist band for children",
    applicationNumber: "Application No. 202411012341",
  },
  {
    id: "pat-g-2",
    status: "GRANTED",
    title: "AI based gesture control system for medical drones",
    applicationNumber: "Application No. 202411012342",
  },
  {
    id: "pat-g-3",
    status: "GRANTED",
    title: "Smart automated diagnostic imaging scanner platform",
    applicationNumber: "Application No. 202411012343",
  },

  // Published Patents
  {
    id: "pat-p-1",
    status: "PUBLISHED",
    title: "Machine Learning based Single-Cell RNA Sequencing for Targeted Anticancer Drug Discovery",
    applicationNumber: "Application No. 202412102344",
  },
  {
    id: "pat-p-2",
    status: "PUBLISHED",
    title: "Hierarchical Reinforcement Learning System with Transferable Knowledge Modules for Autonomous Decision-Making in Robotics",
    applicationNumber: "Application No. 202412102345",
  },
  {
    id: "pat-p-3",
    status: "PUBLISHED",
    title: "Neuro-Adaptive Generative AI based Real-time Rendering of Hyper-Realistic Interactive Environments in Virtual Reality",
    applicationNumber: "Application No. 202412102346",
  },
  {
    id: "pat-p-4",
    status: "PUBLISHED",
    title: "Gaganray Cloud Control Device – Decentralized Supercomputer",
    applicationNumber: "Application No. 202412102347",
  },
  {
    id: "pat-p-5",
    status: "PUBLISHED",
    title: "AI-Based Personalized Herbal Drink Recommender System for Health Optimization",
    applicationNumber: "Application No. 202412102348",
  },
  {
    id: "pat-p-6",
    status: "PUBLISHED",
    title: "AI-Powered Multimodal Healthcare System For Elderly Healthcare",
    applicationNumber: "Application No. 202412102349",
  },
  {
    id: "pat-p-7",
    status: "PUBLISHED",
    title: "Portable Offline Translator for Sign Language and Speech Using Deep Learning",
    applicationNumber: "Application No. 202412102350",
  },
];

const PAGE_SLUG = "patents";

export const PatentsPage: React.FC = () => {
  usePageSeo(PAGE_SLUG);
  const { heading: pageHeading } = usePageHeader(PAGE_SLUG);
  const [activeTab, setActiveTab] = useState<"PUBLISHED" | "GRANTED">("PUBLISHED");
  const [patents, setPatents] = useState<PatentItem[]>(defaultPatents);
  const [loading, setLoading] = useState<boolean>(true);

  const slugify = (text: string) =>
    (text || "")
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

  useEffect(() => {
    const fetchPatentsContent = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get("/navbars");
        const navbars = res.data?.data || res.data || [];

        let matchedData: any = null;

        // Traverse navbars to find "Patents"
        for (const nav of navbars) {
          const navLabel = (nav.item_name || "").toLowerCase();
          if (navLabel.includes("patent") || slugify(navLabel) === "patents") {
            matchedData = nav;
            break;
          }

          const subItems = nav.sub_items || [];
          const matchedSub = subItems.find((sub: any) => {
            const subLabel = (sub.item_name || "").toLowerCase();
            return subLabel.includes("patent") || slugify(subLabel) === "patents";
          });

          if (matchedSub) {
            matchedData = matchedSub;
            break;
          }
        }

        if (matchedData && matchedData.page_content) {
          const raw = matchedData.page_content;
          let parsed: PatentItem[] = [];

          if (Array.isArray(raw)) {
            parsed = raw.map((item: any, idx: number) => ({
              id: item._id || `pat-${idx}`,
              status: (item.status || "PUBLISHED").toUpperCase() as "GRANTED" | "PUBLISHED",
              title: item.title || item.name || (typeof item === "string" ? item : ""),
              applicationNumber: item.applicationNumber || item.app_no || item.application_number || "",
              link: item.link,
            }));
          } else if (typeof raw === "string" && raw.trim().length > 0) {
            try {
              const json = JSON.parse(raw);
              if (Array.isArray(json)) {
                parsed = json.map((item: any, idx: number) => ({
                  id: item._id || `pat-${idx}`,
                  status: (item.status || "PUBLISHED").toUpperCase() as "GRANTED" | "PUBLISHED",
                  title: item.title || item.name || "",
                  applicationNumber: item.applicationNumber || item.app_no || item.application_number || "",
                  link: item.link,
                }));
              }
            } catch {
              // Pipe format: STATUS | Title | Application No
              parsed = raw
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line, idx) => {
                  const parts = line.split("|").map((p) => p.trim());
                  const hasStatus = parts[0]?.toUpperCase() === "GRANTED" || parts[0]?.toUpperCase() === "PUBLISHED";
                  return {
                    id: `pat-${idx}`,
                    status: (hasStatus ? parts[0].toUpperCase() : "PUBLISHED") as "GRANTED" | "PUBLISHED",
                    title: hasStatus ? parts[1] || "" : parts[0],
                    applicationNumber: hasStatus ? parts[2] || "" : parts[1] || "",
                  };
                });
            }
          }

          if (parsed.length > 0) {
            setPatents(parsed);
          }
        }
      } catch (err) {
        console.warn("Using default patents dataset:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatentsContent();
  }, []);

  // Filter patents based on active tab
  const filteredPatents = useMemo(() => {
    return patents.filter((p) => p.status === activeTab);
  }, [patents, activeTab]);

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col justify-between font-['IBM_Plex_Sans',sans-serif] selection:bg-blue-100 selection:text-blue-900">
      
      {/* 1. Header Navigation */}
      <Navbar />

      {/* 2. Main Content Container (Desktop: 1440px constraint, Tablet: 768px, Mobile: 375px) */}
      <main className="w-full max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 pt-28 sm:pt-36 pb-20 flex-1">
        
        {/* Top Header Row with Title and Tab Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-[#111827] tracking-tight leading-tight">
              {pageHeading ?? "Patents"}
            </h1>
            <p className="mt-1 text-[13px] text-[#6B7280]">
              {filteredPatents.length} {activeTab === "GRANTED" ? "Granted" : "Published"}
            </p>
          </div>

          {/* Granted / Published Pill Switcher */}
          <div className="inline-flex items-center bg-[#F3F4F6] p-1 rounded-full border border-[#E5E7EB] w-fit self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab("GRANTED")}
              className={`px-5 py-2 text-[13px] sm:text-[14px] font-medium rounded-full transition-all duration-200 ${
                activeTab === "GRANTED"
                  ? "bg-[#3B82F6] text-white shadow-sm"
                  : "text-[#4B5563] hover:text-[#111827]"
              }`}
            >
              Granted
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("PUBLISHED")}
              className={`px-5 py-2 text-[13px] sm:text-[14px] font-medium rounded-full transition-all duration-200 ${
                activeTab === "PUBLISHED"
                  ? "bg-[#3B82F6] text-white shadow-sm"
                  : "text-[#4B5563] hover:text-[#111827]"
              }`}
            >
              Published
            </button>
          </div>
        </div>

        {/* Patents Cards Feed */}
        <div className="mt-6 space-y-4 sm:space-y-5">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-full h-24 rounded-[26px] sm:rounded-[36px] bg-white border border-[#E5E7EB] animate-pulse p-6"
              >
                <div className="h-3 w-20 bg-gray-200 rounded-full" />
                <div className="mt-3 h-4 w-4/5 bg-gray-100 rounded-full" />
                <div className="mt-2 h-3 w-1/3 bg-gray-100 rounded-full" />
              </div>
            ))
          ) : filteredPatents.length > 0 ? (
            filteredPatents.map((item) => {
              const CardContent = (
                <div className="flex items-center justify-between w-full gap-4">
                  <div className="flex-1 pr-2">
                    {/* Status Badge */}
                    <span className="text-[11px] sm:text-[11.5px] font-semibold text-[#9CA3AF] tracking-wider uppercase block mb-1">
                      {item.status}
                    </span>

                    {/* Patent Title */}
                    <h2 className="text-[14.5px] sm:text-[15.5px] font-semibold text-[#111827] leading-snug">
                      {item.title}
                    </h2>

                    {/* Application Number */}
                    {item.applicationNumber && (
                      <p className="mt-1 text-[12px] sm:text-[12.5px] text-[#6B7280]">
                        {item.applicationNumber}
                      </p>
                    )}
                  </div>

                  {/* Arrow Indicator */}
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
                  className="group flex items-center bg-white border border-[#E5E7EB] hover:border-[#CBD5E1] px-6 sm:px-8 py-5 rounded-[24px] sm:rounded-[36px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200"
                >
                  {CardContent}
                </a>
              ) : (
                <div
                  key={item.id}
                  className="group flex items-center bg-white border border-[#E5E7EB] hover:border-[#CBD5E1] px-6 sm:px-8 py-5 rounded-[24px] sm:rounded-[36px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 cursor-default"
                >
                  {CardContent}
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 bg-white rounded-[32px] border border-[#E5E7EB]">
              <p className="text-sm text-gray-500">No {activeTab.toLowerCase()} patents found.</p>
            </div>
          )}
        </div>
      </main>

      {/* 3. Footer */}
      <Footer pageSlug="footer" />
    </div>
  );
};

export default PatentsPage;