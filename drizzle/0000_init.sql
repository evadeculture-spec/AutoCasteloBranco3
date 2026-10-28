CREATE TYPE "public"."body_type" AS ENUM('citadino', 'utilitario', 'berlina', 'carrinha', 'suv', 'monovolume', 'coupe', 'comercial');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('pendente', 'confirmada', 'concluida', 'cancelada', 'falta');--> statement-breakpoint
CREATE TYPE "public"."feature_category" AS ENUM('seguranca', 'conforto', 'multimedia', 'exterior', 'interior', 'outros');--> statement-breakpoint
CREATE TYPE "public"."fuel_type" AS ENUM('gasolina', 'gasoleo', 'hibrido', 'hibrido_plugin', 'eletrico', 'gpl');--> statement-breakpoint
CREATE TYPE "public"."gearbox_type" AS ENUM('manual', 'automatica');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('nova', 'em_contacto', 'visita_marcada', 'ganha', 'perdida');--> statement-breakpoint
CREATE TYPE "public"."lead_type" AS ENUM('informacao', 'test_drive', 'retoma', 'contacto');--> statement-breakpoint
CREATE TYPE "public"."vehicle_status" AS ENUM('rascunho', 'disponivel', 'reservado', 'vendido');--> statement-breakpoint
CREATE TABLE "blocked_days" (
	"day" date PRIMARY KEY NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"user_id" uuid,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "lead_type" NOT NULL,
	"status" "lead_status" DEFAULT 'nova' NOT NULL,
	"name" text NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"vehicle_id" uuid,
	"vehicle_label" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"consent_at" timestamp with time zone NOT NULL,
	"source_path" text,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vehicle_features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"category" "feature_category" NOT NULL,
	"label" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"storage_key" text,
	"url" text NOT NULL,
	"alt" text DEFAULT '' NOT NULL,
	"width" integer,
	"height" integer,
	"position" integer DEFAULT 0 NOT NULL,
	"is_cover" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_views" (
	"vehicle_id" uuid NOT NULL,
	"day" date NOT NULL,
	"visitor_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicle_views_vehicle_id_day_visitor_hash_pk" PRIMARY KEY("vehicle_id","day","visitor_hash")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"status" "vehicle_status" DEFAULT 'rascunho' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"version" text DEFAULT '' NOT NULL,
	"year" smallint NOT NULL,
	"month" smallint,
	"km" integer NOT NULL,
	"price" integer NOT NULL,
	"previous_price" integer,
	"fuel" "fuel_type" NOT NULL,
	"gearbox" "gearbox_type" NOT NULL,
	"body_type" "body_type" NOT NULL,
	"power_hp" smallint,
	"engine_cc" integer,
	"battery_kwh" smallint,
	"range_km" smallint,
	"doors" smallint,
	"seats" smallint,
	"color" text DEFAULT '' NOT NULL,
	"consumption" text DEFAULT '' NOT NULL,
	"co2" smallint,
	"warranty_months" smallint DEFAULT 18 NOT NULL,
	"vat_deductible" boolean DEFAULT false NOT NULL,
	"revised" boolean DEFAULT true NOT NULL,
	"owners" smallint,
	"description" text DEFAULT '' NOT NULL,
	"history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"views_count" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"sold_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "workshop_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text NOT NULL,
	"service_id" uuid,
	"service_name" text NOT NULL,
	"day" date NOT NULL,
	"time" text NOT NULL,
	"status" "booking_status" DEFAULT 'pendente' NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"vehicle_info" text DEFAULT '' NOT NULL,
	"plate" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"internal_notes" text DEFAULT '' NOT NULL,
	"consent_at" timestamp with time zone NOT NULL,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workshop_bookings_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "workshop_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price_from" integer,
	"duration_minutes" smallint DEFAULT 60 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workshop_services_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "workshop_slots_config" (
	"weekday" smallint PRIMARY KEY NOT NULL,
	"is_open" boolean DEFAULT false NOT NULL,
	"open_time" text DEFAULT '09:00' NOT NULL,
	"close_time" text DEFAULT '18:00' NOT NULL,
	"break_start" text,
	"break_end" text,
	"slot_minutes" smallint DEFAULT 60 NOT NULL,
	"capacity" smallint DEFAULT 2 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_features" ADD CONSTRAINT "vehicle_features_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_images" ADD CONSTRAINT "vehicle_images_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_views" ADD CONSTRAINT "vehicle_views_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workshop_bookings" ADD CONSTRAINT "workshop_bookings_service_id_workshop_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."workshop_services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_notes_lead_idx" ON "lead_notes" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "leads_type_idx" ON "leads" USING btree ("type");--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leads_created_idx" ON "leads" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "rate_limits_key_window_idx" ON "rate_limits" USING btree ("key","window_start");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "vehicle_features_vehicle_idx" ON "vehicle_features" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "vehicle_images_vehicle_idx" ON "vehicle_images" USING btree ("vehicle_id","position");--> statement-breakpoint
CREATE INDEX "vehicle_views_day_idx" ON "vehicle_views" USING btree ("day");--> statement-breakpoint
CREATE INDEX "vehicles_status_idx" ON "vehicles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "vehicles_brand_model_idx" ON "vehicles" USING btree ("brand","model");--> statement-breakpoint
CREATE INDEX "vehicles_price_idx" ON "vehicles" USING btree ("price");--> statement-breakpoint
CREATE INDEX "vehicles_year_idx" ON "vehicles" USING btree ("year");--> statement-breakpoint
CREATE INDEX "vehicles_km_idx" ON "vehicles" USING btree ("km");--> statement-breakpoint
CREATE INDEX "vehicles_fuel_idx" ON "vehicles" USING btree ("fuel");--> statement-breakpoint
CREATE INDEX "vehicles_gearbox_idx" ON "vehicles" USING btree ("gearbox");--> statement-breakpoint
CREATE INDEX "vehicles_body_idx" ON "vehicles" USING btree ("body_type");--> statement-breakpoint
CREATE INDEX "vehicles_featured_idx" ON "vehicles" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "workshop_bookings_day_idx" ON "workshop_bookings" USING btree ("day","time");--> statement-breakpoint
CREATE INDEX "workshop_bookings_status_idx" ON "workshop_bookings" USING btree ("status");