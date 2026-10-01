// Base de datos del celular (IndexedDB, usando la librería Dexie).
// productos: los consultados en Open Food Facts (caché) y los cargados a mano.
// escaneos:  registro de cada escaneo (se va a usar en el historial, etapa 2).

/* global Dexie */
export const db = new Dexie('saludablescan');

db.version(1).stores({
  productos: 'codigo, fuente, actualizado',
  escaneos: '++id, codigo, fecha',
});

export async function guardarProducto(prod) {
  prod.actualizado = Date.now();
  await db.productos.put(prod);
  return prod;
}

export function leerProducto(codigo) {
  return db.productos.get(codigo);
}

export function registrarEscaneo(codigo) {
  return db.escaneos.add({ codigo, fecha: Date.now() });
}
