"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { addLeadNote, deleteLeadNote, setLeadStatus } from "@/app/admin/actions/leads";
import { FormStatus, SubmitButton } from "@/components/forms/form-kit";
import { toast } from "@/components/ui/toast";
import { LEAD_STATUS_KEYS, LEAD_STATUS_LABELS, type LeadStatusKey } from "@/lib/labels";
import { cn } from "@/lib/format";

export function LeadStatusSelect({ id, status, label }: { id: string; status: LeadStatusKey; label: string }) {
  const [pending, start] = useTransition();
  return (
    <select
      aria-label={`Estado da lead de ${label}`}
      className={cn("input !min-h-9 !w-auto !py-1 text-sm", pending && "opacity-60")}
      value={status}
      disabled={pending}
      onChange={(e) => {
        const s = e.target.value as LeadStatusKey;
        start(async () => { await setLeadStatus(id, s); toast(`Estado: ${LEAD_STATUS_LABELS[s]}`); });
      }}
    >
      {LEAD_STATUS_KEYS.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
    </select>
  );
}

export function LeadPipeline({ id, status }: { id: string; status: LeadStatusKey }) {
  const [pending, start] = useTransition();
  const idx = LEAD_STATUS_KEYS.indexOf(status);
  return (
    <ol className="grid grid-cols-2 gap-1.5 sm:grid-cols-5" aria-label="Pipeline">
      {LEAD_STATUS_KEYS.map((s, i) => {
        const active = s === status;
        const done = i < idx && status !== "perdida" && s !== "perdida";
        return (
          <li key={s}>
            <button
              type="button"
              disabled={pending || active}
              aria-current={active ? "step" : undefined}
              onClick={() => start(async () => { await setLeadStatus(id, s); toast(`Estado: ${LEAD_STATUS_LABELS[s]}`); })}
              className={cn(
                "flex min-h-11 w-full items-center justify-center rounded-lg border px-2 text-sm font-medium transition-colors duration-150",
                active ? (s === "perdida" ? "border-ink bg-ink text-white" : s === "ganha" ? "border-ok bg-ok text-white" : "border-signal bg-signal text-ink") : done ? "border-line bg-subtle text-ink-2" : "border-line-strong bg-surface hover:border-ink",
              )}
            >
              {LEAD_STATUS_LABELS[s]}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export function NoteForm({ leadId }: { leadId: string }) {
  const [state, action, pending] = useActionState(addLeadNote, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="grid gap-2">
      <input type="hidden" name="leadId" value={leadId} />
      <label htmlFor="note" className="label">Nova nota interna</label>
      <textarea id="note" name="body" className="input !min-h-20" placeholder="Ex.: Liguei às 15h, volta a ligar amanhã." />
      <div className="flex items-center justify-between gap-2">
        <FormStatus state={state && !state.ok ? state : null} />
        <SubmitButton pending={pending}>Adicionar nota</SubmitButton>
      </div>
    </form>
  );
}

export function DeleteNoteButton({ noteId, leadId }: { noteId: string; leadId: string }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} onClick={() => confirm("Apagar nota?") && start(() => deleteLeadNote(noteId, leadId))} className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger" aria-label="Apagar nota">
      <Trash2 className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
