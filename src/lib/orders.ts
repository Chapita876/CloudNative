import type { Estado, GlobalStats, Order, OrderItem } from "../types";

export const ESTADOS: Estado[] = ["pendiente", "en_proceso", "enviado", "entregado", "cancelado"];

export const ESTADO_LABEL: Record<Estado, string> = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

/** Siguiente paso natural del flujo de un pedido (para el botón "Avanzar"). */
export const SIGUIENTE: Partial<Record<Estado, Estado>> = {
  pendiente: "en_proceso",
  en_proceso: "enviado",
  enviado: "entregado",
};

/** Valor de `status` que espera la API (inglés). normEstado hace el camino inverso. */
export const ESTADO_API: Record<Estado, string> = {
  pendiente: "pending",
  en_proceso: "confirmed",
  enviado: "shipped",
  entregado: "delivered",
  cancelado: "cancelled",
};

export const clp = (n: number) => "$" + Math.round(n).toLocaleString("es-CL");

export function formatFecha(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso || "-";
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function normEstado(raw: unknown): Estado {
  const s = String(raw ?? "pendiente").toLowerCase();
  const map: Record<string, Estado> = {
    pending: "pendiente",
    pendiente: "pendiente",
    confirmed: "en_proceso",
    processing: "en_proceso",
    en_proceso: "en_proceso",
    shipped: "enviado",
    enviado: "enviado",
    delivered: "entregado",
    entregado: "entregado",
    cancelled: "cancelado",
    canceled: "cancelado",
    cancelado: "cancelado",
  };
  return map[s] ?? "pendiente";
}

/** Convierte lo que devuelva la API (campos en español o inglés) al formato interno. */
export function normalizeOrder(raw: any, idx = 0): Order {
  const items: OrderItem[] = (Array.isArray(raw?.items) ? raw.items : []).map((i: any) => ({
    productoId: String(i.ProductoID ?? i.ProductID ?? i.productId ?? i.productoId ?? i.id ?? ""),
    nombre: String(i.nombre ?? i.productName ?? i.name ?? "Producto"),
    cantidad: Number(i.cantidad ?? i.quantity ?? 1),
    precioUnitario: Number(i.precioUnitario ?? i.precio ?? i.unitPrice ?? i.price ?? 0),
  }));

  const candidates = [raw?.customerEmail, raw?.email, raw?.userEmail, raw?.cliente, raw?.customerName]
    .filter(Boolean)
    .map(String);
  const email = (candidates.find((c) => c.includes("@")) ?? candidates[0] ?? "").toLowerCase();

  const sumItems = items.reduce((a, i) => a + i.cantidad * i.precioUnitario, 0);
  const total = Number(raw?.total ?? raw?.totalAmount ?? raw?.montoTotal ?? sumItems) || 0;

  const ownerIds = [
    raw?.customerEmail, raw?.email, raw?.userEmail, raw?.cliente, raw?.customerName, raw?.nombre,
    raw?.userId, raw?.UsuarioID, raw?.usuarioId, raw?.sub, raw?.oid, raw?.createdBy, raw?.usuario, raw?.user,
  ]
    .filter((v) => typeof v === "string" && v)
    .map((v) => String(v).toLowerCase());

  const c = raw?.cliente && typeof raw.cliente === "object" ? raw.cliente : raw?.customer;
  const p = raw?.pago && typeof raw.pago === "object" ? raw.pago : raw?.payment;
  const cliente = c
    ? {
        nombre: String(c.nombre ?? c.name ?? ""),
        email: String(c.email ?? ""),
        telefono: String(c.telefono ?? c.phone ?? ""),
        direccion: String(c.direccion ?? c.address ?? ""),
        ciudad: String(c.ciudad ?? c.city ?? ""),
      }
    : undefined;
  const pago = p
    ? {
        marca: String(p.marca ?? p.brand ?? "Visa"),
        titular: String(p.titular ?? p.holder ?? ""),
        ultimos4: String(p.ultimos4 ?? p.last4 ?? ""),
        vencimiento: String(p.vencimiento ?? p.expiry ?? ""),
      }
    : undefined;

  return {
    cliente,
    pago,
    ownerIds,
    id: String(raw?.OrdenID ?? raw?.id ?? raw?.orderId ?? `order-${idx}`),
    email,
    nombre: String(raw?.customerName && !String(raw.customerName).includes("@") ? raw.customerName : raw?.nombre ?? ""),
    fecha: String(raw?.createdAt ?? raw?.fecha ?? ""),
    estado: normEstado(raw?.status ?? raw?.estado),
    total,
    items,
  };
}

/** El dinero de un pedido cancelado no entra al pozo. */
export const cuentaParaPozo = (o: Order) => o.estado !== "cancelado";

export function calcPozo(orders: Order[]): number {
  return orders.filter(cuentaParaPozo).reduce((a, o) => a + o.total, 0);
}

export function calcStats(orders: Order[]): GlobalStats {
  return {
    pedidos: orders.length,
    enDespacho: orders.filter((o) => o.estado === "enviado").length,
    completados: orders.filter((o) => o.estado === "entregado").length,
  };
}

export function ventasPorProducto(orders: Order[]) {
  const m = new Map<string, { nombre: string; unidades: number; monto: number }>();
  for (const o of orders.filter(cuentaParaPozo)) {
    for (const i of o.items) {
      const k = i.productoId || i.nombre;
      const cur = m.get(k) ?? { nombre: i.nombre, unidades: 0, monto: 0 };
      cur.unidades += i.cantidad;
      cur.monto += i.cantidad * i.precioUnitario;
      m.set(k, cur);
    }
  }
  return [...m.values()].sort((a, b) => b.monto - a.monto);
}

export function ventasPorDia(orders: Order[], dias = 7) {
  const out: { dia: string; monto: number }[] = [];
  const hoy = new Date();
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const monto = orders
      .filter(cuentaParaPozo)
      .filter((o) => {
        const f = new Date(o.fecha);
        return !isNaN(f.getTime()) && f.toISOString().slice(0, 10) === key;
      })
      .reduce((a, o) => a + o.total, 0);
    out.push({ dia: d.toLocaleDateString("es-CL", { weekday: "short", day: "numeric" }), monto });
  }
  return out;
}
