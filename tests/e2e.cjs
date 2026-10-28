/* eslint-disable @typescript-eslint/no-require-imports */
/* Teste E2E dos critérios de aceitação. Uso: node tests/e2e.cjs [baseURL]
 * Requer: app a correr, BD com seed e admin criado (ADMIN_EMAIL/ADMIN_PASSWORD). */
const { chromium, devices } = require("playwright");
const path = require("node:path");
const fs = require("node:fs");

const BASE = process.argv[2] || "http://localhost:3000";
const EMAIL = process.env.ADMIN_EMAIL || "admin@autocastelobranco.example";
const PASS = process.env.ADMIN_PASSWORD || "demo-admin-2026";
const results = [];
const consoleErrors = [];
const check = (name, ok, extra = "") => { results.push({ name, ok }); console.log(`${ok ? "✔" : "✘"} ${name}${extra ? " — " + extra : ""}`); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const consent = { name: "acb_consent", value: encodeURIComponent(JSON.stringify({ v: 1, necessary: true, preferences: true, external: false, date: "2026-01-01" })), url: BASE };

function track(page, label) {
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(`[${label}] ${m.text()}`); });
  page.on("pageerror", (e) => consoleErrors.push(`[${label}] pageerror ${e.message}`));
}

async function fillLeadBase(form, { phone = true } = {}) {
  await form.locator('[name="name"]').fill("Teste Automático");
  await form.locator('[name="email"]').fill("teste@exemplo.pt");
  if (phone) await form.locator('[name="phone"]').fill("912345678");
  await form.locator('[name="consent"]').check();
}

