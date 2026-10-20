import { useCallback, useEffect, useRef, useState } from "react";
import { useApi } from "./useApi";
import { getCatalog, prepareApiCatalog, setCatalog, useStoredCatalog } from "./store/catalogStore";
import type { Product } from "./types";

const POLL_MS = 15000;

function mapProduct(p: any, idx: number): Product {
  return {
    id: String(p.ProductoID ?? p.ProductID ?? p.id ?? `prod-${idx}`),
    nombre: String(p.nombre ?? p.name ?? p.productName ?? p.title ?? "Producto sin nombre"),
    precio: Number(p.precio ?? p.price ?? p.unitPrice ?? 0),
    stock: p.stock !== undefined ? Number(p.stock) : p.quantity !== undefined ? Number(p.quantity) : 99,
    categoria: String(p.categoria ?? p.category ?? "General"),
    descripcion: String(p.descripcion ?? p.description ?? ""),
    imagen: String(p.imagen ?? p.imageUrl ?? p.image ?? p.foto ?? ""),
    caracteristicas: Array.isArray(p.caracteristicas ?? p.features)
      ? (p.caracteristicas ?? p.features).map(String)
      : typeof (p.caracteristicas ?? p.features) === "string"
        ? String(p.caracteristicas ?? p.features).split("\n").map((s) => s.trim()).filter(Boolean)
        : [],
  };
}

/** Cuerpo que se envía a la API (con alias en español/inglés, igual que en los pedidos). */
function toPayload(p: Product) {
  return {
    ProductoID: p.id,
    ProductID: p.id,
    id: p.id,
    nombre: p.nombre,
    name: p.nombre,
    productName: p.nombre,
    categoria: p.categoria,
    category: p.categoria,
    precio: p.precio,
    price: p.precio,
    unitPrice: p.precio,
    stock: p.stock,
    quantity: p.stock,
    descripcion: p.descripcion ?? "",
    description: p.descripcion ?? "",
    imagen: p.imagen ?? "",
    imageUrl: p.imagen ?? "",
    caracteristicas: p.caracteristicas ?? [],
    features: p.caracteristicas ?? [],
  };
}

export type ProductInput = Omit<Product, "id"> & { id?: string };

export function useCatalog() {
  const { fetchWithToken, isMock } = useApi();
  const fetchRef = useRef(fetchWithToken);
  fetchRef.current = fetchWithToken;
  const products = useStoredCatalog();
  const [loading, setLoading] = useState(!isMock);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (isMock) return;
    try {
      const res = await fetchRef.current("/catalogo");
      if (!res.ok) throw new Error(`Error ${res.status} al cargar catálogo`);
      const data = await res.json();
      const raw: any[] = Array.isArray(data) ? data : data.items ?? data.products ?? [];
      setCatalog(prepareApiCatalog(raw.map(mapProduct)));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [isMock]);

  useEffect(() => {
    if (isMock) return;
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [isMock, load]);

  /** Crea o edita un producto (solo Admin). */
  const saveProduct = useCallback(
    async (input: ProductInput) => {
      const editing = !!input.id;
      const prod: Product = { ...input, id: input.id ?? `prod-${Date.now()}` };

      if (isMock) {
        setCatalog(
          editing
            ? getCatalog().map((p) => (p.id === prod.id ? prod : p))
            : [...getCatalog(), prod],
        );
        return;
      }

      // Supuesto: POST /catalogo (crear) y PUT /catalogo/{id} (editar). Ajustar si el backend usa otra ruta.
      const res = await fetchRef.current(editing ? `/catalogo/${encodeURIComponent(prod.id)}` : "/catalogo", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(prod)),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`${txt.slice(0, 160) || "No se pudo guardar el producto"} (HTTP ${res.status})`);
      }
      await load();
    },
    [isMock, load],
  );

  /** Elimina un producto (solo Admin). */
  const removeProduct = useCallback(
    async (id: string) => {
      if (isMock) {
        setCatalog(getCatalog().filter((p) => p.id !== id));
        return;
      }
      // Supuesto: DELETE /catalogo/{id}.
      const res = await fetchRef.current(`/catalogo/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Error ${res.status} al eliminar el producto`);
      await load();
    },
    [isMock, load],
  );

  return { products, loading, error, saveProduct, removeProduct, refresh: load };
}
