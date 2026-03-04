"use client"

import { CommissionStatus } from "@prisma/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface Commission {
  id: string
  amount: number
  status: CommissionStatus
  createdAt: Date
  type: string
  order?: {
    orderNumber: string
    total: number
  } | null
}

interface CommissionsTableProps {
  commissions: Commission[]
  title?: string
  showOrderInfo?: boolean
  className?: string
  isLoading?: boolean
  emptyMessage?: string
}

const statusConfig: Record<CommissionStatus, { label: string; className: string }> = {
  PENDING: {
    label: "Pending",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  PAID: {
    label: "Paid",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  REFUNDED: {
    label: "Refunded",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  },
}

const typeConfig: Record<string, string> = {
  SALE: "Sale",
  REFERRAL: "Referral",
  BONUS: "Bonus",
}

export function CommissionsTable({
  commissions,
  title = "Recent Commissions",
  showOrderInfo = true,
  className,
  isLoading = false,
  emptyMessage = "No commissions yet",
}: CommissionsTableProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {commissions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {showOrderInfo && <TableHead>Order</TableHead>}
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((commission) => (
                  <TableRow key={commission.id}>
                    {showOrderInfo && (
                      <TableCell className="font-medium">
                        {commission.order?.orderNumber || "-"}
                      </TableCell>
                    )}
                    <TableCell>
                      {typeConfig[commission.type] || commission.type}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${commission.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-medium",
                          statusConfig[commission.status].className
                        )}
                      >
                        {statusConfig[commission.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDistanceToNow(new Date(commission.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
