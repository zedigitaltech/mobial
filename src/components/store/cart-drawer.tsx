"use client"

import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Wifi,
  ArrowRight,
  Package
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useCart, CartItem } from "@/contexts/cart-context"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { useTranslations } from "next-intl"

interface CartDrawerProps {
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function CartItemCard({ item }: { item: CartItem }) {
  const t = useTranslations("cart")
  const { removeItem, updateQuantity, getItemQuantity } = useCart()
  const quantity = getItemQuantity(item.productId)

  const formatData = () => {
    if (item.dataAmount && item.dataUnit) {
      return `${item.dataAmount} ${item.dataUnit}`
    }
    return t("dataPlan")
  }

  const formatValidity = () => {
    if (item.validityDays) {
      return `${item.validityDays} ${t("days")}`
    }
    return null
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex gap-3 py-3"
    >
      <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Wifi className="h-6 w-6 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium truncate">{item.name}</p>
            <p className="text-xs text-muted-foreground">{item.provider}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
            onClick={() => removeItem(item.productId)}
            aria-label={`Remove ${item.name} from cart`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-xs">
            {formatData()}
          </Badge>
          {formatValidity() && (
            <Badge variant="outline" className="text-xs">
              {formatValidity()}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => updateQuantity(item.productId, quantity - 1)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-sm font-medium">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => updateQuantity(item.productId, quantity + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">${(item.price * quantity).toFixed(2)}</p>
            {item.originalPrice && (
              <p className="text-xs text-muted-foreground line-through">
                ${(item.originalPrice * quantity).toFixed(2)}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function CartBody({ onClose }: { onClose?: () => void }) {
  const t = useTranslations("cart")
  const router = useRouter()
  const { items, total, itemCount, clearCart } = useCart()

  const handleCheckout = () => {
    onClose?.()
    router.push("/checkout")
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <Package className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">{t("empty")}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t("emptyDesc")}
        </p>
        <Button onClick={onClose} asChild>
          <a href="/products">{t("browsePlans")}</a>
        </Button>
      </div>
    )
  }

  return (
    <>
      <ScrollArea className="flex-1 px-6">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <CartItemCard key={item.productId} item={item} />
          ))}
        </AnimatePresence>
      </ScrollArea>

      <div className="border-t px-6 py-4 space-y-4 pb-[env(safe-area-inset-bottom)]">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("subtotal")}</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("tax")}</span>
            <span>$0.00</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>{t("total")}</span>
            <span className="text-primary">${total.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            className="w-full gradient-accent text-accent-foreground"
            onClick={handleCheckout}
          >
            {t("proceedToCheckout")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={clearCart}
          >
            {t("clearCart")}
          </Button>
        </div>
      </div>
    </>
  )
}

function CartHeader() {
  const t = useTranslations("cart")
  const { itemCount } = useCart()
  return (
    <div className="flex items-center gap-2">
      <ShoppingCart className="h-5 w-5" />
      {t("yourCart")}
      {itemCount > 0 && (
        <Badge variant="secondary" className="ml-auto">
          {itemCount} {itemCount === 1 ? t("item") : t("items")}
        </Badge>
      )}
    </div>
  )
}

export function CartDrawer({ trigger, open, onOpenChange }: CartDrawerProps) {
  const { itemCount } = useCart()
  const isMobile = useIsMobile()

  const defaultTrigger = (
    <Button variant="outline" size="icon" className="relative">
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <Badge
          variant="default"
          className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {itemCount}
        </Badge>
      )}
    </Button>
  )

  const triggerEl = trigger || defaultTrigger

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>
          {triggerEl}
        </DrawerTrigger>
        <DrawerContent className="max-h-[85vh] flex flex-col">
          <DrawerHeader>
            <DrawerTitle>
              <CartHeader />
            </DrawerTitle>
          </DrawerHeader>
          <CartBody onClose={() => onOpenChange?.(false)} />
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        {triggerEl}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>
            <CartHeader />
          </SheetTitle>
        </SheetHeader>
        <CartBody onClose={() => onOpenChange?.(false)} />
      </SheetContent>
    </Sheet>
  )
}
