"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  ShoppingCart,
  Check,
  Clock,
  Globe,
  MapPin,
  Wifi,
  Phone,
  MessageSquare,
  Share2,
  Heart,
  Zap,
  Shield,
  CreditCard,
  Loader2,
} from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { CartDrawer } from "@/components/store/cart-drawer"
import { ProductCard } from "@/components/common/product-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCart } from "@/contexts/cart-context"
import { ProductWithDetails } from "@/services/product-service"

interface ProductDetailClientProps {
  product: ProductWithDetails
  relatedProducts: ProductWithDetails[]
}

export function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const router = useRouter()
  const { addItem, isInCart } = useCart()
  const [addingToCart, setAddingToCart] = useState(false)

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  const inCart = isInCart(product.id)

  const handleAddToCart = async () => {
    if (inCart) {
      router.push("/checkout")
      return
    }

    setAddingToCart(true)
    
    // Simulate a brief delay for UX
    await new Promise(resolve => setTimeout(resolve, 300))
    
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
    
    setAddingToCart(false)
  }

  const formatData = () => {
    if (product.isUnlimited) return "Unlimited"
    if (product.dataAmount && product.dataUnit) {
      return `${product.dataAmount} ${product.dataUnit}`
    }
    return "Data Plan"
  }

  const features = [
    {
      icon: Zap,
      title: "Instant Activation",
      description: "Get your eSIM delivered instantly via email after purchase.",
    },
    {
      icon: Shield,
      title: "Secure Connection",
      description: "Enterprise-grade encryption for all your data traffic.",
    },
    {
      icon: Globe,
      title: "Wide Coverage",
      description: `Coverage in ${product.countries.length} countries and regions.`,
    },
    {
      icon: CreditCard,
      title: "No Hidden Fees",
      description: "What you see is what you pay. No surprises.",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b bg-muted/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/products">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Products
                </Link>
              </Button>
              <CartDrawer />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left Column - Product Image/Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Provider Card */}
              <Card className="overflow-hidden">
                <div className="p-8 bg-gradient-to-br from-primary/5 to-primary/10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Wifi className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{product.provider}</p>
                      <h1 className="text-2xl font-bold">{product.name}</h1>
                    </div>
                    {product.isFeatured && (
                      <Badge variant="default" className="ml-auto">Popular</Badge>
                    )}
                  </div>

                  {/* Data Amount Display */}
                  <div className="text-center py-8">
                    <div className="text-5xl font-bold text-primary mb-2">
                      {formatData()}
                    </div>
                    <p className="text-muted-foreground">High-Speed Data</p>
                  </div>

                  {/* Quick Info */}
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="p-4 rounded-lg bg-background/50">
                      <Clock className="h-5 w-5 text-primary mb-2" />
                      <p className="text-sm text-muted-foreground">Validity</p>
                      <p className="font-semibold">
                        {product.validityDays ? `${product.validityDays} days` : "Flexible"}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-background/50">
                      <MapPin className="h-5 w-5 text-primary mb-2" />
                      <p className="text-sm text-muted-foreground">Coverage</p>
                      <p className="font-semibold">{product.countries.length} countries</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Features Badges */}
              <div className="flex flex-wrap gap-2">
                {product.supportsHotspot && (
                  <Badge variant="secondary" className="gap-1">
                    <Check className="h-3 w-3" /> Hotspot/Tethering
                  </Badge>
                )}
                {product.supportsCalls && (
                  <Badge variant="secondary" className="gap-1">
                    <Phone className="h-3 w-3" /> Voice Calls
                  </Badge>
                )}
                {product.supportsSms && (
                  <Badge variant="secondary" className="gap-1">
                    <MessageSquare className="h-3 w-3" /> SMS
                  </Badge>
                )}
                {product.isUnlimited && (
                  <Badge variant="secondary" className="gap-1">
                    <Zap className="h-3 w-3" /> Unlimited Data
                  </Badge>
                )}
              </div>
            </motion.div>

            {/* Right Column - Pricing & Purchase */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Price Card */}
              <Card>
                <CardContent className="p-6 space-y-6">
                  {/* Price */}
                  <div className="text-center">
                    {discount > 0 && (
                      <Badge variant="destructive" className="mb-2">
                        Save {discount}%
                      </Badge>
                    )}
                    <div className="flex items-end justify-center gap-2">
                      <span className="text-4xl font-bold">${product.price.toFixed(2)}</span>
                      {product.originalPrice && (
                        <span className="text-lg text-muted-foreground line-through">
                          ${product.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">One-time payment</p>
                  </div>

                  <Separator />

                  {/* Add to Cart */}
                  <Button
                    size="lg"
                    className="w-full gradient-accent text-accent-foreground"
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                  >
                    {addingToCart ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : inCart ? (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Go to Checkout
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </>
                    )}
                  </Button>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" size="sm">
                      <Heart className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" className="flex-1" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>

                  {/* Trust Signals */}
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Instant email delivery</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>24/7 customer support</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Easy QR code activation</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Coverage Countries */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold flex items-center gap-2 mb-4">
                    <Globe className="h-5 w-5 text-primary" />
                    Coverage ({product.countries.length} countries)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {product.countries.slice(0, 10).map((country) => (
                      <Badge key={country} variant="outline">
                        {country}
                      </Badge>
                    ))}
                    {product.countries.length > 10 && (
                      <Badge variant="outline">
                        +{product.countries.length - 10} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Product Details Tabs */}
          <div className="mt-12">
            <Tabs defaultValue="features" className="w-full">
              <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="activation">Activation</TabsTrigger>
                <TabsTrigger value="faq">FAQ</TabsTrigger>
              </TabsList>

              <TabsContent value="features" className="mt-8">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {features.map((feature) => (
                    <Card key={feature.title}>
                      <CardContent className="p-6 text-center">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                          <feature.icon className="h-6 w-6 text-primary" />
                        </div>
                        <h4 className="font-semibold mb-2">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="activation" className="mt-8">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">How to Activate Your eSIM</h3>
                    <ol className="space-y-4 text-muted-foreground">
                      <li className="flex gap-3">
                        <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">1</span>
                        <span>After purchase, you will receive an email with your eSIM QR code</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">2</span>
                        <span>Go to Settings → Cellular → Add eSIM on your device</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">3</span>
                        <span>Scan the QR code or enter the activation code manually</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">4</span>
                        <span>Your eSIM is now active and ready to use!</span>
                      </li>
                    </ol>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="faq" className="mt-8">
                <Card>
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <h4 className="font-semibold mb-2">When does my eSIM activate?</h4>
                      <p className="text-muted-foreground">Your eSIM activates when you first connect to a supported network in the coverage area. The validity period starts from the first connection.</p>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Can I use this eSIM for tethering?</h4>
                      <p className="text-muted-foreground">
                        {product.supportsHotspot
                          ? "Yes, this eSIM supports tethering/hotspot, so you can share your connection with other devices."
                          : "No, this eSIM does not support tethering. Please check our other plans for hotspot-compatible options."}
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">What happens if I run out of data?</h4>
                      <p className="text-muted-foreground">You can purchase additional data packages or get a new eSIM. We'll notify you when you're approaching your data limit.</p>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Is my device compatible?</h4>
                      <p className="text-muted-foreground">Most modern smartphones support eSIM, including iPhone XR and later, Google Pixel 3 and later, and Samsung Galaxy S20 and later. Check your device settings to confirm eSIM support.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold mb-6">Similar Plans from {product.provider}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <ProductCard
                    key={relatedProduct.id}
                    product={{
                      id: relatedProduct.id,
                      name: relatedProduct.name,
                      provider: relatedProduct.provider,
                      dataAmount: relatedProduct.dataAmount,
                      dataUnit: relatedProduct.dataUnit,
                      validityDays: relatedProduct.validityDays,
                      countries: JSON.stringify(relatedProduct.countries),
                      price: relatedProduct.price,
                      originalPrice: relatedProduct.originalPrice,
                      isUnlimited: relatedProduct.isUnlimited,
                      isFeatured: relatedProduct.isFeatured,
                      supportsHotspot: relatedProduct.supportsHotspot,
                      supportsCalls: relatedProduct.supportsCalls,
                      supportsSms: relatedProduct.supportsSms,
                    }}
                    onBuy={() => {
                      addItem({
                        productId: relatedProduct.id,
                        name: relatedProduct.name,
                        provider: relatedProduct.provider,
                        price: relatedProduct.price,
                        originalPrice: relatedProduct.originalPrice,
                        dataAmount: relatedProduct.dataAmount,
                        dataUnit: relatedProduct.dataUnit,
                        validityDays: relatedProduct.validityDays,
                      })
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
