import Button from "./Button";
import { usePageSection } from "../hooks/usePageContent";
import type { SectionItem } from "../types/page";

interface CardsSectionProps {
  /** Page document the section belongs to (already resolved by the route). */
  pageSlug: string;
  /** Section key inside the document. */
  sectionKey: string;
}

const cardClasses =
  "flex h-full flex-col gap-2 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-7 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow-md";

/**
 * Same link contract as the rest of the CMS: an internal path, a hash anchor
 * or an absolute http(s) URL. Anything else renders the card without a link
 * rather than emitting a dangerous `href`.
 */
const safeHref = (value: string | undefined): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  if (trimmed.startsWith("#")) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return null;
};

/** A card must carry something readable to be rendered at all. */
const isRenderable = (item: SectionItem): boolean =>
  Boolean(item.title?.trim() || item.label?.trim() || item.description?.trim());

const CardsSection = ({ pageSlug, sectionKey }: CardsSectionProps) => {
  const resolved = usePageSection(pageSlug, "cards", sectionKey);

  if (resolved.outcome !== "section") return null;
  const section = resolved.section;

  const heading = section.heading?.trim();
  const description = section.description?.trim();
  const cards = (section.items ?? []).filter(isRenderable);

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 sm:px-8 lg:px-12 py-10 sm:py-14">
      {heading && (
        <h2
          data-reveal
          className="text-xl sm:text-2xl lg:text-[26px] font-bold text-[var(--color-text-heading)] tracking-tight"
        >
          {heading}
        </h2>
      )}
      {description && (
        <p
          data-reveal
          className="mt-3 max-w-3xl text-[15px] leading-relaxed text-[var(--color-text-subtle)]"
        >
          {description}
        </p>
      )}

      <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, index) => {
          const href = safeHref(card.href);
          const key = card.title?.trim() || card.label?.trim() || `card-${index}`;

          const content = (
            <>
              {card.image?.url && (
                <img
                  src={card.image.url}
                  alt={card.image.alt?.trim() || card.title?.trim() || ""}
                  className="mb-3 h-36 w-full rounded-[18px] object-cover"
                />
              )}
              {card.label?.trim() && (
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  {card.label.trim()}
                </span>
              )}
              {card.title?.trim() && (
                <h3 className="text-[17px] font-semibold leading-snug text-[var(--color-text-heading)]">
                  {card.title.trim()}
                </h3>
              )}
              {card.subtitle?.trim() && (
                <p className="text-[13px] font-medium text-[var(--color-text-subtle)]">
                  {card.subtitle.trim()}
                </p>
              )}
              {card.description?.trim() && (
                <p className="text-[14px] leading-relaxed text-[var(--color-text-body)]">
                  {card.description.trim()}
                </p>
              )}
            </>
          );

          return href ? (
            <a
              key={key}
              href={href}
              data-reveal
              {...(href.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className={cardClasses}
            >
              {content}
            </a>
          ) : (
            <div key={key} data-reveal className={cardClasses}>
              {content}
            </div>
          );
        })}
      </div>

      {cards.length === 0 && (
        <p className="mt-6 text-sm text-[var(--color-text-muted)]">Nothing published here yet.</p>
      )}

      {section.cta?.label && section.cta.href && (
        <div className="mt-8">
          <Button variant="accent" text={section.cta.label} href={section.cta.href} />
        </div>
      )}
    </section>
  );
};

export default CardsSection;
