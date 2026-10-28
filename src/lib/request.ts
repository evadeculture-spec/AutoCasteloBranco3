import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";

export async function getClientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-nf-client-connection-ip") ||
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "0.0.0.0"
  );
}

function secret() {
  return process.env.APP_SECRET || "acb-dev-secret";
}

/** Hash de IP (não guardamos IPs em claro — RGPD). */
export function hashValue(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("hex").slice(0, 32);
}

export async function getIpHash(): Promise<string> {
  return hashValue(await getClientIp());
}
