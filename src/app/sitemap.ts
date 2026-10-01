import { profile } from "@/data/profile";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap() {
  const now = new Date();
  return [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "weekly" as const, priority: 1 },
    { url: `${siteUrl}/scan`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 },
    ...profile.projects.map((p) => ({
      url: `${siteUrl}/p/${p.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}