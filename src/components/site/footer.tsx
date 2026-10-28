import Link from "next/link";
import type { SiteSettings } from "@/lib/settings-schema";
import { NAV_LINKS, telHref } from "@/lib/site";
import { LogoMark } from "./logo";
import { CookiePreferencesButton } from "./cookie-consent";

export function Footer({ settings }: { settings: SiteSettings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-[17px] font-semibold tracking-[-0.04em]">{settings.businessName}</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            Viaturas usadas revistas na nossa própria oficina, em Castelo Branco. Preços com IVA incluído, salvo indicação em contrário.
          </p>
          <address className="mt-5 not-italic text-sm leading-relaxed text-ink-2">
            {settings.addressLine}
            <br />
            {settings.postalCode} {settings.city}
            <br />
            <a className="link num" href={telHref(settings.phone)}>{settings.phone}</a>
            {" · "}
            <a className="link" href={`mailto:${settings.email}`}>{settings.email}</a>
          </address>
        </div>
        <div className="md:col-span-2">
          <h2 className="spec-label mb-3">Navegação</h2>
          <ul className="space-y-1 text-sm">
            {NAV_LINKS.map((l) => (
              <li key={l.href}><Link className="inline-flex min-h-9 items-center hover:text-signal-ink" href={l.href}>{l.label}</Link></li>
            ))}
            <li><Link className="inline-flex min-h-9 items-center hover:text-signal-ink" href="/favoritos">Favoritos</Link></li>
            <li><Link className="inline-flex min-h-9 items-center hover:text-signal-ink" href="/comparar">Comparar</Link></li>
          </ul>
        </div>
        <div className="md:col-span-3">
          <h2 className="spec-label mb-3">Horário</h2>
          <p className="text-sm font-medium">Stand</p>
          <p className="num mb-3 whitespace-pre-line text-[13px] text-ink-2">{settings.hoursStand}</p>
          <p className="text-sm font-medium">Oficina</p>
          <p className="num whitespace-pre-line text-[13px] text-ink-2">{settings.hoursWorkshop}</p>
        </div>
        <div className="md:col-span-3">
          <h2 className="spec-label mb-3">Legal</h2>
          <ul className="space-y-1 text-sm">
            <li><Link className="inline-flex min-h-9 items-center hover:text-signal-ink" href="/privacidade">Política de Privacidade</Link></li>
            <li><Link className="inline-flex min-h-9 items-center hover:text-signal-ink" href="/cookies">Política de Cookies</Link></li>
            <li><Link className="inline-flex min-h-9 items-center hover:text-signal-ink" href="/termos">Termos e Condições</Link></li>
            <li><Link className="inline-flex min-h-9 items-center hover:text-signal-ink" href="/resolucao-de-litigios">Resolução alternativa de litígios</Link></li>
            <li><CookiePreferencesButton /></li>
          </ul>
          <a
            href="https://www.livroreclamacoes.pt/Inicio/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-line-strong px-3 text-sm font-medium hover:border-ink"
          >
            <span aria-hidden="true" className="grid h-6 w-6 place-items-center rounded bg-[#c8102e] text-[10px] font-bold text-white">LR</span>
            Livro de Reclamações Eletrónico
            <span className="sr-only">(abre numa nova janela)</span>
          </a>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <p>© {year} {settings.legalName} · NIF {settings.nif}</p>
          <p className="num">DEMO · Todos os dados apresentados são fictícios</p>
        </div>
      </div>
    </footer>
  );
}
