"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import type { z } from "zod";
import { formDataToObject, zodErrors, type ActionResult, type FieldErrors } from "@/lib/schemas";
import { cn } from "@/lib/format";

type Action = (prev: ActionResult, fd: FormData) => Promise<ActionResult>;

/**
 * Valida no cliente com o mesmo schema Zod do servidor antes de submeter,
 * e mostra os erros devolvidos pela Server Action.
 */
export function useZodAction(action: Action, schema: z.ZodType, opts: { resetOnSuccess?: boolean } = {}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [lastState, setLastState] = useState<ActionResult>(null);

  if (state !== lastState) {
    setLastState(state);
    setClientErrors(null);
  }

  useEffect(() => {
    if (state?.ok && opts.resetOnSuccess !== false) formRef.current?.reset();
  }, [state, opts.resetOnSuccess]);

  const errors: FieldErrors = clientErrors ?? state?.errors ?? {};

  // Submissão manual: evita o reset automático do React 19 quando o servidor devolve erros
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse(formDataToObject(fd));
    if (!parsed.success) {
      const errs = zodErrors(parsed.error);
      setClientErrors(errs);
      const first = Object.keys(errs)[0];
      if (first) e.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setClientErrors(null);
    startTransition(() => formAction(fd));
  };

  return { state, formAction, pending, errors, onSubmit, formRef };
}

export function AntiSpamFields() {
  const tsRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (tsRef.current) tsRef.current.value = String(Date.now());
  }, []);
  return (
    <>
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website (não preencher)
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <input ref={tsRef} type="hidden" name="ts" defaultValue="" />
    </>
  );
}

type FieldProps = {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children?: (props: { id: string; name: string; "aria-invalid"?: boolean; "aria-describedby"?: string; required?: boolean }) => ReactNode;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "children" | "name">;

export function Field({ label, name, error, hint, required, className, children, ...input }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(" ") || undefined;
  const props = { id, name, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy, required };
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
        {required ? <span aria-hidden="true" className="text-signal-ink"> *</span> : <span className="font-normal text-muted"> (opcional)</span>}
      </label>
      {children ? children(props) : <input className="input" {...props} {...input} />}
      {hint && <p id={hintId} className="hint">{hint}</p>}
      {error && <p id={errId} className="field-error">{error}</p>}
    </div>
  );
}

export function ConsentField({ error }: { error?: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="flex items-start gap-3 text-sm leading-snug text-ink-2">
        <input
          id={id}
          type="checkbox"
          name="consent"
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : undefined}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[#111214]"
        />
        <span>
          Aceito que a AutoCasteloBranco trate estes dados para responder ao meu pedido, nos termos da{" "}
          <Link href="/privacidade" className="link" target="_blank">Política de Privacidade</Link>.
        </span>
      </label>
      {error && <p id={`${id}-err`} className="field-error">{error}</p>}
    </div>
  );
}

export function FormStatus({ state }: { state: ActionResult }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state) ref.current?.focus();
  }, [state]);
  return (
    <div ref={ref} tabIndex={-1} role={state && !state.ok ? "alert" : "status"} aria-live="polite" className="outline-none">
      {state && (
        <div
          className={cn(
            "flex animate-fade-up items-start gap-2.5 rounded-xl border p-3 text-sm",
            state.ok ? "border-[#b9dcc6] bg-ok-soft text-ok" : "border-[#f0c2bc] bg-danger-soft text-danger",
          )}
        >
          {state.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
          <p className="font-medium">{state.message}</p>
        </div>
      )}
    </div>
  );
}

export function SubmitButton({ pending, children, className }: { pending: boolean; children: ReactNode; className?: string }) {
  return (
    <button type="submit" className={cn("btn btn-primary w-full sm:w-auto", className)} disabled={pending} aria-disabled={pending}>
      {pending ? (
        <>
          <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
          A enviar…
        </>
      ) : (
        children
      )}
    </button>
  );
}
