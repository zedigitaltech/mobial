"use client"

import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import { User as UserIcon, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/providers/auth-provider"
import { ProfileTab } from "./profile-tab"
import { SecurityTab } from "./security-tab"
import { NotificationsTab } from "./notifications-tab"
import Link from "next/link"

export default function SettingsPage() {
  const t = useTranslations("settings")
  const { user, isLoading: authLoading, openAuthModal } = useAuth()

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 max-w-md mx-auto px-4"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto">
            <UserIcon className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">{t("signInToContinue")}</h1>
          <p className="text-muted-foreground font-medium">
            {t("signInDesc")}
          </p>
          <Button
            size="lg"
            className="rounded-2xl px-10 h-14 font-black"
            onClick={() => openAuthModal("login")}
          >
            {t("signIn")}
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="pb-20">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="pt-16 pb-10"
        >
          <Button variant="ghost" className="mb-6 rounded-xl font-bold -ml-2" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("backToDashboard")}
            </Link>
          </Button>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground font-medium mt-2">
            {t("subtitle")}
          </p>
        </motion.section>

        <Tabs defaultValue="profile" className="mt-2">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>
          <TabsContent value="security">
            <SecurityTab />
          </TabsContent>
          <TabsContent value="notifications">
            <NotificationsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
