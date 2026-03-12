import { CountryGridSkeleton } from "@/components/common/skeletons"
import { Skeleton } from "@/components/ui/skeleton"

export default function EsimLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-20 space-y-10">
        <div className="text-center space-y-4">
          <Skeleton className="h-10 w-64 mx-auto" />
          <Skeleton className="h-5 w-96 mx-auto" />
        </div>
        <CountryGridSkeleton count={12} />
      </div>
    </div>
  )
}
