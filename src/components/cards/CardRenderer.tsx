"use client";

import { Skeleton } from "@/components/ui/primitives";
import { AboutCard } from "@/components/cards/AboutCard";
import { ContactCard } from "@/components/cards/ContactCard";
import { EducationCard } from "@/components/cards/EducationCard";
import { FunCard } from "@/components/cards/FunCard";
import { ProjectsCard } from "@/components/cards/ProjectsCard";
import { SkillsCard } from "@/components/cards/SkillsCard";
import type { CardPayload } from "@/components/chat/types";

/**
 * Maps a validated CardPayload to the matching card component.
 *
 * `readCard()` in ../chat/types already rejected anything unrecognised, so the
 * default arm is only reachable if a caller hands us a raw payload directly.
 * It degrades to a skeleton rather than throwing — a malformed card must never
 * take down the transcript.
 */
export function CardRenderer({
  payload,
  pending = false,
}: {
  payload: CardPayload;
  pending?: boolean;
}) {
  switch (payload.kind) {
    case "about":
      return <AboutCard payload={payload} pending={pending} />;
    case "projects":
      return <ProjectsCard payload={payload} pending={pending} />;
    case "skills":
      return <SkillsCard payload={payload} pending={pending} />;
    case "education":
      return <EducationCard payload={payload} pending={pending} />;
    case "fun":
      return <FunCard payload={payload} pending={pending} />;
    case "contact":
      return <ContactCard payload={payload} pending={pending} />;
    default:
      return (
        <div className="space-y-2" aria-hidden>
          <Skeleton className="h-5 w-2/5" />
          <Skeleton className="h-20 w-full" />
        </div>
      );
  }
}
