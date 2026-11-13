const measurementId = "G-XPCMGJPG28";

declare global {
  interface Window {
    dataLayer?: IArguments[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function initializeAnalytics() {
  if (!import.meta.env.PROD || window.location.hostname !== "utkin-vitaliy.github.io") return;
  if (window.gtag) return;

  window.dataLayer = window.dataLayer ?? [];
  const gtag = function () {
    window.dataLayer?.push(arguments);
  } as NonNullable<Window["gtag"]>;
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", measurementId, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.append(script);
}
