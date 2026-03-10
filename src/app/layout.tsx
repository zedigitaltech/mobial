import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { AuthProvider } from "@/components/providers/auth-provider"
import { ReactQueryProvider } from "@/components/providers/react-query-provider"
import { Toaster } from "@/components/ui/sonner"
import { CartProvider } from "@/contexts/cart-context"
import { NotificationPrompt } from "@/components/common/notification-prompt"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
})

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: {
    default: "MobiaL | Global eSIM Connectivity",
    template: "%s | MobiaL"
  },
  description: "Instant high-speed data in 150+ countries. No roaming fees, no physical SIMs. The premium choice for digital nomads.",
  keywords: ["eSIM", "travel data", "roaming", "digital nomad", "mobile data", "international sim"],
  authors: [{ name: "MobiaL Team" }],
  creator: "MobiaL",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mobial.com",
    siteName: "MobiaL",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MobiaL Premium eSIM"
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MobiaL | Global eSIM Connectivity",
    description: "Connect instantly in 150+ countries.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ReactQueryProvider>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem={false}
              disableTransitionOnChange
            >
              <CartProvider>
                {children}
                <NotificationPrompt />
                <Toaster position="top-center" expand={true} richColors />
              </CartProvider>
            </ThemeProvider>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  )
}
