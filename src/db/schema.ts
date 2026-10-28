import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const vehicleStatus = pgEnum("vehicle_status", ["rascunho", "disponivel", "reservado", "vendido"]);
export const fuelType = pgEnum("fuel_type", ["gasolina", "gasoleo", "hibrido", "hibrido_plugin", "eletrico", "gpl"]);
export const gearboxType = pgEnum("gearbox_type", ["manual", "automatica"]);
export const bodyType = pgEnum("body_type", [
  "citadino",
  "utilitario",
  "berlina",
  "carrinha",
  "suv",
  "monovolume",
  "coupe",
  "comercial",
]);
export const leadType = pgEnum("lead_type", ["informacao", "test_drive", "retoma", "contacto"]);
export const leadStatus = pgEnum("lead_status", ["nova", "em_contacto", "visita_marcada", "ganha", "perdida"]);
export const bookingStatus = pgEnum("booking_status", ["pendente", "confirmada", "concluida", "cancelada", "falta"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  ...timestamps,
});

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(), // sha256 do token
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export type HistoryEntry = { date: string; km: number | null; description: string };

export const vehicles = pgTable(
  "vehicles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    status: vehicleStatus("status").notNull().default("rascunho"),
    featured: boolean("featured").notNull().default(false),
    brand: text("brand").notNull(),
    model: text("model").notNull(),
    version: text("version").notNull().default(""),
    year: smallint("year").notNull(),
    month: smallint("month"),
    km: integer("km").notNull(),
    price: integer("price").notNull(),
    previousPrice: integer("previous_price"),
    fuel: fuelType("fuel").notNull(),
    gearbox: gearboxType("gearbox").notNull(),
    bodyType: bodyType("body_type").notNull(),
    powerHp: smallint("power_hp"),
    engineCc: integer("engine_cc"),
    batteryKwh: smallint("battery_kwh"),
    rangeKm: smallint("range_km"),
    doors: smallint("doors"),
    seats: smallint("seats"),
    color: text("color").notNull().default(""),
    consumption: text("consumption").notNull().default(""),
    co2: smallint("co2"),
    warrantyMonths: smallint("warranty_months").notNull().default(18),
    vatDeductible: boolean("vat_deductible").notNull().default(false),
    revised: boolean("revised").notNull().default(true),
    owners: smallint("owners"),
    description: text("description").notNull().default(""),
    history: jsonb("history").$type<HistoryEntry[]>().notNull().default(sql`'[]'::jsonb`),
    viewsCount: integer("views_count").notNull().default(0),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    soldAt: timestamp("sold_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("vehicles_status_idx").on(t.status),
    index("vehicles_brand_model_idx").on(t.brand, t.model),
    index("vehicles_price_idx").on(t.price),
    index("vehicles_year_idx").on(t.year),
    index("vehicles_km_idx").on(t.km),
    index("vehicles_fuel_idx").on(t.fuel),
    index("vehicles_gearbox_idx").on(t.gearbox),
    index("vehicles_body_idx").on(t.bodyType),
    index("vehicles_featured_idx").on(t.featured),
  ],
);

export const vehicleImages = pgTable(
  "vehicle_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    /** Chave no armazenamento (Netlify Blobs / local). Nulo para imagens estáticas do seed. */
    storageKey: text("storage_key"),
    url: text("url").notNull(),
    alt: text("alt").notNull().default(""),
    width: integer("width"),
    height: integer("height"),
    position: integer("position").notNull().default(0),
    isCover: boolean("is_cover").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("vehicle_images_vehicle_idx").on(t.vehicleId, t.position)],
);

export const featureCategory = pgEnum("feature_category", [
  "seguranca",
  "conforto",
  "multimedia",
  "exterior",
  "interior",
  "outros",
]);

export const vehicleFeatures = pgTable(
  "vehicle_features",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    category: featureCategory("category").notNull(),
    label: text("label").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("vehicle_features_vehicle_idx").on(t.vehicleId)],
);

