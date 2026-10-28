export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || "http://localhost:3000").replace(/\/$/, "");

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function whatsappHref(number: string, message: string): string {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

export const NAV_LINKS = [
  { href: "/viaturas", label: "Viaturas" },
  { href: "/oficina", label: "Oficina" },
  { href: "/retoma", label: "Retoma" },
  { href: "/financiamento", label: "Financiamento" },
  { href: "/sobre", label: "Sobre nós" },
  { href: "/contactos", label: "Contactos" },
] as const;
