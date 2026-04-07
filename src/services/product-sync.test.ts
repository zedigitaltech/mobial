/**
 * Product Sync Verification Test
 *
 * Compares MobiMatter's live API catalog against our database to ensure
 * we're not missing any products and data is correctly transformed.
 *
 * Run: bun test src/services/product-sync.test.ts
 */

import { describe, it, expect } from "vitest"
import { db } from "@/lib/db"
import { fetchProducts } from "@/lib/mobimatter"

describe("Product Sync Integrity", () => {
  it("should have all MobiMatter products in the database", async () => {
    const mmProducts = await fetchProducts()

    const dbProducts = await db.product.findMany({
      select: { mobimatterId: true, isActive: true },
    })
    const dbIdMap = new Map(dbProducts.map((p) => [p.mobimatterId, p]))

    const missing: string[] = []
    for (const mm of mmProducts) {
      // Skip products our sync intentionally skips
      if (mm.price <= 0 || /\btest\b/i.test(mm.name) || mm.productCategory === "esim_replacement") continue

      const dbProduct = dbIdMap.get(mm.id)
      if (!dbProduct) {
        missing.push(`${mm.id} (${mm.name})`)
      }
    }

    expect(missing).toEqual([])
  }, 30000)

  it("should have correct count of shown realtime products", async () => {
    const mmProducts = await fetchProducts()
    const mmShownRealtime = mmProducts.filter(
      (p) => p.externallyShown && p.productCategory === "esim_realtime" && p.price > 0 && !/\btest\b/i.test(p.name),
    )

    const dbShownRealtime = await db.product.count({
      where: { isActive: true, externallyShown: true, category: "esim_realtime" },
    })

    // Allow small tolerance (products can be added/removed between API call and DB count)
    expect(Math.abs(dbShownRealtime - mmShownRealtime.length)).toBeLessThanOrEqual(10)
  }, 30000)

  it("should correctly transform data amounts", async () => {
    const mmProducts = await fetchProducts()

    // Check a sample of products for correct data transformation
    const sampleIds = mmProducts
      .filter((p) => p.dataAmount !== null && p.dataAmount > 0 && !p.isUnlimited)
      .slice(0, 20)
      .map((p) => p.id)

    const dbSamples = await db.product.findMany({
      where: { mobimatterId: { in: sampleIds } },
      select: { mobimatterId: true, dataAmount: true, dataUnit: true },
    })
    const dbMap = new Map(dbSamples.map((p) => [p.mobimatterId, p]))

    for (const mm of mmProducts.filter((p) => sampleIds.includes(p.id))) {
      const dbProduct = dbMap.get(mm.id)
      if (!dbProduct) continue

      expect(dbProduct.dataAmount).toBe(mm.dataAmount)
      expect(dbProduct.dataUnit).toBe(mm.dataUnit)
    }
  }, 30000)

  it("should correctly apply 10% markup pricing", async () => {
    const mmProducts = await fetchProducts()
    const MARKUP = 0.10

    // Check a sample for correct pricing
    const sample = mmProducts
      .filter((p) => p.price > 0 && !/\btest\b/i.test(p.name))
      .slice(0, 20)

    const dbSamples = await db.product.findMany({
      where: { mobimatterId: { in: sample.map((p) => p.id) } },
      select: { mobimatterId: true, price: true, originalPrice: true },
    })
    const dbMap = new Map(dbSamples.map((p) => [p.mobimatterId, p]))

    for (const mm of sample) {
      const dbProduct = dbMap.get(mm.id)
      if (!dbProduct) continue

      const expectedPrice = Math.round(mm.price * (1 + MARKUP) * 100) / 100
      expect(dbProduct.price).toBe(expectedPrice)
      expect(dbProduct.originalPrice).toBe(mm.price)
    }
  }, 30000)

  it("should correctly parse country arrays", async () => {
    const mmProducts = await fetchProducts()

    const withCountries = mmProducts
      .filter((p) => p.countries && p.countries.length > 0)
      .slice(0, 10)

    const dbSamples = await db.product.findMany({
      where: { mobimatterId: { in: withCountries.map((p) => p.id) } },
      select: { mobimatterId: true, countries: true },
    })
    const dbMap = new Map(dbSamples.map((p) => [p.mobimatterId, p]))

    for (const mm of withCountries) {
      const dbProduct = dbMap.get(mm.id)
      if (!dbProduct || !dbProduct.countries) continue

      const dbCountries = dbProduct.countries as string[]
      expect(dbCountries).toEqual(mm.countries)
    }
  }, 30000)

  it("should correctly set boolean feature flags", async () => {
    const mmProducts = await fetchProducts()

    const sample = mmProducts
      .filter((p) => p.price > 0 && !/\btest\b/i.test(p.name))
      .slice(0, 20)

    const dbSamples = await db.product.findMany({
      where: { mobimatterId: { in: sample.map((p) => p.id) } },
      select: {
        mobimatterId: true,
        is5G: true,
        supportsCalls: true,
        supportsSms: true,
        supportsHotspot: true,
        isUnlimited: true,
        topUpAvailable: true,
      },
    })
    const dbMap = new Map(dbSamples.map((p) => [p.mobimatterId, p]))

    for (const mm of sample) {
      const dbProduct = dbMap.get(mm.id)
      if (!dbProduct) continue

      expect(dbProduct.is5G).toBe(mm.is5G)
      expect(dbProduct.supportsCalls).toBe(mm.supportsCalls)
      expect(dbProduct.supportsSms).toBe(mm.supportsSms)
      expect(dbProduct.supportsHotspot).toBe(mm.supportsHotspot)
      expect(dbProduct.isUnlimited).toBe(mm.isUnlimited)
      expect(dbProduct.topUpAvailable).toBe(mm.topUpAvailable)
    }
  }, 30000)

  it("should not have any active products that MobiMatter removed", async () => {
    const mmProducts = await fetchProducts()
    const mmIds = new Set(mmProducts.map((p) => p.id))

    const dbActive = await db.product.findMany({
      where: { isActive: true },
      select: { mobimatterId: true, name: true },
    })

    const orphaned = dbActive.filter((p) => !mmIds.has(p.mobimatterId))

    // After a sync, there should be 0 orphaned active products
    expect(orphaned.length).toBe(0)
  }, 30000)

  it("should deactivate test/junk products", async () => {
    const testProducts = await db.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: "test", mode: "insensitive" } },
          { price: { lte: 0 } },
        ],
      },
      select: { name: true, price: true },
    })

    expect(testProducts).toEqual([])
  }, 10000)
})
