import { useState } from "react";
import { useOrders } from "../../useOrders";
import { useRole } from "../../useRole";
import OrdersTable from "../../components/OrdersTable";
import OrderForm from "../OrderForm";
import { LoadState, PageHeader, StatCard } from "../../components/ui";
import { calcPozo, clp } from "../../lib/orders";

/** Panel de usuario: solo ve y crea SUS pedidos. */
export default function MisPedidos() {
  const { orders, loading, error, createOrder, diag, isMock } = useOrders();
  const { email, nombre } = useRole();
  const [showForm, setShowForm] = useState(false);
  const [ok, setOk] = useState(false);

  const activos = orders.filter((o) => o.estado === "pendiente" || o.estado === "en_proceso" || o.estado === "enviado").length;

  return (
    <div className="p3-page">
      <PageHeader
        title="Mis pedidos"
        subtitle={`Pedidos realizados con ${email}`}
        action={
          !showForm && <button className="p3-btn primary" onClick={() => setShowForm(true)}>+ Nuevo pedido</button>
        }
      />
      <LoadState loading={loading && orders.length === 0} error={error} />
      {ok && <div className="p3-notice" style={{ background: "#ecfdf5", borderColor: "#10b981", color: "#065f46" }}>✓ Pedido guardado correctamente.</div>}

      <div className="p3-grid">
        <StatCard label="Mis pedidos" value={orders.length} />
        <StatCard label="En curso" value={activos} color="#d97706" />
        <StatCard label="Total gastado" value={clp(calcPozo(orders))} color="#059669" />
      </div>

      {showForm && (
        <div style={{ marginBottom: 24 }}>
          <OrderForm
            onSubmit={createOrder}
            defaultNombre={nombre}
            defaultEmail={email}
            onDone={() => {
              setShowForm(false);
              setOk(true);
              setTimeout(() => setOk(false), 5000);
            }}
          />
        </div>
      )}

      <OrdersTable orders={orders} emptyText="Aún no has realizado pedidos." />
      {!isMock && diag && diag.recibidos > 0 && diag.suyos === 0 && (
        <p style={{ color: "#9ca3af", fontSize: ".8rem", marginTop: 12 }}>
          Diagnóstico: la API devolvió {diag.recibidos} pedido(s), pero ninguno está asociado a tu cuenta ({email}).
        </p>
      )}
    </div>
  );
}
