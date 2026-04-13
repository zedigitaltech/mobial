import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getProductById,
  ProductWithDetails,
  getProducts,
} from "@/services/product-service";
import { ProductDetailClient } from "./client";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/common/json-ld";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://mobialo.eu";

// Generate static params for popular products
export async function generateStaticParams() {
  try {
    const { products } = await getProducts({ limit: 50 });
    return products.map((product) => ({
      slug: product.slug,
    }));
  } catch {
    return [];
  }
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductById(slug);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  const title = product.metaTitle || `${product.name} | MobiaL eSIM`;
  const description =
    product.metaDescription ||
    `Buy ${product.name} eSIM with ${product.dataAmount || "unlimited"} data for ${product.validityDays || "flexible"} days. Coverage in ${product.countries.slice(0, 3).join(", ")} and more.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/products/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${BASE_URL}/products/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

// Server component
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductById(slug);

  if (!product) {
    notFound();
  }

  // Get review stats for JSON-LD AggregateRating (SEO rich snippets)
  let reviewStats: { averageRating: number; reviewCount: number } | undefined;
  try {
    const stats = await db.review.aggregate({
      where: { approved: true },
      _avg: { rating: true },
      _count: { rating: true },
    });
    if (stats._count.rating > 0) {
      reviewStats = {
        averageRating: stats._avg.rating || 0,
        reviewCount: stats._count.rating,
      };
    }
  } catch {
    /* non-critical */
  }

  // Get related products with graceful degradation — page renders even if these fail
  let filteredRelated: ProductWithDetails[] = [];
  let countryRelated: ProductWithDetails[] = [];

  try {
    const [providerResults, countryResults] = await Promise.all([
      getProducts({ provider: product.provider, limit: 4 }),
      product.countries[0]
        ? getProducts({ country: product.countries[0], limit: 6 })
        : Promise.resolve({ products: [] } as {
            products: ProductWithDetails[];
          }),
    ]);

    filteredRelated = providerResults.products
      .filter((p) => p.id !== product.id)
      .slice(0, 3);

    countryRelated = countryResults.products
      .filter((p) => p.id !== product.id && p.provider !== product.provider)
      .slice(0, 3);
  } catch (error) {
    logger.warn("[ProductPage] Failed to fetch related products", { metadata: { slug, error: error instanceof Error ? error.message : "unknown" } });
  }

  return (
    <>
      <ProductJsonLd
        product={product}
        baseUrl={BASE_URL}
        reviewStats={reviewStats}
      />
      <BreadcrumbJsonLd
        baseUrl={BASE_URL}
        items={[
          { name: "Home", url: "/" },
          { name: "Products", url: "/products" },
          { name: product.name },
        ]}
      />
      <ProductDetailClient
        product={product}
        relatedProducts={filteredRelated}
        countryRelatedProducts={countryRelated}
      />
    </>
  );
}
