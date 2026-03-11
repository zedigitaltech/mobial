import { Header } from "@/components/layout/header"

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero skeleton */}
        <section className="relative pt-20 pb-32">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="h-6 w-48 rounded-full bg-muted animate-pulse mx-auto" />
              <div className="space-y-4">
                <div className="h-14 w-3/4 rounded-lg bg-muted animate-pulse mx-auto" />
                <div className="h-14 w-1/2 rounded-lg bg-muted animate-pulse mx-auto" />
              </div>
              <div className="h-5 w-2/3 rounded bg-muted animate-pulse mx-auto" />
              <div className="h-14 w-full max-w-lg rounded-xl bg-muted animate-pulse mx-auto" />
            </div>
          </div>
        </section>

        {/* Quick actions skeleton */}
        <section className="py-8 -mt-16 relative z-10">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-5 rounded-2xl bg-card border border-border/50 text-center">
                  <div className="h-7 w-7 rounded bg-muted animate-pulse mx-auto mb-2" />
                  <div className="h-4 w-20 rounded bg-muted animate-pulse mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Products skeleton */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="h-8 w-48 rounded bg-muted animate-pulse mb-8" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border/50 p-5 space-y-4">
                  <div className="flex justify-between">
                    <div className="h-5 w-16 rounded bg-muted animate-pulse" />
                    <div className="h-5 w-12 rounded bg-muted animate-pulse" />
                  </div>
                  <div className="h-4 w-full rounded bg-muted animate-pulse" />
                  <div className="h-7 w-16 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
