"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { readConsent, writeConsent, type Consent } from "@/lib/consent";

function subscribe(cb: () => void) {
  window.addEventListener("acb:consent", cb);
  return () => window.removeEventListener("acb:consent", cb);
}
let lastRaw: string | null = null;
let lastVal: Consent | null = null;
function getSnapshot() {
  const raw = document.cookie;
  if (raw !== lastRaw) {
    lastRaw = raw;
    lastVal = readConsent();
  }
  return lastVal;
}

export function useConsent(): { consent: Consent | null; ready: boolean } {
  const consent = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  return { consent, ready };
}

export function openCookiePreferences() {
  window.dispatchEvent(new Event("acb:open-cookies"));
}

export function CookiePreferencesButton() {
  return (
    <button type="button" onClick={openCookiePreferences} className="inline-flex min-h-9 items-center text-left hover:text-signal-ink">
      Preferências de cookies
    </button>
  );
}

export function CookieBanner() {
  const { consent } = useConsent();
  const pathname = usePathname();
  const [custom, setCustom] = useState(false);
  const [forced, setForced] = useState(false);
  const [prefs, setPrefs] = useState({ preferences: true, external: false });
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const open = () => {
      const c = readConsent();
      setPrefs({ preferences: c?.preferences ?? true, external: c?.external ?? false });
      setCustom(true);
      setForced(true);
    };
    window.addEventListener("acb:open-cookies", open);
    return () => window.removeEventListener("acb:open-cookies", open);
  }, []);

  // No servidor (e na hidratação) o banner é sempre renderizado: pinta logo no primeiro frame.
  // Quem já consentiu não o vê graças ao script inline em <head> (atributo data-consent).
  const visible = forced || !consent;
  useEffect(() => {
    if (visible && forced) ref.current?.querySelector<HTMLElement>("input,button")?.focus();
  }, [visible, forced]);

  // O backoffice só usa cookies estritamente necessários (sessão)
  if (!visible || pathname.startsWith("/admin")) return null;

  const save = (c: { preferences: boolean; external: boolean }) => {
    writeConsent(c);
    setForced(false);
    setCustom(false);
  };

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      data-cookie-banner={forced ? "forced" : ""}
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-xl rounded-2xl border border-line-strong bg-surface p-5 shadow-[0_12px_40px_-12px_rgba(17,18,20,0.25)] md:left-auto md:right-6 md:bottom-6"
    >
      <h2 id={titleId} className="text-base font-semibold">Cookies e privacidade</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
        Usamos cookies estritamente necessários para o site funcionar. Com o seu consentimento, guardamos preferências e
        carregamos conteúdos externos (mapa OpenStreetMap). Não usamos cookies de publicidade.{" "}
        <Link href="/cookies" className="link">Saber mais</Link>
      </p>
      {custom && (
        <fieldset className="mt-4 space-y-3 rounded-xl border border-line p-3">
          <legend className="sr-only">Categorias de cookies</legend>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" checked disabled className="mt-0.5 h-5 w-5 accent-ink" />
            <span><strong className="font-medium">Necessários</strong> — segurança, registo do consentimento e as listas de favoritos/comparação que cria (guardadas só neste dispositivo). Sempre ativos.</span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" checked={prefs.preferences} onChange={(e) => setPrefs((p) => ({ ...p, preferences: e.target.checked }))} className="mt-0.5 h-5 w-5 accent-[#111214]" />
            <span><strong className="font-medium">Preferências</strong> — lembrar a última pesquisa feita na página inicial.</span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" checked={prefs.external} onChange={(e) => setPrefs((p) => ({ ...p, external: e.target.checked }))} className="mt-0.5 h-5 w-5 accent-[#111214]" />
            <span><strong className="font-medium">Conteúdos externos</strong> — mapa interativo (OpenStreetMap), que pode registar o seu IP.</span>
          </label>
        </fieldset>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {custom ? (
          <button type="button" className="btn btn-dark btn-sm" onClick={() => save(prefs)}>Guardar preferências</button>
        ) : (
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCustom(true)}>Personalizar</button>
        )}
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => save({ preferences: false, external: false })}>Rejeitar opcionais</button>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => save({ preferences: true, external: true })}>Aceitar todos</button>
      </div>
    </div>
  );
}
