import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import apiClient from "../api/apiClient";
import { usePageHeader, usePageSeo } from "../hooks/usePageContent";

interface EditorialItem {
  id: string;
  title: string;
  link?: string;
}

// Exact placeholder items from the Figma design
const defaultEditorialItems: EditorialItem[] = [
  {
    id: "ed-1",
    title: "Medicon (full journal name, role title and since-year to be confirmed)",
  },
  {
    id: "ed-2",
    title: "PriMera Scientific Engineering (PSEN) (role title and since-year to be confirmed)",
  },
];

const PAGE_SLUG = "editorial-board-memberships";

export const EditorialBoardPage: React.FC = () => {
  usePageSeo(PAGE_SLUG);
  const { heading: pageHeading } = usePageHeader(PAGE_SLUG);
  const [items, setItems] = useState<EditorialItem[]>(defaultEditorialItems);
  const [loading, setLoading] = useState<boolean>(true);

  const slugify = (text: string) =>
    (text || "")
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

  useEffect(() => {
    const fetchEditorialContent = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get("/navbars");
        const navbars = res.data?.data || res.data || [];

        let matchedSubNav: any = null;

        // Traverse navbars to find "Editorial Board Memberships" or "Editorial & Review Service"
        for (const nav of navbars) {
          const subItems = nav.sub_items || [];
          const found = subItems.find((sub: any) => {
            const name = (sub.item_name || "").toLowerCase();
            const sSlug = slugify(name);
            return (
              name.includes("editorial") ||
              sSlug === "editorial-board-memberships" ||
              sSlug === "editorial-review-service" ||
              sSlug === "editorial-review"
            );
          });

          if (found) {
            matchedSubNav = found;
            break;
          }
        }

        if (matchedSubNav && matchedSubNav.page_content) {
          const raw = matchedSubNav.page_content;
          let parsed: EditorialItem[] = [];

          if (Array.isArray(raw)) {
            parsed = raw.map((item: any, idx: number) => ({
              id: item._id || `ed-${idx}`,
              title: typeof item === "string" ? item : item.title || item.name || "",
              link: item.link,
            }));
          } else if (typeof raw === "string" && raw.trim().length > 0) {
            try {
              const json = JSON.parse(raw);
              if (Array.isArray(json)) {
                parsed = json.map((item: any, idx: number) => ({
                  id: item._id || `ed-${idx}`,
                  title: typeof item === "string" ? item : item.title || item.name || "",
                  link: item.link,
                }));
              }
            } catch {
              // Pipe format or newline separated lines
              parsed = raw
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line, idx) => ({
                  id: `ed-${idx}`,
                  title: line,
                }));
            }
          }

          if (parsed.length > 0) {
            setItems(parsed);
          }
        }
      } catch (err) {
        console.warn("Using default editorial items:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEditorialContent();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col justify-between font-['IBM_Plex_Sans',sans-serif] selection:bg-[var(--color-primary-light)] selection:text-[var(--color-text-primary)]">
      
      {/* 1. Header Navigation */}
      <Navbar />

      {/* 2. Main Content Container (Desktop 1440px constraint, Tablet 768px, Mobile 375px) */}
      <main className="w-full max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 pt-28 sm:pt-36 pb-20 flex-1">
        
        {/* Title Header */}
        <div className="pb-8 sm:pb-12 text-left">
          <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-[var(--color-text-heading)] tracking-tight leading-tight">
            {pageHeading ?? "Editorial Board Memberships"}
          </h1>
        </div>

        {/* Content Pills List */}
        {loading ? (
          <div className="space-y-4 sm:space-y-5">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="w-full h-[68px] sm:h-[72px] rounded-[24px] sm:rounded-[36px] bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse px-6 sm:px-8 flex items-center"
              >
                <div className="h-4 w-3/4 bg-[var(--color-border)] rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            {items.map((item) => {
              const Content = (
                <p className="text-[14px] sm:text-[15.5px] font-normal text-[var(--color-text-primary)] leading-relaxed">
                  {item.title}
                </p>
              );

              return item.link ? (
                <a
                  key={item.id}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] hover:border-[var(--color-border-soft)] px-6 sm:px-8 py-4 sm:py-5 rounded-[22px] sm:rounded-[36px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200"
                >
                  {Content}
                </a>
              ) : (
                <div
                  key={item.id}
                  className="flex items-center bg-[var(--color-surface)] border border-[var(--color-border)] px-6 sm:px-8 py-4 sm:py-5 rounded-[22px] sm:rounded-[36px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-200"
                >
                  {Content}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 3. Footer */}
      <Footer pageSlug="footer" />
    </div>
  );
};

export default EditorialBoardPage;