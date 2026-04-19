/** URL canónica del sitio (OG, metadata). */
export const SITE_URL =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")) ||
  "https://bigboysgym.com";
