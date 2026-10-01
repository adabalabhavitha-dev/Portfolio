"use client";

import { FolderGit2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { GlassPanel, Pill } from "@/components/ui/primitives";
import {
  BulletList,
  CardHeader,
  CardShell,
  Disclosure,
  NoteBox,
} from "@/components/cards/card-parts";
import { cn } from "@/lib/utils";
import type { ProjectItem, ProjectsPayload } from "@/components/chat/types";

/**
 * Projects card.
 *
 * HONESTY IS LOAD-BEARING HERE. "What's implemented" is shipped work and reads
 * as such. "Improvement goals" uses <Pill tone="goal"> (a dashed coral outline,
 * defined in the frozen primitives) plus a coral bullet colour, so a goal can
 * never be mistaken for something already built. When a project has
 * `notProvided`, we show that gap instead of inventing a role or an outcome.
 */
export function ProjectsCard({
  payload,
  pending = false,
}: {
  payload: ProjectsPayload;
  pending?: boolean;
}) {
  const projects = Array.isArray(payload.projects) ? payload.projects : [];

  return (
    <CardShell label="Projects" delay={pending ? 0 : 0.04}>
      <CardHeader
        eyebrow="What I have built"
        title={projects.length === 1 ? "Project" : "Projects"}
        icon={FolderGit2}
      />

      {projects.length === 0 ? (
        <NoteBox>
          No project details loaded yet. Try asking which projects I have worked
          on.
        </NoteBox>
      ) : (
        <ProjectsLayout projects={projects} />
      )}
    </CardShell>
  );
}

/**
 * Mobile: a snap-scrolling carousel so each project gets full width.
 * Desktop: a two-column grid, so nothing is hidden behind a swipe.
 */
function ProjectsLayout({ projects }: { projects: ProjectItem[] }) {
  return (
    <div
      className={cn(
        "-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2",
        "sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0",
      )}
    >
      {projects.map((project, index) => (
        <div
          key={project.slug ?? project.title ?? index}
          className="w-[85%] shrink-0 snap-start sm:w-auto"
        >
          <ProjectEntry project={project} index={index} />
        </div>
      ))}
    </div>
  );
}

function ProjectEntry({
  project,
  index,
}: {
  project: ProjectItem;
  index: number;
}) {
  const reduce = useReducedMotion();
  const title = project.title ?? "Untitled project";
  const stack = project.stack ?? [];
  const implemented = project.implemented ?? [];
  const goals = project.futureGoals ?? [];
  const hasNotProvided = Boolean(project.notProvided);

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduce
          ? { duration: 0 }
          : { duration: 0.35, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }
      }
      className="h-full"
    >
      <GlassPanel
        className="h-full p-4"
        strong
        data-cursor="card"
        aria-label={title}
      >
        <h4 className="font-[family-name:var(--font-display)] text-base leading-snug text-balance">
          {title}
        </h4>

        {project.kind ? (
          <p className="mt-1 text-xs text-muted-foreground">{project.kind}</p>
        ) : null}

        {stack.length > 0 ? (
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {stack.map((tech) => (
              <li key={tech}>
                <Pill tone="neutral">{tech}</Pill>
              </li>
            ))}
          </ul>
        ) : null}

        {project.summary ? (
          <p className="mt-3 text-[length:var(--text-small)] leading-relaxed text-foreground/90">
            {project.summary}
          </p>
        ) : null}

        {hasNotProvided ? (
          <NoteBox className="mt-3">
            Individual role and outcome not listed.
          </NoteBox>
        ) : null}

        <div className="mt-3 space-y-1">
          {implemented.length > 0 ? (
            <Disclosure
              label="What's implemented"
              badge={
                <Pill tone="sage" className="shrink-0">
                  {implemented.length}
                </Pill>
              }
            >
              <BulletList items={implemented} />
              {project.perspective ? (
                <p className="mt-2.5 text-[length:var(--text-small)] leading-relaxed text-muted-foreground">
                  {project.perspective}
                </p>
              ) : null}
            </Disclosure>
          ) : null}

          {goals.length > 0 ? (
            <Disclosure
              label="Improvement goals"
              badge={
                <Pill tone="goal" className="shrink-0">
                  Goals, not done
                </Pill>
              }
            >
              <BulletList items={goals} tone="goal" />
            </Disclosure>
          ) : null}
        </div>

        {implemented.length === 0 && goals.length === 0 && !hasNotProvided ? (
          <NoteBox className="mt-3">
            Details for this project are not recorded yet.
          </NoteBox>
        ) : null}
      </GlassPanel>
    </motion.div>
  );
}
