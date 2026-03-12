import { describe, it, expect, vi, beforeEach } from 'vitest'
import { db } from '@/lib/db'
import { generateSlug, syncProductsFromMobimatter, getProductById, getProducts } from './product-service'
import { fetchProducts } from '@/lib/mobimatter'
import { invalidateCachePrefix } from '@/lib/cache'

vi.mock('@/lib/mobimatter', () => ({
  fetchProducts: vi.fn(),
}))

vi.mock('@/lib/cache', () => ({
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

function makeMobimatterProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: 'mm-prod-1',
    name: 'Europe eSIM 5GB Plan',
    provider: 'TestProvider',
    providerLogo: 'https://example.com/logo.png',
    description: 'A test product',
    countries: ['US', 'GB'],
    regions: ['North America', 'Europe'],
    dataAmount: 5,
    dataUnit: 'GB',
    validityDays: 30,
    price: 10.0,
    wholesalePrice: 7.0,
    currency: 'USD',
    features: ['4G', 'Hotspot'],
    isUnlimited: false,
    supportsHotspot: true,
    supportsCalls: false,
    supportsSms: false,
    networkType: '4G',
    activationPolicy: 'auto',
    ipRouting: 'local',
    speedInfo: '100 Mbps',
    speedLong: null,
    topUpAvailable: true,
    usageTracking: 'Realtime, in-app',
    is5G: false,
    tags: [{ item: 'popular', color: 'green' }],
    externallyShown: true,
    additionalDetails: null,
    phoneNumberPrefix: null,
    rank: 10,
    penalizedRank: 8,
    productCategory: 'data',
    productFamilyId: 1,
    productFamilyName: 'TestFamily',
    networkListId: 100,
    ...overrides,
  }
}

function makeDbProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: 'db-id-1',
    mobimatterId: 'mm-prod-1',
    name: 'Europe eSIM 5GB Plan',
    description: 'A test product',
    provider: 'TestProvider',
    providerLogo: 'https://example.com/logo.png',
    category: 'data',
    countries: JSON.stringify(['US', 'GB']),
    regions: JSON.stringify(['North America', 'Europe']),
    dataAmount: 5,
    dataUnit: 'GB',
    validityDays: 30,
    price: 11.0,
    currency: 'USD',
    originalPrice: 10.0,
    wholesalePrice: 7.0,
    features: JSON.stringify(['4G', 'Hotspot']),
    isUnlimited: false,
    supportsHotspot: true,
    supportsCalls: false,
    supportsSms: false,
    isActive: true,
    isFeatured: false,
    slug: 'europe-esim-5gb-plan',
    metaTitle: null,
    metaDescription: null,
    networks: null,
    activationPolicy: 'auto',
    topUpAvailable: true,
    networkType: '4G',
    speedInfo: '100 Mbps',
    ipRouting: 'local',
    usageTracking: true,
    rank: 10,
    penalizedRank: 8,
    productFamilyId: 1,
    networkListId: 100,
    tags: JSON.stringify([{ item: 'popular', color: 'green' }]),
    externallyShown: true,
    additionalDetails: null,
    phoneNumberPrefix: null,
    is5G: false,
    speedLong: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    syncedAt: new Date('2024-01-02'),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  // Add updateMany mock since it's not in the global setup
  ;(mockDb.product as unknown as Record<string, unknown>).updateMany = vi.fn().mockResolvedValue({ count: 0 })
  // Add groupBy mock
  ;(mockDb.product as unknown as Record<string, unknown>).groupBy = vi.fn().mockResolvedValue([])
})

describe('generateSlug', () => {
  it('should lowercase and hyphenate spaces', () => {
    expect(generateSlug('Hello World')).toBe('hello-world')
  })

  it('should remove special characters', () => {
    expect(generateSlug('eSIM (Europe) 5GB!')).toBe('esim-europe-5gb')
  })

  it('should collapse multiple hyphens', () => {
    expect(generateSlug('a - - b')).toBe('a-b')
  })

  it('should trim leading/trailing hyphens', () => {
    expect(generateSlug('-hello-')).toBe('hello')
  })

  it('should handle empty string', () => {
    expect(generateSlug('')).toBe('')
  })

  it('should handle strings with only special characters', () => {
    expect(generateSlug('!@#$%')).toBe('')
  })

  it('should handle already-slug-formatted strings', () => {
    expect(generateSlug('already-a-slug')).toBe('already-a-slug')
  })
})

