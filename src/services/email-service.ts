import { sendEmail } from '@/lib/email';
import { escapeHtml } from '@/lib/sanitize';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MobiaL</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f1a;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#1a1a2e;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Mobi</span><span style="font-size:24px;font-weight:700;color:#4da6e8;letter-spacing:-0.5px;">aL</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;border-top:1px solid rgba(255,255,255,0.06);background-color:rgba(255,255,255,0.02);">
              <p style="margin:0 0 8px;font-size:12px;color:#6b7280;line-height:1.5;">
                MobiaL &mdash; eSIM connectivity, everywhere.
              </p>
              <p style="margin:0;font-size:11px;color:#4b5563;line-height:1.5;">
                If you did not expect this email, you can safely ignore it.<br />
                <a href="${BASE_URL}/unsubscribe" style="color:#4da6e8;text-decoration:none;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background-color:#4da6e8;border-radius:8px;">
      <a href="${href}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#0f0f1a;text-decoration:none;letter-spacing:0.02em;">
        ${label}
      </a>
    </td>
  </tr>
</table>`;
}

export async function sendOrderConfirmation(
  email: string,
  orderNumber: string,
  items: OrderItem[],
  total: number,
  qrCodeUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const itemRows = items
      .map(
        (item) => `<tr>
          <td style="padding:8px 0;color:#d1d5db;font-size:14px;border-bottom:1px solid rgba(255,255,255,0.04);">
            ${escapeHtml(item.productName)}${item.quantity > 1 ? ` &times; ${item.quantity}` : ''}
          </td>
          <td style="padding:8px 0;color:#d1d5db;font-size:14px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.04);">
            $${item.totalPrice.toFixed(2)}
          </td>
        </tr>`
      )
      .join('');

    const qrSection = qrCodeUrl
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
          <tr>
            <td align="center" style="padding:20px;background-color:rgba(77,166,232,0.08);border-radius:12px;border:1px solid rgba(77,166,232,0.15);">
              <p style="margin:0 0 12px;font-size:13px;color:#9ca3af;font-weight:500;">Your eSIM QR Code</p>
              <img src="${qrCodeUrl}" alt="eSIM QR Code" width="180" height="180" style="display:block;border-radius:8px;" />
            </td>
          </tr>
        </table>`
      : '';

    const html = layout(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">Order Confirmed</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#9ca3af;">
        Order <span style="color:#4da6e8;font-weight:600;">#${escapeHtml(orderNumber)}</span>
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
        ${itemRows}
        <tr>
          <td style="padding:12px 0 0;color:#ffffff;font-size:15px;font-weight:600;">Total</td>
          <td style="padding:12px 0 0;color:#ffffff;font-size:15px;font-weight:600;text-align:right;">$${total.toFixed(2)}</td>
        </tr>
      </table>

      ${qrSection}

      ${button(`${BASE_URL}/order/${orderNumber}`, 'View Order')}

      <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
        Thank you for choosing MobiaL. Your eSIM details are available in your order page.
      </p>
    `);

    const result = await sendEmail({
      to: email,
      subject: `Your MobiaL eSIM Order #${escapeHtml(orderNumber)}`,
      html,
    });

    return { success: result.success, error: result.error };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send order confirmation';
    console.error('[EmailService] sendOrderConfirmation error:', message);
    return { success: false, error: message };
  }
}

export async function sendPasswordReset(
  email: string,
  resetToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const resetUrl = `${BASE_URL}/reset-password/confirm?token=${resetToken}`;

    const html = layout(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">Reset Your Password</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#9ca3af;line-height:1.6;">
        We received a request to reset your password. Click the button below to choose a new one.
      </p>

      ${button(resetUrl, 'Reset Password')}

      <p style="margin:0 0 12px;font-size:13px;color:#6b7280;line-height:1.6;">
        This link expires in <strong style="color:#d1d5db;">1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.
      </p>

      <p style="margin:0;font-size:11px;color:#4b5563;word-break:break-all;line-height:1.5;">
        ${resetUrl}
      </p>
    `);

    const result = await sendEmail({
      to: email,
      subject: 'Reset Your MobiaL Password',
      html,
    });

    return { success: result.success, error: result.error };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send password reset';
    console.error('[EmailService] sendPasswordReset error:', message);
    return { success: false, error: message };
  }
}

export async function sendEmailVerification(
  email: string,
  verificationToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const verifyUrl = `${BASE_URL}/verify-email?token=${verificationToken}`;

    const html = layout(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">Verify Your Email</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#9ca3af;line-height:1.6;">
        Confirm your email address to complete your MobiaL account setup.
      </p>

      ${button(verifyUrl, 'Verify Email')}

      <p style="margin:0 0 12px;font-size:13px;color:#6b7280;line-height:1.6;">
        If you didn't create a MobiaL account, you can safely ignore this email.
      </p>

      <p style="margin:0;font-size:11px;color:#4b5563;word-break:break-all;line-height:1.5;">
        ${verifyUrl}
      </p>
    `);

    const result = await sendEmail({
      to: email,
      subject: 'Verify Your MobiaL Email',
      html,
    });

    return { success: result.success, error: result.error };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send email verification';
    console.error('[EmailService] sendEmailVerification error:', message);
    return { success: false, error: message };
  }
}

