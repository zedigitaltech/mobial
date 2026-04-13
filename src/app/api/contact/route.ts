import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { checkRateLimit, createRateLimitHeaders } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { SUPPORT_EMAIL } from '@/lib/env';

const CONTACT_EMAIL = process.env.CONTACT_EMAIL || SUPPORT_EMAIL;

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  const rateCheck = await checkRateLimit(ip, 'api:write', {
    windowMs: 60 * 1000,
    maxRequests: 5,
  });

  if (!rateCheck.success) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.' },
      { status: 429, headers: createRateLimitHeaders(rateCheck) }
    );
  }

  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'All fields are required.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address.' },
        { status: 400 }
      );
    }

    if (name.length > 200 || subject.length > 500 || message.length > 5000) {
      return NextResponse.json(
        { success: false, error: 'Input exceeds maximum length.' },
        { status: 400 }
      );
    }

    const htmlBody = `
      <h2>New Contact Form Submission</h2>
      <p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p>
      <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
      <hr />
      <p>${escapeHtml(message).replace(/\n/g, '<br />')}</p>
    `;

    const result = await sendEmail({
      to: CONTACT_EMAIL,
      subject: `[MobiaL Contact] ${subject}`,
      html: htmlBody,
    });

    if (!result.success) {
      logger.error(`[Contact] Email send failed: ${result.error}`);
      return NextResponse.json(
        { success: false, error: 'Failed to send message. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request.' },
      { status: 400 }
    );
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
