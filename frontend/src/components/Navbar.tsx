import { useEffect, useRef, useState } from "react";
import Button from "./Button";
import apiClient from "../api/apiClient";
import { usePageSection } from "../hooks/usePageContent";

interface NavChild {
  id?: string;
  label: string;
  href: string;
}

interface NavItem {
  id?: string;
  label: string;
  href: string;
  heading?: string;
  children?: NavChild[];
}

interface NavbarProps {
  /**
   * Page document that carries the `chrome` section (avatar + CTA).
   * Defaults to the `site` settings document; pass `undefined` to opt out.
   */
  pageSlug?: string | null;
  avatarSrc?: string;
  avatarAlt?: string;
  activePath?: string;
  ctaText?: string;
  ctaHref?: string;
  items?: NavItem[];
}

const defaultItems: NavItem[] = [
  { id: "core-home", label: "Home", href: "/" },
  { id: "core-about", label: "About", href: "/about" },
  {
    id: "core-research",
    label: "Research",
    href: "/research",
    heading: "Explore Research",
    children: [
      { id: "core-res-interests", label: "Research Interests", href: "/research/interests" },
      { id: "core-res-publications", label: "Publications", href: "/publications" },
      { id: "core-res-patents", label: "Patents", href: "/research/patents" },
      { id: "core-res-editorial", label: "Editorial & Review Service", href: "/page/editorial-board-memberships" },
    ],
  },
  {
    id: "core-teaching",
    label: "Teaching",
    href: "/teaching",
    heading: "Explore Teaching",
    children: [
      { id: "core-teach-courses", label: "Courses Taught", href: "/teaching/courses" },
      { id: "core-teach-glimpses", label: "Glimpses", href: "/glimpses" },
    ],
  },
  { id: "core-mentorship", label: "Mentorship", href: "/mentorship" },
];

const Chevron = ({ open }: { open: boolean }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
    aria-hidden="true"
  >
    <path d="M5 9l7 7 7-7" />
  </svg>
);

