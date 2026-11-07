import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import apiClient from "../api/apiClient";

interface CourseItem {
  id: string;
  title: string;
  description: string;
}

// Exact fallback data matching Figma mockup
const defaultCourses: CourseItem[] = [
  {
    id: "course-1",
    title: "Theory of Computation",
    description:
      "Explores automata, formal languages, and the limits of what machines can compute.",
  },
  {
    id: "course-2",
    title: "Data Structures",
    description:
      "Covers the organization of data and the algorithms that store, search, and manage it efficiently.",
  },
  {
    id: "course-3",
    title: "Machine Learning",
    description:
      "Teaches how systems learn patterns from data to make predictions and informed decisions.",
  },
  {
    id: "course-4",
    title: "Artificial Intelligence",
    description:
      "Introduces intelligent agents, search, reasoning, and the principles behind modern AI systems.",
  },
  {
    id: "course-5",
    title: "C Programming",
    description:
      "Builds foundational programming skills through structured problem solving in C.",
  },
];

export const CoursesTaughtPage: React.FC = () => {
  const [courses, setCourses] = useState<CourseItem[]>(defaultCourses);
  const [loading, setLoading] = useState<boolean>(true);

  const slugify = (text: string) =>
    (text || "")
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

  useEffect(() => {
    const fetchCoursesFromApi = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get("/navbars");
        const navbars = res.data?.data || res.data || [];

        let foundSubNav: any = null;

        // Search for "Courses Taught" inside the navbars
        for (const nav of navbars) {
          const subItems = nav.sub_items || [];
          const matched = subItems.find((sub: any) => {
            const name = (sub.item_name || "").toLowerCase();
            return name.includes("course") || slugify(name) === "courses-taught";
          });

          if (matched) {
            foundSubNav = matched;
            break;
          }
        }

        if (foundSubNav && foundSubNav.page_content) {
          const raw = foundSubNav.page_content;
          let parsed: CourseItem[] = [];

          if (Array.isArray(raw)) {
            parsed = raw.map((item: any, idx: number) => ({
              id: item._id || `c-${idx}`,
              title: typeof item === "string" ? item : item.title || item.name || "",
              description: item.description || "",
            }));
          } else if (typeof raw === "string" && raw.trim().length > 0) {
            try {
              const json = JSON.parse(raw);
              if (Array.isArray(json)) {
                parsed = json.map((item: any, idx: number) => ({
                  id: item._id || `c-${idx}`,
                  title: item.title || item.name || "",
                  description: item.description || "",
                }));
              }
            } catch {
              // Supports multiline formatted text: "Title | Description"
              parsed = raw
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line, idx) => {
                  if (line.includes("|")) {
                    const [t, d] = line.split("|");
                    return { id: `c-${idx}`, title: t.trim(), description: d.trim() };
                  }
                  return { id: `c-${idx}`, title: line, description: "" };
                });
            }
          }

          if (parsed.length > 0) {
            setCourses(parsed);
          }
        }
      } catch (err) {
        // Keeps defaultCourses on error
        console.warn("Using default courses data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCoursesFromApi();
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col justify-between font-['IBM_Plex_Sans',sans-serif] selection:bg-blue-100 selection:text-blue-900">
      
      {/* 1. Header Navigation */}
      <Navbar />

      {/* 2. Main Content Container (PC: 1440px constraint, Tablet: 768px, Mobile: 375px) */}
      <main className="w-full max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 pt-28 sm:pt-36 pb-20 flex-1">
        
        {/* Page Title */}
        <div className="pb-8 sm:pb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-[#111827] tracking-tight leading-tight">
            Courses Taught
          </h1>
        </div>

        {/* Course Cards Responsive Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-full h-[155px] sm:h-[165px] rounded-[24px] sm:rounded-[32px] bg-white border border-[#E5E7EB] animate-pulse p-6"
              >
                <div className="h-5 w-3/4 bg-gray-200 rounded-full" />
                <div className="mt-4 h-3 w-full bg-gray-100 rounded-full" />
                <div className="mt-2 h-3 w-5/6 bg-gray-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="flex flex-col justify-start bg-white border border-[#E5E7EB] hover:border-[#CBD5E1] p-6 sm:p-7 rounded-[26px] sm:rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 min-h-[155px] sm:min-h-[165px]"
              >
                {/* Course Name */}
                <h2 className="text-[17px] sm:text-[18px] font-semibold text-[#111827] leading-snug">
                  {course.title}
                </h2>

                {/* Course Description */}
                {course.description && (
                  <p className="mt-2.5 text-[13px] sm:text-[13.5px] text-[#6B7280] leading-[1.6]">
                    {course.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 3. Footer */}
      <Footer />
    </div>
  );
};

export default CoursesTaughtPage;