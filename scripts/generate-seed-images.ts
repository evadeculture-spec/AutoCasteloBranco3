import { mkdirSync } from "node:fs";
import sharp from "sharp";
import { slugify } from "../src/lib/format";
import { detailView, interiorView, shapeForBody, sideView } from "./car-illustration";
import { SEED_VEHICLES } from "./seed-data";

export function seedSlug(v: { brand: string; model: string; version: string; year: number }) {
  return slugify(`${v.brand} ${v.model} ${v.version} ${v.year}`);
}

async function main() {
  mkdirSync("public/seed", { recursive: true });
  for (const v of SEED_VEHICLES) {
    const slug = seedSlug(v);
    const shape = shapeForBody(v.bodyType);
    const svgs = [
      sideView(shape, v.colorHex),
      sideView(shape, v.colorHex, { mirror: true, bg: ["#efeee9", "#dedcd5"] }),
      detailView(shape, v.colorHex),
      interiorView(v.trimHex),
    ];
    await Promise.all(
      svgs.map((svg, i) =>
        sharp(Buffer.from(svg)).webp({ quality: 78 }).toFile(`public/seed/${slug}-${i + 1}.webp`),
      ),
    );
    console.log("✓", slug);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