const slugify = (text: string) =>
  (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const Navbar = ({
  pageSlug = "site",
  avatarSrc = "https://pub-4288b22fbd4c41f8ae1e48c844c96685.r2.dev/weborium/Dr.%20Davinder%20Paul%20Singh.jpeg",
  avatarAlt = "Profile",
  activePath = "/",
  ctaText = "Get in Touch",
  ctaHref = "/contact",
  items: propsItems,
}: NavbarProps) => {
  const [navItems, setNavItems] = useState<NavItem[]>(propsItems || defaultItems);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [panelItem, setPanelItem] = useState<string | null>(null);
  const [panelLeft, setPanelLeft] = useState(0);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  // Site chrome (avatar + CTA) comes from the `site` page document; while the
  // request is pending or fails the static defaults below stay in place.
  const chromeResult = usePageSection(pageSlug ?? undefined, "chrome");
  const chrome = chromeResult.outcome === "section" ? chromeResult.section : null;
  const resolvedAvatar = chrome?.image?.url || avatarSrc;
  const resolvedAvatarAlt = chrome?.image?.alt || avatarAlt;
  const resolvedCtaLabel = chrome?.primaryButton?.label?.trim() || ctaText;
  const resolvedCtaHref = chrome?.primaryButton?.href?.trim() || ctaHref;

  const navRef = useRef<HTMLElement>(null);
  const linksRef = useRef<HTMLUListElement>(null);

  // Fetch backend dynamic navbars and merge with defaults
  useEffect(() => {
    if (propsItems && propsItems.length > 0) {
      setNavItems(propsItems);
      return;
    }

    const fetchNavigation = async () => {
      try {
        const response = await apiClient.get("/navbars");
        const resData = response.data?.data || response.data;

        if (Array.isArray(resData) && resData.length > 0) {
          // Parse valid records from DB
          const backendItems: NavItem[] = resData
            .map((item: any, idx: number) => {
              const label = (item.item_name || item.name || item.label || "").trim();
              if (!label) return null;

              const rawSubList = item.sub_items || item.subnavbars || [];
              const hasChildren = Array.isArray(rawSubList) && rawSubList.length > 0;
              const itemSlug = slugify(label);

              const children: NavChild[] = hasChildren
                ? rawSubList
                    .map((child: any, cIdx: number) => {
                      const childLabel = (child.item_name || child.name || child.label || "").trim();
                      if (!childLabel) return null;
                      const childSlug = slugify(childLabel);

                      return {
                        id: child._id || `sub-${idx}-${cIdx}-${childSlug}`,
                        label: childLabel,
                        href:
                          childSlug === "publications"
                            ? "/publications"
                            : childSlug === "glimpses"
                            ? "/glimpses"
                            : `/page/${childSlug}`,
                      };
                    })
                    .filter(Boolean) as NavChild[]
                : [];

              return {
                id: item._id || `nav-${idx}-${itemSlug}`,
                label,
                href:
                  children.length === 0
                    ? itemSlug === "home"
                      ? "/"
                      : `/${itemSlug}`
                    : "#",
                heading: `Explore ${label}`,
                children: children.length > 0 ? children : undefined,
              };
            })
            .filter(Boolean) as NavItem[];

          if (backendItems.length > 0) {
            // Merge dynamic subnavs into default categories (e.g. adding new items under Research/Teaching)
            const merged = defaultItems.map((defItem) => {
              const matchedBackend = backendItems.find(
                (b) => b.label.toLowerCase() === defItem.label.toLowerCase()
              );

              if (matchedBackend && matchedBackend.children) {
                const existingLabels = new Set(
                  (defItem.children || []).map((c) => c.label.toLowerCase())
                );
                const extraSubItems = matchedBackend.children.filter(
                  (c) => !existingLabels.has(c.label.toLowerCase())
                );

                return {
                  ...defItem,
                  children: [...(defItem.children || []), ...extraSubItems],
                };
              }

              return defItem;
            });

            // Append any entirely new top-level categories created in Admin
            const defaultLabels = new Set(defaultItems.map((d) => d.label.toLowerCase()));
            const newTopLevelItems = backendItems.filter(
              (b) => !defaultLabels.has(b.label.toLowerCase())
            );

            setNavItems([...merged, ...newTopLevelItems]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch navbars; keeping default layout:", err);
      }
    };

    fetchNavigation();
  }, [propsItems]);

  const openPanel = (label: string) => {
    setOpenDropdown(label);
    setPanelItem(label);
  };
  const closePanel = () => setOpenDropdown(null);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenDropdown(null);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Align the mega panel's left edge with the first nav link ("Home")
  useEffect(() => {
    const measure = () => {
      if (!navRef.current || !linksRef.current) return;
      const navLeft = navRef.current.getBoundingClientRect().left;
      const linksLeft = linksRef.current.getBoundingClientRect().left;
      setPanelLeft(Math.max(0, linksLeft - navLeft));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [openDropdown, navItems]);

  const isActive = (href: string) =>
    href === "/" ? activePath === "/" : activePath.startsWith(href);

  const linkClass = (label: string, href: string) => {
    const anyOpen = openDropdown !== null;
    const color = anyOpen
      ? openDropdown === label
        ? "text-[#1a1d2e]"
        : "text-[#5b6178] hover:text-[#1a1d2e]"
      : isActive(href)
      ? "text-[#3b55e6]"
      : "text-[#1a1d2e] hover:text-[#3b55e6]";
    return `inline-flex items-center gap-1.5 text-[17px] leading-none transition-colors duration-200 ${color}`;
  };

  const activePanel = navItems.find((i) => i.label === panelItem && i.children);
  const panelOpen = openDropdown !== null && !!activePanel;

  return (
    <header className="fixed top-3 sm:top-4 left-0 right-0 z-50 px-3 sm:px-6 font-['IBM_Plex_Sans',sans-serif]">
      <nav
        ref={navRef}
        aria-label="Main"
        onMouseLeave={closePanel}
        className="relative mx-auto max-w-[1280px] overflow-hidden rounded-[34px] sm:rounded-[39px] border border-white/60 bg-[#efefef]/75 backdrop-blur-xl backdrop-saturate-150 shadow-[0_10px_30px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.8)]"
      >
        {/* Top row */}
        <div className="flex h-[66px] sm:h-[76px] items-center justify-between pl-3 pr-3 sm:pl-[30px] sm:pr-[18px]">
          {/* Avatar */}
          <a href="/" aria-label="Home" className="shrink-0">
            <img
              src={resolvedAvatar}
              alt={resolvedAvatarAlt}
              draggable={false}
              className="h-11 w-11 sm:h-[52px] sm:w-[52px] rounded-full object-cover ring-1 ring-black/10"
            />
          </a>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-[34px]">
            <ul ref={linksRef} className="flex items-center gap-[34px]">
              {navItems.map((item, idx) => {
                const uniqueKey = item.id || `nav-${idx}-${item.label || "item"}`;
                return (
                  <li
                    key={uniqueKey}
                    className="relative"
                    onMouseEnter={() => (item.children ? openPanel(item.label) : closePanel())}
                  >
                    {item.children ? (
                      <button
                        type="button"
                        aria-haspopup="true"
                        aria-expanded={openDropdown === item.label}
                        onClick={() =>
                          openDropdown === item.label ? closePanel() : openPanel(item.label)
                        }
                        className={linkClass(item.label, item.href)}
                      >
                        {item.label}
                        <Chevron open={openDropdown === item.label} />
                      </button>
                    ) : (
                      <a href={item.href} className={linkClass(item.label, item.href)}>
                        {item.label}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
            <Button text={resolvedCtaLabel} href={resolvedCtaHref} className="ml-1" />
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((p) => !p)}
            className="lg:hidden mr-1 flex h-11 w-11 items-center justify-center rounded-full text-[#1a1d2e] transition-colors hover:bg-black/5"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              {mobileOpen ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Desktop mega panel (expands the glass pill downward) */}
        <div
          aria-hidden={!panelOpen}
          className={`hidden lg:grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            panelOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
          }`}
        >
          <div className="overflow-hidden">
            <div style={{ paddingLeft: panelLeft }} className="pb-10 pt-5 pr-[30px]">
              {activePanel && (
                <div key={activePanel.id || activePanel.label} className={panelOpen ? "animate-[fadeUp_0.4s_ease-out]" : ""}>
                  <p className="text-[17px] leading-none text-[#5b6178]">
                    {activePanel.heading ?? `Explore ${activePanel.label}`}
                  </p>
                  <ul className="mt-5 flex flex-col">
                    {activePanel.children!.map((child, cIdx) => {
                      const childKey = child.id || `child-${cIdx}-${child.label || "item"}`;
                      return (
                        <li key={childKey}>
                          <a
                            href={child.href}
                            tabIndex={panelOpen ? 0 : -1}
                            className="block w-fit py-[14px] text-[28px] xl:text-[32px] leading-[1.15] text-[#1a1d2e] transition-colors duration-200 hover:text-[#3b55e6]"
                          >
                            {child.label}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile panel */}
      <div
        className={`lg:hidden mx-auto mt-2 max-w-[1280px] origin-top overflow-hidden rounded-[32px] border border-white/60 bg-[#efefef]/90 backdrop-blur-xl shadow-[0_12px_32px_rgba(0,0,0,0.1)] transition-all duration-300 ${
          mobileOpen
            ? "max-h-[85vh] scale-100 opacity-100"
            : "pointer-events-none max-h-0 scale-95 opacity-0"
        }`}
      >
        <ul className="flex flex-col p-5">
          {navItems.map((item, idx) => {
            const mKey = item.id || `mob-item-${idx}-${item.label || "item"}`;
            return (
              <li key={mKey} className="border-b border-black/5 last:border-0">
                {item.children ? (
                  <>
                    <button
                      type="button"
                      aria-expanded={mobileExpanded === item.label}
                      onClick={() =>
                        setMobileExpanded(mobileExpanded === item.label ? null : item.label)
                      }
                      className={`flex w-full items-center justify-between py-3.5 text-[17px] ${
                        isActive(item.href) ? "text-[#3b55e6]" : "text-[#1a1d2e]"
                      }`}
                    >
                      {item.label}
                      <Chevron open={mobileExpanded === item.label} />
                    </button>
                    <ul
                      className={`overflow-hidden pl-4 transition-all duration-300 ${
                        mobileExpanded === item.label ? "max-h-72 pb-2" : "max-h-0"
                      }`}
                    >
                      {item.children.map((child, cIdx) => {
                        const mChildKey = child.id || `mob-child-${cIdx}-${child.label || "sub"}`;
                        return (
                          <li key={mChildKey}>
                            <a href={child.href} className="block py-2 text-[15px] text-[#1a1d2e]/80">
                              {child.label}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                ) : (
                  <a
                    href={item.href}
                    className={`block py-3.5 text-[17px] ${
                      isActive(item.href) ? "text-[#3b55e6]" : "text-[#1a1d2e]"
                    }`}
                  >
                    {item.label}
                  </a>
                )}
              </li>
            );
          })}
          <li className="pt-4">
            <Button text={resolvedCtaLabel} href={resolvedCtaHref} fullWidth />
          </li>
        </ul>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </header>
  );
};

export default Navbar;