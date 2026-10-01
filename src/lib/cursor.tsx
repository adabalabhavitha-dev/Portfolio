"use client";

/**
 * Layered inertia cursor.
 *
 * FROZEN CONTRACT — Phase 0. Other modules import from here and must not
 * edit this file. Public surface:
 *   CursorProvider, useCursor, CursorLayer, CursorSpotlight, Magnetic
 *
 * Design notes:
 *  - The DOT tracks the pointer almost exactly; the RING lags behind on a
 *    spring. The gap between them is the whole effect — that lag reads as
 *    physical weight, which is what makes it feel expensive rather than cheap.
 *  - Everything writes inside ONE requestAnimationFrame loop. Cursor motion
 *    fires far more often than frames; mutating the DOM per event is the
 *    difference between 60fps and a stutter.
 *  - Writes are transform-only. Reading layout (offsetWidth, getBoundingClientRect)
 *    inside the loop would force synchronous reflow and destroy the frame budget.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

/** Interaction states the cursor can adopt. */
export type CursorVariant =
  | "default"
  | "link"
  | "button"
  | "card"
  | "input"
  | "drag"
  | "pressed";

type CursorApi = {
  /** Manually drive the variant, e.g. while a dialog is open. Pass null to release. */
  setVariant: (variant: CursorVariant | null) => void;
  variant: CursorVariant | null;
};

const CursorContext = createContext<CursorApi | null>(null);

/**
 * Reads the current variant. Safe outside a CursorProvider — returns a no-op so
 * components can render in isolation (tests, /scan, storybook).
 */
export function useCursor(): CursorApi {
  const ctx = useContext(CursorContext);
  return ctx ?? { setVariant: () => {}, variant: null };
}

type Spring = {
  /** pointer target */
  tx: number;
  ty: number;
  /** rendered position */
  x: number;
  y: number;
  /** per-frame velocity */
  vx: number;
  vy: number;
};

const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** True when the device has a precise pointer (mouse/trackpad), not touch. */
function hasFinePointer() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(FINE_POINTER_QUERY).matches;
}

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/* ---- media-query subscriptions for useSyncExternalStore ---- */

function subscribe(query: string) {
  return (onChange: () => void) => {
    const mq = window.matchMedia(query);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  };
}

const subscribeFinePointer = subscribe(FINE_POINTER_QUERY);
const getFinePointerSnapshot = hasFinePointer;

