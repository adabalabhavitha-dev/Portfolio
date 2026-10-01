"use client";

import { Send, Square } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ChatStatus } from "./types";

/**
 * Message composer.
 *
 * - Auto-growing textarea, capped at ~4 lines, then scrolls internally.
 * - Enter sends; Shift+Enter inserts a newline. `isComposing` is checked so an
 *   IME candidate selection never submits the message by accident.
 * - Disabled while a reply is streaming; the send button becomes a stop button.
 * - A character counter fades in near the limit rather than nagging all the time.
 */

export const MAX_CHARS = 500;
/** Counter appears at this length. */
const COUNTER_AT = MAX_CHARS - 80;
/** Roughly four lines at the current font size and line height. */
const MAX_HEIGHT_REM = 7.5;

export function Composer({
  onSend,
  onStop,
  status,
  autoFocus = false,
  className,
}: {
  onSend: (text: string) => void;
  onStop: () => void;
  status: ChatStatus;
  autoFocus?: boolean;
  className?: string;
}) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const replying = status === "submitted" || status === "streaming";
  const nearLimit = value.length >= COUNTER_AT;
  const overLimit = value.length > MAX_CHARS;
  const canSend = value.trim().length > 0 && !replying;

  // Grow with the content up to the cap, then scroll. Runs synchronously
  // before paint so the box never visibly jumps a frame behind the text.
  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_REM * 16)}px`;
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT_REM * 16 ? "auto" : "hidden";
  }, []);

  useLayoutEffect(resize, [value, resize]);

  // Re-measure on viewport changes; the cap is in absolute pixels, so a font
  // or zoom change would otherwise leave the box the wrong height.
  useEffect(() => {
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  const submit = useCallback(() => {
    const text = value.trim();
    if (!text || replying) return;
    onSend(text);
    setValue("");
  }, [onSend, replying, value]);

  return (
    <div className={className}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="glass flex items-end gap-2 rounded-[var(--radius)] p-2"
      >
        <label htmlFor="chat-composer" className="sr-only">
          Ask a question
        </label>
        <textarea
          id="chat-composer"
          ref={textareaRef}
          rows={1}
          value={value}
          // The cursor engine reads this attribute; no JS wiring needed.
          data-cursor="input"
          disabled={replying}
          maxLength={MAX_CHARS + 100}
          placeholder={
            replying ? "Bhavitha is replying…" : "Ask about projects, skills, or contact…"
          }
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.shiftKey) return;
            // Do not hijack Enter while an IME candidate window is open.
            if (event.nativeEvent.isComposing) return;
            event.preventDefault();
            submit();
          }}
          className="max-h-30 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-[length:var(--text-small)] leading-relaxed outline-none placeholder:text-muted-foreground disabled:opacity-60"
        />

        {replying ? (
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            data-cursor="button"
            onClick={onStop}
            aria-label="Stop generating"
            title="Stop generating"
          >
            <Square aria-hidden className="size-3.5 fill-current" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon-lg"
            data-cursor="button"
            disabled={!canSend}
            aria-label="Send message"
            title="Send message"
          >
            <Send aria-hidden className="size-4" />
          </Button>
        )}
      </form>

      <div className="mt-1.5 flex h-4 items-center justify-between px-1">
        <p className="text-[0.7rem] text-muted-foreground">
          <kbd className="rounded border border-border px-1 py-0.5 font-sans">
            Enter
          </kbd>{" "}
          to send ·{" "}
          <kbd className="rounded border border-border px-1 py-0.5 font-sans">
            Shift
          </kbd>
          +
          <kbd className="rounded border border-border px-1 py-0.5 font-sans">
            Enter
          </kbd>{" "}
          for a new line
        </p>
        {nearLimit ? (
          <p
            aria-live="polite"
            className={
              overLimit
                ? "text-[0.7rem] font-medium tabular-nums text-destructive"
                : "text-[0.7rem] tabular-nums text-muted-foreground"
            }
          >
            {value.length}/{MAX_CHARS}
          </p>
        ) : null}
      </div>
    </div>
  );
}