export async function sendCartRecovery(
  email: string,
  items: Array<{ name: string; price: number; quantity: number }>,
  totalAmount: number,
  recoveryUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const itemRows = items
      .map(
        (item) => `
        <tr>
          <td style="padding:8px 0;color:#e5e7eb;font-size:14px;border-bottom:1px solid rgba(255,255,255,0.06);">
            ${item.name}${item.quantity > 1 ? ` (x${item.quantity})` : ''}
          </td>
          <td style="padding:8px 0;color:#e5e7eb;font-size:14px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.06);">
            $${(item.price * item.quantity).toFixed(2)}
          </td>
        </tr>`
      )
      .join('');

    const html = layout(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">You left something behind</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#9ca3af;line-height:1.6;">
        Looks like you were exploring eSIM plans but didn't complete your purchase.
        Your cart is still waiting for you.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="margin:0 0 24px;background:rgba(255,255,255,0.03);border-radius:12px;">
        <thead>
          <tr>
            <th style="text-align:left;padding:12px 16px 8px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em;border-bottom:1px solid rgba(255,255,255,0.08);">Plan</th>
            <th style="text-align:right;padding:12px 16px 8px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em;border-bottom:1px solid rgba(255,255,255,0.08);">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
          <tr>
            <td style="padding:12px 16px 0;font-size:16px;font-weight:700;color:#ffffff;">Total</td>
            <td style="padding:12px 16px 0;font-size:16px;font-weight:700;color:#4da6e8;text-align:right;">$${totalAmount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      ${button(recoveryUrl, 'Complete Your Purchase')}

      <p style="margin:0;font-size:12px;color:#6b7280;text-align:center;">
        Your eSIM will be delivered instantly via email after purchase.
      </p>
    `);

    const result = await sendEmail({
      to: email,
      subject: 'You left items in your cart - MobiaL',
      html,
    });

    return { success: result.success, error: result.error };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send cart recovery email';
    console.error('[EmailService] sendCartRecovery error:', message);
    return { success: false, error: message };
  }
}

export async function sendWelcome(
  email: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const displayName = name || 'there';

    const html = layout(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">Welcome to MobiaL</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#9ca3af;line-height:1.6;">
        Hey ${escapeHtml(displayName)}, your account is ready. Browse eSIM plans for 190+ countries and get connected in minutes.
      </p>

      ${button(`${BASE_URL}/destinations`, 'Browse Destinations')}

      <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
        Need help? Reply to this email or visit our support page.
      </p>
    `);

    const result = await sendEmail({
      to: email,
      subject: 'Welcome to MobiaL!',
      html,
    });

    return { success: result.success, error: result.error };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send welcome email';
    console.error('[EmailService] sendWelcome error:', message);
    return { success: false, error: message };
  }
}

export async function sendEsimReady(
  email: string,
  orderNumber: string,
  qrCodeUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = layout(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">Your eSIM is Ready</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#9ca3af;line-height:1.6;">
        Great news! Your eSIM for order <span style="color:#4da6e8;font-weight:600;">#${escapeHtml(orderNumber)}</span> has been provisioned and is ready to install.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
        <tr>
          <td align="center" style="padding:20px;background-color:rgba(77,166,232,0.08);border-radius:12px;border:1px solid rgba(77,166,232,0.15);">
            <p style="margin:0 0 12px;font-size:13px;color:#9ca3af;font-weight:500;">Scan to Install</p>
            <img src="${qrCodeUrl}" alt="eSIM QR Code" width="180" height="180" style="display:block;border-radius:8px;" />
          </td>
        </tr>
      </table>

      ${button(`${BASE_URL}/order/${orderNumber}`, 'View Order Details')}

      <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
        Need help installing? Check our <a href="${BASE_URL}/guides/installation" style="color:#4da6e8;text-decoration:none;">installation guide</a>.
      </p>
    `);

    const result = await sendEmail({
      to: email,
      subject: `Your eSIM is Ready - Order #${escapeHtml(orderNumber)}`,
      html,
    });

    return { success: result.success, error: result.error };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send eSIM ready email';
    console.error('[EmailService] sendEsimReady error:', message);
    return { success: false, error: message };
  }
}

