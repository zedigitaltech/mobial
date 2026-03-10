"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { ErrorBoundary } from "@/components/common/error-boundary"
import {
  LayoutDashboard,
  Users,
  Package,
  Settings,
  Shield,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { useAuth } from "@/components/providers/auth-provider"

interface AdminUser {
  id: string
  name: string | null
  email: string
  role: string
}

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/affiliates", label: "Affiliates", icon: Users },
  { href: "/admin/orders", label: "Orders", icon: Package },
  { href: "/admin/monitoring", label: "Monitoring", icon: Activity },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

function NavItem({ href, label, IconComponent, active }: { href: string; label: string; IconComponent: React.ElementType; active: boolean }) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ x: 4 }}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
          active
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <IconComponent className="h-5 w-5" />
        <span className="font-medium">{label}</span>
        {active && <ChevronRight className="h-4 w-4 ml-auto" />}
      </motion.div>
    </Link>
  )
}

function SidebarContent({ activePath, onClose }: { activePath: string; onClose?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6">
        <Link href="/admin" className="flex items-center gap-2" onClick={onClose}>
          <img src="/logo.png" alt="MobiaL" className="h-10 w-auto" />
        </Link>
      </div>

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <div key={item.href} onClick={onClose}>
              <NavItem
                href={item.href}
                label={item.label}
                IconComponent={item.icon}
                active={activePath === item.href}
              />
            </div>
          ))}
        </nav>
      </ScrollArea>

      <Separator />

      {/* Back to Site */}
      <div className="p-4">
        <Link href="/" onClick={onClose}>
          <Button variant="outline" className="w-full justify-start">
            <LogOut className="h-4 w-4 mr-2" />
            Back to Website
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading, isAdmin, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user || !isAdmin) {
    router.push("/")
    return null
  }

  return (
    <ErrorBoundary fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-muted-foreground mb-4">Please refresh the page and try again</p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      </div>
    }>
      <div className="min-h-screen bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card hidden lg:block">
        <SidebarContent activePath={pathname} />
      </aside>

      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-30 h-16 border-b bg-card lg:hidden flex items-center justify-between px-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent activePath={pathname} onClose={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold">Admin</span>
        </div>

        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {user.name?.[0] || user.email[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </header>

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-0">
        {/* Top Bar */}
        <div className="sticky top-0 z-20 h-16 border-b bg-card/80 backdrop-blur-sm hidden lg:flex items-center justify-between px-6">
          <div>
            <h1 className="font-semibold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage your affiliate platform</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user.name || "Admin"}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user.name?.[0] || user.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
    </ErrorBoundary>
  )
}
