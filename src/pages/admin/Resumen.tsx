import { useOrders } from "../../useOrders";
import { LoadState, PageHeader, StatCard, useCountUp } from "../../components/ui";
import OrdersTable from "../../components/OrdersTable";
import { calcPozo, clp, cuentaParaPozo } from "../../lib/orders";

/** Admin: pozo acumulado + contadores + últimos pedidos. */
export default function Resumen() {
  const { orders, loading, error, updateStatus } = useOrders();
  const pozo = calcPozo(orders);
  const { shown, delta } = useCountUp(pozo);
  const validos = orders.filter(cuentaParaPozo).length;
  const correos = new Set(orders.map((o) => o.email).filter(Boolean)).size;

  return (
    <div className="p3-page">
      <PageHeader title="Panel de administración" subtitle="Vista general del negocio en tiempo real." />
      <LoadState loading={loading && orders.length === 0} error={error} />

      <div className="p3-pozo">
        <small>Pozo acumulado de la plataforma</small>
        <div className="p3-pozo-amount">{clp(shown)}</div>
        <div className="p3-pozo-meta">
          Suma de {validos} pedido{validos === 1 ? "" : "s"} · cada compra nueva lo hace crecer · los pedidos cancelados se descuentan
        </div>
        {delta > 0 && <div className="p3-pozo-flash">+ {clp(delta)}</div>}
      </div>

      <div className="p3-grid">
        <StatCard label="Pedidos realizados" value={orders.length} />
        <StatCard label="Clientes que han comprado" value={correos} />
        <StatCard label="Pendientes" value={orders.filter((o) => o.estado === "pendiente").length} color="#d97706" />
        <StatCard label="Entregados" value={orders.filter((o) => o.estado === "entregado").length} color="#059669" />
      </div>

      <h2 style={{ fontSize: "1.1rem", margin: "8px 0 12px" }}>Últimos pedidos</h2>
      <OrdersTable orders={orders.slice(0, 8)} showEmail onChangeStatus={updateStatus} />
    </div>
  );
}
