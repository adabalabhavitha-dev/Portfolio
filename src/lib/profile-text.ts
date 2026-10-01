/**
 * profile.ts → clean labelled plain text for the system prompt.
 *
 * The whole profile comfortably fits in a prompt, so there is no retrieval step:
 * `profileToText(profile)` is the FACTS block, and the model is told to use only
 * it. Everything here is a faithful transcription of `src/data/profile.ts` — no
 * fact is added, softened or removed.
 *
 * Two honesty rules are baked into the layout, because layout is what the model
 * actually reads:
 *
 *   1. Anything that is a wish rather than shipped work is written under the
 *      literal heading `GOALS, NOT COMPLETED`.
 *   2. Missing data is never printed as a blank. `github`, `codechef` and
 *      `resumeUrl` are empty strings today, so those lines are simply absent —
 *      the model therefore cannot mention a link that does not exist.
 *
 * `profile.about`, `growth` and `codingReflection` are written in the first
 * person because that is how the owner wrote them. They are transcribed
 * verbatim: rewriting someone's own words is how paraphrases quietly turn into
 * embellishments, and prompt.ts already tells the model to speak about her in
 * the third person.
 */

import { profile, type Status } from "@/data/profile";

/* ---------- structural input types ---------- *
 * Deliberately wider than `typeof profile` so this module is testable with a
 * trimmed fixture, and so the optional fields (implemented / perspective /
 * futureGoals / notProvided) can be read without narrowing each project.
 */

export interface SnapshotInput {
  currentStatus: string;
  careerDirection: string;
  learningPreference: string;
  programmingComfort: string;
}

export interface EducationInput {
  level: string;
  school: string;
  years: string;
  results: readonly string[];
  note?: string;
}

export interface SkillInput {
  area: string;
  status: Status;
  detail: string;
}

export interface ProjectInput {
  slug: string;
  title: string;
  kind: string;
  stack: readonly string[];
  summary: string;
  implemented?: readonly string[];
  perspective?: string;
  futureGoals?: readonly string[];
  notProvided?: string;
}

export interface StrengthInput {
  name: string;
  text: string;
}

export interface ProfileTextInput {
  name: string;
  shortName: string;
  headline: string;
  tagline: string;
  stage: string;
  email: string;
  linkedin: string;
  github: string;
  codechef: string;
  resumeUrl: string;
  about: readonly string[];
  snapshot: SnapshotInput;
  education: readonly EducationInput[];
  skillsDisclaimer: string;
  skills: readonly SkillInput[];
  projects: readonly ProjectInput[];
  coding: readonly string[];
  codingReflection: string;
  strengths: readonly StrengthInput[];
  growth: string;
  fun: readonly string[];
  goals: readonly string[];
  careerObjective: string;
  motto: string;
  languages: readonly string[];
}

/** Soft ceiling for the FACTS block. Verified by `pnpm exec tsx`-free check. */
export const PROFILE_TEXT_LIMIT = 12_000;

/** The heading future work must sit under. Referenced by prompt.ts + docs. */
export const GOALS_HEADING = "GOALS, NOT COMPLETED";

