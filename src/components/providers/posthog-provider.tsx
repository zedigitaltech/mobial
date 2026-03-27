"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "./auth-provider";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!POSTHOG_KEY || !pathname) return;

    let url = window.origin + pathname;
    if (searchParams?.toString()) {
      url += "?" + searchParams.toString();
    }
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

function PostHogIdentify() {
  const { user } = useAuth();

  useEffect(() => {
    if (!POSTHOG_KEY) return;

    if (user) {
      posthog.identify(user.id, {
        email: user.email,
        name: user.name,
      });
    } else {
      posthog.reset();
    }
  }, [user]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!POSTHOG_KEY) return;

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: "identified_only",
      capture_pageview: false, // we handle this manually
      capture_pageleave: true,
      loaded: (posthog) => {
        if (process.env.NODE_ENV === "development") posthog.debug();
      },
    });
  }, []);

  if (!POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <PostHogPageView />
      <PostHogIdentify />
      {children}
    </PHProvider>
  );
}
