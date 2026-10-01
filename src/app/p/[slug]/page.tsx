import { profile } from "@/data/profile";
import { notFound } from "next/navigation";

/**
 * Static project detail pages. These exist for deep links and SEO — a recruiter
 * who lands on one from a shared link gets the full story without the chat.
 * Goals are always labelled as goals.
 */

export function generateStaticParams() {
  return profile.projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/p/[slug]">) {
  const { slug } = await params;
  const project = profile.projects.find((p) => p.slug === slug);
  if (!project) return {};
  return {
    title: `${project.title} — ${profile.shortName}`,
    description: project.summary,
  };
}

export default async function ProjectPage({ params }: PageProps<"/p/[slug]">) {
  const { slug } = await params;
  const project = profile.projects.find((p) => p.slug === slug);
  if (!project) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <p>
        <a href="/" className="text-sm underline">
          ← Back
        </a>
      </p>
      <header className="mt-4 space-y-2 border-b border-border pb-6">
        <h1 className="text-2xl font-semibold">{project.title}</h1>
        <p className="text-sm text-muted-foreground">{project.kind}</p>
        {project.stack.length > 0 ? (
          <ul className="flex flex-wrap gap-2 pt-1">
            {project.stack.map((s) => (
              <li
                key={s}
                className="rounded-full bg-muted px-2.5 py-1 text-xs"
              >
                {s}
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      <section className="py-6">
        <p className="text-sm leading-relaxed">{project.summary}</p>
      </section>

      {"implemented" in project && project.implemented ? (
        <section className="border-t border-border py-6">
          <h2 className="text-lg font-semibold">What&apos;s implemented</h2>
          <ul className="mt-2 list-inside list-disc text-sm">
            {project.implemented.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {"perspective" in project && project.perspective ? (
        <section className="border-t border-border py-6">
          <h2 className="text-lg font-semibold">My perspective</h2>
          <p className="mt-2 text-sm leading-relaxed">{project.perspective}</p>
        </section>
      ) : null}

      {"futureGoals" in project && project.futureGoals ? (
        <section className="border-t border-border py-6">
          <h2 className="text-lg font-semibold">Improvement goals</h2>
          <p className="text-xs italic text-muted-foreground">
            Goals, not completed work.
          </p>
          <ul className="mt-2 list-inside list-disc text-sm">
            {project.futureGoals.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {"notProvided" in project && project.notProvided ? (
        <section className="border-t border-border py-6">
          <p className="text-sm italic text-muted-foreground">
            {project.notProvided}
          </p>
        </section>
      ) : null}
    </main>
  );
}