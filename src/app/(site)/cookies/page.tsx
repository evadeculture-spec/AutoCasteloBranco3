import type { Metadata } from "next";
import { CookiePreferencesButton } from "@/components/site/cookie-consent";
import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Política de Cookies", alternates: { canonical: "/cookies" } };

export default function CookiesPage() {
  return (
    <LegalPage title="Política de Cookies" updated="27/10/2026">
      <p>Este site usa um número reduzido de cookies e armazenamento local. Não usamos cookies de publicidade nem de perfis.</p>
      <h2>Estritamente necessários (sempre ativos)</h2>
      <ul>
        <li><strong>acb_consent</strong> — guarda as suas escolhas de cookies. Duração: 6 meses.</li>
        <li><strong>acb_session</strong> — sessão da área de administração (só para colaboradores). Duração: 7 dias.</li>
        <li><strong>Armazenamento local acb:favoritos e acb:comparar</strong> — as listas que cria ao tocar em «Guardar» ou «Comparar». Ficam apenas no seu dispositivo.</li>
      </ul>
      <h2>Preferências (opcional)</h2>
      <ul>
        <li><strong>Armazenamento local acb:ultima-pesquisa</strong> — lembra a última pesquisa feita na página inicial.</li>
      </ul>
      <h2>Conteúdos externos (opcional)</h2>
      <ul>
        <li><strong>Mapa OpenStreetMap</strong> — ao carregar o mapa, o seu browser liga-se aos servidores da OpenStreetMap Foundation, que podem registar o seu IP. Só é carregado com o seu consentimento ou quando clica em «Carregar mapa».</li>
      </ul>
      <h2>Alterar as suas escolhas</h2>
      <p>Pode alterar ou retirar o consentimento a qualquer momento:</p>
      <div className="not-prose"><span className="btn btn-secondary btn-sm"><CookiePreferencesButton /></span></div>
    </LegalPage>
  );
}
