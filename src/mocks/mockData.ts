import type { Order, Product } from "../types";

export const mockCatalog: Product[] = [
  { id: "p1", nombre: "Teclado mecánico", categoria: "Periféricos", precio: 45990, stock: 12 },
  { id: "p2", nombre: "Mouse inalámbrico", categoria: "Periféricos", precio: 15990, stock: 30 },
  { id: "p3", nombre: 'Monitor 27" 144Hz', categoria: "Monitores", precio: 189990, stock: 5 },
  { id: "p4", nombre: "Silla ergonómica", categoria: "Mobiliario", precio: 129990, stock: 8 },
  { id: "p5", nombre: "Webcam 1080p", categoria: "Periféricos", precio: 22990, stock: 0 },
];

export const mockOrders: Order[] = [
  {
    id: "o1001",
    cliente: "cliente@pedidos360.onmicrosoft.com",
    fecha: "2026-09-20",
    estado: "en_proceso",
    total: 61980,
    items: [
      { productoId: "p1", nombre: "Teclado mecánico", cantidad: 1, precioUnitario: 45990 },
      { productoId: "p2", nombre: "Mouse inalámbrico", cantidad: 1, precioUnitario: 15990 },
    ],
  },
  {
    id: "o1002",
    cliente: "operador@pedidos360.onmicrosoft.com",
    fecha: "2026-09-24",
    estado: "pendiente",
    total: 189990,
    items: [{ productoId: "p3", nombre: 'Monitor 27" 144Hz', cantidad: 1, precioUnitario: 189990 }],
  },
  {
    id: "o1003",
    cliente: "cliente@pedidos360.onmicrosoft.com",
    fecha: "2026-09-10",
    estado: "entregado",
    total: 129990,
    items: [{ productoId: "p4", nombre: "Silla ergonómica", cantidad: 1, precioUnitario: 129990 }],
  },
];

export function delay<T>(value: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}