import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * FROZEN CONTRACT — Phase 0. Do not edit without coordinating.
 * Frosted panel used by every surface in the app.
 */
export function GlassPanel({
  children,
  className,
  strong = false,
  interactive = false,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  strong?: boolean;
  /** Adds pointer-tracked gradient border + spotlight. */
  interactive?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-cursor={interactive ? "card" : undefined}
      className={cn(
        strong ? "glass-strong" : "glass",
        "relative rounded-[var(--radius)]",
        interactive && "pointer-border overflow-hidden transition-transform duration-300 hover:-translate-y-0.5",
        className,
      )}
      {...rest}
    >
      {interactive ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-100"
          style={{
            background:
              "radial-gradient(20rem circle at var(--mx,50%) var(--my,50%), color-mix(in oklab, var(--sage) 10%, transparent), transparent 65%)",
          }}
        />
      ) : null}
      <span className="relative block">{children}</span>
    </div>
  );
}

/** Rounded tag. `tone` controls the colour family. */
export function Pill({
  children,
  tone = "neutral",
  className,
  ...rest
}: {
  children: ReactNode;
  tone?: "neutral" | "sage" | "coral" | "outline" | "goal";
  className?: string;
} & React.HTMLAttributes<HTMLSpanElement>) {
  const tones = {
    neutral: "bg-muted text-muted-foreground",
    sage: "bg-[var(--sage-soft)] text-[var(--sage)]",
    coral: "bg-[var(--coral-soft)] text-[var(--coral)]",
    outline: "border border-border text-muted-foreground",
    // Deliberately distinct: goals must never be mistakable for shipped work.
    goal: "border border-dashed border-[var(--coral)] text-[var(--coral)]",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

/** Section heading with optional eyebrow. */
export function SectionTitle({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {eyebrow ? (
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--sage)]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-[family-name:var(--font-display)] text-[length:var(--text-h2)] leading-tight text-balance">
        {title}
      </h2>
      {description ? (
        <p className="max-w-prose text-[length:var(--text-small)] text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}

/** Skeleton block for tool-loading states. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-lg bg-gradient-to-r from-muted via-[var(--glass-strong)] to-muted",
        className,
      )}
    />
  );
}