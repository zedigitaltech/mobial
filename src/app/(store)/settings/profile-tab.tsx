"use client"

import { getAccessToken } from "@/lib/auth-token"
import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import {
  User as UserIcon,
  Mail,
  Loader2,
  Pencil,
  X,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useAuth } from "@/components/providers/auth-provider"

export function ProfileTab() {
  const t = useTranslations("settings")
  const { user, refresh } = useAuth()

  const [editingProfile, setEditingProfile] = useState(false)
  const [editName, setEditName] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    if (user?.name) {
      setEditName(user.name)
    }
  }, [user?.name])

  const getToken = () => getAccessToken()

  const handleSaveProfile = async () => {
    if (!editName.trim() || editName.trim().length < 2) {
      toast.error(t("nameMinLength"))
      return
    }

    setSavingProfile(true)
    try {
      const res = await fetch("/api/user/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ name: editName.trim() }),
      })

      if (res.ok) {
        toast.success(t("profileUpdated"))
        setEditingProfile(false)
        await refresh()
      } else {
        const data = await res.json().catch(() => null)
        toast.error(data?.message || t("failedUpdateProfile"))
      }
    } catch {
      toast.error(t("somethingWentWrong"))
    } finally {
      setSavingProfile(false)
    }
  }

  if (!user) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-black flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" />
            {t("profileTitle")}
          </CardTitle>
          <CardDescription>{t("profileDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                {t("displayName")}
              </Label>
              {editingProfile ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-12 rounded-xl font-medium"
                  placeholder={t("enterName")}
                  autoFocus
                />
              ) : (
                <Input
                  value={user.name || ""}
                  readOnly
                  className="bg-muted/50 border-border/50 h-12 rounded-xl font-medium"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                {t("emailAddress")}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={user.email}
                  readOnly
                  className="bg-muted/50 border-border/50 h-12 rounded-xl font-medium pl-10"
                />
              </div>
            </div>
          </div>
          {editingProfile ? (
            <div className="flex gap-2">
              <Button
                className="rounded-xl font-bold"
                onClick={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("saving")}
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {t("save")}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="rounded-xl font-bold"
                onClick={() => {
                  setEditingProfile(false)
                  setEditName(user.name || "")
                }}
                disabled={savingProfile}
              >
                <X className="mr-2 h-4 w-4" />
                {t("cancel")}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="rounded-xl font-bold"
              onClick={() => setEditingProfile(true)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              {t("editProfile")}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
