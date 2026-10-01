import { profile } from "@/data/profile";

/**
 * Person schema, server-rendered so crawlers see it without executing JS.
 * Empty fields (github/codechef/resumeUrl) are omitted rather than emitted blank —
 * emitting empty values is worse than omitting them.
 */
export function ProfileJsonLd() {
  const sameAs = [profile.linkedin, profile.github, profile.codechef].filter(
    (url) => url.trim().length > 0,
  );

  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.headline,
    description: profile.about[0],
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: profile.education[0].school,
    },
    email: `mailto:${profile.email}`,
    knowsLanguage: profile.languages.map((l) => l.split(" — ")[0]),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  return (
    <script
      type="application/ld+json"
      // Content is derived from our own static data file, never user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}