export async function sendActivationDetected(
  email: string,
  orderNumber: string,
  destination: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = layout(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">eSIM Activated</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#9ca3af;line-height:1.6;">
        Your eSIM for order <span style="color:#4da6e8;font-weight:600;">#${escapeHtml(orderNumber)}</span> has been
        activated in <strong style="color:#ffffff;">${escapeHtml(destination)}</strong>. You're now connected!
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td style="padding:16px;background:rgba(255,255,255,0.03);border-radius:12px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:8px 0;color:#e5e7eb;font-size:14px;line-height:1.6;">
                  <strong style="color:#4da6e8;">Tip:</strong> You can check your remaining data balance anytime from your order page.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${button(`${BASE_URL}/order/${orderNumber}`, 'Check Usage')}

      <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
        Running low on data? <a href="${BASE_URL}/topup" style="color:#4da6e8;text-decoration:none;">Top up your eSIM</a> anytime.
      </p>
    `);

    const result = await sendEmail({
      to: email,
      subject: `eSIM Activated in ${escapeHtml(destination)} - Order #${escapeHtml(orderNumber)}`,
      html,
    });

    return { success: result.success, error: result.error };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send activation detected email';
    console.error('[EmailService] sendActivationDetected error:', message);
    return { success: false, error: message };
  }
}

export async function sendInstallationReminder(
  email: string,
  orderNumber: string,
  productName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = layout(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">Time to install your eSIM</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#9ca3af;line-height:1.6;">
        Your <strong style="color:#ffffff;">${escapeHtml(productName)}</strong> eSIM (order ${escapeHtml(orderNumber)}) is ready to install.
        Follow these steps to get connected:
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td style="padding:16px;background:rgba(255,255,255,0.03);border-radius:12px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:8px 0;color:#e5e7eb;font-size:14px;line-height:1.6;">
                  <strong style="color:#4da6e8;">1.</strong> Open your email with the QR code on your phone
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#e5e7eb;font-size:14px;line-height:1.6;">
                  <strong style="color:#4da6e8;">2.</strong> Go to Settings &rarr; Cellular &rarr; Add eSIM
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#e5e7eb;font-size:14px;line-height:1.6;">
                  <strong style="color:#4da6e8;">3.</strong> Scan the QR code or enter the activation code
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#e5e7eb;font-size:14px;line-height:1.6;">
                  <strong style="color:#4da6e8;">4.</strong> Turn on the eSIM when you arrive at your destination
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${button(`${BASE_URL}/guides/installation`, 'Full Installation Guide')}

      <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
        Having trouble? Visit our <a href="${BASE_URL}/troubleshooting" style="color:#4da6e8;text-decoration:none;">troubleshooting page</a> or reply to this email.
      </p>
    `);

    const result = await sendEmail({
      to: email,
      subject: `Install your eSIM - Order ${escapeHtml(orderNumber)}`,
      html,
    });

    return { success: result.success, error: result.error };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send installation reminder';
    console.error('[EmailService] sendInstallationReminder error:', message);
    return { success: false, error: message };
  }
}

export async function sendFeedbackRequest(
  email: string,
  orderNumber: string,
  productName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = layout(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">How was your experience?</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#9ca3af;line-height:1.6;">
        You recently used <strong style="color:#ffffff;">${escapeHtml(productName)}</strong> (order ${escapeHtml(orderNumber)}).
        We'd love to hear how it went!
      </p>

      <p style="margin:0 0 16px;font-size:14px;color:#9ca3af;line-height:1.6;">
        Your feedback helps other travelers choose the right plan, and helps us improve our service.
      </p>

      ${button(`${BASE_URL}/reviews?order=${orderNumber}`, 'Leave a Review')}

      <p style="margin:24px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">
        Planning another trip? <a href="${BASE_URL}/esim" style="color:#4da6e8;text-decoration:none;">Browse plans for your next destination</a>.
      </p>
    `);

    const result = await sendEmail({
      to: email,
      subject: `How was your eSIM experience? - MobiaL`,
      html,
    });

    return { success: result.success, error: result.error };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send feedback request';
    console.error('[EmailService] sendFeedbackRequest error:', message);
    return { success: false, error: message };
  }
}

export async function sendTravelAgainReminder(
  email: string,
  lastDestination: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = layout(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">Traveling again?</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#9ca3af;line-height:1.6;">
        Last time you used MobiaL for your trip to <strong style="color:#ffffff;">${escapeHtml(lastDestination)}</strong>.
        Planning your next adventure? We have plans for 190+ countries.
      </p>

      ${button(`${BASE_URL}/esim`, 'Browse Destinations')}

      <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
        Don't forget: you can install your eSIM before you travel, so you're connected the moment you land.
      </p>
    `);

    const result = await sendEmail({
      to: email,
      subject: 'Planning your next trip? Stay connected with MobiaL',
      html,
    });

    return { success: result.success, error: result.error };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send travel reminder';
    console.error('[EmailService] sendTravelAgainReminder error:', message);
    return { success: false, error: message };
  }
}
