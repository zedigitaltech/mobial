import { NextRequest, NextResponse } from 'next/server';
import { SUPPORTED_LOCALES } from '@/i18n/locale';

export async function POST(request: NextRequest) {
  try {
    // Same-origin check: reject cross-origin POSTs to prevent CSRF-style
    // locale tampering from third-party sites.
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { locale } = await request.json();

    if (!locale || !(SUPPORTED_LOCALES as readonly string[]).includes(locale)) {
      return NextResponse.json(
        { error: `Invalid locale. Supported: ${SUPPORTED_LOCALES.join(', ')}` },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ locale });
    response.cookies.set('NEXT_LOCALE', locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
