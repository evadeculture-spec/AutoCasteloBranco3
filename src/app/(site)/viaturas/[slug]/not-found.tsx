import Link from "next/link";

export default function VehicleNotFound() {
  return (
    <div className="container-page py-20">
      <div className="card tick-grid mx-auto max-w-2xl p-8 text-center md:p-12">
        <p className="spec-label">Erro 404</p>
        <h1 className="mt-2 text-3xl">Esta viatura já não está disponível</h1>
        <p className="mt-3 text-ink-2">Pode ter sido vendida ou retirada. Temos outras parecidas à sua espera.</p>
        <Link href="/viaturas" className="btn btn-primary mt-6">Ver viaturas disponíveis</Link>
      </div>
    </div>
  );
}
