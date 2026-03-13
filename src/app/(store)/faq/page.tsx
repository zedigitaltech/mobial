import { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { FAQClient, FAQCategory } from "./faq-client"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("faq")
  return {
    title: `${t("title")} - MobiaL`,
    description: t("description"),
  }
}

export default async function FAQPage() {
  const t = await getTranslations("faq")

  const faqCategories: FAQCategory[] = [
    {
      id: "general",
      label: t("generalLabel"),
      questions: [
        { q: t("generalQ1"), a: t("generalA1") },
        { q: t("generalQ2"), a: t("generalA2") },
        { q: t("generalQ3"), a: t("generalA3") },
        { q: t("generalQ4"), a: t("generalA4") },
      ],
    },
    {
      id: "purchasing",
      label: t("purchasingLabel"),
      questions: [
        { q: t("purchasingQ1"), a: t("purchasingA1") },
        { q: t("purchasingQ2"), a: t("purchasingA2") },
        { q: t("purchasingQ3"), a: t("purchasingA3") },
        { q: t("purchasingQ4"), a: t("purchasingA4") },
      ],
    },
    {
      id: "installation",
      label: t("installationLabel"),
      questions: [
        { q: t("installationQ1"), a: t("installationA1") },
        { q: t("installationQ2"), a: t("installationA2") },
        { q: t("installationQ3"), a: t("installationA3") },
        { q: t("installationQ4"), a: t("installationA4") },
      ],
    },
    {
      id: "usage",
      label: t("usageLabel"),
      questions: [
        { q: t("usageQ1"), a: t("usageA1") },
        { q: t("usageQ2"), a: t("usageA2") },
        { q: t("usageQ3"), a: t("usageA3") },
        { q: t("usageQ4"), a: t("usageA4") },
      ],
    },
    {
      id: "account",
      label: t("accountLabel"),
      questions: [
        { q: t("accountQ1"), a: t("accountA1") },
        { q: t("accountQ2"), a: t("accountA2") },
        { q: t("accountQ3"), a: t("accountA3") },
      ],
    },
  ]

  // JSON-LD stays in English for SEO (Google crawls this)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqCategories.flatMap((c) =>
      c.questions.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      }))
    ),
  }

  const uiStrings = {
    helpCenter: t("helpCenter"),
    heroTitle1: t("heroTitle1"),
    heroTitle2: t("heroTitle2"),
    heroSubtitle: t("heroSubtitle"),
    searchPlaceholder: t("searchPlaceholder"),
    noResultsHint: t("noResultsHint"),
    contactSupport: t("contactSupport"),
    stillHaveQuestions: t("stillHaveQuestions"),
    supportDesc: t("supportDesc"),
    contactSupportBtn: t("contactSupportBtn"),
    installationGuide: t("installationGuide"),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FAQClient categories={faqCategories} ui={uiStrings} />
    </>
  )
}
