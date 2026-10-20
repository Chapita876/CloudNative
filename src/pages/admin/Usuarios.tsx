import { useMemo } from "react";
import { useOrders } from "../../useOrders";
import { LoadState, PageHeader } from "../../components/ui";
import { clp, cuentaParaPozo, formatFecha } from "../../lib/orders";

/** Admin: resumen por cliente (correo) construido a partir de los pedidos. */
export default function Usuarios() {
  const { orders, loading, error } = useOrders();

  const rows = useMemo(() => {
    const m = new Map<string, { email: string; nombre: string; pedidos: number; gastado: number; ultimo: string }>();
    for (const o of orders) {
      const cur = m.get(o.email) ?? { email: o.email, nombre: o.nombre, pedidos: 0, gastado: 0, ultimo: "" };
      cur.pedidos += 1;
      if (cuentaParaPozo(o)) cur.gastado += o.total;
      if (o.fecha > cur.ultimo) cur.ultimo = o.fecha;
      if (!cur.nombre && o.nombre) cur.nombre = o.nombre;
      m.set(o.email, cur);
    }
    return [...m.values()].sort((a, b) => b.gastado - a.gastado);
  }, [orders]);

  return (
    <div className="p3-page">
      <PageHeader title="Usuarios" subtitle="Clientes que han realizado pedidos, ordenados por monto gastado." />
      <LoadState loading={loading && orders.length === 0} error={error} />
      <div className="p3-table-wrap">
        {rows.length === 0 ? (
          <div className="p3-empty">Todavía no hay clientes con pedidos.</div>
        ) : (
          <table className="p3-table">
            <thead>
              <tr>
                <th>Correo</th>
                <th>Nombre</th>
                <th className="num">Pedidos</th>
                <th className="num">Gastado</th>
                <th>Último pedido</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.email}>
                  <td style={{ fontWeight: 600 }}>{r.email || "—"}</td>
                  <td>{r.nombre || "—"}</td>
                  <td className="num">{r.pedidos}</td>
                  <td className="num" style={{ fontWeight: 700 }}>{clp(r.gastado)}</td>
                  <td style={{ color: "#6b7280" }}>{formatFecha(r.ultimo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