describe('syncProductsFromMobimatter', () => {
  it('should create new products when they do not exist', async () => {
    const rawProduct = makeMobimatterProduct()
    mockFetchProducts.mockResolvedValue([rawProduct] as never)
    vi.mocked(mockDb.product.findUnique).mockResolvedValue(null)
    vi.mocked(mockDb.product.findFirst).mockResolvedValue(null)
    vi.mocked(mockDb.product.create).mockResolvedValue({} as never)

    const result = await syncProductsFromMobimatter()

    expect(result.errors).toEqual([])
    expect(result.success).toBe(true)
    expect(result.created).toBe(1)
    expect(result.updated).toBe(0)
    expect(result.totalProcessed).toBe(1)
    expect(mockDb.product.create).toHaveBeenCalledOnce()
  })

  it('should update existing products', async () => {
    const rawProduct = makeMobimatterProduct()
    const existing = makeDbProduct()

    mockFetchProducts.mockResolvedValue([rawProduct] as never)
    vi.mocked(mockDb.product.findUnique).mockResolvedValue(existing as never)
    vi.mocked(mockDb.product.findFirst).mockResolvedValue(null) // For unique slug check
    vi.mocked(mockDb.product.update).mockResolvedValue({} as never)

    const result = await syncProductsFromMobimatter()

    expect(result.success).toBe(true)
    expect(result.updated).toBe(1)
    expect(result.created).toBe(0)
    expect(mockDb.product.update).toHaveBeenCalled()
  })

  it('should skip products with price <= 0', async () => {
    const rawProduct = makeMobimatterProduct({ price: 0 })
    mockFetchProducts.mockResolvedValue([rawProduct] as never)
    vi.mocked(mockDb.product.findUnique).mockResolvedValue(null)

    const result = await syncProductsFromMobimatter()

    expect(result.skipped).toBe(1)
    expect(result.created).toBe(0)
  })

  it('should skip test products', async () => {
    const rawProduct = makeMobimatterProduct({ name: 'Test Product ABC' })
    mockFetchProducts.mockResolvedValue([rawProduct] as never)
    vi.mocked(mockDb.product.findUnique).mockResolvedValue(null)

    const result = await syncProductsFromMobimatter()

    expect(result.skipped).toBe(1)
  })

  it('should skip esim_replacement category products', async () => {
    const rawProduct = makeMobimatterProduct({ productCategory: 'esim_replacement' })
    mockFetchProducts.mockResolvedValue([rawProduct] as never)
    vi.mocked(mockDb.product.findUnique).mockResolvedValue(null)

    const result = await syncProductsFromMobimatter()

    expect(result.skipped).toBe(1)
  })

  it('should apply 10% markup to the price', async () => {
    const rawProduct = makeMobimatterProduct({ price: 10.0 })
    mockFetchProducts.mockResolvedValue([rawProduct] as never)
    vi.mocked(mockDb.product.findUnique).mockResolvedValue(null)
    vi.mocked(mockDb.product.findFirst).mockResolvedValue(null)
    vi.mocked(mockDb.product.create).mockResolvedValue({} as never)

    await syncProductsFromMobimatter()

    const createCall = vi.mocked(mockDb.product.create).mock.calls[0][0]
    // 10.0 * 1.10 = 11.0
    expect((createCall.data as Record<string, unknown>).price).toBe(11.0)
  })

  it('should invalidate caches after sync', async () => {
    mockFetchProducts.mockResolvedValue([])

    await syncProductsFromMobimatter()

    expect(invalidateCachePrefix).toHaveBeenCalledWith('product:')
    expect(invalidateCachePrefix).toHaveBeenCalledWith('products:')
    expect(invalidateCachePrefix).toHaveBeenCalledWith('countries:')
    expect(invalidateCachePrefix).toHaveBeenCalledWith('providers:')
  })

  it('should handle fetch errors gracefully', async () => {
    mockFetchProducts.mockRejectedValue(new Error('Network error'))

    const result = await syncProductsFromMobimatter()

    expect(result.success).toBe(false)
    expect(result.errors).toContain('Sync failed: Network error')
  })

  it('should track per-product errors and continue processing', async () => {
    const rawProduct1 = makeMobimatterProduct({ id: 'prod-1' })
    const rawProduct2 = makeMobimatterProduct({ id: 'prod-2', name: 'Good Product' })

    mockFetchProducts.mockResolvedValue([rawProduct1, rawProduct2] as never)

    // First product lookup throws
    vi.mocked(mockDb.product.findUnique)
      .mockRejectedValueOnce(new Error('DB error'))
      .mockResolvedValueOnce(null)
    vi.mocked(mockDb.product.findFirst).mockResolvedValue(null)
    vi.mocked(mockDb.product.create).mockResolvedValue({} as never)

    const result = await syncProductsFromMobimatter()

    expect(result.success).toBe(true)
    expect(result.errors.length).toBe(1)
    expect(result.created).toBe(1)
    expect(result.skipped).toBe(1)
  })

  it('should deactivate existing junk products', async () => {
    const rawProduct = makeMobimatterProduct({ price: 0 })
    const existingActive = makeDbProduct({ isActive: true })

    mockFetchProducts.mockResolvedValue([rawProduct] as never)
    vi.mocked(mockDb.product.findUnique).mockResolvedValue(existingActive as never)
    vi.mocked(mockDb.product.update).mockResolvedValue({} as never)

    await syncProductsFromMobimatter()

    expect(mockDb.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isActive: false }),
      })
    )
  })
})

