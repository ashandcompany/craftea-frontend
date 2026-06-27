"use client";

import Script from "next/script";
import { useCookieConsent } from "react-cookie-manager";

const UMAMI_URL = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL;
const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
const UMAMI_HOST_URL = process.env.NEXT_PUBLIC_UMAMI_HOST_URL;

export function UmamiAnalytics() {
  const { detailedConsent } = useCookieConsent();

  if (process.env.NODE_ENV !== "production") return null;
  if (!UMAMI_URL || !UMAMI_WEBSITE_ID) return null;
  if (!detailedConsent?.Analytics.consented) return null;

  return (
    <Script
      src={UMAMI_URL}
      data-website-id={UMAMI_WEBSITE_ID}
      data-host-url={UMAMI_HOST_URL}
      strategy="afterInteractive"
    />
  );
}
