import Image from "next/image"
import Link from "next/link"

interface CircularFlagBadgeProps {
  code: string
  name: string
  size?: number
  href?: string
}

export function CircularFlagBadge({
  code,
  name,
  size = 55,
  href,
}: CircularFlagBadgeProps) {
  const flagUrl = `https://flagcdn.com/w160/${code.toLowerCase()}.png`

  const content = (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative rounded-full overflow-hidden border border-border"
        style={{ width: size, height: size }}
      >
        <Image
          src={flagUrl}
          alt={name}
          fill
          className="object-cover"
          sizes={`${size}px`}
        />
      </div>
      <span className="text-[11px] text-center text-foreground max-w-[70px] truncate">
        {name}
      </span>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
