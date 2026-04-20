import { getTrialDestinations } from "@/services/trial-service"
import { getCountryByCode } from "@/lib/countries"

export async function GET() {
  const destinations = getTrialDestinations().map((d) => {
    const countryData = getCountryByCode(d.country)
    return { ...d, flag: countryData?.flag ?? "" }
  })
  return Response.json({ success: true, data: destinations })
}
