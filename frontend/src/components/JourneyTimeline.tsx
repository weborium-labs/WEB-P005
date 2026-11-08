import React, { useState } from "react";

interface Milestone {
  id: string;
  year: string;
  role: string;
  institution: string;
  /** 'top' or 'bottom' on desktop alternating timeline */
  position: "top" | "bottom";
}

const milestones: Milestone[] = [
  {
    id: "be-it",
    year: "2014",
    role: "B.E., IT",
    institution: "(University of Jammu - 70%)",
    position: "bottom",
  },
  {
    id: "mtech-cse",
    year: "2017",
    role: "M.Tech., CSE",
    institution: "(University of Jammu - 8.31 CGPA)",
    position: "top",
  },
  {
    id: "contractual-ap",
    year: "2018",
    role: "Contractual Asst. Professor",
    institution: "(Yogananda College of Engineering & Technology)",
    position: "bottom",
  },
  {
    id: "phd",
    year: "2018 - 2023",
    role: "Ph.D. Scholar",
    institution: "(Shri Mata Vaishno Devi University)",
    position: "top",
  },
  {
    id: "asst-prof-present",
    year: "2023-Present",
    role: "Asst. Professor",
    institution: "(Pandit Deendayal Energy University, Gandhinagar, Gujarat)",
    position: "bottom",
  },
];

export const JourneyTimeline: React.FC = () => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section className="w-full py-16 px-4 sm:px-6 flex flex-col items-center font-['Google_Sans',_sans-serif]">
      {/* Title */}
      <h2 className="text-[28px] sm:text-[32px] md:text-[36px] font-semibold text-[var(--color-text-heading)] tracking-tight mb-7 md:mb-12 text-center">
        Journey
      </h2>

      {/* ========================================================
          1. MOBILE VIEW (< lg): Vertical Timeline Inside Card
          ======================================================== */}
      <div className="w-full max-w-[420px] lg:hidden bg-[var(--color-surface)] rounded-[32px] p-7 sm:p-9 border border-[var(--color-surface-muted)]/90 shadow-[0_10px_35px_-8px_rgba(0,0,0,0.06)]">
        <div className="relative border-l-2 border-[var(--color-text-muted)]/40 ml-3.5 pl-6 flex flex-col space-y-8 py-2">
          {milestones.map((item) => {
            const isHovered = hoveredId === item.id;
            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="relative group cursor-pointer transition-transform duration-200 hover:translate-x-1"
              >
                {/* Blue Dot on the vertical line */}
                <span
                  className={`absolute -left-[31px] top-1.5 w-[14px] h-[14px] rounded-full bg-[var(--color-accent)] ring-4 ring-[var(--color-surface)] transition-all duration-300 ${
                    isHovered
                      ? "scale-125 shadow-[0_0_12px_var(--color-glow-accent)]"
                      : "group-hover:scale-125"
                  }`}
                />

                {/* Content */}
                <div>
                  <span className="block text-[13px] font-semibold text-[var(--color-text-muted)] tracking-wide">
                    {item.year}
                  </span>
                  <h3
                    className={`text-[15px] sm:text-[16px] font-bold mt-0.5 transition-colors duration-200 ${
                      isHovered ? "text-[var(--color-accent)]" : "text-[var(--color-text-heading)]"
                    }`}
                  >
                    {item.role}
                  </h3>
                  <p className="text-[13px] sm:text-[13.5px] text-[var(--color-text-subtle)] mt-0.5 leading-snug">
                    {item.institution}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          2. DESKTOP VIEW (lg+): Alternating Horizontal Timeline
          ======================================================== */}
      <div className="hidden lg:block w-full max-w-6xl mx-auto relative px-6 py-28">
        {/* Horizontal Center Axis Line */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-[var(--color-text-muted)]/45 z-0" />

        {/* Milestones Container */}
        <div className="relative z-10 grid grid-cols-5 gap-2 items-center">
          {milestones.map((item) => {
            const isHovered = hoveredId === item.id;
            const isTop = item.position === "top";

            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="relative flex flex-col items-center group cursor-pointer select-none"
              >
                {/* ----------------- TOP SIDE CONTENT ----------------- */}
                <div
                  className={`flex flex-col items-center text-center absolute bottom-full mb-3 w-[190px] transition-all duration-300 ${
                    isHovered ? "-translate-y-1.5" : "group-hover:-translate-y-1"
                  } ${!isTop ? "pointer-events-none" : ""}`}
                >
                  {isTop ? (
                    <>
                      {/* Top Role & Institution */}
                      <div className="flex flex-col items-center">
                        <h3
                          className={`text-[14px] font-bold transition-colors duration-200 leading-tight ${
                            isHovered ? "text-[var(--color-accent)]" : "text-[var(--color-text-heading)]"
                          }`}
                        >
                          {item.role}
                        </h3>
                        <p className="text-[12px] text-[var(--color-text-subtle)] mt-0.5 leading-snug">
                          {item.institution}
                        </p>
                      </div>

                      {/* Small Vertical Connector Stem */}
                      <div className="w-[1.5px] h-4 bg-[var(--color-text-faint)]/70 my-1.5" />
                    </>
                  ) : (
                    /* Top Year (when text is bottom) */
                    <span className="text-[14px] font-semibold text-[var(--color-text-subtle)] mb-1">
                      {item.year}
                    </span>
                  )}
                </div>

                {/* ----------------- CENTER CIRCLE / DOT ----------------- */}
                <div className="relative flex items-center justify-center">
                  <div
                    className={`w-[14px] h-[14px] rounded-full bg-[var(--color-accent)] ring-4 ring-[var(--color-surface)] shadow-sm transition-all duration-300 ${
                      isHovered
                        ? "scale-135 ring-[var(--color-primary-glow)] shadow-[0_0_14px_var(--color-glow-accent)]"
                        : "group-hover:scale-125"
                    }`}
                  />
                </div>

                {/* ----------------- BOTTOM SIDE CONTENT ----------------- */}
                <div
                  className={`flex flex-col items-center text-center absolute top-full mt-3 w-[190px] transition-all duration-300 ${
                    isHovered ? "translate-y-1.5" : "group-hover:translate-y-1"
                  } ${isTop ? "pointer-events-none" : ""}`}
                >
                  {isTop ? (
                    /* Bottom Year (when text is top) */
                    <span className="text-[14px] font-semibold text-[var(--color-text-subtle)] mt-1">
                      {item.year}
                    </span>
                  ) : (
                    <>
                      {/* Small Vertical Connector Stem */}
                      <div className="w-[1.5px] h-4 bg-[var(--color-text-faint)]/70 my-1.5" />

                      {/* Bottom Role & Institution */}
                      <div className="flex flex-col items-center">
                        <h3
                          className={`text-[14px] font-bold transition-colors duration-200 leading-tight ${
                            isHovered ? "text-[var(--color-accent)]" : "text-[var(--color-text-heading)]"
                          }`}
                        >
                          {item.role}
                        </h3>
                        <p className="text-[12px] text-[var(--color-text-subtle)] mt-0.5 leading-snug">
                          {item.institution}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default JourneyTimeline;