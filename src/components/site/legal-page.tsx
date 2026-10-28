export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="container-page pt-8 md:pt-12">
      <article className="mx-auto max-w-3xl">
        <p className="spec-label">Informação legal · atualizado a {updated}</p>
        <h1 className="mt-2 text-3xl md:text-[42px]">{title}</h1>
        <p className="mt-4 rounded-xl border border-line bg-warn-soft p-3 text-sm text-warn">
          Texto-modelo para a versão de demonstração. Deve ser revisto por um jurista antes de utilização real.
        </p>
        <div className="prose-legal mt-6">{children}</div>
      </article>
    </div>
  );
}
