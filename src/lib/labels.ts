export const FUEL_LABELS = {
  gasolina: "Gasolina",
  gasoleo: "Gasóleo",
  hibrido: "Híbrido",
  hibrido_plugin: "Híbrido plug-in",
  eletrico: "Elétrico",
  gpl: "GPL",
} as const;

export const FUEL_SHORT = {
  gasolina: "Gasol.",
  gasoleo: "Gasóleo",
  hibrido: "Híbrido",
  hibrido_plugin: "PHEV",
  eletrico: "Elétr.",
  gpl: "GPL",
} as const;

export const GEARBOX_LABELS = {
  manual: "Manual",
  automatica: "Automática",
} as const;

export const BODY_LABELS = {
  citadino: "Citadino",
  utilitario: "Utilitário",
  berlina: "Berlina",
  carrinha: "Carrinha",
  suv: "SUV",
  monovolume: "Monovolume",
  coupe: "Coupé",
  comercial: "Comercial",
} as const;

export const STATUS_LABELS = {
  rascunho: "Rascunho",
  disponivel: "Disponível",
  reservado: "Reservado",
  vendido: "Vendido",
} as const;

export const FEATURE_CATEGORY_LABELS = {
  seguranca: "Segurança",
  conforto: "Conforto",
  multimedia: "Multimédia e conectividade",
  exterior: "Exterior",
  interior: "Interior",
  outros: "Outros",
} as const;

export const LEAD_TYPE_LABELS = {
  informacao: "Pedido de informação",
  test_drive: "Test-drive",
  retoma: "Retoma",
  contacto: "Contacto",
} as const;

export const LEAD_STATUS_LABELS = {
  nova: "Nova",
  em_contacto: "Em contacto",
  visita_marcada: "Visita marcada",
  ganha: "Ganha",
  perdida: "Perdida",
} as const;

export const BOOKING_STATUS_LABELS = {
  pendente: "Pendente",
  confirmada: "Confirmada",
  concluida: "Concluída",
  cancelada: "Cancelada",
  falta: "Não compareceu",
} as const;

export const WEEKDAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"] as const;

export type FuelKey = keyof typeof FUEL_LABELS;
export type GearboxKey = keyof typeof GEARBOX_LABELS;
export type BodyKey = keyof typeof BODY_LABELS;
export type StatusKey = keyof typeof STATUS_LABELS;
export type FeatureCategoryKey = keyof typeof FEATURE_CATEGORY_LABELS;
export type LeadTypeKey = keyof typeof LEAD_TYPE_LABELS;
export type LeadStatusKey = keyof typeof LEAD_STATUS_LABELS;
export type BookingStatusKey = keyof typeof BOOKING_STATUS_LABELS;

export const FUEL_KEYS = Object.keys(FUEL_LABELS) as FuelKey[];
export const GEARBOX_KEYS = Object.keys(GEARBOX_LABELS) as GearboxKey[];
export const BODY_KEYS = Object.keys(BODY_LABELS) as BodyKey[];
export const STATUS_KEYS = Object.keys(STATUS_LABELS) as StatusKey[];
export const FEATURE_CATEGORY_KEYS = Object.keys(FEATURE_CATEGORY_LABELS) as FeatureCategoryKey[];
export const LEAD_TYPE_KEYS = Object.keys(LEAD_TYPE_LABELS) as LeadTypeKey[];
export const LEAD_STATUS_KEYS = Object.keys(LEAD_STATUS_LABELS) as LeadStatusKey[];
export const BOOKING_STATUS_KEYS = Object.keys(BOOKING_STATUS_LABELS) as BookingStatusKey[];
