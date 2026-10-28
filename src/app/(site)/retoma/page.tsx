import type { Metadata } from "next";
import { TradeInForm } from "@/components/forms/trade-in-form";
import { listPublicOptions } from "@/lib/vehicles";

export const metadata: Metadata = {
  title: "Retoma — avaliamos o seu carro",
  description: "Peça a avaliação de retoma da sua viatura em 4 passos. Proposta em até 2 dias úteis, com desconto direto na compra.",
  alternates: { canonical: "/retoma" },
};

export default async function RetomaPage() {
  const items = await listPublicOptions();
  const options = items.map((v) => `${v.brand} ${v.model} ${v.version} (${v.year})`);
  return (
    <div className="container-page grid gap-8 pt-8 md:pt-12 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <p className="spec-label">Retoma · 4 passos · 3 minutos</p>
        <h1 className="mt-2 text-3xl md:text-[42px] md:leading-[1.05]">Quanto vale o seu carro?</h1>
        <p className="mt-4 text-ink-2">Avaliamos a sua viatura com o mesmo critério que usamos na oficina. A proposta é enviada por escrito e o valor é descontado na compra de qualquer viatura do stand.</p>
        <ol className="mt-8 space-y-4">
          {[
            ["Envie os dados", "Marca, modelo, quilómetros e estado."],
            ["Recebe uma proposta", "Em até 2 dias úteis, por email ou telefone."],
            ["Confirmamos na visita", "Inspeção rápida na nossa oficina, sem compromisso."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="num grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink text-sm text-white">{i + 1}</span>
              <div>
                <p className="font-medium">{t}</p>
                <p className="text-sm text-muted">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div className="lg:col-span-8">
        <TradeInForm vehicleOptions={options} />
      </div>
    </div>
  );
}
