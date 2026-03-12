import { NextRequest, NextResponse } from 'next/server';
import { SUPPORTED_LOCALES } from '@/i18n/locale';

export async function POST(request: NextRequest) {
  try {
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
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
