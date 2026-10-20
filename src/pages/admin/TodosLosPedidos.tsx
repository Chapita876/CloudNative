import { useOrders } from "../../useOrders";
import OrdersTable from "../../components/OrdersTable";
import { LoadState, PageHeader } from "../../components/ui";

/** Admin: todos los pedidos de todas las personas, con correo y lo que pidieron. */
export default function TodosLosPedidos() {
  const { orders, loading, error, updateStatus } = useOrders();
  return (
    <div className="p3-page">
      <PageHeader title="Todos los pedidos" subtitle="Cada pedido con el correo del cliente y el detalle de lo que pidió." />
      <LoadState loading={loading && orders.length === 0} error={error} />
      <OrdersTable orders={orders} showEmail onChangeStatus={updateStatus} />
    </div>
  );
}
