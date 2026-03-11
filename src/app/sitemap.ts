import { MetadataRoute } from "next"
import { getAllCountrySlugs } from "@/lib/countries"
import { getAllRegionSlugs } from "@/lib/regions"
import { db } from "@/lib/db"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://mobialo.eu"

  // Static pages
  const staticPages = [
    "",
    "/products",
    "/esim",
    "/check-usage",
    "/topup",
    "/compatible-devices",
    "/about",
    "/contact",
    "/faq",
    "/blog",
    "/privacy",
    "/terms",
    "/refund-policy",
    "/cookies",
    "/referrals",
    "/troubleshooting",
    "/guides/installation",
  ]

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1.0 : path === "/products" ? 0.9 : 0.7,
  }))

  // Country pages
  const countrySlugs = getAllCountrySlugs()
  const countryEntries: MetadataRoute.Sitemap = countrySlugs.map((slug) => ({
    url: `${baseUrl}/esim/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  // Region pages
  const regionSlugs = getAllRegionSlugs()
  const regionEntries: MetadataRoute.Sitemap = regionSlugs.map((slug) => ({
    url: `${baseUrl}/esim/region/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  // Product pages
  let productEntries: MetadataRoute.Sitemap = []
  try {
    const products = await db.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
      take: 1000,
    })
    productEntries = products.map((p) => ({
      url: `${baseUrl}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }))
  } catch {
    // DB not available during build — skip product entries
  }

  return [...staticEntries, ...countryEntries, ...regionEntries, ...productEntries]
}
