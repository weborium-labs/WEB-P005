import { useEffect } from "react";
import { gsap, ScrollTrigger, MOTION, prefersReducedMotion } from "../lib/animations";

type MotionContext = ReturnType<typeof gsap.context>;

/**
 * Site-wide scroll reveal.
 *
 * Every element marked `data-reveal` fades and rises into place the first time
 * it enters the viewport; elements already on screen animate immediately, so
 * the first paint of a page reads as one composed entrance rather than a wall
 * of content.
 *
 * Details that matter:
 *  - initial state is applied in a layout effect (before paint), so nothing
 *    flashes visible → hidden → visible;
 *  - sections that mount later (CMS content arriving after the route) are
 *    picked up by a MutationObserver and revealed the same way;
 *  - a failure anywhere clears the inline styles instead of leaving the page
 *    blank;
 *  - with `prefers-reduced-motion` the hook does nothing at all.
 *
 * @param routeKey Re-runs on navigation (the previous route's triggers are
 *   reverted with their inline styles, so no element keeps a stale transform).
 */
export const useScrollReveal = (routeKey: string): void => {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const registered = new Set<HTMLElement>();
    let context: MotionContext | undefined;
    let observer: MutationObserver | undefined;
    let frame = 0;

    const animate = (targets: Element[], staggered: boolean) => {
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration: MOTION.duration,
        ease: MOTION.ease,
        stagger: staggered ? MOTION.stagger : 0,
        overwrite: true,
      });
    };

    const register = (candidates: Element[]) => {
      const fresh = candidates.filter(
        (node): node is HTMLElement =>
          node instanceof HTMLElement &&
          node.hasAttribute("data-reveal") &&
          !registered.has(node),
      );
      if (fresh.length === 0) return;

      fresh.forEach((node) => registered.add(node));
      gsap.set(fresh, { opacity: 0, y: MOTION.distance });

      const limit = window.innerHeight * 0.88;
      const immediate = fresh.filter((node) => node.getBoundingClientRect().top < limit);
      const deferred = fresh.filter((node) => !immediate.includes(node));

      if (immediate.length > 0) animate(immediate, true);
      if (deferred.length > 0) {
        ScrollTrigger.batch(deferred, {
          start: MOTION.start,
          once: true,
          onEnter: (batch) => animate(batch, true),
        });
      }
    };

    try {
      context = gsap.context(() => {
        register(Array.from(document.querySelectorAll("[data-reveal]")));
        ScrollTrigger.refresh();
      });

      // CMS sections mount after the route (their data is still in flight) —
      // register anything new without re-hiding what has already animated.
      //
      // The refresh must run for *every* mutation, not just new nodes: when
      // the API answer replaces the taller static fallbacks, everything below
      // shifts up and triggers measured before the swap would otherwise point
      // past the end of the document (never firing, leaving content hidden).
      observer = new MutationObserver(() => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          const added: Element[] = [];
          document.querySelectorAll("[data-reveal]").forEach((node) => {
            if (!registered.has(node as HTMLElement)) added.push(node);
          });
          if (added.length > 0) register(added);
          ScrollTrigger.refresh();
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });

      // Late-loading images and font swaps resize the document without a
      // childList mutation — re-measure on those too.
      const resizeObserver = new ResizeObserver(() => ScrollTrigger.refresh());
      resizeObserver.observe(document.body);

      // Late-loading images shift the layout the triggers were measured with.
      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener("load", refresh);
      return () => {
        window.removeEventListener("load", refresh);
        resizeObserver.disconnect();
        if (frame) cancelAnimationFrame(frame);
        observer?.disconnect();
        context?.revert();
        ScrollTrigger.refresh();
      };
    } catch {
      // Never leave the page half-hidden because an animation failed.
      observer?.disconnect();
      gsap.set("[data-reveal]", { clearProps: "all" });
      return () => {
        if (frame) cancelAnimationFrame(frame);
      };
    }
  }, [routeKey]);
};

export default useScrollReveal;
