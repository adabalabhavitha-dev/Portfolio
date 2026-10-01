"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Sun / moon toggle.
 *
 * Mount the app's `ThemeProvider` (from `@/components/theme`) above this — it is
 * a next-themes provider, and `useTheme()` outside one returns an empty theme
 * so the button would never change anything.
 *
 * Hydration: `useTheme()` is undefined on the server, so the rendered icon is
 * gated on a mounted flag. The first client render matches the server exactly
 * and the correct icon lands one tick later, which avoids a hydration
 * mismatch rather than papering over it with `suppressHydrationWarning`.
 *
 * Clicking pins the visitor to the opposite theme instead of cycling through
 * "system", which is the behaviour people expect from a two-state switch. The
 * system preference still wins on a first visit.
 */
export function ThemeToggle({
  className,
}: {
  className?: string;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useIsMounted();

  const isDark = mounted && resolvedTheme === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <TooltipProvider delay={300}>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              aria-label={label}
              // Grow the ring (58px) without shrinking the tap target below 44px.
              data-cursor="button"
              className={`rounded-full text-foreground hover:bg-[var(--sage-soft)] hover:text-[var(--sage)] max-sm:size-11 ${className ?? ""}`}
              onClick={() => setTheme(isDark ? "light" : "dark")}
            />
          }
        >
          {/* Both icons are always in the DOM and cross-fade, so there is no
              layout shift and no `hidden`/`visible` pop between themes. */}
          <Sun
            aria-hidden
            className={`absolute transition-all duration-300 ${
              isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
            }`}
          />
          <Moon
            aria-hidden
            className={`absolute transition-all duration-300 ${
              isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
            }`}
          />
        </TooltipTrigger>
        <TooltipContent side="bottom">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * False during SSR and the hydration render, true immediately after. Done with
 * `useSyncExternalStore` rather than `useEffect` + `useState` so there is no
 * extra render pass and no lint warning about a setState in an effect.
 */
function useIsMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}