"use client";

import { isToolUIPart, type UIMessage } from "ai";
import { ArrowDown, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CardRenderer } from "@/components/cards";
import { cardFromToolPart, type ChatStatus } from "./types";
import { cn } from "@/lib/utils";

/**
 * Transcript.
 *
 * a11y: the message column is a `role="log"` live region with
 * `aria-live="polite"`, so a screen reader announces new turns without
 * interrupting whatever the user is doing. `aria-relevant="additions text"`
 * keeps it from re-announcing card reflow.
 *
 * Raw HTML from the model is disabled (`skipHtml`) and URLs go through
 * react-markdown's default transform, so a model response cannot inject markup
 * or a `javascript:` link. Every outbound link is `target="_blank"` with
 * `rel="noopener noreferrer"`.
 */

/** Distance from the bottom, in px, within which we consider the user "at" the end. */
const BOTTOM_THRESHOLD = 72;

const markdownComponents: Components = {
  a: ({ href, title, children }) => (
    <a
      href={href}
      title={title}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-[var(--sage)] underline underline-offset-2 decoration-[var(--sage)]/40 hover:decoration-[var(--sage)]"
    >
      {children}
    </a>
  ),
  p: ({ children }) => (
    <p className="mt-2 first:mt-0 last:mb-0 leading-relaxed">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-[var(--sage)]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-2 list-decimal space-y-1 pl-5 marker:text-[var(--sage)]">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="mt-2 border-l-2 border-[var(--sage)] pl-3 text-muted-foreground">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mt-2 overflow-x-auto rounded-[var(--radius-md)] bg-muted p-3 font-mono text-xs leading-relaxed">
      {children}
    </pre>
  ),
  h1: ({ children }) => <h3 className="mt-3 text-base font-semibold">{children}</h3>,
  h2: ({ children }) => <h3 className="mt-3 text-base font-semibold">{children}</h3>,
  h3: ({ children }) => <h4 className="mt-3 text-sm font-semibold">{children}</h4>,
  h4: ({ children }) => <h4 className="mt-3 text-sm font-semibold">{children}</h4>,
  hr: () => <hr className="my-3 border-border" />,
  table: ({ children }) => (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-border px-2 py-1 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-border px-2 py-1">{children}</td>
  ),
};

export function MessageList({
  messages,
  status,
  className,
}: {
  messages: UIMessage[];
  status: ChatStatus;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const columnRef = useRef<HTMLDivElement>(null);

  /**
   * `true` means "keep the newest message in view". Set to `false` the moment
   * the user scrolls up, so streaming never yanks them back down.
   */
  const [pinned, setPinned] = useState(true);

  /** The scroller is Base UI's viewport, not the ScrollArea root. */
  const getViewport = useCallback((): HTMLElement | null => {
    return (
      columnRef.current?.querySelector<HTMLElement>(
        '[data-slot="scroll-area-viewport"]',
      ) ?? null
    );
  }, []);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior) => {
      const viewport = getViewport();
      if (!viewport) return;
      viewport.scrollTo({ top: viewport.scrollHeight, behavior });
    },
    [getViewport],
  );

  // Track whether the user has deliberately scrolled away from the bottom.
  useEffect(() => {
    const viewport = getViewport();
    if (!viewport) return;

    const onScroll = () => {
      const distance =
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      setPinned(distance <= BOTTOM_THRESHOLD);
    };

    viewport.addEventListener("scroll", onScroll, { passive: true });
    return () => viewport.removeEventListener("scroll", onScroll);
  }, [getViewport, messages.length]);

  // A new user turn always re-pins: the user just acted, they want to see it.
  //
  // This is a render-phase adjustment (React's documented pattern for deriving
  // state from a prop change) rather than an effect, which would cause a
  // cascading render and a visible lag before the scroll catches up.
  const lastMessage = messages[messages.length - 1];
  const lastMessageId = lastMessage?.id ?? null;
  const [pinnedFor, setPinnedFor] = useState<string | null>(lastMessageId);

  if (lastMessageId !== pinnedFor) {
    if (lastMessage?.role === "user") setPinned(true);
    setPinnedFor(lastMessageId);
  }

  // Follow the stream while pinned. `messages` is a new array per chunk, so
  // this re-runs exactly as often as the content actually changes.
  useEffect(() => {
    if (!pinned) return;
    scrollToBottom(reduce ? "auto" : "smooth");
  }, [messages, status, pinned, reduce, scrollToBottom]);

  const last = messages[messages.length - 1];
  const waitingForFirstToken =
    status === "submitted" ||
    (status === "streaming" &&
      (!last || last.role !== "assistant" || !hasContent(last)));

  return (
    <div className={cn("relative min-h-0", className)}>
      <ScrollArea className="h-full w-full">
        <div
          ref={columnRef}
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
          aria-label="Conversation"
          className="flex flex-col gap-4 px-1 py-4"
        >
          {messages.map((message) => (
            <MessageRow
              key={message.id}
              message={message}
              reduce={Boolean(reduce)}
            />
          ))}

          {waitingForFirstToken ? <TypingIndicator /> : null}
        </div>
      </ScrollArea>

      {!pinned ? (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center"
        >
          <button
            type="button"
            data-cursor="button"
            onClick={() => {
              setPinned(true);
              scrollToBottom(reduce ? "auto" : "smooth");
            }}
            className={cn(
              "pointer-events-auto inline-flex items-center gap-1.5 rounded-full",
              "border border-border bg-[var(--glass-strong)] px-3 py-1.5",
              "text-xs font-medium shadow-[var(--shadow-lift)] backdrop-blur-md",
              "transition-transform hover:-translate-y-0.5",
            )}
          >
            <ArrowDown aria-hidden className="size-3.5" />
            New message
          </button>
        </motion.div>
      ) : null}
    </div>
  );
}

