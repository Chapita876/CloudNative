import type { Order, Product } from "../types";

export const mockCatalog: Product[] = [
  { id: "p1", nombre: "Teclado mecánico", categoria: "Periféricos", precio: 45990, stock: 12, descripcion: "Teclado NovaKey K87 — switches táctiles \"Aurora\" con 50 millones de pulsaciones, estructura de aluminio cepillado y retroiluminación RGB por tecla con 16 efectos. Teclas PBT doble inyección que no brillan con el uso, modo cableado USB-C y memoria interna para 5 perfiles.", imagen: "/products/p1.svg", caracteristicas: ["Switches táctiles \"Aurora\" de 50 millones de pulsaciones", "Retroiluminación RGB por tecla con 16 efectos", "Teclas PBT doble inyección resistentes al brillo", "Estructura de aluminio cepillado", "Conexión USB-C desmontable y memoria para 5 perfiles"] },
  { id: "p2", nombre: "Mouse inalámbrico", categoria: "Periféricos", precio: 15990, stock: 30, descripcion: "Mouse Glide Air G2 — sensor óptico de 16.000 DPI, apenas 68 g de peso y forma ergonómica para diestros. Conexión inalámbrica de 2,4 GHz con latencia mínima y hasta 90 horas de batería con una sola carga USB-C. Incluye acabado antideslizante en los costados.", imagen: "/products/p2.svg", caracteristicas: ["Sensor óptico de 16.000 DPI", "Solo 68 g de peso", "Conexión inalámbrica 2,4 GHz de baja latencia", "Hasta 90 horas de batería, carga por USB-C", "Laterales con acabado antideslizante"] },
  { id: "p3", nombre: 'Monitor 27" 144Hz', categoria: "Monitores", precio: 189990, stock: 5, descripcion: "Monitor Vividon 27 Pro — panel IPS de 27\" con resolución QHD, 144 Hz y 1 ms de respuesta. Cubre el 99% del espectro sRGB, es compatible con adaptive sync y trae soporte regulable en altura e inclinación. Tres entradas: 2 HDMI y 1 DisplayPort.", imagen: "/products/p3.svg", caracteristicas: ["Panel IPS de 27\" con resolución QHD", "144 Hz y 1 ms de tiempo de respuesta", "99% del espectro sRGB, compatible con adaptive sync", "Soporte regulable en altura e inclinación", "Entradas: 2 × HDMI y 1 × DisplayPort"] },
  { id: "p4", nombre: "Silla ergonómica", categoria: "Mobiliario", precio: 129990, stock: 8, descripcion: "Silla Ergo Horizon — respaldo de malla transpirable con soporte lumbar ajustable, asiento de espuma de alta densidad y reposabrazos 4D. Mecanismo de inclinación sincronizada hasta 135° y base de nailon reforzado con ruedas silenciosas. Soporta hasta 120 kg.", imagen: "/products/p4.svg", caracteristicas: ["Respaldo de malla transpirable con soporte lumbar ajustable", "Asiento de espuma de alta densidad", "Reposabrazos 4D regulables", "Inclinación sincronizada hasta 135°", "Soporta hasta 120 kg, ruedas silenciosas"] },
  { id: "p5", nombre: "Webcam 1080p", categoria: "Periféricos", precio: 22990, stock: 0, descripcion: "Webcam ClearView C1080 — video Full HD a 30 fps con enfoque automático y corrección de luz baja. Micrófono doble con reducción de ruido, tapa de privacidad deslizante y clip universal que sirve para monitor, notebook o trípode. Conexión plug and play por USB.", imagen: "/products/p5.svg", caracteristicas: ["Video Full HD 1080p a 30 fps", "Enfoque automático y corrección de luz baja", "Micrófono doble con reducción de ruido", "Tapa de privacidad deslizante", "Clip universal para monitor, notebook o trípode"] },
];

/** Pedidos iniciales del modo demo (solo se usan si el almacenamiento local está vacío). */
export const mockSeedOrders: Order[] = [
  {
    id: "o1001",
    email: "cliente@pedidos360.onmicrosoft.com",
    nombre: "Cliente Demo",
    fecha: "2026-09-20T12:00:00.000Z",
    estado: "en_proceso",
    total: 61980,
    items: [
      { productoId: "p1", nombre: "Teclado mecánico", cantidad: 1, precioUnitario: 45990 },
      { productoId: "p2", nombre: "Mouse inalámbrico", cantidad: 1, precioUnitario: 15990 },
    ],
  },
  {
    id: "o1002",
    email: "otro@pedidos360.onmicrosoft.com",
    nombre: "Otro Usuario",
    fecha: "2026-09-24T15:30:00.000Z",
    estado: "pendiente",
    total: 189990,
    items: [{ productoId: "p3", nombre: 'Monitor 27" 144Hz', cantidad: 1, precioUnitario: 189990 }],
  },
  {
    id: "o1003",
    email: "cliente@pedidos360.onmicrosoft.com",
    nombre: "Cliente Demo",
    fecha: "2026-09-10T09:15:00.000Z",
    estado: "entregado",
    total: 129990,
    items: [{ productoId: "p4", nombre: "Silla ergonómica", cantidad: 1, precioUnitario: 129990 }],
  },
];

export function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
