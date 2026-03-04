/**
 * Product Service
 * Handles all product-related business logic
 */

import { db } from '@/lib/db';
import { fetchProducts } from '@/lib/mobimatter';
import { Prisma } from '@prisma/client';

// Types
export interface ProductFilters {
  country?: string;
  region?: string;
  provider?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'name' | 'validity' | 'data' | 'createdAt';
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
  description?: string;
  countries?: string[];
  regions?: string[];
  dataAmount?: number;
  dataUnit?: string;
  validityDays?: number;
  price: number;
  currency: string;
  features?: string[];
  isUnlimited: boolean;
  supportsHotspot: boolean;
  supportsCalls: boolean;
  supportsSms: boolean;
}): Prisma.ProductCreateInput {
  return {
    mobimatterId: raw.id,
    name: raw.name,
    description: raw.description || null,
    provider: raw.provider,
    category: null, // Could be derived from regions or product type
    countries: raw.countries ? JSON.stringify(raw.countries) : null,
    regions: raw.regions ? JSON.stringify(raw.regions) : null,
    dataAmount: raw.dataAmount || null,
    dataUnit: raw.dataUnit || null,
    validityDays: raw.validityDays || null,
    price: raw.price,
    currency: raw.currency || 'USD',
    originalPrice: null,
    features: raw.features ? JSON.stringify(raw.features) : null,
    isUnlimited: raw.isUnlimited,
    supportsHotspot: raw.supportsHotspot,
    supportsCalls: raw.supportsCalls,
    supportsSms: raw.supportsSms,
    isActive: true,
    isFeatured: false,
    slug: '', // Will be set separately
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
 * Sync products from MobiMatter API to database
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

    for (const rawProduct of mobimatterProducts) {
      try {
        // Check if product already exists
        const existing = await db.product.findUnique({
          where: { mobimatterId: rawProduct.id },
        });

        if (existing) {
          // Update existing product
          const slug = await generateUniqueSlug(rawProduct.name, existing.id);
          
          await db.product.update({
            where: { id: existing.id },
            data: {
              name: rawProduct.name,
              description: rawProduct.description || existing.description,
              provider: rawProduct.provider,
              countries: rawProduct.countries ? JSON.stringify(rawProduct.countries) : existing.countries,
              regions: rawProduct.regions ? JSON.stringify(rawProduct.regions) : existing.regions,
              dataAmount: rawProduct.dataAmount ?? existing.dataAmount,
              dataUnit: rawProduct.dataUnit ?? existing.dataUnit,
              validityDays: rawProduct.validityDays ?? existing.validityDays,
              price: rawProduct.price,
              currency: rawProduct.currency || existing.currency,
              features: rawProduct.features ? JSON.stringify(rawProduct.features) : existing.features,
              isUnlimited: rawProduct.isUnlimited,
              supportsHotspot: rawProduct.supportsHotspot,
              supportsCalls: rawProduct.supportsCalls,
              supportsSms: rawProduct.supportsSms,
              slug,
              syncedAt: new Date(),
            },
          });
          
          result.updated++;
        } else {
          // Create new product
          const slug = await generateUniqueSlug(rawProduct.name);
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
}

/**
 * Get products with filtering and pagination
 */
export async function getProducts(filters: ProductFilters = {}): Promise<PaginatedProducts> {
  const {
    country,
    region,
    provider,
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
  // Get all products with countries
  const products = await db.product.findMany({
    where: {
      isActive: true,
      countries: { not: null },
    },
    select: {
      countries: true,
    },
  });

  // Count occurrences of each country
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

  // Convert to array and sort by count
  const result = Array.from(countryCount.entries())
    .map(([code, productCount]) => ({
      code,
      name: getCountryName(code),
      productCount,
    }))
    .sort((a, b) => b.productCount - a.productCount);

  return result;
}

/**
 * Get list of all providers with product counts
 */
export async function getAvailableProviders(): Promise<ProviderInfo[]> {
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
}

/**
 * Get featured products
 */
export async function getFeaturedProducts(limit: number = 6): Promise<ProductWithDetails[]> {
  const products = await db.product.findMany({
    where: {
      isActive: true,
      isFeatured: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return products.map(parseProductJsonFields);
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
      { name: { contains: query } },
      { description: { contains: query } },
      { provider: { contains: query } },
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
