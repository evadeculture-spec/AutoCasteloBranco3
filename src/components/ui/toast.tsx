"use client";

import { useEffect, useState } from "react";

type Toast = { id: number; message: string };

export function toast(message: string) {
  window.dispatchEvent(new CustomEvent("acb:toast", { detail: message }));
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    let id = 0;
    const onToast = (e: Event) => {
      const message = (e as CustomEvent<string>).detail;
      const t = { id: ++id, message };
      setItems((prev) => [...prev.slice(-2), t]);
      window.setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), 3200);
    };
    window.addEventListener("acb:toast", onToast);
    return () => window.removeEventListener("acb:toast", onToast);
  }, []);
  return (
    <div
      aria-live="polite"
      role="status"
      className="pointer-events-none fixed inset-x-0 top-14 z-[70] flex flex-col items-center gap-2 px-4"
    >
      {items.map((t) => (
        <div key={t.id} className="animate-fade-up rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          {t.message}
        </div>
      ))}
    </div>
  );
}
