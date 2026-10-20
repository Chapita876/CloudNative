import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApi } from "./useApi";
import { useRole } from "./useRole";
import { getCatalog, setCatalog, setStockOverride } from "./store/catalogStore";
import { bumpStats, getOrders, setOrders, useStoredOrders } from "./store/ordersStore";
import { ESTADO_API, normalizeOrder } from "./lib/orders";
import type { Checkout, Estado, Order, OrderItem } from "./types";

const POLL_MS = 8000;

const mineKey = (email: string) => `p360.mine.${email}`;
function readMine(email: string): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(mineKey(email)) ?? "[]"));
  } catch {
    return new Set();
  }
}
function saveMine(email: string, ids: Set<string>) {
  try {
    localStorage.setItem(mineKey(email), JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

const extrasKey = "p360.checkout.v1";
function readExtras(): Record<string, Checkout> {
  try {
    return JSON.parse(localStorage.getItem(extrasKey) ?? "{}");
  } catch {
    return {};
  }
}
function saveExtra(id: string, c: Checkout) {
  try {
    localStorage.setItem(extrasKey, JSON.stringify({ ...readExtras(), [id]: c }));
  } catch {
    /* ignore */
  }
}

/**
 * Pedidos visibles para el rol actual:
 *  - Usuario  → SOLO los suyos
 *  - Operador → todos (para gestionar ventas/despacho)
 *  - Admin    → todos
 *
 * "Suyo" = el pedido trae su correo / nombre / id de usuario, o es un pedido que él mismo creó
 * desde este navegador. IMPORTANTE: es un filtro de interfaz; la seguridad real debe aplicarla el
 * backend (la Lambda debe devolver al Usuario solo sus pedidos).
 */
export function useOrders() {
  const { fetchWithToken, isMock } = useApi();
  const { role, email, nombre, userId } = useRole();
  const stored = useStoredOrders();
  const [loading, setLoading] = useState(!isMock);
  const [error, setError] = useState<string | null>(null);
  /** Diagnóstico para el usuario: cuántos pedidos devolvió la API y cuántos son suyos. */
  const [diag, setDiag] = useState<{ recibidos: number; suyos: number } | null>(null);
  const seesAll = role === "Admin" || role === "Operador";
  const roleRef = useRef(role);
  roleRef.current = role;
  const fetchRef = useRef(fetchWithToken);
  fetchRef.current = fetchWithToken;

  const esMio = useCallback(
    (o: Order, mine: Set<string>) => {
      const me = [email, nombre.toLowerCase(), userId].filter(Boolean);
      return (
        mine.has(o.id) ||
        (!!o.email && o.email === email) ||
        (o.ownerIds ?? []).some((v) => me.includes(v))
      );
    },
    [email, nombre, userId],
  );

  const fetchAll = useCallback(async (): Promise<Order[]> => {
    const res = await fetchRef.current("/orden");
    if (!res.ok) throw new Error(`Error ${res.status} al cargar pedidos`);
    const data = await res.json();
    const raw = Array.isArray(data) ? data : data.items ?? data.orders ?? data.ordenes ?? [];
    return raw.map(normalizeOrder);
  }, []);

  const refresh = useCallback(async () => {
    if (isMock || !roleRef.current) return;
    try {
      let list = await fetchAll();
      const all = roleRef.current !== "Usuario";
      const recibidos = list.length;
      if (!all) {
        const mine = readMine(email);
        list = list.filter((o) => esMio(o, mine));
        setDiag({ recibidos, suyos: list.length });
      }
      list.sort((a, b) => b.fecha.localeCompare(a.fecha));
      setOrders(list, all);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [isMock, email, esMio, fetchAll]);

  useEffect(() => {
    if (isMock || !role) return;
    refresh();
    const t = setInterval(refresh, POLL_MS);
    return () => clearInterval(t);
  }, [isMock, role, refresh]);

  const orders = useMemo(() => {
    const base = seesAll ? stored : stored.filter((o) => esMio(o, readMine(email)));
    // Si la API no devuelve los datos de checkout, usamos los guardados en este navegador.
    const extras = readExtras();
    return base.map((o) => (o.cliente && o.pago) || !extras[o.id] ? o : { ...o, ...extras[o.id], ...(o.cliente ? { cliente: o.cliente } : {}), ...(o.pago ? { pago: o.pago } : {}) });
  }, [stored, seesAll, esMio, email]);

  /** Verifica que haya stock suficiente para cada producto del pedido. */
  const verificarStock = (items: OrderItem[]) => {
    const cat = getCatalog();
    for (const i of items) {
      const prod = cat.find((p) => p.id === i.productoId);
      if (prod && prod.stock < i.cantidad) {
        throw new Error(
          prod.stock <= 0
            ? `"${prod.nombre}" se agotó.`
            : `Solo quedan ${prod.stock} unidades de "${prod.nombre}".`,
        );
      }
    }
  };

  /** Descuenta del stock de la tienda las unidades compradas. */
  const descontarStock = async (items: OrderItem[]) => {
    const antes = getCatalog();
    const nuevo = antes.map((p) => {
      const comprado = items.filter((i) => i.productoId === p.id).reduce((a, i) => a + i.cantidad, 0);
      return comprado ? { ...p, stock: Math.max(0, p.stock - comprado) } : p;
    });
    setCatalog(nuevo); // la tienda se actualiza al instante
    if (isMock) return;
    // API: se intenta persistir el nuevo stock en el backend (PUT /catalogo/{id}).
    // Si tu Lambda ya descuenta el stock al crear la orden, quita este bloque para no descontar dos veces.
    for (const p of nuevo) {
      const old = antes.find((x) => x.id === p.id);
      if (!old || old.stock === p.stock) continue;
      let ok = false;
      try {
        const res = await fetchRef.current(`/catalogo/${encodeURIComponent(p.id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ProductoID: p.id, ProductID: p.id, id: p.id,
            nombre: p.nombre, name: p.nombre, productName: p.nombre,
            categoria: p.categoria, category: p.categoria,
            precio: p.precio, price: p.precio, unitPrice: p.precio,
            descripcion: p.descripcion ?? "", description: p.descripcion ?? "",
            imagen: p.imagen ?? "", imageUrl: p.imagen ?? "",
            caracteristicas: p.caracteristicas ?? [], features: p.caracteristicas ?? [],
            stock: p.stock, quantity: p.stock,
          }),
        });
        ok = res.ok;
      } catch {
        /* sin conexión con el backend */
      }
      // Si el backend no lo guardó, recordamos el descuento para que el refresco automático no lo borre.
      if (!ok) setStockOverride(p.id, old.stock, p.stock);
    }
  };

  /** Crea un pedido a nombre del usuario logueado. */
  const createOrder = useCallback(
    async (items: OrderItem[], total: number, checkout?: Checkout) => {
      verificarStock(items);
      if (isMock) {
        const nuevo: Order = {
          id: `o${Date.now().toString().slice(-6)}`,
          email,
          nombre,
          fecha: new Date().toISOString(),
          estado: "pendiente",
          total,
          items,
          ...(checkout ?? {}),
        };
        setOrders([nuevo, ...getOrders()], true);
        await descontarStock(items);
        return nuevo;
      }

      // Ids que ya existían, para detectar el pedido nuevo si la API no devuelve su id.
      let antes: Set<string> | null = null;
      try {
        antes = new Set((await fetchAll()).map((o) => o.id));
      } catch {
        /* no es crítico */
      }

      const payload = {
        customerEmail: email,
        customerName: nombre,
        items: items.map((i) => ({
          ProductoID: i.productoId,
          ProductID: i.productoId,
          productId: i.productoId,
          name: i.nombre,
          nombre: i.nombre,
          productName: i.nombre,
          price: i.precioUnitario,
          precio: i.precioUnitario,
          unitPrice: i.precioUnitario,
          cantidad: i.cantidad,
          quantity: i.cantidad,
          subtotal: i.precioUnitario * i.cantidad,
        })),
        total,
        totalAmount: total,
        montoTotal: total,
        ...(checkout ? { cliente: checkout.cliente, pago: checkout.pago } : {}),
      };
      const res = await fetchRef.current("/orden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const bodyText = await res.text().catch(() => "");
      let body: any = null;
      try {
        body = bodyText ? JSON.parse(bodyText) : null;
      } catch {
        /* respuesta no JSON */
      }
      if (!res.ok) {
        console.error("[Pedidos360] POST /orden falló", res.status, bodyText);
        throw new Error(
          `${body?.message || body?.error || bodyText.slice(0, 160) || "Error al procesar la solicitud"} (HTTP ${res.status})`,
        );
      }

      // Recordamos el pedido como "mío" aunque la API no guarde mi correo en él.
      const mine = readMine(email);
      const creado = body?.item ?? body?.order ?? body?.orden ?? body;
      const idCreado = creado?.OrdenID ?? creado?.id ?? creado?.orderId ?? creado?.ordenId;
      if (idCreado) {
        mine.add(String(idCreado));
        if (checkout) saveExtra(String(idCreado), checkout);
      } else if (antes) {
        try {
          const nuevos = (await fetchAll()).filter((o) => !antes!.has(o.id));
          if (nuevos.length === 1) {
            mine.add(nuevos[0].id);
            if (checkout) saveExtra(nuevos[0].id, checkout);
          }
        } catch {
          /* ignore */
        }
      }
      saveMine(email, mine);

      // El contador de la pantalla de inicio sube al instante (y en las demás pestañas).
      bumpStats({ pedidos: 1 });
      await descontarStock(items);
      await refresh();
      return null;
    },
    [isMock, email, nombre, refresh, fetchAll],
  );

  /** Cambia el estado de un pedido (operador/admin). */
  const updateStatus = useCallback(
    async (id: string, estado: Estado) => {
      if (isMock) {
        setOrders(
          getOrders().map((o) => (o.id === id ? { ...o, estado } : o)),
          true,
        );
        return;
      }
      // Supuesto: la API acepta PUT /orden/{id} con { estado }. Ajustar si el backend usa otra ruta.
      const res = await fetchRef.current(`/orden/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: ESTADO_API[estado], estado }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        let msg = "";
        try {
          msg = JSON.parse(txt)?.error ?? "";
        } catch {
          /* no es JSON */
        }
        throw new Error(`${msg || "No se pudo actualizar el pedido"} (HTTP ${res.status})`);
      }
      await refresh();
    },
    [isMock, refresh],
  );

  return { orders, loading, error, refresh, createOrder, updateStatus, isMock, diag };
}
