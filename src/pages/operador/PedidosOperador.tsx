import { useOrders } from "../../useOrders";
import OrdersTable from "../../components/OrdersTable";
import { LoadState, PageHeader } from "../../components/ui";

/** Operador: gestiona el despacho (avanza estados / cancela). */
export default function PedidosOperador() {
  const { orders, loading, error, updateStatus } = useOrders();
  return (
    <div className="p3-page">
      <PageHeader title="Pedidos" subtitle="Avanza cada pedido por el flujo: pendiente → en proceso → enviado → entregado." />
      <LoadState loading={loading && orders.length === 0} error={error} />
      <OrdersTable orders={orders} showEmail onChangeStatus={updateStatus} />
    </div>
  );
}
