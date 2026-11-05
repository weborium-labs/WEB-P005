import React from "react";
import { Link } from "react-router-dom";

interface FooterLink {
  label: string;
  href: string;
  isExternal?: boolean;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

export const Footer: React.FC = () => {
  const sections: FooterSection[] = [
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

  return (
    <footer className="w-full px-3 py-6 sm:px-6 lg:px-12 bg-transparent select-none">
      {/* Outer Card with subtle hover lift */}
      <div className="mx-auto max-w-7xl rounded-[28px] sm:rounded-[36px] md:rounded-[44px] bg-white p-6 sm:p-10 lg:p-14 border border-[#E5E7EB] shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#D1D5DB]">
        
        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-8 lg:gap-12">
          
          {/* Left: Bio & Heading */}
          <div className="max-w-md group">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight leading-tight transition-colors duration-200 group-hover:text-black">
              Dr. Davinder Paul Singh
            </h2>
            <p className="mt-2.5 text-xs sm:text-sm text-[#4B5563] leading-relaxed font-normal">
              Assistant Professor, Department of Computer Science &amp;
              Engineering - PDEU, Gandhinagar, Gujarat
            </p>
          </div>

          {/* Divider visible on mobile/tablet */}
          <div className="block lg:hidden w-full h-[1px] bg-[#D1D5DB]" />

          {/* Right: Navigation Links Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:flex lg:flex-row gap-6 sm:gap-8 lg:gap-14">
            {sections.map((section) => (
              <div key={section.title} className="flex flex-col space-y-2.5 min-w-[120px]">
                <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-[#6B7280]">
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
                          className="group relative inline-flex items-center text-xs sm:text-sm font-medium text-[#374151] hover:text-black transition-all duration-200 hover:translate-x-1"
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
                          className="group relative inline-block text-xs sm:text-sm font-medium text-[#374151] hover:text-black transition-all duration-200 hover:translate-x-1"
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
        <div className="mt-10 sm:mt-12 lg:mt-14 w-full h-[1px] bg-[#D1D5DB]" />

        {/* Bottom Bar / Copyright */}
        <div className="mt-4 flex flex-row items-center justify-between text-[11px] sm:text-xs text-[#6B7280]">
          <span className="transition-colors duration-150 hover:text-gray-900">
            Last Updated - October 2026
          </span>
          <span className="transition-colors duration-150 hover:text-gray-900">
            Dr. Davinder Paul Singh &copy; 2026
          </span>
        </div>

      </div>
    </footer>
  );
};

export default Footer;