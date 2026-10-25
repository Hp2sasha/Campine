import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://campine.ir").replace(/\/$/, "");

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/trips`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/leaders`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/cooperation`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  const trips = await db.trip.findMany({
    where: { status: "published", leaderBanned: false },
    select: { id: true, updatedAt: true },
  });

  const tripRoutes: MetadataRoute.Sitemap = trips.map((t) => ({
    url: `${base}/trips/${t.id}`,
    lastModified: t.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const leaders = await db.user.findMany({
    where: { role: "leader", isSuspended: false },
    select: { id: true },
  });

  const leaderRoutes: MetadataRoute.Sitemap = leaders.map((l) => ({
    url: `${base}/leaders/${l.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...tripRoutes, ...leaderRoutes];
}
