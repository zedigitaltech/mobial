interface DataCallsSmsRowProps {
  hasData: boolean
  hasCalls: boolean
  hasSms: boolean
}

function StatusIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold">
        &#x2713;
      </div>
    )
  }

  return (
    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/10 text-red-500 text-xs font-bold">
      &#x2717;
    </div>
  )
}

export function DataCallsSmsRow({
  hasData,
  hasCalls,
  hasSms,
}: DataCallsSmsRowProps) {
  const items = [
    { label: "Data", active: hasData },
    { label: "Calls", active: hasCalls },
    { label: "SMS", active: hasSms },
  ] as const

  return (
    <div className="flex items-center rounded-xl border border-border bg-card py-4">
      {items.map((item) => (
        <div key={item.label} className="flex-1 flex flex-col items-center gap-1.5">
          <StatusIcon active={item.active} />
          <span className="text-sm font-medium text-foreground">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}
