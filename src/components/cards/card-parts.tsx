"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { GlassPanel, Pill } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

/**
 * Shared chrome for the six cards. Deliberately dumb: layout, entrance
 * animation, and the collapsible pattern. No card-specific logic lives here.
 */

/** One shared entrance so all six cards feel like the same family. */
export function CardShell({
  children,
  className,
  label,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  /** Accessible name for the panel, e.g. "Projects". */
  label: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.section
      aria-label={label}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduce
          ? { duration: 0 }
          : { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }
      }
      className={cn("min-w-0", className)}
    >
      <GlassPanel interactive className="p-5" data-cursor="card">
        {children}
      </GlassPanel>
    </motion.section>
  );
}

/** Eyebrow + title header used at the top of every card. */
export function CardHeader({
  eyebrow,
  title,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <header className="mb-4 flex items-start gap-3">
      {Icon ? (
        <span
          aria-hidden
          className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-[var(--sage-soft)] text-[var(--sage)]"
        >
          <Icon className="size-4" />
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--sage)]">
          {eyebrow}
        </p>
        <h3 className="font-[family-name:var(--font-display)] text-[length:var(--text-h3)] leading-tight text-balance">
          {title}
        </h3>
      </div>
    </header>
  );
}

/**
 * Calm info box — used for disclaimers and the "not listed" notes. It reads as
 * information, not as an error.
 */
export function NoteBox({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "rounded-[var(--radius-md)] border border-border bg-muted/60 px-3 py-2.5 text-[length:var(--text-small)] leading-relaxed text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Bulleted list. Used for shipped work and for goals. */
export function BulletList({
  items,
  className,
  tone = "default",
}: {
  items: string[];
  className?: string;
  tone?: "default" | "goal";
}) {
  return (
    <ul
      className={cn(
        "space-y-1.5 text-[length:var(--text-small)] leading-relaxed",
        tone === "goal" ? "text-muted-foreground" : "text-foreground/90",
        className,
      )}
    >
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span
            aria-hidden
            className={cn(
              "mt-[0.45em] size-1.5 shrink-0 rounded-full",
              tone === "goal" ? "bg-[var(--coral)]" : "bg-[var(--sage)]",
            )}
          />
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Disclosure section. Keyboard accessible via the native button semantics that
 * CollapsibleTrigger provides, with a visible focus ring inherited from the
 * global `:focus-visible` rule.
 */
export function Disclosure({
  label,
  children,
  badge,
  defaultOpen = false,
}: {
  label: string;
  children: ReactNode;
  /** Optional element rendered next to the label, e.g. the goal pill. */
  badge?: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] py-1.5 text-left text-[length:var(--text-small)] font-medium transition-colors hover:text-[var(--sage)]">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate">{label}</span>
          {badge}
        </span>
        {/* Base UI puts data-open on the trigger itself, so the group
            variant resolves against it. */}
        <ChevronDown
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-open:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}

/** Maps the profile `Status` to a Pill tone. Goals are visually distinct. */
export function statusTone(
  status: string | undefined,
): "neutral" | "sage" | "coral" | "outline" | "goal" {
  switch (status) {
    case "completed":
      return "sage";
    case "goal":
      return "goal";
    case "learning":
      return "outline";
    default:
      return "neutral";
  }
}

export function statusLabel(status: string | undefined): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "goal":
      return "Goal";
    case "learning":
      return "Learning";
    default:
      return "In progress";
  }
}

export { Pill };
