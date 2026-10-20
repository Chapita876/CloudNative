export type Estado = "pendiente" | "en_proceso" | "enviado" | "entregado" | "cancelado";

export type Role = "Admin" | "Operador" | "Usuario";

export interface OrderItem {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

export interface Cliente {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
}

/** Pago con tarjeta. Nunca se guarda el número completo ni el CVV. */
export interface Pago {
  marca: string;
  titular: string;
  ultimos4: string;
  vencimiento: string; // MM/AA
}

export interface Checkout {
  cliente: Cliente;
  pago: Pago;
}

export interface Order {
  id: string;
  /** Correo de quien hizo el pedido */
  email: string;
  nombre: string;
  fecha: string; // ISO
  estado: Estado;
  total: number;
  items: OrderItem[];
  /** Todos los datos de la API que pueden identificar al dueño (correo, nombre, id de usuario…) en minúsculas. */
  ownerIds?: string[];
  /** Datos de despacho y pago ingresados al comprar. */
  cliente?: Cliente;
  pago?: Pago;
}

export interface Product {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  /** Texto largo que se muestra en la ficha del producto. */
  descripcion?: string;
  /** URL de la foto (o data URL si se subió desde el panel admin). */
  imagen?: string;
  /** Lista de características que se muestra en la ficha del producto. */
  caracteristicas?: string[];
}

export interface GlobalStats {
  pedidos: number;
  enDespacho: number;
  completados: number;
}
