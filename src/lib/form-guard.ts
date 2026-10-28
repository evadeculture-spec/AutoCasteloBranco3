import "server-only";
import { getIpHash } from "./request";
import { rateLimit } from "./rate-limit";
import type { ActionResult } from "./schemas";

/**
 * Anti-spam comum a todos os formulários públicos:
 * honeypot ("website"), tempo mínimo de preenchimento e rate limit por IP.
 * Devolve um ActionResult de erro, ou { ipHash } se o pedido pode prosseguir.
 */
export async function guardForm(fd: FormData, scope: string, limit = 5, windowSec = 600): Promise<{ blocked: ActionResult } | { ipHash: string }> {
  const honeypot = fd.get("website");
  if (typeof honeypot === "string" && honeypot.length > 0) {
    // Resposta "de sucesso" para não dar pistas aos bots
    return { blocked: { ok: true, message: "Pedido recebido. Obrigado!" } };
  }
  const ts = Number(fd.get("ts"));
  if (Number.isFinite(ts) && ts > 0 && Date.now() - ts < 1500) {
    return { blocked: { ok: false, message: "Submissão demasiado rápida. Tente novamente." } };
  }
  const ipHash = await getIpHash();
  const allowed = await rateLimit(`${scope}:${ipHash}`, limit, windowSec);
  if (!allowed) {
    return { blocked: { ok: false, message: "Recebemos demasiados pedidos deste dispositivo. Aguarde alguns minutos ou ligue-nos." } };
  }
  return { ipHash };
}
