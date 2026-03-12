import type { Metadata, Viewport } from "next"
import { headers } from "next/headers"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { AuthProvider } from "@/components/providers/auth-provider"
import { ReactQueryProvider } from "@/components/providers/react-query-provider"
import { Toaster } from "@/components/ui/sonner"
import { CartProvider } from "@/contexts/cart-context"
import { CurrencyProvider } from "@/contexts/currency-context"
import { CompareProvider } from "@/contexts/compare-context"
import { CompareBar, CompareDrawer } from "@/components/store/compare-drawer"
import { ChatWidget } from "@/components/common/chat-widget"
import { NotificationPrompt } from "@/components/common/notification-prompt"
import { InstallPrompt } from "@/components/common/install-prompt"
import { MonitoringProvider } from "@/components/providers/monitoring-provider"
import dynamic from "next/dynamic"

const CookieConsent = dynamic(
  () => import("@/components/gdpr/cookie-consent").then((m) => m.CookieConsent),
  { ssr: false }
)

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
  maximumScale: 5,
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
    url: "https://mobialo.eu",
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
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192x192.png",
  },
  robots: {
    index: true,
    follow: true,
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()
  const nonce = (await headers()).get("x-nonce") ?? undefined

  return (
    <html lang={locale} suppressHydrationWarning className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ReactQueryProvider>
            <AuthProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem={false}
                disableTransitionOnChange
                nonce={nonce}
              >
                <CurrencyProvider>
                  <CartProvider>
                    <CompareProvider>
                      <MonitoringProvider>
                        {children}
                        <CompareBar />
                        <CompareDrawer />
                        <ChatWidget />
                        <NotificationPrompt />
                        <InstallPrompt />
                        <Toaster position="top-center" expand={true} richColors />
                        <CookieConsent />
                      </MonitoringProvider>
                    </CompareProvider>
                  </CartProvider>
                </CurrencyProvider>
              </ThemeProvider>
            </AuthProvider>
          </ReactQueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
