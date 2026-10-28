import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CalendarClock, ClipboardCheck, Clock, Mail, MapPin, Phone, Repeat, ShieldCheck, Wrench } from "lucide-react";
import { JsonLd } from "@/components/site/json-ld";
import { MapEmbed } from "@/components/site/map-embed";
import { SmartSearch } from "@/components/home/smart-search";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { FUEL_LABELS } from "@/lib/labels";
import { formatKm, formatNumber, formatPrice } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { absoluteUrl, telHref } from "@/lib/site";
import { getFacets, getFeatured, type VehicleCard as Card } from "@/lib/vehicles";
import { getActiveServices } from "@/lib/workshop";

export const revalidate = 600;

const TESTIMONIALS = [
  { name: "Cliente exemplo A.", place: "Castelo Branco", text: "Explicaram-me tudo o que foi feito ao carro antes da entrega. Seis meses depois fiz a revisão na mesma oficina." },
  { name: "Cliente exemplo B.", place: "Fundão", text: "A retoma foi avaliada no momento e o valor ficou por escrito. Processo rápido e sem surpresas." },
  { name: "Cliente exemplo C.", place: "Idanha-a-Nova", text: "Marquei a revisão online, escolhi a hora e o carro estava pronto ao fim da manhã." },
];

function MiniCard({ v, big = false }: { v: Card; big?: boolean }) {
  return (
    <Link
      href={`/viaturas/${v.slug}`}
      className={`group card relative flex overflow-hidden transition-colors duration-200 hover:border-ink ${big ? "col-span-2 flex-col sm:flex-row" : "flex-col"}`}
    >
      <div className={`relative bg-subtle ${big ? "aspect-[3/2] sm:aspect-auto sm:w-[58%]" : "aspect-[3/2]"}`}>
        {v.cover && <Image src={v.cover.url} alt={v.cover.alt} fill sizes={big ? "(min-width: 1024px) 26vw, 90vw" : "(min-width: 1024px) 18vw, 45vw"} preload={big} loading="eager" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />}
        <span className="badge badge-ok absolute left-2.5 top-2.5">Revisto</span>
      </div>
      <div className={`flex flex-1 flex-col justify-between gap-2 p-3.5 ${big ? "sm:p-4" : ""}`}>
        <div>
          <p className={`font-semibold leading-tight ${big ? "text-lg" : "text-[15px]"}`}>{v.brand} {v.model}</p>
          <p className="num mt-1 text-[12px] text-muted">{v.year} · {formatKm(v.km)} · {FUEL_LABELS[v.fuel]}</p>
        </div>
        <div className="flex items-end justify-between">
          <p className={`num font-semibold tracking-tight ${big ? "text-2xl" : "text-lg"}`}>{formatPrice(v.price)}</p>
          <ArrowUpRight className="h-4 w-4 text-muted transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const [facets, featured, settings, services] = await Promise.all([getFacets(), getFeatured(7), getSettings(), getActiveServices()]);
  const brands = facets.brands.map((b) => b.brand);
  const models = facets.brands.flatMap((b) => b.models.map((m) => ({ brand: b.brand, model: m.model })));
  const [hero1, hero2, hero3, ...rest] = featured;

  const localBusiness = {
    "@context": "https://schema.org",
    "@type": ["AutoDealer", "AutoRepair"],
    name: settings.businessName,
    url: absoluteUrl("/"),
    telephone: settings.phone,
    email: settings.email,
    image: absoluteUrl("/icon.svg"),
    priceRange: "€€",
    address: { "@type": "PostalAddress", streetAddress: settings.addressLine, postalCode: settings.postalCode, addressLocality: settings.city, addressCountry: "PT" },
    geo: { "@type": "GeoCoordinates", latitude: settings.latitude, longitude: settings.longitude },
    openingHoursSpecification: [
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "19:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "09:00", closes: "13:00" },
    ],
  };

  return (
    <>
      <JsonLd data={localBusiness} />
      {/* HERO — a pesquisa é a protagonista */}
      <section className="border-b border-line">
        <div className="container-page grid gap-10 py-10 md:py-14 lg:grid-cols-12 lg:gap-10 lg:py-16">
          <div className="flex flex-col justify-center lg:col-span-7">
            <p className="spec-label flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-signal" aria-hidden="true" />
              Castelo Branco · Stand + oficina própria
            </p>
            <h1 className="mt-4 text-[40px] leading-[1.02] tracking-[-0.045em] sm:text-[52px] lg:text-[64px]">
              Diga-nos o que procura.
              <span className="block text-muted">Nós já o revimos.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-ink-2">
              Escreva como falaria connosco ao balcão. Cada viatura passa por uma inspeção de 120 pontos na nossa oficina antes de chegar ao stand.
            </p>
            <div className="mt-7">
              <SmartSearch brands={brands} models={models} initialTotal={facets.total} />
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-ink-2">
              <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-40 motion-reduce:hidden" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-ok" />
              </span>
              <span><strong className="num text-ink">{formatNumber(facets.total)}</strong> viaturas disponíveis agora · desde <span className="num">{formatPrice(facets.priceMin)}</span></span>
            </p>
          </div>

          <div className="lg:col-span-5">
            <div className="grid grid-cols-2 gap-3">
              {hero1 && <MiniCard v={hero1} big />}
              {hero2 && <MiniCard v={hero2} />}
              {hero3 && <MiniCard v={hero3} />}
              <Link href="/oficina#marcar" className="group relative col-span-2 flex items-center justify-between gap-4 overflow-hidden rounded-[16px] bg-ink p-5 text-white">
                <div className="relative z-10">
                  <p className="spec-label !text-white/60">Oficina · vagas online</p>
                  <p className="mt-1.5 text-xl font-semibold tracking-tight">Marcar revisão ou reparação</p>
                  <p className="mt-1 text-sm text-white/70">Escolha o dia e a hora. Confirmação imediata.</p>
                </div>
                <span className="relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-full bg-signal text-ink transition-transform duration-200 group-hover:translate-x-1">
                  <CalendarClock className="h-5 w-5" aria-hidden="true" />
                </span>
                <span aria-hidden="true" className="absolute -right-10 -top-10 h-40 w-40 rounded-full border border-white/10" />
                <span aria-hidden="true" className="absolute -right-2 -top-2 h-24 w-24 rounded-full border border-white/10" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PORQUE COMPRAR AQUI */}
      <section className="container-page py-16 md:py-20" aria-labelledby="porque-t">
        <div className="mb-8 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="spec-label">01 — Garantias</p>
            <h2 id="porque-t" className="mt-2 text-3xl md:text-4xl">Porque comprar aqui</h2>
          </div>
          <p className="max-w-md text-ink-2">Somos stand e oficina ao mesmo tempo. Vendemos carros que conseguimos manter — e isso muda tudo.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-4 md:grid-rows-2">
          <div className="card flex flex-col justify-between p-6 md:col-span-2 md:row-span-2">
            <ClipboardCheck className="h-6 w-6 text-signal-ink" aria-hidden="true" />
            <div className="mt-10">
              <p className="num text-[72px] font-semibold leading-none tracking-[-0.05em] md:text-[96px]">120</p>
              <h3 className="mt-2 text-xl">Pontos de inspeção</h3>
              <p className="mt-2 max-w-md text-ink-2">Travões, suspensão, diagnóstico eletrónico, pneus, carroçaria e estado da bateria em híbridos e elétricos. Entregamos o relatório com a viatura.</p>
            </div>
          </div>
          <div className="card p-6 md:col-span-2">
            <div className="flex items-start justify-between">
              <h3 className="text-xl">Garantia até 24 meses</h3>
              <ShieldCheck className="h-6 w-6 text-signal-ink" aria-hidden="true" />
            </div>
            <p className="mt-2 text-ink-2">Mínimo legal de 18 meses em todas as viaturas de particulares, com assistência feita por nós.</p>
          </div>
          <div className="card p-6">
            <Wrench className="h-6 w-6 text-signal-ink" aria-hidden="true" />
            <h3 className="mt-6 text-lg">Oficina própria</h3>
            <p className="mt-1 text-sm text-ink-2">Revisões futuras no mesmo sítio, com o histórico do seu carro.</p>
          </div>
          <Link href="/retoma" className="card group p-6 transition-colors duration-200 hover:border-ink">
            <Repeat className="h-6 w-6 text-signal-ink" aria-hidden="true" />
            <h3 className="mt-6 flex items-center gap-1 text-lg">Retoma <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" /></h3>
            <p className="mt-1 text-sm text-ink-2">Avaliamos o seu carro e descontamos no valor.</p>
          </Link>
        </div>
      </section>

      {/* DESTAQUES */}
      {rest.length > 0 && (
        <section className="container-page" aria-labelledby="destaques-t">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="spec-label">02 — Montra</p>
              <h2 id="destaques-t" className="mt-2 text-3xl md:text-4xl">Acabados de chegar</h2>
            </div>
            <Link href="/viaturas" className="btn btn-secondary btn-sm">Ver todas <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rest.slice(0, 4).map((v) => (
              <li key={v.id}><VehicleCard v={v} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" /></li>
            ))}
          </ul>
        </section>
      )}

      {/* OFICINA */}
      <section className="container-page py-16 md:py-20" aria-labelledby="oficina-t">
        <div className="card grid overflow-hidden lg:grid-cols-12">
          <div className="border-b border-line p-6 md:p-8 lg:col-span-5 lg:border-b-0 lg:border-r">
            <p className="spec-label">03 — Oficina</p>
            <h2 id="oficina-t" className="mt-2 text-3xl md:text-4xl">Revisões multimarca, com hora marcada.</h2>
            <p className="mt-4 text-ink-2">Mecânicos com formação em híbridos e elétricos. Orçamento antes de qualquer trabalho. Vagas reais, atualizadas ao minuto.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/oficina#marcar" className="btn btn-primary">Marcar online</Link>
              <a href={telHref(settings.phoneWorkshop || settings.phone)} className="btn btn-secondary"><Phone className="h-4 w-4" aria-hidden="true" /> Ligar para a oficina</a>
            </div>
          </div>
          <ul className="divide-y divide-line lg:col-span-7">
            {services.slice(0, 6).map((s) => (
              <li key={s.id}>
                <Link href={`/oficina?servico=${s.slug}#marcar`} className="group flex min-h-16 items-center justify-between gap-4 px-6 py-4 transition-colors duration-150 hover:bg-bg md:px-8">
                  <span className="font-medium">{s.name}</span>
                  <span className="flex items-center gap-3">
                    {s.priceFrom != null && <span className="num text-sm text-ink-2">desde <strong className="text-ink">{formatPrice(s.priceFrom)}</strong></span>}
                    <ArrowRight className="h-4 w-4 text-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-ink" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* TESTEMUNHOS */}
      <section className="container-page" aria-labelledby="test-t">
        <div className="mb-6">
          <p className="spec-label">04 — Clientes</p>
          <h2 id="test-t" className="mt-2 text-3xl md:text-4xl">O que dizem de nós</h2>
          <p className="mt-2 text-sm text-muted">Testemunhos de exemplo para demonstração — não são de clientes reais.</p>
        </div>
        <ul className="grid gap-3 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <li key={t.name} className="card flex flex-col justify-between p-6">
              <span className="badge badge-neutral self-start">Exemplo</span>
              <blockquote className="mt-4 text-[17px] leading-relaxed">“{t.text}”</blockquote>
              <p className="mt-5 text-sm text-muted">{t.name} · {t.place}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* CONTACTOS / MAPA */}
      <section className="container-page pt-16 md:pt-20" aria-labelledby="visite-t">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="card p-6 md:p-8">
            <p className="spec-label">05 — Visite-nos</p>
            <h2 id="visite-t" className="mt-2 text-3xl">Estamos em {settings.city}</h2>
            <ul className="mt-6 space-y-4 text-[15px]">
              <li className="flex gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-muted" aria-hidden="true" /><span>{settings.addressLine}<br />{settings.postalCode} {settings.city}</span></li>
              <li className="flex gap-3"><Phone className="mt-0.5 h-5 w-5 shrink-0 text-muted" aria-hidden="true" /><a href={telHref(settings.phone)} className="link num">{settings.phone}</a></li>
              <li className="flex gap-3"><Mail className="mt-0.5 h-5 w-5 shrink-0 text-muted" aria-hidden="true" /><a href={`mailto:${settings.email}`} className="link">{settings.email}</a></li>
              <li className="flex gap-3"><Clock className="mt-0.5 h-5 w-5 shrink-0 text-muted" aria-hidden="true" /><span className="num whitespace-pre-line text-[14px]">{settings.hoursStand}</span></li>
            </ul>
            <Link href="/contactos" className="btn btn-dark mt-8">Enviar mensagem</Link>
          </div>
          <MapEmbed lat={settings.latitude} lng={settings.longitude} label={`${settings.businessName}, ${settings.city}`} />
        </div>
      </section>
    </>
  );
}
