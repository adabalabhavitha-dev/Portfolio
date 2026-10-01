/**
 * The six generative-UI tools.
 *
 * Each tool returns a plain object straight from `src/data/profile.ts` — no
 * network calls, no database, no computation. The chat UI renders a card from
 * the tool output, so the payload shapes below ARE the client contract. They are
 * documented here because they cannot be changed without coordinating with the
 * card components.
 *
 * ── How the client sees them ────────────────────────────────────────────────
 * With `chatTools` passed to `streamText`, the AI SDK emits UI message parts
 * named `tool-showAbout`, `tool-showProjects`, `tool-showSkills`,
 * `tool-showEducation`, `tool-showFun` and `tool-showContact`. Render them by
 * switching on `part.type` and then on `part.state`:
 *
 *   part.state === "input-streaming"   // arguments still streaming in
 *   part.state === "input-available"   // part.input is complete, no output yet
 *   part.state === "output-available"  // part.output is the payload below  ← render
 *   part.state === "output-error"      // part.errorText
 *   part.state === "output-denied"     // tool call denied (needs approval)
 *   part.state === "approval-requested" | "approval-responded"
 *
 * Because these tools execute server-side, `output-available` is the normal
 * terminal state. `approval-requested` / `output-denied` cannot occur here
 * (no `toolApproval` is configured) but are listed so an exhaustive switch
 * compiles cleanly. `step-start` parts appear between multi-step generations.
 *
 * Every tool takes an empty input object — the model has nothing to parameterise,
 * the payload is the whole answer. `inputSchema: z.object({})` is the shape used
 * by the official AI SDK chatbot-with-tools guide.
 */

import { tool, type InferUITools, type UIDataTypes, type UIMessage } from "ai";
import { z } from "zod";

import { hasLink, profile } from "@/data/profile";

/* ═══════════════════════════════════════════════════════════════════════════
   PAYLOAD TYPES — the client contract
   ═══════════════════════════════════════════════════════════════════════════ */

/** `showAbout` → `part.output` when `part.type === "tool-showAbout"`. */
export interface AboutPayload {
  name: string;
  shortName: string;
  headline: string;
  tagline: string;
  stage: string;
  /** First-person paragraphs from `profile.about`, verbatim. */
  about: string[];
  snapshot: {
    currentStatus: string;
    careerDirection: string;
    learningPreference: string;
    programmingComfort: string;
  };
  motto: string;
}

/** One entry of `showProjects` → `part.output.projects`. */
export interface ProjectCardPayload {
  /** Stable key for React lists. */
  slug: string;
  title: string;
  kind: string;
  /** Empty when the project names no stack (e.g. the hackathon). */
  stack: string[];
  summary: string;
  /**
   * Features that actually shipped. Empty array means "none recorded" — never
   * render a heading for it.
   */
  implemented: string[];
  /**
   * Things she WANTS to do. Must be rendered under a "goals, not completed"
   * label — the whole point of the payload is that it is clearly not done work.
   */
  futureGoals: string[];
  /** First-person reflection on the project, or `null` when not recorded. */
  perspective: string | null;
  /**
   * The explicit gap (e.g. the hackathon's individual role). `null` when the
   * project has no gap. When non-null the assistant must say it does not have
   * those details.
   */
  notProvided: string | null;
}

/** `showProjects` → `part.output` when `part.type === "tool-showProjects"`. */
export interface ProjectsPayload {
  projects: ProjectCardPayload[];
}

/** One entry of `showSkills` → `part.output.skills`. */
export interface SkillCardPayload {
  area: string;
  /** `"completed" | "learning" | "goal"` — from `profile.Status`. */
  status: "completed" | "learning" | "goal";
  detail: string;
}

/** `showSkills` → `part.output` when `part.type === "tool-showSkills"`. */
export interface SkillsPayload {
  skills: SkillCardPayload[];
  /**
   * Show this with the list. It is the sentence that stops "learning" from
   * being rendered as "expert".
   */
  skillsDisclaimer: string;
  codingJourney: string[];
  codingReflection: string;
  /** Longer-term aims. Label as goals, not achievements. */
  goals: string[];
}

/** One entry of `showEducation` → `part.output.education`. */
export interface EducationCardPayload {
  level: string;
  school: string;
  years: string;
  results: string[];
  /** `null` when the entry has no note (intermediate, secondary). */
  note: string | null;
}

/** `showEducation` → `part.output` when `part.type === "tool-showEducation"`. */
export interface EducationPayload {
  education: EducationCardPayload[];
}

/** One entry of `showFun` → `part.output.strengths`. */
export interface StrengthCardPayload {
  name: string;
  text: string;
}

/** `showFun` → `part.output` when `part.type === "tool-showFun"`. */
export interface FunPayload {
  fun: string[];
  strengths: StrengthCardPayload[];
  growth: string;
}

