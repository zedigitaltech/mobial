import { Metadata } from "next"
import { notFound } from "next/navigation"
import { ArrowLeft, Clock, User, Calendar, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { blogPosts, getBlogPost, getRelatedPosts, formatDate } from "@/lib/blog"
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/common/json-ld"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://mobialo.eu"

const CATEGORY_COLORS: Record<string, string> = {
  Travel: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Guides: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Tips: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  General: "bg-purple-500/10 text-purple-400 border-purple-500/20",
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) return { title: "Post Not Found" }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  }
}

function BlogContent({ html }: { html: string }) {
  // Content is static data defined in our codebase (src/lib/blog.ts),
  // not user-generated input. Safe to render as HTML.
  return (
    <div
      className="prose prose-invert prose-lg max-w-none
        prose-headings:font-black prose-headings:tracking-tight
        prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
        prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
        prose-p:text-muted-foreground prose-p:leading-relaxed
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-strong:text-foreground prose-strong:font-bold
        prose-ul:text-muted-foreground prose-ol:text-muted-foreground
        prose-li:marker:text-primary/60"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = getBlogPost(slug)

  if (!post) notFound()

  const relatedPosts = getRelatedPosts(slug)

  return (
    <>
      <ArticleJsonLd
        title={post.title}
        description={post.excerpt}
        author={post.author}
        publishedAt={post.publishedAt}
        url={`${BASE_URL}/blog/${post.slug}`}
        baseUrl={BASE_URL}
      />
      <BreadcrumbJsonLd
        baseUrl={BASE_URL}
        items={[
          { name: "Home", url: "/" },
          { name: "Blog", url: "/blog" },
          { name: post.title },
        ]}
      />

        <article className="pt-16 pb-24">
          <div className="container mx-auto px-4 max-w-3xl">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>

            <header className="space-y-6 mb-12">
              <Badge
                variant="outline"
                className={`text-[10px] font-black uppercase tracking-widest rounded-full px-3 py-1 ${
                  CATEGORY_COLORS[post.category] || ""
                }`}
              >
                {post.category}
              </Badge>

              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                {post.title}
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed">
                {post.excerpt}
              </p>

              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground border-y border-white/5 py-4">
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {post.author}
                </span>
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(post.publishedAt)}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {post.readTime}
                </span>
              </div>
            </header>

            <BlogContent html={post.content} />
          </div>
        </article>

        {relatedPosts.length > 0 && (
          <section className="pb-24 border-t border-white/5">
            <div className="container mx-auto px-4 max-w-5xl pt-16">
              <h2 className="text-2xl font-black tracking-tight mb-8">
                Related Articles
              </h2>

              <div className="grid md:grid-cols-3 gap-6">
                {relatedPosts.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/blog/${related.slug}`}
                    className="block group"
                  >
                    <Card className="h-full overflow-hidden border-white/5 bg-white/[0.03] backdrop-blur-2xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] hover:-translate-y-1 transition-all duration-500">
                      <CardContent className="p-5 space-y-3">
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-black uppercase tracking-widest rounded-full px-2 py-0.5 ${
                            CATEGORY_COLORS[related.category] || ""
                          }`}
                        >
                          {related.category}
                        </Badge>
                        <h3 className="font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                          {related.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {related.excerpt}
                        </p>
                        <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                          Read more <ArrowRight className="h-3 w-3" />
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
    </>
  )
}
