/**
 * Gera ilustrações SVG paramétricas de viaturas (perfil lateral, detalhe e interior).
 * Sem marcas nem logótipos — servem apenas como imagens de demonstração.
 */

export type Shape = "hatch" | "sedan" | "wagon" | "suv" | "mpv" | "coupe" | "van";

type Profile = {
  /** comprimento real (m) e comprimento desenhado (px) */
  lengthM: number;
  lenPx: number;
  wheelR: number;
  clearance: number;
  tailH: number;
  deckU: number;
  deckH: number;
  roofRearU: number;
  roofH: number;
  roofFrontU: number;
  wsU: number;
  hoodH: number;
  belt: number;
  wheelRearU: number;
  wheelFrontU: number;
};

// Alturas em metros, posições (U) em fração do comprimento (0 = traseira, 1 = frente)
const PROFILES: Record<Shape, Profile> = {
  hatch: { lengthM: 4.05, lenPx: 800, wheelR: 0.31, clearance: 0.16, tailH: 1.0, deckU: 0.03, deckH: 1.1, roofRearU: 0.12, roofH: 1.45, roofFrontU: 0.55, wsU: 0.74, hoodH: 0.86, belt: 0.96, wheelRearU: 0.165, wheelFrontU: 0.825 },
  sedan: { lengthM: 4.7, lenPx: 900, wheelR: 0.32, clearance: 0.14, tailH: 0.94, deckU: 0.1, deckH: 1.0, roofRearU: 0.31, roofH: 1.42, roofFrontU: 0.58, wsU: 0.74, hoodH: 0.8, belt: 0.93, wheelRearU: 0.17, wheelFrontU: 0.82 },
  wagon: { lengthM: 4.72, lenPx: 910, wheelR: 0.32, clearance: 0.14, tailH: 0.98, deckU: 0.02, deckH: 1.12, roofRearU: 0.065, roofH: 1.43, roofFrontU: 0.59, wsU: 0.75, hoodH: 0.8, belt: 0.94, wheelRearU: 0.17, wheelFrontU: 0.82 },
  suv: { lengthM: 4.45, lenPx: 880, wheelR: 0.36, clearance: 0.2, tailH: 1.1, deckU: 0.025, deckH: 1.22, roofRearU: 0.085, roofH: 1.62, roofFrontU: 0.57, wsU: 0.73, hoodH: 1.0, belt: 1.1, wheelRearU: 0.17, wheelFrontU: 0.815 },
  mpv: { lengthM: 4.6, lenPx: 890, wheelR: 0.33, clearance: 0.16, tailH: 1.06, deckU: 0.02, deckH: 1.24, roofRearU: 0.06, roofH: 1.66, roofFrontU: 0.64, wsU: 0.83, hoodH: 0.92, belt: 1.02, wheelRearU: 0.165, wheelFrontU: 0.82 },
  coupe: { lengthM: 4.6, lenPx: 900, wheelR: 0.33, clearance: 0.12, tailH: 0.9, deckU: 0.09, deckH: 0.95, roofRearU: 0.36, roofH: 1.33, roofFrontU: 0.55, wsU: 0.72, hoodH: 0.76, belt: 0.9, wheelRearU: 0.17, wheelFrontU: 0.82 },
  van: { lengthM: 4.4, lenPx: 880, wheelR: 0.33, clearance: 0.18, tailH: 1.55, deckU: 0.004, deckH: 1.7, roofRearU: 0.015, roofH: 1.82, roofFrontU: 0.74, wsU: 0.86, hoodH: 1.0, belt: 1.08, wheelRearU: 0.16, wheelFrontU: 0.83 },
};

const W = 1200;
const H = 800;
const GROUND = 640;

type Pt = [number, number];

