import Link from "next/link";
import { LogoMark } from "@/components/site/logo";

export default function NotFound() {
  return (
    <main className="container-page grid min-h-dvh place-items-center py-20">
      <div className="card tick-grid max-w-xl p-8 text-center md:p-12">
        <LogoMark className="mx-auto h-10 w-10" />
        <p className="spec-label mt-6">Erro 404</p>
        <h1 className="mt-2 text-3xl">Página não encontrada</h1>
        <p className="mt-3 text-ink-2">O endereço pode estar errado ou a página foi removida.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/" className="btn btn-dark">Página inicial</Link>
          <Link href="/viaturas" className="btn btn-primary">Ver viaturas</Link>
        </div>
      </div>
    </main>
  );
}
