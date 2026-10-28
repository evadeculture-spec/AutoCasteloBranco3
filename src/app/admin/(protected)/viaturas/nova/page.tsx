import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import { VehicleForm } from "@/components/admin/vehicle-form";

export const metadata = { title: "Nova viatura" };

export default function NewVehiclePage() {
  return (
    <>
      <PageHeader title="Nova viatura" subtitle="Depois de criar, pode adicionar as fotografias." actions={<Link href="/admin/viaturas" className="btn btn-secondary">Cancelar</Link>} />
      <VehicleForm />
    </>
  );
}
