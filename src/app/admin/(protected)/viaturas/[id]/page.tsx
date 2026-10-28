import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import { db, schema } from "@/db";
import { DeleteVehicleButton } from "@/components/admin/delete-vehicle-button";
import { ImageManager } from "@/components/admin/image-manager";
import { PageHeader, VehicleStatusBadge } from "@/components/admin/ui";
import { DuplicateButton } from "@/components/admin/vehicle-row-actions";
import { VehicleForm } from "@/components/admin/vehicle-form";
import { formatDateTime, formatNumber } from "@/lib/format";

export const metadata = { title: "Editar viatura" };

export default async function EditVehiclePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ criada?: string; duplicada?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [v] = await db.select().from(schema.vehicles).where(eq(schema.vehicles.id, id));
  if (!v) notFound();
  const [images, features] = await Promise.all([
    db.select().from(schema.vehicleImages).where(eq(schema.vehicleImages.vehicleId, id)).orderBy(asc(schema.vehicleImages.position)),
    db.select({ category: schema.vehicleFeatures.category, label: schema.vehicleFeatures.label }).from(schema.vehicleFeatures).where(eq(schema.vehicleFeatures.vehicleId, id)).orderBy(asc(schema.vehicleFeatures.position)),
  ]);
  const label = `${v.brand} ${v.model}`;
  const isPublic = v.status === "disponivel" || v.status === "reservado";
  return (
    <>
      <PageHeader
        title={label}
        subtitle={`${v.version} · atualizada ${formatDateTime(v.updatedAt)} · ${formatNumber(v.viewsCount)} visualizações`}
        actions={
          <>
            <VehicleStatusBadge s={v.status} />
            {isPublic && <Link href={`/viaturas/${v.slug}`} target="_blank" className="btn btn-secondary"><ExternalLink className="h-4 w-4" aria-hidden="true" /> Ver no site</Link>}
            <DuplicateButton id={v.id} />
            <DeleteVehicleButton id={v.id} label={label} />
          </>
        }
      />
      {sp.criada && <p role="status" className="mb-4 rounded-xl bg-ok-soft p-3 text-sm text-ok">Viatura criada. Adicione agora as fotografias{v.status === "rascunho" ? " e mude o estado para «Disponível» para a publicar" : ""}.</p>}
      {sp.duplicada && <p role="status" className="mb-4 rounded-xl bg-ok-soft p-3 text-sm text-ok">Cópia criada como rascunho.</p>}
      <div className="grid gap-6">
        <ImageManager vehicleId={v.id} images={images.map((i) => ({ id: i.id, url: i.url, alt: i.alt, isCover: i.isCover, position: i.position }))} />
        <VehicleForm vehicle={v} features={features} />
      </div>
    </>
  );
}
