"use client";

import { motion, useReducedMotion } from "framer-motion";
import { topics } from "@/data/topics";
import { cn } from "@/lib/utils";

/**
 * The five conversation starters.
 *
 * The canonical list lives in `src/data/topics.ts` (agent D's area) so the
 * buttons, the cacheable topic list, and the system prompt can never drift
 * apart. It did not exist when this file was first written, so a local fallback
 * was used; that fallback has since been deleted in favour of the real module.
 *
 * `question` is sent verbatim as a normal user message — the pills are a
 * shortcut into free text, not a separate code path.
 */
export const TOPICS = topics;

export type { Topic } from "@/data/topics";

/**
 * Topic pills. Wraps to multiple rows on narrow screens; every pill is a real
 * button with a visible focus ring.
 */
export function TopicBar({
  onSelect,
  disabled = false,
  className,
}: {
  onSelect: (topic: (typeof TOPICS)[number]) => void;
  disabled?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <nav aria-label="Suggested questions" className={cn("w-full", className)}>
      <ul className="flex flex-wrap items-center justify-center gap-2">
        {TOPICS.map((topic, index) => {
          const Icon = topic.icon;
          return (
            <motion.li
              key={topic.id}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduce
                  ? { duration: 0 }
                  : {
                      duration: 0.3,
                      delay: index * 0.05,
                      ease: [0.22, 1, 0.36, 1],
                    }
              }
            >
              <button
                type="button"
                // data-cursor is resolved by the frozen cursor engine via
                // `closest("[data-cursor]")`, so it drives the custom cursor
                // without any extra wiring here.
                data-cursor="button"
                disabled={disabled}
                onClick={() => onSelect(topic)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-border",
                  "bg-[var(--glass)] px-3.5 py-2 text-sm font-medium",
                  "backdrop-blur-md transition-all duration-200",
                  "hover:-translate-y-0.5 hover:border-[var(--sage)] hover:text-[var(--sage)]",
                  "disabled:pointer-events-none disabled:opacity-50",
                )}
              >
                <Icon aria-hidden className="size-4 shrink-0" />
                {topic.label}
              </button>
            </motion.li>
          );
        })}
      </ul>
    </nav>
  );
}
