import { cn } from "@/lib/utils";
import styles from "./AuroraBackdrop.module.css";

/**
 * Ambient backdrop: three slow, blurred colour fields behind everything.
 *
 * Deliberately a server-safe component — no "use client", no hooks, no effects,
 * no state. It is three divs with a CSS animation, so when it is rendered on
 * the server it costs nothing on the client at all, and when it is imported
 * from a client boundary (as `ExperienceShell` does) the browser handles the
 * motion without a single frame of React work.
 *
 * Layer contract:
 *  - `fixed inset-0`, so it tracks the viewport and never scrolls.
 *  - `pointer-events-none`, so it can never intercept a click meant for the
 *    page underneath.
 *  - `aria-hidden`, because a decorative gradient is not content and must not
 *    reach a screen reader or the accessibility tree.
 *  - `z-index: -2` from the module — behind the dot grid (-1) and behind all
 *    in-flow content.
 */
export function AuroraBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none fixed inset-0", className, styles.root)}
    >
      {/* Exactly three orbs, each smaller than the viewport so the 0.94–1.12
          scale range of aurora-drift never pulls an edge into view. */}
      <div className={cn("rounded-full blur-2xl lg:blur-3xl", styles.orb, styles.sage)} />
      <div className={cn("rounded-full blur-2xl lg:blur-3xl", styles.orb, styles.plum)} />
      <div className={cn("rounded-full blur-2xl lg:blur-3xl", styles.orb, styles.moss)} />
    </div>
  );
}