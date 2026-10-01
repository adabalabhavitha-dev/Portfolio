/**
 * Rate limiting and a tiny answer cache. Server-only, in memory.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHY THIS IS IN MEMORY, AND WHAT THAT COSTS
 * ───────────────────────────────────────────────────────────────────────────
 * Both the limiter and the cache live in this module's heap. On a long-running
 * Node server (`pnpm start`) that is a single shared, correct store. On a
 * serverless host (Vercel functions) each instance gets its own heap, so the
 * effective limit is `20 × number of warm instances`, and a cold start resets
 * both maps. That is acceptable for a personal portfolio whose worst case is a
 * few wasted model calls, and it removes a hard dependency (and a paid one) for
 * a site that explicitly has no database.
 *
 * To move to Upstash Redis later — do NOT add it until you actually need it:
 *
 *   1. `pnpm add @upstash/ratelimit @upstash/redis`
 *   2. Replace `checkRateLimit()` with a single `Ratelimit` instance, sliding
 *      window, keyed by the same `clientKey(request)`:
 *
 *        const ratelimit = new Ratelimit({
 *          redis: Redis.fromEnv(),
 *          limiter: Ratelimit.slidingWindow(20, "10 m") + ratelimit.slidingWindow(5, "10 s"),
 *          analytics: true,
 *          prefix: "bhavitha:chat",
 *        });
 *        const { success, remaining, reset } = await ratelimit.limit(clientKey(req));
 *
 *      (Upstash cannot combine two limiters on one instance; use `multi` or two
 *      instances. `prefix` keeps the portfolio's keys separate.)
 *   3. Replace the `Map` below with `redis.set(key, value, { ex: 3600 })` and a
 *      JSON list for the LRU order, or drop the cache and rely on Gemini's
 *      implicit prompt caching.
 *   4. Keep the return shape of `checkRateLimit()` unchanged — the route and
 *      the 429 response do not need to know which store is behind it.
 */

/* ═══════════════════════════════════════════════════════════════════════════
   RATE LIMIT
   ═══════════════════════════════════════════════════════════════════════════ */

export const RATE_LIMIT = {
  /** Sustained allowance. */
  max: 20,
  windowMs: 10 * 60 * 1000,
  /** Anti-click-spam allowance on top of the sustained one. */
  burstMax: 5,
  burstWindowMs: 10 * 1000,
} as const;

export type RateLimitResult = {
  ok: boolean;
  /** The sustained allowance. */
  limit: number;
  /** Remaining sustained requests. Never negative. */
  remaining: number;
  /** Remaining burst requests. Never negative. */
  burstRemaining: number;
  /** Epoch ms at which the next sustained slot frees up. */
  resetAt: number;
  /** Seconds to put in `Retry-After`. 0 when `ok`. */
  retryAfterSeconds: number;
  /** Which limit rejected the request, for logs and tests. */
  reason: "ok" | "burst" | "sustained";
};

/** Timestamps of accepted requests, per client. */
const hits = new Map<string, number[]>();
const burstHits = new Map<string, number[]>();

/** Keys untouched for this long are dropped, so memory stays bounded. */
const IDLE_EVICT_MS = RATE_LIMIT.windowMs * 2;

/**
 * Identify the caller by the first `x-forwarded-for` hop. Proxies append to the
 * header, so the left-most value is the original client. Behind a host that
 * does not set it (plain `next dev`), everything collapses to one bucket —
 * deliberate, because an unknown IP must not be able to bypass the limit.
 */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) return first;
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function prune(list: number[], windowMs: number, now: number): number[] {
  const cutoff = now - windowMs;
  let start = 0;
  while (start < list.length && list[start] <= cutoff) start += 1;
  return start === 0 ? list : list.slice(start);
}

/** Drop buckets that no client has touched for a while. */
function evictIdle(now: number): void {
  for (const [key, list] of hits) {
    if (list.length === 0 || list[list.length - 1] < now - IDLE_EVICT_MS) {
      hits.delete(key);
      burstHits.delete(key);
    }
  }
}

/**
 * Sliding-window check for one client. A rejected request is NOT recorded, so a
 * client that keeps hammering still recovers exactly one window later.
 */
