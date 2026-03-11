import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  cached,
  invalidateCache,
  invalidateCachePrefix,
  getCacheStats,
  type CacheOptions,
} from "./cache"

const TTL: CacheOptions = { ttlMs: 60000 }
const SHORT_TTL: CacheOptions = { ttlMs: 1 }

beforeEach(() => {
  // Clear all cache between tests — empty prefix matches everything
  invalidateCachePrefix("")
})

describe("cached", () => {
  it("calls fetcher on first access", async () => {
    const fetcher = vi.fn().mockResolvedValue("result")
    const result = await cached("test:1", fetcher, TTL)

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(result).toBe("result")
  })

  it("returns cached value on second access", async () => {
    const fetcher = vi.fn().mockResolvedValue("result")

    await cached("test:2", fetcher, TTL)
    const result = await cached("test:2", fetcher, TTL)

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(result).toBe("result")
  })

  it("refetches after TTL expires", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce("old")
      .mockResolvedValueOnce("new")

    await cached("test:3", fetcher, SHORT_TTL)

    // Wait for TTL to expire
    await new Promise((r) => setTimeout(r, 10))

    const result = await cached("test:3", fetcher, SHORT_TTL)

    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(result).toBe("new")
  })

  it("caches null values", async () => {
    const fetcher = vi.fn().mockResolvedValue(null)

    const r1 = await cached("test:null", fetcher, TTL)
    const r2 = await cached("test:null", fetcher, TTL)

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(r1).toBeNull()
    expect(r2).toBeNull()
  })

  it("handles concurrent requests for the same key", async () => {
    let callCount = 0
    const fetcher = vi.fn().mockImplementation(async () => {
      callCount++
      await new Promise((r) => setTimeout(r, 50))
      return `result-${callCount}`
    })

    const [r1, r2] = await Promise.all([
      cached("test:concurrent", fetcher, TTL),
      cached("test:concurrent", fetcher, TTL),
    ])

    // Both should get the same result
    expect(r1).toBe(r2)
  })
})

describe("invalidateCache", () => {
  it("removes a specific key", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce("first")
      .mockResolvedValueOnce("second")

    await cached("test:inv1", fetcher, TTL)
    invalidateCache("test:inv1")
    const result = await cached("test:inv1", fetcher, TTL)

    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(result).toBe("second")
  })
})

describe("invalidateCachePrefix", () => {
  it("removes all keys with matching prefix", async () => {
    const f1 = vi.fn().mockResolvedValue("a")
    const f2 = vi.fn().mockResolvedValue("b")
    const f3 = vi.fn().mockResolvedValue("c")

    await cached("products:1", f1, TTL)
    await cached("products:2", f2, TTL)
    await cached("other:1", f3, TTL)

    invalidateCachePrefix("products:")

    await cached("products:1", f1, TTL)
    await cached("products:2", f2, TTL)
    await cached("other:1", f3, TTL)

    expect(f1).toHaveBeenCalledTimes(2) // invalidated
    expect(f2).toHaveBeenCalledTimes(2) // invalidated
    expect(f3).toHaveBeenCalledTimes(1) // NOT invalidated
  })
})

describe("getCacheStats", () => {
  it("returns stats about the cache", async () => {
    const fetcher = vi.fn().mockResolvedValue("val")
    await cached("stats:test", fetcher, TTL)

    const stats = getCacheStats()
    expect(stats).toHaveProperty("size")
    expect(stats.size).toBeGreaterThanOrEqual(1)
    expect(stats).toHaveProperty("maxEntries")
    expect(stats.maxEntries).toBe(500)
  })
})
