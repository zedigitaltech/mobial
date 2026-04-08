interface ThreeColumnStatsProps {
  days: string
  data: string
  price: string
}

export function ThreeColumnStats({ days, data, price }: ThreeColumnStatsProps) {
  return (
    <div className="flex items-center rounded-xl border border-border bg-card py-3">
      <div className="flex-1 flex flex-col items-center">
        <span className="text-base font-bold text-foreground">{days}</span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Days
        </span>
      </div>
      <div className="flex-1 flex flex-col items-center border-l border-r border-border">
        <span className="text-base font-bold text-foreground">{data}</span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Data
        </span>
      </div>
      <div className="flex-1 flex flex-col items-center">
        <span className="text-base font-bold text-price-green">
          {price}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Price
        </span>
      </div>
    </div>
  )
}