describe('getProductById', () => {
  it('should return parsed product when found', async () => {
    const dbProduct = makeDbProduct()
    vi.mocked(mockDb.product.findFirst).mockResolvedValue(dbProduct as never)

    const result = await getProductById('db-id-1')

    expect(result).toBeTruthy()
    expect(result!.countries).toEqual(['US', 'GB'])
    expect(result!.regions).toEqual(['North America', 'Europe'])
    expect(result!.features).toEqual(['4G', 'Hotspot'])
  })

  it('should return null when product is not found', async () => {
    vi.mocked(mockDb.product.findFirst).mockResolvedValue(null)

    const result = await getProductById('nonexistent')
    expect(result).toBeNull()
  })
})

describe('getProducts', () => {
  it('should return paginated products with defaults', async () => {
    vi.mocked(mockDb.product.count).mockResolvedValue(1)
    vi.mocked(mockDb.product.findMany).mockResolvedValue([makeDbProduct()] as never)

    const result = await getProducts()

    expect(result.products).toHaveLength(1)
    expect(result.total).toBe(1)
    expect(result.limit).toBe(20)
    expect(result.offset).toBe(0)
    expect(result.hasMore).toBe(false)
  })

  it('should set hasMore=true when more results exist', async () => {
    vi.mocked(mockDb.product.count).mockResolvedValue(25)
    vi.mocked(mockDb.product.findMany).mockResolvedValue([makeDbProduct()] as never)

    const result = await getProducts({ limit: 20, offset: 0 })

    expect(result.hasMore).toBe(true)
  })

  it('should filter by provider', async () => {
    vi.mocked(mockDb.product.count).mockResolvedValue(0)
    vi.mocked(mockDb.product.findMany).mockResolvedValue([])

    await getProducts({ provider: 'TestProvider' })

    expect(mockDb.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ provider: 'TestProvider' }),
      })
    )
  })

  it('should filter by minPrice', async () => {
    vi.mocked(mockDb.product.count).mockResolvedValue(0)
    vi.mocked(mockDb.product.findMany).mockResolvedValue([])

    await getProducts({ minPrice: 5 })

    expect(mockDb.product.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          price: { gte: 5 },
        }),
      })
    )
  })

  it('should filter by maxPrice', async () => {
    vi.mocked(mockDb.product.count).mockResolvedValue(0)
    vi.mocked(mockDb.product.findMany).mockResolvedValue([])

    await getProducts({ maxPrice: 20 })

    expect(mockDb.product.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          price: { lte: 20 },
        }),
      })
    )
  })

  it('should parse JSON fields in returned products', async () => {
    vi.mocked(mockDb.product.count).mockResolvedValue(1)
    vi.mocked(mockDb.product.findMany).mockResolvedValue([makeDbProduct()] as never)

    const result = await getProducts()

    expect(Array.isArray(result.products[0].countries)).toBe(true)
    expect(Array.isArray(result.products[0].features)).toBe(true)
  })
})
