import type { MetadataRoute } from "next";
import { posts, siteUrl } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteUrl}/projects`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...(posts.length > 0
      ? [
          {
            url: `${siteUrl}/writing`,
            lastModified,
            changeFrequency: "monthly" as const,
            priority: 0.6,
          },
        ]
      : []),
  ];
}
