"use client";

import { motion } from "framer-motion";
import { useId } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/**
 * Original brand mark — a two-leaf sprout.
 *
 * Drawn from scratch as plain path geometry; no third-party logo, no existing
 * portfolio mark. Colours come only from design tokens (`--sage`, `--coral`,
 * `--hairline`), so the same SVG reads correctly in both themes without any
 * theme branching: the tile gradient is sage-soft → coral-soft, which is a
 * pale tint in the warm light theme and a muted aurora wash in dark.
 *
 * Animation is a slow, out-of-phase rustle (stem sways, each leaf rotates about
 * its own base). Under `prefers-reduced-motion` the `animate` props are dropped
 * entirely, so nothing runs.
 */
export function Logo({
  size = 28,
  className,
  animated = true,
}: {
  /** Rendered width and height in px. The viewBox is always 32×32. */
  size?: number;
  className?: string;
  /** Set false for a static mark (e.g. inside a print-style footer). */
  animated?: boolean;
}) {
  const reduced = usePrefersReducedMotion();
  const live = animated && !reduced;

  // useId keeps the gradient id unique so several logos can coexist on a page.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const tile = `logo-tile-${uid}`;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient
          id={tile}
          x1="2"
          y1="2"
          x2="30"
          y2="30"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" style={{ stopColor: "var(--sage-soft)" }} />
          <stop offset="1" style={{ stopColor: "var(--coral-soft)" }} />
        </linearGradient>
      </defs>

      {/* Tile */}
      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        rx="9"
        style={{ fill: `url(#${tile})` }}
      />
      <rect
        x="1.5"
        y="1.5"
        width="29"
        height="29"
        rx="8.5"
        style={{ stroke: "var(--hairline)" }}
        strokeWidth="1"
      />

      <motion.g
        style={{ transformBox: "view-box", transformOrigin: "16px 28px" }}
        animate={live ? { rotate: [0, -2.5, 0, 2.5, 0] } : undefined}
        transition={
          live
            ? { duration: 7.5, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
      >
        {/* Stem */}
        <path
          d="M16 27.5 C16 24.5 16.1 21.8 16.4 18.6"
          style={{ stroke: "var(--sage)" }}
          strokeWidth="1.7"
          strokeLinecap="round"
        />

        {/* Sage leaf */}
        <motion.g
          style={{ transformBox: "view-box", transformOrigin: "16.2px 24px" }}
          animate={live ? { rotate: [0, 2.2, 0] } : undefined}
          transition={
            live
              ? { duration: 5.4, repeat: Infinity, ease: "easeInOut" }
              : undefined
          }
        >
          <path
            d="M16.2 24 C15.1 14.6 15.1 14.6 7.5 9 C8.6 18.4 8.6 18.4 16.2 24 Z"
            style={{ fill: "var(--sage)" }}
          />
          <path
            d="M16.2 24 Q11.9 16.5 7.5 9"
            style={{ stroke: "var(--sage)" }}
            strokeWidth="0.8"
            strokeLinecap="round"
            opacity="0.45"
          />
        </motion.g>

        {/* Coral leaf */}
        <motion.g
          style={{ transformBox: "view-box", transformOrigin: "16.3px 22.5px" }}
          animate={live ? { rotate: [0, -2.6, 0] } : undefined}
          transition={
            live
              ? { duration: 6.1, repeat: Infinity, ease: "easeInOut" }
              : undefined
          }
        >
          <path
            d="M16.3 22.5 C17.7 14.5 17.7 14.5 24.5 10 C23.1 18 23.1 18 16.3 22.5 Z"
            style={{ fill: "var(--coral)" }}
          />
          <path
            d="M16.3 22.5 Q20.4 16.3 24.5 10"
            style={{ stroke: "var(--coral)" }}
            strokeWidth="0.8"
            strokeLinecap="round"
            opacity="0.5"
          />
        </motion.g>
      </motion.g>
    </motion.svg>
  );
}