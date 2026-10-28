"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Columns3, Heart, Menu, Phone, X } from "lucide-react";
import { compareStore, favoritesStore, useList } from "@/lib/list-store";
import { NAV_LINKS, telHref } from "@/lib/site";
import { cn } from "@/lib/format";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative inline-flex min-h-11 items-center rounded-lg px-3 text-[15px] font-medium transition-colors duration-150",
        active ? "text-ink" : "text-ink-2 hover:text-ink",
      )}
    >
      {children}
      {active && <span aria-hidden="true" className="absolute inset-x-3 -bottom-[11px] h-[2px] rounded-full bg-signal" />}
    </Link>
  );
}

function Counter({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="num absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-signal px-1 text-[10px] font-semibold text-ink">
      {n}
    </span>
  );
}

export function HeaderCounters() {
  const favs = useList(favoritesStore);
  const cmp = useList(compareStore);
  return (
    <>
      <Link href="/comparar" className="btn btn-ghost btn-icon relative" aria-label={`Comparar viaturas (${cmp.length} selecionadas)`}>
        <Columns3 className="h-5 w-5" aria-hidden="true" />
        <Counter n={cmp.length} />
      </Link>
      <Link href="/favoritos" className="btn btn-ghost btn-icon relative" aria-label={`Favoritos (${favs.length})`}>
        <Heart className="h-5 w-5" aria-hidden="true" />
        <Counter n={favs.length} />
      </Link>
    </>
  );
}

export function MobileMenu({ phone }: { phone: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fecha ao mudar de página (padrão "ajustar estado durante o render")
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={btnRef}
        type="button"
        className="btn btn-ghost btn-icon"
        aria-expanded={open}
        aria-controls="menu-movel"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
      </button>
      <div
        id="menu-movel"
        ref={panelRef}
        hidden={!open}
        className="fixed inset-x-0 bottom-0 top-16 z-50 overflow-y-auto border-t border-line bg-bg"
      >
        <nav aria-label="Menu móvel" className="container-page py-4">
          <ul className="divide-y divide-line border-y border-line">
            {NAV_LINKS.map((l, i) => (
              <li key={l.href}>
                <Link href={l.href} className="flex min-h-14 items-center justify-between text-lg font-medium" aria-current={pathname.startsWith(l.href) ? "page" : undefined}>
                  {l.label}
                  <span className="spec-label">0{i + 1}</span>
                </Link>
              </li>
            ))}
            <li>
              <Link href="/favoritos" className="flex min-h-14 items-center text-lg font-medium">Favoritos</Link>
            </li>
            <li>
              <Link href="/comparar" className="flex min-h-14 items-center text-lg font-medium">Comparar</Link>
            </li>
          </ul>
          <div className="mt-6 grid gap-3">
            <a href={telHref(phone)} className="btn btn-dark">
              <Phone className="h-4 w-4" aria-hidden="true" /> Ligar {phone}
            </a>
            <Link href="/oficina#marcar" className="btn btn-primary">Marcar oficina</Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
