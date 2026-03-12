'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface CookiePreferences {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  thirdParty: boolean;
  timestamp: string;
}

const STORAGE_KEY = 'cookie-consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [thirdParty, setThirdParty] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const timer = setTimeout(() => setVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
    }, 300);
  }, []);

  const saveConsent = useCallback(async (prefs: CookiePreferences) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    dismiss();
    try {
      await fetch('/api/gdpr/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essential: prefs.essential,
          analytics: prefs.analytics,
          marketing: prefs.marketing,
          thirdParty: prefs.thirdParty,
        }),
      });
    } catch {
      // Consent stored locally even if server-side fails
    }
  }, [dismiss]);

  const acceptAll = useCallback(() => {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
      thirdParty: true,
      timestamp: new Date().toISOString(),
    });
  }, [saveConsent]);

  const acceptEssential = useCallback(() => {
    saveConsent({
      essential: true,
      analytics: false,
      marketing: false,
      thirdParty: false,
      timestamp: new Date().toISOString(),
    });
  }, [saveConsent]);

  const savePreferences = useCallback(() => {
    saveConsent({
      essential: true,
      analytics,
      marketing,
      thirdParty,
      timestamp: new Date().toISOString(),
    });
  }, [saveConsent, analytics, marketing, thirdParty]);

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          closing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={acceptEssential}
        aria-hidden="true"
      />

      {/* Banner */}
      <div
        role="dialog"
        aria-label="Cookie consent"
        className={`fixed bottom-0 left-0 right-0 z-[9999] flex justify-center p-4 transition-all duration-300 ${
          closing
            ? 'translate-y-full opacity-0'
            : 'translate-y-0 opacity-100'
        }`}
      >
        <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[oklch(0.14_0.02_220)] shadow-2xl backdrop-blur-xl">
          <div className="p-5">
            <h2 className="mb-2 text-base font-semibold text-white">
              We value your privacy
            </h2>
            <p className="mb-4 text-sm leading-relaxed text-white/60">
              We use cookies to improve your experience and analyze site traffic.
              Read our{' '}
              <Link
                href="/privacy"
                className="text-[oklch(0.65_0.12_210)] underline underline-offset-2 hover:text-[oklch(0.75_0.12_210)]"
              >
                privacy policy
              </Link>{' '}
              for details.
            </p>

            {/* Preference toggles */}
            {showPreferences && (
              <div className="mb-4 space-y-3 rounded-xl border border-white/8 bg-white/[0.03] p-4">
                {/* Essential - always on */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Essential</p>
                    <p className="text-xs text-white/40">Required for the site to function</p>
                  </div>
                  <div className="relative h-6 w-11 cursor-not-allowed rounded-full bg-[oklch(0.65_0.12_210)] opacity-60">
                    <div className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm" />
                  </div>
                </div>

                {/* Analytics */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Analytics</p>
                    <p className="text-xs text-white/40">Help us understand site usage</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={analytics}
                    onClick={() => setAnalytics(!analytics)}
                    className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
                      analytics ? 'bg-[oklch(0.65_0.12_210)]' : 'bg-white/15'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        analytics ? 'translate-x-[22px]' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Marketing */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Marketing</p>
                    <p className="text-xs text-white/40">Personalized promotions and offers</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={marketing}
                    onClick={() => setMarketing(!marketing)}
                    className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
                      marketing ? 'bg-[oklch(0.65_0.12_210)]' : 'bg-white/15'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        marketing ? 'translate-x-[22px]' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Third-party */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Third-party</p>
                    <p className="text-xs text-white/40">Share data with trusted partners</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={thirdParty}
                    onClick={() => setThirdParty(!thirdParty)}
                    className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
                      thirdParty ? 'bg-[oklch(0.65_0.12_210)]' : 'bg-white/15'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        thirdParty ? 'translate-x-[22px]' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              {!showPreferences ? (
                <button
                  type="button"
                  onClick={() => setShowPreferences(true)}
                  className="order-3 rounded-lg px-4 py-2 text-sm font-medium text-white/50 transition-colors hover:text-white/80 sm:order-1"
                >
                  Manage Preferences
                </button>
              ) : (
                <button
                  type="button"
                  onClick={savePreferences}
                  className="order-3 rounded-lg px-4 py-2 text-sm font-medium text-white/50 transition-colors hover:text-white/80 sm:order-1"
                >
                  Save Preferences
                </button>
              )}
              <button
                type="button"
                onClick={acceptEssential}
                className="order-2 rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/[0.1]"
              >
                Essential Only
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="order-1 rounded-lg bg-[oklch(0.65_0.12_210)] px-4 py-2 text-sm font-semibold text-[oklch(0.12_0.015_220)] transition-colors hover:bg-[oklch(0.72_0.12_210)] sm:order-3"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
