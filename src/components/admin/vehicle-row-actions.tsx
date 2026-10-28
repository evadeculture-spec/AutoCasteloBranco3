"use client";

import { useTransition } from "react";
import { Copy, Star } from "lucide-react";
import { duplicateVehicle, setVehicleStatus, toggleFeatured } from "@/app/admin/actions/vehicles";
import { STATUS_KEYS, STATUS_LABELS, type StatusKey } from "@/lib/labels";
import { cn } from "@/lib/format";
import { toast } from "@/components/ui/toast";

export function StatusSelect({ id, status, label }: { id: string; status: StatusKey; label: string }) {
  const [pending, start] = useTransition();
  return (
    <select
      aria-label={`Estado de ${label}`}
      className={cn("input !min-h-9 !w-auto !py-1 text-sm", pending && "opacity-60")}
      value={status}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as StatusKey;
        start(async () => {
          await setVehicleStatus(id, next);
          toast(`Estado alterado para «${STATUS_LABELS[next]}»`);
        });
      }}
    >
      {STATUS_KEYS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
    </select>
  );
}

export function FeaturedToggle({ id, featured, label }: { id: string; featured: boolean; label: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={featured}
      aria-label={featured ? `Retirar ${label} do destaque` : `Destacar ${label} na página inicial`}
      disabled={pending}
      onClick={() => start(async () => { await toggleFeatured(id, !featured); toast(featured ? "Retirada dos destaques" : "Destacada na página inicial"); })}
      className="grid h-9 w-9 place-items-center rounded-lg hover:bg-subtle"
    >
      <Star className={cn("h-4 w-4", featured ? "fill-signal stroke-signal-ink" : "text-muted")} aria-hidden="true" />
    </button>
  );
}

export function DuplicateButton({ id, compact = false }: { id: string; compact?: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} onClick={() => start(() => duplicateVehicle(id))} className={compact ? "grid h-9 w-9 place-items-center rounded-lg hover:bg-subtle" : "btn btn-secondary"} aria-label={compact ? "Duplicar viatura" : undefined}>
      <Copy className="h-4 w-4" aria-hidden="true" />
      {!compact && (pending ? "A duplicar…" : "Duplicar")}
    </button>
  );
}
