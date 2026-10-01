import { cn } from "@/lib/utils";
import styles from "./DotGrid.module.css";

/**
 * Dot grid ambient layer, revealed by the cursor through the global
 * `.cursor-reveal` utility in `app/globals.css`.
 *
 * Two layers, both drawn with CSS `radial-gradient` (no SVG, no canvas):
 *  1. A static low-opacity dot layer, so the grid is still visible when the
 *     pointer is idle or absent (touch devices, keyboard-only navigation).
 *  2. A brighter reveal layer masked by `radial-gradient(...) at var(--cx,var(--cy))`.
 *     Those two custom properties are already written to `<body>` every frame
 *     by `CursorProvider`, so this component adds no listener and no state.
 *
 * Perf: positions and repeating gradients only. No blur, no per-frame React, no
 * scroll or resize handlers of its own.
 */
export function DotGrid({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none fixed inset-0", className, styles.root)}
    >
      <div className={styles.baseDots} />
      <div className={cn("cursor-reveal", styles.revealDots)} />
    </div>
  );
}