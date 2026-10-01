<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project: Bhavitha's AI Portfolio

A single-page, AI-native portfolio. No long scroll — the visitor sees a greeting, an avatar
and a chat box. They ask questions or tap topic buttons (Me, Projects, Skills, Fun,
Contact) and an AI assistant answers about the owner, Adabala Bhavitha Veni, with
streaming text and rich cards.

## Hard rules

1. **Stack:** Next.js 16 (App Router, React 19.2, TypeScript strict), Tailwind CSS v4,
   shadcn/ui + Radix, framer-motion, next-themes, react-markdown + remark-gfm, zod,
   Vercel AI SDK v7. Package manager: pnpm.
2. **Read the bundled docs before coding.** Next 16 has breaking changes and this repo
   ships version-matched docs at `node_modules/next/dist/docs/`. Never code Next.js from
   memory. Verify in the build output.
3. **Secrets** live only in `.env.local`, read only on the server. Never expose to client
   code. `.env.local` is git-ignored; `.env.example` is committed.
4. **Single source of truth:** every personal fact lives in `src/data/profile.ts`. UI and
   the AI system prompt both read from it. Never hard-code personal facts elsewhere.
5. **Honesty:** the owner is a fresher/undergraduate. Never claim advanced skill, job
   experience, awards, or outcomes not present in `profile.ts`. Goals are goals, not
   completed work. The hackathon's individual role/outcome is genuinely unknown — say so.
6. **Original design.** No copied code, text, images, or avatars from any existing
   portfolio. No third-party persona branding anywhere.
7. **Design system:** warm editorial light theme by default, dark aurora-glass theme.
   Theme comes from CSS variables that are defined identically in both themes — never
   branch on theme in a component; use the variable.
8. **Cursor:** the layered inertia cursor in `src/lib/cursor.tsx` is a frozen contract.
   It must never hide the native cursor on touch devices. Respect
   `prefers-reduced-motion` everywhere: no infinite loops, no parallax, no magnetic pull.
9. **Quality bar:** no `any`, no ESLint errors, `pnpm lint` and `pnpm build` pass,
   WCAG AA contrast in both themes, keyboard accessible with visible focus.
10. **Scope:** no database, no auth, no vector store, no RAG. The profile is small enough
    that the whole thing fits in a system prompt.
11. If a requirement is ambiguous, pick the simplest option that satisfies the spec and
    state the assumption in the summary rather than stopping.

## Commands

```bash
pnpm dev            # Turbopack dev server
pnpm build          # production build (Turbopack)
pnpm lint           # ESLint CLI (next lint was removed in 16)
pnpm exec tsc --noEmit
```

## FROZEN CONTRACTS — do not edit without coordinating

These files define the shared surface that parallel work is built against. Read them
before writing UI:

| File | Exports | Why frozen |
|---|---|---|
| `src/lib/cursor.tsx` | `CursorProvider`, `useCursor`, `CursorSpotlight`, `Magnetic` | Cursor state machine + rAF loop |
| `src/components/ui/primitives.tsx` | `GlassPanel`, `Pill`, `SectionTitle`, `Skeleton` | Shared visual language |
| `src/data/profile.ts` | `profile`, `Status`, derived types | Single source of truth |
| `src/app/globals.css` | design tokens | Both themes, one variable set |

Component authors: import these, don't reimplement them.

## File ownership (parallel work)

Each area has one owner. Do not edit files outside your area.

| Area | Path |
|---|---|
| Cursor + ambient | `src/components/cursor/**`, `src/components/ambient/**` |
| Shell + theme | `src/components/shell/**`, `src/components/theme/**` |
| Chat + cards | `src/components/chat/**`, `src/components/cards/**` |
| Backend | `src/app/api/**`, `src/lib/{prompt,model,rate-limit,profile-text,tools}.ts`, `src/data/topics.ts` |

If you need something from another area, note it in your summary rather than writing it.