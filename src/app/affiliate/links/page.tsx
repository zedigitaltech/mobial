"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Plus, Link2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LinkCard } from "@/components/affiliate/link-card"
import { useAffiliateAuth } from "@/hooks/use-affiliate-auth"
import { useToast } from "@/hooks/use-toast"

interface AffiliateLink {
  id: string
  name: string | null
  code: string
  targetUrl: string
  clicks: number
  conversions: number
  conversionRate: number
  createdAt: Date
}

interface Product {
  id: string
  name: string
  slug: string
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function AffiliateLinksPage() {
  const [links, setLinks] = useState<AffiliateLink[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newLink, setNewLink] = useState({
    name: "",
    linkType: "home",
    productId: "",
    customUrl: "",
  })
  const { affiliate } = useAffiliateAuth()
  const { toast } = useToast()

  useEffect(() => {
    fetchLinks()
    fetchProducts()
  }, [])

  async function fetchLinks() {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const res = await fetch("/api/affiliate/links", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error("Failed to fetch links")

      const result = await res.json()
      if (result.success) {
        setLinks(
          result.data.map((link: AffiliateLink) => ({
            ...link,
            createdAt: new Date(link.createdAt),
          }))
        )
      }
    } catch (error) {
      console.error("Links fetch error:", error)
      toast({
        title: "Error",
        description: "Failed to load affiliate links",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchProducts() {
    try {
      const res = await fetch("/api/products?limit=100")
      if (res.ok) {
        const result = await res.json()
        if (result.success && result.data?.products) {
          setProducts(result.data.products)
        }
      }
    } catch (error) {
      console.error("Products fetch error:", error)
    }
  }

  async function handleCreateLink() {
    if (!newLink.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your link",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const body: {
        name: string
        productId?: string
        targetUrl?: string
      } = { name: newLink.name }

      if (newLink.linkType === "product" && newLink.productId) {
        body.productId = newLink.productId
      } else if (newLink.linkType === "custom" && newLink.customUrl) {
        body.targetUrl = newLink.customUrl
      }

      const res = await fetch("/api/affiliate/links", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to create link")
      }

      const result = await res.json()
      if (result.success) {
        setLinks((prev) => [
          {
            ...result.data,
            createdAt: new Date(result.data.createdAt),
          },
          ...prev,
        ])
        setIsDialogOpen(false)
        setNewLink({
          name: "",
          linkType: "home",
          productId: "",
          customUrl: "",
        })
        toast({
          title: "Success",
          description: "Affiliate link created successfully",
        })
      }
    } catch (error) {
      console.error("Create link error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create link",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  async function handleDeleteLink(linkId: string) {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const res = await fetch(`/api/affiliate/links/${linkId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        throw new Error("Failed to delete link")
      }

      setLinks((prev) => prev.filter((link) => link.id !== linkId))
      toast({
        title: "Success",
        description: "Affiliate link deleted successfully",
      })
    } catch (error) {
      console.error("Delete link error:", error)
      toast({
        title: "Error",
        description: "Failed to delete link",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={item}
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Affiliate Links</h1>
          <p className="text-muted-foreground">
            Create and manage your unique affiliate tracking links
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-accent">
              <Plus className="mr-2 h-4 w-4" />
              Create New Link
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Affiliate Link</DialogTitle>
              <DialogDescription>
                Generate a unique tracking link for your promotions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Link Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Summer Campaign 2024"
                  value={newLink.name}
                  onChange={(e) =>
                    setNewLink((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  A friendly name to help you identify this link
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkType">Link Type</Label>
                <Select
                  value={newLink.linkType}
                  onValueChange={(value) =>
                    setNewLink((prev) => ({ ...prev, linkType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Homepage</SelectItem>
                    <SelectItem value="product">Product Page</SelectItem>
                    <SelectItem value="custom">Custom URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newLink.linkType === "product" && (
                <div className="space-y-2">
                  <Label htmlFor="product">Select Product</Label>
                  <Select
                    value={newLink.productId}
                    onValueChange={(value) =>
                      setNewLink((prev) => ({ ...prev, productId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {newLink.linkType === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="customUrl">Custom URL</Label>
                  <Input
                    id="customUrl"
                    placeholder="https://mobial.com/some-page"
                    value={newLink.customUrl}
                    onChange={(e) =>
                      setNewLink((prev) => ({ ...prev, customUrl: e.target.value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the full URL you want to link to
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateLink} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Link2 className="mr-2 h-4 w-4" />
                    Create Link
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Your Code Display */}
      <motion.div variants={item}>
        <Card className="bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Your Affiliate Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <code className="text-2xl font-bold font-mono text-primary">
                {affiliate?.affiliateCode}
              </code>
              <p className="text-sm text-muted-foreground">
                Share this code or use your links below for tracking
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Links Grid */}
      {links.length === 0 ? (
        <motion.div variants={item}>
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Link2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No links yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first affiliate link to start tracking clicks and
                earning commissions
              </p>
              <Button onClick={() => setIsDialogOpen(true)} className="gradient-accent">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Link
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          variants={container}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {links.map((link) => (
            <motion.div key={link.id} variants={item}>
              <LinkCard
                {...link}
                onDelete={handleDeleteLink}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Stats Summary */}
      {links.length > 0 && (
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Links Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{links.length}</p>
                  <p className="text-sm text-muted-foreground">Total Links</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">
                    {links.reduce((sum, link) => sum + link.clicks, 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Clicks</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">
                    {links.reduce((sum, link) => sum + link.conversions, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Conversions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
