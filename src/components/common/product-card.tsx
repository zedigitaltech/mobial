"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { MapPin, Clock, Wifi, ShoppingCart, Check } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug?: string
    provider: string
    dataAmount?: number | null
    dataUnit?: string | null
    validityDays?: number | null
    countries?: string | null
    price: number
    originalPrice?: number | null
    isUnlimited?: boolean
    isFeatured?: boolean
    supportsHotspot?: boolean
    supportsCalls?: boolean
    supportsSms?: boolean
  }
  onBuy?: (productId: string) => void
  showLink?: boolean
}

export function ProductCard({ product, onBuy, showLink = true }: ProductCardProps) {
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  const productLink = product.slug ? `/products/${product.slug}` : `/products`

  const handleBuyClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onBuy?.(product.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Link href={showLink ? productLink : "#"} className="block h-full">
        <Card className="h-full flex flex-col overflow-hidden border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
          {/* Provider Header */}
          <div className="relative px-4 py-3 bg-muted/30 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Wifi className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{product.provider}</p>
                  <p className="text-xs text-muted-foreground">{product.name}</p>
                </div>
              </div>
              {product.isFeatured && (
                <Badge variant="default" className="text-xs">
                  Popular
                </Badge>
              )}
            </div>
            {discount > 0 && (
              <Badge
                variant="outline"
                className="absolute top-2 right-2 bg-accent text-accent-foreground border-0"
              >
                -{discount}%
              </Badge>
            )}
          </div>

          <CardContent className="flex-1 p-4 space-y-4">
            {/* Data Amount */}
            <div className="text-center py-3">
              <div className="text-3xl font-bold text-primary">
                {product.isUnlimited ? (
                  "Unlimited"
                ) : (
                  <>
                    {product.dataAmount}
                    <span className="text-lg font-medium text-muted-foreground ml-1">
                      {product.dataUnit || "GB"}
                    </span>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Data</p>
            </div>

            {/* Validity & Coverage */}
            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-2 text-primary" />
                <span>
                  {product.validityDays ? `${product.validityDays} days validity` : "Flexible validity"}
                </span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mr-2 text-primary" />
                <span>
                  {product.countries ? JSON.parse(product.countries).slice(0, 2).join(", ") : "Global"}
                  {product.countries && JSON.parse(product.countries).length > 2 && (
                    <span className="ml-1 text-xs">
                      +{JSON.parse(product.countries).length - 2} more
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-1.5">
              {product.supportsHotspot && (
                <Badge variant="secondary" className="text-xs">
                  <Check className="h-3 w-3 mr-1" />
                  Hotspot
                </Badge>
              )}
              {product.supportsCalls && (
                <Badge variant="secondary" className="text-xs">
                  <Check className="h-3 w-3 mr-1" />
                  Calls
                </Badge>
              )}
              {product.supportsSms && (
                <Badge variant="secondary" className="text-xs">
                  <Check className="h-3 w-3 mr-1" />
                  SMS
                </Badge>
              )}
            </div>
          </CardContent>

          <CardFooter className="p-4 pt-0 mt-auto">
            <div className="w-full space-y-3">
              {/* Price */}
              <div className="flex items-end justify-center">
                <span className="text-2xl font-bold">${product.price.toFixed(2)}</span>
                {product.originalPrice && (
                  <span className="text-sm text-muted-foreground line-through ml-2">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
              <Button
                className="w-full gradient-accent text-accent-foreground"
                onClick={handleBuyClick}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Buy Now
              </Button>
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  )
}
