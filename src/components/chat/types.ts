import { isToolUIPart, type ChatStatus as AiChatStatus, type UIMessage } from "ai";
import type { LucideIcon } from "lucide-react";

/**
 * Shared UI types for the chat + cards area.
 *
 * TOLERANCE IS THE POINT. Agent D owns the API route and the tool schemas; this
 * file is the client-side contract. Every payload carries an index signature so
 * an unexpected or partial payload from the server still type-checks and — more
 * importantly — still *renders*. `readCard` degrades to `null` for anything it
 * cannot recognise, and the caller then falls back to the plain text path.
 * Nothing here throws.
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
 * Payload variants
 * ------------------------------------------------------------------ */

export interface AboutPayload {
  [key: string]: unknown;
  name?: string;
  headline?: string;
  tagline?: string;
  stage?: string;
  /** Biography paragraphs. */
  about?: string[];
  motto?: string;
  avatarUrl?: string;
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
  perspective?: string;
  /** Goals, NOT shipped work. Rendered with <Pill tone="goal">. */
  futureGoals?: string[];
  /**
   * Present when the source genuinely does not record the individual role or
   * outcome (the hackathon). The card shows a muted note instead of guessing.
   */
  notProvided?: string;
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
}

export interface EducationItem {
  [key: string]: unknown;
  level?: string;
  school?: string;
  years?: string;
  results?: string[];
  note?: string;
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
  interests?: string[];
  strengths?: StrengthItem[];
}

export interface ContactPayload {
  [key: string]: unknown;
  email?: string;
  linkedin?: string;
  /** Optional links — empty strings must never render a button. */
  github?: string;
  codechef?: string;
  resumeUrl?: string;
}

/**
 * Discriminated on `kind` so a switch is exhaustive, with a catch-all arm for
 * payloads from a future/older server build.
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

/** Reads a string, tolerating non-strings. */
function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

/** Reads a string array, dropping non-strings and blanks. Never returns null. */
function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
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

/** True for http(s), mailto, and site-relative paths. Rejects junk schemes. */
export function isSafeLink(value: string | undefined): value is string {
  if (!value) return false;
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

/**
 * Normalises an unknown tool output into a CardPayload.
 *
 * Returns `null` for anything unrecognised so the caller can fall back to the
 * plain text path instead of rendering a half-broken card.
 */
export function readCard(input: unknown): CardPayload | null {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return null;
  }
  const raw = input as Record<string, unknown>;
  const kind = asString(raw.kind) ?? asString(raw.cardKind);
  if (!kind) return null;

  switch (kind) {
    case "about":
      return {
        kind: "about",
        ...raw,
        name: asString(raw.name),
        headline: asString(raw.headline),
        tagline: asString(raw.tagline),
        stage: asString(raw.stage),
        motto: asString(raw.motto),
        about: Array.isArray(raw.about) ? asStringArray(raw.about) : undefined,
      };
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
        skills: mapItems(raw.skills, (s) => ({
          ...s,
          area: asString(s.area),
          detail: asString(s.detail),
          status: asString(s.status),
        })),
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
        interests: asStringArray(raw.interests),
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
      // Unknown future kind: pass it through so the plain-text fallback runs.
      return null;
  }
}

/** Narrowing helper for the six known kinds. */
export function isKnownCardKind(kind: string): kind is CardKind {
  return (CARD_KINDS as readonly string[]).includes(kind);
}

/* ------------------------------------------------------------------ *
 * Tool result extraction
 * ------------------------------------------------------------------ */

/**
 * The tool name agent D's server calls to render a card. Kept as a constant so
 * a rename is a one-line change here rather than a hunt through the UI.
 */
export const CARD_TOOL_NAME = "showCard";

export type AssistantPart = UIMessage["parts"][number];

/**
 * Pulls a card payload out of a tool part's output.
 *
 * Uses the SDK's own `isToolUIPart` guard, which covers both statically-typed
 * tool parts (`tool-<name>`) and `dynamic-tool` parts. Only `output-available`
 * counts: a tool still streaming its input, or one that errored, must not flash
 * an empty card. Anything unparseable returns `null` so the caller renders
 * nothing rather than something broken.
 */
export function cardFromToolPart(part: AssistantPart): CardPayload | null {
  if (!isToolUIPart(part)) return null;
  if (part.state !== "output-available") return null;
  return readCard(part.output);
}

/** True when the part carries a usable card. */
export function hasCard(part: AssistantPart): boolean {
  return cardFromToolPart(part) !== null;
}

/* ------------------------------------------------------------------ *
 * Topics
 * ------------------------------------------------------------------ */

export interface Topic {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Sent verbatim as the user message when the pill is tapped. */
  question: string;
}
