import { Link, useLocation, useParams } from "react-router-dom";
import { useCatalog } from "../useCatalog";
import { LoadState } from "../components/ui";
import { ProductImage } from "../components/ProductImage";
import { clp } from "../lib/orders";

const labelStyle: React.CSSProperties = { fontSize: ".8rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", marginBottom: 4 };

/** Texto de respaldo para productos que llegan sin descripción (por ejemplo, desde la API). */
function descripcionAuto(nombre: string, categoria: string) {
  return `${nombre} es un producto de la categoría ${categoria.toLowerCase()} de nuestro catálogo, pensado para uso diario y con garantía de la tienda. Consulta con un operador para conocer disponibilidad y tiempos de despacho.`;
}

/** Ficha propia de cada producto: foto, descripción, precio y categoría. */
export default function ProductDetail({ showStock = false }: { showStock?: boolean }) {
  const { id = "" } = useParams();
  const { pathname } = useLocation();
  const { products, loading, error } = useCatalog();
  const product = products.find((p) => p.id === id);
  const backTo = pathname.replace(/\/[^/]+\/?$/, "");

  return (
    <div className="p3-page">
      <Link to={backTo} className="p3-btn" style={{ textDecoration: "none", display: "inline-block", marginBottom: 20 }}>
        ← Volver al catálogo
      </Link>

      <LoadState loading={loading && !product} error={error} />
      {!loading && !error && !product && (
        <div className="p3-card p3-empty">Este producto no existe o fue eliminado.</div>
      )}

      {product && (
        <div className="p3-card" style={{ padding: 0, overflow: "hidden", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          <ProductImage nombre={product.nombre} categoria={product.categoria} src={product.imagen} style={{ height: "100%", aspectRatio: "auto", minHeight: 280 }} />
          <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 14 }}>
            <span style={{ alignSelf: "flex-start", fontSize: ".72rem", fontWeight: 600, color: "#2563eb", textTransform: "uppercase", background: "#eff6ff", padding: "2px 8px", borderRadius: 4 }}>
              {product.categoria}
            </span>
            <h1 className="p3-title">{product.nombre}</h1>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#111827" }}>{clp(product.precio)}</div>

            <div>
              <div style={labelStyle}>Descripción</div>
              <p style={{ margin: 0, color: "#374151", lineHeight: 1.6 }}>
                {product.descripcion || descripcionAuto(product.nombre, product.categoria)}
              </p>
            </div>

            {product.caracteristicas && product.caracteristicas.length > 0 && (
              <div>
                <div style={labelStyle}>Características</div>
                <ul style={{ margin: 0, paddingLeft: 20, color: "#374151", lineHeight: 1.7 }}>
                  {product.caracteristicas.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {(showStock || product.stock <= 0) && (
              <div style={{ fontWeight: 600, color: product.stock > 5 ? "#059669" : product.stock > 0 ? "#d97706" : "#dc2626" }}>
                {product.stock > 0 ? `${product.stock} en stock` : "Agotado"}
              </div>
            )}
            <p className="p3-mono" style={{ margin: 0 }}>ID: {product.id}</p>
          </div>
        </div>
      )}
    </div>
  );
}
