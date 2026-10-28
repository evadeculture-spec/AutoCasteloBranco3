"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteVehicle } from "@/app/admin/actions/vehicles";

export function DeleteVehicleButton({ id, label }: { id: string; label: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="btn btn-danger"
      disabled={pending}
      onClick={() => {
        if (confirm(`Apagar definitivamente ${label}? Esta ação não pode ser desfeita. (Para retirar do site, prefira marcar como Vendido.)`)) start(() => deleteVehicle(id));
      }}
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" /> {pending ? "A apagar…" : "Apagar"}
    </button>
  );
}
