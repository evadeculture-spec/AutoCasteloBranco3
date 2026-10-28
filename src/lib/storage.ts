import "server-only";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Armazenamento de ficheiros, servido por /api/media/<chave>:
 * - "blobs": Netlify Blobs (por omissão dentro da Netlify)
 * - "db": tabela media_files no Postgres (por omissão no Vercel, onde o disco não é persistente)
 * - "local": disco em .data/uploads (desenvolvimento)
 */

const STORE = "acb-media";
const LOCAL_DIR = path.join(process.cwd(), ".data", "uploads");

type Driver = "blobs" | "db" | "local";

function driver(): Driver {
  const d = process.env.STORAGE_DRIVER;
  if (d === "local" || d === "blobs" || d === "db") return d;
  if (process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT || process.env.NETLIFY_SITE_ID) return "blobs";
  if (process.env.VERCEL) return "db";
  return "local";
}

function blobsEnabled(): boolean {
  return driver() === "blobs";
}

async function dbStore() {
  const [{ db, schema }, { eq }] = await Promise.all([import("@/db"), import("drizzle-orm")]);
  return { db, table: schema.mediaFiles, eq };
}

async function blobStore() {
  const { getStore } = await import("@netlify/blobs");
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_AUTH_TOKEN;
  return siteID && token ? getStore({ name: STORE, siteID, token }) : getStore(STORE);
}

function safeKey(key: string): string {
  if (!/^[a-z0-9/_.-]+$/i.test(key) || key.includes("..")) throw new Error("Chave inválida");
  return key;
}

export async function putFile(key: string, data: ArrayBuffer, contentType: string): Promise<void> {
  key = safeKey(key);
  if (driver() === "db") {
    const { db, table } = await dbStore();
    const buf = Buffer.from(data);
    await db.insert(table).values({ key, contentType, size: buf.byteLength, data: buf }).onConflictDoUpdate({ target: table.key, set: { contentType, size: buf.byteLength, data: buf } });
    return;
  }
  if (blobsEnabled()) {
    const store = await blobStore();
    await store.set(key, data, { metadata: { contentType } });
    return;
  }
  const file = path.join(LOCAL_DIR, key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, Buffer.from(data));
  await writeFile(file + ".type", contentType);
}

export async function getFile(key: string): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  key = safeKey(key);
  if (driver() === "db") {
    const { db, table, eq } = await dbStore();
    const [row] = await db.select({ data: table.data, contentType: table.contentType }).from(table).where(eq(table.key, key));
    if (!row) return null;
    const buf = row.data;
    return { data: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer, contentType: row.contentType };
  }
  if (blobsEnabled()) {
    const store = await blobStore();
    const res = await store.getWithMetadata(key, { type: "arrayBuffer" });
    if (!res) return null;
    return { data: res.data, contentType: String(res.metadata?.contentType ?? "application/octet-stream") };
  }
  try {
    const file = path.join(LOCAL_DIR, key);
    const [buf, type] = await Promise.all([readFile(file), readFile(file + ".type", "utf8").catch(() => "application/octet-stream")]);
    return { data: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer, contentType: type };
  } catch {
    return null;
  }
}

export async function deleteFile(key: string): Promise<void> {
  key = safeKey(key);
  if (driver() === "db") {
    const { db, table, eq } = await dbStore();
    await db.delete(table).where(eq(table.key, key));
    return;
  }
  if (blobsEnabled()) {
    const store = await blobStore();
    await store.delete(key);
    return;
  }
  const file = path.join(LOCAL_DIR, key);
  await Promise.all([unlink(file).catch(() => {}), unlink(file + ".type").catch(() => {})]);
}

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Valida pelos "magic bytes" e não só pelo Content-Type declarado. */
export function sniffImageType(buf: ArrayBuffer): (typeof ALLOWED_IMAGE_TYPES)[number] | null {
  const b = new Uint8Array(buf.slice(0, 16));
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) return "image/avif";
  return null;
}

export function extFor(type: string): string {
  return type.split("/")[1] === "jpeg" ? "jpg" : (type.split("/")[1] ?? "bin");
}
