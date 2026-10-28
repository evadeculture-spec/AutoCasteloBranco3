import { getVehiclesByIds } from "@/lib/vehicles";

export async function GET(request: Request) {
  const ids = (new URL(request.url).searchParams.get("ids") ?? "").split(",").filter(Boolean);
  const items = await getVehiclesByIds(ids);
  return Response.json({ items }, { headers: { "Cache-Control": "no-store" } });
}
