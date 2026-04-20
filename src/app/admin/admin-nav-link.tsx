"use client"

import type { ElementType } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"

export function AdminNavLink({
  href,
  label,
  icon: Icon,
}: {
  href: string
  label: string
  icon: ElementType
}) {
  const pathname = usePathname()
  // Exact match for /admin (overview), prefix match for sub-routes
  const isActive =
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      }`}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </Link>
  )
}