export type LeadData = {
  // test-drive
  preferredDate?: string;
  preferredTime?: string;
  // retoma
  tradeIn?: {
    brand: string;
    model: string;
    version?: string;
    year: number;
    km: number;
    fuel: string;
    gearbox: string;
    plate?: string;
    condition: string;
    accidents: string;
    serviceBook: string;
    notes?: string;
    photos: { key: string; url: string }[];
  };
  subject?: string;
};

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: leadType("type").notNull(),
    status: leadStatus("status").notNull().default("nova"),
    name: text("name").notNull(),
    email: text("email").notNull().default(""),
    phone: text("phone").notNull().default(""),
    message: text("message").notNull().default(""),
    vehicleId: uuid("vehicle_id").references(() => vehicles.id, { onDelete: "set null" }),
    vehicleLabel: text("vehicle_label"),
    data: jsonb("data").$type<LeadData>().notNull().default(sql`'{}'::jsonb`),
    consentAt: timestamp("consent_at", { withTimezone: true }).notNull(),
    sourcePath: text("source_path"),
    ipHash: text("ip_hash"),
    ...timestamps,
  },
  (t) => [
    index("leads_type_idx").on(t.type),
    index("leads_status_idx").on(t.status),
    index("leads_created_idx").on(t.createdAt),
  ],
);

export const leadNotes = pgTable(
  "lead_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("lead_notes_lead_idx").on(t.leadId)],
);

export const workshopServices = pgTable("workshop_services", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  priceFrom: integer("price_from"),
  durationMinutes: smallint("duration_minutes").notNull().default(60),
  active: boolean("active").notNull().default(true),
  position: integer("position").notNull().default(0),
  ...timestamps,
});

/** Um registo por dia da semana (0 = domingo … 6 = sábado). */
export const workshopSlotsConfig = pgTable("workshop_slots_config", {
  weekday: smallint("weekday").primaryKey(),
  isOpen: boolean("is_open").notNull().default(false),
  openTime: text("open_time").notNull().default("09:00"),
  closeTime: text("close_time").notNull().default("18:00"),
  breakStart: text("break_start"),
  breakEnd: text("break_end"),
  slotMinutes: smallint("slot_minutes").notNull().default(60),
  capacity: smallint("capacity").notNull().default(2),
});

export const blockedDays = pgTable("blocked_days", {
  day: date("day").primaryKey(),
  reason: text("reason").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workshopBookings = pgTable(
  "workshop_bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: text("reference").notNull().unique(),
    serviceId: uuid("service_id").references(() => workshopServices.id, { onDelete: "set null" }),
    serviceName: text("service_name").notNull(),
    day: date("day").notNull(),
    time: text("time").notNull(),
    status: bookingStatus("status").notNull().default("pendente"),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    vehicleInfo: text("vehicle_info").notNull().default(""),
    plate: text("plate").notNull().default(""),
    notes: text("notes").notNull().default(""),
    internalNotes: text("internal_notes").notNull().default(""),
    consentAt: timestamp("consent_at", { withTimezone: true }).notNull(),
    ipHash: text("ip_hash"),
    ...timestamps,
  },
  (t) => [index("workshop_bookings_day_idx").on(t.day, t.time), index("workshop_bookings_status_idx").on(t.status)],
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const vehicleViews = pgTable(
  "vehicle_views",
  {
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    visitorHash: text("visitor_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.vehicleId, t.day, t.visitorHash] }), index("vehicle_views_day_idx").on(t.day)],
);

export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [uniqueIndex("rate_limits_key_window_idx").on(t.key, t.windowStart)],
);

export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;
export type VehicleImage = typeof vehicleImages.$inferSelect;
export type VehicleFeature = typeof vehicleFeatures.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type LeadNote = typeof leadNotes.$inferSelect;
export type WorkshopService = typeof workshopServices.$inferSelect;
export type WorkshopSlotConfig = typeof workshopSlotsConfig.$inferSelect;
export type WorkshopBooking = typeof workshopBookings.$inferSelect;
export type BlockedDay = typeof blockedDays.$inferSelect;
