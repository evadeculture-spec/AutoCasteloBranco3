import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { SETTINGS_TAG } from "./settings";
import { VEHICLES_TAG } from "./vehicles";
import { WORKSHOP_TAG } from "./workshop";

/** Invalida imediatamente (sem servir conteúdo antigo) os dados e páginas públicas afetadas. */
export function revalidateVehicles() {
  revalidateTag(VEHICLES_TAG, { expire: 0 });
  revalidatePath("/", "layout");
}
export function revalidateWorkshop() {
  revalidateTag(WORKSHOP_TAG, { expire: 0 });
  revalidatePath("/", "layout");
}
export function revalidateSettings() {
  revalidateTag(SETTINGS_TAG, { expire: 0 });
  revalidatePath("/", "layout");
}
