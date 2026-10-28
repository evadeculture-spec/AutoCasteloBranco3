# AutoCasteloBranco — MVP operacional

Site + backoffice de um stand de viaturas usadas com oficina própria em Castelo Branco.
**Versão de demonstração:** viaturas, preços, contactos, empresa e testemunhos são fictícios. As imagens das viaturas do seed são ilustrações geradas por código (sem marcas, logótipos nem pessoas).

Conceito visual: _«Oficina de precisão, montra luminosa»_ — fundo off-white quente, cartões brancos com bordas finas, um único acento laranja-sinal (`#FF5A1F`, sempre com texto quase-preto por cima para cumprir AA), Geist para títulos e Geist Mono para todos os dados técnicos (km, ano, preço, horas).

---

## Stack

| Camada | Escolha |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) + React 19 + TypeScript estrito (`strict`, `noUncheckedIndexedAccess`) |
| Estilos | Tailwind CSS 4 (tokens em `src/app/globals.css`), componentes próprios, ícones `lucide-react` |
| Base de dados | Postgres (Netlify DB / Neon ou qualquer Postgres) com Drizzle ORM + migrações em `drizzle/` |
| Imagens | Netlify Blobs em produção, disco local (`.data/uploads`) em desenvolvimento; servidas por `/api/media/*` e otimizadas com `next/image` (AVIF/WebP) |
| Autenticação | Email + password (bcrypt, custo 12), sessão aleatória guardada com hash SHA-256 na BD, cookie `httpOnly` + `SameSite=Lax` (+ `Secure` em produção). `/admin` protegido pelo `proxy.ts` (o antigo *middleware*, renomeado no Next 16) **e** por `requireAdmin()` em cada página, Server Action e rota |
| Validação | Zod 4 — os mesmos schemas no cliente (antes de submeter) e no servidor |
| Formulários | Server Actions (`useActionState`); upload de fotos do admin por route handler, uma foto de cada vez |
| Anti-spam | Honeypot + tempo mínimo de preenchimento + rate limit por IP (hash HMAC, nunca IP em claro) persistido em Postgres |
| Email | Resend via API HTTP, **só** se `RESEND_API_KEY` existir; caso contrário tudo fica apenas gravado na BD |
| Cache | `unstable_cache` com tags (`vehicles`, `workshop`, `settings`) + ISR; o admin invalida com `revalidateTag(tag, { expire: 0 })` + `revalidatePath` — alterações ficam visíveis no pedido seguinte |

## Variáveis de ambiente

Copie `.env.example` para `.env`.

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | sim* | Ligação Postgres. *Em Netlify DB é injetada automaticamente como `NETLIFY_DATABASE_URL` (também suportada). |
| `NEXT_PUBLIC_SITE_URL` | recomendada | URL público (sitemap, canonical, Open Graph). Em Netlify cai para `URL` se não existir. |
| `APP_SECRET` | sim em produção | Segredo para o HMAC dos IPs (rate limit, visualizações). String longa e aleatória. |
| `RESEND_API_KEY` | não | Ativa emails (confirmação ao cliente e notificação à equipa). |
| `EMAIL_FROM` | não | Remetente, ex.: `AutoCasteloBranco <geral@dominio.pt>` (domínio verificado no Resend). |
| `EMAIL_NOTIFY_TO` | não | Destinatários internos das notificações, separados por vírgula. |
| `STORAGE_DRIVER` | não | `local`, `blobs` ou `db` para forçar o armazenamento. Por omissão: Blobs na Netlify, tabela `media_files` no Vercel, disco local no resto. |
| `NETLIFY_SITE_ID` + `NETLIFY_BLOBS_TOKEN` | não | Só para usar os Blobs de produção a partir da sua máquina. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | não | Alternativa aos argumentos do `admin:create` e usados pelo teste E2E. |

## Arranque local

```bash
npm install
cp .env.example .env            # ajuste DATABASE_URL
npm run db:migrate              # aplica as migrações (drizzle/)
npm run db:seed                 # 18 viaturas, 8 serviços, horário, definições e alguns exemplos
npm run admin:create -- --email admin@exemplo.pt --password "uma-password-longa" --name "Nome"
npm run dev                     # http://localhost:3000  ·  backoffice em /admin
```

Postgres local rápido (Docker): `docker run -d -p 5432:5432 -e POSTGRES_USER=acb -e POSTGRES_PASSWORD=acb -e POSTGRES_DB=acb postgres:16`.

### Criar o primeiro admin

```bash
npm run admin:create -- --email pessoa@empresa.pt --password "pelo-menos-10-caracteres" --name "Nome"
# ou: ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run admin:create
```

Se o email já existir, a password é atualizada (útil para recuperar acesso). Não há registo público de contas.

### Seed

`npm run db:seed` **apaga e recria** os dados de catálogo e operação (viaturas, imagens, equipamento, leads, notas, marcações, serviços, horário, dias bloqueados, definições, visualizações, rate limits). **Mantém os utilizadores.** Não corra o seed numa BD de produção com dados reais.

As ilustrações das viaturas estão em `public/seed/` (já incluídas). Para as regenerar: `npm run images:seed`.

