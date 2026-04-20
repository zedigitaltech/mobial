interface CountryData {
  code: string
  name: string
  flag: string
}

export const countries: Record<string, CountryData> = {
  'japan': { code: 'JP', name: 'Japan', flag: '\u{1F1EF}\u{1F1F5}' },
  'united-states': { code: 'US', name: 'United States', flag: '\u{1F1FA}\u{1F1F8}' },
  'united-kingdom': { code: 'GB', name: 'United Kingdom', flag: '\u{1F1EC}\u{1F1E7}' },
  'turkey': { code: 'TR', name: 'Turkey', flag: '\u{1F1F9}\u{1F1F7}' },
  'thailand': { code: 'TH', name: 'Thailand', flag: '\u{1F1F9}\u{1F1ED}' },
  'france': { code: 'FR', name: 'France', flag: '\u{1F1EB}\u{1F1F7}' },
  'germany': { code: 'DE', name: 'Germany', flag: '\u{1F1E9}\u{1F1EA}' },
  'italy': { code: 'IT', name: 'Italy', flag: '\u{1F1EE}\u{1F1F9}' },
  'spain': { code: 'ES', name: 'Spain', flag: '\u{1F1EA}\u{1F1F8}' },
  'canada': { code: 'CA', name: 'Canada', flag: '\u{1F1E8}\u{1F1E6}' },
  'australia': { code: 'AU', name: 'Australia', flag: '\u{1F1E6}\u{1F1FA}' },
  'south-korea': { code: 'KR', name: 'South Korea', flag: '\u{1F1F0}\u{1F1F7}' },
  'china': { code: 'CN', name: 'China', flag: '\u{1F1E8}\u{1F1F3}' },
  'india': { code: 'IN', name: 'India', flag: '\u{1F1EE}\u{1F1F3}' },
  'brazil': { code: 'BR', name: 'Brazil', flag: '\u{1F1E7}\u{1F1F7}' },
  'mexico': { code: 'MX', name: 'Mexico', flag: '\u{1F1F2}\u{1F1FD}' },
  'netherlands': { code: 'NL', name: 'Netherlands', flag: '\u{1F1F3}\u{1F1F1}' },
  'switzerland': { code: 'CH', name: 'Switzerland', flag: '\u{1F1E8}\u{1F1ED}' },
  'austria': { code: 'AT', name: 'Austria', flag: '\u{1F1E6}\u{1F1F9}' },
  'sweden': { code: 'SE', name: 'Sweden', flag: '\u{1F1F8}\u{1F1EA}' },
  'norway': { code: 'NO', name: 'Norway', flag: '\u{1F1F3}\u{1F1F4}' },
  'denmark': { code: 'DK', name: 'Denmark', flag: '\u{1F1E9}\u{1F1F0}' },
  'finland': { code: 'FI', name: 'Finland', flag: '\u{1F1EB}\u{1F1EE}' },
  'poland': { code: 'PL', name: 'Poland', flag: '\u{1F1F5}\u{1F1F1}' },
  'portugal': { code: 'PT', name: 'Portugal', flag: '\u{1F1F5}\u{1F1F9}' },
  'greece': { code: 'GR', name: 'Greece', flag: '\u{1F1EC}\u{1F1F7}' },
  'vietnam': { code: 'VN', name: 'Vietnam', flag: '\u{1F1FB}\u{1F1F3}' },
  'singapore': { code: 'SG', name: 'Singapore', flag: '\u{1F1F8}\u{1F1EC}' },
  'malaysia': { code: 'MY', name: 'Malaysia', flag: '\u{1F1F2}\u{1F1FE}' },
  'indonesia': { code: 'ID', name: 'Indonesia', flag: '\u{1F1EE}\u{1F1E9}' },
  'philippines': { code: 'PH', name: 'Philippines', flag: '\u{1F1F5}\u{1F1ED}' },
  'new-zealand': { code: 'NZ', name: 'New Zealand', flag: '\u{1F1F3}\u{1F1FF}' },
  'south-africa': { code: 'ZA', name: 'South Africa', flag: '\u{1F1FF}\u{1F1E6}' },
  'united-arab-emirates': { code: 'AE', name: 'United Arab Emirates', flag: '\u{1F1E6}\u{1F1EA}' },
  'saudi-arabia': { code: 'SA', name: 'Saudi Arabia', flag: '\u{1F1F8}\u{1F1E6}' },
  'israel': { code: 'IL', name: 'Israel', flag: '\u{1F1EE}\u{1F1F1}' },
  'egypt': { code: 'EG', name: 'Egypt', flag: '\u{1F1EA}\u{1F1EC}' },
  'ireland': { code: 'IE', name: 'Ireland', flag: '\u{1F1EE}\u{1F1EA}' },
  'belgium': { code: 'BE', name: 'Belgium', flag: '\u{1F1E7}\u{1F1EA}' },
  'czech-republic': { code: 'CZ', name: 'Czech Republic', flag: '\u{1F1E8}\u{1F1FF}' },
  'romania': { code: 'RO', name: 'Romania', flag: '\u{1F1F7}\u{1F1F4}' },
  'hungary': { code: 'HU', name: 'Hungary', flag: '\u{1F1ED}\u{1F1FA}' },
  'hong-kong': { code: 'HK', name: 'Hong Kong', flag: '\u{1F1ED}\u{1F1F0}' },
  'taiwan': { code: 'TW', name: 'Taiwan', flag: '\u{1F1F9}\u{1F1FC}' },
  'argentina': { code: 'AR', name: 'Argentina', flag: '\u{1F1E6}\u{1F1F7}' },
  'chile': { code: 'CL', name: 'Chile', flag: '\u{1F1E8}\u{1F1F1}' },
  'colombia': { code: 'CO', name: 'Colombia', flag: '\u{1F1E8}\u{1F1F4}' },
  'peru': { code: 'PE', name: 'Peru', flag: '\u{1F1F5}\u{1F1EA}' },
  'nigeria': { code: 'NG', name: 'Nigeria', flag: '\u{1F1F3}\u{1F1EC}' },
  'kenya': { code: 'KE', name: 'Kenya', flag: '\u{1F1F0}\u{1F1EA}' },
  'luxembourg': { code: 'LU', name: 'Luxembourg', flag: '\u{1F1F1}\u{1F1FA}' },
  'croatia': { code: 'HR', name: 'Croatia', flag: '\u{1F1ED}\u{1F1F7}' },
  'slovenia': { code: 'SI', name: 'Slovenia', flag: '\u{1F1F8}\u{1F1EE}' },
  'sri-lanka': { code: 'LK', name: 'Sri Lanka', flag: '\u{1F1F1}\u{1F1F0}' },
  'cambodia': { code: 'KH', name: 'Cambodia', flag: '\u{1F1F0}\u{1F1ED}' },
  'morocco': { code: 'MA', name: 'Morocco', flag: '\u{1F1F2}\u{1F1E6}' },
  'qatar': { code: 'QA', name: 'Qatar', flag: '\u{1F1F6}\u{1F1E6}' },
  'bahrain': { code: 'BH', name: 'Bahrain', flag: '\u{1F1E7}\u{1F1ED}' },
  'kuwait': { code: 'KW', name: 'Kuwait', flag: '\u{1F1F0}\u{1F1FC}' },
  'oman': { code: 'OM', name: 'Oman', flag: '\u{1F1F4}\u{1F1F2}' },
}

