import { useEffect, useState } from "react";
import { useApi } from "../useApi";
import { mockCatalog, delay } from "../mocks/mockData";
import type { Product } from "../types";

export default function Catalog() {
  const { fetchWithToken, isMock } = useApi();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (isMock) {
          const data = await delay(mockCatalog);
          if (!cancelled) setProducts(data);
        } else {
          // GET /catalog -> Lambda catalog-list (sección 8 de la guía)
          const res = await fetchWithToken("/catalog");
          if (!res.ok) throw new Error(`Error ${res.status} al cargar catálogo`);
          const data: Product[] = await res.json();
          if (!cancelled) setProducts(data);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isMock]);

  if (loading) return <p>Cargando catálogo…</p>;
  if (error) return <p style={{ color: "crimson" }}>{error}</p>;

  return (
    <div>
      <h1>Catálogo</h1>
      {isMock && (
        <p style={{ fontSize: "0.85rem", color: "#888" }}>
          Mostrando datos de prueba (no hay backend conectado todavía).
        </p>
      )}
      {products.length === 0 ? (
        <p>No hay productos.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
          {products.map((p) => (
            <div key={p.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: "1rem" }}>
              <h3 style={{ margin: 0 }}>{p.nombre}</h3>
              <p style={{ color: "#888", margin: "0.25rem 0" }}>{p.categoria}</p>
              <p style={{ fontWeight: 600 }}>${p.precio.toLocaleString("es-CL")}</p>
              <p style={{ color: p.stock === 0 ? "crimson" : "#333" }}>
                {p.stock === 0 ? "Sin stock" : `Stock: ${p.stock}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}