### Outros comandos

| Comando | O quê |
| --- | --- |
| `npm run build` / `npm start` | Build e servidor de produção |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (config Next + TypeScript) |
| `npm run db:generate` | Gera nova migração após alterar `src/db/schema.ts` |
| `npm run test:e2e` | Teste E2E com Playwright contra `http://localhost:3000` (ver abaixo) |

## Deploy na Netlify

1. Ligue o repositório a um site Netlify (o runtime de Next.js é detetado automaticamente).
2. Ative **Netlify DB** (Extensions → Neon) — cria `NETLIFY_DATABASE_URL`. Ou defina `DATABASE_URL` para outro Postgres.
3. Defina `APP_SECRET`, `NEXT_PUBLIC_SITE_URL` e, se quiser emails, as variáveis do Resend.
4. Deploy. O `netlify.toml` corre `npm run db:migrate && npm run build`. **A BD tem de estar acessível durante o build** (as páginas estáticas são pré-geradas a partir dela).
5. Uma única vez, a partir da sua máquina com `DATABASE_URL` de produção: `npm run db:seed` (opcional, só para demonstração) e `npm run admin:create -- …`.

### Deploy no Vercel (+ Postgres Supabase)

1. Crie uma base de dados Postgres (ex.: Supabase) e aplique as migrações (`npm run db:migrate` com `DATABASE_URL`, ou o SQL de `drizzle/`). Use a ligação do **pooler** (`…pooler.supabase.com:6543`), compatível com funções serverless.
2. Importe o repositório no Vercel. O `vercel.json` já define `npm run db:migrate && npm run build` e a região `cdg1` (Paris).
3. Variáveis: `DATABASE_URL`, `APP_SECRET`, `NEXT_PUBLIC_SITE_URL` (+ Resend opcional).
4. No Vercel as fotos ficam na tabela `media_files` da própria BD (`STORAGE_DRIVER=db`, escolhido automaticamente quando `VERCEL` está definido), porque o disco das funções não é persistente.
5. Se usar Supabase, ative RLS em todas as tabelas do schema `public` e retire privilégios a `anon`/`authenticated` — a app liga-se com um papel próprio, dono das tabelas, e os dados não ficam expostos pela API REST do Supabase.

As fotos carregadas no backoffice na Netlify vão para o store `acb-media` do Netlify Blobs automaticamente. As fotos de retoma (`leads/…`) só são servidas a administradores autenticados.

Limites tidos em conta: as fotos são redimensionadas **no browser** (máx. 2000 px no admin, 1400 px na retoma) antes do envio, para ficar abaixo do limite de 6 MB por pedido das funções Netlify (`serverActions.bodySizeLimit` = 5 MB).

## Estrutura

```
src/
  app/
    (site)/            páginas públicas (início, viaturas, detalhe, comparar, favoritos, retoma, oficina, financiamento, sobre, contactos, legais)
    admin/             login + (protected)/ dashboard, viaturas, leads, oficina, definições + Server Actions
    api/               media, contagem ao vivo, vagas da oficina, visualizações, upload e CSV (admin)
    actions/           Server Actions públicas (leads, retoma, marcação)
    sitemap.ts robots.ts opengraph-image.tsx
  components/          site/, vehicles/, forms/, home/, admin/, ui/
  db/                  schema.ts (Drizzle) e cliente
  lib/                 filtros, pesquisa inteligente, formatação PT, auth, storage, rate limit, email, oficina…
  proxy.ts             proteção otimista de /admin e /api/admin
scripts/               migrate, seed, create-admin, gerador de ilustrações
drizzle/               migrações SQL
tests/e2e.cjs          verificação automática dos critérios de aceitação
```

Modelo de dados: `users`, `sessions`, `vehicles`, `vehicle_images`, `vehicle_features`, `leads` (com `type` e `status`), `lead_notes`, `workshop_services`, `workshop_slots_config`, `workshop_bookings`, `blocked_days`, `settings`, `vehicle_views`, `rate_limits`. Índices em estado, marca/modelo, preço, ano, km, combustível, caixa, tipologia, destaque, e nas chaves de leads/marcações.

## Notas de funcionamento

- **Pesquisa inteligente** (`src/lib/smart-search.ts`): interpreta texto livre em PT ("SUV gasóleo até 20 000 €", "carrinha automática desde 2019 com menos de 100 000 km", "vw golf diesel", "entre 20 e 30 mil") e mostra o que entendeu e quantas viaturas correspondem, ao vivo. Sem JavaScript, o formulário faz GET para `/viaturas?q=…` e o servidor converte para filtros e redireciona.
- **Filtros no URL**: `/viaturas?marca=…&modelo=…&preco_min=…&preco_max=…&ano_min=…&ano_max=…&km_max=…&combustivel=a,b&caixa=…&tipo=a,b&ordem=…&pagina=…` — partilháveis e estáveis.
- **Oficina**: vagas = horário semanal (abertura, fecho, pausa, duração do slot, capacidade) − dias bloqueados − marcações pendentes/confirmadas; antecedência mínima de 2 h no próprio dia; 45 dias de horizonte. A criação usa uma transação com `pg_advisory_xact_lock` por dia+hora, por isso duas pessoas não conseguem ficar com a última vaga.
- **Visualizações**: contadas no servidor (`POST /api/vehicles/:id/view`), 1 por visitante/dia (hash de IP + user-agent), bots ignorados; não interfere com a cache das páginas.
- **Cookies**: banner com consentimento real por categorias (necessários / preferências / conteúdos externos). O mapa OpenStreetMap só carrega com consentimento ou por clique. Favoritos e comparação ficam em `localStorage` como funcionalidade pedida pelo utilizador. Não há analytics nem publicidade.
- **Preços** sempre com «IVA incluído»; «IVA dedutível» assinalado quando aplicável. Formatação PT: `18 500 €`, `52 300 km`, `dd/mm/aaaa`.