/** Catmull-Rom → Bézier para uma curva suave pelos pontos */
function smoothPath(points: Pt[], closed = true, tension = 0.18): string {
  const n = points.length;
  const get = (i: number) => (closed ? points[(i + n) % n]! : points[Math.max(0, Math.min(n - 1, i))]!);
  let d = `M ${get(0)[0].toFixed(1)} ${get(0)[1].toFixed(1)}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) * tension, p1[1] + (p2[1] - p0[1]) * tension];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) * tension, p2[1] - (p3[1] - p1[1]) * tension];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return closed ? d + " Z" : d;
}

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function carGroup(shape: Shape, color: string, accent: string): string {
  const p = PROFILES[shape];
  const k = p.lenPx / p.lengthM; // px por metro
  const x0 = (W - p.lenPx) / 2;
  const X = (u: number) => x0 + u * p.lenPx;
  const Y = (m: number) => GROUND - m * k;
  const r = p.wheelR * k;
  const c = p.clearance;

  const upper: Pt[] = [
    [X(0.02), Y(c + 0.04)],
    [X(0.004), Y(c + 0.18)],
    [X(0.0), Y(p.tailH - 0.12)],
    [X(0.008), Y(p.tailH)],
    [X(p.deckU), Y(p.deckH)],
    [X(p.roofRearU), Y(p.roofH)],
    [X((p.roofRearU + p.roofFrontU) / 2), Y(p.roofH + 0.015)],
    [X(p.roofFrontU), Y(p.roofH - 0.02)],
    [X(p.wsU), Y(p.hoodH + 0.07)],
    [X(0.9), Y(p.hoodH - 0.02)],
    [X(0.975), Y(p.hoodH - 0.09)],
    [X(0.997), Y(p.hoodH - 0.24)],
    [X(0.998), Y(c + 0.14)],
    [X(0.985), Y(c + 0.04)],
  ];
  const bodyD = smoothPath(upper, false, 0.16) + ` Q ${X(0.5).toFixed(1)} ${Y(c - 0.01).toFixed(1)} ${X(0.02).toFixed(1)} ${Y(c + 0.04).toFixed(1)} Z`;

  const glassRearU = Math.max(p.deckU + 0.03, p.roofRearU - (p.roofRearU - p.deckU) * 0.25);
  const g = 0.055;
  const glass: Pt[] = [
    [X(glassRearU), Y(p.belt + 0.02)],
    [X(p.roofRearU + 0.018), Y(p.roofH - g)],
    [X(p.roofFrontU - 0.012), Y(p.roofH - g - 0.015)],
    [X(p.wsU - 0.03), Y(p.belt + 0.02)],
  ];
  const pillarU = p.roofRearU + (p.roofFrontU - p.roofRearU) * (shape === "coupe" ? 0.7 : 0.52);

  const wr = X(p.wheelRearU);
  const wf = X(p.wheelFrontU);
  const wy = Y(p.wheelR);

  const wheel = (cx: number) => `
    <circle cx="${cx}" cy="${wy}" r="${r + 12}" fill="#17181b"/>
    <circle cx="${cx}" cy="${wy}" r="${r}" fill="#1f2024"/>
    <circle cx="${cx}" cy="${wy}" r="${r * 0.66}" fill="url(#rim)"/>
    ${Array.from({ length: 5 }, (_, i) => {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const r1 = r * 0.16;
      const r2 = r * 0.62;
      return `<line x1="${(cx + Math.cos(a) * r1).toFixed(1)}" y1="${(wy + Math.sin(a) * r1).toFixed(1)}" x2="${(cx + Math.cos(a) * r2).toFixed(1)}" y2="${(wy + Math.sin(a) * r2).toFixed(1)}" stroke="#80858e" stroke-width="${(r * 0.14).toFixed(1)}" stroke-linecap="round"/>`;
    }).join("")}
    <circle cx="${cx}" cy="${wy}" r="${r * 0.13}" fill="#2a2c31"/>`;

  const line = shade(color, -50);
  const doorTop = Y(p.belt - 0.01);
  const doorBottom = Y(c + 0.1);
  const frontDoorU = p.wsU - 0.045;
  const rearDoorU = shape === "coupe" || shape === "van" ? null : glassRearU + 0.06;

  return `
  <ellipse cx="${W / 2}" cy="${GROUND + 4}" rx="${p.lenPx * 0.54}" ry="18" fill="url(#shadow)"/>
  <path d="${bodyD}" fill="url(#paint)" stroke="${shade(color, -65)}" stroke-width="1.5"/>
  <path d="${bodyD}" fill="url(#sheen)" opacity="0.55"/>
  <path d="${smoothPath(glass, true, 0.04)}" fill="url(#glass)"/>
  <rect x="${X(pillarU) - 6}" y="${Y(p.roofH - g + 0.01)}" width="12" height="${Y(p.belt) - Y(p.roofH - g + 0.01)}" fill="${shade(color, -75)}"/>
  <line x1="${X(pillarU)}" y1="${doorTop}" x2="${X(pillarU)}" y2="${doorBottom}" stroke="${line}" stroke-width="2"/>
  <line x1="${X(frontDoorU)}" y1="${doorTop}" x2="${X(frontDoorU - 0.012)}" y2="${doorBottom}" stroke="${line}" stroke-width="2"/>
  ${rearDoorU ? `<line x1="${X(rearDoorU)}" y1="${doorTop}" x2="${X(rearDoorU + 0.01)}" y2="${doorBottom}" stroke="${line}" stroke-width="2"/>` : ""}
  <rect x="${X(pillarU) + 22}" y="${Y(p.belt - 0.1)}" width="32" height="7" rx="3.5" fill="${shade(color, -40)}"/>
  ${rearDoorU ? `<rect x="${X(rearDoorU) + 22}" y="${Y(p.belt - 0.1)}" width="32" height="7" rx="3.5" fill="${shade(color, -40)}"/>` : ""}
  <path d="M ${X(0.01)} ${Y(p.belt - 0.04)} L ${X(0.93)} ${Y(p.hoodH - 0.08)}" stroke="#ffffff" stroke-opacity="0.28" stroke-width="2.5" fill="none"/>
  <path d="M ${X(0.03)} ${Y(c + 0.2)} L ${X(0.97)} ${Y(c + 0.2)}" stroke="#000" stroke-opacity="0.12" stroke-width="2" fill="none"/>
  <path d="M ${X(0.94)} ${Y(p.hoodH - 0.08)} Q ${X(0.985)} ${Y(p.hoodH - 0.11)} ${X(0.995)} ${Y(p.hoodH - 0.2)} L ${X(0.95)} ${Y(p.hoodH - 0.17)} Z" fill="#f4f1e8" stroke="#9aa0a8" stroke-width="1.5"/>
  <path d="M ${X(0.002)} ${Y(p.tailH - 0.06)} L ${X(0.03)} ${Y(p.tailH - 0.05)} L ${X(0.026)} ${Y(p.tailH - 0.17)} L ${X(0.0015)} ${Y(p.tailH - 0.18)} Z" fill="${accent}"/>
  ${wheel(wr)}
  ${wheel(wf)}`;
}

function defs(color: string, bg: [string, string]): string {
  return `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${bg[0]}"/>
      <stop offset="0.78" stop-color="${bg[1]}"/>
      <stop offset="1" stop-color="${shade(bg[1], -10)}"/>
    </linearGradient>
    <linearGradient id="paint" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${shade(color, 38)}"/>
      <stop offset="0.45" stop-color="${color}"/>
      <stop offset="1" stop-color="${shade(color, -48)}"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset="0.55" stop-color="#fff" stop-opacity="0.22"/>
      <stop offset="0.7" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3b4350"/>
      <stop offset="0.5" stop-color="#1c2129"/>
      <stop offset="1" stop-color="#2b323d"/>
    </linearGradient>
    <radialGradient id="rim" cx="0.4" cy="0.35" r="0.8">
      <stop offset="0" stop-color="#d9dce1"/>
      <stop offset="1" stop-color="#8b9099"/>
    </radialGradient>
    <radialGradient id="shadow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#000" stop-opacity="0.32"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#000" stroke-opacity="0.045" stroke-width="1"/>
    </pattern>
  </defs>`;
}

export function sideView(shape: Shape, color: string, opts: { mirror?: boolean; bg?: [string, string] } = {}): string {
  const bg = opts.bg ?? ["#fbfaf7", "#ecebe6"];
  const accent = "#d6452a";
  const transform = opts.mirror ? `transform="translate(${W} 0) scale(-1 1)"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${defs(color, bg)}
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <line x1="0" y1="${GROUND + 4}" x2="${W}" y2="${GROUND + 4}" stroke="#000" stroke-opacity="0.08"/>
  <g ${transform}><g transform="translate(600 ${GROUND}) scale(1.12) translate(-600 -${GROUND}) translate(0 -30)">${carGroup(shape, color, accent)}</g></g>
</svg>`;
}

export function detailView(shape: Shape, color: string): string {
  const p = PROFILES[shape];
  const x0 = (W - p.lenPx) / 2;
  const fx = x0 + p.wheelFrontU * p.lenPx;
  const fy = GROUND - p.wheelR * (p.lenPx / p.lengthM);
  const s = 1.9;
  const tx = W * 0.42 - fx * s;
  const ty = H * 0.58 - fy * s;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${defs(color, ["#f1efea", "#e2e0da"])}
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${s})">${carGroup(shape, color, "#d6452a")}</g>
</svg>`;
}