const codeToSlugMap: Record<string, string> = Object.fromEntries(
  Object.entries(countries).map(([slug, data]) => [data.code, slug])
)

export function getCountryBySlug(slug: string): CountryData | null {
  return countries[slug] || null
}

export function getCountrySlug(code: string): string {
  return codeToSlugMap[code.toUpperCase()] || code.toLowerCase()
}

export function getAllCountrySlugs(): string[] {
  return Object.keys(countries)
}

export function getCountryByCode(code: string): CountryData | null {
  const slug = codeToSlugMap[code.toUpperCase()]
  return slug ? countries[slug] : null
}

export const TOP_DESTINATIONS = [
  'japan',
  'united-states',
  'turkey',
  'thailand',
  'united-kingdom',
  'france',
  'germany',
  'italy',
  'spain',
  'south-korea',
  'singapore',
  'australia',
  'canada',
  'india',
  'vietnam',
  'indonesia',
  'malaysia',
  'netherlands',
  'switzerland',
  'portugal',
  'greece',
  'united-arab-emirates',
  'hong-kong',
  'taiwan',
  'brazil',
  'mexico',
  'ireland',
  'egypt',
  'saudi-arabia',
  'new-zealand',
]

export function getCountries(): { code: string; name: string; slug: string; flag: string }[] {
  return Object.entries(countries).map(([slug, data]) => ({
    slug,
    code: data.code,
    name: data.name,
    flag: data.flag,
  }))
}

export function getTopDestinations(limit = 8): { code: string; name: string; slug: string; flag: string }[] {
  return TOP_DESTINATIONS.slice(0, limit).flatMap((slug) => {
    const data = countries[slug]
    if (!data) return []
    return [{ slug, code: data.code, name: data.name, flag: data.flag }]
  })
}
