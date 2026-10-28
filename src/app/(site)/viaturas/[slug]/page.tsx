import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, CalendarCheck, ChevronRight, MessageCircle, Phone, Receipt, ShieldCheck, Wrench } from "lucide-react";
import { JsonLd } from "@/components/site/json-ld";
import { FinanceSimulator } from "@/components/vehicles/finance-simulator";
import { Gallery } from "@/components/vehicles/gallery";
import { LeadForms } from "@/components/vehicles/lead-forms";
import { MobileActionBar, ViewBeacon } from "@/components/vehicles/mobile-action-bar";
import { CompareToggle, FavoriteButton } from "@/components/vehicles/vehicle-actions";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { BODY_LABELS, FEATURE_CATEGORY_KEYS, FEATURE_CATEGORY_LABELS, FUEL_LABELS, GEARBOX_LABELS } from "@/lib/labels";
import { formatDate, formatKm, formatNumber, formatPrice, monthYear } from "@/lib/format";
import { monthlyPayment } from "@/lib/finance";
import { getSettings } from "@/lib/settings";
import { absoluteUrl, telHref, whatsappHref } from "@/lib/site";
import { getSimilar, getVehicleBySlug } from "@/lib/vehicles";

export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const v = await getVehicleBySlug(slug);
  if (!v) return { title: "Viatura não encontrada" };
  const title = `${v.brand} ${v.model} ${v.version} ${v.year}`;
  const description = `${v.brand} ${v.model} ${v.version}, ${v.year}, ${formatKm(v.km)}, ${FUEL_LABELS[v.fuel].toLowerCase()}, caixa ${GEARBOX_LABELS[v.gearbox].toLowerCase()}. ${formatPrice(v.price)} (IVA incluído). Revisto com garantia de ${v.warrantyMonths} meses.`;
  return {
    title,
    description,
    alternates: { canonical: `/viaturas/${v.slug}` },
    openGraph: {
      type: "website",
      title: `${title} · ${formatPrice(v.price)}`,
      description,
      url: `/viaturas/${v.slug}`,
      images: v.cover ? [{ url: absoluteUrl(v.cover.url), width: 1200, height: 800, alt: v.cover.alt }] : undefined,
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function VehicleDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [v, settings] = await Promise.all([getVehicleBySlug(slug), getSettings()]);
  if (!v) notFound();
  const similar = await getSimilar(v.id, v.bodyType, v.price, 4);
  const title = `${v.brand} ${v.model}`;
  const ref = v.id.slice(0, 6).toUpperCase();
  const pageUrl = absoluteUrl(`/viaturas/${v.slug}`);
  const waText = `Olá! Tenho interesse na viatura ${title} ${v.version} (${v.year}, ${formatKm(v.km)}) por ${formatPrice(v.price)}. Ref. ${ref}. ${pageUrl}`;
  const wa = whatsappHref(settings.whatsapp, waText);
  const tel = telHref(settings.phone);
  const fromPmt = monthlyPayment(v.price * 0.8, settings.financingTan, Math.min(84, settings.financingMaxMonths));
  const stored = { id: v.id, slug: v.slug, title, image: v.cover?.url ?? null, price: v.price };

  const specs: [string, string | null][] = [
    ["Marca", v.brand],
    ["Modelo", v.model],
    ["Versão", v.version || null],
    ["Registo", monthYear(v.year, v.month)],
    ["Quilómetros", formatKm(v.km)],
    ["Combustível", FUEL_LABELS[v.fuel]],
    ["Caixa", GEARBOX_LABELS[v.gearbox]],
    ["Tipologia", BODY_LABELS[v.bodyType]],
    ["Potência", v.powerHp ? `${v.powerHp} cv` : null],
    ["Cilindrada", v.engineCc ? `${formatNumber(v.engineCc)} cm³` : null],
    ["Bateria", v.batteryKwh ? `${v.batteryKwh} kWh` : null],
    ["Autonomia (WLTP)", v.rangeKm ? formatKm(v.rangeKm) : null],
    ["Consumo", v.consumption || null],
    ["Emissões CO₂", v.co2 != null ? `${v.co2} g/km` : null],
    ["Portas / lugares", v.doors && v.seats ? `${v.doors} / ${v.seats}` : null],
    ["Cor", v.color || null],
    ["N.º de donos", v.owners ? String(v.owners) : null],
    ["Referência", ref],
  ];

  const grouped = FEATURE_CATEGORY_KEYS.map((c) => ({ c, items: v.features.filter((f) => f.category === c) })).filter((g) => g.items.length);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: `${title} ${v.version}`,
    brand: { "@type": "Brand", name: v.brand },
    model: v.model,
    vehicleConfiguration: v.version,
    productionDate: String(v.year),
    vehicleModelDate: String(v.year),
    bodyType: BODY_LABELS[v.bodyType],
    fuelType: FUEL_LABELS[v.fuel],
    vehicleTransmission: GEARBOX_LABELS[v.gearbox],
    color: v.color || undefined,
    numberOfDoors: v.doors ?? undefined,
    seatingCapacity: v.seats ?? undefined,
    mileageFromOdometer: { "@type": "QuantitativeValue", value: v.km, unitCode: "KMT" },
    vehicleEngine: v.powerHp ? { "@type": "EngineSpecification", enginePower: { "@type": "QuantitativeValue", value: v.powerHp, unitCode: "BHP" } } : undefined,
    itemCondition: "https://schema.org/UsedCondition",
    image: v.images.map((i) => absoluteUrl(i.url)),
    description: v.description,
    url: pageUrl,
    offers: {
      "@type": "Offer",
      price: v.price,
      priceCurrency: "EUR",
      availability: v.status === "reservado" ? "https://schema.org/LimitedAvailability" : "https://schema.org/InStock",
      itemCondition: "https://schema.org/UsedCondition",
      url: pageUrl,
      seller: { "@type": "AutoDealer", name: settings.businessName, telephone: settings.phone },
    },
  };

  return (
    <div className="container-page pb-28 pt-5 lg:pb-0">
      <JsonLd data={jsonLd} />
      <ViewBeacon id={v.id} />
      <nav aria-label="Caminho" className="mb-4">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
          <li><Link href="/" className="hover:text-ink">Início</Link></li>
          <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
          <li><Link href="/viaturas" className="hover:text-ink">Viaturas</Link></li>
          <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
          <li><Link href={`/viaturas?marca=${encodeURIComponent(v.brand)}`} className="hover:text-ink">{v.brand}</Link></li>
          <li aria-hidden="true"><ChevronRight className="h-3.5 w-3.5" /></li>
          <li aria-current="page" className="text-ink">{v.model}</li>
        </ol>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8">
        <div className="min-w-0 space-y-6">
          <Gallery images={v.images} title={title} />

          {/* Cabeçalho móvel */}
          <div className="lg:hidden">
            <PriceHeader v={v} title={title} fromPmt={fromPmt} stored={stored} />
          </div>

          {v.description && (
            <section className="card p-5 md:p-6" aria-labelledby="desc-t">
              <h2 id="desc-t" className="spec-label mb-3">Descrição</h2>
              <p className="text-[17px] leading-relaxed text-ink-2">{v.description}</p>
            </section>
          )}

          <section className="card p-5 md:p-6" aria-labelledby="ficha-t">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 id="ficha-t" className="text-xl">Ficha técnica</h2>
              <span className="spec-label">Ref. {ref}</span>
            </div>
            <dl className="grid gap-x-8 md:grid-cols-2">
              {specs.filter(([, val]) => val).map(([k, val]) => (
                <div key={k} className="spec-row">
                  <dt className="text-sm text-muted">{k}</dt>
                  <dd className="num text-right text-[14px] font-medium">{val}</dd>
                </div>
              ))}
            </dl>
          </section>

          {grouped.length > 0 && (
            <section className="card p-5 md:p-6" aria-labelledby="equip-t">
              <h2 id="equip-t" className="mb-4 text-xl">Equipamento</h2>
              <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
                {grouped.map((g) => (
                  <div key={g.c}>
                    <h3 className="spec-label mb-2">{FEATURE_CATEGORY_LABELS[g.c]} · {g.items.length}</h3>
                    <ul className="space-y-1.5">
                      {g.items.map((f) => (
                        <li key={f.label} className="flex items-start gap-2 text-[15px]">
                          <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-[2px] bg-signal" />
                          {f.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {v.history.length > 0 && (
            <section className="card p-5 md:p-6" aria-labelledby="hist-t">
              <h2 id="hist-t" className="mb-4 text-xl">Histórico e revisões</h2>
              <ol className="relative space-y-5 border-l border-line pl-6">
                {v.history.map((h, i) => (
                  <li key={i} className="relative">
                    <span aria-hidden="true" className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-surface ${i === 0 ? "bg-signal" : "bg-line-strong"}`} />
                    <p className="num text-[13px] text-muted">
                      {formatDate(h.date)}
                      {h.km != null && ` · ${formatKm(h.km)}`}
                    </p>
                    <p className="text-[15px] font-medium">{h.description}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start" aria-label="Preço e contacto">
          <div className="hidden lg:block">
            <PriceHeader v={v} title={title} fromPmt={fromPmt} stored={stored} />
          </div>
          <div className="card hidden gap-2 p-3 lg:grid lg:grid-cols-2">
            <a href={tel} className="btn btn-dark"><Phone className="h-4 w-4" aria-hidden="true" /> Ligar</a>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-secondary"><MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp</a>
            <a href="#marcar-visita" className="btn btn-primary col-span-2"><CalendarCheck className="h-4 w-4" aria-hidden="true" /> Marcar visita / test-drive</a>
          </div>
          <LeadForms vehicleId={v.id} title={`${title} ${v.version}`} path={`/viaturas/${v.slug}`} />
          <FinanceSimulator price={v.price} tan={settings.financingTan} taeg={settings.financingTaeg} maxMonths={settings.financingMaxMonths} compact />
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-16" aria-labelledby="semelhantes-t">
          <div className="mb-5 flex items-end justify-between">
            <h2 id="semelhantes-t" className="text-2xl">Viaturas semelhantes</h2>
            <Link href={`/viaturas?tipo=${v.bodyType}`} className="link text-sm font-medium">Ver todas</Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((s) => (
              <li key={s.id}><VehicleCard v={s} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" /></li>
            ))}
          </ul>
        </section>
      )}

      <MobileActionBar tel={tel} whatsapp={wa} />
    </div>
  );
}

function PriceHeader({
  v,
  title,
  fromPmt,
  stored,
}: {
  v: NonNullable<Awaited<ReturnType<typeof getVehicleBySlug>>>;
  title: string;
  fromPmt: number;
  stored: { id: string; slug: string; title: string; image: string | null; price: number };
}) {
  return (
    <div className="card p-5">
      <div className="flex flex-wrap gap-1.5">
        {v.status === "reservado" && <span className="badge badge-warn">Reservado</span>}
        {v.revised && <span className="badge badge-ok"><BadgeCheck className="h-3 w-3" aria-hidden="true" /> Revisto</span>}
        <span className="badge badge-neutral"><ShieldCheck className="h-3 w-3" aria-hidden="true" /> Garantia {v.warrantyMonths} meses</span>
        {v.vatDeductible && <span className="badge badge-signal"><Receipt className="h-3 w-3" aria-hidden="true" /> IVA dedutível</span>}
      </div>
      <h1 className="mt-3 text-[28px] leading-[1.1] md:text-[32px]">{title}</h1>
      <p className="mt-1 text-ink-2">{v.version}</p>
      <p className="num mt-2 text-sm text-muted">{monthYear(v.year, v.month)} · {formatKm(v.km)} · {FUEL_LABELS[v.fuel]} · {GEARBOX_LABELS[v.gearbox]}{v.powerHp ? ` · ${v.powerHp} cv` : ""}</p>
      <div className="mt-5 flex items-end justify-between gap-3 border-t border-dashed border-line pt-4">
        <div>
          {v.previousPrice && v.previousPrice > v.price && <p className="num text-sm text-muted line-through">{formatPrice(v.previousPrice)}</p>}
          <p className="num text-[36px] font-semibold leading-none tracking-tight">{formatPrice(v.price)}</p>
          <p className="mt-1.5 text-xs text-muted">IVA incluído · ou desde <span className="num font-medium text-ink">{formatPrice(Math.ceil(fromPmt))}/mês</span>*</p>
        </div>
        <FavoriteButton vehicle={stored} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <CompareToggle vehicle={stored} compact className="!px-0" />
        <span className="inline-flex items-center gap-1.5 text-ink-2"><Wrench className="h-4 w-4" aria-hidden="true" /> Inspeção de 120 pontos</span>
      </div>
      <p className="mt-3 text-[11px] text-muted">*Exemplo com 20 % de entrada e 84 meses. Ver simulador.</p>
    </div>
  );
}
