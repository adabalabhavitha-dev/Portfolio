"use client";

import { Quote, UserRound } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CardHeader,
  CardShell,
  Disclosure,
  NoteBox,
} from "@/components/cards/card-parts";
import { cn } from "@/lib/utils";
import type { AboutPayload } from "@/components/chat/types";

/**
 * About card — avatar, short biography, and the motto in a highlighted quote.
 *
 * The first two paragraphs are always visible; the rest are behind "Read more"
 * so the card never dominates the conversation.
 */
export function AboutCard({
  payload,
  pending = false,
}: {
  payload: AboutPayload;
  pending?: boolean;
}) {
  const reduce = useReducedMotion();
  const paragraphs = Array.isArray(payload.about) ? payload.about : [];

  const lead = paragraphs.slice(0, 2);
  const rest = paragraphs.slice(2);
  const hasMore = rest.length > 0;

  // The snapshot is a flat key/value object; keep only the four keys the server
  // documents and drop anything blank so the list never renders an empty row.
  const snapshotRows = (
    [
      ["Status", payload.snapshot?.currentStatus],
      ["Career direction", payload.snapshot?.careerDirection],
      ["Learning style", payload.snapshot?.learningPreference],
      ["Programming", payload.snapshot?.programmingComfort],
    ] satisfies ReadonlyArray<readonly [string, string | undefined]>
  )
    .filter((row): row is [string, string] =>
      typeof row[1] === "string" && row[1].trim().length > 0,
    )
    .map((row) => [row[0], row[1]] as [string, string]);

  return (
    <CardShell label="About Bhavitha" delay={pending ? 0 : 0.04}>
      <CardHeader
        eyebrow="The person behind this"
        title={payload.name ?? "About me"}
        icon={UserRound}
      />

      <div className="flex items-center gap-4">
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={
            reduce ? { duration: 0 } : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
          }
        >
          <Avatar size="lg" data-cursor="card">
            {/* `avatarUrl` is absent from the tool payload — the portfolio draws
                its own avatar, so there is no raster to fall back to. */}
            {typeof payload.avatarUrl === "string" && payload.avatarUrl ? (
              <AvatarImage src={payload.avatarUrl} alt="" />
            ) : null}
            <AvatarFallback aria-hidden>B</AvatarFallback>
          </Avatar>
        </motion.div>
        <div className="min-w-0">
          {payload.headline ? (
            <p className="text-sm font-medium">{payload.headline}</p>
          ) : null}
          {payload.tagline ? (
            <p className="text-[length:var(--text-small)] text-muted-foreground">
              {payload.tagline}
            </p>
          ) : null}
          {payload.stage ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Current stage: {payload.stage}
            </p>
          ) : null}
        </div>
      </div>

      {lead.length > 0 ? (
        <div className="mt-4 space-y-3 text-[length:var(--text-small)] leading-relaxed text-foreground/90">
          {lead.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      ) : (
        <NoteBox className="mt-4">
          Ask me anything about my background, studies, or what I am learning.
        </NoteBox>
      )}

      {hasMore ? (
        <div className="mt-2">
          <Disclosure label="Read more">
            <div className="space-y-3 text-[length:var(--text-small)] leading-relaxed text-foreground/90">
              {rest.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </Disclosure>
        </div>
      ) : null}

      {snapshotRows.length > 0 ? (
        <div className="mt-2">
          <Disclosure label="Where things stand">
            <dl className="space-y-2">
              {snapshotRows.map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-[minmax(0,7rem)_1fr] gap-x-3 gap-y-0.5"
                >
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="text-[length:var(--text-small)] leading-relaxed">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </Disclosure>
        </div>
      ) : null}

      {payload.motto ? (
        <motion.blockquote
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reduce
              ? { duration: 0 }
              : { duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }
          }
          className={cn(
            "mt-4 flex gap-2.5 rounded-[var(--radius-md)] border-l-2 border-[var(--sage)]",
            "bg-[var(--sage-soft)] px-4 py-3",
          )}
        >
          <Quote aria-hidden className="mt-0.5 size-4 shrink-0 text-[var(--sage)]" />
          <p className="font-[family-name:var(--font-display)] text-[length:var(--text-small)] leading-relaxed text-balance">
            {payload.motto}
          </p>
        </motion.blockquote>
      ) : null}
    </CardShell>
  );
}
