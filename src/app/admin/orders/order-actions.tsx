"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface OrderActionsProps {
  orderId: string
  orderNumber: string
  status: string
  paymentStatus: string
  onActionComplete: () => void
}

export function OrderActions({
  orderId,
  orderNumber,
  status,
  paymentStatus,
  onActionComplete,
}: OrderActionsProps) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleAction(action: "retry" | "refund" | "resend") {
    setLoading(action)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || `${action} failed`)
      } else {
        toast.success(data.message || `${action} successful`)
        onActionComplete()
      }
    } catch {
      toast.error(`Network error during ${action}`)
    } finally {
      setLoading(null)
    }
  }

  const canRetry = status === "FAILED" || status === "PROCESSING"
  const canRefund = paymentStatus === "PAID" && status !== "REFUNDED"
  const canResend = status === "COMPLETED"

  if (!canRetry && !canRefund && !canResend) return null

  return (
    <div className="flex gap-1.5 flex-wrap">
      {canRetry && (
        <Button
          size="sm"
          variant="outline"
          disabled={loading === "retry"}
          onClick={() => handleAction("retry")}
          className="text-xs h-7 px-2.5"
        >
          {loading === "retry" ? "Retrying…" : "Retry"}
        </Button>
      )}
      {canRefund && (
        <Button
          size="sm"
          variant="destructive"
          disabled={loading === "refund"}
          onClick={() => handleAction("refund")}
          className="text-xs h-7 px-2.5"
        >
          {loading === "refund" ? "Refunding…" : "Refund"}
        </Button>
      )}
      {canResend && (
        <Button
          size="sm"
          variant="ghost"
          disabled={loading === "resend"}
          onClick={() => handleAction("resend")}
          className="text-xs h-7 px-2.5"
        >
          {loading === "resend" ? "Sending…" : "Resend email"}
        </Button>
      )}
    </div>
  )
}
