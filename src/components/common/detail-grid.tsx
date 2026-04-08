import type { ReactNode } from "react"

interface DetailItem {
  icon: ReactNode
  label: string
  value: string
}

interface DetailGridProps {
  items: DetailItem[]
}

export function DetailGrid({ items }: DetailGridProps) {
  return (
    <div className="rounded-xl border border-border bg-card px-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-3 py-3 border-b border-border last:border-0"
        >
          <div className="shrink-0">{item.icon}</div>
          <span className="text-sm text-muted-foreground flex-1">
            {item.label}
          </span>
          <span className="text-sm font-semibold text-foreground text-right">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  )
}
