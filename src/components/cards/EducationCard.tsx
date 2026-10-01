"use client";

import { motion, useReducedMotion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import { Pill } from "@/components/ui/primitives";
import { CardHeader, CardShell, NoteBox } from "@/components/cards/card-parts";
import { cn } from "@/lib/utils";
import type {
  EducationItem,
  EducationPayload,
} from "@/components/chat/types";

/**
 * Education card — a vertical timeline, newest first.
 *
 * The rail is a real element rather than a background-image gradient so it
 * inherits `currentColor` and stays correct in both themes without branching.
 */
export function EducationCard({
  payload,
  pending = false,
}: {
  payload: EducationPayload;
  pending?: boolean;
}) {
  const reduce = useReducedMotion();
  const entries = Array.isArray(payload.education) ? payload.education : [];

  return (
    <CardShell label="Education" delay={pending ? 0 : 0.04}>
      <CardHeader
        eyebrow="Academic background"
        title="Education"
        icon={GraduationCap}
      />

      {entries.length === 0 ? (
        <NoteBox>
          No education details loaded yet. Try asking where I studied.
        </NoteBox>
      ) : (
        <ol className="relative space-y-5 pl-6">
          {/* Continuous rail behind the markers. */}
          <span
            aria-hidden
            className="absolute left-[0.4375rem] top-2 bottom-2 w-px bg-border"
          />
          {entries.map((entry, index) => (
            <TimelineEntry
              key={entry.level ?? index}
              entry={entry}
              index={index}
              reduce={Boolean(reduce)}
              isLast={index === entries.length - 1}
            />
          ))}
        </ol>
      )}
    </CardShell>
  );
}

function TimelineEntry({
  entry,
  index,
  reduce,
  isLast,
}: {
  entry: EducationItem;
  index: number;
  reduce: boolean;
  isLast: boolean;
}) {
  const level = entry.level ?? "Qualification";
  const results = entry.results ?? [];

  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduce
          ? { duration: 0 }
          : { duration: 0.35, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }
      }
      className={cn("relative", isLast && "pb-0")}
      data-cursor="card"
    >
      {/* Marker sits on the rail. */}
      <span
        aria-hidden
        className="absolute -left-6 top-1.5 grid size-3.5 place-items-center rounded-full border-2 border-[var(--sage)] bg-background"
      />
      <div className="rounded-[var(--radius-md)] border border-border bg-background/40 px-3.5 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h4 className="text-[length:var(--text-small)] font-semibold leading-snug">
            {level}
          </h4>
          {entry.years ? (
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {entry.years}
            </span>
          ) : null}
        </div>

        {entry.school ? (
          <p className="mt-0.5 text-[length:var(--text-small)] text-muted-foreground">
            {entry.school}
          </p>
        ) : null}

        {results.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {results.map((result) => (
              <li key={result}>
                <Pill tone="sage">{result}</Pill>
              </li>
            ))}
          </ul>
        ) : null}

        {entry.note ? (
          <p className="mt-2.5 text-[length:var(--text-small)] leading-relaxed text-foreground/85">
            {entry.note}
          </p>
        ) : null}
      </div>
    </motion.li>
  );
}
