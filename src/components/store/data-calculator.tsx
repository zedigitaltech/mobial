"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import {
  Mail,
  Map,
  MessageCircle,
  Video,
  Tv,
  Globe,
  Camera,
  Phone,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Activity {
  id: string
  icon: React.ComponentType<{ className?: string }>
  dailyMB: number
}

const ACTIVITIES: Activity[] = [
  { id: "email", icon: Mail, dailyMB: 50 },
  { id: "maps", icon: Map, dailyMB: 80 },
  { id: "social", icon: Camera, dailyMB: 200 },
  { id: "browsing", icon: Globe, dailyMB: 150 },
  { id: "messaging_voice", icon: Phone, dailyMB: 300 },
  { id: "video_calls", icon: Video, dailyMB: 600 },
  { id: "streaming", icon: Tv, dailyMB: 1500 },
  { id: "social_heavy", icon: MessageCircle, dailyMB: 400 },
]

const ACTIVITY_KEYS: Record<string, { label: string; desc: string }> = {
  email: { label: "activityEmail", desc: "activityEmailDesc" },
  maps: { label: "activityMaps", desc: "activityMapsDesc" },
  social: { label: "activitySocial", desc: "activitySocialDesc" },
  browsing: { label: "activityBrowsing", desc: "activityBrowsingDesc" },
  messaging_voice: { label: "activityVoice", desc: "activityVoiceDesc" },
  video_calls: { label: "activityVideo", desc: "activityVideoDesc" },
  streaming: { label: "activityStreaming", desc: "activityStreamingDesc" },
  social_heavy: { label: "activitySocialHeavy", desc: "activitySocialHeavyDesc" },
}

const PROFILE_KEYS: Record<string, { label: string; desc: string }> = {
  light: { label: "profileLight", desc: "profileLightDesc" },
  moderate: { label: "profileModerate", desc: "profileModerateDesc" },
  heavy: { label: "profileHeavy", desc: "profileHeavyDesc" },
  streaming: { label: "profileStreaming", desc: "profileStreamingDesc" },
}

const USAGE_PROFILES = [
  {
    id: "light",
    activities: ["email", "maps", "browsing"],
    color: "bg-emerald-500",
  },
  {
    id: "moderate",
    activities: ["email", "maps", "social", "browsing", "messaging_voice"],
    color: "bg-blue-500",
  },
  {
    id: "heavy",
    activities: [
      "email",
      "maps",
      "social",
      "browsing",
      "messaging_voice",
      "social_heavy",
    ],
    color: "bg-amber-500",
  },
  {
    id: "streaming",
    activities: [
      "email",
      "maps",
      "social",
      "browsing",
      "messaging_voice",
      "video_calls",
      "streaming",
      "social_heavy",
    ],
    color: "bg-red-500",
  },
] as const

function formatDataAmount(mb: number): string {
  if (mb < 1000) return `${Math.round(mb)} MB`
  const gb = mb / 1000
  if (gb < 10) return `${gb.toFixed(1)} GB`
  return `${Math.round(gb)} GB`
}

function getRecommendedGB(totalMB: number): number {
  const gb = totalMB / 1000
  // Round up to nearest common plan size
  if (gb <= 1) return 1
  if (gb <= 2) return 2
  if (gb <= 3) return 3
  if (gb <= 5) return 5
  if (gb <= 7) return 7
  if (gb <= 10) return 10
  if (gb <= 15) return 15
  if (gb <= 20) return 20
  if (gb <= 30) return 30
  return 50
}

