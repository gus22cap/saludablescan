// Base de datos del celular (IndexedDB, usando la librería Dexie).
// productos: los consultados en Open Food Facts (caché) y los cargados a mano.
// escaneos:  registro de cada escaneo (historial).
// favoritos: productos marcados con la estrella.
// ajustes:   el perfil personal y otras preferencias.

/* global Dexie */
export const db = new Dexie('saludablescan');

db.version(1).stores({
  productos: 'codigo, fuente, actualizado',
  escaneos: '++id, codigo, fecha',
});
db.version(2).stores({
  productos: 'codigo, fuente, actualizado',
  escaneos: '++id, codigo, fecha',
  favoritos: 'codigo, fecha',
  ajustes: 'clave',
});
// pendientes: productos con fotos del envase, para completar después
db.version(3).stores({
  productos: 'codigo, fuente, actualizado',
  escaneos: '++id, codigo, fecha',
  favoritos: 'codigo, fecha',
  ajustes: 'clave',
  pendientes: 'codigo, fecha',
});

// ---------- Productos ----------

export async function guardarProducto(prod) {
  prod.actualizado = Date.now();
  await db.productos.put(prod);
  return prod;
}

export function leerProducto(codigo) {
  return db.productos.get(codigo);
}

// ---------- Historial ----------

export function registrarEscaneo(codigo) {
  return db.escaneos.add({ codigo, fecha: Date.now() });
}

// Último escaneo de cada producto, del más nuevo al más viejo
export async function listarHistorial() {
  const escaneos = await db.escaneos.orderBy('fecha').reverse().toArray();
  const vistos = new Set();
  const lista = [];
  for (const e of escaneos) {
    if (vistos.has(e.codigo)) continue;
    vistos.add(e.codigo);
    lista.push({ codigo: e.codigo, fecha: e.fecha, producto: await leerProducto(e.codigo) });
  }
  return lista;
}

export function borrarHistorial() {
  return db.escaneos.clear();
}

// ---------- Favoritos ----------

export async function esFavorito(codigo) {
  return !!(await db.favoritos.get(codigo));
}

// Devuelve true si quedó como favorito
export async function alternarFavorito(codigo) {
  if (await esFavorito(codigo)) {
    await db.favoritos.delete(codigo);
    return false;
  }
  await db.favoritos.put({ codigo, fecha: Date.now() });
  return true;
}

export async function listarFavoritos() {
  const favoritos = await db.favoritos.orderBy('fecha').reverse().toArray();
  return Promise.all(favoritos.map(async (f) => ({ ...f, producto: await leerProducto(f.codigo) })));
}

// ---------- Perfil ----------

export async function leerPerfil() {
  const fila = await db.ajustes.get('perfil');
  return fila ? fila.valor : null;
}

export function guardarPerfil(perfil) {
  return db.ajustes.put({ clave: 'perfil', valor: perfil });
}

// ---------- Comparación (hasta 3 productos) ----------

export const MAX_COMPARAR = 3;

export async function leerComparacion() {
  const fila = await db.ajustes.get('comparar');
  return fila ? fila.valor : [];
}

export function guardarComparacion(codigos) {
  return db.ajustes.put({ clave: 'comparar', valor: codigos.slice(0, MAX_COMPARAR) });
}

// Devuelve 'agregado', 'ya-estaba' o 'lleno'
export async function agregarAComparacion(codigo) {
  const codigos = await leerComparacion();
  if (codigos.includes(codigo)) return 'ya-estaba';
  if (codigos.length >= MAX_COMPARAR) return 'lleno';
  await guardarComparacion([...codigos, codigo]);
  return 'agregado';
}

export async function quitarDeComparacion(codigo) {
  await guardarComparacion((await leerComparacion()).filter((c) => c !== codigo));
}

// ---------- Pendientes (fotos del envase para completar después) ----------
// { codigo, fecha, nombre, marca, cantidad, esBebida, fotos: { tabla, ingredientes, frente } }

export function guardarPendiente(pendiente) {
  return db.pendientes.put({ ...pendiente, fecha: Date.now() });
}

export function leerPendiente(codigo) {
  return db.pendientes.get(codigo);
}

export function listarPendientes() {
  return db.pendientes.orderBy('fecha').reverse().toArray();
}

export function contarPendientes() {
  return db.pendientes.count();
}

export function borrarPendiente(codigo) {
  return db.pendientes.delete(codigo);
}

// ---------- Copia de seguridad ----------

export async function exportarTodo() {
  return {
    app: 'SaludableScan',
    version: 1,
    fecha: new Date().toISOString(),
    productos: await db.productos.toArray(),
    escaneos: await db.escaneos.toArray(),
    favoritos: await db.favoritos.toArray(),
    ajustes: await db.ajustes.toArray(),
    pendientes: await db.pendientes.toArray(),
  };
}

// Suma los datos de la copia a los que ya hay (no borra nada).
// Devuelve cuántos productos trajo.
export async function importarTodo(copia) {
  if (!copia || copia.app !== 'SaludableScan') throw new Error('no es una copia de SaludableScan');
  await db.transaction('rw', db.productos, db.escaneos, db.favoritos, db.ajustes, db.pendientes, async () => {
    // Los productos cargados a mano en este celular no se pisan con versiones de Open Food Facts
    for (const p of copia.productos || []) {
      const actual = await db.productos.get(p.codigo);
      if (!actual || p.fuente === 'manual' || actual.fuente !== 'manual') await db.productos.put(p);
    }
    const yaEscaneados = new Set((await db.escaneos.toArray()).map((e) => e.codigo + '|' + e.fecha));
    const nuevos = (copia.escaneos || [])
      .filter((e) => !yaEscaneados.has(e.codigo + '|' + e.fecha))
      .map(({ codigo, fecha }) => ({ codigo, fecha }));
    await db.escaneos.bulkAdd(nuevos);
    await db.favoritos.bulkPut(copia.favoritos || []);
    await db.ajustes.bulkPut(copia.ajustes || []);
    // Pendientes: solo los que no están ya completos en este celular
    for (const pend of copia.pendientes || []) {
      const prod = await db.productos.get(pend.codigo);
      if (!prod || !prod.n || prod.n.kcal === null || prod.n.kcal === undefined) await db.pendientes.put(pend);
    }
  });
  return (copia.productos || []).length;
}