function isFilled(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Only non-empty entries, so the list never shows an empty bullet. */
function filled(values: readonly string[] | undefined): string[] {
  return (values ?? []).filter(isFilled);
}

/** Indented continuation lines, used for the per-item detail blocks. */
function block(indent: string, lines: string[]): string[] {
  return lines.filter((line) => line.length > 0).map((line) => indent + line);
}

function bullets(items: readonly string[], indent = "-"): string[] {
  return filled(items).map((item) => `${indent} ${item}`);
}

export function profileToText(p: ProfileTextInput = profile): string {
  const out: string[] = [];
  const section = (heading: string): void => {
    out.push("", heading);
  };

  /* ---------- ABOUT ---------- */
  section("ABOUT");
  out.push(`Full name: ${p.name}`);
  out.push(`Goes by: ${p.shortName}`);
  out.push(`Headline: ${p.headline}`);
  out.push(`Tagline: ${p.tagline}`);
  out.push(`Career stage: ${p.stage}`);
  out.push(...filled(p.about));

  /* ---------- SNAPSHOT ---------- */
  section("SNAPSHOT");
  out.push(`Current status: ${p.snapshot.currentStatus}`);
  out.push(`Career direction: ${p.snapshot.careerDirection}`);
  out.push(`Learning preference: ${p.snapshot.learningPreference}`);
  out.push(`Programming comfort: ${p.snapshot.programmingComfort}`);

  /* ---------- EDUCATION ---------- */
  if (p.education.length > 0) {
    section("EDUCATION");
    p.education.forEach((entry, index) => {
      out.push(`${index + 1}. ${entry.level} (${entry.school}, ${entry.years})`);
      const results = filled(entry.results);
      if (results.length > 0) out.push(...block("   ", [`Results: ${results.join(" | ")}`]));
      if (isFilled(entry.note)) out.push(...block("   ", [`Note: ${entry.note}`]));
    });
  }

  /* ---------- SKILLS ---------- */
  if (p.skills.length > 0) {
    section("SKILLS");
    // The disclaimer is part of the facts, not decoration: it is the sentence
    // that stops the model upgrading "learning" to "expert".
    if (isFilled(p.skillsDisclaimer)) out.push(`Disclaimer: ${p.skillsDisclaimer}`);
    for (const skill of p.skills) {
      const detail = isFilled(skill.detail) ? skill.detail : null;
      out.push(
        `- ${skill.area} [status: ${skill.status}]${detail ? ` — ${detail}` : ""}`,
      );
    }
  }

  /* ---------- PROJECTS ---------- */
  if (p.projects.length > 0) {
    section("PROJECTS");
    p.projects.forEach((project, index) => {
      out.push(`${index + 1}. ${project.title} (id: ${project.slug})`);
      if (isFilled(project.kind)) out.push(...block("   ", [`Kind: ${project.kind}`]));
      const stack = filled(project.stack);
      out.push(...block("   ", [stack.length > 0 ? `Stack: ${stack.join(", ")}` : ""]));
      if (isFilled(project.summary)) out.push(...block("   ", [`Summary: ${project.summary}`]));

      const implemented = filled(project.implemented);
      if (implemented.length > 0) {
        out.push(...block("   ", ["Implemented features:"]));
        out.push(...block("      ", bullets(implemented)));
      }

      if (isFilled(project.perspective)) {
        out.push(...block("   ", [`Her perspective: ${project.perspective}`]));
      }

      const goals = filled(project.futureGoals);
      if (goals.length > 0) {
        // The all-caps label is the single most important line in this file.
        out.push(...block("   ", [`${GOALS_HEADING}:`]));
        out.push(...block("      ", bullets(goals)));
      }

      if (isFilled(project.notProvided)) {
        out.push(...block("   ", [`Not provided: ${project.notProvided}`]));
      }
    });
  }

  /* ---------- CODING JOURNEY ---------- */
  const coding = filled(p.coding);
  if (coding.length > 0) {
    section("CODING JOURNEY");
    out.push(...bullets(coding));
    if (isFilled(p.codingReflection)) out.push(`Reflection: ${p.codingReflection}`);
  }

  /* ---------- STRENGTHS ---------- */
  if (p.strengths.length > 0) {
    section("STRENGTHS");
    for (const strength of p.strengths) {
      out.push(`- ${strength.name}: ${strength.text}`);
    }
  }

  /* ---------- GROWTH ---------- */
  if (isFilled(p.growth)) {
    section("GROWTH AND CURRENT FOCUS");
    out.push(p.growth);
  }

  /* ---------- INTERESTS ---------- */
  const fun = filled(p.fun);
  if (fun.length > 0) {
    section("INTERESTS (OUTSIDE COURSEWORK)");
    out.push(...bullets(fun));
  }

  /* ---------- GOALS ---------- */
  const goals = filled(p.goals);
  if (goals.length > 0) {
    section("GOALS (STILL TO DO, NOT ACHIEVED YET)");
    out.push(...bullets(goals));
  }

  /* ---------- CAREER OBJECTIVE ---------- */
  if (isFilled(p.careerObjective)) {
    section("CAREER OBJECTIVE");
    out.push(p.careerObjective);
  }

  /* ---------- MOTTO ---------- */
  if (isFilled(p.motto)) {
    section("MOTTO");
    out.push(p.motto);
  }

  /* ---------- LANGUAGES ---------- */
  const languages = filled(p.languages);
  if (languages.length > 0) {
    section("LANGUAGES");
    out.push(...bullets(languages));
  }

  /* ---------- CONTACT ---------- */
  section("CONTACT");
  out.push(`Email: ${p.email}`);
  out.push(`LinkedIn: ${p.linkedin}`);
  // Empty strings today. Absent rather than blank, so the model has nothing to
  // quote. These appear automatically once profile.ts is filled in.
  if (isFilled(p.github)) out.push(`GitHub: ${p.github}`);
  if (isFilled(p.codechef)) out.push(`CodeChef: ${p.codechef}`);
  if (isFilled(p.resumeUrl)) out.push(`Resume: ${p.resumeUrl}`);

  return out.join("\n").trim() + "\n";
}