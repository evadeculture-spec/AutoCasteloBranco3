import type { Metadata } from "next";
import Link from "next/link";
import { FinanceSimulator } from "@/components/vehicles/finance-simulator";
import { formatPercent } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Financiamento automóvel",
  description: "Simule a prestação do seu carro usado. Crédito automóvel com parceiros financeiros, prazos até 120 meses.",
  alternates: { canonical: "/financiamento" },
};

export default async function FinanciamentoPage() {
  const s = await getSettings();
  return (
    <div className="container-page pt-8 md:pt-12">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <p className="spec-label">Crédito automóvel</p>
          <h1 className="mt-2 text-3xl md:text-[42px] md:leading-[1.05]">Pague o seu carro ao mês, com números claros.</h1>
          <p className="mt-4 text-ink-2">Trabalhamos com instituições de crédito parceiras e tratamos de todo o processo no stand. A resposta chega normalmente em 24 horas.</p>
          <ol className="mt-8 grid gap-3">
            {[
              ["Simule", "Escolha o valor, a entrada e o prazo."],
              ["Envie os documentos", "Cartão de Cidadão, comprovativo de morada, IBAN e últimos recibos de vencimento ou IRS."],
              ["Aprovação", "Resposta em 24–48 h. Assinatura digital ou no stand."],
              ["Levante o carro", "Revisto, legalizado e com garantia."],
            ].map(([t, d], i) => (
              <li key={t} className="card flex gap-4 p-4">
                <span className="num grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink text-white">{i + 1}</span>
                <div><p className="font-semibold">{t}</p><p className="text-sm text-muted">{d}</p></div>
              </li>
            ))}
          </ol>
          <div className="card mt-6 p-5 text-sm leading-relaxed text-ink-2">
            <h2 className="text-base font-semibold text-ink">Exemplo representativo (ilustrativo)</h2>
            <p className="mt-2">
              Para um montante de 15 000 € a 84 meses, TAN fixa de {formatPercent(s.financingTan)} e TAEG de {formatPercent(s.financingTaeg)}. Valores meramente
              ilustrativos e fictícios, sem comissões, impostos e seguros. A AutoCasteloBranco atuaria como intermediário de crédito a título acessório.
              Crédito sujeito a análise e aprovação da instituição financeira.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/viaturas" className="btn btn-primary">Escolher viatura</Link>
            <Link href="/contactos?assunto=Financiamento" className="btn btn-secondary">Pedir proposta</Link>
          </div>
        </div>
        <div className="lg:col-span-6">
          <div className="lg:sticky lg:top-20">
            <FinanceSimulator price={15000} tan={s.financingTan} taeg={s.financingTaeg} maxMonths={s.financingMaxMonths} />
          </div>
        </div>
      </div>
    </div>
  );
}
