"use client";

import { motion } from "framer-motion";
import { useId, useState } from "react";
import { profile } from "@/data/profile";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/**
 * The illustrated assistant face.
 *
 * ORIGINAL ARTWORK — the face is built from plain SVG geometry authored for this
 * project. There is no Memoji, no third-party avatar pack, no character with a
 * recognisable brand. Every colour is a design token, so the same drawing works
 * in the warm light theme and the aurora dark theme with no theme branching:
 * the disc is a sage→coral tint, the face reads as `--card`, hair as `--sage`,
 * features as `--foreground`.
 *
 * States
 *   idle      — 4px float, 5s loop (matches `.animate-float` in globals.css)
 *   thinking  — slight tilt + a small "…" thought bubble
 *   speaking  — soft scale pulse (plus a mouth that opens and closes)
 *   happy     — quick bounce
 *
 * Every one of them is skipped entirely under `prefers-reduced-motion`: the
 * `animate` props become `undefined` and the static artwork is what renders.
 */

export type AvatarState = "idle" | "thinking" | "speaking" | "happy";
export type AvatarSize = "sm" | "md" | "lg";

const AVATAR_PX: Record<AvatarSize, number> = {
  sm: 44,
  md: 76,
  lg: 132,
};

export function PortfolioAvatar({
  state = "idle",
  size = "md",
  decorative = false,
  alt,
  src,
  className,
}: {
  /** Which expression to draw. Defaults to `idle`. */
  state?: AvatarState;
  /** `lg` is the hero size; `sm`/`md` are for inline and card use. */
  size?: AvatarSize;
  /** Decorative duplicates are hidden from assistive tech. */
  decorative?: boolean;
  /** Overrides the default alt text. Ignored when `decorative`. */
  alt?: string;
  /**
   * Optional raster override, e.g. "/avatar/idle.png". Rendered in the exact
   * same fixed-size box as the SVG and swapped in only once it has decoded, so
   * there is no layout shift; if it fails to load the SVG stays visible.
   * Nothing is requested unless this prop is set — see the report for why.
   */
  src?: string;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const live = !reduced;
  const px = AVATAR_PX[size];
  const label = alt ?? `Illustrated avatar of ${profile.shortName}`;

  return (
    <span
      className={cn("relative inline-block shrink-0", className)}
      style={{ width: px, height: px }}
    >
      <Portrait
        state={state}
        live={live}
        decorative={decorative}
        label={label}
      />
      {src ? <RasterSwap src={src} size={px} /> : null}
    </span>
  );
}

/* ------------------------------------------------------------------ art --- */

function Portrait({
  state,
  live,
  decorative,
  label,
}: {
  state: AvatarState;
  live: boolean;
  decorative: boolean;
  label: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const disc = `avatar-disc-${uid}`;

  return (
    <motion.svg
      viewBox="0 0 120 120"
      fill="none"
      width="100%"
      height="100%"
      aria-hidden={decorative ? true : undefined}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      focusable="false"
      className="absolute inset-0 block"
      animate={containerMotion[live ? state : "static"]}
      transition={
        live ? CONTAINER_TRANSITION[state] : undefined
      }
    >
      <defs>
        <linearGradient
          id={disc}
          x1="6"
          y1="6"
          x2="114"
          y2="114"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" style={{ stopColor: "var(--sage-soft)" }} />
          <stop offset="1" style={{ stopColor: "var(--coral-soft)" }} />
        </linearGradient>
      </defs>

      {/* Disc */}
      <circle cx="60" cy="60" r="58" style={{ fill: `url(#${disc})` }} />
      <circle
        cx="60"
        cy="60"
        r="57.5"
        style={{ stroke: "var(--hairline)" }}
        strokeWidth="1"
      />

      {/* Hair: bob cap with two side locks, drawn behind the face. */}
      <path
        d="M60 26 C82 26 95 40 95 60 C95 76 93 86 91 92 L82 92 C85 82 86 72 85 62 C80 55 72 51 60 51 C48 51 40 55 35 62 C34 72 35 82 38 92 L29 92 C27 86 25 76 25 60 C25 40 38 26 60 26 Z"
        style={{ fill: "var(--sage)" }}
      />

      {/* Face */}
      <circle cx="60" cy="63" r="33" style={{ fill: "var(--card)" }} />

      {/* Blush */}
      <ellipse
        cx="44"
        cy="70"
        rx="6.5"
        ry="4"
        style={{ fill: "var(--coral)" }}
        opacity="0.3"
      />
      <ellipse
        cx="76"
        cy="70"
        rx="6.5"
        ry="4"
        style={{ fill: "var(--coral)" }}
        opacity="0.3"
      />

      <Eyes state={state} />
      <Mouth state={state} live={live} />

      {state === "thinking" ? (
        <motion.g
          style={{ transformBox: "view-box", transformOrigin: "90px 23px" }}
          animate={live ? { opacity: [0.3, 1, 0.3] } : undefined}
          transition={
            live
              ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
              : undefined
          }
        >
          <path
            d="M78 32 L74 40 L88 33 Z"
            style={{ fill: "var(--card)" }}
          />
          <rect
            x="74"
            y="13"
            width="32"
            height="20"
            rx="10"
            style={{ fill: "var(--card)" }}
          />
          <rect
            x="74.5"
            y="13.5"
            width="31"
            height="19"
            rx="9.5"
            style={{ stroke: "var(--hairline)" }}
            strokeWidth="1"
          />
          <circle cx="83" cy="23" r="2.1" style={{ fill: "var(--foreground)" }} />
          <circle cx="90" cy="23" r="2.1" style={{ fill: "var(--foreground)" }} />
          <circle cx="97" cy="23" r="2.1" style={{ fill: "var(--foreground)" }} />
        </motion.g>
      ) : null}
    </motion.svg>
  );
}

function Eyes({ state }: { state: AvatarState }) {
  if (state === "happy") {
    // Squint-and-smile: two upward arcs.
    return (
      <>
        <path
          d="M43 63.5 Q47 58 51 63.5"
          style={{ stroke: "var(--foreground)" }}
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M69 63.5 Q73 58 77 63.5"
          style={{ stroke: "var(--foreground)" }}
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </>
    );
  }

  // `thinking` looks slightly up and away rather than straight at you.
  const dx = state === "thinking" ? 2 : 0;
  const dy = state === "thinking" ? -2 : 0;
  const r = state === "thinking" ? 3 : 3.4;

  return (
    <>
      <circle cx={50 + dx} cy={63 + dy} r={r} style={{ fill: "var(--foreground)" }} />
      <circle cx={70 + dx} cy={63 + dy} r={r} style={{ fill: "var(--foreground)" }} />
    </>
  );
}

function Mouth({ state, live }: { state: AvatarState; live: boolean }) {
  const stroke = { stroke: "var(--foreground)" } as const;

  if (state === "speaking") {
    // Open mouth that opens and closes while the whole figure pulses.
    return (
      <motion.g
        style={{ transformBox: "view-box", transformOrigin: "60px 77px" }}
        animate={live ? { scaleY: [1, 0.42, 1, 0.7, 1] } : undefined}
        transition={
          live
            ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
      >
        <ellipse
          cx="60"
          cy="77"
          rx="5.4"
          ry="6.4"
          style={{ fill: "var(--foreground)" }}
        />
      </motion.g>
    );
  }

  if (state === "thinking") {
    return (
      <ellipse
        cx="60"
        cy="77"
        rx="3.6"
        ry="4.4"
        style={{ fill: "var(--foreground)" }}
      />
    );
  }

  if (state === "happy") {
    return (
      <path
        d="M48 72.5 Q60 84 72 72.5"
        {...stroke}
        strokeWidth="3"
        strokeLinecap="round"
      />
    );
  }

  return (
    <path
      d="M52 74.5 Q60 80 68 74.5"
      {...stroke}
      strokeWidth="2.6"
      strokeLinecap="round"
    />
  );
}

/* -------------------------------------------------------------- motion --- */

type Keyframes = Record<string, Record<string, number[]>>;

const containerMotion: Keyframes = {
  static: {},
  idle: { y: [0, -4, 0] },
  thinking: { rotate: [0, -3.5, 0, 3.5, 0], y: [0, -2, 0] },
  speaking: { scale: [1, 1.045, 1] },
  happy: { y: [0, -12, 0, -12, 0], scale: [1, 1.02, 1] },
};

const CONTAINER_TRANSITION: Record<AvatarState, object> = {
  idle: { duration: 5, repeat: Infinity, ease: "easeInOut" },
  thinking: { duration: 6.4, repeat: Infinity, ease: "easeInOut" },
  speaking: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
  happy: {
    duration: 1.5,
    repeat: Infinity,
    ease: [0.28, 0.9, 0.4, 1],
  },
};

/* ---------------------------------------------------------- raster swap --- */

/**
 * Shows `src` only after it has decoded. It is absolutely positioned in the
 * same box the SVG already occupies, so nothing moves when it appears. On error
 * the image is discarded and the SVG underneath stays on screen.
 *
 * A plain `<img>` rather than next/image: the source is an optional local
 * placeholder that may legitimately not exist, and only `<img>` reports the
 * error so we can keep the SVG. There is nothing for the optimizer to do.
 */
function RasterSwap({ src, size }: { src: string; size: number }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={cn(
        "absolute inset-0 block rounded-full object-cover",
        loaded ? "opacity-100" : "opacity-0",
      )}
    />
  );
}