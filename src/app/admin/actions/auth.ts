"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession, verifyCredentials } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { getIpHash } from "@/lib/request";
import type { ActionResult } from "@/lib/schemas";

const loginSchema = z.object({ email: z.email("Email inválido."), password: z.string().min(1, "Indique a password.") });

export async function login(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
  if (!parsed.success) return { ok: false, message: "Indique email e password." };
  const ip = await getIpHash();
  if (!(await rateLimit(`login:${ip}`, 8, 900))) return { ok: false, message: "Demasiadas tentativas. Aguarde 15 minutos." };
  const user = await verifyCredentials(parsed.data.email, parsed.data.password);
  if (!user) return { ok: false, message: "Email ou password incorretos." };
  await createSession(user.id);
  const next = String(fd.get("next") ?? "");
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}
