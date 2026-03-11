import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with MobiaL support. We typically respond within 24 hours. Email us at support@mobialo.eu.",
  openGraph: {
    title: "Contact Us | MobiaL",
    description:
      "Have a question or need help with your eSIM? Contact our support team.",
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
