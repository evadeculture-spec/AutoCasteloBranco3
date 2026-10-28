"use client";

import { useEffect } from "react";
import { CalendarCheck, MessageCircle, Phone } from "lucide-react";

export function MobileActionBar({ tel, whatsapp }: { tel: string; whatsapp: string }) {
  return (
    <nav aria-label="Ações rápidas" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <div className="grid grid-cols-3 gap-2 p-2.5">
        <a href={tel} className="btn btn-secondary !px-2">
          <Phone className="h-4 w-4" aria-hidden="true" /> Ligar
        </a>
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-secondary !px-2">
          <MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp
        </a>
        <a
          href="#marcar-visita"
          className="btn btn-primary !px-2"
          onClick={() => window.dispatchEvent(new Event("acb:test-drive"))}
        >
          <CalendarCheck className="h-4 w-4" aria-hidden="true" /> Visita
        </a>
      </div>
    </nav>
  );
}

export function ViewBeacon({ id }: { id: string }) {
  // Conta a visualização no servidor (1 por visitante/dia), sem afetar a cache da página
  useEffect(() => {
    const key = `acb:viewed:${id}:${new Date().toISOString().slice(0, 10)}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* armazenamento indisponível */
    }
    const url = `/api/vehicles/${id}/view`;
    if (!navigator.sendBeacon?.(url)) void fetch(url, { method: "POST", keepalive: true });
  }, [id]);
  return null;
}
