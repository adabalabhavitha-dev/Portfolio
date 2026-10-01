"use client";

import {
  Briefcase,
  Palette,
  Sparkles,
  User,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Topic } from "./types";

/**
 * The five conversation starters.
 *
 * NOTE FOR INTEGRATION: `src/data/topics.ts` did not exist when this file was
 * written (agent D owns it), so the canonical list is defined here as a
 * fallback. At integration, prefer re-exporting agent D's list:
 *
 *   import { topics } from "@/data/topics";
 *   export const TOPICS = topics;
 *
 * The `question` strings are the ONLY place a prompt is phrased. They must stay
 * consistent with the system prompt's tool descriptions.
 */
export const TOPICS: Topic[] = [
  {
    id: "about",
    label: "Me",
    icon: User,
    question: "Tell me about yourself — who are you and what are you studying?",
  },
  {
    id: "projects",
    label: "Projects",
    icon: Briefcase,
    question: "What projects have you built? What is actually implemented in them?",
  },
  {
    id: "skills",
    label: "Skills",
    icon: Wrench,
    question: "What are your current skills, and what are you still learning?",
  },
  {
    id: "fun",
    label: "Fun",
    icon: Palette,
    question: "What do you enjoy outside of coursework?",
  },
  {
    id: "contact",
    label: "Contact",
    icon: Sparkles,
    question: "How can I get in touch with you?",
  },
];

export type { Topic };

/**
 * Topic pills. Wraps to multiple rows on narrow screens; every pill is a real
 * button with a visible focus ring.
 */
export function TopicBar({
  onSelect,
  disabled = false,
  className,
}: {
  onSelect: (topic: Topic) => void;
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
