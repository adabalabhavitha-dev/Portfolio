import { profile } from "@/data/profile";

/**
 * /scan — a static, no-JS-required recruiter snapshot.
 *
 * The main page is a chat shell with no long scroll, which is great for
 * engagement but weak for a recruiter who wants to skim in ten seconds and weak
 * for crawlers that do not execute much JS. This route is that safety net:
 * everything important, server-rendered, one screen(ish), honest about level.
 *
 * Deliberately plain: no cursor, no ambient layers, no motion. It must survive
 * with JavaScript disabled and load fast on a weak connection.
 */

export const metadata = {
  title: `${profile.shortName} — Quick scan`,
  description: `A one-page summary of ${profile.name}, ${profile.headline}. Education, projects, skills and contact.`,
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-0.5 py-2">
      <dt className="w-40 shrink-0 text-sm font-medium text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

export default function ScanPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <header className="space-y-2 border-b border-border pb-6">
        <h1 className="text-3xl font-semibold">{profile.name}</h1>
        <p className="text-muted-foreground">
          {profile.headline} · {profile.tagline}
        </p>
        <p className="text-sm text-muted-foreground">{profile.stage}</p>
        <p className="pt-2 text-sm">
          <a className="underline" href={`mailto:${profile.email}`}>
            {profile.email}
          </a>
          {" · "}
          <a className="underline" href={profile.linkedin} rel="noopener noreferrer">
            LinkedIn
          </a>
        </p>
      </header>

      <section className="space-y-3 py-6">
        <h2 className="text-lg font-semibold">About</h2>
        {profile.about.map((p) => (
          <p key={p.slice(0, 24)} className="text-sm leading-relaxed">
            {p}
          </p>
        ))}
        <blockquote className="border-l-2 border-[var(--sage)] pl-3 text-sm italic">
          {profile.motto}
        </blockquote>
      </section>

      <section className="space-y-3 border-t border-border py-6">
        <h2 className="text-lg font-semibold">Education</h2>
        <dl>
          {profile.education.map((e) => (
            <div key={e.level} className="border-b border-border/60 py-3 last:border-0">
              <p className="text-sm font-medium">{e.level}</p>
              <p className="text-sm text-muted-foreground">
                {e.school} · {e.years}
              </p>
              <ul className="mt-1 list-inside list-disc text-sm text-muted-foreground">
                {e.results.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-3 border-t border-border py-6">
        <h2 className="text-lg font-semibold">Projects</h2>
        {profile.projects.map((p) => (
          <div key={p.slug} className="border-b border-border/60 py-3 last:border-0">
            <p className="text-sm font-medium">{p.title}</p>
            <p className="text-xs text-muted-foreground">{p.kind}</p>
            <p className="mt-1 text-sm">{p.summary}</p>
            {p.stack.length > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {p.stack.join(" · ")}
              </p>
            ) : null}
            {"implemented" in p && p.implemented ? (
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer">What&apos;s implemented</summary>
                <ul className="mt-1 list-inside list-disc text-muted-foreground">
                  {p.implemented.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </details>
            ) : null}
            {"futureGoals" in p && p.futureGoals ? (
              <details className="mt-1 text-sm">
                <summary className="cursor-pointer">Improvement goals (not completed work)</summary>
                <ul className="mt-1 list-inside list-disc text-muted-foreground">
                  {p.futureGoals.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
              </details>
            ) : null}
            {"notProvided" in p && p.notProvided ? (
              <p className="mt-1 text-xs italic text-muted-foreground">
                {p.notProvided}
              </p>
            ) : null}
          </div>
        ))}
      </section>

      <section className="space-y-3 border-t border-border py-6">
        <h2 className="text-lg font-semibold">Skills</h2>
        <p className="text-sm italic text-muted-foreground">{profile.skillsDisclaimer}</p>
        <dl>
          {profile.skills.map((s) => (
            <Row key={s.area} label={s.area} value={s.detail} />
          ))}
        </dl>
      </section>

      <section className="space-y-3 border-t border-border py-6">
        <h2 className="text-lg font-semibold">Coding journey</h2>
        <ul className="list-inside list-disc text-sm">
          {profile.coding.map((c) => (
            <li key={c.slice(0, 20)}>{c}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 border-t border-border py-6">
        <h2 className="text-lg font-semibold">Interests</h2>
        <ul className="list-inside list-disc text-sm">
          {profile.fun.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">
          Languages: {profile.languages.join(", ")}
        </p>
      </section>

      <footer className="border-t border-border pt-6 text-sm text-muted-foreground">
        <p className="italic">{profile.motto}</p>
        <p className="mt-2">
          <a href="/" className="underline">
            Back to the interactive assistant
          </a>
        </p>
      </footer>
    </main>
  );
}