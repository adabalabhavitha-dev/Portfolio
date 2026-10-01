import { ExperienceShell } from "@/components/cursor";
import { ChatShell } from "@/components/chat";
import { TopBar } from "@/components/shell";
import { ProfileJsonLd } from "@/components/seo/profile-jsonld";

/**
 * The whole page.
 *
 * Deliberately server-rendered so the greeting and identity are in the HTML for
 * crawlers and no-JS visitors; only the chat surface inside `ExperienceShell`
 * hydrates. `/scan` is the full static snapshot for recruiter quick-scan.
 *
 * Layout is a fixed viewport-height flex column with no page scroll: the chat
 * shell owns its own scrolling region. That is the point of the "chat shell over
 * everything" structure, and it is why `ChatShell` is `flex-1` with `min-h-0`
 * rather than sized by content.
 */
export default function Home() {
  return (
    <ExperienceShell>
      <ProfileJsonLd />
      <TopBar />
      <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-4 px-4 pb-4 pt-20 sm:px-6 sm:pt-24">
        <ChatShell />
      </main>
    </ExperienceShell>
  );
}