export function CursorProvider({ children }: { children: ReactNode }) {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const dot = useRef<Spring>({ tx: 0, ty: 0, x: 0, y: 0, vx: 0, vy: 0 });
  const ring = useRef<Spring>({ tx: 0, ty: 0, x: 0, y: 0, vx: 0, vy: 0 });

  // Pointer capability is an external system (a media query), so it is read via
  // useSyncExternalStore rather than an effect + setState. That avoids a
  // cascading render on mount and keeps the input effect's deps honest.
  const finePointer = useSyncExternalStore(
    subscribeFinePointer,
    getFinePointerSnapshot,
    () => false,
  );

  const [visible, setVisible] = useState(false);
  const [down, setDown] = useState(false);
  const [manualVariant, setManualVariant] = useState<CursorVariant | null>(null);

  // Mirrors `visible` for long-lived event handlers that must not close over a
  // stale value. Updated in an effect: writing a ref during render is unsafe.
  const visibleRef = useRef(false);
  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  // Hover detection is delegated via one document listener rather than per-element
  // React handlers — hundreds of onMouseEnter props would be far more expensive.
  const [hover, setHover] = useState<CursorVariant | null>(null);

  const api = useMemo<CursorApi>(
    () => ({ setVariant: setManualVariant, variant: manualVariant }),
    [manualVariant],
  );

  // The native cursor is hidden by CSS scoped to this html class, which is itself
  // gated on `(hover: hover) and (pointer: fine)` — so touch devices keep their
  // native cursor and get no custom layer at all.
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("has-custom-cursor", finePointer);
  }

  /* ------------------------------ input + rAF loop ------------------------- */
  useEffect(() => {
    if (!finePointer) return;

    const reduced = prefersReducedMotion();

    const onMove = (e: PointerEvent) => {
      dot.current.tx = e.clientX;
      dot.current.ty = e.clientY;
      if (!visibleRef.current) setVisible(true);
    };
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);
    const onDown = () => setDown(true);
    const onUp = () => setDown(false);

    const VALID = new Set<CursorVariant>([
      "link",
      "button",
      "card",
      "input",
      "drag",
    ]);

    const resolveVariant = (target: EventTarget | null): CursorVariant | null => {
      if (!(target instanceof Element)) return null;
      const el = target.closest<HTMLElement>("[data-cursor]");
      const value = el?.dataset.cursor as CursorVariant | undefined;
      return value && VALID.has(value) ? value : null;
    };

    const onOver = (e: MouseEvent) => {
      const variant = resolveVariant(e.target);
      // Only re-render on an actual change; re-entering the same variant is a no-op.
      setHover((prev) => (prev === variant ? prev : variant));
    };

    /** Write the current dot position to the ring, and publish --cx/--cy. */
    const publish = (d: Spring) => {
      document.body.style.setProperty("--cx", `${d.x}px`);
      document.body.style.setProperty("--cy", `${d.y}px`);
    };

    let raf = 0;
    let cleanupMove: (() => void) | null = null;

    if (reduced) {
      // Reduced motion: no inertia whatsoever. Position snaps exactly to the
      // pointer and no spring loop runs at all — running one would burn frames
      // to produce motion the user explicitly asked us not to produce.
      const onMoveSnap = (e: PointerEvent) => {
        dot.current.tx = e.clientX;
        dot.current.ty = e.clientY;
        dot.current.x = e.clientX;
        dot.current.y = e.clientY;
        if (dotRef.current) {
          dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
        }
        if (ringRef.current) {
          ringRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
        }
        document.body.style.setProperty("--cx", `${e.clientX}px`);
        document.body.style.setProperty("--cy", `${e.clientY}px`);
      };
      window.addEventListener("pointermove", onMoveSnap, { passive: true });
      cleanupMove = () =>
        window.removeEventListener("pointermove", onMoveSnap);
    } else {
      const tick = () => {
        const d = dot.current;
        const r = ring.current;

        // Dot: near-instant, by easing most of the way each frame. Snapping
        // fully to the target each frame makes it feel detached from the pointer.
        d.x += (d.tx - d.x) * 0.55;
        d.y += (d.ty - d.y) * 0.55;

        // Ring: a damped spring. Stiffness + damping are tuned so it overshoots
        // by a hair on direction changes — that micro-overshoot is what gives the
        // ring the sense of having mass.
        const stiffness = 0.16;
        const damping = 0.72;
        r.vx = (r.vx + (d.x - r.x) * stiffness) * damping;
        r.vy = (r.vy + (d.y - r.y) * stiffness) * damping;
        r.x += r.vx;
        r.y += r.vy;

        if (dotRef.current) {
          dotRef.current.style.transform = `translate3d(${d.x}px, ${d.y}px, 0)`;
        }
        if (ringRef.current) {
          ringRef.current.style.transform = `translate3d(${r.x}px, ${r.y}px, 0)`;
        }
        publish(d);

        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    return () => {
      cancelAnimationFrame(raf);
      cleanupMove?.();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, [finePointer]);

  const variant: CursorVariant = manualVariant
    ? manualVariant
    : down
      ? "pressed"
      : (hover ?? "default");

  // Geometry per variant, expressed once so the CSS stays declarative.
  const ringSize: Record<CursorVariant, number> = {
    default: 32,
    link: 52,
    button: 58,
    card: 86,
    input: 2,
    drag: 64,
    pressed: 22,
  };
  const dotSize: Record<CursorVariant, number> = {
    default: 6,
    link: 0,
    button: 0,
    card: 0,
    input: 0,
    drag: 0,
    pressed: 10,
  };

  const size = ringSize[variant];
  const dotPx = dotSize[variant];
  // The I-beam is tall and thin rather than square.
  const ringH = variant === "input" ? 26 : size;

  return (
    <CursorContext.Provider value={api}>
      {children}
      {finePointer ? (
        <>
          {/* Ring: the lagging layer. mix-blend-difference keeps it legible
              over both the warm light theme and the dark aurora theme. */}
          <div
            ref={ringRef}
            aria-hidden
            className="pointer-events-none fixed left-0 top-0 z-[9999] rounded-full mix-blend-difference"
            style={{
              width: size,
              height: ringH,
              marginLeft: -size / 2,
              marginTop: -ringH / 2,
              border: variant === "input" ? "1.5px solid white" : "1.5px solid white",
              borderRadius: variant === "input" ? 2 : 999,
              background:
                variant === "card" || variant === "button"
                  ? "rgba(255,255,255,0.14)"
                  : "transparent",
              opacity: visible ? 1 : 0,
              transition:
                "width .28s cubic-bezier(.22,1,.36,1), height .28s cubic-bezier(.22,1,.36,1), margin .28s cubic-bezier(.22,1,.36,1), opacity .2s ease, background .28s ease, border-radius .28s ease",
            }}
          />
          {/* Dot: the leading layer. */}
          <div
            ref={dotRef}
            aria-hidden
            className="pointer-events-none fixed left-0 top-0 z-[10000] rounded-full bg-white mix-blend-difference"
            style={{
              width: dotPx,
              height: dotPx,
              marginLeft: -dotPx / 2,
              marginTop: -dotPx / 2,
              opacity: visible && dotPx > 0 ? 1 : 0,
              transition:
                "width .2s ease, height .2s ease, margin .2s ease, opacity .18s ease",
            }}
          />
        </>
      ) : null}
    </CursorContext.Provider>
  );
}

/**
 * Reveals a radial spotlight under the cursor on hover.
 * The bounding rect is read per pointermove here (not in the rAF loop) and only
 * while hovered, which keeps it off the layout-thrash path for the cursor itself.
 */
export function CursorSpotlight({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section";
}) {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  const onMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }, []);

  return (
    <Tag
      ref={ref as never}
      onPointerMove={onMove}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
      className={`relative ${className}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
        style={{
          opacity: active ? 1 : 0,
          background:
            "radial-gradient(20rem circle at var(--mx,50%) var(--my,50%), color-mix(in oklab, var(--sage) 12%, transparent), transparent 65%)",
        }}
      />
      {children}
    </Tag>
  );
}

/**
 * Pulls its child toward the pointer when the pointer is near.
 * Entirely disabled under prefers-reduced-motion or on touch.
 */
export function Magnetic({
  children,
  strength = 0.28,
  radius = 90,
  className = "",
}: {
  children: ReactNode;
  /** 0..1 fraction of the offset the child travels. */
  strength?: number;
  /** Distance in px beyond the element's half-size at which pull reaches zero. */
  radius?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) return;
    if (!hasFinePointer()) return;

    let rect: DOMRect | null = el.getBoundingClientRect();
    let raf = 0;

    // Re-measure on resize/scroll only, never per pointermove.
    const measure = () => {
      rect = el.getBoundingClientRect();
    };

    const onMove = (e: PointerEvent) => {
      if (!rect) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const max = Math.max(rect.width, rect.height) / 2 + radius;
      if (Math.hypot(dx, dy) > max) {
        cancelAnimationFrame(raf);
        el.style.setProperty("--pull-x", "0px");
        el.style.setProperty("--pull-y", "0px");
        return;
      }
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--pull-x", `${dx * strength}px`);
        el.style.setProperty("--pull-y", `${dy * strength}px`);
      });
    };

    const onLeave = () => {
      cancelAnimationFrame(raf);
      el.style.setProperty("--pull-x", "0px");
      el.style.setProperty("--pull-y", "0px");
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", measure, { passive: true });
    window.addEventListener("scroll", measure, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
  }, [radius, strength]);

  return (
    <span
      ref={ref}
      className={`magnetic inline-block will-change-transform ${className}`}
    >
      {children}
    </span>
  );
}

/** Raw pointer position, for components that need it outside the cursor layer. */
export function usePointerPosition() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (!hasFinePointer()) return;
    const onMove = (e: PointerEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return pos;
}

/**
 * Reveal-on-cursor wrapper for a dot-grid background. Pairs with the
 * `.cursor-reveal` utility in globals.css.
 */
export function CursorReveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`cursor-reveal ${className}`}>{children}</div>;
}