import { VehicleCardSkeleton } from "@/components/vehicles/vehicle-card";

export default function Loading() {
  return (
    <div className="container-page pt-8 md:pt-12" aria-busy="true" aria-label="A carregar viaturas">
      <div className="mb-8 space-y-3">
        <div className="skeleton h-4 w-40" />
        <div className="skeleton h-10 w-72" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[300px_1fr] lg:gap-8">
        <div className="skeleton hidden h-[640px] lg:block" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <VehicleCardSkeleton key={i} />)}
        </div>
      </div>
    </div>
  );
}