export function checkRateLimit(key: string, now = Date.now()): RateLimitResult {
  evictIdle(now);

  const windowList = prune(hits.get(key) ?? [], RATE_LIMIT.windowMs, now);
  const burstList = prune(
    burstHits.get(key) ?? [],
    RATE_LIMIT.burstWindowMs,
    now,
  );

  const remaining = Math.max(0, RATE_LIMIT.max - windowList.length);
  const burstRemaining = Math.max(0, RATE_LIMIT.burstMax - burstList.length);
  const resetAt =
    (windowList[0] ?? now) + RATE_LIMIT.windowMs;

  const burstBlocked = burstRemaining === 0;
  const windowBlocked = remaining === 0;

  if (burstBlocked || windowBlocked) {
    const retryAt = burstBlocked
      ? (burstList[0] ?? now) + RATE_LIMIT.burstWindowMs
      : resetAt;
    return {
      ok: false,
      limit: RATE_LIMIT.max,
      remaining,
      burstRemaining,
      resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((retryAt - now) / 1000)),
      reason: burstBlocked ? "burst" : "sustained",
    };
  }

  windowList.push(now);
  burstList.push(now);
  hits.set(key, windowList);
  burstHits.set(key, burstList);

  return {
    ok: true,
    limit: RATE_LIMIT.max,
    remaining: remaining - 1,
    burstRemaining: burstRemaining - 1,
    resetAt,
    retryAfterSeconds: 0,
    reason: "ok",
  };
}

/** Standard-ish rate limit headers for both the 200 and the 429 path. */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
  if (!result.ok) headers["Retry-After"] = String(result.retryAfterSeconds);
  return headers;
}

/** Test/maintenance helper: forget one client, or everyone. */
export function resetRateLimit(key?: string): void {
  if (key === undefined) {
    hits.clear();
    burstHits.clear();
    return;
  }
  hits.delete(key);
  burstHits.delete(key);
}

/* ═══════════════════════════════════════════════════════════════════════════
   ANSWER CACHE
   ═══════════════════════════════════════════════════════════════════════════ */

export const CACHE = {
  /** Five topic buttons plus a handful of repeats fit comfortably. */
  maxEntries: 100,
  ttlMs: 60 * 60 * 1000,
} as const;

/** `value` is the already-serialised SSE body of a completed turn. */
type CacheEntry = { value: string; expiresAt: number };

/** Insertion order doubles as the LRU order: `Map` preserves it. */
const cache = new Map<string, CacheEntry>();

/**
 * Normalise before comparing: the five topic buttons differ only by
 * surrounding whitespace and capitalisation between click paths, and an
 * exact-match cache should not care about either.
 */
export function normaliseCacheKey(text: string): string {
  return text.trim().toLowerCase();
}

export function getCachedAnswer(
  key: string,
  now = Date.now(),
): string | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= now) {
    cache.delete(key);
    return null;
  }
  // Re-insert to mark as most-recently-used.
  cache.delete(key);
  cache.set(key, entry);
  return entry.value;
}

export function setCachedAnswer(
  key: string,
  value: string,
  now = Date.now(),
): void {
  if (value.length === 0) return;

  // Drop expired entries first so eviction below does not throw out a live one.
  for (const [existing, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(existing);
  }

  cache.delete(key);
  cache.set(key, { value, expiresAt: now + CACHE.ttlMs });

  while (cache.size > CACHE.maxEntries) {
    const oldest = cache.keys().next();
    if (oldest.done) break;
    cache.delete(oldest.value);
  }
}

export function clearCache(): void {
  cache.clear();
}

export function cacheSize(): number {
  return cache.size;
}

/* ═══════════════════════════════════════════════════════════════════════════
   SSE REPLAY
   ═══════════════════════════════════════════════════════════════════════════ */

export const SSE_CONTENT_TYPE = "text/event-stream; charset=utf-8";

/**
 * Turn a cached SSE body back into a stream.
 *
 * The bytes are the exact protocol the AI SDK emitted the first time, so the
 * client parses a hit identically to a miss — text parts and tool parts
 * included. It is replayed in slices rather than all at once, because pasting a
 * finished answer in a single frame looks broken next to a live stream.
 */
export function replaySse(body: string, sliceChars = 180, sliceDelayMs = 18): ReadableStream<string> {
  const slices: string[] = [];
  for (let i = 0; i < body.length; i += sliceChars) {
    slices.push(body.slice(i, i + sliceChars));
  }
  // Guard against a pathological cache entry producing a huge slice count.
  const capped = slices.slice(0, 200);

  let index = 0;
  return new ReadableStream<string>({
    async pull(controller) {
      if (index >= capped.length) {
        controller.close();
        return;
      }
      if (index > 0 && sliceDelayMs > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, sliceDelayMs));
      }
      controller.enqueue(capped[index]);
      index += 1;
    },
  });
}

/** Read a `ReadableStream<string>` fully into one string. */
export async function collectSse(stream: ReadableStream<string>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let out = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    out += typeof value === "string" ? value : decoder.decode(value, { stream: true });
  }
  out += decoder.decode();
  return out;
}