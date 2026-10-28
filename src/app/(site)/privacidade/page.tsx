import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Política de Privacidade", alternates: { canonical: "/privacidade" } };

export default async function PrivacidadePage() {
  const s = await getSettings();
  return (
    <LegalPage title="Política de Privacidade" updated="27/10/2026">
      <h2>1. Responsável pelo tratamento</h2>
      <p>{s.legalName}, NIF {s.nif}, com sede em {s.addressLine}, {s.postalCode} {s.city}. Contacto para questões de privacidade: <a href={`mailto:${s.email}`}>{s.email}</a>.</p>
      <h2>2. Dados que recolhemos</h2>
      <ul>
        <li>Dados de identificação e contacto (nome, email, telefone) que nos envia nos formulários.</li>
        <li>Dados da viatura para retoma ou oficina (marca, modelo, ano, quilómetros, matrícula, fotografias).</li>
        <li>Data e hora pretendidas para test-drive ou marcação de oficina.</li>
        <li>Um identificador pseudonimizado (hash) do endereço IP, usado apenas para prevenção de abuso e contagem de visualizações. Não guardamos o IP em claro.</li>
      </ul>
      <h2>3. Finalidades e fundamentos de licitude</h2>
      <ul>
        <li><strong>Responder a pedidos de informação, test-drive, retoma e contacto</strong> — diligências pré-contratuais a seu pedido (art. 6.º, n.º 1, al. b) do RGPD) e consentimento.</li>
        <li><strong>Gestão de marcações de oficina</strong> — execução de contrato.</li>
        <li><strong>Segurança e prevenção de spam</strong> — interesse legítimo (art. 6.º, n.º 1, al. f)).</li>
        <li><strong>Cumprimento de obrigações legais</strong> (faturação, garantia) — obrigação legal.</li>
      </ul>
      <h2>4. Prazo de conservação</h2>
      <p>Pedidos que não resultem em negócio são apagados ao fim de 24 meses. Dados de clientes são conservados pelo período exigido por lei (p. ex., 10 anos para documentos fiscais) e pelo período de garantia.</p>
      <h2>5. Destinatários</h2>
      <p>Prestadores que nos ajudam a operar o site (alojamento e base de dados — Netlify; envio de emails — Resend, se ativo) e, apenas com o seu pedido, instituições de crédito parceiras. Não vendemos dados a terceiros.</p>
      <h2>6. Transferências internacionais</h2>
      <p>Alguns prestadores podem tratar dados fora do EEE, ao abrigo de cláusulas contratuais-tipo aprovadas pela Comissão Europeia ou do Quadro de Privacidade de Dados UE-EUA.</p>
      <h2>7. Os seus direitos</h2>
      <p>Pode exercer os direitos de acesso, retificação, apagamento, limitação, portabilidade e oposição, e retirar o consentimento a qualquer momento, através de <a href={`mailto:${s.email}`}>{s.email}</a>. Tem ainda o direito de apresentar reclamação à Comissão Nacional de Proteção de Dados (<a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer">www.cnpd.pt</a>).</p>
      <h2>8. Cookies</h2>
      <p>Consulte a <a href="/cookies">Política de Cookies</a>.</p>
    </LegalPage>
  );
}
