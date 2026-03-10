export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-muted border-t-primary animate-spin" />
      </div>
      <p className="mt-6 text-sm font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">
        Loading...
      </p>
    </div>
  )
}
