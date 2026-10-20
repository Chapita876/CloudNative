import { useMemo, useState } from "react";
import type { Estado, Order } from "../types";
import { ESTADOS, ESTADO_LABEL, SIGUIENTE, clp, formatFecha } from "../lib/orders";
import { CompraDetalle, ItemsList, StatusBadge } from "./ui";

interface Props {
  orders: Order[];
  showEmail?: boolean;
  /** Muestra botones para avanzar/cancelar pedidos (operador y admin). */
  onChangeStatus?: (id: string, estado: Estado) => Promise<void>;
  emptyText?: string;
}

export default function OrdersTable({ orders, showEmail = false, onChangeStatus, emptyText = "No hay pedidos registrados." }: Props) {
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<"todos" | Estado>("todos");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return orders.filter(
      (o) =>
        (estado === "todos" || o.estado === estado) &&
        (!t ||
          o.id.toLowerCase().includes(t) ||
          o.email.includes(t) ||
          o.nombre.toLowerCase().includes(t) ||
          o.items.some((i) => i.nombre.toLowerCase().includes(t))),
    );
  }, [orders, q, estado]);

  const change = async (id: string, e: Estado) => {
    if (!onChangeStatus) return;
    setBusy(id);
    setErr(null);
    try {
      await onChangeStatus(id, e);
    } catch (x) {
      setErr(x instanceof Error ? x.message : "No se pudo actualizar el pedido");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className="p3-toolbar">
        <input
          placeholder={showEmail ? "Buscar por correo, producto o ID…" : "Buscar por producto o ID…"}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={estado} onChange={(e) => setEstado(e.target.value as "todos" | Estado)}>
          <option value="todos">Todos los estados</option>
          {ESTADOS.map((s) => (
            <option key={s} value={s}>{ESTADO_LABEL[s]}</option>
          ))}
        </select>
      </div>
      {err && <div className="p3-error">{err}</div>}
      <div className="p3-table-wrap">
        {filtered.length === 0 ? (
          <div className="p3-empty">{orders.length === 0 ? emptyText : "Ningún pedido coincide con el filtro."}</div>
        ) : (
          <table className="p3-table">
            <thead>
              <tr>
                <th>Pedido</th>
                {showEmail && <th>Cliente (correo)</th>}
                <th>Fecha</th>
                <th>Lo que pidió</th>
                <th>Datos de compra</th>
                <th>Estado</th>
                <th className="num">Total</th>
                {onChangeStatus && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const sig = SIGUIENTE[o.estado];
                return (
                  <tr key={o.id}>
                    <td className="p3-mono">{o.id.length > 10 ? `${o.id.slice(0, 10)}…` : o.id}</td>
                    {showEmail && (
                      <td>
                        <div style={{ fontWeight: 600 }}>{o.email || "—"}</div>
                        {o.nombre && <div style={{ color: "#6b7280", fontSize: ".8rem" }}>{o.nombre}</div>}
                      </td>
                    )}
                    <td style={{ whiteSpace: "nowrap", color: "#6b7280" }}>{formatFecha(o.fecha)}</td>
                    <td><ItemsList order={o} /></td>
                    <td><CompraDetalle order={o} /></td>
                    <td><StatusBadge estado={o.estado} /></td>
                    <td className="num" style={{ fontWeight: 700 }}>{clp(o.total)}</td>
                    {onChangeStatus && (
                      <td>
                        <div className="p3-actions">
                          {sig && (
                            <button className="p3-btn sm primary" disabled={busy === o.id} onClick={() => change(o.id, sig)}>
                              {sig === "en_proceso" ? "Procesar" : `→ ${ESTADO_LABEL[sig]}`}
                            </button>
                          )}
                          {o.estado !== "cancelado" && o.estado !== "entregado" && (
                            <button className="p3-btn sm danger" disabled={busy === o.id} onClick={() => window.confirm("¿Cancelar este pedido? El monto se descontará del pozo.") && change(o.id, "cancelado")}>
                              Cancelar
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
