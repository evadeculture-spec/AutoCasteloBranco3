import Image from "next/image";
import Link from "next/link";
import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { Pencil, Plus } from "lucide-react";
import { db, schema } from "@/db";
import { EmptyRow, FilterTabs, PageHeader } from "@/components/admin/ui";
import { DuplicateButton, FeaturedToggle, StatusSelect } from "@/components/admin/vehicle-row-actions";
import { STATUS_KEYS, STATUS_LABELS, type StatusKey } from "@/lib/labels";
import { formatKm, formatNumber, formatPrice } from "@/lib/format";

export const metadata = { title: "Viaturas" };

export default async function AdminVehicles({ searchParams }: { searchParams: Promise<{ estado?: string; q?: string; apagada?: string }> }) {
  const sp = await searchParams;
  const estado = STATUS_KEYS.includes(sp.estado as StatusKey) ? (sp.estado as StatusKey) : undefined;
  const q = sp.q?.trim().slice(0, 60);
  const conds: SQL[] = [];
  if (estado) conds.push(eq(schema.vehicles.status, estado));
  if (q) conds.push(or(ilike(schema.vehicles.brand, `%${q}%`), ilike(schema.vehicles.model, `%${q}%`), ilike(schema.vehicles.version, `%${q}%`), ilike(schema.vehicles.slug, `%${q}%`))!);

  const [rows, counts] = await Promise.all([
    db
      .select({
        id: schema.vehicles.id,
        slug: schema.vehicles.slug,
        brand: schema.vehicles.brand,
        model: schema.vehicles.model,
        version: schema.vehicles.version,
        year: schema.vehicles.year,
        km: schema.vehicles.km,
        price: schema.vehicles.price,
        status: schema.vehicles.status,
        featured: schema.vehicles.featured,
        views: schema.vehicles.viewsCount,
        cover: sql<string | null>`(SELECT url FROM vehicle_images vi WHERE vi.vehicle_id = "vehicles"."id" ORDER BY vi.is_cover DESC, vi.position LIMIT 1)`,
        photos: sql<number>`(SELECT count(*)::int FROM vehicle_images vi WHERE vi.vehicle_id = "vehicles"."id")`,
      })
      .from(schema.vehicles)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(schema.vehicles.updatedAt)),
    db.select({ status: schema.vehicles.status, n: sql<number>`count(*)::int` }).from(schema.vehicles).groupBy(schema.vehicles.status),
  ]);
  const countOf = (s: StatusKey) => counts.find((c) => c.status === s)?.n ?? 0;
  const total = counts.reduce((a, c) => a + c.n, 0);
  const qs = (e?: string) => `/admin/viaturas?${new URLSearchParams({ ...(e ? { estado: e } : {}), ...(q ? { q } : {}) })}`;

  return (
    <>
      <PageHeader title="Viaturas" subtitle={`${formatNumber(total)} no total`} actions={<Link href="/admin/viaturas/nova" className="btn btn-primary"><Plus className="h-4 w-4" aria-hidden="true" /> Nova viatura</Link>} />
      {sp.apagada && <p role="status" className="mb-4 rounded-xl bg-ok-soft p-3 text-sm text-ok">Viatura apagada.</p>}
      <form className="mb-4 flex gap-2" role="search">
        {estado && <input type="hidden" name="estado" value={estado} />}
        <label htmlFor="q" className="sr-only">Pesquisar viaturas</label>
        <input id="q" name="q" defaultValue={q} placeholder="Pesquisar marca, modelo, versão…" className="input max-w-sm" />
        <button className="btn btn-secondary" type="submit">Pesquisar</button>
      </form>
      <FilterTabs
        current={estado ?? "todas"}
        items={[{ value: "todas", label: "Todas", href: qs(), count: total }, ...STATUS_KEYS.map((s) => ({ value: s, label: STATUS_LABELS[s], href: qs(s), count: countOf(s) }))]}
      />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="border-b border-line text-left">
            <tr className="[&>th]:p-3 [&>th]:font-medium [&>th]:text-muted">
              <th scope="col">Viatura</th>
              <th scope="col">Ano · km</th>
              <th scope="col" className="text-right">Preço</th>
              <th scope="col">Estado</th>
              <th scope="col" className="text-center">Destaque</th>
              <th scope="col" className="text-right">Visitas</th>
              <th scope="col"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((v) => {
              const label = `${v.brand} ${v.model}`;
              return (
                <tr key={v.id} className="hover:bg-bg">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-subtle">
                        {v.cover && <Image src={v.cover} alt="" fill sizes="64px" className="object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <Link href={`/admin/viaturas/${v.id}`} className="font-medium hover:underline">{label}</Link>
                        <p className="truncate text-xs text-muted">{v.version} · {v.photos} fotos</p>
                      </div>
                    </div>
                  </td>
                  <td className="num p-3">{v.year} · {formatKm(v.km)}</td>
                  <td className="num p-3 text-right font-medium">{formatPrice(v.price)}</td>
                  <td className="p-3"><StatusSelect id={v.id} status={v.status} label={label} /></td>
                  <td className="p-3 text-center"><FeaturedToggle id={v.id} featured={v.featured} label={label} /></td>
                  <td className="num p-3 text-right">{formatNumber(v.views)}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <Link href={`/admin/viaturas/${v.id}`} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-subtle" aria-label={`Editar ${label}`}><Pencil className="h-4 w-4" aria-hidden="true" /></Link>
                      <DuplicateButton id={v.id} compact />
                    </div>
                  </td>
                </tr>
              );
            })}
            {!rows.length && <EmptyRow cols={7}>Nenhuma viatura encontrada.</EmptyRow>}
          </tbody>
        </table>
      </div>
    </>
  );
}
