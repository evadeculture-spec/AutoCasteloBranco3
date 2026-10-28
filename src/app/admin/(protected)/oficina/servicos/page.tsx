import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { PageHeader } from "@/components/admin/ui";
import { ServiceForm } from "@/components/admin/workshop-controls";

export const metadata = { title: "Serviços da oficina" };

export default async function ServicesPage() {
  const services = await db.select().from(schema.workshopServices).orderBy(asc(schema.workshopServices.position), asc(schema.workshopServices.name));
  return (
    <>
      <PageHeader title="Serviços da oficina" subtitle="Aparecem na página Oficina e no formulário de marcação (apenas os ativos)." />
      <section className="card mb-6 p-5" aria-labelledby="novo-t">
        <h2 id="novo-t" className="mb-3 text-lg">Novo serviço</h2>
        <ServiceForm />
      </section>
      <ul className="card divide-y divide-line">
        {services.map((s) => (
          <li key={s.id} className="p-5"><ServiceForm service={s} /></li>
        ))}
      </ul>
    </>
  );
}
