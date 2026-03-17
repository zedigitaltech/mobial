import type { ProductWithDetails } from "@/services/product-service";
import { getCountryByCode } from "@/lib/countries";

/**
 * JSON-LD structured data components for SEO.
 *
 * All data passed to these components originates from our own database
 * or hardcoded constants — never from user input. The JSON.stringify
 * serialization inherently escapes any special characters, making
 * script injection impossible in this context.
 */

// Generic JSON-LD renderer — data is always server-generated, never user input
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Organization schema — homepage
export function OrganizationJsonLd({ baseUrl }: { baseUrl: string }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "MobiaL",
        url: baseUrl,
        logo: `${baseUrl}/icons/icon-512x512.png`,
        description:
          "Global eSIM marketplace offering instant high-speed data plans for 150+ countries with no roaming fees.",
        contactPoint: {
          "@type": "ContactPoint",
          email: "support@mobialo.eu",
          contactType: "customer service",
          availableLanguage: ["English"],
        },
        sameAs: ["https://x.com/mobial_esim", "https://facebook.com/mobial"],
      }}
    />
  );
}

// WebSite schema with search action — homepage
export function WebSiteJsonLd({ baseUrl }: { baseUrl: string }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "MobiaL",
        url: baseUrl,
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${baseUrl}/products?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      }}
    />
  );
}

// Product schema — product detail pages
export function ProductJsonLd({
  product,
  baseUrl,
  reviewStats,
}: {
  product: ProductWithDetails;
  baseUrl: string;
  reviewStats?: { averageRating: number; reviewCount: number };
}) {
  const dataDescription = product.isUnlimited
    ? "Unlimited data"
    : product.dataAmount
      ? `${product.dataAmount} ${product.dataUnit || "GB"}`
      : "Data plan";

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description:
          product.description ||
          `${dataDescription} eSIM plan for ${product.countries.slice(0, 3).join(", ")}${product.countries.length > 3 ? ` and ${product.countries.length - 3} more countries` : ""}. Valid for ${product.validityDays || "flexible"} days.`,
        brand: {
          "@type": "Brand",
          name: product.provider,
        },
        category: "eSIM Data Plan",
        offers: {
          "@type": "Offer",
          url: `${baseUrl}/products/${product.slug}`,
          priceCurrency: product.currency,
          price: product.price.toFixed(2),
          availability: "https://schema.org/InStock",
          seller: {
            "@type": "Organization",
            name: "MobiaL",
          },
        },
        ...(reviewStats &&
          reviewStats.reviewCount > 0 && {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: reviewStats.averageRating.toFixed(1),
              reviewCount: reviewStats.reviewCount,
              bestRating: 5,
              worstRating: 1,
            },
          }),
        ...(product.countries.length > 0 && {
          areaServed: product.countries.map((code) => ({
            "@type": "Country",
            name: getCountryByCode(code)?.name || code,
          })),
        }),
      }}
    />
  );
}

// FAQ schema — FAQ page
export function FAQPageJsonLd({
  questions,
}: {
  questions: Array<{ q: string; a: string }>;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: questions.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      }}
    />
  );
}

// Article schema — blog posts
export function ArticleJsonLd({
  title,
  description,
  author,
  publishedAt,
  url,
  baseUrl,
}: {
  title: string;
  description: string;
  author: string;
  publishedAt: string;
  url: string;
  baseUrl: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description,
        author: {
          "@type": "Person",
          name: author,
        },
        publisher: {
          "@type": "Organization",
          name: "MobiaL",
          logo: {
            "@type": "ImageObject",
            url: `${baseUrl}/icons/icon-512x512.png`,
          },
        },
        datePublished: publishedAt,
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": url,
        },
      }}
    />
  );
}

// Breadcrumb schema — all pages
export function BreadcrumbJsonLd({
  items,
  baseUrl,
}: {
  items: Array<{ name: string; url?: string }>;
  baseUrl: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          ...(item.url && { item: `${baseUrl}${item.url}` }),
        })),
      }}
    />
  );
}