export function DataCalculator() {
  const t = useTranslations("dataCalculator")
  const [days, setDays] = useState(7)
  const [selectedProfile, setSelectedProfile] = useState<string>("moderate")
  const [customActivities, setCustomActivities] = useState<Set<string>>(
    new Set(["email", "maps", "social", "browsing", "messaging_voice"])
  )
  const [isCustom, setIsCustom] = useState(false)

  const activeActivities = useMemo(() => {
    if (isCustom) return customActivities
    const profile = USAGE_PROFILES.find((p) => p.id === selectedProfile)
    return new Set(profile?.activities ?? [])
  }, [isCustom, customActivities, selectedProfile])

  const { dailyMB, totalMB, recommendedGB } = useMemo(() => {
    const daily = ACTIVITIES.filter((a) => activeActivities.has(a.id)).reduce(
      (sum, a) => sum + a.dailyMB,
      0
    )
    const total = daily * days
    // Add 20% buffer for overhead and unexpected usage
    const buffered = total * 1.2
    return {
      dailyMB: daily,
      totalMB: buffered,
      recommendedGB: getRecommendedGB(buffered),
    }
  }, [activeActivities, days])

  function selectProfile(profileId: string) {
    setIsCustom(false)
    setSelectedProfile(profileId)
    const profile = USAGE_PROFILES.find((p) => p.id === profileId)
    if (profile) {
      setCustomActivities(new Set(profile.activities))
    }
  }

  function toggleActivity(activityId: string) {
    setIsCustom(true)
    setCustomActivities((prev) => {
      const next = new Set(prev)
      if (next.has(activityId)) {
        next.delete(activityId)
      } else {
        next.add(activityId)
      }
      return next
    })
  }

  return (
    <div className="space-y-8">
      {/* Trip Duration */}
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">{t("tripDuration")}</h3>
            <Badge variant="outline" className="text-lg font-bold px-4 py-1">
              {days} {days === 1 ? t("day") : t("days")}
            </Badge>
          </div>
          <Slider
            value={[days]}
            onValueChange={([v]) => setDays(v)}
            min={1}
            max={30}
            step={1}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t("day1")}</span>
            <span>{t("week1")}</span>
            <span>{t("weeks2")}</span>
            <span>{t("days30")}</span>
          </div>
        </CardContent>
      </Card>

      {/* Usage Profile */}
      <Card>
        <CardContent className="space-y-4">
          <h3 className="font-bold text-lg">{t("usageProfile")}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {USAGE_PROFILES.map((profile) => (
              <button
                key={profile.id}
                onClick={() => selectProfile(profile.id)}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all",
                  !isCustom && selectedProfile === profile.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/50 hover:border-border"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={cn("w-2.5 h-2.5 rounded-full", profile.color)} />
                  <span className="font-bold text-sm">{t(PROFILE_KEYS[profile.id].label)}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-tight">
                  {t(PROFILE_KEYS[profile.id].desc)}
                </p>
              </button>
            ))}
          </div>
          {isCustom && (
            <p className="text-xs text-muted-foreground">
              {t("customActive")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Activity Breakdown */}
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">{t("activities")}</h3>
            <span className="text-sm text-muted-foreground">
              {t("clickToToggle")}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ACTIVITIES.map((activity) => {
              const isActive = activeActivities.has(activity.id)
              const Icon = activity.icon
              const keys = ACTIVITY_KEYS[activity.id]
              return (
                <button
                  key={activity.id}
                  onClick={() => toggleActivity(activity.id)}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border transition-all text-left",
                    isActive
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/30 opacity-50 hover:opacity-75"
                  )}
                >
                  <div
                    className={cn(
                      "p-2 rounded-lg shrink-0",
                      isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm">{t(keys.label)}</div>
                    <div className="text-xs text-muted-foreground">
                      {t(keys.desc)}
                    </div>
                    <div className="text-xs font-medium mt-1">
                      ~{formatDataAmount(activity.dailyMB)}/{t("perDay")}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="space-y-6">
          <h3 className="font-bold text-lg">{t("yourRecommendation")}</h3>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-black">{formatDataAmount(dailyMB)}</div>
              <div className="text-xs text-muted-foreground">{t("perDay")}</div>
            </div>
            <div>
              <div className="text-2xl font-black">{formatDataAmount(totalMB)}</div>
              <div className="text-xs text-muted-foreground">
                {t("totalWithBuffer", { days })}
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-primary">
                {recommendedGB} GB
              </div>
              <div className="text-xs text-muted-foreground">{t("recommendedPlan")}</div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground">
            {t("bufferExplanation")}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg" className="flex-1 font-bold">
              <Link href={`/esim?minData=${recommendedGB}`}>
                {t("viewPlans", { gb: recommendedGB })}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="flex-1">
              <Link href="/esim">{t("browseAllPlans")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function DataCalculatorCompact() {
  const t = useTranslations("dataCalculator")
  const [days, setDays] = useState(5)
  const [profile, setProfile] = useState<"light" | "moderate" | "heavy" | "streaming">("moderate")

  const recommended = useMemo(() => {
    const profileData = USAGE_PROFILES.find((p) => p.id === profile)!
    const daily = ACTIVITIES.filter((a) => (profileData.activities as readonly string[]).includes(a.id)).reduce(
      (sum, a) => sum + a.dailyMB,
      0
    )
    return getRecommendedGB(daily * days * 1.2)
  }, [days, profile])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{t("tripDays", { days })}</span>
        <Badge variant="outline" className="font-bold">
          {t("gbRecommended", { gb: recommended })}
        </Badge>
      </div>
      <Slider
        value={[days]}
        onValueChange={([v]) => setDays(v)}
        min={1}
        max={30}
        step={1}
      />
      <div className="flex gap-2">
        {USAGE_PROFILES.map((p) => (
          <button
            key={p.id}
            onClick={() => setProfile(p.id as typeof profile)}
            className={cn(
              "flex-1 text-xs py-1.5 rounded-lg border transition-all font-medium",
              profile === p.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/50 text-muted-foreground hover:border-border"
            )}
          >
            {t(PROFILE_KEYS[p.id].label)}
          </button>
        ))}
      </div>
      <Button asChild size="sm" className="w-full font-semibold">
        <Link href="/data-calculator">{t("fullCalculator")}</Link>
      </Button>
    </div>
  )
}