export function interiorView(trim: string): string {
  const dash = shade(trim, -10);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e9eef2"/><stop offset="1" stop-color="#cfd6dc"/>
    </linearGradient>
    <linearGradient id="dash" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${shade(dash, 25)}"/><stop offset="1" stop-color="${shade(dash, -25)}"/>
    </linearGradient>
    <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2b3340"/><stop offset="1" stop-color="#11151b"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <path d="M 0 0 L 1200 0 L 1200 120 Q 600 40 0 120 Z" fill="${shade(trim, -30)}"/>
  <path d="M 0 360 Q 600 250 1200 360 L 1200 800 L 0 800 Z" fill="url(#dash)"/>
  <path d="M 0 360 Q 600 250 1200 360" stroke="#000" stroke-opacity="0.15" stroke-width="3" fill="none"/>
  <rect x="470" y="300" width="300" height="160" rx="18" fill="url(#screen)" stroke="#000" stroke-opacity="0.3"/>
  <rect x="492" y="322" width="120" height="10" rx="5" fill="#ff5a1f" opacity="0.85"/>
  <rect x="492" y="346" width="200" height="8" rx="4" fill="#ffffff" opacity="0.25"/>
  <rect x="492" y="366" width="160" height="8" rx="4" fill="#ffffff" opacity="0.18"/>
  <rect x="492" y="400" width="60" height="40" rx="8" fill="#ffffff" opacity="0.12"/>
  <rect x="562" y="400" width="60" height="40" rx="8" fill="#ffffff" opacity="0.12"/>
  <rect x="632" y="400" width="60" height="40" rx="8" fill="#ffffff" opacity="0.12"/>
  <rect x="140" y="330" width="230" height="110" rx="20" fill="#14171c"/>
  <circle cx="210" cy="385" r="38" fill="none" stroke="#ffffff" stroke-opacity="0.3" stroke-width="6"/>
  <circle cx="300" cy="385" r="38" fill="none" stroke="#ffffff" stroke-opacity="0.3" stroke-width="6"/>
  <path d="M 210 385 L 232 360" stroke="#ff5a1f" stroke-width="5" stroke-linecap="round"/>
  <circle cx="255" cy="560" r="190" fill="none" stroke="${shade(trim, -45)}" stroke-width="38"/>
  <circle cx="255" cy="560" r="58" fill="${shade(trim, -35)}"/>
  <rect x="80" y="545" width="350" height="30" rx="15" fill="${shade(trim, -45)}"/>
  <rect x="860" y="380" width="200" height="22" rx="11" fill="${shade(trim, -30)}"/>
  <rect x="560" y="520" width="120" height="280" rx="30" fill="${shade(trim, -20)}"/>
  <circle cx="620" cy="600" r="26" fill="${shade(trim, -45)}"/>
</svg>`;
}

export function shapeForBody(body: string): Shape {
  switch (body) {
    case "citadino":
    case "utilitario":
      return "hatch";
    case "berlina":
      return "sedan";
    case "carrinha":
      return "wagon";
    case "suv":
      return "suv";
    case "monovolume":
      return "mpv";
    case "coupe":
      return "coupe";
    case "comercial":
      return "van";
    default:
      return "hatch";
  }
}
