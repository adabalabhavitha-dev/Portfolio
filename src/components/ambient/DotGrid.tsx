import { cn } from "@/lib/utils";
import styles from "./DotGrid.module.css";

/**
 * Dot grid ambient layer. Revealed by the cursor via the global `.cursor-reveal`
 * utility (which uses `--cx`/`--cy` written by `CursorProvider` onto `body`).
 *
 * Two layers, both drawn with CSS `radial-gradient` (no SVG, no canvas):
 *  1. Static low-opacity dot layer — always visible, keeps the surface
 *     textured even when the cursor is idle or not present (coarse pointers,
 *     focus-only navigation, etc).
 *  2. Stronger reveal layer — masked by `radial-gradient(...) at var(--cx,var(--cy))`
 *     so only the area around the pointer punches through. The `cursor-reveal`
 *     class is defined once in `app/globals.css` to avoid duplicating the mask.
 *
 * Performance: only gradients and positioning; no React state; no event
 * handlers. `contain: paint` in CSS helps keep the repeated tile small. Blur is
 * not used. transform/opacity not animated here (the movement is purely the
 * mask's centre, which the cursor engine updates outside this layer).
 */
export function DotGrid({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none fixed inset-0", className, styles.root)}
    >
      <div className={cn(styles.baseDots)} />
      <div className={cn("cursor-reveal", styles.revealDots)} />
    </div>
  );
}