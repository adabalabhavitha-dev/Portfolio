import { CursorProvider } from "@/lib/cursor";
import { GlassPanel } from "@/components/ui/primitives";
import { profile } from "@/data/profile";

export default function Home() {
  return (
    <CursorProvider>
      <main className="flex min-h-dvh items-center justify-center p-6">
        <GlassPanel className="p-10" interactive>
          <h1 className="font-[family-name:var(--font-display)] text-[length:var(--text-hero)]">
            Hey, I&apos;m {profile.shortName}
          </h1>
          <p className="mt-2 text-muted-foreground">{profile.headline}</p>
        </GlassPanel>
      </main>
    </CursorProvider>
  );
}