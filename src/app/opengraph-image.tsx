import { ImageResponse } from "next/og";

export const alt = "AutoCasteloBranco — viaturas usadas revistas e oficina própria";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f6f5f2", padding: 72, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 14, background: "#111214", display: "flex", flexWrap: "wrap", padding: 12, gap: 6 }}>
            <div style={{ width: 17, height: 17, borderRadius: 3, background: "#ff5a1f" }} />
            <div style={{ width: 17, height: 17, borderRadius: 3, background: "#fff" }} />
            <div style={{ width: 17, height: 17, borderRadius: 3, background: "#fff" }} />
            <div style={{ width: 17, height: 17, borderRadius: 3, background: "#5a5b5e" }} />
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1.5, color: "#111214" }}>AutoCasteloBranco</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -3, lineHeight: 1.02, color: "#111214" }}>Viaturas usadas revistas</div>
          <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -3, lineHeight: 1.02, color: "#5c5f66" }}>na nossa própria oficina.</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#34363b" }}>
          <div>Castelo Branco · Stand + Oficina</div>
          <div style={{ display: "flex", background: "#ff5a1f", color: "#111214", padding: "10px 20px", borderRadius: 12 }}>Demonstração</div>
        </div>
      </div>
    ),
    size,
  );
}
