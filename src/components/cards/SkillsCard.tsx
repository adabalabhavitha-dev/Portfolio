"use client";

import { Info, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Pill } from "@/components/ui/primitives";
import {
  BulletList,
  CardHeader,
  CardShell,
  Disclosure,
  NoteBox,
  statusLabel,
  statusTone,
} from "@/components/cards/card-parts";
import type { SkillItem, SkillsPayload } from "@/components/chat/types";

/**
 * Skills card.
 *
 * DELIBERATE OMISSION: no percentage bars, no star ratings, no "8/10". Any
 * numeric proficiency score would be invented precision — this is a learning
 * stage, not an assessment. Each row states the area, a plain status, and an
 * honest one-line detail instead.
 */
export function SkillsCard({
  payload,
  pending = false,
}: {
  payload: SkillsPayload;
  pending?: boolean;
}) {
  const reduce = useReducedMotion();
  const skills = Array.isArray(payload.skills) ? payload.skills : [];
  const journey = Array.isArray(payload.codingJourney) ? payload.codingJourney : [];
  const goals = Array.isArray(payload.goals) ? payload.goals : [];

  return (
    <CardShell label="Skills" delay={pending ? 0 : 0.04}>
      <CardHeader
        eyebrow="Where I am right now"
        title="Skills"
        icon={Sparkles}
      />

      {payload.skillsDisclaimer ? (
        <div
          className="mb-4 flex gap-2.5 rounded-[var(--radius-md)] border border-[var(--sage)]/25 bg-[var(--sage-soft)] px-3 py-2.5"
          role="note"
        >
          <Info
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-[var(--sage)]"
          />
          <p className="text-[length:var(--text-small)] leading-relaxed text-foreground/85">
            {payload.skillsDisclaimer}
          </p>
        </div>
      ) : null}

      {skills.length === 0 ? (
        <NoteBox>
          No skill details loaded yet. Try asking what I am currently learning.
        </NoteBox>
      ) : (
        <ul className="space-y-2.5">
          {skills.map((skill, index) => (
            <SkillRow
              key={skill.area ?? index}
              skill={skill}
              index={index}
              reduce={Boolean(reduce)}
            />
          ))}
        </ul>
      )}

      {journey.length > 0 ? (
        <div className="mt-4 space-y-1">
          <Disclosure
            label="Practice so far"
            badge={
              <Pill tone="sage" className="shrink-0">
                {journey.length}
              </Pill>
            }
          >
            <BulletList items={journey} />
            {payload.codingReflection ? (
              <p className="mt-2.5 text-[length:var(--text-small)] leading-relaxed text-muted-foreground">
                {payload.codingReflection}
              </p>
            ) : null}
          </Disclosure>
        </div>
      ) : null}

      {goals.length > 0 ? (
        <div className="mt-1 space-y-1">
          <Disclosure
            label="Where I want to get to"
            badge={
              <Pill tone="goal" className="shrink-0">
                Goals, not done
              </Pill>
            }
          >
            <BulletList items={goals} tone="goal" />
          </Disclosure>
        </div>
      ) : null}
    </CardShell>
  );
}

function SkillRow({
  skill,
  index,
  reduce,
}: {
  skill: SkillItem;
  index: number;
  reduce: boolean;
}) {
  const area = skill.area ?? "Unnamed area";
  const status = skill.status;

  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={
        reduce
          ? { duration: 0 }
          : { duration: 0.3, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }
      }
      className="rounded-[var(--radius-md)] border border-border bg-background/40 px-3 py-2.5"
      data-cursor="card"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <span className="text-[length:var(--text-small)] font-medium">
          {area}
        </span>
        <Pill tone={statusTone(status)}>{statusLabel(status)}</Pill>
      </div>
      {skill.detail ? (
        <p className="mt-1 text-[length:var(--text-small)] leading-relaxed text-muted-foreground">
          {skill.detail}
        </p>
      ) : null}
    </motion.li>
  );
}
