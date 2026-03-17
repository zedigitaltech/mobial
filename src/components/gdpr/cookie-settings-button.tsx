'use client';

import { useTranslations } from 'next-intl';

export function CookieSettingsButton() {
  const t = useTranslations('footer');

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent('open-cookie-settings'))}
      className="text-sm text-muted-foreground hover:text-primary transition-colors"
    >
      {t('cookieSettings')}
    </button>
  );
}
