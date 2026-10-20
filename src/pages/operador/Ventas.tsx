import { useOrders } from "../../useOrders";
import { LoadState, PageHeader, StatCard } from "../../components/ui";
import { calcPozo, clp, cuentaParaPozo, ventasPorDia, ventasPorProducto } from "../../lib/orders";

/** Panel de operador: ventas. */
export default function Ventas() {
  const { orders, loading, error } = useOrders();
  const validos = orders.filter(cuentaParaPozo);
  const ventas = calcPozo(orders);
  const ticket = validos.length ? ventas / validos.length : 0;
  const pendientes = orders.filter((o) => o.estado === "pendiente").length;
  const porProducto = ventasPorProducto(orders).slice(0, 6);
  const porDia = ventasPorDia(orders, 7);
  const max = Math.max(1, ...porDia.map((d) => d.monto));

  return (
    <div className="p3-page">
      <PageHeader title="Ventas" subtitle="Resumen de ventas y pedidos por atender." />
      <LoadState loading={loading && orders.length === 0} error={error} />

      <div className="p3-grid">
        <StatCard label="Ventas totales" value={clp(ventas)} color="#059669" hint="Sin pedidos cancelados" />
        <StatCard label="Pedidos" value={orders.length} />
        <StatCard label="Ticket promedio" value={clp(ticket)} />
        <StatCard label="Por atender" value={pendientes} color="#d97706" hint="Pedidos pendientes" />
      </div>

      <div className="p3-grid two">
        <div className="p3-card">
          <h3>Ventas últimos 7 días</h3>
          <div className="p3-bars">
            {porDia.map((d) => (
              <div className="p3-bar" key={d.dia} title={clp(d.monto)}>
                <i style={{ height: `${(d.monto / max) * 100}%` }} />
                <span>{d.dia}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p3-card">
          <h3>Productos más vendidos</h3>
          {porProducto.length === 0 ? (
            <p style={{ color: "#9ca3af", margin: 0 }}>Aún no hay ventas.</p>
          ) : (
            <ol className="p3-rank">
              {porProducto.map((p) => (
                <li key={p.nombre}>
                  <span>{p.nombre} <span style={{ color: "#9ca3af" }}>· {p.unidades} u.</span></span>
                  <strong>{clp(p.monto)}</strong>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
