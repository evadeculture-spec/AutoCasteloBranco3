"use client";

import { Check, Columns3, Heart } from "lucide-react";
import { compareStore, favoritesStore, useList, type StoredVehicle } from "@/lib/list-store";
import { cn } from "@/lib/format";
import { toast } from "@/components/ui/toast";

export function FavoriteButton({ vehicle, className, withLabel = false }: { vehicle: StoredVehicle; className?: string; withLabel?: boolean }) {
  const list = useList(favoritesStore);
  const active = list.some((v) => v.id === vehicle.id);
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={withLabel ? undefined : active ? `Remover ${vehicle.title} dos favoritos` : `Guardar ${vehicle.title} nos favoritos`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const r = favoritesStore.toggle(vehicle);
        toast(r.added ? "Guardado nos favoritos" : "Removido dos favoritos");
      }}
      className={cn(
        withLabel ? "btn btn-secondary" : "grid h-11 w-11 place-items-center rounded-full border border-line bg-surface/95 backdrop-blur transition-transform duration-150 hover:scale-105",
        className,
      )}
    >
      <Heart className={cn("h-5 w-5 transition-colors duration-150", active ? "fill-signal stroke-signal-ink" : "")} aria-hidden="true" />
      {withLabel && <span>{active ? "Nos favoritos" : "Guardar"}</span>}
    </button>
  );
}

export function CompareToggle({ vehicle, className, compact = false }: { vehicle: StoredVehicle; className?: string; compact?: boolean }) {
  const list = useList(compareStore);
  const active = list.some((v) => v.id === vehicle.id);
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const r = compareStore.toggle(vehicle);
        if (r.full) toast("Pode comparar até 3 viaturas. Remova uma primeiro.");
        else toast(r.added ? "Adicionada à comparação" : "Removida da comparação");
      }}
      className={cn(
        compact
          ? "inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-ink-2 hover:text-ink"
          : "btn btn-secondary",
        active && compact && "text-signal-ink",
        className,
      )}
    >
      {active ? <Check className="h-4 w-4" aria-hidden="true" /> : <Columns3 className="h-4 w-4" aria-hidden="true" />}
      <span>{active ? "A comparar" : "Comparar"}</span>
    </button>
  );
}
