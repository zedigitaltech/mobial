"use client"

import { getAccessToken } from "@/lib/auth-token"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import QRCode from "qrcode"
import {
  Lock,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  Check,
  Copy,
  Smartphone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { useAuth } from "@/components/providers/auth-provider"

type TwoFAStep = "idle" | "loading" | "qr" | "verifying" | "backup_codes"

export function SecurityTab() {
  const t = useTranslations("settings")
  const { user, refresh, logout } = useAuth()

  // Password change
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // Delete account
  const [deletePassword, setDeletePassword] = useState("")
  const [deletingAccount, setDeletingAccount] = useState(false)

  // 2FA setup
  const [twoFAStep, setTwoFAStep] = useState<TwoFAStep>("idle")
  const [twoFASecret, setTwoFASecret] = useState("")
  const [twoFAQrDataUrl, setTwoFAQrDataUrl] = useState("")
  const [totpCode, setTotpCode] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [disabling2FA, setDisabling2FA] = useState(false)
  const [disable2FAOpen, setDisable2FAOpen] = useState(false)
  const [disable2FAPassword, setDisable2FAPassword] = useState("")

  const getToken = () => getAccessToken()

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newPassword || !confirmPassword || !currentPassword) {
      toast.error(t("fillAllFields"))
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error(t("passwordsNoMatch"))
      return
    }

    if (newPassword.length < 8) {
      toast.error(t("passwordMinLength"))
      return
    }

    setChangingPassword(true)
    try {
      const res = await fetch("/api/auth/password/change", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (res.ok) {
        toast.success(t("passwordChanged"))
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        const data = await res.json().catch(() => null)
        toast.error(data?.message || t("failedChangePassword"))
      }
    } catch {
      toast.error(t("somethingWentWrongLater"))
    } finally {
      setChangingPassword(false)
    }
  }

  const handleEnable2FA = async () => {
    setTwoFAStep("loading")
    try {
      const res = await fetch("/api/auth/2fa/enable", {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data?.message || t("failedStart2FA"))
        setTwoFAStep("idle")
        return
      }

      const { secret, otpAuthUrl } = data.data
      setTwoFASecret(secret)

      const qrDataUrl = await QRCode.toDataURL(otpAuthUrl, {
        width: 200,
        margin: 2,
        color: { dark: "#ffffff", light: "#00000000" },
      })
      setTwoFAQrDataUrl(qrDataUrl)
      setTwoFAStep("qr")
    } catch {
      toast.error(t("failedStart2FA"))
      setTwoFAStep("idle")
    }
  }

  const handleVerify2FA = async () => {
    if (totpCode.length !== 6) {
      toast.error(t("enter6Digit"))
      return
    }

    setTwoFAStep("verifying")
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ totpCode }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data?.message || t("invalidVerificationCode"))
        setTwoFAStep("qr")
        return
      }

      setBackupCodes(data.data.backupCodes)
      setTwoFAStep("backup_codes")
      toast.success(t("twoFAEnabledToast"))
      await refresh()
    } catch {
      toast.error(t("verificationFailed"))
      setTwoFAStep("qr")
    }
  }

  const handleDisable2FA = async () => {
    if (!disable2FAPassword) {
      toast.error(t("fillAllFields"))
      return
    }
    setDisabling2FA(true)
    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ password: disable2FAPassword }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast.success(t("twoFADisabledToast"))
        setDisable2FAOpen(false)
        setDisable2FAPassword("")
        await refresh()
      } else {
        toast.error(data?.message || t("failedDisable2FA"))
      }
    } catch {
      toast.error(t("somethingWentWrong"))
    } finally {
      setDisabling2FA(false)
    }
  }

  const handleCancel2FA = () => {
    setTwoFAStep("idle")
    setTwoFASecret("")
    setTwoFAQrDataUrl("")
    setTotpCode("")
    setBackupCodes([])
  }

  const handleCopyBackupCodes = async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join("\n"))
      toast.success(t("backupCodesCopied"))
    } catch {
      toast.error("Failed to copy")
    }
  }

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error(t("fillAllFields"))
      return
    }
    setDeletingAccount(true)
    try {
      const res = await fetch("/api/user/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ password: deletePassword }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok) {
        toast.success(t("accountDeletionRequested"))
        await logout()
      } else {
        toast.error(data?.error || t("somethingWentWrong"))
      }
    } catch {
      toast.error(t("somethingWentWrong"))
    } finally {
      setDeletingAccount(false)
      setDeletePassword("")
    }
  }

  if (!user) return null

  return (
    <div className="space-y-8">
      {/* Security Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              {t("securityTitle")}
            </CardTitle>
            <CardDescription>{t("securityDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Change Password */}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <h3 className="font-bold text-sm">{t("changePassword")}</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground">
                    {t("currentPassword")}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={t("enterCurrentPassword")}
                      className="h-12 rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground">
                    {t("newPassword")}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t("enterNewPassword")}
                      className="h-12 rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground">
                    {t("confirmNewPassword")}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t("confirmNewPasswordPlaceholder")}
                      className="h-12 rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <Button
                type="submit"
                className="rounded-xl font-bold"
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("changing")}
                  </>
                ) : (
                  t("changePassword")
                )}
              </Button>
            </form>

            <Separator />

            {/* Two-Factor Authentication */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm">{t("twoFactorAuth")}</h3>
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-3">
                  <ShieldCheck className={`h-5 w-5 ${user.twoFactorEnabled ? "text-emerald-500" : "text-muted-foreground"}`} />
                  <div>
                    <p className="font-bold text-sm">{t("twoFAStatus")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("twoFADesc")}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={user.twoFactorEnabled ? "default" : "outline"}
                  className={`rounded-full font-bold ${user.twoFactorEnabled ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : ""}`}
                >
                  {user.twoFactorEnabled ? t("enabled") : t("notEnabled")}
                </Badge>
              </div>

              {twoFAStep === "idle" && !user.twoFactorEnabled && (
                <Button
                  variant="outline"
                  className="rounded-xl font-bold"
                  onClick={handleEnable2FA}
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  {t("enable2FA")}
                </Button>
              )}

              {twoFAStep === "loading" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("settingUp2FA")}
                </div>
              )}

              {twoFAStep === "qr" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 p-4 rounded-xl border border-border/50 bg-muted/20"
                >
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      {t("step1ScanQr")}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {t("step1Desc")}
                    </p>
                  </div>

                  <div className="flex justify-center py-4">
                    {twoFAQrDataUrl && (
                      <img
                        src={twoFAQrDataUrl}
                        alt="2FA QR Code"
                        className="w-[200px] h-[200px] rounded-lg bg-white p-2"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {t("enterManually")}
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 rounded-lg bg-muted text-xs font-mono break-all">
                        {twoFASecret}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(twoFASecret).then(() => {
                            toast.success(t("secretCopied"))
                          }).catch(() => {
                            toast.error("Failed to copy")
                          })
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-bold text-sm">{t("step2Verify")}</h4>
                    <p className="text-xs text-muted-foreground">
                      {t("step2Desc")}
                    </p>
                    <div className="flex gap-2">
                      <Input
                        value={totpCode}
                        onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                        className="h-12 rounded-xl font-mono text-center text-lg tracking-[0.5em] max-w-[200px]"
                        maxLength={6}
                      />
                      <Button
                        className="rounded-xl font-bold"
                        onClick={handleVerify2FA}
                        disabled={totpCode.length !== 6}
                      >
                        {t("verify")}
                      </Button>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl"
                    onClick={handleCancel2FA}
                  >
                    {t("cancelSetup")}
                  </Button>
                </motion.div>
              )}

              {twoFAStep === "verifying" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 rounded-xl border border-border/50">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("verifyingCode")}
                </div>
              )}

              {twoFAStep === "backup_codes" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5"
                >
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm flex items-center gap-2 text-emerald-500">
                      <Check className="h-4 w-4" />
                      {t("twoFAEnabled")}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {t("backupCodesDesc")}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map((code, i) => (
                      <code
                        key={i}
                        className="p-2 rounded-lg bg-muted text-xs font-mono text-center"
                      >
                        {code}
                      </code>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl font-bold"
                      onClick={handleCopyBackupCodes}
                    >
                      <Copy className="mr-2 h-3 w-3" />
                      {t("copyAllCodes")}
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-xl font-bold"
                      onClick={handleCancel2FA}
                    >
                      {t("done")}
                    </Button>
                  </div>
                </motion.div>
              )}

              {user.twoFactorEnabled && twoFAStep === "idle" && (
                <AlertDialog open={disable2FAOpen} onOpenChange={setDisable2FAOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="rounded-xl font-bold text-red-500 hover:text-red-600 hover:border-red-500/50"
                    >
                      {t("disable2FA")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("disable2FA")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("enterPasswordToDisable")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="px-1 py-2">
                      <Label htmlFor="disable-2fa-password" className="text-sm font-medium">
                        {t("currentPassword")}
                      </Label>
                      <Input
                        id="disable-2fa-password"
                        type="password"
                        className="mt-1.5 rounded-xl"
                        value={disable2FAPassword}
                        onChange={(e) => setDisable2FAPassword(e.target.value)}
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        className="rounded-xl font-bold"
                        onClick={() => setDisable2FAPassword("")}
                      >
                        {t("cancel")}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDisable2FA}
                        disabled={disabling2FA}
                        className="rounded-xl font-bold bg-red-500 hover:bg-red-600"
                      >
                        {disabling2FA ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          t("disable2FA")
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-red-500/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-black flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              {t("dangerZone")}
            </CardTitle>
            <CardDescription>
              {t("dangerDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 space-y-4">
              <div>
                <p className="font-bold text-sm">{t("deleteAccount")}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("deleteAccountDesc")}
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="rounded-xl font-bold">
                    {t("deleteAccount")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-black">
                      {t("deleteConfirmTitle")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("deleteConfirmDesc")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="px-1 py-2">
                    <Label htmlFor="delete-password" className="text-sm font-medium">
                      {t("currentPassword")}
                    </Label>
                    <Input
                      id="delete-password"
                      type="password"
                      className="mt-1.5 rounded-xl"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      className="rounded-xl font-bold"
                      onClick={() => setDeletePassword("")}
                    >
                      {t("cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={deletingAccount}
                      className="rounded-xl font-bold bg-red-500 hover:bg-red-600"
                    >
                      {deletingAccount ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        t("yesDelete")
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
