"use client";

import { useChat } from "@ai-sdk/react";
import { APICallError, DefaultChatTransport } from "ai";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { CircleAlert, Info, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/primitives";
import { profile } from "@/data/profile";
import { Composer } from "./Composer";
import { MessageList } from "./MessageList";
import { TOPICS, TopicBar } from "./TopicBar";
import { cn } from "@/lib/utils";

/**
 * The whole chat surface and its two-state page machine.
 *
 *   landing (no messages)  ->  chat (>= 1 message)
 *
 * The hero and the slim header share a `layoutId`, so framer-motion morphs one
 * into the other instead of cutting. The wrapper is a `layout` element so the
 * height change is animated too — no jump.
 *
 * AI SDK v7 wiring (verified against the installed `ai@7` / `@ai-sdk/react@4`
 * types — see the report):
 *   - hook:      useChat({ transport: new DefaultChatTransport({ api }) })
 *   - status:    "submitted" | "streaming" | "ready" | "error"
 *   - send:      sendMessage({ text })
 *   - stop:      stop()
 *   - retry:     regenerate()
 *   - clear:     setMessages([]) + clearError()
 *   - messages:  message.parts[] (text / reasoning / tool-* / dynamic-tool)
 *
 * The endpoint is a prop so integration is a one-liner if the route ever moves.
 * No stub route is created here — that is the backend owner's file.
 */
export function ChatShell({
  endpoint = "/api/chat",
  className,
}: {
  endpoint?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: endpoint }),
    [endpoint],
  );

  const { messages, sendMessage, status, error, stop, regenerate, setMessages, clearError } =
    useChat({
      transport,
      // Re-rendering markdown on every token is the classic jank trap. 50ms is
      // still imperceptible while cutting React work by ~3x.
      throttle: 50,
    });

  const view: "landing" | "chat" = messages.length > 0 ? "chat" : "landing";
  const rateLimited = isRateLimited(error);

  // One toast per error instance. Keyed on the error itself, so a retry that
  // fails again produces a second, distinct toast.
  useEffect(() => {
    if (!error) return;
    toast.error(
      rateLimited
        ? "Slow down a little — too many requests."
        : "Something went wrong. Please try again.",
    );
  }, [error, rateLimited]);

  const send = (text: string) => {
    setLastPrompt(text);
    clearError();
    void sendMessage({ text });
  };

  const clearChat = () => {
    stop();
    setMessages([]);
    clearError();
    setLastPrompt(null);
    toast.success("Chat cleared");
  };

  const retry = () => {
    clearError();
    // `regenerate` re-runs the last assistant turn. If the failure happened
    // before any assistant turn existed, resend the prompt instead.
    if (lastPrompt && messages.length <= 1) {
      void sendMessage({ text: lastPrompt });
      return;
    }
    void regenerate();
  };

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4",
        className,
      )}
    >
      <LayoutGroup id="hero">
        <motion.div layout={!reduce} className="shrink-0">
          <AnimatePresence initial={false} mode="popLayout">
            {view === "landing" ? (
              <Hero key="hero" />
            ) : (
              <SlimHeader key="hero" onClear={clearChat} />
            )}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>

      {view === "chat" && error ? (
        <ErrorBanner
          rateLimited={rateLimited}
          onRetry={retry}
          canRetry={status === "ready" || status === "error"}
        />
      ) : null}

      {view === "chat" ? (
        <MessageList
          messages={messages}
          status={status}
          className="min-h-0 flex-1"
        />
      ) : (
        <LandingBody
          disabled={status === "submitted" || status === "streaming"}
          onTopic={(topic) => send(topic.question)}
        />
      )}

      <Composer
        onSend={send}
        onStop={() => void stop()}
        status={status}
        className="shrink-0"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * States
 * ------------------------------------------------------------------ */

function Hero() {
  return (
    <motion.div layoutId="hero" className="w-full">
      <GlassPanel interactive className="p-6 sm:p-8" data-cursor="card">
        <div className="flex items-center gap-4">
          <Avatar size="lg" data-cursor="card">
            <AvatarFallback aria-hidden>
              <Sparkles className="size-4" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="font-[family-name:var(--font-display)] text-[length:var(--text-h2)] leading-tight text-balance">
              Hey, I&apos;m {profile.shortName}
            </h1>
            <p className="mt-0.5 text-[length:var(--text-small)] text-muted-foreground">
              {profile.headline} · {profile.tagline}
            </p>
          </div>
        </div>

        <p className="mt-4 max-w-prose text-[length:var(--text-small)] leading-relaxed text-foreground/85">
          This is an AI version of me. Ask a question, or pick a topic below and
          I&apos;ll answer honestly — including the parts I have not done yet.
        </p>
      </GlassPanel>
    </motion.div>
  );
}

function SlimHeader({ onClear }: { onClear: () => void }) {
  return (
    <motion.div layoutId="hero" className="w-full">
      <GlassPanel className="flex items-center gap-3 px-4 py-2.5">
        <Avatar size="sm" data-cursor="card">
          <AvatarFallback aria-hidden>
            <Sparkles className="size-3" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[length:var(--text-small)] font-medium">
            {profile.shortName}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {profile.headline}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          data-cursor="button"
          onClick={onClear}
          className="shrink-0 gap-1.5"
        >
          <RotateCcw aria-hidden className="size-3.5" />
          <span className="hidden sm:inline">Clear chat</span>
          <span className="sr-only sm:hidden">Clear chat</span>
        </Button>
      </GlassPanel>
    </motion.div>
  );
}

function LandingBody({
  onTopic,
  disabled,
}: {
  onTopic: (topic: (typeof TOPICS)[number]) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 py-4">
      <TopicBar onSelect={onTopic} disabled={disabled} />
      <p className="flex items-center gap-1.5 text-center text-xs text-muted-foreground">
        <Info aria-hidden className="size-3.5 shrink-0" />
        I&apos;m still a student — I&apos;ll tell you what I have actually done
        and what I am still working towards.
      </p>
    </div>
  );
}

function ErrorBanner({
  rateLimited,
  onRetry,
  canRetry,
}: {
  rateLimited: boolean;
  onRetry: () => void;
  canRetry: boolean;
}) {
  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex shrink-0 items-start gap-2.5 rounded-[var(--radius-md)] border border-destructive/30 bg-destructive/10 px-3.5 py-3"
    >
      <CircleAlert
        aria-hidden
        className="mt-0.5 size-4 shrink-0 text-destructive"
      />
      <div className="min-w-0 flex-1">
        <p className="text-[length:var(--text-small)] font-medium">
          {rateLimited
            ? "You're asking very quickly — please wait a minute and try again."
            : "Something went wrong getting a reply."}
        </p>
        {canRetry ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-cursor="button"
            onClick={onRetry}
            className="mt-2 gap-1.5"
          >
            <RotateCcw aria-hidden className="size-3.5" />
            Retry
          </Button>
        ) : null}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

/**
 * Distinguishes a rate-limit response from any other failure.
 *
 * `APICallError.statusCode` is the documented path. The structural fallback
 * exists so the message still reads correctly if the route surfaces the 429
 * through a wrapped or plain error object.
 */
function isRateLimited(error: Error | undefined): boolean {
  if (!error) return false;
  if (APICallError.isInstance(error) && error.statusCode === 429) return true;

  const candidate = error as { statusCode?: unknown };
  return candidate.statusCode === 429;
}
