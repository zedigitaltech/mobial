import Image from "next/image"

interface ProviderHeaderProps {
  logo: string | null
  providerName: string
  planName: string
  logoSize?: number
}

export function ProviderHeader({
  logo,
  providerName,
  planName,
  logoSize = 40,
}: ProviderHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      {logo ? (
        <Image
          src={logo}
          alt={providerName}
          width={logoSize}
          height={logoSize}
          className="rounded-full object-cover"
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-full bg-muted text-muted-foreground font-bold uppercase"
          style={{ width: logoSize, height: logoSize }}
        >
          {providerName.charAt(0)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {providerName}
        </p>
        <p className="text-base font-bold text-foreground line-clamp-1">
          {planName}
        </p>
      </div>
    </div>
  )
}
