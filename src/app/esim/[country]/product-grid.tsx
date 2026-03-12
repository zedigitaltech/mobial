"use client"

import { motion } from "framer-motion"
import { ProductCard } from "@/components/common/product-card"
import { useCart } from "@/contexts/cart-context"
import { BaseProduct } from "@/types/product"

type Product = BaseProduct

export function CountryProductGrid({ products }: { products: Product[] }) {
  const { addItem, isInCart } = useCart()

  const handleBuy = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (product && !isInCart(product.id)) {
      addItem({
        productId: product.id,
        name: product.name,
        provider: product.provider,
        price: product.price,
        originalPrice: product.originalPrice,
        dataAmount: product.dataAmount,
        dataUnit: product.dataUnit,
        validityDays: product.validityDays,
      })
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <ProductCard product={product} onBuy={handleBuy} />
        </motion.div>
      ))}
    </div>
  )
}
