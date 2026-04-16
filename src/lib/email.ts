import { Resend } from 'resend';
import { logger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

const log = logger.child('email');

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_ADDRESS = 'MobiaL <noreply@mobialo.eu>';

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!resend) {
    log.warn('[Email] RESEND_API_KEY not set — email not sent', {
      metadata: { to: params.to, subject: params.subject },
    });
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      log.error('[Email] Resend rejected email', {
        metadata: { to: params.to, subject: params.subject, error: error.message },
      });
      Sentry.captureException(new Error(`Resend error: ${error.message}`), {
        extra: { to: params.to, subject: params.subject },
      });
      return { success: false, error: error.message };
    }

    log.info('[Email] Sent', { metadata: { to: params.to, subject: params.subject, id: data?.id } });
    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown email error';
    log.errorWithException('[Email] Exception sending email', err, {
      metadata: { to: params.to, subject: params.subject },
    });
    Sentry.captureException(err, {
      extra: { to: params.to, subject: params.subject },
    });
    return { success: false, error: message };
  }
}
