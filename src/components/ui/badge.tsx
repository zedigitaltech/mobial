import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-white",
        outline:
          "text-foreground",
        // Order status variants
        completed:
          "border-transparent bg-emerald-500/15 text-emerald-400 dark:bg-emerald-500/20 dark:text-emerald-300",
        processing:
          "border-transparent bg-amber-500/15 text-amber-500 dark:bg-amber-500/20 dark:text-amber-300",
        pending:
          "border-transparent bg-blue-500/15 text-blue-500 dark:bg-blue-500/20 dark:text-blue-300",
        failed:
          "border-transparent bg-red-500/15 text-red-500 dark:bg-red-500/20 dark:text-red-300",
        cancelled:
          "border-transparent bg-slate-500/15 text-slate-400 dark:bg-slate-500/20 dark:text-slate-400",
        refunded:
          "border-transparent bg-purple-500/15 text-purple-400 dark:bg-purple-500/20 dark:text-purple-300",
        brand:
          "border-transparent text-white",
        success:
          "border-transparent bg-emerald-500/15 text-emerald-400 dark:text-emerald-300",
        warning:
          "border-transparent bg-amber-500/15 text-amber-500 dark:text-amber-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants> & { style?: React.CSSProperties }) {
  const brandStyle = variant === "brand"
    ? { background: "var(--brand-gradient)", ...style }
    : style

  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      style={brandStyle}
      {...props}
    />
  )
}

export type OrderStatusBadgeVariant = "completed" | "processing" | "pending" | "failed" | "cancelled" | "refunded"

export function orderStatusVariant(status: string): OrderStatusBadgeVariant {
  const map: Record<string, OrderStatusBadgeVariant> = {
    COMPLETED: "completed",
    PROCESSING: "processing",
    PENDING: "pending",
    FAILED: "failed",
    CANCELLED: "cancelled",
    REFUNDED: "refunded",
  }
  return map[status] ?? "pending"
}

export { Badge, badgeVariants }
