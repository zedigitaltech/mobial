"use client"

import Image from "next/image"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ActivationGuide } from "./activation-guide"

interface EsimCardProps {
  orderNumber: string
  status: string
  lpaString?: string | null
  activationCode?: string | null
  smdpAddress?: string | null
  productName?: string
}

export function EsimCard({
  orderNumber,
  status,
  lpaString,
  activationCode,
  smdpAddress,
  productName,
}: EsimCardProps) {
  const isProcessing = status === "PROCESSING" || status === "PENDING"
  const isReady = status === "COMPLETED" && !!lpaString

  const qrUrl = lpaString
    ? `/api/qr?data=${encodeURIComponent(lpaString)}`
    : null

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="p-6 border-b border-border">
        <h2 className="font-semibold text-lg">Your eSIM</h2>
        {productName && (
          <p className="text-sm text-muted-foreground mt-0.5">{productName}</p>
        )}
      </div>

      <div className="p-6 flex flex-col md:flex-row gap-8">
        {/* QR Code */}
        <div className="flex flex-col items-center gap-4">
          {isReady && qrUrl ? (
            <>
              <div className="p-4 bg-white rounded-2xl shadow-sm">
                <Image
                  src={qrUrl}
                  alt="eSIM QR Code"
                  width={200}
                  height={200}
                  unoptimized
                />
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={qrUrl} download={`mobialo-${orderNumber}.png`}>
                  <Download className="size-4 mr-2" />
                  Download QR
                </a>
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="w-[200px] h-[200px] rounded-2xl" />
              <p className="text-sm text-muted-foreground text-center max-w-[180px]">
                {isProcessing
                  ? "Activating your eSIM… usually takes under 60 seconds."
                  : "QR code unavailable"}
              </p>
            </div>
          )}
        </div>

        {/* Activation guide */}
        <div className="flex-1">
          {isReady ? (
            <ActivationGuide
              activationCode={activationCode}
              smdpAddress={smdpAddress}
            />
          ) : (
            <div className="space-y-3">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
