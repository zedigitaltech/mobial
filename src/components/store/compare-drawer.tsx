"use client"

import { useTranslations } from "next-intl"
import { useCompare, CompareItem } from "@/contexts/compare-context"
import { useCart } from "@/contexts/cart-context"
import { useCurrency } from "@/contexts/currency-context"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  X,
  ShoppingCart,
  Check,
  Minus,
  Wifi,
  Phone,
  MessageSquare,
  Share2,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"

function CompareValue({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-2">
      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
        {label}
      </div>
      <div className="text-sm font-medium">{children}</div>
    </div>
  )
}

function FeatureCheck({ supported }: { supported?: boolean }) {
  return supported ? (
    <Check className="h-4 w-4 text-emerald-500" />
  ) : (
    <Minus className="h-4 w-4 text-muted-foreground/50" />
  )
}

function CompareColumn({ item }: { item: CompareItem }) {
  const t = useTranslations("compare")
  const { removeItem } = useCompare()
  const { addItem: addToCart, isInCart } = useCart()
  const { formatPrice } = useCurrency()

  const perDay =
    item.validityDays && item.validityDays > 0
      ? item.price / item.validityDays
      : null

  const count = item.countries?.length || 0

  return (
    <div className="min-w-[180px] flex-1 border-r last:border-r-0 border-border/30 px-3">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{item.provider}</p>
          <p className="text-sm font-bold leading-tight truncate">{item.name}</p>
        </div>
        <button
          onClick={() => removeItem(item.id)}
          className="p-1 hover:bg-muted rounded shrink-0"
          aria-label={`Remove ${item.name} from comparison`}
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      <CompareValue label={t("price")}>
        <span className="text-primary font-bold">{formatPrice(item.price)}</span>
        {perDay && (
          <span className="text-xs text-muted-foreground ml-1">
            ({formatPrice(perDay)}/day)
          </span>
        )}
      </CompareValue>

      <CompareValue label={t("data")}>
        {item.isUnlimited
          ? t("unlimited")
          : item.dataAmount
            ? `${item.dataAmount} ${item.dataUnit || "GB"}`
            : t("na")}
      </CompareValue>

      <CompareValue label={t("validity")}>
        {item.validityDays ? t("daysCount", { days: item.validityDays }) : t("flexible")}
      </CompareValue>

      <CompareValue label={t("coverage")}>
        {t("countriesCount", { count })}
      </CompareValue>

      <CompareValue label={t("network")}>
        {item.networkType || "4G/LTE"}
      </CompareValue>

      <CompareValue label={t("features")}>
        <div className="flex gap-3">
          <div className="flex items-center gap-1" title={t("hotspot")}>
            <Wifi className="h-3 w-3" />
            <FeatureCheck supported={item.supportsHotspot} />
          </div>
          <div className="flex items-center gap-1" title={t("calls")}>
            <Phone className="h-3 w-3" />
            <FeatureCheck supported={item.supportsCalls} />
          </div>
          <div className="flex items-center gap-1" title={t("sms")}>
            <MessageSquare className="h-3 w-3" />
            <FeatureCheck supported={item.supportsSms} />
          </div>
        </div>
      </CompareValue>

      <div className="pt-3 space-y-2">
        <Button
          size="sm"
          className="w-full"
          variant={isInCart(item.id) ? "secondary" : "default"}
          disabled={isInCart(item.id)}
          onClick={() =>
            addToCart({
              productId: item.id,
              name: item.name,
              provider: item.provider,
              price: item.price,
              originalPrice: item.originalPrice,
              dataAmount: item.dataAmount,
              dataUnit: item.dataUnit,
              validityDays: item.validityDays,
            })
          }
        >
          {isInCart(item.id) ? (
            <><Check className="h-3 w-3 mr-1" />{t("inCart")}</>
          ) : (
            <><ShoppingCart className="h-3 w-3 mr-1" />{t("addToCart")}</>
          )}
        </Button>
        <Button size="sm" variant="ghost" className="w-full" asChild>
          <Link href={`/products/${item.slug}`}>
            {t("viewDetails")} <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

export function CompareDrawer() {
  const t = useTranslations("compare")
  const { items, isOpen, setOpen, clear } = useCompare()

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="bottom" className="max-h-[80vh]">
        <SheetHeader className="flex-row items-center justify-between">
          <SheetTitle className="flex items-center gap-2">
            {t("comparePlans")}
            <Badge variant="secondary">{items.length}</Badge>
          </SheetTitle>
          <Button variant="ghost" size="sm" onClick={clear}>
            {t("clearAll")}
          </Button>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Share2 className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="font-medium">{t("noPlans")}</p>
            <p className="text-sm mt-1">
              {t("noPlansHint")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <div className="flex min-w-max">
              {items.map((item) => (
                <CompareColumn key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export function CompareBar() {
  const t = useTranslations("compare")
  const { items, toggleDrawer, clear } = useCompare()

  if (items.length === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="default" className="font-bold">
            {items.length}
          </Badge>
          <span className="text-sm font-medium">
            {items.length === 1 ? t("plan") : t("plans")} {t("selected")}
          </span>
          <div className="hidden sm:flex gap-2">
            {items.map((item) => (
              <Badge key={item.id} variant="outline" className="text-xs">
                {item.name.length > 20 ? `${item.name.slice(0, 20)}...` : item.name}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={clear}>
            {t("clear")}
          </Button>
          <Button size="sm" onClick={toggleDrawer} disabled={items.length < 2}>
            {t("compareNow")}
          </Button>
        </div>
      </div>
    </div>
  )
}
