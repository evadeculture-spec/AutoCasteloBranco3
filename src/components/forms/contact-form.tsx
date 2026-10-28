"use client";

import { submitContact } from "@/app/actions/leads";
import { contactSchema } from "@/lib/schemas";
import { AntiSpamFields, ConsentField, Field, FormStatus, SubmitButton, useZodAction } from "./form-kit";

const SUBJECTS = ["Compra de viatura", "Procuro uma viatura", "Financiamento", "Oficina", "Retoma", "Outro assunto"];

export function ContactForm({ subject, message }: { subject?: string; message?: string }) {
  const { state, pending, errors, onSubmit, formRef, formAction } = useZodAction(submitContact, contactSchema);
  const subjects = subject && !SUBJECTS.includes(subject) ? [subject, ...SUBJECTS] : SUBJECTS;
  return (
    <form ref={formRef} action={formAction} onSubmit={onSubmit} noValidate className="card relative grid gap-4 p-5 md:p-6">
      <AntiSpamFields />
      <Field label="Assunto" name="subject" required error={errors.subject}>
        {(p) => (
          <select className="input" defaultValue={subject ?? SUBJECTS[0]} {...p}>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </Field>
      <Field label="Nome" name="name" autoComplete="name" required error={errors.name} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" name="email" type="email" autoComplete="email" required error={errors.email} />
        <Field label="Telefone" name="phone" type="tel" inputMode="tel" autoComplete="tel" error={errors.phone} />
      </div>
      <Field label="Mensagem" name="message" required error={errors.message}>
        {(p) => <textarea className="input" defaultValue={message} {...p} />}
      </Field>
      <ConsentField error={errors.consent} />
      <FormStatus state={state} />
      <SubmitButton pending={pending}>Enviar mensagem</SubmitButton>
    </form>
  );
}
