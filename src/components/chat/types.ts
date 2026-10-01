import { isToolUIPart, type ChatStatus as AiChatStatus, type UIMessage } from "ai";

/**
 * Shared UI types for the chat + cards area.
 *
 * This file is the client-side half of the contract documented in
 * `src/lib/tools.ts` (agent D's area). Verified against that file:
 *
 *   - The card kind is carried by the TOOL NAME, not by a field on the payload.
 *     `part.type` is `tool-showAbout` / `tool-showProjects` / `tool-showSkills`
 *     / `tool-showEducation` / `tool-showFun` / `tool-showContact`, and
 *     `part.output` is a plain object with no `kind` discriminator.
 *   - `showFun` returns its interests under the key `fun`, not `interests`.
 *   - Optional links come back as `string | null` (null while profile.ts has an
 *     empty string), so a null must never render a button.
 *
 * TOLERANCE IS THE POINT. `readCard` never throws: it resolves a kind from the
 * tool name, then an explicit `kind` field, then the shape of the object
 * itself, and returns `null` only when all three fail. A `null` means the
 * caller falls back to the plain text path.
 */

/** Mirrors `ai`'s ChatStatus so we never drift from the SDK. */
export type ChatStatus = AiChatStatus;

/** The six card variants the assistant can produce. */
export type CardKind =
  | "about"
  | "projects"
  | "skills"
  | "education"
  | "fun"
  | "contact";

export const CARD_KINDS: readonly CardKind[] = [
  "about",
  "projects",
  "skills",
  "education",
  "fun",
  "contact",
];

/* ------------------------------------------------------------------ *
 * Tool name -> card kind
 * ------------------------------------------------------------------ */

/**
 * Maps the UI part type to a card kind. Keys match `chatTools` in
 * `src/lib/tools.ts`. Kept as a data map (not a switch on `part.type`) so an
 * unexpected tool name is a lookup miss rather than a type error.
 */
export const CARD_PART_TYPES: Readonly<Record<string, CardKind>> = {
  "tool-showAbout": "about",
  "tool-showProjects": "projects",
  "tool-showSkills": "skills",
  "tool-showEducation": "education",
  "tool-showFun": "fun",
  "tool-showContact": "contact",
};

/* ------------------------------------------------------------------ *
 * Payload variants
 *
 * Field names match `src/lib/tools.ts`. Everything is optional and every
 * variant carries an index signature, so a partial or extended payload from a
 * future server build still type-checks and still renders.
 * ------------------------------------------------------------------ */

export interface AboutPayload {
  [key: string]: unknown;
  name?: string;
  shortName?: string;
  headline?: string;
  tagline?: string;
  stage?: string;
  /** Biography paragraphs, verbatim from the profile. */
  about?: string[];
  snapshot?: {
    [key: string]: unknown;
    currentStatus?: string;
    careerDirection?: string;
    learningPreference?: string;
    programmingComfort?: string;
  };
  motto?: string;
}

export interface ProjectItem {
  [key: string]: unknown;
  slug?: string;
  title?: string;
  kind?: string;
  stack?: string[];
  summary?: string;
  /** Shipped work. */
  implemented?: string[];
  perspective?: string | null;
  /** Goals, NOT shipped work. Rendered with <Pill tone="goal">. */
  futureGoals?: string[];
  /**
   * Present when the source genuinely does not record the individual role or
   * outcome (the hackathon). The card shows a muted note instead of guessing.
   */
  notProvided?: string | null;
}

export interface ProjectsPayload {
  [key: string]: unknown;
  projects?: ProjectItem[];
}

export interface SkillItem {
  [key: string]: unknown;
  area?: string;
  status?: "completed" | "learning" | "goal" | string;
  detail?: string;
}

export interface SkillsPayload {
  [key: string]: unknown;
  skills?: SkillItem[];
  skillsDisclaimer?: string;
  /** Practice history, e.g. the CodeChef problems recorded in the resume. */
  codingJourney?: string[];
  codingReflection?: string;
  /** Longer-term aims. Rendered as goals, never as achievements. */
  goals?: string[];
}

