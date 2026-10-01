import { cn } from "@/lib/utils";

/**
 * Film grain overlay. Uses the global `.grain` utility in `app/globals.css`,
 * which supplies the `::after` fractal-noise texture and handles the light/dark
 * opacity difference. Rendered as an empty element because the texture is
 * entirely pseudo-element driven.
 *
 * Deliberately server-safe (no "use client"): pure markup plus CSS.
 */
export function GrainOverlay({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("grain pointer-events-none fixed inset-0", className)}
    />
  );
}