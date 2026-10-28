"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { useConsent } from "./cookie-consent";

export function MapEmbed({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const { consent } = useConsent();
  const [loadOnce, setLoadOnce] = useState(false);
  const show = loadOnce || consent?.external;
  const d = 0.012;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d / 1.6},${lng + d},${lat + d / 1.6}&layer=mapnik&marker=${lat},${lng}`;
  const external = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
  return (
    <div className="card relative aspect-[4/3] overflow-hidden md:aspect-auto md:h-full md:min-h-[340px]">
      {show ? (
        <iframe title={`Mapa: ${label}`} src={src} className="absolute inset-0 h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer" />
      ) : (
        <div className="tick-grid absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-ink text-white"><MapPin className="h-5 w-5" aria-hidden="true" /></span>
          <p className="max-w-xs text-sm text-ink-2">O mapa é fornecido pelo OpenStreetMap e só é carregado com a sua autorização.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" className="btn btn-dark btn-sm" onClick={() => setLoadOnce(true)}>Carregar mapa</button>
            <a className="btn btn-secondary btn-sm" href={external} target="_blank" rel="noopener noreferrer">Abrir no OpenStreetMap<span className="sr-only"> (nova janela)</span></a>
          </div>
        </div>
      )}
    </div>
  );
}
