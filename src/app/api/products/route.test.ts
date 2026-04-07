import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'
import { db } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limit'

// Mock rate limiting
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({
    success: true,
    limit: 100,
    remaining: 99,
    resetAt: new Date(Date.now() + 60000),
  }),
  createRateLimitHeaders: vi.fn().mockReturnValue(new Headers()),
}))

const mockCheckRateLimit = vi.mocked(checkRateLimit)

function createProductsRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/products')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return new NextRequest(url.toString(), { method: 'GET' })
}

function makeMockProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: 'prod-1',
    name: 'eSIM Europe 5GB',
    slug: 'esim-europe-5gb',
    provider: 'MobiMatter',
    price: 29.99,
    dataAmount: 5,
    dataUnit: 'GB',
    validityDays: 30,
    countries: '["DE","FR","IT"]',
    regions: '["Europe"]',
    providerLogo: 'https://example.com/logo.png',
    speedInfo: '4G/LTE',
    networkType: 'LTE',
    isActive: true,
    topUpAvailable: false,
    penalizedRank: 100,
    category: 'esim_realtime',
    ...overrides,
  }
}

async function parseResponse(response: Response) {
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

describe('GET /api/products', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockCheckRateLimit.mockResolvedValue({
      success: true,
      limit: 100,
      remaining: 99,
      resetAt: new Date(Date.now() + 60000),
    })
  })

  it('should return products list with pagination', async () => {
    const products = [makeMockProduct(), makeMockProduct({ id: 'prod-2', name: 'eSIM USA 10GB' })]
    vi.mocked(db.product.findMany).mockResolvedValue(products as never)
    vi.mocked(db.product.count).mockResolvedValue(2)

    const req = createProductsRequest()
    const response = await GET(req)
    const json = await parseResponse(response)

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.products).toHaveLength(2)
    expect(json.data.pagination.total).toBe(2)
    expect(json.data.pagination.limit).toBe(20)
    expect(json.data.pagination.offset).toBe(0)
  })

  it('should parse countries and regions JSON strings', async () => {
    vi.mocked(db.product.findMany).mockResolvedValue([makeMockProduct()] as never)
    vi.mocked(db.product.count).mockResolvedValue(1)

    const req = createProductsRequest()
    const response = await GET(req)
    const json = await parseResponse(response)

    expect(json.data.products[0].countries).toEqual(['DE', 'FR', 'IT'])
    expect(json.data.products[0].regions).toEqual(['Europe'])
  })

  it('should filter by country', async () => {
    vi.mocked(db.product.findMany).mockResolvedValue([] as never)
    vi.mocked(db.product.count).mockResolvedValue(0)

    const req = createProductsRequest({ country: 'US' })
    await GET(req)

    expect(db.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          countries: { array_contains: ['US'] },
        }),
      })
    )
  })

  it('should filter by region', async () => {
    vi.mocked(db.product.findMany).mockResolvedValue([] as never)
    vi.mocked(db.product.count).mockResolvedValue(0)

    const req = createProductsRequest({ region: 'Europe' })
    await GET(req)

    expect(db.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          regions: { array_contains: ['Europe'] },
        }),
      })
    )
  })

  it('should respect pagination parameters', async () => {
    vi.mocked(db.product.findMany).mockResolvedValue([] as never)
    vi.mocked(db.product.count).mockResolvedValue(50)

    const req = createProductsRequest({ limit: '10', offset: '20' })
    const response = await GET(req)
    const json = await parseResponse(response)

    expect(db.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        skip: 20,
      })
    )
    expect(json.data.pagination.limit).toBe(10)
    expect(json.data.pagination.offset).toBe(20)
    expect(json.data.pagination.hasMore).toBe(true)
  })

  it('should return 429 when rate limited', async () => {
    mockCheckRateLimit.mockResolvedValue({
      success: false,
      limit: 100,
      remaining: 0,
      resetAt: new Date(Date.now() + 60000),
      retryAfter: 60,
    })

    const req = createProductsRequest()
    const response = await GET(req)
    const json = await parseResponse(response)

    expect(response.status).toBe(429)
    expect(json.error).toContain('Too many requests')
  })
})
