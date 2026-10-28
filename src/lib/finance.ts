/** Prestação mensal (sistema francês) para um capital, TAN anual (%) e prazo em meses. */
export function monthlyPayment(principal: number, tanPct: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const r = tanPct / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}
