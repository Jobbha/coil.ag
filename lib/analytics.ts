"use client";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackPageView(path: string, title: string) {
  try {
    window.gtag?.("event", "page_view", {
      page_path: path,
      page_title: title,
    });
  } catch { /* */ }
}

export function trackEvent(action: string, params?: Record<string, unknown>) {
  try {
    window.gtag?.("event", action, params);
  } catch { /* */ }
}
