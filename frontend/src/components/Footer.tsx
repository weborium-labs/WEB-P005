import React from "react";
import { Link } from "react-router-dom";
import { usePageSection } from "../hooks/usePageContent";
import { resolveText } from "../lib/sectionFallback";

interface FooterLink {
  label: string;
  href: string;
  isExternal?: boolean;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface FooterProps {
  /** Loads the footer from the `footer` page document when provided. */
  pageSlug?: string;
}

const DEFAULT_SECTIONS: FooterSection[] = [
  {
    title: "Pages",
    links: [
      { label: "Home", href: "/" },
      { label: "About", href: "/about" },
      { label: "Mentorship", href: "/mentorship" },
    ],
  },
  {
    title: "Research",
    links: [
      { label: "Research Interests", href: "/research-interests" },
      { label: "Publications", href: "/publications" },
      { label: "Patents", href: "/patents" },
      { label: "Editorial & Review Services", href: "/editorial-services" },
    ],
  },
  {
    title: "Teaching",
    links: [
      { label: "Courses Taught", href: "/courses" },
      { label: "Glimpses", href: "/glimpses" },
    ],
  },
  {
    title: "Connect",
    links: [
      {
        label: "Google Scholar",
        href: "https://scholar.google.com",
        isExternal: true,
      },
      {
        label: "LinkedIn",
        href: "https://www.linkedin.com",
        isExternal: true,
      },
    ],
  },
];

const DEFAULT_NAME = "Dr. Davinder Paul Singh";
const DEFAULT_ROLE =
  "Assistant Professor, Department of Computer Science & Engineering - PDEU, Gandhinagar, Gujarat";
const DEFAULT_UPDATED = "Last Updated - October 2026";
const DEFAULT_COPYRIGHT = "Dr. Davinder Paul Singh © 2026";

/** Internal path, hash or absolute URL — anything else keeps the static link. */
const safeHref = (value: unknown, fallback: string): string => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  if (trimmed.startsWith("#")) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return fallback;
};

export const Footer: React.FC<FooterProps> = ({ pageSlug }) => {
  const resolved = usePageSection(pageSlug, "footer");

  // Admin hid the footer block entirely: nothing renders (their intent).
  if (resolved.outcome === "hidden") return null;

  const section = resolved.outcome === "section" ? resolved.section : null;

  const name = section ? resolveText(section.heading, DEFAULT_NAME) : DEFAULT_NAME;
  const role = section ? resolveText(section.description, DEFAULT_ROLE) : DEFAULT_ROLE;
  const updated = section ? resolveText(section.body, DEFAULT_UPDATED) : DEFAULT_UPDATED;
  const copyright = section ? resolveText(section.subtitle, DEFAULT_COPYRIGHT) : DEFAULT_COPYRIGHT;

  // `items` present in the API payload replaces the static columns; an
  // intentionally empty array renders no link columns at all.
  const sections: FooterSection[] = section?.items
    ? section.items
        .filter((column) => Boolean(column.label))
        .map((column) => ({
          title: column.label as string,
          links: (column.children ?? [])
            .filter((link) => Boolean(link.label) && Boolean(link.href))
            .map((link) => ({
              label: link.label as string,
              href: safeHref(link.href, "/"),
              isExternal:
                link.external === true ||
                /^https?:\/\//i.test((link.href ?? "").trim()),
            })),
        }))
    : DEFAULT_SECTIONS;

  return (
    <footer className="w-full px-3 py-6 sm:px-6 lg:px-12 bg-transparent select-none">
      {/* Outer Card with subtle hover lift */}
      <div className="mx-auto max-w-7xl rounded-[28px] sm:rounded-[36px] md:rounded-[44px] bg-[var(--color-surface)] p-6 sm:p-10 lg:p-14 border border-[var(--color-border)] shadow-sm transition-all duration-300 hover:shadow-md hover:border-[var(--color-border-strong)]">
        
        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-8 lg:gap-12">
          
          {/* Left: Bio & Heading */}
          <div data-reveal className="max-w-md group">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-heading)] tracking-tight leading-tight transition-colors duration-200 group-hover:text-[var(--color-text-primary)]">
              {name}
            </h2>
            <p className="mt-2.5 text-xs sm:text-sm text-[var(--color-text-subtle)] leading-relaxed font-normal">
              {role}
            </p>
          </div>

          {/* Divider visible on mobile/tablet */}
          <div className="block lg:hidden w-full h-[1px] bg-[var(--color-border-strong)]" />

          {/* Right: Navigation Links Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:flex lg:flex-row gap-6 sm:gap-8 lg:gap-14">
            {sections.map((section) => (
              <div key={section.title} data-reveal className="flex flex-col space-y-2.5 min-w-[120px]">
                <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-[var(--color-text-muted)]">
                  {section.title}
                </span>

                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      {link.isExternal ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative inline-flex items-center text-xs sm:text-sm font-medium text-[var(--color-text-body)] hover:text-[var(--color-text-primary)] transition-all duration-200 hover:translate-x-1"
                        >
                          <span className="relative">
                            {link.label}
                            {/* Animated underline */}
                            <span className="absolute left-0 -bottom-0.5 h-[1.5px] w-0 bg-black transition-all duration-200 group-hover:w-full" />
                          </span>
                          {/* Mini external arrow */}
                          <span className="ml-1 text-[11px] opacity-60 transition-transform duration-200 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                            ↗
                          </span>
                        </a>
                      ) : (
                        <Link
                          to={link.href}
                          className="group relative inline-block text-xs sm:text-sm font-medium text-[var(--color-text-body)] hover:text-[var(--color-text-primary)] transition-all duration-200 hover:translate-x-1"
                        >
                          <span className="relative">
                            {link.label}
                            {/* Animated underline */}
                            <span className="absolute left-0 -bottom-0.5 h-[1.5px] w-0 bg-black transition-all duration-200 group-hover:w-full" />
                          </span>
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>

        {/* Horizontal Divider Line */}
        <div className="mt-10 sm:mt-12 lg:mt-14 w-full h-[1px] bg-[var(--color-border-strong)]" />

        {/* Bottom Bar / Copyright */}
        <div className="mt-4 flex flex-row items-center justify-between text-[11px] sm:text-xs text-[var(--color-text-muted)]">
          <span className="transition-colors duration-150 hover:text-[var(--color-text-heading)]">
            {updated}
          </span>
          <span className="transition-colors duration-150 hover:text-[var(--color-text-heading)]">
            {copyright}
          </span>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
