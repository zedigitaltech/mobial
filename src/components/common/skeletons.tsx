import { Skeleton } from "@/components/ui/skeleton"

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function CountryCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-4">
      <Skeleton className="h-12 w-12 rounded-full shrink-0" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}

export function CountryGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CountryCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/50 bg-card p-5 space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      {/* Table skeleton */}
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <Skeleton className="h-5 w-32" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-border/30 last:border-0">
            <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function FaqSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border/50 bg-card p-5">
          <Skeleton className="h-5 w-3/4" />
        </div>
      ))}
    </div>
  )
}
