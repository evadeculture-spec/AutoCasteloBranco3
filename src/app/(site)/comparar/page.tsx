import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareView } from "@/components/vehicles/compare-view";

export const metadata: Metadata = {
  title: "Comparar viaturas",
  description: "Compare até 3 viaturas lado a lado, com as diferenças destacadas.",
  robots: { index: false, follow: true },
};

export default function ComparePage() {
  return (
    <div className="container-page pt-8 md:pt-12">
      <p className="spec-label">Até 3 viaturas</p>
      <h1 className="mb-6 mt-2 text-3xl md:text-[42px]">Comparar</h1>
      <Suspense fallback={<div className="skeleton h-96" />}>
        <CompareView />
      </Suspense>
    </div>
  );
}
