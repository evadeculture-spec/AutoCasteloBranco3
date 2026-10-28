import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoMark } from "@/components/site/logo";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getCurrentUser()) redirect("/admin");
  const { next } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <LogoMark />
          <span className="font-semibold tracking-tight">Backoffice</span>
        </div>
        <div className="card p-6">
          <h1 className="mb-5 text-xl">Entrar</h1>
          <LoginForm next={next} />
        </div>
        <p className="mt-4 text-center text-sm text-muted"><Link href="/" className="link">← Voltar ao site</Link></p>
      </div>
    </main>
  );
}
