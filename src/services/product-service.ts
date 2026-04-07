/**
 * Product Service
 * Handles all product-related business logic
 */

import { db } from '@/lib/db';
import { fetchProducts } from '@/lib/mobimatter';
import { Prisma } from '@prisma/client';
import { cached, invalidateCachePrefix, CACHE_TTL } from '@/lib/cache';

// Pricing
const MARKUP_PERCENTAGE = 0.10; // 10% markup on MobiMatter retail price

// Types
export interface ProductFilters {
  country?: string;
  region?: string;
  provider?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'name' | 'validity' | 'data' | 'createdAt' | 'rank';
  limit?: number;
  offset?: number;
  isActive?: boolean;
}

export interface PaginatedProducts {
  products: ProductWithDetails[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ProductWithDetails {
  id: string;
  mobimatterId: string;
  name: string;
  description: string | null;
  provider: string;
  providerLogo: string | null;
  category: string | null;
  countries: string[];
  regions: string[];
  dataAmount: number | null;
  dataUnit: string | null;
  validityDays: number | null;
  price: number;
  currency: string;
  originalPrice: number | null;
  features: string[];
  isUnlimited: boolean;
  supportsHotspot: boolean;
  supportsCalls: boolean;
  supportsSms: boolean;
  isActive: boolean;
  isFeatured: boolean;
  slug: string;
  metaTitle: string | null;
  metaDescription: string | null;
  networks: string | null;
  activationPolicy: string | null;
  topUpAvailable: boolean;
  networkType: string | null;
  speedInfo: string | null;
  ipRouting: string | null;
  usageTracking: boolean;
  rank: number | null;
  penalizedRank: number | null;
  productFamilyId: number | null;
  networkListId: number | null;
  tags: string | null;
  externallyShown: boolean;
  additionalDetails: string | null;
  phoneNumberPrefix: string | null;
  is5G: boolean;
  speedLong: string | null;
  createdAt: Date;
  updatedAt: Date;
  syncedAt: Date | null;
}

export interface SyncResult {
  success: boolean;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  totalProcessed: number;
}

export interface CountryInfo {
  code: string;
  name: string;
  productCount: number;
}

export interface ProviderInfo {
  name: string;
  productCount: number;
}

/**
 * Generate a URL-safe slug from a product name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug, appending a number if needed
 */
async function generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db.product.findFirst({
      where: {
        slug,
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: { id: true },
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/**
 * Transform MobiMatter API product to our database format
 */
function transformMobimatterProduct(raw: {
  id: string;
  name: string;
  provider: string;
  providerLogo?: string | null;
  description?: string | null;
  countries?: string[];
  regions?: string[];
  dataAmount?: number | null;
  dataUnit?: string | null;
  validityDays?: number | null;
  price: number;
  wholesalePrice: number;
  currency: string;
  features?: string[];
  isUnlimited: boolean;
  supportsHotspot: boolean;
  supportsCalls: boolean;
  supportsSms: boolean;
  networkType?: string | null;
  activationPolicy?: string | null;
  ipRouting?: string | null;
  speedInfo?: string | null;
  speedLong?: string | null;
  topUpAvailable?: boolean;
  usageTracking?: string | null;
  is5G?: boolean;
  tags?: Array<{ item: string; color?: string }>;
  externallyShown?: boolean;
  additionalDetails?: string | null;
  phoneNumberPrefix?: string | null;
  rank?: number;
  penalizedRank?: number;
  productCategory?: string;
  productFamilyId?: number;
  productFamilyName?: string;
  networkListId?: number;
}): Prisma.ProductCreateInput {
  return {
    mobimatterId: raw.id,
    name: raw.name,
    description: raw.description || null,
    provider: raw.provider,
    providerLogo: raw.providerLogo || null,
    category: raw.productCategory || null,
    countries: raw.countries ? JSON.stringify(raw.countries) : null,
    regions: raw.regions ? JSON.stringify(raw.regions) : null,
    dataAmount: raw.dataAmount || null,
    dataUnit: raw.dataUnit || null,
    validityDays: raw.validityDays || null,
    price: Math.round(raw.price * (1 + MARKUP_PERCENTAGE) * 100) / 100,
    currency: raw.currency || 'USD',
    originalPrice: raw.price,
    wholesalePrice: raw.wholesalePrice || null,
    features: raw.features ? JSON.stringify(raw.features) : null,
    isUnlimited: raw.isUnlimited,
    supportsHotspot: raw.supportsHotspot,
    supportsCalls: raw.supportsCalls,
    supportsSms: raw.supportsSms,
    networkType: raw.networkType || null,
    activationPolicy: raw.activationPolicy || null,
    ipRouting: raw.ipRouting || null,
    speedInfo: raw.speedInfo || null,
    speedLong: raw.speedLong || null,
    topUpAvailable: raw.topUpAvailable || false,
    usageTracking: raw.usageTracking === 'Realtime, in-app' || raw.usageTracking === 'Dial short code',
    is5G: raw.is5G || false,
    tags: raw.tags ? JSON.stringify(raw.tags) : null,
    externallyShown: raw.externallyShown !== false,
    additionalDetails: raw.additionalDetails || null,
    phoneNumberPrefix: raw.phoneNumberPrefix || null,
    rank: raw.rank ?? null,
    penalizedRank: raw.penalizedRank ?? null,
    productFamilyId: raw.productFamilyId ?? null,
    networkListId: raw.networkListId ?? null,
    isActive: true,
    isFeatured: false,
    slug: '',
    syncedAt: new Date(),
  };
}

/**
 * Parse JSON fields in product for API response
 */
function parseProductJsonFields(product: {
  id: string;
  mobimatterId: string;
  name: string;
  description: string | null;
  provider: string;
  providerLogo: string | null;
  category: string | null;
  countries: string | null;
  regions: string | null;
  dataAmount: number | null;
  dataUnit: string | null;
  validityDays: number | null;
  price: number;
  currency: string;
  originalPrice: number | null;
  features: string | null;
  isUnlimited: boolean;
  supportsHotspot: boolean;
  supportsCalls: boolean;
  supportsSms: boolean;
  isActive: boolean;
  isFeatured: boolean;
  slug: string;
  metaTitle: string | null;
  metaDescription: string | null;
  networks: string | null;
  activationPolicy: string | null;
  topUpAvailable: boolean;
  networkType: string | null;
  speedInfo: string | null;
  ipRouting: string | null;
  usageTracking: boolean;
  rank: number | null;
  penalizedRank: number | null;
  productFamilyId: number | null;
  networkListId: number | null;
  tags: string | null;
  externallyShown: boolean;
  additionalDetails: string | null;
  phoneNumberPrefix: string | null;
  is5G: boolean;
  speedLong: string | null;
  createdAt: Date;
  updatedAt: Date;
  syncedAt: Date | null;
}): ProductWithDetails {
  return {
    ...product,
    countries: product.countries ? JSON.parse(product.countries) : [],
    regions: product.regions ? JSON.parse(product.regions) : [],
    features: product.features ? JSON.parse(product.features) : [],
  };
}

/**
 * Generate a unique slug in-memory using a pre-fetched Set of existing slugs.
 * Mutates the Set by adding the reserved slug (safe because the Set is local to the sync batch).
 */
function generateSlugInMemory(name: string, slugSet: Set<string>): string {
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (slugSet.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  slugSet.add(slug);
  return slug;
}

/**
 * Sync products from MobiMatter API to database
 *
 * Optimized to eliminate N+1 queries: pre-fetches all existing products and slugs
 * in 2 bulk queries, then uses in-memory lookups during the loop.
 * Total queries: ~1502 (2 bulk selects + 1 write per product) instead of ~4500.
 */
export async function syncProductsFromMobimatter(): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    totalProcessed: 0,
  };

  try {
    // Fetch all products from MobiMatter
    const mobimatterProducts = await fetchProducts();

    result.totalProcessed = mobimatterProducts.length;

    // Pre-fetch ALL existing products in one query (eliminates per-product findUnique)
    const existingProducts = await db.product.findMany({
      select: {
        id: true,
        mobimatterId: true,
        slug: true,
        isActive: true,
        description: true,
        providerLogo: true,
        category: true,
        countries: true,
        regions: true,
        dataAmount: true,
        dataUnit: true,
        validityDays: true,
        currency: true,
        features: true,
        networkType: true,
        activationPolicy: true,
        ipRouting: true,
        speedInfo: true,
        speedLong: true,
        topUpAvailable: true,
        is5G: true,
        tags: true,
        additionalDetails: true,
        phoneNumberPrefix: true,
        rank: true,
        penalizedRank: true,
        productFamilyId: true,
        networkListId: true,
      },
    });

    const existingMap = new Map(
      existingProducts.map(p => [p.mobimatterId, p])
    );

    // Pre-fetch ALL existing slugs in one query (eliminates per-product findFirst in generateUniqueSlug)
    const existingSlugs = new Set(
      existingProducts.map(p => p.slug).filter(Boolean)
    );

    for (const rawProduct of mobimatterProducts) {
      try {
        // Skip junk products (deactivate if they already exist)
        const isJunk = rawProduct.price <= 0
          || /\btest\b/i.test(rawProduct.name)
          || rawProduct.productCategory === 'esim_replacement';

        if (isJunk) {
          const existingJunk = existingMap.get(rawProduct.id);
          if (existingJunk && existingJunk.isActive) {
            await db.product.update({
              where: { id: existingJunk.id },
              data: { isActive: false, syncedAt: new Date() },
            });
          }
          result.skipped++;
          continue;
        }

        // Check if product already exists (in-memory lookup instead of DB query)
        const existing = existingMap.get(rawProduct.id);

        const markedUpPrice = Math.round(rawProduct.price * (1 + MARKUP_PERCENTAGE) * 100) / 100;

        if (existing) {
          // Update existing product
          // Keep existing slug to preserve URLs — only generate slug for new products
          const slug = existing.slug || generateSlugInMemory(rawProduct.name, existingSlugs);

          await db.product.update({
            where: { id: existing.id },
            data: {
              name: rawProduct.name,
              description: rawProduct.description || existing.description,
              provider: rawProduct.provider,
              providerLogo: rawProduct.providerLogo || existing.providerLogo,
              category: rawProduct.productCategory || existing.category,
              countries: rawProduct.countries ? JSON.stringify(rawProduct.countries) : existing.countries,
              regions: rawProduct.regions ? JSON.stringify(rawProduct.regions) : existing.regions,
              dataAmount: rawProduct.dataAmount ?? existing.dataAmount,
              dataUnit: rawProduct.dataUnit ?? existing.dataUnit,
              validityDays: rawProduct.validityDays ?? existing.validityDays,
              price: markedUpPrice,
              originalPrice: rawProduct.price,
              wholesalePrice: rawProduct.wholesalePrice || null,
              currency: rawProduct.currency || existing.currency,
              features: rawProduct.features ? JSON.stringify(rawProduct.features) : existing.features,
              isUnlimited: rawProduct.isUnlimited,
              supportsHotspot: rawProduct.supportsHotspot,
              supportsCalls: rawProduct.supportsCalls,
              supportsSms: rawProduct.supportsSms,
              networkType: rawProduct.networkType || existing.networkType,
              activationPolicy: rawProduct.activationPolicy || existing.activationPolicy,
              ipRouting: rawProduct.ipRouting || existing.ipRouting,
              speedInfo: rawProduct.speedInfo || existing.speedInfo,
              speedLong: rawProduct.speedLong || existing.speedLong,
              topUpAvailable: rawProduct.topUpAvailable ?? existing.topUpAvailable,
              usageTracking: rawProduct.usageTracking === 'Realtime, in-app' || rawProduct.usageTracking === 'Dial short code',
              is5G: rawProduct.is5G ?? existing.is5G,
              tags: rawProduct.tags ? JSON.stringify(rawProduct.tags) : existing.tags,
              externallyShown: rawProduct.externallyShown !== false,
              additionalDetails: rawProduct.additionalDetails || existing.additionalDetails,
              phoneNumberPrefix: rawProduct.phoneNumberPrefix || existing.phoneNumberPrefix,
              rank: rawProduct.rank ?? existing.rank,
              penalizedRank: rawProduct.penalizedRank ?? existing.penalizedRank,
              productFamilyId: rawProduct.productFamilyId ?? existing.productFamilyId,
              networkListId: rawProduct.networkListId ?? existing.networkListId,
              slug,
              isActive: true,
              syncedAt: new Date(),
            },
          });

          result.updated++;
        } else {
          // Create new product
          const slug = generateSlugInMemory(rawProduct.name, existingSlugs);
          const productData = transformMobimatterProduct(rawProduct);

          await db.product.create({
            data: {
              ...productData,
              slug,
            },
          });

          result.created++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Product ${rawProduct.id}: ${errorMessage}`);
        result.skipped++;
      }
    }

    // Mark products not in sync as inactive (optional cleanup)
    const syncedIds = mobimatterProducts.map(p => p.id);
    await db.product.updateMany({
      where: {
        mobimatterId: { notIn: syncedIds },
        isActive: true,
      },
      data: { isActive: false },
    });

    // Invalidate all product-related caches after sync
    invalidateCachePrefix('product:');
    invalidateCachePrefix('products:');
    invalidateCachePrefix('countries:');
    invalidateCachePrefix('providers:');

  } catch (error) {
    result.success = false;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Sync failed: ${errorMessage}`);
  }

  return result;
}

/**
 * Get product by ID or slug
 */
export async function getProductById(idOrSlug: string): Promise<ProductWithDetails | null> {
  return cached(
    `product:${idOrSlug}`,
    async () => {
      const product = await db.product.findFirst({
        where: {
          OR: [
            { id: idOrSlug },
            { slug: idOrSlug },
            { mobimatterId: idOrSlug },
          ],
        },
      });

      if (!product) {
        return null;
      }

      return parseProductJsonFields(product);
    },
    CACHE_TTL.PRODUCT_DETAIL
  );
}

/**
 * Get products with filtering and pagination
 */
export async function getProducts(filters: ProductFilters = {}): Promise<PaginatedProducts> {
  const {
    country,
    region,
    provider,
    category,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    limit = 20,
    offset = 0,
    isActive = true,
  } = filters;

  // Build where clause
  const where: Prisma.ProductWhereInput = {
    isActive,
    ...(provider && { provider }),
    ...(category && { category }),
    ...(minPrice !== undefined && { price: { gte: minPrice } }),
    ...(maxPrice !== undefined && { price: { lte: maxPrice } }),
    ...(country && {
      countries: { contains: `"${country}"` },
    }),
    ...(region && {
      regions: { contains: `"${region}"` },
    }),
  };

  // Build order by
  const orderBy: Prisma.ProductOrderByWithRelationInput = {};
  switch (sortBy) {
    case 'price_asc':
      orderBy.price = 'asc';
      break;
    case 'price_desc':
      orderBy.price = 'desc';
      break;
    case 'name':
      orderBy.name = 'asc';
      break;
    case 'validity':
      orderBy.validityDays = 'desc';
      break;
    case 'data':
      orderBy.dataAmount = 'desc';
      break;
    case 'rank':
      orderBy.rank = 'desc';
      break;
    case 'createdAt':
    default:
      orderBy.createdAt = 'desc';
  }

  // Get total count
  const total = await db.product.count({ where });

  // Get products
  const products = await db.product.findMany({
    where,
    orderBy,
    take: limit,
    skip: offset,
  });

  return {
    products: products.map(parseProductJsonFields),
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
}

/**
 * Get list of all available countries from products
 */
export async function getAvailableCountries(): Promise<CountryInfo[]> {
  return cached(
    'countries:all',
    async () => {
      const products = await db.product.findMany({
        where: {
          isActive: true,
          countries: { not: null },
        },
        select: {
          countries: true,
        },
      });

      const countryCount = new Map<string, number>();

      for (const product of products) {
        if (product.countries) {
          try {
            const countries = JSON.parse(product.countries) as string[];
            for (const country of countries) {
              countryCount.set(country, (countryCount.get(country) || 0) + 1);
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }

      return Array.from(countryCount.entries())
        .map(([code, productCount]) => ({
          code,
          name: getCountryName(code),
          productCount,
        }))
        .sort((a, b) => b.productCount - a.productCount);
    },
    CACHE_TTL.COUNTRIES
  );
}

/**
 * Get list of all providers with product counts
 */
export async function getAvailableProviders(): Promise<ProviderInfo[]> {
  return cached(
    'providers:all',
    async () => {
      const providers = await db.product.groupBy({
        by: ['provider'],
        where: {
          isActive: true,
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
      });

      return providers.map(p => ({
        name: p.provider,
        productCount: p._count.id,
      }));
    },
    CACHE_TTL.PROVIDERS
  );
}

/**
 * Get featured products
 */
export async function getFeaturedProducts(limit: number = 6): Promise<ProductWithDetails[]> {
  return cached(
    `products:featured:${limit}`,
    async () => {
      const products = await db.product.findMany({
        where: {
          isActive: true,
          isFeatured: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return products.map(parseProductJsonFields);
    },
    CACHE_TTL.FEATURED
  );
}

/**
 * Search products by name or description
 */
export async function searchProducts(
  query: string,
  options: { limit?: number; offset?: number } = {}
): Promise<PaginatedProducts> {
  const { limit = 20, offset = 0 } = options;

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    OR: [
      { name: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { provider: { contains: query, mode: "insensitive" } },
    ],
  };

  const total = await db.product.count({ where });

  const products = await db.product.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });

  return {
    products: products.map(parseProductJsonFields),
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
}

/**
 * Get products by provider
 */
export async function getProductsByProvider(
  provider: string,
  options: { limit?: number; offset?: number } = {}
): Promise<PaginatedProducts> {
  return getProducts({
    provider,
    ...options,
  });
}

/**
 * Get products by country
 */
export async function getProductsByCountry(
  country: string,
  options: { limit?: number; offset?: number } = {}
): Promise<PaginatedProducts> {
  return getProducts({
    country,
    ...options,
  });
}

/**
 * Map country codes to names
 * This is a simplified mapping - in production, use a proper country data library
 */
function getCountryName(code: string): string {
  const countryNames: Record<string, string> = {
    US: 'United States',
    GB: 'United Kingdom',
    UK: 'United Kingdom',
    CA: 'Canada',
    AU: 'Australia',
    DE: 'Germany',
    FR: 'France',
    IT: 'Italy',
    ES: 'Spain',
    JP: 'Japan',
    KR: 'South Korea',
    CN: 'China',
    IN: 'India',
    BR: 'Brazil',
    MX: 'Mexico',
    NL: 'Netherlands',
    BE: 'Belgium',
    CH: 'Switzerland',
    AT: 'Austria',
    SE: 'Sweden',
    NO: 'Norway',
    DK: 'Denmark',
    FI: 'Finland',
    PL: 'Poland',
    PT: 'Portugal',
    GR: 'Greece',
    TR: 'Turkey',
    TH: 'Thailand',
    VN: 'Vietnam',
    SG: 'Singapore',
    MY: 'Malaysia',
    ID: 'Indonesia',
    PH: 'Philippines',
    NZ: 'New Zealand',
    ZA: 'South Africa',
    AE: 'United Arab Emirates',
    SA: 'Saudi Arabia',
    IL: 'Israel',
    EG: 'Egypt',
    NG: 'Nigeria',
    KE: 'Kenya',
    AR: 'Argentina',
    CL: 'Chile',
    CO: 'Colombia',
    PE: 'Peru',
    RU: 'Russia',
    UA: 'Ukraine',
    CZ: 'Czech Republic',
    RO: 'Romania',
    HU: 'Hungary',
    IE: 'Ireland',
    LU: 'Luxembourg',
    HK: 'Hong Kong',
    TW: 'Taiwan',
    MAC: 'Macau',
  };

  return countryNames[code.toUpperCase()] || code;
}
