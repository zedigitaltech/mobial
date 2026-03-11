import { describe, it, expect } from "vitest"
import {
  getCurrency,
  formatPrice,
  convertPrice,
  currencies,
  DEFAULT_CURRENCY,
} from "./currency"

describe("getCurrency", () => {
  it("returns the correct currency for a valid code", () => {
    const usd = getCurrency("USD")
    expect(usd.code).toBe("USD")
    expect(usd.symbol).toBe("$")
    expect(usd.decimals).toBe(2)
  })

  it("returns JPY with 0 decimals", () => {
    const jpy = getCurrency("JPY")
    expect(jpy.code).toBe("JPY")
    expect(jpy.decimals).toBe(0)
  })

  it("returns USD as fallback for unknown currency", () => {
    const unknown = getCurrency("XYZ")
    expect(unknown.code).toBe("USD")
  })

  it("has all expected currencies", () => {
    const codes = currencies.map((c) => c.code)
    expect(codes).toContain("USD")
    expect(codes).toContain("EUR")
    expect(codes).toContain("GBP")
    expect(codes).toContain("TRY")
    expect(codes).toContain("JPY")
  })
})

describe("convertPrice", () => {
  const rates = { USD: 1, EUR: 0.92, GBP: 0.79, JPY: 150 }

  it("returns same amount for USD (rate 1)", () => {
    expect(convertPrice(10, "USD", rates)).toBe(10)
  })

  it("converts correctly to EUR", () => {
    expect(convertPrice(10, "EUR", rates)).toBeCloseTo(9.2)
  })

  it("converts correctly to JPY", () => {
    expect(convertPrice(10, "JPY", rates)).toBe(1500)
  })

  it("returns original amount for missing rate (defaults to 1)", () => {
    expect(convertPrice(10, "XYZ", rates)).toBe(10)
  })

  it("handles zero amount", () => {
    expect(convertPrice(0, "EUR", rates)).toBe(0)
  })

  it("handles empty rates object", () => {
    expect(convertPrice(10, "EUR", {})).toBe(10)
  })
})

describe("formatPrice", () => {
  const rates = { USD: 1, EUR: 0.92, JPY: 150 }

  it("formats USD with 2 decimals and $ symbol", () => {
    const formatted = formatPrice(9.99, "USD", rates)
    expect(formatted).toContain("$")
    expect(formatted).toContain("9.99")
  })

  it("formats EUR with 2 decimals", () => {
    const formatted = formatPrice(10, "EUR", rates)
    expect(formatted).toContain("9.20")
  })

  it("formats JPY with 0 decimals", () => {
    const formatted = formatPrice(10, "JPY", rates)
    // JPY 1,500 — no decimal places
    expect(formatted).toContain("1,500")
    expect(formatted).not.toContain(".")
  })

  it("falls back to rate=1 for unknown currency", () => {
    const formatted = formatPrice(10, "USD", {})
    expect(formatted).toContain("10.00")
  })
})

describe("DEFAULT_CURRENCY", () => {
  it("is USD", () => {
    expect(DEFAULT_CURRENCY).toBe("USD")
  })
})
