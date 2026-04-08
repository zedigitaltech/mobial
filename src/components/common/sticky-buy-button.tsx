"use client"

interface StickyBuyButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
  price?: string
}

export function StickyBuyButton({
  label,
  onClick,
  disabled = false,
  price,
}: StickyBuyButtonProps) {
  const buttonText = price ? `${label} \u2014 ${price}` : label

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border px-4 pt-3 pb-6">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="w-full bg-primary text-white rounded-xl py-4 text-base font-bold uppercase tracking-wider hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {buttonText}
      </button>
    </div>
  )
}
