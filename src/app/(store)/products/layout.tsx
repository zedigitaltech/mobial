import { Metadata } from "next"

export const metadata: Metadata = {
  title: "eSIM Plans - Browse 800+ Data Plans for 150+ Countries | Mobial",
  description:
    "Compare and buy instant eSIM data plans for travel. Plans starting from $1.99. 5G support, unlimited data, voice calls. No SIM swaps, no roaming fees.",
  openGraph: {
    title: "eSIM Plans - Browse 800+ Data Plans for 150+ Countries | Mobial",
    description:
      "Compare and buy instant eSIM data plans for travel. Plans starting from $1.99. 5G support, unlimited data, voice calls. No SIM swaps, no roaming fees.",
  },
}

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children
}
