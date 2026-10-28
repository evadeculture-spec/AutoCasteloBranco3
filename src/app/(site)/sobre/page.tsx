import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sobre nós",
  description: "Stand de usados e oficina própria em Castelo Branco. Conheça a nossa forma de trabalhar.",
  alternates: { canonical: "/sobre" },
};

const FACTS = [
  ["2009", "Ano de abertura (fictício)"],
  ["120", "Pontos de inspeção por viatura"],
  ["6", "Mecânicos na oficina"],
  ["24", "Meses de garantia máxima"],
];

export default function SobrePage() {
  return (
    <div className="container-page pt-8 md:pt-12">
      <p className="spec-label">Sobre nós</p>
      <h1 className="mt-2 max-w-3xl text-3xl md:text-[52px] md:leading-[1.02]">Começámos como oficina. Por isso vendemos carros de outra maneira.</h1>
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FACTS.map(([n, l]) => (
          <div key={l} className="card p-6">
            <p className="num text-5xl font-semibold tracking-[-0.05em]">{n}</p>
            <p className="mt-2 text-sm text-muted">{l}</p>
          </div>
        ))}
      </div>
      <div className="mt-12 grid gap-10 md:grid-cols-2">
        <div className="space-y-4 text-[17px] leading-relaxed text-ink-2">
          <p>A AutoCasteloBranco é uma empresa fictícia criada para esta demonstração. A ideia é simples: um stand de usados que também é a oficina onde os carros são preparados e, mais tarde, mantidos.</p>
          <p>Cada viatura que entra é inspecionada, reparada se necessário e documentada. O relatório de inspeção acompanha a venda, e o histórico fica disponível para as revisões seguintes.</p>
          <p>Preferimos ter menos carros, mas carros que conhecemos por dentro.</p>
        </div>
        <div className="card p-6">
          <h2 className="text-xl">Compromissos</h2>
          <ul className="mt-4 space-y-3">
            {["Preço final com IVA incluído, sem taxas escondidas", "Quilómetros verificados e histórico explicado", "Garantia mínima legal de 18 meses a particulares", "Orçamento sempre antes de qualquer reparação", "Retoma avaliada por escrito"].map((t) => (
              <li key={t} className="flex gap-3"><span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-[2px] bg-signal" /> {t}</li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/viaturas" className="btn btn-primary">Ver viaturas</Link>
            <Link href="/contactos" className="btn btn-secondary">Contactar</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
