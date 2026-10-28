import { addDaysIso, weekdayOfIso } from "./format";

/** Horas possíveis de test-drive (horário do stand), por dia da semana. */
export function testDriveTimes(isoDay: string): string[] {
  const wd = weekdayOfIso(isoDay);
  if (wd === 0) return [];
  const end = wd === 6 ? 12 * 60 + 30 : 18 * 60 + 30;
  const out: string[] = [];
  for (let m = 9 * 60 + 30; m <= end; m += 30) out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  return out;
}

export function testDriveDateBounds(today: string) {
  return { min: addDaysIso(today, 1), max: addDaysIso(today, 60) };
}

export function validateTestDrive(day: string, time: string, today: string): string | null {
  const { min, max } = testDriveDateBounds(today);
  if (day < min) return "Escolha uma data a partir de amanhã.";
  if (day > max) return "Só aceitamos marcações nos próximos 60 dias.";
  const times = testDriveTimes(day);
  if (!times.length) return "Ao domingo o stand está encerrado.";
  if (!times.includes(time)) return "Escolha uma hora dentro do horário do stand.";
  return null;
}
