"use client";

import { useEffect, useState } from "react";
import type { VehicleSpec } from "@/lib/vehicles";

export function useVehiclesByIds(ids: string[]) {
  const key = ids.join(",");
  const [state, setState] = useState<{ key: string; items: VehicleSpec[] } | null>(null);
  useEffect(() => {
    if (!key) return;
    const ctrl = new AbortController();
    fetch(`/api/vehicles/by-ids?ids=${encodeURIComponent(key)}`, { signal: ctrl.signal })
      .then((r) => r.json() as Promise<{ items: VehicleSpec[] }>)
      .then((d) => setState({ key, items: d.items }))
      .catch(() => {});
    return () => ctrl.abort();
  }, [key]);
  if (!key) return { items: [] as VehicleSpec[], loading: false };
  return { items: state?.key === key ? state.items : [], loading: state?.key !== key };
}
