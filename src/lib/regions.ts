export interface Region {
  slug: string;
  name: string;
  description: string;
  countries: string[];
}

export const regions: Region[] = [
  {
    slug: "europe",
    name: "Europe",
    description: "Stay connected across European countries with high-speed eSIM data plans.",
    countries: [
      "AL", "AD", "AT", "BY", "BE", "BA", "BG", "HR", "CY", "CZ", "DK",
      "EE", "FI", "FR", "DE", "GR", "HU", "IS", "IE", "IT", "XK", "LV",
      "LI", "LT", "LU", "MT", "MD", "MC", "ME", "NL", "MK", "NO", "PL",
      "PT", "RO", "RU", "SM", "RS", "SK", "SI", "ES", "SE", "CH", "UA",
      "GB", "VA",
    ],
  },
  {
    slug: "asia",
    name: "Asia",
    description: "Travel across Asia with reliable eSIM connectivity and competitive data plans.",
    countries: [
      "AF", "AM", "AZ", "BH", "BD", "BT", "BN", "KH", "CN", "GE", "HK",
      "IN", "ID", "IR", "IQ", "IL", "JP", "JO", "KZ", "KW", "KG", "LA",
      "LB", "MO", "MY", "MV", "MN", "MM", "NP", "OM", "PK", "PS", "PH",
      "QA", "SA", "SG", "KR", "LK", "SY", "TW", "TJ", "TH", "TL", "TR",
      "TM", "AE", "UZ", "VN", "YE",
    ],
  },
  {
    slug: "americas",
    name: "Americas",
    description: "Get connected in North, Central, and South America with eSIM plans.",
    countries: [
      "AR", "BS", "BB", "BZ", "BO", "BR", "CA", "CL", "CO", "CR", "CU",
      "DO", "EC", "SV", "GT", "GY", "HT", "HN", "JM", "MX", "NI", "PA",
      "PY", "PE", "PR", "SR", "TT", "US", "UY", "VE",
    ],
  },
  {
    slug: "middle-east",
    name: "Middle East",
    description: "Stay connected across Middle Eastern countries with prepaid eSIM data.",
    countries: [
      "BH", "EG", "IR", "IQ", "IL", "JO", "KW", "LB", "OM", "PS", "QA",
      "SA", "SY", "AE", "YE",
    ],
  },
  {
    slug: "oceania",
    name: "Oceania",
    description: "Explore Australia, New Zealand, and Pacific Islands with eSIM data plans.",
    countries: [
      "AU", "FJ", "GU", "KI", "MH", "FM", "NR", "NC", "NZ", "PW", "PG",
      "WS", "SB", "TO", "TV", "VU",
    ],
  },
  {
    slug: "africa",
    name: "Africa",
    description: "Travel across Africa with eSIM data plans for connected adventures.",
    countries: [
      "DZ", "AO", "BJ", "BW", "BF", "BI", "CM", "CV", "CF", "TD", "KM",
      "CG", "CD", "CI", "DJ", "EG", "GQ", "ER", "SZ", "ET", "GA", "GM",
      "GH", "GN", "GW", "KE", "LS", "LR", "LY", "MG", "MW", "ML", "MR",
      "MU", "MA", "MZ", "NA", "NE", "NG", "RW", "ST", "SN", "SC", "SL",
      "SO", "ZA", "SS", "SD", "TZ", "TG", "TN", "UG", "ZM", "ZW",
    ],
  },
];

export function getRegionBySlug(slug: string): Region | undefined {
  return regions.find((r) => r.slug === slug);
}

export function getAllRegionSlugs(): string[] {
  return regions.map((r) => r.slug);
}
