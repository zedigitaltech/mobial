/**
 * Canonical Product type definitions for the storefront.
 *
 * The full API-level Product lives in src/lib/mobimatter.ts.
 * These lighter interfaces cover what UI components actually consume.
 */

/** Minimal product fields shared by every listing surface. */
export interface BaseProduct {
  id: string
  name: string
  slug?: string
  provider: string
  price: number
  dataAmount: number | null
  dataUnit: string | null
  validityDays: number | null
  countries: string[]
  isUnlimited: boolean
  originalPrice: number | null
  networks?: string
}

/**
 * Extended product shape used by pages that display richer cards
 * (products listing, search results, etc.).
 */
export interface DisplayProduct extends BaseProduct {
  bestFitReason?: string
  is5G?: boolean
  tags?: Array<{ item: string; color?: string }>
  providerLogo?: string | null
  speedInfo?: string | null
  activationPolicy?: string | null
  topUpAvailable?: boolean
  supportsCalls?: boolean
  networkType?: string | null
}

/**
 * Lightweight product shape used on the home page hero section
 * where only a handful of fields are rendered.
 */
export interface HomeProduct {
  id: string
  name: string
  slug: string
  provider: string
  price: number
  dataAmount: number | null
  validityDays: number | null
  countries: string[]
  networkType: string | null
  topUpAvailable: boolean
  providerLogo: string | null
}
