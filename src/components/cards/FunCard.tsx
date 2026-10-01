"use client";

import {
  Brush,
  Camera,
  Coffee,
  Compass,
  Heart,
  Leaf,
  Music,
  PenTool,
  Sparkles,
  Users,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Pill } from "@/components/ui/primitives";
import { CardHeader, CardShell, NoteBox } from "@/components/cards/card-parts";
import type { FunPayload } from "@/components/chat/types";

/**
 * Fun card — interests as icon pills, strengths as short chips.
 *
 * The icon is chosen by keyword match, purely decorative (every icon is
 * `aria-hidden` behind a text label), so a miss just falls back to a neutral
 * glyph. That keeps this robust to new interests appearing in the profile.
 */
const INTEREST_ICONS: Array<[RegExp, typeof Brush]> = [
  [/draw|sketch|paint|design/i, PenTool],
  [/creat/i, Brush],
  [/music|sing/i, Music],
  [/camera|photo/i, Camera],
  [/plant|garden|nature/i, Leaf],
  [/travel|explor.*place|new experience/i, Compass],
  [/friend|family|people|helping/i, Users],
  [/coffe|read|book/i, Coffee],
];

function iconFor(text: string): typeof Brush {
  for (const [pattern, icon] of INTEREST_ICONS) {
    if (pattern.test(text)) return icon;
  }
  return Sparkles;
}

export function FunCard({
  payload,
  pending = false,
}: {
  payload: FunPayload;
  pending?: boolean;
}) {
  const reduce = useReducedMotion();
  // `fun` is the server's key for interests; `interests` is an accepted alias.
  const interests = payload.fun ?? payload.interests ?? [];
  const strengths = Array.isArray(payload.strengths) ? payload.strengths : [];

  return (
    <CardShell label="Fun facts" delay={pending ? 0 : 0.04}>
      <CardHeader
        eyebrow="Off the clock"
        title="Beyond the coursework"
        icon={Heart}
      />

      {interests.length === 0 && strengths.length === 0 ? (
        <NoteBox>
          Nothing loaded yet. Try asking what I do for fun.
        </NoteBox>
      ) : null}

      {interests.length > 0 ? (
        <section aria-label="Interests" className="space-y-2">
          <h4 className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Interests
          </h4>
          <ul className="flex flex-wrap gap-2">
            {interests.map((interest, index) => {
              const Icon = iconFor(interest);
              return (
                <motion.li
                  key={interest}
                  initial={reduce ? false : { opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={
                    reduce
                      ? { duration: 0 }
                      : {
                          duration: 0.28,
                          delay: index * 0.04,
                          ease: [0.22, 1, 0.36, 1],
                        }
                  }
                >
                  <Pill tone="sage" className="py-1.5" data-cursor="card">
                    <Icon aria-hidden className="size-3.5" />
                    {interest}
                  </Pill>
                </motion.li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {strengths.length > 0 ? (
        <section aria-label="Strengths" className="mt-5 space-y-2">
          <h4 className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Strengths
          </h4>
          <ul className="flex flex-wrap gap-2">
            {strengths.map((strength, index) => (
              <motion.li
                key={strength.name ?? index}
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : {
                        duration: 0.28,
                        delay: index * 0.04,
                        ease: [0.22, 1, 0.36, 1],
                      }
                }
                className="max-w-full rounded-[var(--radius-md)] border border-border bg-background/40 px-2.5 py-1.5"
                data-cursor="card"
              >
                <span className="text-[length:var(--text-small)] font-medium">
                  {strength.name}
                </span>
                {strength.text ? (
                  <span className="ml-1.5 text-[length:var(--text-small)] text-muted-foreground">
                    {strength.text}
                  </span>
                ) : null}
              </motion.li>
            ))}
          </ul>
        </section>
      ) : null}

      {payload.growth ? (
        <section aria-label="What I am working on" className="mt-5">
          <h4 className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            What I am working on
          </h4>
          <p className="mt-2 text-[length:var(--text-small)] leading-relaxed text-foreground/85">
            {payload.growth}
          </p>
        </section>
      ) : null}
    </CardShell>
  );
}
