"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { Home, Globe, Search, User } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const t = useTranslations("bottomNav")
  const pathname = usePathname()
  const { user, openAuthModal } = useAuth()

  const NAV_ITEMS = [
    { href: "/", icon: Home, label: t("home") },
    { href: "/esim", icon: Globe, label: t("destinations") },
    { href: "/products", icon: Search, label: t("browse") },
    { href: "__account__", icon: User, label: t("account") },
  ]

  const isActive = (href: string) => {
    if (href.startsWith("__")) return false
    if (href === "/") return pathname === "/"
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href)

          if (item.href === "__account__") {
            if (user) {
              return (
                <Link
                  key={item.label}
                  href="/dashboard"
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-1",
                  )}
                >
                  <item.icon className={cn("h-5 w-5", pathname.startsWith("/dashboard") || pathname.startsWith("/settings") ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("text-[10px] font-medium", pathname.startsWith("/dashboard") || pathname.startsWith("/settings") ? "text-primary" : "text-muted-foreground")}>
                    {item.label}
                  </span>
                </Link>
              )
            }

            return (
              <button
                key={item.label}
                onClick={() => openAuthModal("login")}
                className="flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-1"
              >
                <item.icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground">{item.label}</span>
              </button>
            )
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-1"
            >
              <item.icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-[10px] font-medium", active ? "text-primary" : "text-muted-foreground")}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
