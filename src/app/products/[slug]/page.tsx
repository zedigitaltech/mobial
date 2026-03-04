import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getProductById, ProductWithDetails, getProducts } from "@/services/product-service"
import { ProductDetailClient } from "./client"

// Generate static params for popular products
export async function generateStaticParams() {
  const { products } = await getProducts({ limit: 50 })
  return products.map((product) => ({
    slug: product.slug,
  }))
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductById(slug)

  if (!product) {
    return {
      title: "Product Not Found",
    }
  }

  const title = product.metaTitle || `${product.name} | MobiaL eSIM`
  const description = product.metaDescription || `Buy ${product.name} eSIM with ${product.dataAmount || 'unlimited'} data for ${product.validityDays || 'flexible'} days. Coverage in ${product.countries.slice(0, 3).join(', ')} and more.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "product",
      images: [
        {
          url: "/og-product.png",
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

// Server component
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductById(slug)

  if (!product) {
    notFound()
  }

  // Get related products
  const { products: relatedProducts } = await getProducts({
    provider: product.provider,
    limit: 4,
  })

  // Filter out current product
  const filteredRelated = relatedProducts.filter(p => p.id !== product.id).slice(0, 3)

  return (
    <ProductDetailClient
      product={product}
      relatedProducts={filteredRelated}
    />
  )
}
