import { Metadata } from "next"
import { FAQClient, FAQCategory } from "./faq-client"

export const metadata: Metadata = {
  title: "FAQ - MobiaL",
  description:
    "Find answers to common questions about eSIMs, purchasing, installation, usage, and your MobiaL account.",
}

const faqCategories: FAQCategory[] = [
  {
    id: "general",
    label: "General",
    questions: [
      {
        q: "What is an eSIM?",
        a: "An eSIM (embedded SIM) is a digital SIM that allows you to activate a cellular plan without using a physical SIM card. It's built into most modern smartphones and can be activated by scanning a QR code or entering an activation code.",
      },
      {
        q: "How does MobiaL work?",
        a: "MobiaL is an eSIM marketplace that partners with multiple providers to offer you the best data plans for your destination. Simply choose your country or region, select a plan, complete your purchase, and receive a QR code instantly via email. Scan it with your phone and you're connected.",
      },
      {
        q: "Which countries are covered?",
        a: "We offer eSIM plans for over 190 countries and territories worldwide, including popular destinations across Europe, Asia, the Americas, Africa, and the Middle East. You can search for specific countries on our products page.",
      },
      {
        q: "How long does activation take?",
        a: "Most eSIMs activate within seconds of scanning the QR code. Some plans activate immediately upon installation, while others activate when you first connect to a network in your destination country. The entire process typically takes under 2 minutes.",
      },
    ],
  },
  {
    id: "purchasing",
    label: "Purchasing",
    questions: [
      {
        q: "How do I buy an eSIM?",
        a: "Browse our plans by searching for your destination country or region. Select a plan that fits your needs, add it to your cart, and complete checkout with your preferred payment method. You'll receive your eSIM QR code instantly via email.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept all major credit and debit cards (Visa, Mastercard, American Express) processed securely through Stripe. Additional payment methods may be available depending on your region.",
      },
      {
        q: "Can I buy an eSIM for someone else?",
        a: "Yes. After purchasing, simply forward the QR code email to the person who will use the eSIM. They can scan it on their own compatible device. Make sure their device supports eSIM before purchasing.",
      },
      {
        q: "Do you offer refunds?",
        a: "We offer refunds for eSIMs that have not been installed or activated. Once an eSIM has been downloaded to a device, it cannot be refunded as the digital product has been consumed. Please review our refund policy for full details.",
      },
    ],
  },
  {
    id: "installation",
    label: "Installation",
    questions: [
      {
        q: "Is my device compatible?",
        a: "Most smartphones manufactured after 2018 support eSIM, including iPhone XS and later, Samsung Galaxy S20 and later, Google Pixel 3a and later, and many other brands. Your device must also be carrier-unlocked. Check our compatible devices page for a full list.",
      },
      {
        q: "Can I install the eSIM before my trip?",
        a: "Yes, and we recommend it. You can install the eSIM anytime after purchase while you have an internet connection. Some eSIMs activate immediately, while others only start counting data once you connect to a network in the destination country.",
      },
      {
        q: "What if the QR code doesn't work?",
        a: "First, make sure you have a stable internet connection. Try adjusting the screen brightness or zoom level of the QR code. If scanning still fails, use the manual installation method with the SM-DP+ address and activation code from your email. Contact our support team if issues persist.",
      },
      {
        q: "Can I use multiple eSIMs?",
        a: "Most modern devices can store multiple eSIM profiles, though typically only one can be active at a time alongside your physical SIM. iPhones (XS and later) support multiple eSIM profiles, and newer models like iPhone 14 (US) support dual eSIM without a physical SIM slot.",
      },
    ],
  },
  {
    id: "usage",
    label: "Usage",
    questions: [
      {
        q: "How do I check my data usage?",
        a: "You can check your data usage in your phone's Settings under Cellular/Mobile Data for the eSIM line. Some plans also provide a usage dashboard accessible through the link in your order confirmation email.",
      },
      {
        q: "Can I top up my eSIM?",
        a: "Top-up availability depends on the specific plan and provider. Some plans support data top-ups, which you can purchase through our platform. If your plan doesn't support top-ups, you can purchase a new eSIM for additional data.",
      },
      {
        q: "What happens when my data runs out?",
        a: "When your data allocation is fully used, your internet connection will stop. You won't be charged any overage fees. You can purchase a new eSIM or a top-up (if available) to continue using data.",
      },
      {
        q: "Does the eSIM support calls and SMS?",
        a: "Most of our eSIM plans are data-only. This means they provide mobile data but not traditional voice calls or SMS. However, you can use apps like WhatsApp, FaceTime, and Zoom for calls over data. Some regional plans do include voice and SMS -- check the plan details before purchasing.",
      },
    ],
  },
  {
    id: "account",
    label: "Account",
    questions: [
      {
        q: "How do I reset my password?",
        a: 'Click "Forgot Password" on the login page and enter your email address. You\'ll receive a password reset link within a few minutes. Check your spam folder if you don\'t see it in your inbox.',
      },
      {
        q: "Can I use MobiaL without an account?",
        a: "You can browse plans without an account, but you'll need to create one to complete a purchase. Your account lets you track orders, access QR codes, and manage your eSIM purchases.",
      },
      {
        q: "How do I delete my account?",
        a: "You can request account deletion by contacting our support team at support@mobialo.eu. We'll process your request in accordance with GDPR requirements. Note that order history may be retained for legal compliance purposes.",
      },
    ],
  },
]

function generateFAQJsonLd() {
  const allQuestions = faqCategories.flatMap((c) => c.questions)
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allQuestions.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  }
}

export default function FAQPage() {
  const jsonLd = generateFAQJsonLd()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FAQClient categories={faqCategories} />
    </>
  )
}
