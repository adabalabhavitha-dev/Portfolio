"use client";

import Link from "next/link";
import { FileDown } from "lucide-react";
import { profile } from "@/data/profile";
import { GlassPanel } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { StatusPill } from "./StatusPill";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

/**
 * Floating glass bar: identity on the left, a minimal action cluster on the right.
 *
 * - Left: the original animated SVG mark plus the wordmark `profile.shortName`.
 * - Right: `ThemeToggle`, a LinkedIn link, and a Resume button.
 *
 * The Resume button is conditional on `profile.resumeUrl`. That field is
 * currently an empty string, so nothing is rendered for it — no placeholder,
 * no disabled button. `profile.linkedin` is non-empty, so the LinkedIn link
 * does render.
 *
 * Layout note: `GlassPanel` wraps its children in a single `relative block`
 * span, so the flex row lives *inside* that span rather than on the glass
 * surface itself.
 */
export function TopBar({ className }: { className?: string }) {
  const linkedin = profile.linkedin.trim();
  const resume = profile.resumeUrl.trim();

  return (
    <header className="pointer-events-none fixed inset-x-0 top-3 z-50 sm:top-4">
      <GlassPanel
        strong
        data-cursor="button"
        className={[
          "mx-auto w-[min(94vw,68rem)] rounded-[calc(var(--radius)*1.1)] px-2.5 py-1.5",
          "sm:px-3.5",
          className ?? "",
        ].join(" ")}
      >
        <div className="pointer-events-auto flex items-center justify-between gap-2">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-2.5 rounded-full pr-1 text-foreground transition-opacity hover:opacity-80"
            data-cursor="button"
          >
            <Logo size={30} animated />
            <span className="font-[family-name:var(--font-display)] text-[length:var(--text-h3)] leading-none tracking-tight text-balance">
              {profile.shortName}
            </span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-1.5">
            <StatusPill label="online" className="hidden md:inline-flex" />

            <ThemeToggle />

            {linkedin.length > 0 ? (
              <Button
                nativeButton={false}
                render={
                  <a
                    href={linkedin}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label="LinkedIn profile"
                  />
                }
                variant="ghost"
                size="icon-lg"
                data-cursor="button"
                className="size-9 rounded-full text-foreground hover:bg-[var(--sage-soft)] hover:text-[var(--sage)] max-sm:size-11"
              >
                <LinkedInGlyph />
              </Button>
            ) : null}

            {resume.length > 0 ? (
              <Button
                nativeButton={false}
                render={<a href={resume} target="_blank" rel="noreferrer noopener" />}
                variant="outline"
                className="h-9 gap-1.5 rounded-full border-[var(--hairline)] bg-[var(--glass)] px-3.5 text-sm font-medium hover:bg-[var(--sage-soft)] hover:text-[var(--sage)] max-sm:h-10 max-sm:px-3"
                data-cursor="button"
              >
                <FileDown aria-hidden className="size-4" />
                Resume
              </Button>
            ) : null}
          </div>
        </div>
      </GlassPanel>
    </header>
  );
}

/**
 * Original "in" monogram for the LinkedIn link.
 *
 * Hand-authored geometry (two stroked paths and a dot) rather than a brand
 * asset: lucide v1 dropped brand icons, and shipping a trademarked logo from a
 * hotlink is worse than a clean, self-drawn monogram. Decorative only — the
 * accessible name lives on the anchor.
 */
function LinkedInGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className ?? "size-5"}
    >
      <circle cx="6.5" cy="6.6" r="1.35" style={{ fill: "currentColor" }} />
      <path
        d="M6.5 10.4V17.5"
        style={{ stroke: "currentColor" }}
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <path
        d="M11.1 17.5V12.7C11.1 10.8 12.5 9.7 14.3 9.7C16.3 9.7 17.4 11 17.4 12.9V17.5"
        style={{ stroke: "currentColor" }}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}