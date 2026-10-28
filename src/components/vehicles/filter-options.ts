export const PRICE_STEPS = [5000, 7500, 10000, 12500, 15000, 17500, 20000, 25000, 30000, 35000, 40000, 50000, 75000];
export const KM_STEPS = [10000, 25000, 50000, 75000, 100000, 125000, 150000, 200000];

export function yearRange(min: number, max: number): number[] {
  const out: number[] = [];
  for (let y = max; y >= Math.min(min, max); y--) out.push(y);
  return out;
}
