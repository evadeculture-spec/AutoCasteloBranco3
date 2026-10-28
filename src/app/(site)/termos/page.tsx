import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Termos e Condições", alternates: { canonical: "/termos" } };

export default async function TermosPage() {
  const s = await getSettings();
  return (
    <LegalPage title="Termos e Condições" updated="27/10/2026">
      <h2>1. Identificação</h2>
      <p>Este site é explorado por {s.legalName}, NIF {s.nif}, {s.addressLine}, {s.postalCode} {s.city}. <strong>Versão de demonstração: todos os dados são fictícios.</strong></p>
      <h2>2. Informação sobre viaturas</h2>
      <p>Procuramos que a informação seja exata, mas pode conter erros. Os dados vinculativos são os constantes do contrato de compra e venda. As imagens desta demonstração são ilustrativas.</p>
      <h2>3. Preços</h2>
      <p>Os preços são apresentados em euros, com IVA incluído à taxa legal em vigor, salvo indicação em contrário. Não incluem despesas de legalização ou transferência de propriedade quando aplicáveis, que serão sempre informadas antes da compra.</p>
      <h2>4. Reservas</h2>
      <p>Uma viatura só fica reservada após confirmação escrita da nossa parte. Pedidos de informação ou test-drive não constituem reserva.</p>
      <h2>5. Garantia</h2>
      <p>Viaturas usadas vendidas a consumidores beneficiam da garantia legal prevista no Decreto-Lei n.º 84/2021 (18 meses para bens usados, por acordo entre as partes, salvo indicação de prazo superior).</p>
      <h2>6. Financiamento</h2>
      <p>As simulações de financiamento são ilustrativas e não constituem proposta contratual. O crédito está sujeito a aprovação da instituição financeira.</p>
      <h2>7. Marcações de oficina</h2>
      <p>As marcações online ficam pendentes de confirmação. Pedimos aviso de 24 horas para cancelamentos.</p>
      <h2>8. Litígios</h2>
      <p>Consulte a página de <a href="/resolucao-de-litigios">Resolução alternativa de litígios</a> e o <a href="https://www.livroreclamacoes.pt/Inicio/" target="_blank" rel="noopener noreferrer">Livro de Reclamações Eletrónico</a>. Lei aplicável: lei portuguesa.</p>
    </LegalPage>
  );
}
