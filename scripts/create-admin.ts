import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { users } from "../src/db/schema";
import { connect } from "./db";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  const email = (arg("email") ?? process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = arg("password") ?? process.env.ADMIN_PASSWORD ?? "";
  const name = arg("name") ?? process.env.ADMIN_NAME ?? "Administrador";
  if (!email || !email.includes("@")) throw new Error("Indique --email (ou ADMIN_EMAIL).");
  if (password.length < 10) throw new Error("A password tem de ter pelo menos 10 caracteres (--password ou ADMIN_PASSWORD).");

  const { db, client } = connect();
  const passwordHash = await bcrypt.hash(password, 12);
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing) {
    await db.update(users).set({ passwordHash, name }).where(eq(users.id, existing.id));
    console.log(`[admin] Password atualizada para ${email}.`);
  } else {
    await db.insert(users).values({ email, name, passwordHash });
    console.log(`[admin] Administrador ${email} criado.`);
  }
  await client.end();
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
