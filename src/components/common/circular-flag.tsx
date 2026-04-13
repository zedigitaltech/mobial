"use client"

import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface CircularFlagProps {
  code: string
  name: string
  href: string
  size?: number
  className?: string
}

function flagUrl(code: string): string {
  return `https://flagcdn.com/w160/${code.toLowerCase()}.png`
}

export function CircularFlag({
  code,
  name,
  href,
  size = 56,
  className,
}: CircularFlagProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center gap-1.5 group shrink-0",
        className,
      )}
    >
      <div
        className="rounded-full overflow-hidden border border-border/50 group-hover:border-primary/50 transition-colors"
        style={{ width: size, height: size }}
      >
        <Image
          src={flagUrl(code)}
          alt={name}
          width={size}
          height={size}
          className="w-full h-full object-cover"
          unoptimized
        />
      </div>
      <span className="text-[11px] font-medium text-foreground/80 group-hover:text-primary transition-colors text-center max-w-[70px] leading-tight truncate">
        {name}
      </span>
    </Link>
  )
}
