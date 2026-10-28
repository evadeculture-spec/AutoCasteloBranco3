import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "@/components/forms/contact-form";
import { MapEmbed } from "@/components/site/map-embed";
import { getSettings } from "@/lib/settings";
import { telHref, whatsappHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contactos",
  description: "Morada, horário, telefone, WhatsApp e formulário de contacto da AutoCasteloBranco, em Castelo Branco.",
  alternates: { canonical: "/contactos" },
};

export default async function ContactosPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const s = await getSettings();
  const subject = typeof sp.assunto === "string" ? sp.assunto.slice(0, 120) : undefined;
  const message = typeof sp.mensagem === "string" ? sp.mensagem.slice(0, 1000) : undefined;
  return (
    <div className="container-page pt-8 md:pt-12">
      <p className="spec-label">Fale connosco</p>
      <h1 className="mt-2 text-3xl md:text-[42px]">Contactos</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-5">
          <div className="card divide-y divide-line">
            {[
              { icon: Phone, label: "Stand", value: s.phone, href: telHref(s.phone) },
              { icon: Phone, label: "Oficina", value: s.phoneWorkshop, href: telHref(s.phoneWorkshop) },
              { icon: MessageCircle, label: "WhatsApp", value: `+${s.whatsapp.replace(/^(\d{3})(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3 $4")}`, href: whatsappHref(s.whatsapp, "Olá! Gostaria de mais informações."), external: true },
              { icon: Mail, label: "Email", value: s.email, href: `mailto:${s.email}` },
            ].filter((r) => r.value).map((r) => (
              <a key={r.label} href={r.href} target={r.external ? "_blank" : undefined} rel={r.external ? "noopener noreferrer" : undefined} className="flex min-h-16 items-center gap-4 px-5 py-3 transition-colors duration-150 hover:bg-bg">
                <r.icon className="h-5 w-5 text-muted" aria-hidden="true" />
                <span>
                  <span className="spec-label block">{r.label}</span>
                  <span className="num font-medium">{r.value}</span>
                </span>
              </a>
            ))}
            <div className="flex gap-4 px-5 py-4">
              <MapPin className="mt-1 h-5 w-5 text-muted" aria-hidden="true" />
              <address className="not-italic">
                <span className="spec-label block">Morada</span>
                {s.addressLine}<br />{s.postalCode} {s.city}
              </address>
            </div>
            <div className="grid grid-cols-2 gap-4 px-5 py-4">
              <div className="flex gap-3">
                <Clock className="mt-1 h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
                <div><span className="spec-label block">Stand</span><p className="num whitespace-pre-line text-[13px]">{s.hoursStand}</p></div>
              </div>
              <div><span className="spec-label block">Oficina</span><p className="num whitespace-pre-line text-[13px]">{s.hoursWorkshop}</p></div>
            </div>
          </div>
          <div className="h-72"><MapEmbed lat={s.latitude} lng={s.longitude} label={`${s.businessName}, ${s.city}`} /></div>
        </div>
        <section className="lg:col-span-7" aria-labelledby="form-t">
          <h2 id="form-t" className="mb-4 text-2xl">Enviar mensagem</h2>
          <ContactForm subject={subject} message={message} />
        </section>
      </div>
    </div>
  );
}
