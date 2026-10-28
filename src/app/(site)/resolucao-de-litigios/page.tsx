import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Resolução alternativa de litígios", alternates: { canonical: "/resolucao-de-litigios" } };

export default function RalPage() {
  return (
    <LegalPage title="Resolução alternativa de litígios" updated="27/10/2026">
      <p>Nos termos da Lei n.º 144/2015, de 8 de setembro, informamos que, em caso de litígio de consumo, o consumidor pode recorrer a uma das seguintes Entidades de Resolução Alternativa de Litígios de Consumo:</p>
      <h2>CASA — Centro de Arbitragem do Setor Automóvel</h2>
      <p>Entidade especializada no setor automóvel, com competência nacional (compra e venda e reparação de viaturas).<br /><a href="https://www.arbitragemauto.pt" target="_blank" rel="noopener noreferrer">www.arbitragemauto.pt</a></p>
      <h2>CNIACC — Centro Nacional de Informação e Arbitragem de Conflitos de Consumo</h2>
      <p>Competência nacional supletiva, para zonas sem centro de arbitragem regional.<br /><a href="https://www.cniacc.pt" target="_blank" rel="noopener noreferrer">www.cniacc.pt</a></p>
      <p>Mais informação no Portal do Consumidor: <a href="https://www.consumidor.gov.pt" target="_blank" rel="noopener noreferrer">www.consumidor.gov.pt</a>.</p>
      <h2>Livro de Reclamações</h2>
      <p>Dispomos de Livro de Reclamações físico nas instalações e em formato eletrónico em <a href="https://www.livroreclamacoes.pt/Inicio/" target="_blank" rel="noopener noreferrer">www.livroreclamacoes.pt</a>.</p>
    </LegalPage>
  );
}
