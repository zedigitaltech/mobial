"use client"

import { useState } from "react"
import { ExternalLink, Copy, Trash2, Share2, Check, Eye, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface LinkCardProps {
  id: string
  name: string | null
  code: string
  targetUrl: string
  clicks: number
  conversions: number
  conversionRate: number
  createdAt: Date
  onDelete?: (id: string) => void
  className?: string
}

export function LinkCard({
  id,
  name,
  code,
  targetUrl,
  clicks,
  conversions,
  conversionRate,
  createdAt,
  onDelete,
  className,
}: LinkCardProps) {
  const [copied, setCopied] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  // Generate the full tracking URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://mobial.com"
  const trackingUrl = `${baseUrl}/track/${code}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(trackingUrl)
      setCopied(true)
      toast({
        title: "Link copied!",
        description: "The affiliate link has been copied to your clipboard.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please try again or copy the link manually.",
        variant: "destructive",
      })
    }
  }

  const handleShare = async (platform: string) => {
    const text = name ? `Check out: ${name}` : "Check this out!"
    const encodedUrl = encodeURIComponent(trackingUrl)
    const encodedText = encodeURIComponent(text)

    let shareUrl = ""
    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`
        break
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        break
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        break
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`
        break
    }

    window.open(shareUrl, "_blank", "width=600,height=400")
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setIsDeleting(true)
    try {
      await onDelete(id)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className={cn("group relative", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">
              {name || "Unnamed Link"}
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <code className="bg-muted px-1.5 py-0.5 rounded font-mono">
                {code}
              </code>
              <span>•</span>
              <span>
                Created {new Date(createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="sr-only">Copy link</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Share2 className="h-4 w-4" />
                  <span className="sr-only">Share link</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleShare("twitter")}>
                  Twitter
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare("facebook")}>
                  Facebook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare("linkedin")}>
                  LinkedIn
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare("whatsapp")}>
                  WhatsApp
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete link</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Link</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this link? This action
                      cannot be undone and all tracking data will be lost.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tracking URL */}
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
          <code className="text-xs flex-1 truncate">{trackingUrl}</code>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 shrink-0"
            asChild
          >
            <a href={trackingUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3" />
              <span className="sr-only">Open link</span>
            </a>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Eye className="h-3 w-3" />
              <span className="text-xs">Clicks</span>
            </div>
            <p className="text-lg font-semibold">{clicks}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Target className="h-3 w-3" />
              <span className="text-xs">Conversions</span>
            </div>
            <p className="text-lg font-semibold">{conversions}</p>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">
              Conv. Rate
            </div>
            <Badge
              variant="outline"
              className={cn(
                "text-sm font-medium",
                conversionRate > 5
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                  : conversionRate > 2
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                  : ""
              )}
            >
              {conversionRate.toFixed(1)}%
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
