import { addDaysIso, todayLisbon } from "@/lib/format";
import { BOOKING_HORIZON_DAYS, getAvailability } from "@/lib/workshop";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const today = todayLisbon();
  const maxDay = addDaysIso(today, BOOKING_HORIZON_DAYS);
  let from = sp.get("from") ?? today;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || from < today) from = today;
  if (from > maxDay) from = maxDay;
  const days = Math.min(21, Math.max(1, Number(sp.get("days")) || 14));
  const data = await getAvailability(from, days);
  return Response.json({ today, maxDay, days: data.filter((d) => d.day <= maxDay) }, { headers: { "Cache-Control": "no-store" } });
}
