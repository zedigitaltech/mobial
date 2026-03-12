import { FaqSkeleton } from "@/components/common/skeletons"
import { Skeleton } from "@/components/ui/skeleton"

export default function FaqLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-20 space-y-10">
        <div className="text-center space-y-4">
          <Skeleton className="h-10 w-72 mx-auto" />
          <Skeleton className="h-5 w-96 mx-auto" />
        </div>
        <FaqSkeleton />
      </div>
    </div>
  )
}
