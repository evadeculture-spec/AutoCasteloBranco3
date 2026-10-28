export const CONSENT_COOKIE = "acb_consent";
export type Consent = { v: 1; necessary: true; preferences: boolean; external: boolean; date: string };

export function readConsent(): Consent | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie.split("; ").find((c) => c.startsWith(CONSENT_COOKIE + "="));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw.slice(CONSENT_COOKIE.length + 1))) as Consent;
    return parsed.v === 1 ? parsed : null;
  } catch {
    return null;
  }
}

export function writeConsent(c: Omit<Consent, "v" | "necessary" | "date">) {
  const value: Consent = { v: 1, necessary: true, preferences: c.preferences, external: c.external, date: new Date().toISOString() };
  const maxAge = 60 * 60 * 24 * 180; // 6 meses
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(value))}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent("acb:consent", { detail: value }));
  return value;
}
