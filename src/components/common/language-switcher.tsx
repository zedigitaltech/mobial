"use client"

import { useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const languages = [
  { code: "en", label: "English", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "sq", label: "Shqip", flag: "\u{1F1E6}\u{1F1F1}" },
  { code: "bs", label: "Bosanski", flag: "\u{1F1E7}\u{1F1E6}" },
  { code: "bg", label: "\u0411\u044A\u043B\u0433\u0430\u0440\u0441\u043A\u0438", flag: "\u{1F1E7}\u{1F1EC}" },
  { code: "hr", label: "Hrvatski", flag: "\u{1F1ED}\u{1F1F7}" },
  { code: "nl", label: "Nederlands", flag: "\u{1F1F3}\u{1F1F1}" },
  { code: "fr", label: "Fran\u00E7ais", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "de", label: "Deutsch", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "el", label: "\u0395\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AC", flag: "\u{1F1EC}\u{1F1F7}" },
  { code: "it", label: "Italiano", flag: "\u{1F1EE}\u{1F1F9}" },
  { code: "pl", label: "Polski", flag: "\u{1F1F5}\u{1F1F1}" },
  { code: "pt", label: "Portugu\u00EAs", flag: "\u{1F1F5}\u{1F1F9}" },
  { code: "ro", label: "Rom\u00E2n\u0103", flag: "\u{1F1F7}\u{1F1F4}" },
  { code: "sr", label: "Srpski", flag: "\u{1F1F7}\u{1F1F8}" },
  { code: "es", label: "Espa\u00F1ol", flag: "\u{1F1EA}\u{1F1F8}" },
  { code: "sv", label: "Svenska", flag: "\u{1F1F8}\u{1F1EA}" },
  { code: "tr", label: "T\u00FCrk\u00E7e", flag: "\u{1F1F9}\u{1F1F7}" },
] as const

interface LanguageSwitcherProps {
  triggerClassName?: string
}

export function LanguageSwitcher({ triggerClassName }: LanguageSwitcherProps = {}) {
  const locale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const currentLanguage = languages.find((l) => l.code === locale) ?? languages[0]

  async function handleLocaleChange(newLocale: string) {
    try {
      const res = await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: newLocale }),
      })
      if (!res.ok) return
      startTransition(() => {
        router.refresh()
      })
    } catch {
      // Silently fail — locale unchanged
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={triggerClassName ?? "hidden sm:flex"}
          disabled={isPending}
        >
          <Globe className="h-5 w-5" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[320px] overflow-y-auto bg-background/80 backdrop-blur-xl border-white/10">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLocaleChange(lang.code)}
            className={locale === lang.code ? "bg-accent" : ""}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
