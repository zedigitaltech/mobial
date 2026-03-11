import Link from "next/link"
import Image from "next/image"
import {
  Globe,
  Mail,
  Shield,
  Lock,
  Twitter,
  Facebook
} from "lucide-react"
import { Separator } from "@/components/ui/separator"

const footerLinks = {
  product: [
    { name: "eSIM Products", href: "/products" },
    { name: "Check Usage", href: "/check-usage" },
    { name: "Top Up eSIM", href: "/topup" },
    { name: "Compatible Devices", href: "/compatible-devices" },
  ],
  support: [
    { name: "FAQ", href: "/faq" },
    { name: "Troubleshooting", href: "/troubleshooting" },
    { name: "Contact", href: "/contact" },
    { name: "Installation Guide", href: "/guides/installation" },
  ],
  company: [
    { name: "About Us", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Referral Program", href: "/referrals" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Refund Policy", href: "/refund-policy" },
    { name: "Cookie Policy", href: "/cookies" },
  ],
}

const socialLinks = [
  { name: "Twitter", icon: Twitter, href: "https://x.com/mobial_esim" },
  { name: "Facebook", icon: Facebook, href: "https://facebook.com/mobial" },
]

export function Footer() {
  return (
    <footer className="bg-muted/30 border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Image src="/logo.png" alt="MobiaL" width={120} height={40} className="h-10 w-auto" />
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Your trusted partner for affordable eSIM solutions worldwide.
              Stay connected wherever you go.
            </p>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-2">
              <Lock className="h-4 w-4 text-primary" />
              <span>Secure Payments</span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold mb-4">Products</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Destinations */}
          <div>
            <h3 className="font-semibold mb-4">Destinations</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/esim/region/europe" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  eSIM for Europe
                </Link>
              </li>
              <li>
                <Link href="/esim/region/asia" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  eSIM for Asia
                </Link>
              </li>
              <li>
                <Link href="/esim/region/americas" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  eSIM for Americas
                </Link>
              </li>
              <li>
                <Link href="/esim/region/middle-east" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  eSIM for Middle East
                </Link>
              </li>
              <li>
                <Link href="/esim/region/oceania" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  eSIM for Oceania
                </Link>
              </li>
              <li>
                <Link href="/esim/region/africa" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  eSIM for Africa
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Social */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 mb-6">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Social Links */}
            <h3 className="font-semibold mb-3">Follow Us</h3>
            <div className="flex space-x-3">
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            &copy; {new Date().getFullYear()} MobiaL. All rights reserved. Powered by MobiMatter.
          </p>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Globe className="h-4 w-4" />
              <span>Worldwide Coverage</span>
            </div>
            <span className="hidden sm:inline">&bull;</span>
            <div className="flex items-center space-x-1">
              <Mail className="h-4 w-4" />
              <a href="mailto:support@mobialo.eu" className="hover:text-primary transition-colors">
                support@mobialo.eu
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
