"use client";

import {
  Copy,
  Download,
  ExternalLink,
  Mail,
  MoveRight,
  Terminal,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { CardHeader, CardShell, NoteBox } from "@/components/cards/card-parts";
import { profile } from "@/data/profile";
import { isSafeLink, type ContactPayload } from "@/components/chat/types";
import { cn } from "@/lib/utils";

/**
 * Contact card.
 *
 * Email and LinkedIn are the two real, large tap targets — those are the only
 * links the profile actually fills in today. Resume, GitHub and CodeChef are
 * empty strings in `profile.ts`, so `isSafeLink` filters them out and the
 * buttons never render. That is the whole point: a dead button is a lie about
 * availability.
 *
 * Every value falls back to `profile` so a thin payload still produces a correct
 * card. No personal fact is hard-coded here.
 */
export function ContactCard({
  payload,
  pending = false,
}: {
  payload: ContactPayload;
  pending?: boolean;
}) {
  const reduce = useReducedMotion();

  const email = payload.email ?? profile.email;
  const linkedin = isSafeLink(payload.linkedin ?? profile.linkedin)
    ? (payload.linkedin ?? profile.linkedin)
    : undefined;
  const resumeUrl = isSafeLink(payload.resumeUrl ?? profile.resumeUrl)
    ? (payload.resumeUrl ?? profile.resumeUrl)
    : undefined;
  const github = isSafeLink(payload.github ?? profile.github)
    ? (payload.github ?? profile.github)
    : undefined;
  const codechef = isSafeLink(payload.codechef ?? profile.codechef)
    ? (payload.codechef ?? profile.codechef)
    : undefined;

  const mailto = `mailto:${email}`;

  /** Optional link row — renders nothing at all when the URL is absent. */
  const optional: Array<{
    key: string;
    label: string;
    href: string;
    icon: typeof Terminal;
  }> = [
    ...(resumeUrl
      ? [{ key: "resume", label: "Resume", href: resumeUrl, icon: Download }]
      : []),
    ...(github
      ? [{ key: "github", label: "GitHub", href: github, icon: Terminal }]
      : []),
    ...(codechef
      ? [{ key: "codechef", label: "CodeChef", href: codechef, icon: Terminal }]
      : []),
  ];

  return (
    <CardShell label="Contact" delay={pending ? 0 : 0.04}>
      <CardHeader
        eyebrow="Get in touch"
        title="Contact"
        icon={Mail}
      />

      <div className="space-y-2.5">
        <a
          href={mailto}
          data-cursor="link"
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "h-auto w-full justify-start gap-3 rounded-[var(--radius-md)] px-4 py-3.5",
          )}
        >
          <Mail aria-hidden className="size-4" />
          <span className="min-w-0 text-left">
            <span className="block text-xs font-normal opacity-85">Email</span>
            <span className="block truncate font-medium">{email}</span>
          </span>
          <MoveRight
            aria-hidden
            className="ml-auto size-4 shrink-0 opacity-70"
          />
        </a>

        {linkedin ? (
          <a
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="link"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-auto w-full justify-start gap-3 rounded-[var(--radius-md)] px-4 py-3.5",
            )}
          >
            <ExternalLink aria-hidden className="size-4" />
            <span className="min-w-0 text-left">
              <span className="block text-xs font-normal text-muted-foreground">
                LinkedIn
              </span>
              <span className="block truncate font-medium">
                {profile.shortName} on LinkedIn
              </span>
            </span>
          </a>
        ) : null}
      </div>

      {optional.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {optional.map(({ key, label, href, icon: Icon }) => (
            <li key={key}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="link"
                className={cn(buttonVariants({ variant: "secondary" }), "gap-1.5")}
              >
                <Icon aria-hidden className="size-3.5" />
                {label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reduce
            ? { duration: 0 }
            : { duration: 0.35, delay: 0.08, ease: [0.22, 1, 0.36, 1] }
        }
        className="mt-4 border-t border-border pt-4"
      >
        <CopyEmailButton email={email} />
        <NoteBox className="mt-3">
          I am open to entry-level IT opportunities and to hearing about
          internships, so please do get in touch.
        </NoteBox>
      </motion.div>
    </CardShell>
  );
}

function CopyEmailButton({ email }: { email: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      data-cursor="button"
      className="w-full justify-center gap-2 rounded-[var(--radius-md)] border border-dashed border-border"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(email);
          toast.success("Email address copied");
        } catch {
          // Clipboard is unavailable (insecure context, or permission denied).
          // Say so rather than silently doing nothing.
          toast.error("Could not copy — please select the address manually.");
        }
      }}
    >
      <Copy aria-hidden className="size-3.5" />
      Copy email
    </Button>
  );
}
