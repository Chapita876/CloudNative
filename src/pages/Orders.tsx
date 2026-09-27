import { useEffect, useState } from "react";
import { useApi } from "../useApi";
import { mockOrders, delay } from "../mocks/mockData";
import type { Order } from "../types";

const estadoLabel: Record<Order["estado"], string> = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export default function Orders() {
  const { fetchWithToken, isMock } = useApi();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (isMock) {
          // Sin backend todavía: usamos los datos de prueba directamente,
          // en vez de pasar por fetchWithToken.
          const data = await delay(mockOrders);
          if (!cancelled) setOrders(data);
        } else {
          // GET /orders -> Lambda orders-list (sección 8 de la guía)
          const res = await fetchWithToken("/orders");
          if (!res.ok) throw new Error(`Error ${res.status} al cargar pedidos`);
          const data: Order[] = await res.json();
          if (!cancelled) setOrders(data);
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

  if (loading) return <p>Cargando pedidos…</p>;
  if (error) return <p style={{ color: "crimson" }}>{error}</p>;

  return (
    <div>
      <h1>Pedidos</h1>
      {isMock && (
        <p style={{ fontSize: "0.85rem", color: "#888" }}>
          Mostrando datos de prueba (no hay backend conectado todavía).
        </p>
      )}
      {orders.length === 0 ? (
        <p>No hay pedidos.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">ID</th>
              <th align="left">Cliente</th>
              <th align="left">Fecha</th>
              <th align="left">Estado</th>
              <th align="right">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} style={{ borderTop: "1px solid #eee" }}>
                <td>{o.id}</td>
                <td>{o.cliente}</td>
                <td>{o.fecha}</td>
                <td>{estadoLabel[o.estado]}</td>
                <td align="right">${o.total.toLocaleString("es-CL")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}