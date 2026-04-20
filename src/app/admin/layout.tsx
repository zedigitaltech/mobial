import type { ReactNode } from "react"
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Settings,
  BarChart3,
  Zap,
} from "lucide-react"
import { AdminNavLink } from "./admin-nav-link"

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/affiliates", label: "Affiliates", icon: Users },
  { href: "/admin/monitoring", label: "Monitoring", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar — desktop only */}
      <aside aria-label="Admin navigation" className="hidden md:flex w-56 flex-col border-r border-border bg-card shrink-0">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--brand-gradient)" }}
          >
            <Zap className="size-4 text-white" />
          </div>
          <span className="font-bold text-sm">Admin</span>
        </div>

        <nav aria-label="Admin sidebar" className="flex-1 p-3 space-y-1">
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
