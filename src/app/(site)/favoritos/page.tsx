import type { Metadata } from "next";
import { FavoritesView } from "@/components/vehicles/favorites-view";

export const metadata: Metadata = { title: "Favoritos", robots: { index: false, follow: true } };

export default function FavoritesPage() {
  return (
    <div className="container-page pt-8 md:pt-12">
      <p className="spec-label">Guardados neste dispositivo</p>
      <h1 className="mb-6 mt-2 text-3xl md:text-[42px]">Favoritos</h1>
      <FavoritesView />
    </div>
  );
}
