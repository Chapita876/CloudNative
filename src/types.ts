export interface Order {
  id: string;
  cliente: string;
  fecha: string; // ISO date
  estado: "pendiente" | "en_proceso" | "enviado" | "entregado" | "cancelado";
  total: number;
  items: OrderItem[];
}

export interface OrderItem {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

export interface Product {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
}