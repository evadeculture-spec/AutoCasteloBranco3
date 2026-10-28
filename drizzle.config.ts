import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL || "postgres://acb:acb@localhost:5432/acb",
  },
  strict: true,
});
