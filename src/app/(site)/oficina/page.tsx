import type { Metadata } from "next";
import { Clock, Gauge, ShieldCheck, Zap } from "lucide-react";
import { BookingForm } from "@/components/forms/booking-form";
import { formatPrice } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { telHref } from "@/lib/site";
import { getActiveServices } from "@/lib/workshop";

export const metadata: Metadata = {
  title: "Oficina — marcação online",
  description: "Oficina multimarca em Castelo Branco: revisões, travões, diagnóstico, ar condicionado, pneus, híbridos e elétricos. Marque online com vagas reais.",
  alternates: { canonical: "/oficina" },
};

export default async function OficinaPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const [services, settings] = await Promise.all([getActiveServices(), getSettings()]);
  const initial = typeof sp.servico === "string" ? sp.servico : undefined;
  return (
    <div className="container-page pt-8 md:pt-12">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-5">
          <p className="spec-label">Oficina multimarca · Castelo Branco</p>
          <h1 className="mt-2 text-3xl md:text-[42px] md:leading-[1.05]">A mesma oficina que prepara os nossos carros.</h1>
          <p className="mt-4 text-ink-2">Orçamento sempre antes de qualquer trabalho. Peças com garantia. Vagas reais — o que vê no calendário está mesmo livre.</p>
          <a href="#marcar" className="btn btn-primary mt-5 lg:hidden">Ver vagas e marcar</a>
          <ul className="mt-6 grid grid-cols-2 gap-2 text-sm">
            {[
              [Gauge, "Diagnóstico multimarca"],
              [Zap, "Híbridos e elétricos"],
              [ShieldCheck, "Garantia de 12 meses"],
              [Clock, "Pronto no próprio dia*"],
            ].map(([Icon, t]) => {
              const I = Icon as typeof Gauge;
              return (
                <li key={t as string} className="card flex items-center gap-2.5 p-3">
                  <I className="h-4 w-4 shrink-0 text-signal-ink" aria-hidden="true" /> {t as string}
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-muted">*Na maioria das revisões e manutenções.</p>

          <h2 className="mb-3 mt-10 text-xl">Serviços e preços</h2>
          <ul className="card divide-y divide-line">
            {services.map((s) => (
              <li key={s.id} className="p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-[15px] font-semibold tracking-tight">{s.name}</h3>
                  {s.priceFrom != null && <p className="num shrink-0 text-sm">desde <strong>{formatPrice(s.priceFrom)}</strong></p>}
                </div>
                <p className="mt-1 text-sm text-muted">{s.description}</p>
                <p className="num mt-1.5 text-[12px] text-muted">≈ {s.durationMinutes} min</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Preços com IVA incluído, mão de obra incluída. Peças adicionais orçamentadas antes da reparação. Valores fictícios (demonstração).</p>
          <div className="card mt-6 p-4">
            <p className="spec-label">Horário da oficina</p>
            <p className="num mt-2 whitespace-pre-line text-sm">{settings.hoursWorkshop}</p>
            <a href={telHref(settings.phoneWorkshop || settings.phone)} className="link num mt-3 inline-block text-sm">{settings.phoneWorkshop || settings.phone}</a>
          </div>
        </div>
        <section id="marcar" aria-labelledby="marcar-t" className="min-w-0 scroll-mt-24 lg:col-span-7">
          <h2 id="marcar-t" className="mb-4 text-2xl">Marcar online</h2>
          <BookingForm services={services} initialServiceSlug={initial} address={`${settings.addressLine}, ${settings.postalCode} ${settings.city}`} />
        </section>
      </div>
    </div>
  );
}
