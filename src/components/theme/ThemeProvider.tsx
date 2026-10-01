"use client";

import { useLayoutEffect } from "react";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";

/**
 * localStorage key for the chosen theme. Must match what the inline script
 * below reads, otherwise the pre-hydration paint and next-themes disagree.
 */
const STORAGE_KEY = "bhavitha-portfolio-theme";

/**
 * Runs synchronously while the browser parses the HTML, so `.dark` is already
 * on `<html>` before the first paint. Mirrors next-themes' own resolution:
 * an explicit "light"/"dark" wins, otherwise the OS preference decides.
 *
 * React 19 hoists inline `<script dangerouslySetInnerHTML>` into the document
 * head during SSR, so it runs before first paint even though this component is
 * mounted inside `<body>`. `nonce` is forwarded from `ThemeProviderProps` for
 * sites that run a strict CSP.
 */
const THEME_SCRIPT = `(function(){try{var s=localStorage.getItem(${JSON.stringify(
  STORAGE_KEY,
)});var d=window.matchMedia("(prefers-color-scheme: dark)").matches;var e=document.documentElement;if(s==="dark"||((!s||s==="system")&&d)){e.classList.add("dark")}else{e.classList.remove("dark")}}catch(_){}})();`;

function ThemeInitScript({ nonce }: { nonce?: string }) {
  return (
    <script
      // eslint-disable-next-line react/no-danger
      suppressHydrationWarning
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
    />
  );
}

/**
 * App-wide theme provider. Mount this once, directly inside `<body>`:
 *
 * ```tsx
 * <html lang="en" suppressHydrationWarning>
 *   <body>
 *     <ThemeProvider>
 *       <TopBar />
 *       …
 *     </ThemeProvider>
 *   </body>
 * </html>
 * ```
 *
 * `suppressHydrationWarning` on `<html>` is required (it is already present in
 * `layout.tsx`): the inline script mutates `<html>`'s class before React
 * hydrates, and React must accept the DOM rather than the payload.
 *
 * Spec'd defaults:
 *   - `attribute="class"` — flips `.dark` on `<html>`, matching globals.css'
 *     `@custom-variant dark (&:is(.dark *))`
 *   - `defaultTheme="system"` + `enableSystem` — the warm editorial light theme
 *     is the default *appearance*, but a visitor who has asked their OS for
 *     dark gets the aurora theme on the very first paint
 *   - `disableTransitionOnChange={false}` — theme changes animate; nothing here
 *     suppresses transitions
 *
 * Any prop passed here overrides the default (`storageKey`, `forcedTheme`, …).
 */
export function ThemeProvider({
  children,
  nonce,
  ...props
}: ThemeProviderProps) {
  // React's dev-only Strict Mode remount resets `<html>` to the attributes it
  // manages from JSX, dropping the class the inline script set. Re-applying it
  // in a layout effect restores the theme before paint in development; in
  // production this is a no-op because the class is already correct.
  useLayoutEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)")
        .matches;
      const isDark = stored === "dark" || ((!stored || stored === "system") && prefersDark);
      document.documentElement.classList.toggle("dark", isDark);
    } catch {
      // Storage can be blocked; the light default still applies.
    }
  }, []);

  return (
    <>
      <ThemeInitScript nonce={nonce} />
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange={false}
        storageKey={STORAGE_KEY}
        nonce={nonce}
        {...props}
      >
        {children}
      </NextThemesProvider>
    </>
  );
}

export { useTheme } from "next-themes";