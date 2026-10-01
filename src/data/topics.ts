/**
 * The five topic buttons under the chat box.
 *
 * Each button sends its `question` verbatim as a normal user message, so the
 * assistant answers it exactly as it would free text — the buttons are a
 * shortcut, not a different code path. All five questions are single-turn and
 * map 1:1 onto a tool, which is what makes them worth caching.
 *
 * `icon` is the lucide-react component itself, so the UI can render it directly:
 *
 *   const Icon = topic.icon;
 *   return <Icon className="size-4" aria-hidden />;
 *
 * Keep the questions phrased as a visitor would phrase them.
 */

import { FolderGit2, Mail, Palette, Sparkles, User, type LucideIcon } from "lucide-react";

export interface Topic {
  /** Stable React key and query-safe id. */
  id: string;
  /** Button text. */
  label: string;
  /** Rendered at `size-4`; hide from screen readers (`aria-hidden`). */
  icon: LucideIcon;
  /** Sent verbatim as the user message when the button is pressed. */
  question: string;
}

export const topics: readonly Topic[] = [
  {
    id: "me",
    label: "Me",
    icon: User,
    question: "Tell me about yourself",
  },
  {
    id: "projects",
    label: "Projects",
    icon: FolderGit2,
    question: "What projects have you worked on?",
  },
  {
    id: "skills",
    label: "Skills",
    icon: Sparkles,
    question: "What are your skills and what are you learning?",
  },
  {
    id: "fun",
    label: "Fun",
    icon: Palette,
    question: "What do you enjoy outside of coursework?",
  },
  {
    id: "contact",
    label: "Contact",
    icon: Mail,
    question: "How can I contact you?",
  },
] as const;

/** Look a topic up by id. Returns `undefined` for an unknown id. */
export function getTopic(id: string): Topic | undefined {
  return topics.find((topic) => topic.id === id);
}

export type TopicId = (typeof topics)[number]["id"];