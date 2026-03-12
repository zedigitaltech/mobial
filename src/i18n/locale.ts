import { cookies, headers } from 'next/headers';

const LOCALE_COOKIE = 'NEXT_LOCALE';
const DEFAULT_LOCALE = 'en';
export const SUPPORTED_LOCALES = [
  'en', 'de', 'es', 'fr',
  'sq', 'sr', 'hr', 'bs',
  'it', 'pt', 'tr', 'el',
  'ro', 'bg', 'nl', 'pl', 'sv',
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export function getSupportedLocales() {
  return SUPPORTED_LOCALES;
}

function parseAcceptLanguage(header: string): Locale | null {
  const entries = header.split(',').map(part => {
    const [lang, ...params] = part.trim().split(';');
    const qParam = params.find(p => p.trim().startsWith('q='));
    const q = qParam ? parseFloat(qParam.trim().slice(2)) : 1.0;
    return { lang: lang.trim().toLowerCase(), q };
  }).sort((a, b) => b.q - a.q);

  for (const { lang } of entries) {
    const exact = SUPPORTED_LOCALES.find(l => l === lang);
    if (exact) return exact;

    const prefix = lang.split('-')[0];
    const prefixMatch = SUPPORTED_LOCALES.find(l => l === prefix);
    if (prefixMatch) return prefixMatch;
  }

  return null;
}

export async function getUserLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (locale && (SUPPORTED_LOCALES as readonly string[]).includes(locale)) {
    return locale as Locale;
  }

  try {
    const headerStore = await headers();
    const acceptLang = headerStore.get('accept-language');
    if (acceptLang) {
      const detected = parseAcceptLanguage(acceptLang);
      if (detected) return detected;
    }
  } catch {
    // headers() may not be available in all contexts
  }

  return DEFAULT_LOCALE;
}

export async function setUserLocale(locale: Locale) {
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale);
}