export interface EducationItem {
  [key: string]: unknown;
  level?: string;
  school?: string;
  years?: string;
  results?: string[];
  note?: string | null;
}

export interface EducationPayload {
  [key: string]: unknown;
  education?: EducationItem[];
}

export interface StrengthItem {
  [key: string]: unknown;
  name?: string;
  text?: string;
}

export interface FunPayload {
  [key: string]: unknown;
  /**
   * Interests. The server sends this as `fun`; `interests` is accepted as an
   * alias so either key works.
   */
  fun?: string[];
  interests?: string[];
  strengths?: StrengthItem[];
  growth?: string;
}

export interface ContactPayload {
  [key: string]: unknown;
  email?: string;
  linkedin?: string;
  /** Optional links — null/empty must never render a button. */
  github?: string | null;
  codechef?: string | null;
  resumeUrl?: string | null;
}

/**
 * Discriminated on `kind`, with a catch-all arm so a payload from a future
 * server build still satisfies the union instead of breaking the switch.
 */
export type CardPayload =
  | ({ kind: "about" } & AboutPayload)
  | ({ kind: "projects" } & ProjectsPayload)
  | ({ kind: "skills" } & SkillsPayload)
  | ({ kind: "education" } & EducationPayload)
  | ({ kind: "fun" } & FunPayload)
  | ({ kind: "contact" } & ContactPayload)
  | { kind: string; [key: string]: unknown };

/* ------------------------------------------------------------------ *
 * Coercion helpers
 * ------------------------------------------------------------------ */

/** Reads a string, tolerating null/undefined/non-strings/blank. */
function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

/** Reads a string array, dropping non-strings and blanks. Never null. */
function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is string => typeof v === "string" && v.trim().length > 0,
  );
}

/** Reads an array of records. */
function asRecords(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is Record<string, unknown> => typeof v === "object" && v !== null,
  );
}

function mapItems<T>(
  value: unknown,
  map: (raw: Record<string, unknown>) => T,
): T[] {
  return asRecords(value).map(map);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** True for http(s), mailto, and site-relative paths. Rejects junk schemes. */
export function isSafeLink(value: string | undefined | null): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.startsWith("/")) return true;
  if (trimmed.startsWith("mailto:")) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** Narrowing helper for the six known kinds. */
export function isKnownCardKind(kind: string): kind is CardKind {
  return (CARD_KINDS as readonly string[]).includes(kind);
}

/**
 * Last-resort kind resolution by sniffing the object's own shape.
 *
 * Never used for the six real tools (the tool name is authoritative), but it
 * means a renamed tool still renders the right card instead of degrading to
 * plain text.
 */
function sniffKind(raw: Record<string, unknown>): CardKind | null {
  if (Array.isArray(raw.education)) return "education";
  if (Array.isArray(raw.projects)) return "projects";
  if (Array.isArray(raw.skills)) return "skills";
  if (Array.isArray(raw.strengths) || Array.isArray(raw.fun)) return "fun";
  if (asString(raw.email) || asString(raw.linkedin)) return "contact";
  if (Array.isArray(raw.about) || asString(raw.motto)) return "about";
  return null;
}

/* ------------------------------------------------------------------ *
 * Normalisation
 * ------------------------------------------------------------------ */

/**
 * Normalises an unknown tool output into a CardPayload.
 *
 * `kindHint` is the kind derived from the tool name; it wins. If it is absent we
 * look for an explicit `kind`/`cardKind` field, then sniff the shape. Returns
 * `null` when none of those resolve, which is the signal to render plain text.
 */
