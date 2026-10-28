import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { getPublicSlugs } from "@/lib/vehicles";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const statics = ["/", "/viaturas", "/oficina", "/retoma", "/financiamento", "/sobre", "/contactos", "/privacidade", "/cookies", "/termos", "/resolucao-de-litigios"];
  let vehicles: { slug: string; updatedAt: Date }[] = [];
  try {
    vehicles = await getPublicSlugs();
  } catch {
    vehicles = [];
  }
  return [
    ...statics.map((p) => ({ url: absoluteUrl(p), changeFrequency: p === "/viaturas" ? ("daily" as const) : ("monthly" as const), priority: p === "/" ? 1 : p === "/viaturas" ? 0.9 : 0.5 })),
    ...vehicles.map((v) => ({ url: absoluteUrl(`/viaturas/${v.slug}`), lastModified: v.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
