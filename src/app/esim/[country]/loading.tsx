import { ProductGridSkeleton } from "@/components/common/skeletons"
import { Skeleton } from "@/components/ui/skeleton"

export default function CountryLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-20 space-y-10">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-10 w-56 mx-auto" />
          <Skeleton className="h-5 w-80 mx-auto" />
        </div>
        <ProductGridSkeleton count={6} />
      </div>
    </div>
  )
}
