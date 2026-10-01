/**
 * POST /api/chat — the only server-side AI entry point.
 *
 * AI SDK v7 shape (verified against ai-sdk.dev, see docs/qa.md):
 *
 *   streamText({ model, instructions, messages, tools, stopWhen, ... })
 *     → toUIMessageStream({ stream: result.stream })
 *     → createUIMessageStreamResponse({ stream })   // SSE, what useChat reads
 *
 * `convertToModelMessages` turns the client's `UIMessage[]` into `ModelMessage[]`.
 * There is no `toAIStream()`/`StreamingTextResponse` any more — that was v4.
 *
 * Defence in depth, in order:
 *   1. zod rejects malformed bodies outright (400).
 *   2. Control / zero-width characters are stripped from user text.
 *   3. Only text parts survive; client-supplied tool and file parts are dropped.
 *   4. Only the last 10 messages reach the model.
 *   5. User text is NEVER interpolated into the system prompt.
 *   6. Rate limit per IP before any model call.
 *   7. try/catch → generic 500; the real error goes to the server log only.
 */

import { z } from "zod";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type ModelMessage,
  type UIDataTypes,
  type UIMessage,
} from "ai";

import { getModel, describeModel } from "@/lib/model";
import { buildSystemPrompt } from "@/lib/prompt";
import {
  cacheSize,
  checkRateLimit,
  clientKey,
  collectSse,
  getCachedAnswer,
  normaliseCacheKey,
  rateLimitHeaders,
  replaySse,
  setCachedAnswer,
  SSE_CONTENT_TYPE,
} from "@/lib/rate-limit";
import { chatTools, type ChatTools } from "@/lib/tools";

/* ═══════════════════════════════════════════════════════════════════════════
   ROUTE CONFIG
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * `edge` is deprecated in Next 16 and in-memory rate limiting needs a real
 * process, so the default Node runtime is stated explicitly.
 */
export const runtime = "nodejs";

/** Modest: the prompt is small and answers are capped at 400 tokens. */
export const maxDuration = 30;

/** Re-exported so the client can type its `useChat<ChatUIMessage>()`. */
export type ChatUIMessage = UIMessage<never, UIDataTypes, ChatTools>;

/* ═══════════════════════════════════════════════════════════════════════════
   LIMITS
   ═══════════════════════════════════════════════════════════════════════════ */

const MAX_MESSAGES = 20;
const MAX_PART_CHARS = 500;
const MAX_PARTS_PER_MESSAGE = 20;
/** Only this many recent turns are ever sent to the model. */
const MODEL_HISTORY = 10;
/**
 * A card plus one sentence fits comfortably; 400 keeps a runaway generation from
 * burning the rest of the rate-limit budget on a single question.
 */
const MAX_OUTPUT_TOKENS = 400;
/** Low on purpose: this is grounded retrieval, not creative writing. */
const TEMPERATURE = 0.3;
/** Card → text, then text. Five is plenty for one button press. */
const MAX_STEPS = 5;

const GENERIC_ERROR =
  "Something went wrong generating that answer. Please try again.";

/* ═══════════════════════════════════════════════════════════════════════════
   VALIDATION
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * A part is `{ type, text? }`. Non-text parts (tool calls the client echoes
 * back, reasoning, files, data) are tolerated on the wire so that a real chat
 * session does not get rejected, but `sanitise()` throws them away.
 *
 * The 500-character cap has to apply to text parts specifically, so `text` is
 * declared on the single schema rather than in a union that a long tool part
 * could satisfy via its second branch.
 */
const MessagePartSchema = z.object({
  type: z.string().min(1).max(64),
  text: z.string().max(MAX_PART_CHARS).optional(),
});

const IncomingMessageSchema = z.object({
  id: z.string().max(64).optional(),
  /** `system` is not accepted from a client, ever. */
  role: z.enum(["user", "assistant"]),
  parts: z.array(MessagePartSchema).min(1).max(MAX_PARTS_PER_MESSAGE),
});

const ChatRequestSchema = z.object({
  messages: z.array(IncomingMessageSchema).min(1).max(MAX_MESSAGES),
});

type IncomingMessage = z.infer<typeof IncomingMessageSchema>;

/**
 * Strip characters that are used to hide instructions from a human reviewer:
 * C0/C1 controls (tab and newline survive), line/paragraph separators, bidi
 * overrides, zero-width and BOM characters. CR is normalised away first so
 * Windows-style newlines do not survive as bare carriage returns.
 */
const CONTROL_AND_INVISIBLE =
  /[\u0000-\u0008\u000B-\u001F\u007F-\u009F\u200B-\u200F\u2028\u2029\u2060-\u2064\uFEFF]/g;

export function sanitiseText(text: string): string {
  return text.replace(/\r\n?/g, "\n").replace(CONTROL_AND_INVISIBLE, "").trim();
}

type SanitisedMessage = {
  role: "user" | "assistant";
  parts: { type: "text"; text: string }[];
};

type SanitiseResult =
  | { ok: true; messages: SanitisedMessage[]; lastUserText: string }
  | { ok: false; error: string };

/**
 * Turn a validated body into plain user/assistant text turns.
 *
 * Empty turns are dropped: a message whose every part was a tool call carries
 * no conversational signal and would only waste context. The last surviving
 * user turn is returned because it is the cache key.
 */
