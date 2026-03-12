"use client"

import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useTranslations } from "next-intl"
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
import { LanguageSwitcher } from "@/components/common/language-switcher"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface MobileNavProps {
  onClose?: () => void
}

export function MobileNav({ onClose }: MobileNavProps) {
  const { theme, setTheme } = useTheme()
  const { user, logout, openAuthModal } = useAuth()
  const t = useTranslations('common')

  const navigation = [
    { name: t('products'), href: "/products", icon: Globe },
    { name: t('checkUsage'), href: "/check-usage", icon: TrendingUp },
    { name: t('topUp'), href: "/topup", icon: Zap },
    { name: t('referrals'), href: "/referrals", icon: Gift },
    { name: t('howItWorks'), href: "/#how-it-works", icon: HelpCircle },
  ]

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
            key={item.href}
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
        <span className="text-sm font-medium text-muted-foreground">{t('theme')}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <>
              <Sun className="h-4 w-4 mr-2" />
              {t('light')}
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 mr-2" />
              {t('dark')}
            </>
          )}
        </Button>
      </div>

      {/* Language Switcher */}
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-sm font-medium text-muted-foreground">{t('language')}</span>
        <LanguageSwitcher triggerClassName="flex" />
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
                <span>{t('dashboard')}</span>
              </Link>
              <Link
                href="/settings"
                onClick={onClose}
                className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Settings className="h-5 w-5" />
                <span>{t('settings')}</span>
              </Link>
              <button
                className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors w-full text-left"
                onClick={() => {
                  onClose?.()
                  logout()
                }}
              >
                <LogOut className="h-5 w-5" />
                <span>{t('logout')}</span>
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
              {t('login')}
            </Button>
            <Button
              className="w-full justify-start gradient-accent text-accent-foreground"
              onClick={() => {
                onClose?.()
                openAuthModal("register")
              }}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {t('signUp')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