/** True when a message has anything worth showing. */
function hasContent(message: UIMessage): boolean {
  return message.parts.some((part) => {
    if (part.type === "text") return part.text.trim().length > 0;
    if (part.type === "reasoning") return part.text.trim().length > 0;
    return cardFromToolPart(part) !== null;
  });
}

function MessageRow({
  message,
  reduce,
}: {
  message: UIMessage;
  reduce: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduce
          ? { duration: 0 }
          : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
      }
      className={cn(
        "flex w-full gap-2.5",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser ? (
        <Avatar size="sm" className="mt-0.5">
          <AvatarFallback aria-hidden>
            <Sparkles className="size-3" />
          </AvatarFallback>
        </Avatar>
      ) : null}

      <div
        className={cn(
          "min-w-0 max-w-[min(100%,42rem)] rounded-[var(--radius)] px-4 py-2.5",
          isUser
            ? "bg-primary text-primary-foreground"
            : "glass text-foreground",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words text-[length:var(--text-small)] leading-relaxed">
            {textOf(message)}
          </p>
        ) : (
          <AssistantParts message={message} />
        )}
      </div>
    </motion.div>
  );
}

function AssistantParts({ message }: { message: UIMessage }) {
  return (
    <div className="space-y-3">
      {message.parts.map((part, index) => {
        const key = `${message.id}-${index}`;

        if (part.type === "text") {
          if (part.text.trim().length === 0) return null;
          return (
            <div
              key={key}
              className="text-[length:var(--text-small)] break-words [&>*]:first:mt-0"
            >
              <Markdown
                remarkPlugins={[remarkGfm]}
                skipHtml
                components={markdownComponents}
              >
                {part.text}
              </Markdown>
            </div>
          );
        }

        // Reasoning is internal. Show it only mid-stream, collapsed to one
        // muted line, so the transcript stays clean.
        if (part.type === "reasoning") {
          if (part.text.trim().length === 0) return null;
          return (
            <p
              key={key}
              className="flex items-center gap-1.5 text-xs italic text-muted-foreground"
            >
              <Sparkles aria-hidden className="size-3 shrink-0" />
              <span className="line-clamp-1">{part.text}</span>
            </p>
          );
        }

        // A tool that produced a card.
        const card = cardFromToolPart(part);
        if (card) {
          return <CardRenderer key={key} payload={card} />;
        }

        // A tool still running, or one whose result is not a card. Say so
        // rather than rendering an empty gap.
        if (isToolUIPart(part)) {
          return <ToolStatus key={key} state={part.state} />;
        }

        return null;
      })}
    </div>
  );
}

function ToolStatus({ state }: { state: string }) {
  const label =
    state === "input-streaming" || state === "input-available"
      ? "Loading details…"
      : state === "output-error"
        ? "Some details could not be loaded."
        : state === "output-denied" || state === "approval-responded"
          ? "Details request was declined."
          : null;

  if (!label) return null;

  return (
    <p className="text-xs text-muted-foreground">{label}</p>
  );
}

function textOf(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("\n")
    .trim();
}

/** Three-dot indicator. Stops immediately under prefers-reduced-motion. */
function TypingIndicator() {
  const reduce = useReducedMotion();

  return (
    <div
      className="flex items-center gap-2.5"
      role="status"
      aria-label="Bhavitha is typing"
    >
      <Avatar size="sm" className="mt-0.5">
        <AvatarFallback aria-hidden>
          <Sparkles className="size-3" />
        </AvatarFallback>
      </Avatar>
      <span className="glass flex items-center gap-1.5 rounded-full px-3.5 py-2.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            aria-hidden
            className="size-1.5 rounded-full bg-[var(--sage)]"
            animate={
              reduce
                ? { opacity: 0.5 }
                : { opacity: [0.3, 1, 0.3], y: [0, -3, 0] }
            }
            transition={
              reduce
                ? { duration: 0 }
                : {
                    duration: 1.1,
                    repeat: Infinity,
                    // A deliberate stagger is what makes it read as "thinking"
                    // rather than as a single blinking blob.
                    delay: i * 0.16,
                    ease: "easeInOut",
                  }
            }
          />
        ))}
      </span>
    </div>
  );
}