export function sanitise(messages: IncomingMessage[]): SanitiseResult {
  const cleaned: SanitisedMessage[] = [];
  let lastUserText = "";

  for (const message of messages) {
    const parts = message.parts
      .filter((part) => part.type === "text" && typeof part.text === "string")
      .map((part) => ({ type: "text" as const, text: sanitiseText(part.text!) }))
      .filter((part) => part.text.length > 0);

    if (parts.length === 0) continue;

    const joined = parts.map((part) => part.text).join("\n");
    if (message.role === "user") lastUserText = joined;
    cleaned.push({ role: message.role, parts });
  }

  if (cleaned.length === 0) {
    return { ok: false, error: "No message text found." };
  }
  if (lastUserText.length === 0) {
    return { ok: false, error: "The last message must be from the visitor." };
  }
  if (cleaned[cleaned.length - 1].role !== "user") {
    return { ok: false, error: "The last message must be from the visitor." };
  }

  return { ok: true, messages: cleaned, lastUserText };
}

/* ═══════════════════════════════════════════════════════════════════════════
   HANDLER
   ═══════════════════════════════════════════════════════════════════════════ */

function jsonError(status: number, message: string, headers?: Record<string, string>): Response {
  return Response.json({ error: message }, { status, headers });
}

/** Server-side only. Never forwarded to the client. */
function logServerError(context: string, error: unknown): void {
  const detail =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : typeof error === "string"
        ? error
        : "non-error thrown";
  console.error(`[chat] ${context} — ${detail}`);
}

export async function POST(request: Request): Promise<Response> {
  try {
    /* ---- 1. rate limit ---------------------------------------------- */
    const key = clientKey(request);
    const limit = checkRateLimit(key);
    const limitHeaders = rateLimitHeaders(limit);

    if (!limit.ok) {
      return jsonError(
        429,
        "Too many messages. Please wait a moment before asking another question.",
        { ...limitHeaders, "Retry-After": String(limit.retryAfterSeconds) },
      );
    }

    /* ---- 2. parse + validate ---------------------------------------- */
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return jsonError(400, "Invalid request body.", limitHeaders);
    }

    const parsed = ChatRequestSchema.safeParse(raw);
    if (!parsed.success) {
      // Deliberately terse: the validation detail would describe our schema.
      return jsonError(400, "Invalid chat request.", limitHeaders);
    }

    const result = sanitise(parsed.data.messages);
    if (!result.ok) {
      return jsonError(400, result.error, limitHeaders);
    }

    /* ---- 3. answer cache (single-turn repeats only) ------------------ *
     * Only an exact repeat of the most recent question is cached. Multi-turn
     * history is not: the answer depends on the context, and a stale-context
     * replay would be wrong as well as wasteful.                      */
    const isSingleTurn = result.messages.length === 1;
    const cacheKey = isSingleTurn ? normaliseCacheKey(result.lastUserText) : null;

    if (cacheKey !== null) {
      const cached = getCachedAnswer(cacheKey);
      if (cached !== null) {
        return new Response(replaySse(cached), {
          status: 200,
          headers: {
            ...limitHeaders,
            "Content-Type": SSE_CONTENT_TYPE,
            "Cache-Control": "no-store",
            "X-Chat-Cache": "hit",
          },
        });
      }
    }

    /* ---- 4. model ---------------------------------------------------- */
    const resolved = getModel();

    // Only the tail of the conversation is sent. `convertToModelMessages` is
    // async in v7 even though this input needs no I/O.
    const modelMessages: ModelMessage[] = await convertToModelMessages(
      result.messages.slice(-MODEL_HISTORY) as UIMessage[],
    );

    const generation = streamText({
      model: resolved.model,
      providerOptions: resolved.providerOptions,
      // Rules + FACTS. Built from profile.ts only — see prompt.ts.
      instructions: buildSystemPrompt(),
      messages: modelMessages,
      tools: chatTools,
      // Server-side tools all have `execute`, so the loop can run to text.
      stopWhen: isStepCount(MAX_STEPS),
      temperature: TEMPERATURE,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      // Client navigated away or pressed Stop → cancel the provider call.
      abortSignal: request.signal,
      onError: ({ error }) => logServerError("stream", error),
    });

    const response = createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: generation.stream,
        // Masked by default; this keeps provider details off the wire.
        onError: () => GENERIC_ERROR,
      }),
      headers: {
        ...limitHeaders,
        "Cache-Control": "no-store",
        "X-Chat-Model": resolved.provider,
        "X-Chat-Cache": "miss",
      },
      // A tee'd copy of the serialised SSE, consumed in the background. The
      // client still streams live; this only fills the cache.
      consumeSseStream:
        cacheKey === null
          ? undefined
          : ({ stream }) => {
              void collectSse(stream)
                .then((body) => {
                  if (body.length > 0) setCachedAnswer(cacheKey, body);
                })
                .catch((error: unknown) => logServerError("cache", error));
            },
    });

    logServerError(
      "ok",
      `${describeModel(resolved)} · ip=${key} · turns=${result.messages.length} · ` +
        `${cacheKey === null ? "uncached" : `cache=${cacheSize()}`}`,
    );
    return response;
  } catch (error) {
    logServerError("unhandled", error);
    return jsonError(500, GENERIC_ERROR);
  }
}