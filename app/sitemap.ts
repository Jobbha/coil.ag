import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://coil-ag-1q5p.vercel.app";
  const now = new Date();

  const popularTokens = ["SOL", "JUP", "BONK", "RAY", "ETH", "mSOL", "JTO", "WEN", "PYTH", "RNDR"];

  return [
    // Landing
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1.0 },

    // Content pages
    { url: `${baseUrl}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/fees`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/points`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },

    // App routes
    { url: `${baseUrl}/spot`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/dca`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/yield`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/orders`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/perps`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/predict`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/profile`, lastModified: now, changeFrequency: "daily", priority: 0.5 },

    // Token pages
    ...popularTokens.map((symbol) => ({
      url: `${baseUrl}/spot/${symbol}`,
      lastModified: now,
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
  ];
}
