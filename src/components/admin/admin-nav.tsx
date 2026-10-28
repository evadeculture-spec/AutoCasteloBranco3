"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Car, ExternalLink, Inbox, LayoutDashboard, Settings, Wrench } from "lucide-react";
import { cn } from "@/lib/format";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/viaturas", label: "Viaturas", icon: Car },
  { href: "/admin/leads", label: "Leads", icon: Inbox },
  { href: "/admin/oficina", label: "Marcações", icon: CalendarDays, exact: true },
  { href: "/admin/oficina/servicos", label: "Serviços", icon: Wrench },
  { href: "/admin/oficina/horario", label: "Horário e vagas", icon: CalendarDays },
  { href: "/admin/definicoes", label: "Definições", icon: Settings },
];

export function AdminNav({ newLeads }: { newLeads: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Backoffice">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col">
        {LINKS.map((l) => {
          const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
          return (
            <li key={l.href} className="shrink-0">
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-sm font-medium transition-colors duration-150",
                  active ? "bg-ink text-white" : "text-ink-2 hover:bg-subtle hover:text-ink",
                )}
              >
                <l.icon className="h-4 w-4" aria-hidden="true" />
                {l.label}
                {l.href === "/admin/leads" && newLeads > 0 && (
                  <span className="num ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-signal px-1.5 text-[11px] text-ink">{newLeads}</span>
                )}
              </Link>
            </li>
          );
        })}
        <li className="shrink-0 lg:mt-4">
          <Link href="/" target="_blank" className="flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-sm text-muted hover:bg-subtle hover:text-ink">
            <ExternalLink className="h-4 w-4" aria-hidden="true" /> Ver site
          </Link>
        </li>
      </ul>
    </nav>
  );
}
