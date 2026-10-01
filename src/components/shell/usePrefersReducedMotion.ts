"use client";

import { useSyncExternalStore } from "react";

/**
 * Shared reduced-motion gate for every shell component.
 *
 * Reads the OS preference through `matchMedia` and subscribes to changes, so a
 * user flipping the setting sees the app react without a reload. The server
 * snapshot is `false`, which means the first (hydration) render always matches
 * the server output; the correction lands one render later with no hydration
 * error.
 *
 * Components use this to *skip* animation entirely rather than to slow it down —
 * see the `animate={... : undefined}` pattern in Logo/PortfolioAvatar/
 * StatusPill. globals.css already collapses CSS animations and transitions
 * under the same media query; this hook covers the framer-motion layer.
 */
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/** True when the visitor asked the OS to reduce motion. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}