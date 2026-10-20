import { useState } from "react";
import { useCatalog } from "../useCatalog";
import { clp } from "../lib/orders";
import type { Checkout, OrderItem, Product } from "../types";
import CheckoutModal from "../components/CheckoutModal";

export default function OrderForm({
  onSubmit,
  onDone,
  defaultNombre,
  defaultEmail,
}: {
  onSubmit: (items: OrderItem[], total: number, checkout: Checkout) => Promise<unknown>;
  onDone?: () => void;
  defaultNombre?: string;
  defaultEmail?: string;
}) {
  const { products, loading, error } = useCatalog();
  const [checkout, setCheckout] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const add = () => {
    const prod = products.find((p) => p.id === selectedId);
    if (!prod) return;
    const enCarro = cart.find((i) => i.product.id === prod.id)?.quantity ?? 0;
    const disponible = prod.stock - enCarro;
    if (quantity > disponible) {
      setMsg(disponible <= 0 ? `Ya agregaste todo el stock de "${prod.nombre}".` : `Solo quedan ${disponible} unidades más de "${prod.nombre}".`);
      return;
    }
    setMsg(null);
    setCart((prev) => {
      const ex = prev.find((i) => i.product.id === prod.id);
      return ex
        ? prev.map((i) => (i.product.id === prod.id ? { ...i, quantity: i.quantity + quantity } : i))
        : [...prev, { product: prod, quantity }];
    });
    setSelectedId("");
    setQuantity(1);
  };

  const total = cart.reduce((a, i) => a + i.product.precio * i.quantity, 0);

  const save = async (data: Checkout) => {
    if (cart.length === 0) return;
    setMsg(null);
    try {
      const items: OrderItem[] = cart.map((i) => ({
        productoId: i.product.id,
        nombre: i.product.nombre,
        cantidad: i.quantity,
        precioUnitario: i.product.precio,
      }));
      await onSubmit(items, total, data);
      setCart([]);
      setCheckout(false);
      onDone?.();
    } catch (e) {
      // El modal muestra el error y deja reintentar.
      throw new Error(e instanceof Error ? e.message : "Error de conexión");
    }
  };

  return (
    <div className="p3-card">
      <h3>Crear nuevo pedido</h3>
      {loading && <p>Cargando catálogo…</p>}
      {error && <div className="p3-error">{error}</div>}
      {!loading && !error && (
        <div className="p3-toolbar">
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} style={{ flex: 1, minWidth: 220 }}>
            <option value="">-- Selecciona un producto --</option>
            {products.map((p) => (
              <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                {p.nombre} — {clp(p.precio)} · stock: {p.stock}{p.stock <= 0 ? " (agotado)" : ""}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            style={{ width: 80, flex: "none", minWidth: 0 }}
          />
          <button type="button" className="p3-btn primary" onClick={add} disabled={!selectedId}>Agregar</button>
        </div>
      )}

      {cart.length === 0 ? (
        <p style={{ color: "#9ca3af", margin: 0 }}>Añade productos para habilitar el guardado.</p>
      ) : (
        <>
          <ul className="p3-items" style={{ marginBottom: 12 }}>
            {cart.map((i) => (
              <li key={i.product.id} style={{ marginBottom: 4 }}>
                {i.product.nombre} × {i.quantity} — {clp(i.product.precio * i.quantity)}{" "}
                <button
                  onClick={() => setCart((p) => p.filter((x) => x.product.id !== i.product.id))}
                  style={{ border: "none", background: "transparent", color: "#ef4444", cursor: "pointer", fontWeight: 700 }}
                  aria-label={`Quitar ${i.product.nombre}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 12 }}>Total: {clp(total)}</div>
          <button className="p3-btn primary" style={{ width: "100%", padding: 12 }} onClick={() => setCheckout(true)}>
            Comprar

          </button>
        </>
      )}
      {msg && <div className="p3-error" style={{ marginTop: 12 }}>{msg}</div>}
      {checkout && (
        <CheckoutModal
          total={total}
          defaultNombre={defaultNombre}
          defaultEmail={defaultEmail}
          onCancel={() => setCheckout(false)}
          onConfirm={save}
        />
      )}
    </div>
  );
}
