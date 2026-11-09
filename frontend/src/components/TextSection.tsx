import Button from "./Button";
import { usePageSection } from "../hooks/usePageContent";
import type { SectionStat } from "../types/page";

interface TextSectionProps {
  /** Page document the section belongs to (already resolved by the route). */
  pageSlug: string;
  /** Section key inside the document (`header`, `intro`, …). */
  sectionKey: string;
}

/**
 * Renders a `text` section from a page document.
 *
 * Used by the CMS catch-all route: the section's own fields (heading,
 * description, body, stats, CTA, image) are the entire content — there is no
 * static counterpart to fall back to, so a hidden or missing section simply
 * renders nothing.
 */
const TextSection = ({ pageSlug, sectionKey }: TextSectionProps) => {
  const resolved = usePageSection(pageSlug, "text", sectionKey);

  if (resolved.outcome !== "section") return null;
  const section = resolved.section;

  const heading = section.heading?.trim();
  const description = section.description?.trim();
  const body = section.body?.trim();
  const subtitle = section.subtitle?.trim();
  const stats: SectionStat[] = section.stats ?? [];
  const isPageTitle = (section.order ?? 0) === 0;

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 sm:px-8 lg:px-12 pt-24 sm:pt-32 pb-6">
      <div
        data-reveal
        className={
          section.image?.url
            ? "flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between"
            : ""
        }
      >
        <div className="max-w-3xl">
          {heading &&
            (isPageTitle ? (
              <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-[var(--color-text-heading)] tracking-tight leading-tight">
                {heading}
              </h1>
            ) : (
              <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-[var(--color-text-heading)] tracking-tight leading-tight">
                {heading}
              </h2>
            ))}

          {subtitle && (
            <p className="mt-2 text-[13px] uppercase tracking-wider font-semibold text-[var(--color-text-muted)]">
              {subtitle}
            </p>
          )}

          {description && (
            <p className="mt-4 text-[15px] sm:text-base leading-relaxed text-[var(--color-text-subtle)]">
              {description}
            </p>
          )}

          {body && (
            <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-[var(--color-text-body)]">
              {body}
            </p>
          )}

          {stats.length > 0 && (
            <dl className="mt-7 flex flex-wrap gap-x-10 gap-y-4">
              {stats.map((stat) => (
                <div key={`${stat.value}-${stat.label}`}>
                  <dt className="text-[22px] font-bold text-[var(--color-text-heading)]">
                    {stat.value}
                  </dt>
                  <dd className="text-[13px] text-[var(--color-text-muted)]">{stat.label}</dd>
                </div>
              ))}
            </dl>
          )}

          {section.cta?.label && section.cta.href && (
            <div className="mt-7">
              <Button variant="accent" text={section.cta.label} href={section.cta.href} />
            </div>
          )}
        </div>

        {section.image?.url && (
          <img
            data-reveal
            src={section.image.url}
            alt={section.image.alt?.trim() || heading || ""}
            className="w-full max-w-[420px] shrink-0 rounded-[36px] border border-[var(--color-border)] object-cover lg:w-[380px]"
          />
        )}
      </div>
    </section>
  );
};

export default TextSection;
