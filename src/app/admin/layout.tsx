"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Settings,
  BarChart3,
  Zap,
} from "lucide-react"

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/affiliates", label: "Affiliates", icon: Users },
  { href: "/admin/monitoring", label: "Monitoring", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

function AdminNavLink({
  href,
  label,
  icon: Icon,
}: {
  href: string
  label: string
  icon: React.ElementType
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex w-56 flex-col border-r border-border bg-card shrink-0">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--brand-gradient)" }}
          >
            <Zap className="size-4 text-white" />
          </div>
          <span className="font-bold text-sm">Admin</span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon }) => (
            <AdminNavLink key={href} href={href} label={label} icon={icon} />
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