/** `showContact` → `part.output` when `part.type === "tool-showContact"`. */
export interface ContactPayload {
  email: string;
  linkedin: string;
  /**
   * `null` while the corresponding field in `profile.ts` is an empty string.
   * Render a link ONLY when the value is non-null — never substitute a guess.
   */
  github: string | null;
  codechef: string | null;
  resumeUrl: string | null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   TOOLS
   ═══════════════════════════════════════════════════════════════════════════ */

const noInput = z.object({});

function optionalLink(value: string): string | null {
  return hasLink(value) ? value : null;
}

export const showAbout = tool({
  description:
    "Show the About card: who Bhavitha is, her headline and tagline, her career stage, " +
    "her about paragraphs, her current snapshot (status, career direction, learning " +
    "preference, programming comfort) and her motto. Call this when the visitor asks " +
    "who Bhavitha is, for an introduction, a summary, a headline, or what she is " +
    "currently doing. Do NOT call it for projects, skills, education, interests or contact.",
  inputSchema: noInput,
  execute: async (): Promise<AboutPayload> => ({
    name: profile.name,
    shortName: profile.shortName,
    headline: profile.headline,
    tagline: profile.tagline,
    stage: profile.stage,
    about: [...profile.about],
    snapshot: {
      currentStatus: profile.snapshot.currentStatus,
      careerDirection: profile.snapshot.careerDirection,
      learningPreference: profile.snapshot.learningPreference,
      programmingComfort: profile.snapshot.programmingComfort,
    },
    motto: profile.motto,
  }),
});

export const showProjects = tool({
  description:
    "Show the Projects card: every project with its kind, stack, summary, the features " +
    "that were actually implemented, her perspective, and her future goals (which are " +
    "GOALS, NOT completed work) plus any details that were not provided. Call this when " +
    "the visitor asks what she has built, worked on, or for a specific project such as " +
    "the Attendance Management System, the BMI calculator or the FinTech hackathon. " +
    "Do NOT call it for skills, education, interests or contact.",
  inputSchema: noInput,
  execute: async (): Promise<ProjectsPayload> => ({
    projects: profile.projects.map((project) => ({
      slug: project.slug,
      title: project.title,
      kind: project.kind,
      stack: [...project.stack],
      summary: project.summary,
      implemented: [...("implemented" in project ? project.implemented : [])],
      futureGoals: [...("futureGoals" in project ? project.futureGoals : [])],
      perspective:
        "perspective" in project && project.perspective ? project.perspective : null,
      notProvided:
        "notProvided" in project && project.notProvided ? project.notProvided : null,
    })),
  }),
});

export const showSkills = tool({
  description:
    "Show the Skills card: every skill area with its learning status and detail, the " +
    "skills disclaimer, her coding journey (including the 500 CodeChef problems recorded " +
    "in her resume), her coding reflection and her goals. Call this when the visitor asks " +
    "about her skills, programming languages, tools, DSA practice or what she is learning. " +
    "Do NOT call it for projects, education, interests or contact.",
  inputSchema: noInput,
  execute: async (): Promise<SkillsPayload> => ({
    skills: profile.skills.map((skill) => ({
      area: skill.area,
      status: skill.status,
      detail: skill.detail,
    })),
    skillsDisclaimer: profile.skillsDisclaimer,
    codingJourney: [...profile.coding],
    codingReflection: profile.codingReflection,
    goals: [...profile.goals],
  }),
});

export const showEducation = tool({
  description:
    "Show the Education card: her B.Tech Information Technology (2024-2028) with the " +
    "first-year and second-year CGPAs, Intermediate (92.5%) and Secondary School " +
    "Certificate (89.2%). Call this when the visitor asks where she studies, about her " +
    "grades, CGPA, percentages, college, school or qualifications. Do NOT call it for " +
    "projects, skills, interests or contact.",
  inputSchema: noInput,
  execute: async (): Promise<EducationPayload> => ({
    education: profile.education.map((entry) => ({
      level: entry.level,
      school: entry.school,
      years: entry.years,
      results: [...entry.results],
      note: "note" in entry && entry.note ? entry.note : null,
    })),
  }),
});

export const showFun = tool({
  description:
    "Show the Fun card: what she enjoys outside coursework (drawing, gardening, time " +
    "with friends and family and so on), her strengths, and what she is working on. " +
    "Call this when the visitor asks what she does for fun, her hobbies, interests, " +
    "strengths, weaknesses or what she is working on improving. Do NOT call it for " +
    "projects, skills, education or contact.",
  inputSchema: noInput,
  execute: async (): Promise<FunPayload> => ({
    fun: [...profile.fun],
    strengths: profile.strengths.map((strength) => ({
      name: strength.name,
      text: strength.text,
    })),
    growth: profile.growth,
  }),
});

export const showContact = tool({
  description:
    "Show the Contact card: her email address and LinkedIn URL, plus GitHub, CodeChef " +
    "and the resume link when they exist. Call this when the visitor asks how to reach " +
    "her, contact her, email her, or asks for her social profiles, GitHub, CodeChef or " +
    "resume. Do NOT call it for projects, skills, education or interests.",
  inputSchema: noInput,
  execute: async (): Promise<ContactPayload> => ({
    email: profile.email,
    linkedin: profile.linkedin,
    github: optionalLink(profile.github),
    codechef: optionalLink(profile.codechef),
    resumeUrl: optionalLink(profile.resumeUrl),
  }),
});

/* ═══════════════════════════════════════════════════════════════════════════
   TOOL SET + CLIENT-SIDE TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

/** Passed straight to `streamText({ tools: chatTools })`. */
export const chatTools = {
  showAbout,
  showProjects,
  showSkills,
  showEducation,
  showFun,
  showContact,
} as const;

/** Every tool name, for exhaustive switches on `part.type`. */
export const toolNames = [
  "showAbout",
  "showProjects",
  "showSkills",
  "showEducation",
  "showFun",
  "showContact",
] as const;

export type ChatToolName = (typeof toolNames)[number];

/** Maps each tool name to `{ input, output }`. */
export type ChatTools = InferUITools<typeof chatTools>;

/**
 * The message type the chat UI should use, so `part.output` is typed for every
 * card. Both `@/lib/tools` and `@/app/api/chat/route` export it — the route
 * re-export exists because the AI SDK docs show
 * `import type { MyUIMessage } from './api/chat/route'`.
 */
export type ChatUIMessage = UIMessage<never, UIDataTypes, ChatTools>;