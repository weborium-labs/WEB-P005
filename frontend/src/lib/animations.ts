import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Motion is decorative: when the visitor asks the OS to reduce motion, every
 * helper below becomes a no-op and the markup stays in its final (visible)
 * state — nothing is ever hidden behind an animation that will not run.
 */
export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * One motion vocabulary for the whole site: short, decelerating, understated
 * ("formal" — no bounce, no elastic, no parallax drift).
 */
export const MOTION = {
  /** Scroll reveal duration, seconds */
  duration: 0.7,
  /** Decelerating ease used by every reveal */
  ease: "power2.out",
  /** Rise distance in px for a reveal */
  distance: 24,
  /** Per-element delay inside a batch */
  stagger: 0.08,
  /** How much of the viewport must be crossed before a reveal fires */
  start: "top 88%",
} as const;

/**
 * Runs `fn` inside a GSAP context so every tween/trigger it creates can be
 * reverted in one call. Returns `undefined` when motion is reduced or when the
 * animation layer fails — callers revert whatever they get, and a failure
 * clears inline styles instead of leaving content stuck mid-transition.
 */
export const inMotionContext = (
  fn: () => void,
  scope?: Element | null,
): MotionContext | undefined => {
  if (prefersReducedMotion()) return undefined;
  try {
    return gsap.context(fn, scope ?? undefined);
  } catch {
    if (scope) gsap.set(scope, { clearProps: "all" });
    else gsap.set("[data-reveal]", { clearProps: "all" });
    return undefined;
  }
};

export type MotionContext = ReturnType<typeof gsap.context>;

export { gsap, ScrollTrigger };