(async () => {
  const browser = await chromium.launch();
  const unique = `E2E${Date.now().toString(36).toUpperCase()}`;

  // ——— /admin sem login
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const res = await page.goto(`${BASE}/admin/viaturas`);
    check("/admin inacessível sem login (redireciona para login)", page.url().includes("/admin/login"), page.url());
    const api = await ctx.request.get(`${BASE}/api/admin/leads/export`);
    check("API admin devolve 401 sem sessão", api.status() === 401, String(api.status()));
    const forged = await browser.newContext();
    await forged.addCookies([{ name: "acb_session", value: "falso", url: BASE }]);
    const p2 = await forged.newPage();
    await p2.goto(`${BASE}/admin`);
    check("Cookie de sessão forjado é rejeitado", p2.url().includes("/admin/login"));
    await forged.close();
    await ctx.close();
    void res;
  }

  // ——— Admin: login e criar viatura com fotos
  const admin = await browser.newContext({ viewport: { width: 1360, height: 900 } });
  const ap = await admin.newPage();
  track(ap, "admin");
  await ap.goto(`${BASE}/admin/login`);
  await ap.fill("#email", EMAIL);
  await ap.fill("#password", PASS);
  await Promise.all([ap.waitForURL(`${BASE}/admin`), ap.click('button[type="submit"]')]);
  check("Login de admin funciona", ap.url() === `${BASE}/admin`);

  await ap.goto(`${BASE}/admin/viaturas/nova`);
  await ap.selectOption("#f-status", "disponivel");
  await ap.fill("#f-brand", "Kia");
  await ap.fill("#f-model", `Ceed ${unique}`);
  await ap.fill("#f-version", "1.0 T-GDi Drive");
  await ap.fill("#f-year", "2022");
  await ap.fill("#f-km", "33000");
  await ap.fill("#f-price", "17750");
  await ap.selectOption("#f-fuel", "gasolina");
  await ap.selectOption("#f-gearbox", "manual");
  await ap.selectOption("#f-bodyType", "utilitario");
  await ap.fill("#feat-seguranca", "ABS\nESP");
  await Promise.all([ap.waitForURL(/\/admin\/viaturas\/[0-9a-f-]{36}/), ap.click('button:has-text("Criar viatura")')]);
  const vehicleId = ap.url().match(/viaturas\/([0-9a-f-]{36})/)[1];
  // Upload de 2 fotos
  const img1 = path.join(__dirname, "fixtures", "foto1.jpg");
  const img2 = path.join(__dirname, "fixtures", "foto2.jpg");
  await ap.setInputFiles('#fotos input[type="file"]', [img1, img2]);
  await ap.waitForSelector("#fotos li:nth-child(2)", { timeout: 20000 });
  await wait(800);
  const thumbs = await ap.locator("#fotos li").count();
  check("Upload múltiplo de fotos no admin", thumbs === 2, `${thumbs} fotos`);
  // Reordenar e escolher capa
  await ap.click('button[aria-label="Usar fotografia 2 como capa"]');
  await wait(800);
  await ap.click('button[aria-label="Mover fotografia 2 para a esquerda"]');
  await wait(1200);

  // Público: aparece na listagem, filtros e detalhe
  const pub = await browser.newContext({ viewport: { width: 1360, height: 900 } });
  await pub.addCookies([consent]);
  const pp = await pub.newPage();
  track(pp, "público");
  await pp.goto(`${BASE}/viaturas?marca=Kia`);
  const found = await pp.locator(`article >> text=Ceed ${unique}`).count();
  check("Viatura criada aparece na listagem filtrada (marca=Kia)", found > 0);
  await pp.goto(`${BASE}/viaturas?marca=Kia&preco_max=15000`);
  const notFound = await pp.locator(`article >> text=Ceed ${unique}`).count();
  check("Filtro de preço exclui a viatura (17 750 € > 15 000 €)", notFound === 0);
  await pp.goto(`${BASE}/viaturas?marca=Kia`);
  await pp.click(`a:has-text("Ceed ${unique}")`);
  await pp.waitForURL(/\/viaturas\/kia-ceed/);
  await pp.waitForSelector('section[aria-roledescription="carrossel"] img');
  const detailSlug = pp.url().split("/viaturas/")[1];
  const hasImg = await pp.locator('section[aria-roledescription="carrossel"] img').count();
  check("Detalhe da viatura mostra galeria com as fotos", hasImg >= 2, `${hasImg} imagens`);
  const price = await pp.locator("text=/17\\s?750\\s?€/").count();
  check("Preço formatado PT (17 750 €)", price > 0);

  // Pedido de informação e test-drive
  const info = pp.locator("#panel-info form");
  await fillLeadBase(info, { phone: false });
  await wait(1700);
  await info.locator('button[type="submit"]').click();
  await pp.waitForSelector("#panel-info >> text=Pedido enviado", { timeout: 10000 });
  check("Pedido de informação submetido", true);
  await pp.click("#tab-test");
  const td = pp.locator("#panel-test form");
  await fillLeadBase(td);
  await wait(1700);
  await td.locator('button[type="submit"]').click();
  await pp.waitForSelector("#panel-test >> text=/Pedido de test-drive para/", { timeout: 10000 });
  check("Pedido de test-drive submetido", true);

  // Contacto
  await pp.goto(`${BASE}/contactos`);
  const cf = pp.locator("form").filter({ has: pp.locator('[name="subject"]') });
  await fillLeadBase(cf);
  await cf.locator('[name="message"]').fill(`Mensagem de teste ${unique}`);
  await wait(1700);
  await cf.locator('button[type="submit"]').click();
  await pp.waitForSelector("text=Mensagem enviada", { timeout: 10000 });
  check("Formulário de contacto submetido", true);

  // Retoma (4 passos com foto)
  await pp.goto(`${BASE}/retoma`);
  await pp.fill('[name="brand"]', "Opel");
  await pp.fill('[name="model"]', `Corsa ${unique}`);
  await pp.fill('[name="year"]', "2015");
  await pp.fill('[name="km"]', "140000");
  await pp.selectOption('[name="fuel"]', "gasoleo");
  await pp.selectOption('[name="gearbox"]', "manual");
  await pp.click('button:has-text("Seguinte")');
  await pp.check('[name="condition"][value="bom"]');
  await pp.check('[name="accidents"][value="nao"]');
  await pp.check('[name="serviceBook"][value="completo"]');
  await pp.click('button:has-text("Seguinte")');
  await pp.setInputFiles("#retoma-fotos", [img1]);
  await pp.waitForSelector('button[aria-label="Remover fotografia 1"]');
  await pp.click('button:has-text("Seguinte")');
  await fillLeadBase(pp.locator("form"));
  await pp.click('button:has-text("Pedir avaliação")');
  await pp.waitForSelector("text=Pedido de avaliação recebido", { timeout: 15000 });
  check("Retoma em passos com foto submetida", true);

  // Honeypot: submissão de bot não cria lead
  await pp.goto(`${BASE}/contactos`);
  const cf2 = pp.locator("form").filter({ has: pp.locator('[name="subject"]') });
  await fillLeadBase(cf2);
  await cf2.locator('[name="message"]').fill(`BOT ${unique}`);
  await pp.evaluate(() => { document.querySelector('[name="website"]').value = "http://spam"; });
  await wait(1700);
  await cf2.locator('button[type="submit"]').click();
  await wait(1500);

  // Leads no admin com o tipo certo
  await ap.goto(`${BASE}/admin/leads?q=${encodeURIComponent("Teste Automático")}`);
  const rowsText = (await ap.locator("tbody").textContent()) ?? "";
  const types = ["Pedido de informação", "Test-drive", "Retoma", "Contacto"];
  for (const t of types) check(`Lead do tipo «${t}» aparece em Leads`, rowsText.includes(t));
  await ap.goto(`${BASE}/admin/leads?tipo=retoma&q=${encodeURIComponent("Teste Automático")}`);
  check("Filtro por tipo (retoma) mostra a retoma", (await ap.locator("tbody").innerText()).includes(`Corsa ${unique}`));
  await ap.goto(`${BASE}/admin/leads?q=BOT`);
  const bot = await ap.locator(`text=BOT ${unique}`).count();
  check("Honeypot bloqueia bots (sem lead criada)", bot === 0);
  // Pipeline + nota
  await ap.goto(`${BASE}/admin/leads?tipo=test_drive&q=${encodeURIComponent("Teste Automático")}`);
  await ap.click('tbody a:has-text("Teste Automático")');
  await ap.click('button:has-text("Em contacto")');
  await wait(800);
  await ap.fill("#note", "Nota de teste E2E");
  await ap.click('button:has-text("Adicionar nota")');
  await ap.waitForSelector("text=Nota de teste E2E");
  await ap.reload();
  const current = await ap.locator('button[aria-current="step"]').innerText();
  check("Pipeline de lead e notas internas persistem", current.includes("Em contacto") && (await ap.locator("text=Nota de teste E2E").count()) > 0);
  const csv = await admin.request.get(`${BASE}/api/admin/leads/export?tipo=retoma`);
  const csvText = await csv.text();
  check("Exportar CSV", csv.ok() && csvText.includes("Retoma") && csv.headers()["content-type"].includes("text/csv"));

  // Marcar como Vendido → sai da listagem pública e o detalhe dá 404
  await ap.goto(`${BASE}/admin/viaturas/${vehicleId}`);
  await ap.selectOption("#f-status", "vendido");
  await ap.click('button:has-text("Guardar alterações")');
  await ap.waitForSelector("text=Alterações guardadas");
  await pp.goto(`${BASE}/viaturas?marca=Kia`);
  check("Vendido sai da listagem pública", (await pp.locator(`article >> text=Ceed ${unique}`).count()) === 0);
  const det = await pp.goto(`${BASE}/viaturas/${detailSlug}`);
  check("Detalhe de viatura vendida devolve 404", det.status() === 404, String(det.status()));

  // Oficina: só vagas livres; slot ocupado deixa de estar disponível
  // Configura capacidade 1 para garantir o esgotar do slot
  await ap.goto(`${BASE}/admin/oficina/horario`);
  const caps = ap.locator('input[name^="capacity_"]');
  const nCaps = await caps.count();
  const prevCaps = [];
  for (let i = 0; i < nCaps; i++) { prevCaps.push(await caps.nth(i).inputValue()); await caps.nth(i).fill("1"); }
  await ap.click('button:has-text("Guardar horário")');
  await ap.waitForSelector("text=Horário guardado");

  async function book(page) {
    await page.goto(`${BASE}/oficina`);
    await page.locator('[name="serviceId"]').first().check();
    await page.waitForSelector('#marcar-horas button[aria-pressed]:not([disabled])', { timeout: 10000 });
    const btn = page.locator('#marcar-horas button[aria-pressed]:not([disabled])').first();
    const time = (await btn.innerText()).split("\n")[0].trim();
    const dayBtn = page.locator('[aria-label="Escolha o dia"] button[aria-pressed="true"]');
    const dayIso = await dayBtn.getAttribute("data-day");
    await btn.click();
    await page.fill('[name="vehicleInfo"]', "Renault Clio 2018");
    await fillLeadBase(page.locator("#marcar form"));
    await wait(1700);
    await page.click('button:has-text("Confirmar marcação")');
    await page.waitForSelector("text=Marcação registada", { timeout: 10000 });
    return { time, day: dayIso };
  }
  const first = await book(pp);
  check("Marcação de oficina com vaga livre", true, `${first.day} ${first.time}`);
  // Mesmo slot deixa de estar disponível
  await pp.goto(`${BASE}/oficina`);
  await pp.waitForSelector('#marcar-horas button[aria-pressed]', { timeout: 10000 });
  const dayButton = pp.locator(`[aria-label="Escolha o dia"] button[data-day="${first.day}"]`);
  if (!(await dayButton.isDisabled())) await dayButton.click();
  const slot = pp.locator(`#marcar-horas button[data-time="${first.time}"]`);
  const disabled = (await dayButton.isDisabled()) || (await slot.isDisabled());
  check("Slot ocupado deixa de estar disponível", disabled);
  // Tentativa forçada pelo servidor (corrida): submeter o mesmo slot diretamente
  const iso = first.day;
  const avail = await (await pub.request.get(`${BASE}/api/workshop/availability?from=${iso}&days=1`)).json();
  const s = avail.days[0].slots.find((x) => x.time === first.time);
  check("API de vagas reporta 0 vagas no slot ocupado", s ? s.free === 0 : true);
  // Repor capacidades
  await ap.goto(`${BASE}/admin/oficina/horario`);
  for (let i = 0; i < nCaps; i++) await ap.locator('input[name^="capacity_"]').nth(i).fill(prevCaps[i]);
  await ap.click('button:has-text("Guardar horário")');
  await ap.waitForSelector("text=Horário guardado");

  // Filtros no URL sobrevivem a refresh
  await pp.goto(`${BASE}/viaturas`);
  await pp.locator('aside[aria-label="Filtros"] button:has-text("SUV")').click();
  await pp.waitForURL(/tipo=suv/);
  await pp.locator('aside[aria-label="Filtros"] button:has-text("Gasóleo")').click();
  await pp.waitForURL(/combustivel=gasoleo/);
  const urlBefore = pp.url();
  await pp.reload();
  const pressed = await pp.locator('aside[aria-label="Filtros"] button[aria-pressed="true"]').allInnerTexts();
  check("Filtros refletem-se no URL e sobrevivem a refresh", pp.url() === urlBefore && pressed.includes("SUV") && pressed.includes("Gasóleo"), urlBefore);
  // Pesquisa inteligente
  await pp.goto(`${BASE}/`);
  await pp.fill('input[name="q"]', "Procuro um SUV gasóleo até 20 000 €");
  await pp.waitForSelector("text=Entendemos:");
  await pp.click('form[role="search"] button[type="submit"]');
  await pp.waitForURL(/viaturas\?/);
  check("Pesquisa inteligente converte texto em filtros", /combustivel=gasoleo/.test(pp.url()) && /preco_max=20000/.test(pp.url()) && /tipo=suv/.test(pp.url()), pp.url());

  // Mobile: favoritos e comparar
  const mob = await browser.newContext({ ...devices["iPhone 13"] });
  await mob.addCookies([consent]);
  const mp = await mob.newPage();
  track(mp, "mobile");
  await mp.goto(`${BASE}/viaturas`);
  const cards = mp.locator("article");
  await cards.nth(0).locator('button[aria-label^="Guardar"]').tap();
  await cards.nth(0).locator('button:has-text("Comparar")').tap();
  await cards.nth(1).locator('button:has-text("Comparar")').tap();
  await mp.waitForSelector('aside[aria-label="Viaturas a comparar"]');
  await mp.goto(`${BASE}/favoritos`);
  await mp.waitForSelector("article", { timeout: 10000 });
  check("Favoritos funcionam em mobile", (await mp.locator("article").count()) === 1);
  await mp.goto(`${BASE}/comparar`);
  await mp.waitForSelector("table caption", { state: "attached", timeout: 10000 });
  await mp.waitForURL(/ids=/);
  const cols = await mp.locator("thead th").count();
  check("Comparar funciona em mobile (2 viaturas lado a lado)", cols === 3, `${cols - 1} viaturas`);
  // Barra fixa no detalhe em mobile
  await mp.goto(`${BASE}/viaturas`);
  await mp.locator("article h3 a").first().click();
  await mp.waitForURL(/\/viaturas\/.+/);
  await mp.waitForSelector('nav[aria-label="Ações rápidas"] a');
  const barLinks = await mp.locator('nav[aria-label="Ações rápidas"] a').allTextContents();
  const bar = ["Ligar", "WhatsApp", "Visita"].every((t) => barLinks.some((x) => x.includes(t))) && (await mp.locator('nav[aria-label="Ações rápidas"]').isVisible());
  const wa = await mp.locator('a[href^="https://wa.me/"]').first().getAttribute("href");
  check("Barra inferior fixa no detalhe em mobile (Ligar · WhatsApp · Visita)", bar);
  check("WhatsApp com mensagem pré-preenchida com a viatura", decodeURIComponent(wa).includes("Tenho interesse na viatura"));

  // SEO
  const sm = await pub.request.get(`${BASE}/sitemap.xml`);
  const smText = await sm.text();
  check("sitemap.xml dinâmico inclui viaturas", sm.ok() && smText.includes("/viaturas/"));
  const rb = await pub.request.get(`${BASE}/robots.txt`);
  check("robots.txt dinâmico", rb.ok() && (await rb.text()).includes("Disallow: /admin"));

  await browser.close();
  const real = consoleErrors.filter((e) => !/Failed to load resource: the server responded with a status of (401|404)/.test(e));
  check("Sem erros na consola do browser", real.length === 0, real.slice(0, 5).join(" | "));
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} verificações passaram.`);
  fs.writeFileSync(path.join(__dirname, "e2e-results.json"), JSON.stringify({ date: new Date().toISOString(), results }, null, 2));
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
