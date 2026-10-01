"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Pill } from "@/components/ui/primitives";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/**
 * Small "online" chip with a softly pulsing dot.
 *
 * Reuses the frozen `Pill` primitive so the colour language stays in one place
 * (sage tone = brand). The pulse is a scale/opacity loop on the dot only — it
 * never shifts layout — and it is skipped entirely under `prefers-reduced-motion`,
 * where a static dot with a ring is shown instead.
 */
export function StatusPill({
  label = "online",
  className,
}: {
  /** Status text. Not a personal fact, so it is a prop with a default. */
  label?: string;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();

  return (
    <Pill tone="sage" className={cn("gap-2", className)}>
      <span
        className="relative flex size-2 items-center justify-center"
        aria-hidden
      >
        {reduced ? null : (
          <motion.span
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{ background: "var(--sage)" }}
            animate={{ scale: [1, 1.75, 1.75], opacity: [0.5, 0, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <motion.span
          className="relative size-2 rounded-full"
          style={{ background: "var(--sage)" }}
          animate={reduced ? undefined : { scale: [1, 0.82, 1] }}
          transition={
            reduced
              ? undefined
              : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
          }
        />
      </span>
      <span className="font-medium tracking-wide">{label}</span>
    </Pill>
  );
}