import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// We test the validation logic by importing the schemas directly
// Since validateEnv reads process.env, we need to manage env carefully
describe("getRequiredEnv", () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it("returns value when env var exists", async () => {
    process.env.TEST_VAR = "test-value"
    const { getRequiredEnv } = await import("./env")
    expect(getRequiredEnv("TEST_VAR")).toBe("test-value")
  })

  it("throws when env var is missing", async () => {
    delete process.env.TEST_VAR
    const { getRequiredEnv } = await import("./env")
    expect(() => getRequiredEnv("TEST_VAR")).toThrow(
      "Missing required environment variable: TEST_VAR"
    )
  })

  it("throws when env var is empty string", async () => {
    process.env.TEST_VAR = ""
    const { getRequiredEnv } = await import("./env")
    expect(() => getRequiredEnv("TEST_VAR")).toThrow(
      "Missing required environment variable: TEST_VAR"
    )
  })
})

describe("validateEnv", () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv, NODE_ENV: "development" }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it("passes with valid development env", async () => {
    process.env.DATABASE_URL = "postgresql://localhost:5432/test"
    process.env.MOBIMATTER_MERCHANT_ID = "test-merchant"
    process.env.MOBIMATTER_API_KEY = "test-key"

    const { validateEnv } = await import("./env")
    expect(() => validateEnv()).not.toThrow()
  })

  it("fails when DATABASE_URL is missing", async () => {
    delete process.env.DATABASE_URL
    process.env.MOBIMATTER_MERCHANT_ID = "test-merchant"
    process.env.MOBIMATTER_API_KEY = "test-key"

    const { validateEnv } = await import("./env")
    expect(() => validateEnv()).toThrow("Environment validation failed")
  })

  it("fails when DATABASE_URL is not postgresql", async () => {
    process.env.DATABASE_URL = "mysql://localhost:3306/test"
    process.env.MOBIMATTER_MERCHANT_ID = "test-merchant"
    process.env.MOBIMATTER_API_KEY = "test-key"

    const { validateEnv } = await import("./env")
    expect(() => validateEnv()).toThrow("PostgreSQL")
  })

  it("accepts postgres:// prefix (Supabase format)", async () => {
    process.env.DATABASE_URL = "postgres://user:pass@host:5432/db"
    process.env.MOBIMATTER_MERCHANT_ID = "test-merchant"
    process.env.MOBIMATTER_API_KEY = "test-key"

    const { validateEnv } = await import("./env")
    expect(() => validateEnv()).not.toThrow()
  })
})
