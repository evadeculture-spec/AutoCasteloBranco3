import { sql } from "drizzle-orm";
import * as s from "../src/db/schema";
import { DEFAULT_SETTINGS } from "../src/lib/settings-schema";
import { addDaysIso, isoDayLisbon, weekdayOfIso } from "../src/lib/format";
import { connect } from "./db";
import { seedSlug } from "./generate-seed-images";
import { SEED_SERVICES, SEED_VEHICLES } from "./seed-data";

function buildHistory(year: number, km: number): s.HistoryEntry[] {
  const entries: s.HistoryEntry[] = [];
  const now = new Date();
  const ageYears = Math.max(1, now.getFullYear() - year);
  const perYear = Math.round(km / ageYears);
  for (let i = 1; i <= ageYears; i++) {
    const kmAt = Math.min(km, perYear * i);
    entries.push({
      date: `${year + i}-0${(i % 9) + 1}-1${i % 9}`,
      km: Math.round(kmAt / 100) * 100,
      description: i % 2 === 0 ? "Revisão anual com mudança de óleo e filtros" : "Revisão intermédia e verificação de travões",
    });
  }
  entries.push({
    date: isoDayLisbon(new Date(Date.now() - 1000 * 60 * 60 * 24 * 20)),
    km,
    description: "Inspeção multipontos AutoCasteloBranco (120 pontos) e revisão de entrega",
  });
  return entries.filter((e) => e.date <= isoDayLisbon(new Date()));
}

async function main() {
  const { db, client } = connect();
  console.log("[seed] a limpar dados de catálogo…");
  await db.execute(sql`TRUNCATE vehicle_views, lead_notes, leads, vehicle_features, vehicle_images, vehicles, workshop_bookings, workshop_services, workshop_slots_config, blocked_days, settings, rate_limits RESTART IDENTITY CASCADE`);

  await db.insert(s.settings).values({ key: "site", value: DEFAULT_SETTINGS });

  // Horário da oficina: seg–sex 9h–18h (pausa 13h–14h), sáb 9h–13h
  await db.insert(s.workshopSlotsConfig).values(
    [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
      weekday,
      isOpen: weekday !== 0,
      openTime: "09:00",
      closeTime: weekday === 6 ? "13:00" : "18:00",
      breakStart: weekday === 6 || weekday === 0 ? null : "13:00",
      breakEnd: weekday === 6 || weekday === 0 ? null : "14:00",
      slotMinutes: 60,
      capacity: 2,
    })),
  );

  const services = await db
    .insert(s.workshopServices)
    .values(SEED_SERVICES.map((sv, i) => ({ ...sv, position: i })))
    .returning();

  const now = Date.now();
  const vehicleIds: string[] = [];
  for (const [i, v] of SEED_VEHICLES.entries()) {
    const slug = seedSlug(v);
    const status = v.status ?? "disponivel";
    const [row] = await db
      .insert(s.vehicles)
      .values({
        slug,
        status,
        featured: v.featured ?? false,
        brand: v.brand,
        model: v.model,
        version: v.version,
        year: v.year,
        month: v.month,
        km: v.km,
        price: v.price,
        previousPrice: v.previousPrice ?? null,
        fuel: v.fuel,
        gearbox: v.gearbox,
        bodyType: v.bodyType,
        powerHp: v.powerHp,
        engineCc: v.engineCc ?? null,
        batteryKwh: v.batteryKwh ?? null,
        rangeKm: v.rangeKm ?? null,
        doors: v.doors,
        seats: v.seats,
        color: v.color,
        consumption: v.consumption,
        co2: v.co2 ?? null,
        warrantyMonths: v.warrantyMonths,
        vatDeductible: v.vatDeductible ?? false,
        revised: true,
        owners: v.owners,
        description: v.description,
        history: buildHistory(v.year, v.km),
        publishedAt: new Date(now - i * 1000 * 60 * 60 * 26),
        soldAt: status === "vendido" ? new Date(now - 1000 * 60 * 60 * 24 * 3) : null,
        createdAt: new Date(now - i * 1000 * 60 * 60 * 26),
      })
      .returning({ id: s.vehicles.id });
    const id = row!.id;
    vehicleIds.push(id);
    const alts = ["Vista lateral", "Vista lateral (lado oposto)", "Detalhe da roda e farol", "Interior e tablier"];
    await db.insert(s.vehicleImages).values(
      alts.map((alt, n) => ({
        vehicleId: id,
        url: `/seed/${slug}-${n + 1}.webp`,
        alt: `${v.brand} ${v.model} — ${alt} (imagem ilustrativa)`,
        width: 1200,
        height: 800,
        position: n,
        isCover: n === 0,
      })),
    );
    const feats = Object.entries(v.features).flatMap(([category, labels]) =>
      (labels ?? []).map((label, position) => ({ vehicleId: id, category: category as s.VehicleFeature["category"], label, position })),
    );
    if (feats.length) await db.insert(s.vehicleFeatures).values(feats);

    // Visualizações fictícias para o dashboard
    const views = Math.floor(((i * 37) % 23) + (v.featured ? 30 : 5));
    const viewRows = Array.from({ length: views }, (_, n) => ({
      vehicleId: id,
      day: isoDayLisbon(new Date(now - (n % 14) * 86400000)),
      visitorHash: `seed-${i}-${n}`,
    }));
    if (viewRows.length) await db.insert(s.vehicleViews).values(viewRows).onConflictDoNothing();
    await db.execute(sql`UPDATE vehicles SET views_count = ${views} WHERE id = ${id}`);
  }

  // Leads de exemplo
  const consentAt = new Date();
  await db.insert(s.leads).values([
    { type: "informacao", name: "Exemplo — Ana Fictícia", email: "ana@exemplo.pt", phone: "910000001", message: "Olá, a viatura ainda está disponível? Aceitam retoma?", vehicleId: vehicleIds[0], vehicleLabel: "Peugeot 208 1.2 PureTech Allure", consentAt, createdAt: new Date(now - 3600_000 * 2) },
    { type: "test_drive", status: "visita_marcada", name: "Exemplo — Bruno Teste", email: "bruno@exemplo.pt", phone: "910000002", message: "Gostaria de experimentar ao fim da tarde.", vehicleId: vehicleIds[4], vehicleLabel: "Toyota C-HR 1.8 Hybrid Comfort", data: { preferredDate: addDaysIso(isoDayLisbon(new Date()), 2), preferredTime: "17:00" }, consentAt, createdAt: new Date(now - 3600_000 * 26) },
    { type: "contacto", status: "em_contacto", name: "Exemplo — Carla Demo", email: "carla@exemplo.pt", phone: "910000003", message: "Fazem financiamento para trabalhadores independentes?", data: { subject: "Financiamento" }, consentAt, createdAt: new Date(now - 3600_000 * 72) },
  ]);

  // Uma marcação de exemplo no próximo dia útil às 10:00
  let day = addDaysIso(isoDayLisbon(new Date()), 1);
  while ([0].includes(weekdayOfIso(day))) day = addDaysIso(day, 1);
  await db.insert(s.workshopBookings).values({
    reference: "OF-DEMO1",
    serviceId: services[0]!.id,
    serviceName: services[0]!.name,
    day,
    time: "10:00",
    status: "confirmada",
    name: "Exemplo — Diogo Fictício",
    email: "diogo@exemplo.pt",
    phone: "910000004",
    vehicleInfo: "Renault Clio 2018",
    plate: "00-AA-00",
    consentAt,
  });

  console.log(`[seed] ${SEED_VEHICLES.length} viaturas, ${services.length} serviços, horário e definições criados.`);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
