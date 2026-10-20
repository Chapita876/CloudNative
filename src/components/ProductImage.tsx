import { useState } from "react";

const COLORS = ["#2563eb", "#7c3aed", "#059669", "#d97706", "#db2777", "#0891b2"];

/** Imagen de respaldo (SVG) cuando el producto no tiene foto o la URL falla. */
function placeholder(nombre: string, categoria: string) {
  const color = COLORS[[...categoria].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
  const letra = (nombre.trim()[0] ?? "?").toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="${color}" opacity=".12"/><text x="200" y="175" font-family="sans-serif" font-size="110" font-weight="700" fill="${color}" text-anchor="middle">${letra}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function ProductImage({
  nombre,
  categoria,
  src,
  style,
}: {
  nombre: string;
  categoria: string;
  src?: string;
  style?: React.CSSProperties;
}) {
  const [failed, setFailed] = useState(false);
  const url = src && !failed ? src : placeholder(nombre, categoria);
  return (
    <img
      src={url}
      alt={nombre}
      loading="lazy"
      onError={() => setFailed(true)}
      style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", display: "block", background: "#f3f4f6", ...style }}
    />
  );
}
