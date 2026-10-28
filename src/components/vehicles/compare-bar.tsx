"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { compareStore, useList } from "@/lib/list-store";
import { cn } from "@/lib/format";

export function CompareBar() {
  const list = useList(compareStore);
  const pathname = usePathname();
  if (!list.length || pathname.startsWith("/comparar")) return null;
  const onDetail = /^\/viaturas\/[^/]+$/.test(pathname);
  const href = `/comparar?ids=${list.map((v) => v.id).join(",")}`;
  return (
    <aside
      aria-label="Viaturas a comparar"
      className={cn(
        "fixed inset-x-3 z-40 mx-auto max-w-3xl animate-fade-up rounded-2xl border border-ink bg-ink p-2 text-white shadow-[0_16px_40px_-16px_rgba(0,0,0,0.5)] md:bottom-5",
        onDetail ? "bottom-[84px]" : "bottom-3",
      )}
    >
      <div className="flex items-center gap-2">
        <p className="spec-label hidden pl-2 !text-white/60 sm:block">Comparar</p>
        <ul className="flex min-w-0 flex-1 gap-1.5">
          {list.map((v) => (
            <li key={v.id} className="flex min-w-0 items-center gap-2 rounded-xl bg-white/10 py-1 pl-1 pr-1">
              {v.image && (
                <Image src={v.image} alt="" width={48} height={32} className="hidden h-8 w-12 rounded-lg object-cover sm:block" />
              )}
              <span className="truncate text-[13px] font-medium">{v.title}</span>
              <button
                type="button"
                onClick={() => compareStore.remove(v.id)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg hover:bg-white/15"
                aria-label={`Remover ${v.title} da comparação`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
          {Array.from({ length: compareStore.max - list.length }).map((_, i) => (
            <li key={i} aria-hidden="true" className="hidden flex-1 rounded-xl border border-dashed border-white/20 md:block" />
          ))}
        </ul>
        <Link
          href={href}
          aria-disabled={list.length < 2}
          className={cn("btn btn-primary btn-sm shrink-0", list.length < 2 && "pointer-events-none opacity-60")}
        >
          Comparar <span className="num">{list.length}/3</span>
        </Link>
      </div>
    </aside>
  );
}
