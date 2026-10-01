import { cn } from "@/lib/utils";
import styles from "./AuroraBackdrop.module.css";

/**
 * Ambient backdrop: three slow, blurred colour fields behind everything.
 *
 * Deliberately server-safe — no "use client", no hooks, no effects, no state.
 * It is three divs and a CSS animation, so it costs nothing at runtime and
 * contributes no per-frame React work.
 *
 * Layer contract:
 *  - `fixed inset-0`, so it tracks the viewport and never scrolls.
 *  - `pointer-events-none`, so it can never intercept a click meant for the
 *    page underneath.
 *  - `aria-hidden`, because a decorative gradient is not content and must stay
 *    out of the accessibility tree.
 *  - `z-index: -2` from the module — behind the dot grid (-1) and behind all
 *    in-flow content.
 */
export function AuroraBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none fixed inset-0", className, styles.root)}
    >
      {/* Exactly three orbs. `blur-3xl` is the ceiling per the performance
          brief, and mobile steps down to `blur-2xl`. */}
      <div
        className={cn("blur-2xl lg:blur-3xl", styles.orb, styles.sage)}
      />
      <div
        className={cn("blur-2xl lg:blur-3xl", styles.orb, styles.plum)}
      />
      <div
        className={cn("blur-2xl lg:blur-3xl", styles.orb, styles.moss)}
      />
    </div>
  );
}