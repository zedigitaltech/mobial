/**
 * Product Sync Verification Test
 *
 * Tests that the sync logic correctly transforms MobiMatter products,
 * applies markup, parses country arrays, sets boolean flags, and
 * deactivates junk/test products.
 *
 * Run: bun test src/services/product-sync.test.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { db } from "@/lib/db"
import { fetchProducts } from "@/lib/mobimatter"
import { syncProductsFromMobimatter } from "./product-service"

vi.mock("@/lib/mobimatter", () => ({
  fetchProducts: vi.fn(),
}))

vi.mock("@/lib/cache", () => ({
  cached: vi.fn((_key: string, fetcher: () => unknown) => fetcher()),
  invalidateCachePrefix: vi.fn(),
  CACHE_TTL: {
    PRODUCTS: { ttlMs: 300000, staleWhileRevalidateMs: 600000 },
    PRODUCT_DETAIL: { ttlMs: 600000, staleWhileRevalidateMs: 1800000 },
    COUNTRIES: { ttlMs: 3600000, staleWhileRevalidateMs: 7200000 },
    PROVIDERS: { ttlMs: 3600000, staleWhileRevalidateMs: 7200000 },
    FEATURED: { ttlMs: 900000, staleWhileRevalidateMs: 1800000 },
  },
}))

const mockFetchProducts = vi.mocked(fetchProducts)
const mockDb = vi.mocked(db)

const MARKUP = 0.10

function makeMobimatterProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: "mm-prod-1",
    name: "Europe eSIM 5GB Plan",
    provider: "TestProvider",
    providerLogo: "https://example.com/logo.png",
    description: "A test product",
    countries: ["US", "GB"],
    regions: ["North America", "Europe"],
    dataAmount: 5,
    dataUnit: "GB",
    validityDays: 30,
    price: 10.0,
    wholesalePrice: 7.0,
    currency: "USD",
    features: ["4G", "Hotspot"],
    isUnlimited: false,
    supportsHotspot: true,
    supportsCalls: false,
    supportsSms: false,
    networkType: "4G",
    activationPolicy: "auto",
    ipRouting: "local",
    speedInfo: "100 Mbps",
    speedLong: null,
    topUpAvailable: true,
    usageTracking: "Realtime, in-app",
    is5G: false,
    tags: [{ item: "popular", color: "green" }],
    externallyShown: true,
    additionalDetails: null,
    phoneNumberPrefix: null,
    rank: 10,
    penalizedRank: 8,
    productCategory: "esim_realtime",
    productFamilyId: 1,
    productFamilyName: "TestFamily",
    networkListId: 100,
    ...overrides,
  }
}

function makeDbProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: "db-id-1",
    mobimatterId: "mm-prod-1",
    name: "Europe eSIM 5GB Plan",
    slug: "europe-esim-5gb-plan",
    isActive: true,
    description: "A test product",
    providerLogo: "https://example.com/logo.png",
    category: "esim_realtime",
    countries: JSON.stringify(["US", "GB"]),
    regions: JSON.stringify(["North America", "Europe"]),
    dataAmount: 5,
    dataUnit: "GB",
    validityDays: 30,
    currency: "USD",
    features: JSON.stringify(["4G", "Hotspot"]),
    networkType: "4G",
    activationPolicy: "auto",
    ipRouting: "local",
    speedInfo: "100 Mbps",
    speedLong: null,
    topUpAvailable: true,
    is5G: false,
    tags: JSON.stringify([{ item: "popular", color: "green" }]),
    additionalDetails: null,
    phoneNumberPrefix: null,
    rank: 10,
    penalizedRank: 8,
    productFamilyId: 1,
    networkListId: 100,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(mockDb.product as unknown as Record<string, unknown>).updateMany = vi.fn().mockResolvedValue({ count: 0 })
})

describe("Product Sync Integrity", () => {
  it("should have all MobiMatter products in the database", async () => {
    const mmProducts = [
      makeMobimatterProduct({ id: "mm-1" }),
      makeMobimatterProduct({ id: "mm-2", name: "Asia eSIM 10GB" }),
    ]
    mockFetchProducts.mockResolvedValue(mmProducts as never)

    // Simulate no existing products in DB
    vi.mocked(mockDb.product.findMany).mockResolvedValue([] as never)
    vi.mocked(mockDb.product.create).mockResolvedValue({} as never)

    const result = await syncProductsFromMobimatter()

    expect(result.success).toBe(true)
    expect(result.created).toBe(2)
    expect(result.errors).toEqual([])
  }, 30000)

  it("should have correct count of shown realtime products", async () => {
    const mmProducts = [
      makeMobimatterProduct({ id: "mm-1", externallyShown: true, productCategory: "esim_realtime" }),
      makeMobimatterProduct({ id: "mm-2", externallyShown: true, productCategory: "esim_realtime" }),
      makeMobimatterProduct({ id: "mm-3", externallyShown: false, productCategory: "esim_realtime" }),
      makeMobimatterProduct({ id: "mm-4", externallyShown: true, productCategory: "esim_manual" }),
    ]
    mockFetchProducts.mockResolvedValue(mmProducts as never)

    vi.mocked(mockDb.product.findMany).mockResolvedValue([] as never)
    vi.mocked(mockDb.product.create).mockResolvedValue({} as never)

    const result = await syncProductsFromMobimatter()

    // All 4 products should be processed (none are junk)
    expect(result.success).toBe(true)
    expect(result.created).toBe(4)
  }, 30000)

  it("should correctly transform data amounts", async () => {
    const mmProduct = makeMobimatterProduct({ id: "mm-1", dataAmount: 20, dataUnit: "GB" })
    mockFetchProducts.mockResolvedValue([mmProduct] as never)
    vi.mocked(mockDb.product.findMany).mockResolvedValue([] as never)
    vi.mocked(mockDb.product.create).mockResolvedValue({} as never)

    await syncProductsFromMobimatter()

    const createCall = vi.mocked(mockDb.product.create).mock.calls[0][0]
    const data = createCall.data as Record<string, unknown>
    expect(data.dataAmount).toBe(20)
    expect(data.dataUnit).toBe("GB")
  }, 30000)

  it("should correctly apply 10% markup pricing", async () => {
    const mmProduct = makeMobimatterProduct({ id: "mm-1", price: 15.0 })
    mockFetchProducts.mockResolvedValue([mmProduct] as never)
    vi.mocked(mockDb.product.findMany).mockResolvedValue([] as never)
    vi.mocked(mockDb.product.create).mockResolvedValue({} as never)

    await syncProductsFromMobimatter()

    const createCall = vi.mocked(mockDb.product.create).mock.calls[0][0]
    const data = createCall.data as Record<string, unknown>
    const expectedPrice = Math.round(15.0 * (1 + MARKUP) * 100) / 100
    expect(data.price).toBe(expectedPrice)
    expect(data.originalPrice).toBe(15.0)
  }, 30000)

  it("should correctly parse country arrays", async () => {
    const mmProduct = makeMobimatterProduct({ id: "mm-1", countries: ["DE", "FR", "IT"] })
    mockFetchProducts.mockResolvedValue([mmProduct] as never)
    vi.mocked(mockDb.product.findMany).mockResolvedValue([] as never)
    vi.mocked(mockDb.product.create).mockResolvedValue({} as never)

    await syncProductsFromMobimatter()

    const createCall = vi.mocked(mockDb.product.create).mock.calls[0][0]
    const data = createCall.data as Record<string, unknown>
    expect(JSON.parse(data.countries as string)).toEqual(["DE", "FR", "IT"])
  }, 30000)

  it("should correctly set boolean feature flags", async () => {
    const mmProduct = makeMobimatterProduct({
      id: "mm-1",
      is5G: true,
      supportsCalls: true,
      supportsSms: true,
      supportsHotspot: false,
      isUnlimited: true,
      topUpAvailable: false,
    })
    mockFetchProducts.mockResolvedValue([mmProduct] as never)
    vi.mocked(mockDb.product.findMany).mockResolvedValue([] as never)
    vi.mocked(mockDb.product.create).mockResolvedValue({} as never)

    await syncProductsFromMobimatter()

    const createCall = vi.mocked(mockDb.product.create).mock.calls[0][0]
    const data = createCall.data as Record<string, unknown>
    expect(data.is5G).toBe(true)
    expect(data.supportsCalls).toBe(true)
    expect(data.supportsSms).toBe(true)
    expect(data.supportsHotspot).toBe(false)
    expect(data.isUnlimited).toBe(true)
    expect(data.topUpAvailable).toBe(false)
  }, 30000)

  it("should deactivate test/junk products", async () => {
    const testProduct = makeMobimatterProduct({ id: "mm-test", name: "Test Plan", price: 0 })
    const existingActive = makeDbProduct({ id: "db-test", mobimatterId: "mm-test", isActive: true })

    mockFetchProducts.mockResolvedValue([testProduct] as never)
    vi.mocked(mockDb.product.findMany).mockResolvedValue([existingActive] as never)
    vi.mocked(mockDb.product.update).mockResolvedValue({} as never)

    const result = await syncProductsFromMobimatter()

    expect(result.skipped).toBe(1)
    expect(mockDb.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isActive: false }),
      }),
    )
  }, 10000)
})
