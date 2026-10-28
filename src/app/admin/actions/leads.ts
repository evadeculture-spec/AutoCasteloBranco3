"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { LEAD_STATUS_KEYS, type LeadStatusKey } from "@/lib/labels";
import type { ActionResult } from "@/lib/schemas";

export async function setLeadStatus(id: string, status: LeadStatusKey) {
  await requireAdmin();
  if (!LEAD_STATUS_KEYS.includes(status)) return;
  await db.update(schema.leads).set({ status }).where(eq(schema.leads.id, id));
  revalidatePath("/admin", "layout");
}

export async function addLeadNote(_prev: ActionResult, fd: FormData): Promise<ActionResult> {
  const user = await requireAdmin();
  const leadId = String(fd.get("leadId") ?? "");
  const body = String(fd.get("body") ?? "").trim();
  if (!body) return { ok: false, message: "Escreva a nota.", errors: { body: "Escreva a nota." } };
  if (body.length > 4000) return { ok: false, message: "Nota demasiado longa." };
  await db.insert(schema.leadNotes).values({ leadId, userId: user.id, body });
  revalidatePath(`/admin/leads/${leadId}`);
  return { ok: true, message: "Nota adicionada." };
}

export async function deleteLeadNote(noteId: string, leadId: string) {
  await requireAdmin();
  await db.delete(schema.leadNotes).where(eq(schema.leadNotes.id, noteId));
  revalidatePath(`/admin/leads/${leadId}`);
}
