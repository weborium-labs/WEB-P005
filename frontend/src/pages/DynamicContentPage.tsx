import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import apiClient from "../api/apiClient";

interface PageCardItem {
  id: string;
  title: string;
  description?: string;
  link?: string;
}

export const DynamicContentPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [pageTitle, setPageTitle] = useState<string>("");
  const [items, setItems] = useState<PageCardItem[]>([]);
  const [itemType, setItemType] = useState<string>("default");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const slugify = (text: string) =>
    (text || "")
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

  useEffect(() => {
    const fetchPageContent = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await apiClient.get("/navbars");
        const navbars = res.data?.data || res.data || [];

        let matchedSubNav: any = null;

        // Traverse all navbars and their sub_items
        for (const nav of navbars) {
          const subList = nav.sub_items || [];
          const found = subList.find((sub: any) => {
            const subSlug = slugify(sub.item_name || "");
            return subSlug === slug || sub._id === slug;
          });

          if (found) {
            matchedSubNav = found;
            break;
          }
        }

        // Hardcoded fallback data if admin has not populated it yet in MongoDB
        if (!matchedSubNav && slug === "courses-taught") {
          matchedSubNav = {
            item_name: "Courses Taught",
            item_type: "courses",
            page_content: [
              {
                title: "Theory of Computation",
                description: "Explores automata, formal languages, and the limits of what machines can compute.",
              },
              {
                title: "Data Structures",
                description: "Covers the organization of data and the algorithms that store, search, and manage it efficiently.",
              },
              {
                title: "Machine Learning",
                description: "Teaches how systems learn patterns from data to make predictions and informed decisions.",
              },
              {
                title: "Artificial Intelligence",
                description: "Introduces intelligent agents, search, reasoning, and the principles behind modern AI systems.",
              },
              {
                title: "C Programming",
                description: "Builds foundational programming skills through structured problem solving in C.",
              },
            ],
          };
        }

        if (!matchedSubNav) {
          setError("This page could not be found or has not been created yet.");
          return;
        }

        setPageTitle(matchedSubNav.item_name || "Page");
        setItemType(matchedSubNav.item_type || "default");

        // Parse page_content (JSON string, Object Array, or pipe-separated multiline text)
        const rawContent = matchedSubNav.page_content;
        let parsedCards: PageCardItem[] = [];

        if (Array.isArray(rawContent)) {
          parsedCards = rawContent.map((item: any, idx: number) => ({
            id: item._id || `card-${idx}`,
            title: typeof item === "string" ? item : item.title || item.name || "",
            description: item.description || "",
            link: item.link,
          }));
        } else if (typeof rawContent === "string" && rawContent.trim().length > 0) {
          try {
            const json = JSON.parse(rawContent);
            if (Array.isArray(json)) {
              parsedCards = json.map((item: any, idx: number) => ({
                id: `card-${idx}`,
                title: typeof item === "string" ? item : item.title || "",
                description: item.description || "",
                link: item.link,
              }));
            } else {
              parsedCards = [{ id: "card-0", title: rawContent }];
            }
          } catch {
            // Handles multiline input e.g. "Theory of Computation | Explores automata..."
            parsedCards = rawContent
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line, idx) => {
                if (line.includes("|")) {
                  const [t, d] = line.split("|");
                  return { id: `card-${idx}`, title: t.trim(), description: d.trim() };
                }
                return { id: `card-${idx}`, title: line };
              });
          }
        }

        setItems(parsedCards);
      } catch (err: any) {
        console.error("Error fetching dynamic page:", err);
        setError("Error loading page content.");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPageContent();
    }
  }, [slug]);

  // Determine if layout should be grid cards (Courses Taught) or horizontal full-width list
  const isGridLayout =
    itemType === "courses" ||
    slug === "courses-taught" ||
    items.some((item) => Boolean(item.description));

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col justify-between font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-28 sm:pt-36 pb-20 flex-1">
        {loading ? (
          <div className="space-y-6">
            <div className="h-9 w-64 bg-gray-200 rounded-full animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-full h-44 rounded-[28px] sm:rounded-[36px] bg-white border border-[#E5E7EB] animate-pulse"
                />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-24 bg-white rounded-[32px] border border-[#E5E7EB] shadow-sm">
            <h2 className="text-xl font-bold text-gray-800">Page Not Found</h2>
            <p className="mt-2 text-sm text-gray-500">{error}</p>
            <Link
              to="/"
              className="mt-6 inline-block px-6 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-full hover:bg-blue-700 transition-colors"
            >
              Return Home
            </Link>
          </div>
        ) : (
          <div>
            {/* Page Title */}
            <div className="pb-8 sm:pb-12">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#111827] tracking-tight leading-tight">
                {pageTitle}
              </h1>
            </div>

            {/* Layout Switch: 3-Column Grid for Courses Taught vs Full Width for Lists */}
            {isGridLayout ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {items.map((course) => (
                  <div
                    key={course.id}
                    className="flex flex-col justify-start bg-white border border-[#E5E7EB] p-6 sm:p-8 rounded-[28px] sm:rounded-[36px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-[#CBD5E1] transition-all duration-200 min-h-[160px]"
                  >
                    <h2 className="text-lg sm:text-[19px] font-bold text-[#111827] leading-snug">
                      {course.title}
                    </h2>
                    {course.description && (
                      <p className="mt-3 text-xs sm:text-[13px] text-[#6B7280] leading-relaxed">
                        {course.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-5">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-white border border-[#E5E7EB] px-6 sm:px-8 py-5 rounded-[24px] sm:rounded-[36px] shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
                  >
                    <p className="text-sm sm:text-base font-medium text-[#374151] leading-relaxed">
                      {item.title}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default DynamicContentPage;