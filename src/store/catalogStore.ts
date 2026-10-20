import { useSyncExternalStore } from "react";
import type { Product } from "../types";
import { mockCatalog } from "../mocks/mockData";

/**
 * Store único del catálogo. Lo usan el formulario de pedidos, el catálogo público y el panel
 * de admin, así que cuando el admin edita un producto todos los componentes se actualizan.
 * En modo demo vive en localStorage (se sincroniza entre pestañas); en modo API viene de GET /catalogo.
 */
const CATALOG_KEY = "p360.catalog.v4";

const USE_MOCK =
  import.meta.env.VITE_USE_MOCK === "true" || !import.meta.env.VITE_API_BASE_URL;

function readCatalog(): Product[] {
  if (!USE_MOCK) return [];
  try {
    const raw = localStorage.getItem(CATALOG_KEY);
    if (raw) return JSON.parse(raw) as Product[];
  } catch {
    /* sin storage: seguimos en memoria */
  }
  return [...mockCatalog];
}

let catalog: Product[] = readCatalog();
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export function setCatalog(next: Product[]) {
  catalog = next;
  if (USE_MOCK) {
    try {
      localStorage.setItem(CATALOG_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }
  emit();
}

export function getCatalog() {
  return catalog;
}

function subscribe(cb: () => void) {
  subs.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === CATALOG_KEY && USE_MOCK) {
      catalog = readCatalog();
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    subs.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useStoredCatalog(): Product[] {
  return useSyncExternalStore(subscribe, getCatalog);
}

/* ---------- Ajustes de stock pendientes (modo API) ---------- */
const OVERRIDE_KEY = "p360.stockov.v1";
type Override = { base: number; stock: number };

function readOverrides(): Record<string, Override> {
  try {
    return JSON.parse(localStorage.getItem(OVERRIDE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

/** Guarda el stock descontado cuando el backend no pudo registrarlo (base = stock que tenía la API). */
export function setStockOverride(id: string, base: number, stock: number) {
  try {
    const cur = readOverrides();
    // Si ya había un ajuste pendiente, conservamos su base original.
    cur[id] = { base: cur[id]?.base ?? base, stock };
    localStorage.setItem(OVERRIDE_KEY, JSON.stringify(cur));
  } catch {
    /* ignore */
  }
}

/**
 * Normaliza lo que llega de la API: quita productos repetidos (mismo id o mismo nombre) y aplica
 * los descuentos de stock que el backend aún no refleja. Si la API cambia el stock (por ejemplo,
 * el admin lo editó o el backend sí descontó), el ajuste local se descarta.
 */
export function prepareApiCatalog(list: Product[]): Product[] {
  const seenId = new Set<string>();
  const seenName = new Set<string>();
  const unique: Product[] = [];
  for (const p of list) {
    const nameKey = p.nombre.trim().toLowerCase().replace(/\s+/g, " ");
    if (seenId.has(p.id) || seenName.has(nameKey)) continue;
    seenId.add(p.id);
    seenName.add(nameKey);
    unique.push(p);
  }
  const ov = readOverrides();
  let changed = false;
  const out = unique.map((p) => {
    const o = ov[p.id];
    if (!o) return p;
    if (p.stock === o.base) return { ...p, stock: Math.min(p.stock, o.stock) };
    delete ov[p.id];
    changed = true;
    return p;
  });
  if (changed) {
    try {
      localStorage.setItem(OVERRIDE_KEY, JSON.stringify(ov));
    } catch {
      /* ignore */
    }
  }
  return out;
}