export function readCard(
  input: unknown,
  kindHint?: CardKind,
): CardPayload | null {
  if (!isRecord(input)) return null;
  const raw = input;

  const kind: CardKind | null =
    kindHint ??
    (() => {
      const declared = asString(raw.kind) ?? asString(raw.cardKind);
      if (declared && isKnownCardKind(declared)) return declared;
      return sniffKind(raw);
    })();

  if (!kind) return null;

  switch (kind) {
    case "about": {
      const snapshot = isRecord(raw.snapshot) ? raw.snapshot : undefined;
      return {
        kind: "about",
        ...raw,
        name: asString(raw.name),
        shortName: asString(raw.shortName),
        headline: asString(raw.headline),
        tagline: asString(raw.tagline),
        stage: asString(raw.stage),
        motto: asString(raw.motto),
        about: Array.isArray(raw.about) ? asStringArray(raw.about) : undefined,
        snapshot: snapshot
          ? {
              ...snapshot,
              currentStatus: asString(snapshot.currentStatus),
              careerDirection: asString(snapshot.careerDirection),
              learningPreference: asString(snapshot.learningPreference),
              programmingComfort: asString(snapshot.programmingComfort),
            }
          : undefined,
      };
    }
    case "projects":
      return {
        kind: "projects",
        ...raw,
        projects: mapItems(raw.projects, (p) => ({
          ...p,
          title: asString(p.title),
          kind: asString(p.kind),
          slug: asString(p.slug),
          summary: asString(p.summary),
          perspective: asString(p.perspective),
          notProvided: asString(p.notProvided),
          stack: asStringArray(p.stack),
          implemented: asStringArray(p.implemented),
          futureGoals: asStringArray(p.futureGoals),
        })),
      };
    case "skills":
      return {
        kind: "skills",
        ...raw,
        skillsDisclaimer: asString(raw.skillsDisclaimer),
        codingReflection: asString(raw.codingReflection),
        skills: mapItems(raw.skills, (s) => ({
          ...s,
          area: asString(s.area),
          detail: asString(s.detail),
          status: asString(s.status),
        })),
        codingJourney: asStringArray(raw.codingJourney),
        goals: asStringArray(raw.goals),
      };
    case "education":
      return {
        kind: "education",
        ...raw,
        education: mapItems(raw.education, (e) => ({
          ...e,
          level: asString(e.level),
          school: asString(e.school),
          years: asString(e.years),
          note: asString(e.note),
          results: asStringArray(e.results),
        })),
      };
    case "fun":
      return {
        kind: "fun",
        ...raw,
        growth: asString(raw.growth),
        // `fun` is what the server sends; `interests` is the friendlier alias.
        fun: asStringArray(raw.fun ?? raw.interests),
        strengths: mapItems(raw.strengths, (s) => ({
          ...s,
          name: asString(s.name),
          text: asString(s.text),
        })),
      };
    case "contact":
      return {
        kind: "contact",
        ...raw,
        email: asString(raw.email),
        linkedin: asString(raw.linkedin),
        github: asString(raw.github),
        codechef: asString(raw.codechef),
        resumeUrl: asString(raw.resumeUrl),
      };
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ *
 * Tool part extraction
 * ------------------------------------------------------------------ */

export type AssistantPart = UIMessage["parts"][number];

/**
 * Pulls a card payload out of an assistant message part.
 *
 * Uses the SDK's own `isToolUIPart` guard, which covers both statically-typed
 * tool parts (`tool-<name>`) and `dynamic-tool` parts. Only `output-available`
 * counts: a tool still streaming its input, or one that errored, must not flash
 * an empty card. Returns `null` when there is no card, so the caller can skip
 * the part entirely.
 */
export function cardFromToolPart(part: AssistantPart): CardPayload | null {
  if (!isToolUIPart(part)) return null;
  if (part.state !== "output-available") return null;
  return readCard(part.output, CARD_PART_TYPES[part.type]);
}

/** True when the part carries a usable card. */
export function hasCard(part: AssistantPart): boolean {
  return cardFromToolPart(part) !== null;
}

/* ------------------------------------------------------------------ *
 * Topics
 * ------------------------------------------------------------------ */

/**
 * `Topic` is NOT declared here. Agent D owns `src/data/topics.ts`, which is the
 * single source of truth for the five conversation starters. It did not exist
 * when this area was first written, so a local copy was used as a fallback;
 * that copy has since been deleted in favour of the real module. Re-exported
 * here only so the chat barrel stays a single import site.
 */
export type { Topic } from "@/data/topics";
