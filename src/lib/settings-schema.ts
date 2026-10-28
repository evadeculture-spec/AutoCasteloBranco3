import { z } from "zod";

export const siteSettingsSchema = z.object({
  businessName: z.string().min(2).max(80),
  legalName: z.string().min(2).max(120),
  nif: z.string().max(20),
  phone: z.string().min(6).max(30),
  phoneWorkshop: z.string().max(30),
  whatsapp: z
    .string()
    .regex(/^\d{9,15}$/, "Apenas dígitos, com indicativo (ex.: 351912345678)"),
  email: z.email(),
  addressLine: z.string().min(3).max(120),
  postalCode: z.string().min(4).max(12),
  city: z.string().min(2).max(60),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  hoursStand: z.string().max(400),
  hoursWorkshop: z.string().max(400),
  demoBanner: z.string().max(200),
  financingTan: z.number().min(0).max(30),
  financingTaeg: z.number().min(0).max(40),
  financingMaxMonths: z.number().int().min(12).max(120),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;

export const DEFAULT_SETTINGS: SiteSettings = {
  businessName: "AutoCasteloBranco",
  legalName: "AutoCasteloBranco — Comércio e Reparação de Automóveis, Lda. (fictícia)",
  nif: "500 000 000",
  phone: "+351 272 000 000",
  phoneWorkshop: "+351 272 000 001",
  whatsapp: "351910000000",
  email: "geral@autocastelobranco.example",
  addressLine: "Rua da Oficina Fictícia, 123, Zona Industrial",
  postalCode: "6000-000",
  city: "Castelo Branco",
  latitude: 39.8222,
  longitude: -7.4909,
  hoursStand: "Seg–Sex 09:00–19:00\nSáb 09:00–13:00\nDom encerrado",
  hoursWorkshop: "Seg–Sex 09:00–18:00\nSáb 09:00–13:00\nDom encerrado",
  demoBanner: "Versão de demonstração — viaturas, preços e contactos são fictícios.",
  financingTan: 7.9,
  financingTaeg: 9.6,
  financingMaxMonths: 120,
};
