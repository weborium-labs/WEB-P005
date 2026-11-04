import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import apiClient from "../api/apiClient";

interface PublicationItem {
  _id: string;
  type: "journal" | "conference";
  title: string;
  publication_name: string;
  year: number;
  volume_issue?: string;
  indexing?: string;
  redirect_url: string;
  order: number;
}

export const PublicationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"journal" | "conference">("journal");
  const [publications, setPublications] = useState<PublicationItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const USER_ID = "6ad46120cd27224b927ea8bc";

  useEffect(() => {
    const fetchPublications = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.get("/publications", {
          params: {
            user_id: USER_ID,
            type: activeTab,
          },
        });

        if (response.data?.success || response.data?.statusCode === 200) {
          const resData = response.data.data;
          setPublications(resData.items || []);
          setTotalCount(resData.total || 0);
        }
      } catch (err: any) {
        console.error("Failed to fetch publications:", err);
        setError("Failed to load publication records.");
      } finally {
        setLoading(false);
      }
    };

    fetchPublications();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col justify-between font-sans selection:bg-blue-100">
      
      {/* 1. Navbar */}
      <div className="w-full">
        <Navbar />
      </div>

      {/* 2. Main Content Container */}
      <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-12 pt-28 sm:pt-36 pb-16 flex-1">
        
        {/* Header Section: Title & Pill Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 sm:pb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight leading-none">
              Publications
            </h1>
            <p className="mt-2 text-sm text-[#6B7280] font-normal">
              {totalCount} {activeTab === "journal" ? "Journal Papers" : "Conference Papers"}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="inline-flex items-center bg-[#ECEFF3] p-1.5 rounded-full self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("journal")}
              className={`px-5 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
                activeTab === "journal"
                  ? "bg-[#8EC5FC] text-white shadow-sm"
                  : "text-[#4B5563] hover:text-[#111827]"
              }`}
            >
              Journal Paper
            </button>
            <button
              onClick={() => setActiveTab("conference")}
              className={`px-5 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
                activeTab === "conference"
                  ? "bg-[#8EC5FC] text-white shadow-sm"
                  : "text-[#4B5563] hover:text-[#111827]"
              }`}
            >
              Conference Paper
            </button>
          </div>
        </div>

        {/* 3. Cards Section */}
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-full h-32 rounded-[28px] sm:rounded-[36px] bg-[#FFFFFF] border border-[#E5E7EB] p-7 sm:p-9 shadow-[0_4px_24px_rgba(0,0,0,0.02)] animate-pulse flex flex-col justify-between"
                >
                  <div className="h-3 w-32 bg-gray-200 rounded-full" />
                  <div className="h-4 w-3/4 bg-gray-200 rounded-full" />
                  <div className="h-3 w-1/2 bg-gray-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-white rounded-[32px] border border-red-100">
              <p className="text-sm font-medium text-red-500">{error}</p>
              <button
                onClick={() => setActiveTab((prev) => prev)}
                className="mt-4 px-5 py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : publications.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[32px] border border-[#E5E7EB] shadow-sm">
              <p className="text-sm font-medium text-gray-600">
                No {activeTab === "journal" ? "Journal Papers" : "Conference Papers"} found.
              </p>
            </div>
          ) : (
            publications.map((paper) => (
              <a
                key={paper._id}
                href={paper.redirect_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between bg-white hover:bg-[#FAFCFF] border border-[#E5E7EB] hover:border-[#93C5FD] p-6 sm:p-8 lg:p-9 rounded-[28px] sm:rounded-[36px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200"
              >
                {/* Content */}
                <div className="pr-6 flex-1">
                  <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#8C95A6]">
                    {paper.type === "journal" ? "JOURNAL" : "CONFERENCE"} - {paper.year}
                  </div>

                  <h2 className="mt-2 text-sm sm:text-base md:text-[17px] font-bold text-[#111827] group-hover:text-blue-600 transition-colors duration-150 leading-snug">
                    {paper.title}
                  </h2>

                  <p className="mt-2 text-xs sm:text-[13px] text-[#6B7280] font-normal leading-relaxed">
                    <span className="font-medium text-[#4B5563]">
                      {paper.publication_name}
                    </span>
                    {paper.volume_issue ? ` ${paper.volume_issue}` : ""}
                    {paper.indexing ? ` · ${paper.indexing}` : ""}
                  </p>
                </div>

                {/* Custom SVG Arrow with smooth translation & hover state */}
                <div className="flex-shrink-0 pl-4 flex items-center justify-center">
                  <span className="transform transition-transform duration-200 group-hover:translate-x-1 inline-flex">
                    <svg
                      width="8"
                      height="14"
                      viewBox="0 0 8 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="stroke-[#0F172A] group-hover:stroke-blue-600 transition-colors duration-150"
                    >
                      <path
                        d="M0.75005 0.75C0.75005 0.75 6.75 5.1689 6.75 6.75C6.75 8.3312 0.75 12.75 0.75 12.75"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
              </a>
            ))
          )}
        </div>
      </main>

      {/* 4. Footer */}
      <Footer />
    </div>
  );
};

export default PublicationsPage;