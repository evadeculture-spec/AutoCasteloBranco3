import { eq, sql } from "drizzle-orm";
import { LogOut } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { LogoMark } from "@/components/site/logo";
import { Toaster } from "@/components/ui/toast";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { logout } from "../actions/auth";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const [{ n } = { n: 0 }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.leads).where(eq(schema.leads.status, "nova"));
  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-line bg-surface lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:py-5">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">AutoCasteloBranco</p>
              <p className="text-xs text-muted">Backoffice</p>
            </div>
          </div>
          <form action={logout} className="lg:hidden">
            <button className="btn btn-ghost btn-sm" type="submit"><LogOut className="h-4 w-4" aria-hidden="true" /> Sair</button>
          </form>
        </div>
        <div className="px-3 pb-3">
          <AdminNav newLeads={n} />
        </div>
        <div className="mt-auto hidden border-t border-line p-3 lg:block">
          <p className="truncate px-1 text-xs text-muted">{user.name} · {user.email}</p>
          <form action={logout}>
            <button className="btn btn-ghost btn-sm mt-1 w-full !justify-start" type="submit"><LogOut className="h-4 w-4" aria-hidden="true" /> Terminar sessão</button>
          </form>
        </div>
      </aside>
      <main id="conteudo" className="min-w-0 px-4 py-6 md:px-8 md:py-8">{children}</main>
      <Toaster />
    </div>
  );
}
