import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Estado, Order } from "../types";
import { ESTADO_LABEL, clp, formatFecha } from "../lib/orders";

export function StatCard({ label, value, hint, color }: { label: string; value: ReactNode; hint?: string; color?: string }) {
  return (
    <div className="p3-card">
      <div className="p3-stat-label">{label}</div>
      <div className="p3-stat-value" style={color ? { color } : undefined}>{value}</div>
      {hint && <div className="p3-stat-hint">{hint}</div>}
    </div>
  );
}

export function StatusBadge({ estado }: { estado: Estado }) {
  return <span className={`p3-badge ${estado}`}>{ESTADO_LABEL[estado]}</span>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="p3-row">
      <div>
        <h1 className="p3-title">{title}</h1>
        {subtitle && <p className="p3-sub">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function LoadState({ loading, error }: { loading: boolean; error: string | null }) {
  if (loading) return <div className="p3-center">Cargando…</div>;
  if (error) return <div className="p3-error"><strong>Ocurrió un error:</strong> {error}</div>;
  return null;
}

/** Anima un número hasta su nuevo valor y avisa cuánto subió (para el pozo). */
export function useCountUp(target: number, ms = 700) {
  const [shown, setShown] = useState(target);
  const [delta, setDelta] = useState(0);
  const prev = useRef(target);

  useEffect(() => {
    const from = prev.current;
    if (target === from) return;
    if (target > from) setDelta(target - from);
    prev.current = target;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      setShown(Math.round(from + (target - from) * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const clear = setTimeout(() => setDelta(0), 2500);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(clear);
    };
  }, [target, ms]);

  return { shown, delta };
}

export function ItemsList({ order }: { order: Order }) {
  if (order.items.length === 0) return <span style={{ color: "#9ca3af" }}>—</span>;
  return (
    <ul className="p3-items">
      {order.items.map((i, k) => (
        <li key={k}>
          {i.cantidad} × {i.nombre} <span style={{ color: "#9ca3af" }}>({clp(i.precioUnitario)})</span>
        </li>
      ))}
    </ul>
  );
}

export const fechaCorta = formatFecha;

/** Datos del cliente y del pago ingresados al comprar. */
export function CompraDetalle({ order }: { order: Order }) {
  const { cliente: c, pago: p } = order;
  if (!c && !p) return <span style={{ color: "#9ca3af" }}>—</span>;
  return (
    <div className="p3-detail">
      {c && (
        <>
          <div><b>{c.nombre}</b></div>
          <div>{c.email}</div>
          <div>{c.telefono}</div>
          <div>{c.direccion}, {c.ciudad}</div>
        </>
      )}
      {p && (
        <div className="muted" style={{ marginTop: 4 }}>
          {p.marca} •••• {p.ultimos4} · {p.titular} · vence {p.vencimiento}
        </div>
      )}
    </div>
  );
}
