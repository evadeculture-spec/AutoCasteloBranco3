"use client";

import Link from "next/link";
import { favoritesStore, useList } from "@/lib/list-store";
import { VehicleCard, VehicleCardSkeleton } from "./vehicle-card";
import { useVehiclesByIds } from "./use-vehicles-by-ids";

export function FavoritesView() {
  const list = useList(favoritesStore);
  const { items, loading } = useVehiclesByIds(list.map((v) => v.id));
  const unavailable = loading ? [] : list.filter((s) => !items.some((v) => v.id === s.id));

  if (!list.length) {
    return (
      <div className="card tick-grid flex flex-col items-start gap-4 p-8 md:p-12">
        <h2 className="text-2xl">Ainda não tem favoritos</h2>
        <p className="max-w-lg text-ink-2">Toque no coração de uma viatura para a guardar aqui. Ficam guardados apenas neste dispositivo — não precisa de conta.</p>
        <Link href="/viaturas" className="btn btn-primary">Ver viaturas</Link>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading
          ? list.map((v) => <li key={v.id}><VehicleCardSkeleton /></li>)
          : items.map((v) => <li key={v.id}><VehicleCard v={v} sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw" /></li>)}
      </ul>
      {unavailable.length > 0 && (
        <div className="card p-5">
          <h2 className="text-base font-semibold">Já não disponíveis</h2>
          <ul className="mt-3 divide-y divide-line">
            {unavailable.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span>{v.title} <span className="text-muted">— vendida ou retirada</span></span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => favoritesStore.remove(v.id)}>Remover</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => favoritesStore.clear()}>Limpar favoritos</button>
    </div>
  );
}
