"use client";

import { useActionState } from "react";
import { saveSettings } from "@/app/admin/actions/settings";
import { FormStatus, SubmitButton } from "@/components/forms/form-kit";
import type { SiteSettings } from "@/lib/settings-schema";

type Def = { name: keyof SiteSettings; label: string; type?: string; textarea?: boolean; hint?: string; span?: boolean };

const GROUPS: { title: string; fields: Def[] }[] = [
  {
    title: "Barra de demonstração",
    fields: [{ name: "demoBanner", label: "Texto da barra DEMO", hint: "Deixe vazio para esconder a barra.", span: true }],
  },
  {
    title: "Empresa e contactos",
    fields: [
      { name: "businessName", label: "Nome comercial" },
      { name: "legalName", label: "Denominação social" },
      { name: "nif", label: "NIF" },
      { name: "email", label: "Email", type: "email" },
      { name: "phone", label: "Telefone do stand", type: "tel" },
      { name: "phoneWorkshop", label: "Telefone da oficina", type: "tel" },
      { name: "whatsapp", label: "WhatsApp", hint: "Só dígitos com indicativo, ex.: 351912345678" },
    ],
  },
  {
    title: "Morada e mapa",
    fields: [
      { name: "addressLine", label: "Morada", span: true },
      { name: "postalCode", label: "Código postal" },
      { name: "city", label: "Localidade" },
      { name: "latitude", label: "Latitude", type: "text" },
      { name: "longitude", label: "Longitude", type: "text" },
    ],
  },
  {
    title: "Horários (texto público)",
    fields: [
      { name: "hoursStand", label: "Horário do stand", textarea: true },
      { name: "hoursWorkshop", label: "Horário da oficina", textarea: true, hint: "As vagas de marcação configuram-se em Oficina › Horário e vagas." },
    ],
  },
  {
    title: "Financiamento (simulador)",
    fields: [
      { name: "financingTan", label: "TAN (%)", type: "text" },
      { name: "financingTaeg", label: "TAEG ilustrativa (%)", type: "text" },
      { name: "financingMaxMonths", label: "Prazo máximo (meses)", type: "number" },
    ],
  },
];

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, action, pending] = useActionState(saveSettings, null);
  const e = state?.errors ?? {};
  return (
    <form action={action} className="grid gap-6">
      {GROUPS.map((g) => (
        <section key={g.title} className="card p-5 md:p-6">
          <h2 className="mb-4 text-lg">{g.title}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {g.fields.map((f) => {
              const id = `set-${f.name}`;
              const val = String(settings[f.name] ?? "");
              return (
                <div key={f.name} className={f.span ? "md:col-span-2" : undefined}>
                  <label htmlFor={id} className="label">{f.label}</label>
                  {f.textarea ? (
                    <textarea id={id} name={f.name} defaultValue={val} className="input num !min-h-24 text-sm" aria-invalid={e[f.name] ? true : undefined} />
                  ) : (
                    <input id={id} name={f.name} type={f.type ?? "text"} defaultValue={val} className="input" aria-invalid={e[f.name] ? true : undefined} />
                  )}
                  {f.hint && <p className="hint">{f.hint}</p>}
                  {e[f.name] && <p className="field-error">{e[f.name]}</p>}
                </div>
              );
            })}
          </div>
        </section>
      ))}
      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <div className="min-w-0 flex-1"><FormStatus state={state} /></div>
        <SubmitButton pending={pending}>Guardar definições</SubmitButton>
      </div>
    </form>
  );
}
