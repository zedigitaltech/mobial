"use client"

import { CountrySearch } from "@/components/store/country-search"

interface HomeClientProps {
  countries: { code: string; name: string; slug: string; flag: string }[]
}

export function HomeClient({ countries }: HomeClientProps) {
  return (
    <CountrySearch
      countries={countries}
      placeholder="Where are you going?"
      className="mt-8"
    />
  )
}
