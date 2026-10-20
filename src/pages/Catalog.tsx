import { Link, useLocation } from "react-router-dom";
import { useCatalog } from "../useCatalog";
import { LoadState, PageHeader } from "../components/ui";
import { clp } from "../lib/orders";
import { ProductImage } from "../components/ProductImage";

/** Catálogo compartido. `showStock` lo usan operador y admin para ver inventario. */
export default function Catalog({ showStock = false }: { showStock?: boolean }) {
  const { products, loading, error } = useCatalog();
  const base = useLocation().pathname.replace(/\/$/, "");

  return (
    <div className="p3-page">
      <PageHeader
        title={showStock ? "Inventario" : "Catálogo de productos"}
        subtitle={showStock ? "Stock disponible y precios." : "Explora los artículos disponibles."}
      />
      <LoadState loading={loading} error={error} />
      {!loading && !error && products.length === 0 && (
        <div className="p3-card p3-empty">No hay productos disponibles en este momento.</div>
      )}
      {!loading && products.length > 0 && (
        <div className="p3-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          {products.map((p) => (
            <Link
              key={p.id}
              to={`${base}/${encodeURIComponent(p.id)}`}
              className="p3-card"
              style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 0, overflow: "hidden", textDecoration: "none", color: "inherit" }}
            >
              <ProductImage nombre={p.nombre} categoria={p.categoria} src={p.imagen} />
              <div style={{ padding: "16px 20px 0" }}>
                <div className="p3-row" style={{ marginBottom: 10 }}>
                  <span style={{ fontSize: ".72rem", fontWeight: 600, color: "#2563eb", textTransform: "uppercase", background: "#eff6ff", padding: "2px 8px", borderRadius: 4 }}>
                    {p.categoria}
                  </span>
                  {(showStock || p.stock <= 0) && (
                    <span style={{ fontSize: ".78rem", fontWeight: 600, color: p.stock > 5 ? "#059669" : p.stock > 0 ? "#d97706" : "#dc2626" }}>
                      {p.stock > 0 ? `${p.stock} en stock` : "Agotado"}
                    </span>
                  )}
                </div>
                <h3 style={{ margin: "0 0 6px" }}>{p.nombre}</h3>
                {p.descripcion && (
                  <p style={{ margin: "0 0 14px", fontSize: ".85rem", color: "#6b7280", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {p.descripcion}
                  </p>
                )}
              </div>
              <div className="p3-row" style={{ borderTop: "1px solid #f3f4f6", padding: "12px 20px 16px", alignItems: "center" }}>
                <span style={{ fontSize: ".85rem", color: "#6b7280" }}>Precio unitario</span>
                <strong style={{ fontSize: "1.2rem" }}>{clp(p.precio)}</strong>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
