"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Clock, ArrowRight, BookOpen } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { blogPosts, BLOG_CATEGORIES, formatDate } from "@/lib/blog"
import type { BlogCategory } from "@/lib/blog"

const CATEGORY_COLORS: Record<string, string> = {
  Travel: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Guides: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Tips: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  General: "bg-purple-500/10 text-purple-400 border-purple-500/20",
}

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState<BlogCategory>("All")

  const filteredPosts =
    activeCategory === "All"
      ? blogPosts
      : blogPosts.filter((p) => p.category === activeCategory)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <section className="relative pt-20 pb-16 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] opacity-[0.03]" />
          </div>

          <div className="container mx-auto px-4 text-center space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                <BookOpen className="h-3 w-3" />
                MobiaL Blog
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight">
                Travel Smarter with{" "}
                <span className="text-primary italic">eSIM</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Guides, tips, and insights to keep you connected wherever your
                travels take you.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="pb-24">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              {BLOG_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "bg-card border border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post, i) => (
                <motion.div
                  key={post.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link href={`/blog/${post.slug}`} className="block group h-full">
                    <Card className="h-full flex flex-col overflow-hidden border-white/5 bg-white/[0.03] backdrop-blur-2xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] hover:-translate-y-1 transition-all duration-500">
                      <CardContent className="p-6 flex flex-col flex-1 gap-4">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-black uppercase tracking-widest rounded-full px-3 py-1 ${
                              CATEGORY_COLORS[post.category] || ""
                            }`}
                          >
                            {post.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.readTime}
                          </span>
                        </div>

                        <h2 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h2>

                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                          {post.excerpt}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(post.publishedAt)}
                          </span>
                          <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                            Read more <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>

            {filteredPosts.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-lg">No posts in this category yet.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
