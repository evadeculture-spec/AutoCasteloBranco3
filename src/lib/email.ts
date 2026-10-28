import "server-only";

type Mail = { to: string | string[]; subject: string; text: string; replyTo?: string };

export function emailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** Envia email via Resend se RESEND_API_KEY existir. Nunca lança — falhas apenas são registadas. */
export async function sendEmail(mail: Mail): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "AutoCasteloBranco <onboarding@resend.dev>",
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
        reply_to: mail.replyTo,
      }),
    });
    if (!res.ok) console.error("[email] Resend respondeu", res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error("[email] falha ao enviar", err);
    return false;
  }
}

export async function notifyTeam(subject: string, text: string, replyTo?: string) {
  const to = process.env.EMAIL_NOTIFY_TO;
  if (!to) return false;
  return sendEmail({ to: to.split(",").map((s) => s.trim()), subject, text, replyTo });
}
