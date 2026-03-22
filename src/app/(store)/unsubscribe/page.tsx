"use client"

import { useTranslations } from "next-intl"
import { Mail, Settings, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { useAuth } from "@/components/providers/auth-provider"

export default function UnsubscribePage() {
  const t = useTranslations("unsubscribe")
  const { user } = useAuth()

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-lg mx-auto">
        <Card>
          <CardContent className="pt-8 text-center space-y-6">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">{t("title")}</h1>
              <p className="text-muted-foreground">
                {t("description")}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              {user && (
                <Link href="/settings">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Settings className="h-4 w-4 mr-2" />
                    {t("manageSettings")}
                  </Button>
                </Link>
              )}
              <Link href="/">
                <Button variant="ghost" className="w-full sm:w-auto">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t("backToHome")}
                </Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              {t("contactNote")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
