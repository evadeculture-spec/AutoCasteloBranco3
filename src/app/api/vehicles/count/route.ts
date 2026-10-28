import { parseFilters } from "@/lib/filters";
import { countVehicles } from "@/lib/vehicles";

export async function GET(request: Request) {
  const f = parseFilters(new URL(request.url).searchParams);
  const total = await countVehicles({ ...f, pagina: 1, ordem: "recentes" });
  return Response.json({ total }, { headers: { "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300" } });
}
