import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import apiClient from "../api/apiClient";
import { usePageHeader, usePageSeo } from "../hooks/usePageContent";

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

const PAGE_SLUG = "publications";

export const PublicationsPage: React.FC = () => {
  usePageSeo(PAGE_SLUG);
  const { heading: pageHeading } = usePageHeader(PAGE_SLUG);
  const [activeTab, setActiveTab] = useState<"journal" | "conference">("journal");
  const [publications, setPublications] = useState<PublicationItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublications = async () => {
      try {
        setLoading(true);
        setError(null);

        // No `user_id` filter: the public catalogue lists every published
        // record the admin manages (the API treats `user_id` as optional).
        const response = await apiClient.get("/publications", {
          params: {
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
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col justify-between font-sans selection:bg-[var(--color-primary-light)]">
      
      {/* 1. Navbar */}
      <div className="w-full">
        <Navbar />
      </div>

      {/* 2. Main Content Container */}
      <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-12 pt-28 sm:pt-36 pb-16 flex-1">
        
        {/* Header Section: Title & Pill Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 sm:pb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-text-heading)] tracking-tight leading-none">
              {pageHeading ?? "Publications"}
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)] font-normal">
              {totalCount} {activeTab === "journal" ? "Journal Papers" : "Conference Papers"}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="inline-flex items-center bg-[var(--color-surface-pill)] p-1.5 rounded-full self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("journal")}
              className={`px-5 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
                activeTab === "journal"
                  ? "bg-[var(--color-accent-soft)] text-[var(--color-text-on-primary)] shadow-sm"
                  : "text-[var(--color-text-subtle)] hover:text-[var(--color-text-heading)]"
              }`}
            >
              Journal Paper
            </button>
            <button
              onClick={() => setActiveTab("conference")}
              className={`px-5 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
                activeTab === "conference"
                  ? "bg-[var(--color-accent-soft)] text-[var(--color-text-on-primary)] shadow-sm"
                  : "text-[var(--color-text-subtle)] hover:text-[var(--color-text-heading)]"
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
                  className="w-full h-32 rounded-[28px] sm:rounded-[36px] bg-[var(--color-surface)] border border-[var(--color-border)] p-7 sm:p-9 shadow-[0_4px_24px_rgba(0,0,0,0.02)] animate-pulse flex flex-col justify-between"
                >
                  <div className="h-3 w-32 bg-[var(--color-border)] rounded-full" />
                  <div className="h-4 w-3/4 bg-[var(--color-border)] rounded-full" />
                  <div className="h-3 w-1/2 bg-[var(--color-surface-muted)] rounded-full" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-[var(--color-surface)] rounded-[32px] border border-red-100">
              <p className="text-sm font-medium text-red-500">{error}</p>
              <button
                onClick={() => setActiveTab((prev) => prev)}
                className="mt-4 px-5 py-2 text-xs font-semibold bg-[var(--color-surface-muted)] hover:bg-[var(--color-border)] rounded-full text-[var(--color-text-body)] transition-colors"
              >
                Retry
              </button>
            </div>
          ) : publications.length === 0 ? (
            <div className="text-center py-20 bg-[var(--color-surface)] rounded-[32px] border border-[var(--color-border)] shadow-sm">
              <p className="text-sm font-medium text-[var(--color-text-subtle)]">
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
                className="group flex items-center justify-between bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] hover:border-[var(--color-accent-soft)] p-6 sm:p-8 lg:p-9 rounded-[28px] sm:rounded-[36px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200"
              >
                {/* Content */}
                <div className="pr-6 flex-1">
                  <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[var(--color-text-faint)]">
                    {paper.type === "journal" ? "JOURNAL" : "CONFERENCE"} - {paper.year}
                  </div>

                  <h2 className="mt-2 text-sm sm:text-base md:text-[17px] font-bold text-[var(--color-text-heading)] group-hover:text-[var(--color-accent-strong)] transition-colors duration-150 leading-snug">
                    {paper.title}
                  </h2>

                  <p className="mt-2 text-xs sm:text-[13px] text-[var(--color-text-muted)] font-normal leading-relaxed">
                    <span className="font-medium text-[var(--color-text-subtle)]">
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
                      className="stroke-[var(--color-icon-strong)] group-hover:stroke-[var(--color-accent-strong)] transition-colors duration-150"
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
      <Footer pageSlug="footer" />
    </div>
  );
};

export default PublicationsPage;