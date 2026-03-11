"use client"

import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useAuth } from "@/components/providers/auth-provider"
import {
  Sun,
  Moon,
  User,
  LogIn,
  UserPlus,
  LogOut,
  Settings,
  LayoutDashboard,
  Globe,
  Gift,
  HelpCircle,
  TrendingUp,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navigation = [
  { name: "Products", href: "/products", icon: Globe },
  { name: "Check Usage", href: "/check-usage", icon: TrendingUp },
  { name: "Top Up", href: "/topup", icon: Zap },
  { name: "Referrals", href: "/referrals", icon: Gift },
  { name: "How It Works", href: "/#how-it-works", icon: HelpCircle },
]

interface MobileNavProps {
  onClose?: () => void
}

export function MobileNav({ onClose }: MobileNavProps) {
  const { theme, setTheme } = useTheme()
  const { user, logout, openAuthModal } = useAuth()

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Image src="/logo.png" alt="MobiaL" width={120} height={40} className="h-10 w-auto" />
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col space-y-1">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            onClick={onClose}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>

      <Separator className="my-4" />

      {/* Theme Toggle */}
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-sm font-medium text-muted-foreground">Theme</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <>
              <Sun className="h-4 w-4 mr-2" />
              Light
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 mr-2" />
              Dark
            </>
          )}
        </Button>
      </div>

      <Separator className="my-4" />

      {/* Auth Section */}
      <div className="mt-auto space-y-3">
        {user ? (
          <>
            <div className="flex items-center space-x-3 px-3 py-2">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.avatar || undefined} alt={user.name || "User"} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user.name?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.name || "User"}</p>
                <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="flex flex-col space-y-1">
              <Link
                href="/dashboard"
                onClick={onClose}
                className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <LayoutDashboard className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/settings"
                onClick={onClose}
                className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Link>
              <button
                className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors w-full text-left"
                onClick={() => {
                  onClose?.()
                  logout()
                }}
              >
                <LogOut className="h-5 w-5" />
                <span>Log out</span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col space-y-2 px-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                onClose?.()
                openAuthModal("login")
              }}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Login
            </Button>
            <Button
              className="w-full justify-start gradient-accent text-accent-foreground"
              onClick={() => {
                onClose?.()
                openAuthModal("register")
              }}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Sign Up
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
