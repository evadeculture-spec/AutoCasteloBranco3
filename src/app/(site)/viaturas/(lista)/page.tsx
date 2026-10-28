import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FiltersPanel } from "@/components/vehicles/filters-panel";
import { ResultsToolbar } from "@/components/vehicles/results-toolbar";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { countActiveFilters, filtersHref, parseFilters, type VehicleFilters } from "@/lib/filters";
import { BODY_LABELS, FUEL_LABELS } from "@/lib/labels";
import { parseSmartQuery } from "@/lib/smart-search";
import { getFacets, listVehicles } from "@/lib/vehicles";
import { cn } from "@/lib/format";

type SP = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const f = parseFilters(await searchParams);
  const parts = [f.marca, f.modelo, ...f.tipo.map((t) => BODY_LABELS[t]), ...f.combustivel.map((c) => FUEL_LABELS[c])].filter(Boolean);
  const title = parts.length ? `${parts.join(" ")} usados em Castelo Branco` : "Viaturas usadas em Castelo Branco";
  return {
    title,
    description: "Viaturas usadas revistas com garantia. Filtre por marca, modelo, preço, ano, quilómetros, combustível e caixa.",
    alternates: { canonical: countActiveFilters(f) > 0 || f.pagina > 1 ? filtersHref(f) : "/viaturas" },
    robots: countActiveFilters(f) > 2 ? { index: false, follow: true } : undefined,
  };
}

function Pagination({ filters, page, pages }: { filters: VehicleFilters; page: number; pages: number }) {
  if (pages <= 1) return null;
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  return (
    <nav aria-label="Paginação" className="mt-10 flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link className="btn btn-secondary btn-icon" href={filtersHref({ ...filters, pagina: page - 1 })} aria-label="Página anterior">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <span className="btn btn-secondary btn-icon opacity-40" aria-hidden="true"><ChevronLeft className="h-4 w-4" /></span>
      )}
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - nums[i - 1]! > 1 && <span className="px-1 text-muted" aria-hidden="true">…</span>}
          <Link
            href={filtersHref({ ...filters, pagina: n })}
            aria-current={n === page ? "page" : undefined}
            className={cn("btn btn-icon num", n === page ? "btn-dark" : "btn-secondary")}
            aria-label={`Página ${n}`}
          >
            {n}
          </Link>
        </span>
      ))}
      {page < pages ? (
        <Link className="btn btn-secondary btn-icon" href={filtersHref({ ...filters, pagina: page + 1 })} aria-label="Página seguinte">
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <span className="btn btn-secondary btn-icon opacity-40" aria-hidden="true"><ChevronRight className="h-4 w-4" /></span>
      )}
    </nav>
  );
}

export default async function ViaturasPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const facets = await getFacets();

  // Pesquisa em texto livre sem JavaScript: converte "q" em filtros estruturados e redireciona
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  if (q) {
    const parsed = parseSmartQuery(
      q,
      facets.brands.map((b) => b.brand),
      facets.brands.flatMap((b) => b.models.map((m) => ({ brand: b.brand, model: m.model }))),
    );
    const { unmatched: _unmatched, ...rest } = parsed;
    void _unmatched;
    redirect(filtersHref({ ...rest, combustivel: rest.combustivel ?? [], tipo: rest.tipo ?? [] }));
  }

  const filters = parseFilters(sp);
  const result = await listVehicles(filters);
  const active = countActiveFilters(filters);

  return (
    <div className="container-page pt-8 md:pt-12">
      <header className="mb-8 flex flex-col gap-2">
        <p className="spec-label">Stock · atualizado ao minuto</p>
        <h1 className="text-3xl md:text-[42px] md:leading-[1.05]">Viaturas usadas</h1>
        <p className="max-w-2xl text-ink-2">
          Todas passam pela nossa oficina antes de chegarem ao stand. Preços com IVA incluído.
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[300px_1fr] lg:gap-8">
        <FiltersPanel filters={filters} facets={facets} total={result.total} />
        <section aria-labelledby="resultados-t" className="min-w-0">
          <h2 id="resultados-t" className="sr-only">Resultados</h2>
          <ResultsToolbar filters={filters} total={result.total} />
          {result.items.length ? (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {result.items.map((v, i) => (
                <li key={v.id}>
                  <VehicleCard v={v} priority={i < 2} sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw" />
                </li>
              ))}
            </ul>
          ) : (
            <div className="card tick-grid flex flex-col items-start gap-4 p-8 md:p-12">
              <p className="spec-label">0 resultados</p>
              <h2 className="text-2xl">Não temos nenhuma viatura com estes critérios — ainda.</h2>
              <p className="max-w-lg text-ink-2">
                Recebemos viaturas novas todas as semanas. Experimente alargar a pesquisa ou diga-nos o que procura e avisamos assim que chegar.
              </p>
              <div className="flex flex-wrap gap-2">
                {active > 0 && <Link href="/viaturas" className="btn btn-dark">Limpar filtros</Link>}
                {filters.precoMax != null && (
                  <Link href={filtersHref({ ...filters, precoMax: Math.round((filters.precoMax * 1.2) / 500) * 500 })} className="btn btn-secondary">
                    Subir o orçamento 20 %
                  </Link>
                )}
                <Link
                  href={`/contactos?assunto=${encodeURIComponent("Procuro uma viatura")}&mensagem=${encodeURIComponent(`Procuro uma viatura com estes critérios: ${[filters.marca, filters.modelo, ...filters.tipo.map((t) => BODY_LABELS[t]), ...filters.combustivel.map((c) => FUEL_LABELS[c]), filters.precoMax ? `até ${filters.precoMax} €` : ""].filter(Boolean).join(", ")}`)}`}
                  className="btn btn-primary"
                >
                  Avisem-me quando chegar
                </Link>
              </div>
            </div>
          )}
          <Pagination filters={filters} page={result.page} pages={result.pages} />
        </section>
      </div>
    </div>
  );
}
