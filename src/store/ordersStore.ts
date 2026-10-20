import { useSyncExternalStore } from "react";
import type { GlobalStats, Order } from "../types";
import { calcStats } from "../lib/orders";
import { mockSeedOrders } from "../mocks/mockData";

/**
 * Store único de pedidos. Todo (pozo, contadores, tablas) se DERIVA de esta lista,
 * así que cuando entra un pedido nuevo todo se actualiza solo.
 *
 * - Modo demo (sin API): los pedidos viven en localStorage, así el pozo se
 *   acumula aunque recargues y se sincroniza entre pestañas.
 * - Modo API: los pedidos viven solo en memoria (vienen de GET /orden). Lo único que se
 *   guarda en el navegador es el resumen de contadores para la pantalla de inicio.
 */

const ORDERS_KEY = "p360.orders.v1";
const STATS_KEY = "p360.stats.v1";

const USE_MOCK =
  import.meta.env.VITE_USE_MOCK === "true" || !import.meta.env.VITE_API_BASE_URL;

function readOrders(): Order[] {
  if (!USE_MOCK) return [];
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (raw) return JSON.parse(raw) as Order[];
  } catch {
    /* sin storage: seguimos en memoria */
  }
  return [...mockSeedOrders];
}

let orders: Order[] = readOrders();
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

function persistStats(list: Order[]) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(calcStats(list)));
  } catch {
    /* ignore */
  }
}

if (USE_MOCK) persistStats(orders);

/**
 * @param seesAll true si esta lista representa TODOS los pedidos (admin/operador o demo).
 *   Solo entonces se actualiza el contador global de la pantalla de inicio.
 */
export function setOrders(next: Order[], seesAll: boolean) {
  orders = next;
  if (USE_MOCK) {
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }
  if (seesAll) persistStats(next);
  emit();
}

/**
 * Suma al contador global de la pantalla de inicio sin esperar al próximo refresco del admin.
 * Se usa cuando un usuario (que no ve todos los pedidos) crea uno nuevo: el contador sube al
 * instante y las demás pestañas lo reciben por el evento "storage". El próximo refresco de un
 * admin/operador lo reemplaza por el valor real.
 */
export function bumpStats(delta: Partial<GlobalStats>) {
  let cur: GlobalStats = { pedidos: 0, enDespacho: 0, completados: 0 };
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) cur = JSON.parse(raw) as GlobalStats;
  } catch {
    /* ignore */
  }
  const next: GlobalStats = {
    pedidos: cur.pedidos + (delta.pedidos ?? 0),
    enDespacho: cur.enDespacho + (delta.enDespacho ?? 0),
    completados: cur.completados + (delta.completados ?? 0),
  };
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  emit();
}

export function getOrders() {
  return orders;
}

export function subscribe(cb: () => void) {
  subs.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === ORDERS_KEY && USE_MOCK) {
      orders = readOrders();
      cb();
    }
    if (e.key === STATS_KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    subs.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useStoredOrders(): Order[] {
  return useSyncExternalStore(subscribe, getOrders);
}

/** Contador global (pantalla de inicio). Se actualiza en vivo cuando se hace un pedido. */
export function useGlobalStats(): GlobalStats {
  const raw = useSyncExternalStore(subscribe, () => {
    try {
      return localStorage.getItem(STATS_KEY) ?? "";
    } catch {
      return "";
    }
  });
  try {
    if (raw) return JSON.parse(raw) as GlobalStats;
  } catch {
    /* ignore */
  }
  return { pedidos: 0, enDespacho: 0, completados: 0 };
}