## Teste E2E

Com a app a correr (idealmente `npm run build && npm start`), seed feito e o admin criado:

```bash
ADMIN_EMAIL=admin@exemplo.pt ADMIN_PASSWORD=... npm run test:e2e
```

Cria uma viatura com fotos pelo backoffice, submete todos os formulários públicos, verifica leads, pipeline, notas, CSV, vendido/404, vagas da oficina, filtros no URL, pesquisa inteligente, favoritos/comparar em mobile (iPhone 13), sitemap/robots e erros de consola. Usa o browser Playwright instalado no sistema. Deixa dados de teste na BD (corra `npm run db:seed` para limpar) e pode esbarrar no rate limit se corrido várias vezes seguidas a partir do mesmo IP (`TRUNCATE rate_limits`).

## Critérios de aceitação

Verificados em 28/10/2026 contra o build de produção (`next start`) com Postgres 16 local — `tests/e2e.cjs`: **35/35 verificações passaram**.

- [x] Criar viatura no admin com fotos → aparece na listagem, filtros e detalhe *(upload múltiplo, capa, reordenação; filtro de marca inclui e filtro de preço exclui; galeria no detalhe)*
- [x] Marcar como Vendido → sai da listagem pública *(e o detalhe passa a devolver 404)*
- [x] Pedido de informação, test-drive, retoma e contacto → aparecem em Leads com o tipo certo *(+ filtro por tipo, pipeline, notas internas, CSV; honeypot bloqueia bots)*
- [x] Marcação de oficina só permite vagas livres; slot ocupado deixa de estar disponível *(UI e API reportam 0 vagas; o servidor recusa com lock transacional)*
- [x] /admin inacessível sem login *(redireciona; API admin devolve 401; cookie forjado é rejeitado)*
- [x] Filtros refletem-se no URL e sobrevivem a refresh
- [x] Comparar e favoritos funcionam em mobile
- [x] Sem erros na consola, build sem warnings de TypeScript *(`tsc --noEmit`, `eslint .` e `next build` limpos; consola sem erros durante todo o E2E)*
- [x] Todo o texto em PT-PT

- [x] Lighthouse ≥ 95 em mobile nas páginas indexáveis (ver tabela abaixo)

## Lighthouse (mobile, simulado)

| Página | Desempenho | Acessibilidade | Boas práticas | SEO | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 96 | 100 | 100 | 100 | 2,8 s | 50 ms | 0,001 |
| `/viaturas` | 95 | 100 | 100 | 100 | 2,9 s | 70 ms | 0,001 |
| `/viaturas/[slug]` | 98 | 100 | 100 | 100 | 2,1 s | 120 ms | 0,003 |
| `/oficina` | 98 | 100 | 100 | 100 | 2,3 s | 80 ms | 0,001 |
| `/retoma` | 98 | 100 | 100 | 100 | 2,2 s | 100 ms | 0,001 |
| `/contactos` | 96 | 100 | 100 | 100 | 2,6 s | 70 ms | 0,001 |
| `/financiamento` | 99 | 100 | 100 | 100 | 1,9 s | 70 ms | 0,001 |
| `/sobre` | 99 | 100 | 100 | 100 | 2,0 s | 70 ms | 0,012 |
| `/privacidade` | 99 | 100 | 100 | 100 | 1,9 s | 70 ms | 0,001 |
| `/comparar`, `/favoritos` | 98–100 | 100 | 100 | 63* | ≤ 2,3 s | 60 ms | ≤ 0,026 |

\* `/comparar` e `/favoritos` são `noindex` de propósito (conteúdo pessoal, por dispositivo) — é isso que o Lighthouse penaliza em «is-crawlable».

Medido com Lighthouse 12 em `next start` local; os valores em produção dependem do CDN/região da Netlify e da latência da BD.

## Limitações conhecidas / próximos passos

- Textos legais são modelos e devem ser revistos por um jurista; dados da empresa são fictícios e editáveis em **Definições**.
- O financiamento é um simulador ilustrativo (sistema francês com TAN; TAEG configurável), não uma integração com uma financeira.
- Um único papel de utilizador (administrador). Não há recuperação de password por email — use `npm run admin:create` com o mesmo email.
- Os campos de data usam o seletor nativo do browser, que mostra o formato do idioma do sistema do utilizador (dd/mm/aaaa num browser em português).
