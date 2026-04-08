export interface Review {
  id: string
  name: string
  country: string
  countryCode: string
  rating: number
  title: string
  text: string
  destination: string
  date: string
  verified: boolean
}

export const reviews: Review[] = [
  {
    id: "r1",
    name: "Sarah Mitchell",
    country: "United States",
    countryCode: "US",
    rating: 5,
    title: "Lifesaver in Tokyo",
    text: "Landed at Narita and had data within 30 seconds of turning off airplane mode. Used it for Google Maps, translation apps, and video calls home for two weeks straight. Never dropped below 4G. This is how travel should be.",
    destination: "Japan",
    date: "2026-02-28",
    verified: true,
  },
  {
    id: "r2",
    name: "Marcus Weber",
    country: "Germany",
    countryCode: "DE",
    rating: 5,
    title: "Perfect for multi-country Europe trips",
    text: "Drove through France, Spain, and Portugal over three weeks. One eSIM covered all three countries seamlessly. No switching SIMs at borders, no roaming fees. Speed was consistently good even in smaller towns.",
    destination: "Europe",
    date: "2026-02-20",
    verified: true,
  },
  {
    id: "r3",
    name: "Priya Sharma",
    country: "India",
    countryCode: "IN",
    rating: 4,
    title: "Great value for Bali trip",
    text: "The 5GB plan lasted my entire 10-day Bali trip. Speeds were solid in Seminyak and Ubud. Only reason for 4 stars is the connection was spotty in very rural areas, but that's expected anywhere.",
    destination: "Indonesia",
    date: "2026-02-15",
    verified: true,
  },
  {
    id: "r4",
    name: "James O'Brien",
    country: "Australia",
    countryCode: "AU",
    rating: 5,
    title: "Business trip essential",
    text: "I travel for work constantly and MobiaL has become non-negotiable. Set up takes two minutes, the connection is reliable for video conferences, and my company reimburses it easily with the clear receipts. Used it in Singapore, Thailand, and Vietnam this month alone.",
    destination: "Southeast Asia",
    date: "2026-03-01",
    verified: true,
  },
  {
    id: "r5",
    name: "Elena Costa",
    country: "Brazil",
    countryCode: "BR",
    rating: 5,
    title: "So much better than airport SIM cards",
    text: "I used to waste 45 minutes at every airport buying local SIMs. Now I install the eSIM at home before my flight and I'm connected the moment I land. Used it across Turkey for two weeks and it was flawless.",
    destination: "Turkey",
    date: "2026-01-30",
    verified: true,
  },
  {
    id: "r6",
    name: "Yuki Tanaka",
    country: "Japan",
    countryCode: "JP",
    rating: 4,
    title: "Reliable connection in the US",
    text: "Visited New York and LA over 12 days. Data speeds were excellent in both cities. Streaming, maps, and ride-sharing apps all worked perfectly. Would have liked a slightly larger data option for the price, but overall very happy.",
    destination: "United States",
    date: "2026-02-10",
    verified: true,
  },
  {
    id: "r7",
    name: "Ahmed Hassan",
    country: "Egypt",
    countryCode: "EG",
    rating: 5,
    title: "Made my Dubai trip stress-free",
    text: "First time using an eSIM and the setup guide was crystal clear. Had 5G speeds across Dubai and Abu Dhabi. Used it for navigation, restaurant reviews, and staying in touch with family. Will never go back to physical SIMs.",
    destination: "UAE",
    date: "2026-02-25",
    verified: true,
  },
  {
    id: "r8",
    name: "Lisa Chen",
    country: "Canada",
    countryCode: "CA",
    rating: 5,
    title: "Digital nomad approved",
    text: "I've been working remotely across Southeast Asia for six months. MobiaL's regional plans are the best value I've found. Reliable enough for daily Zoom calls, and switching countries is seamless. Already recommended it to my entire coworking group.",
    destination: "Thailand",
    date: "2026-03-05",
    verified: true,
  },
  {
    id: "r9",
    name: "Roberto Fernandez",
    country: "Spain",
    countryCode: "ES",
    rating: 4,
    title: "Solid service in South America",
    text: "Used it through Colombia and Peru for three weeks. Connection was strong in major cities like Bogota and Lima. Slightly slower in Cusco but still very usable. The instant delivery and easy setup made it a clear winner over the alternatives I researched.",
    destination: "South America",
    date: "2026-01-18",
    verified: true,
  },
  {
    id: "r10",
    name: "Sophie Martin",
    country: "France",
    countryCode: "FR",
    rating: 5,
    title: "Saved me in an emergency",
    text: "My physical SIM stopped working mid-trip in Morocco. Bought a MobiaL eSIM on my phone browser, scanned the QR code, and was back online in under five minutes. Actual lifesaver when you need maps and translation in a foreign country.",
    destination: "Morocco",
    date: "2026-02-05",
    verified: true,
  },
  {
    id: "r11",
    name: "David Kim",
    country: "South Korea",
    countryCode: "KR",
    rating: 5,
    title: "Fast speeds in Europe",
    text: "Visited London, Paris, and Amsterdam over two weeks. LTE speeds consistently above 50 Mbps. The dual-SIM setup meant I could keep receiving Korean calls while using MobiaL for data. Incredibly convenient.",
    destination: "Europe",
    date: "2026-03-02",
    verified: true,
  },
  {
    id: "r12",
    name: "Maria Gonzalez",
    country: "Mexico",
    countryCode: "MX",
    rating: 4,
    title: "Great for family vacations",
    text: "Bought plans for myself and my husband for our Italy trip. Both activated in minutes. The kids could use our hotspot for their tablets. Much cheaper than the hotel Wi-Fi add-on and way more reliable. Will definitely use again for our next trip.",
    destination: "Italy",
    date: "2026-02-18",
    verified: true,
  },
]

// Stats derived from the curated reviews above (not inflated)
function computeReviewStats(reviewList: readonly Review[]): {
  averageRating: number
  totalReviews: number
  fiveStarPercent: number
  fourStarPercent: number
  threeStarPercent: number
  twoStarPercent: number
  oneStarPercent: number
} {
  const total = reviewList.length
  if (total === 0) {
    return { averageRating: 0, totalReviews: 0, fiveStarPercent: 0, fourStarPercent: 0, threeStarPercent: 0, twoStarPercent: 0, oneStarPercent: 0 }
  }
  const sum = reviewList.reduce((acc, r) => acc + r.rating, 0)
  const count = (stars: number) => reviewList.filter((r) => r.rating === stars).length
  return {
    averageRating: Math.round((sum / total) * 10) / 10,
    totalReviews: total,
    fiveStarPercent: Math.round((count(5) / total) * 100),
    fourStarPercent: Math.round((count(4) / total) * 100),
    threeStarPercent: Math.round((count(3) / total) * 100),
    twoStarPercent: Math.round((count(2) / total) * 100),
    oneStarPercent: Math.round((count(1) / total) * 100),
  }
}

export const REVIEW_STATS = computeReviewStats(reviews)

export function getReviews(limit?: number): Review[] {
  if (limit) return reviews.slice(0, limit)
  return reviews
}
