"use client";

/**
 * `CursorProviderMount` — the thin client boundary that composes the ambient
 * layers with the frozen `CursorProvider` from `src/lib/cursor.tsx`.
 *
 * Why a separate mount file at all:
 *  - The ambient layers are deliberately server-safe (no "use client"), so this
 *    is the single place a client boundary is introduced for the whole stack.
 *  - It gives the integration surface one import: other areas can wrap their
 *    subtree in `ExperienceShell` and inherit the cursor + ambient visuals
 *    without importing three leaf components.
 *
 * Paint order (back to front):
 *  1. AuroraBackdrop — furthest back (z-index -2).
 *  2. DotGrid        — just in front of it (z-index -1).
 *  3. {children}     — normal flow content.
 *  4. GrainOverlay   — sits over content, under the cursor (z-index 40 in the
 *                      default flow; still below the cursor's z-9999/10000).
 *  5. Cursor layers  — rendered by CursorProvider at z-9999/10000, therefore
 *                      always on top of everything, including grain.
 *
 * Note: the cursor's two divs are siblings rendered by CursorProvider, so they
 * naturally paint above GrainOverlay because of their higher z-index regardless
 * of DOM order. We do not need to portal grain behind them.
 */

import type { ReactNode } from "react";
import { CursorProvider } from "@/lib/cursor";
import { AuroraBackdrop } from "@/components/ambient/AuroraBackdrop";
import { DotGrid } from "@/components/ambient/DotGrid";
import { GrainOverlay } from "@/components/ambient/GrainOverlay";

export function CursorProviderMount({ children }: { children: ReactNode }) {
  return (
    <>
      <AuroraBackdrop />
      <DotGrid />
      <CursorProvider>{children}</CursorProvider>
      {/* Grain sits on top of content but below the cursor's z-9999/10000,
          so it textures the whole scene without ever touching the pointer. */}
      <GrainOverlay />
    </>
  );
}

/**
 * Public alias. `ExperienceShell` is the name other areas should import — it
 * reads better at the call site and matches the visual intent (it mounts the
 * cursor plus the ambient experience, not just the cursor).
 */
export const ExperienceShell = CursorProviderMount;