import React, { useEffect, useState, useCallback } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import apiClient from "../api/apiClient";

interface GlimpseItem {
  _id: string;
  user_id: string;
  image_url: string;
  public_id: string;
  order: number;
  createdAt: string;
}

const ITEMS_PER_PAGE = 11;

export const GlimpsesPage: React.FC = () => {
  const [glimpses, setGlimpses] = useState<GlimpseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modal / Zoom Lightbox State (index in the full glimpses array)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  // 1. Fetch Glimpses (Public - open for everyone)
  useEffect(() => {
    const fetchGlimpses = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.get("/glimpses");

        if (response.data?.success || response.data?.statusCode === 200) {
          const resData = response.data.data;
          setGlimpses(resData.items || []);
        }
      } catch (err: any) {
        console.error("Failed to load glimpses:", err);
        setError("Failed to load glimpses gallery.");
      } finally {
        setLoading(false);
      }
    };

    fetchGlimpses();
  }, []);

  // 2. Pagination Calculations
  const totalItems = glimpses.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedGlimpses = glimpses.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // 3. Lightbox Navigation Helpers
  const handlePrevPhoto = useCallback(() => {
    setSelectedPhotoIndex((prev) => {
      if (prev === null || glimpses.length <= 1) return prev;
      return prev === 0 ? glimpses.length - 1 : prev - 1;
    });
  }, [glimpses.length]);

  const handleNextPhoto = useCallback(() => {
    setSelectedPhotoIndex((prev) => {
      if (prev === null || glimpses.length <= 1) return prev;
      return (prev + 1) % glimpses.length;
    });
  }, [glimpses.length]);

  // 4. Keyboard Navigation (Escape, Left Arrow, Right Arrow)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoIndex === null) return;
      if (e.key === "Escape") setSelectedPhotoIndex(null);
      if (e.key === "ArrowLeft") handlePrevPhoto();
      if (e.key === "ArrowRight") handleNextPhoto();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPhotoIndex, handlePrevPhoto, handleNextPhoto]);

  // 5. Asymmetrical Bento Grid Rhythm (Desktop 4-column flow)
  const getBentoSpanClass = (index: number) => {
    const pattern = index % 11;
    switch (pattern) {
      case 0:
      case 5:
      case 7:
      case 9:
      case 10:
        return "md:col-span-2 md:row-span-1 h-[240px] sm:h-[280px]";
      default:
        return "md:col-span-1 md:row-span-1 h-[240px] sm:h-[280px]";
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col justify-between font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Navbar */}
      <div className="w-full">
        <Navbar />
      </div>

      {/* Main Container - Matches Footer width constraints */}
      <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-12 pt-28 sm:pt-36 pb-16 flex-1">
        
        {/* Title Header */}
        <div className="pb-8 sm:pb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight leading-none">
            Glimpses
          </h1>
          <p className="mt-2 text-sm text-[#6B7280] font-normal">
            Moments, academic sessions, and campus interactions ({totalItems} Photos)
          </p>
        </div>

        {/* Gallery Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`w-full rounded-[28px] sm:rounded-[36px] bg-[#E5E7EB]/70 animate-pulse border border-gray-200/80 ${
                  i % 2 === 0 ? "h-64 md:col-span-2" : "h-64 md:col-span-1"
                }`}
              />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-white rounded-[32px] border border-red-100">
            <p className="text-sm font-medium text-red-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-full text-gray-800 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : glimpses.length === 0 ? (
          <div className="text-center py-24 bg-[#F9FAFB] rounded-[36px] border border-dashed border-[#D1D5DB]">
            <p className="text-base font-semibold text-gray-700">No Glimpses Uploaded Yet</p>
            <p className="mt-1 text-xs text-gray-500">Photos will appear here once uploaded via the admin portal.</p>
          </div>
        ) : (
          /* Gallery Grid */
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
            {paginatedGlimpses.map((photo, index) => {
              const globalIndex = startIndex + index;
              return (
                <div
                  key={photo._id}
                  onClick={() => setSelectedPhotoIndex(globalIndex)}
                  className={`group relative overflow-hidden rounded-[28px] sm:rounded-[36px] bg-[#E5E7EB] border border-[#E5E7EB] shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-lg transition-all duration-300 cursor-pointer ${getBentoSpanClass(
                    index
                  )}`}
                >
                  <img
                    src={photo.image_url}
                    alt="Campus glimpse"
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />

                  {/* Hover indicator */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm text-gray-800 flex items-center justify-center shadow-md transform scale-75 group-hover:scale-100 transition-transform duration-300">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        <line x1="11" y1="8" x2="11" y2="14" />
                        <line x1="8" y1="11" x2="14" y2="11" />
                      </svg>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-full border border-gray-200 text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-9 h-9 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  currentPage === pageNum
                    ? "bg-[#8EC5FC] text-white shadow-sm"
                    : "text-gray-600 bg-white border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-full border border-gray-200 text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        )}

      </main>

      {/* Lightbox Zoom Modal */}
      {selectedPhotoIndex !== null && glimpses[selectedPhotoIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedPhotoIndex(null)}
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 select-none"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPhotoIndex(null);
            }}
            className="absolute top-6 right-6 z-[120] w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg"
            aria-label="Close modal"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Previous Arrow Button */}
          {glimpses.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevPhoto();
              }}
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-[120] w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/15 hover:bg-white/30 active:scale-95 text-white flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xl backdrop-blur-sm group"
              aria-label="Previous photo"
            >
              <svg
                width="14"
                height="22"
                viewBox="0 0 8 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-white rotate-180 transform group-hover:-translate-x-0.5 transition-transform"
              >
                <path
                  d="M0.75005 0.75C0.75005 0.75 6.75 5.1689 6.75 6.75C6.75 8.3312 0.75 12.75 0.75 12.75"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}

          {/* Active Image Container */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[85vh] flex items-center justify-center rounded-[28px] sm:rounded-[36px] overflow-hidden bg-transparent shadow-2xl"
          >
            <img
              src={glimpses[selectedPhotoIndex].image_url}
              alt="Zoomed Glimpse"
              className="max-w-full max-h-[80vh] w-auto h-auto object-contain rounded-[28px] sm:rounded-[36px] shadow-2xl"
            />

            {/* Photo Counter Pill (e.g. 1 / 5) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold tracking-wider border border-white/10 shadow-lg pointer-events-none">
              {selectedPhotoIndex + 1} / {glimpses.length}
            </div>
          </div>

          {/* Next Arrow Button */}
          {glimpses.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNextPhoto();
              }}
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-[120] w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/15 hover:bg-white/30 active:scale-95 text-white flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xl backdrop-blur-sm group"
              aria-label="Next photo"
            >
              <svg
                width="14"
                height="22"
                viewBox="0 0 8 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-white transform group-hover:translate-x-0.5 transition-transform"
              >
                <path
                  d="M0.75005 0.75C0.75005 0.75 6.75 5.1689 6.75 6.75C6.75 8.3312 0.75 12.75 0.75 12.75"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default GlimpsesPage;