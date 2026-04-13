import { errorResponse } from "@/lib/auth-helpers";
import { cached, CACHE_TTL } from "@/lib/cache";
import { logger } from "@/lib/logger";

// Fallback rates (used if external API is unavailable)
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
  CAD: 1.36,
  AUD: 1.53,
  CHF: 0.88,
  JPY: 149.5,
  SGD: 1.34,
  INR: 83.1,
  BRL: 4.97,
  TRY: 30.5,
};

const SUPPORTED_CODES = Object.keys(FALLBACK_RATES);

async function fetchLiveRates(): Promise<Record<string, number>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD", {
      signal: controller.signal,
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`Exchange rate API returned ${res.status}`);
    }

    const data = await res.json();
    const rates: Record<string, number> = {};

    for (const code of SUPPORTED_CODES) {
      rates[code] = data.rates?.[code] || FALLBACK_RATES[code];
    }

    return rates;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  try {
    const rates = await cached(
      "exchange-rates:usd",
      async () => {
        try {
          return await fetchLiveRates();
        } catch {
          return FALLBACK_RATES;
        }
      },
      CACHE_TTL.EXCHANGE_RATES,
    );

    return new Response(JSON.stringify({ success: true, data: { rates } }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    logger.errorWithException("Error fetching exchange rates", error);
    return errorResponse("Failed to fetch exchange rates", 500);
  }
}
