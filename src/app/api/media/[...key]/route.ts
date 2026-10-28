import { getCurrentUser } from "@/lib/auth";
import { getFile } from "@/lib/storage";

export async function GET(_request: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const { key: parts } = await ctx.params;
  const key = parts.join("/");
  const isPrivate = key.startsWith("leads/");
  if (isPrivate && !(await getCurrentUser())) return new Response("Não autorizado", { status: 401 });
  let file;
  try {
    file = await getFile(key);
  } catch {
    return new Response("Pedido inválido", { status: 400 });
  }
  if (!file) return new Response("Não encontrado", { status: 404 });
  return new Response(file.data, {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": isPrivate ? "private, no-store" : "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
    },
  });
}
