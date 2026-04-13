import { Metadata } from "next"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://mobialo.eu"

export const metadata: Metadata = {
  title: "eSIM Plans - Browse 800+ Data Plans for 190+ Countries | Mobial",
  description:
    "Compare and buy instant eSIM data plans for travel. Plans starting from $1.99. 5G support, unlimited data, voice calls. No SIM swaps, no roaming fees.",
  alternates: {
    canonical: `${BASE_URL}/products`,
  },
  openGraph: {
    title: "eSIM Plans - Browse 800+ Data Plans for 190+ Countries | Mobial",
    description:
      "Compare and buy instant eSIM data plans for travel. Plans starting from $1.99. 5G support, unlimited data, voice calls. No SIM swaps, no roaming fees.",
    url: `${BASE_URL}/products`,
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "MobiaL eSIM Plans — 190+ Countries",
      },
    ],
  },
}

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children
}
