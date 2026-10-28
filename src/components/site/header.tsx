import Link from "next/link";
import { Phone } from "lucide-react";
import { NAV_LINKS, telHref } from "@/lib/site";
import type { SiteSettings } from "@/lib/settings-schema";
import { Logo } from "./logo";
import { HeaderCounters, MobileMenu, NavLink } from "./header-client";

export function Header({ settings }: { settings: SiteSettings }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur supports-[backdrop-filter]:bg-bg/75">
      <div className="container-page flex h-16 items-center gap-4">
        <Logo name={settings.businessName} />
        <nav aria-label="Principal" className="ml-6 hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <NavLink href={l.href}>{l.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <HeaderCounters />
          <a href={telHref(settings.phone)} className="btn btn-dark btn-sm hidden md:inline-flex">
            <Phone className="h-4 w-4" aria-hidden="true" />
            <span className="num text-[13px]">{settings.phone}</span>
          </a>
          <Link href="/oficina#marcar" className="btn btn-primary btn-sm hidden sm:inline-flex">
            Marcar oficina
          </Link>
          <MobileMenu phone={settings.phone} />
        </div>
      </div>
    </header>
  );
}
