// Búsqueda de productos en Open Food Facts, con caché en el celular.
import { guardarProducto, leerProducto } from './db.js';

const CAMPOS = [
  'product_name', 'product_name_es', 'generic_name_es', 'brands', 'quantity',
  'image_front_url', 'image_url', 'nutriments', 'nutrition_data_per',
  'ingredients_text_es', 'ingredients_text', 'ingredients_tags', 'additives_tags',
  'categories_tags', 'labels_tags', 'serving_size', 'serving_quantity', 'allergens_tags', 'traces_tags',
].join(',');

const DIAS_CACHE = 7;

export function codigoValido(codigo) {
  return /^\d{8,14}$/.test(codigo);
}

// Devuelve { producto, origen } o { producto: null } si no existe.
// origen: 'cache' | 'internet' | 'sin-conexion'
export async function buscarProducto(codigo) {
  const local = await leerProducto(codigo);
  // Los productos incompletos (sin tabla) se vuelven a consultar al día, por si alguien los completó
  const dias = local && local.n && local.n.kcal === null ? 1 : DIAS_CACHE;
  const fresco = local && Date.now() - (local.actualizado || 0) < dias * 864e5;
  if (local && (local.fuente === 'manual' || fresco)) return { producto: local, origen: 'cache' };

  let datos;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    const resp = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${codigo}.json?fields=${CAMPOS}`,
      { signal: ctrl.signal }
    );
    clearTimeout(timer);
    // 404 = no existe; cualquier otro error es un problema del servidor, no del producto
    if (!resp.ok && resp.status !== 404) throw new Error('servidor ' + resp.status);
    datos = await resp.json();
  } catch (err) {
    if (local) return { producto: local, origen: 'sin-conexion' };
    throw new Error('sin-conexion');
  }

  if (datos.status !== 1 || !datos.product) {
    return { producto: local || null, origen: local ? 'cache' : 'internet' };
  }
  const prod = desdeOpenFoodFacts(codigo, datos.product);
  const sinNombre = prod.nombre === 'Producto sin nombre';
  // A veces el producto existe pero vacío (solo el código): lo tratamos como no encontrado
  if (sinNombre && !prod.marca && !prod.imagen && prod.n.kcal === null && !prod.ingredientesTexto) {
    return { producto: local || null, origen: local ? 'cache' : 'internet' };
  }
  if (sinNombre || !prod.marca) {
    const conocido = await buscarEnPreciosClaros(codigo);
    if (conocido) {
      if (sinNombre) prod.nombre = conocido.nombre;
      if (!prod.marca) prod.marca = conocido.marca;
      if (!prod.cantidad) prod.cantidad = conocido.cantidad;
    }
  }
  await guardarProducto(prod);
  return { producto: prod, origen: 'internet' };
}

// ---- Precios Claros (base de precios del gobierno argentino) ----
// Tiene casi todos los productos del súper, pero solo nombre, marca y tamaño (sin tabla nutricional).
// Sirve para no tener que tipear esos datos al cargar un producto a mano.
// Ojo: no es una API oficialmente documentada; si deja de andar, la app sigue funcionando sin esto.
const consultasPreciosClaros = new Map();

export function buscarEnPreciosClaros(codigo) {
  if (!consultasPreciosClaros.has(codigo)) {
    consultasPreciosClaros.set(codigo, consultarPreciosClaros(codigo));
  }
  return consultasPreciosClaros.get(codigo);
}

async function consultarPreciosClaros(codigo) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    // Pide coordenadas; usamos las de CABA (el dato del producto es el mismo en todo el país)
    const resp = await fetch(
      `https://d3e6htiiul5ek9.cloudfront.net/prod/producto?limit=1&id_producto=${codigo}&lat=-34.6037&lng=-58.3816`,
      { signal: ctrl.signal }
    );
    clearTimeout(timer);
    const datos = await resp.json();
    const p = datos.producto;
    if (!p || !p.nombre) return null;
    const presentacion = String(p.presentacion || '');
    return {
      nombre: p.nombre.trim(),
      marca: capitalizar(p.marca || ''),
      cantidad: presentacionLegible(presentacion),
      esBebida: /\b(lt|ml|cc|cl)\b/i.test(presentacion),
      noEsAlimento: esProductoNoAlimenticio(p.nombre),
    };
  } catch {
    return null;
  }
}

// Precios Claros también tiene higiene, limpieza y cosmética: los reconocemos por el nombre.
const NO_ALIMENTOS = new RegExp('\\b(' + [
  'shampoo', 'champu', 'acondicionador', 'crema para peinar', 'tintura', 'coloracion', 'gel fijador',
  'jabon', 'gel de ducha', 'desodorante', 'antitranspirante', 'perfume', 'colonia', 'talco',
  'crema dental', 'pasta dental', 'cepillo dental', 'enjuague bucal', 'hilo dental',
  'afeitar', 'afeitadora', 'maquinita', 'depilatoria', 'maquillaje', 'esmalte', 'protector solar', 'bronceador',
  'crema corporal', 'crema facial', 'crema de manos', 'locion', 'toallitas', 'toallas femeninas', 'toallas higienicas',
  'protector diario', 'protectores diarios', 'tampones', 'panales', 'panal', 'papel higienico', 'rollo de cocina',
  'servilletas', 'panuelos descartables', 'algodon', 'hisopos',
  'detergente', 'lavandina', 'lavavajillas', 'suavizante', 'quitamanchas', 'limpiador', 'limpia', 'desinfectante',
  'desengrasante', 'insecticida', 'repelente', 'cera para pisos', 'bolsas de residuos', 'esponja', 'trapo',
  'pilas', 'fosforos', 'encendedor', 'para perros', 'para gatos',
].join('|') + ')\\b');

export function esProductoNoAlimenticio(nombre) {
  const texto = (nombre || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  return NO_ALIMENTOS.test(texto);
}

function capitalizar(texto) {
  return texto.toLowerCase().replace(/(^|\s)\S/g, (l) => l.toUpperCase()).trim();
}

// "500.0 gr" → "500 g"; "2.25 lt" → "2,25 l"
function presentacionLegible(texto) {
  const m = /^([\d.]+)\s*(\w+)/.exec(texto.trim());
  if (!m) return texto;
  const unidades = { gr: 'g', grs: 'g', kg: 'kg', lt: 'l', ml: 'ml', cc: 'ml', un: 'unidades' };
  const numero = String(Number(m[1])).replace('.', ',');
  return `${numero} ${unidades[m[2].toLowerCase()] || m[2]}`;
}

// Open Food Facts traduce los ingredientes a etiquetas en inglés ("en:sugar", "en:palm-oil"…).
// Con eso sabemos si se agregó azúcar, grasa o sal, sin importar el idioma del envase.
function agregadosDesdeEtiquetas(etiquetas) {
  if (!etiquetas || etiquetas.length === 0) return null;
  const texto = etiquetas.join(' ');
  return {
    azucar: /sugar|syrup|glucose|fructose|dextrose|sucrose|honey|molasses/.test(texto),
    grasa: /oil|fat|butter|cream|margarine|lard|shortening/.test(texto),
    sodio: /salt|sodium/.test(texto),
  };
}

// Pasa los datos de Open Food Facts al formato de la app (todo cada 100 g o 100 ml).
function desdeOpenFoodFacts(codigo, p) {
  const nu = p.nutriments || {};
  const v = (clave) => {
    const x = nu[clave];
    return x === undefined || x === null || x === '' || isNaN(x) ? null : Number(x);
  };

  let kcal = v('energy-kcal_100g');
  if (kcal === null && v('energy_100g') !== null) kcal = v('energy_100g') / 4.184; // viene en kJ

  let sodioMg = null;
  if (v('sodium_100g') !== null) sodioMg = v('sodium_100g') * 1000;
  else if (v('salt_100g') !== null) sodioMg = v('salt_100g') * 400;

  const categorias = p.categories_tags || [];
  const etiquetas = p.labels_tags || [];
  const esBebida =
    p.nutrition_data_per === '100ml' ||
    (categorias.includes('en:beverages') && !categorias.includes('en:dried-products-to-be-rehydrated')) ||
    /\d\s*(ml|cc|cl|l|lt|litros?)\b/i.test(p.quantity || '');

  return {
    codigo,
    fuente: 'off',
    nombre: p.product_name_es || p.product_name || p.generic_name_es || 'Producto sin nombre',
    marca: (p.brands || '').split(',')[0].trim(),
    cantidad: p.quantity || '',
    imagen: p.image_front_url || p.image_url || null,
    esBebida,
    porcion: p.serving_quantity ? { cantidad: Number(p.serving_quantity), texto: p.serving_size || '' } : null,
    n: {
      kcal,
      azucares: v('sugars_100g'),
      azucaresAnadidos: v('added-sugars_100g'),
      grasas: v('fat_100g'),
      saturadas: v('saturated-fat_100g'),
      sodioMg,
      fibra: v('fiber_100g'),
      proteinas: v('proteins_100g'),
    },
    ingredientesTexto: p.ingredients_text_es || p.ingredients_text || '',
    aditivosTags: p.additives_tags || [],
    agregados: agregadosDesdeEtiquetas(p.ingredients_tags),
    alergenos: p.allergens_tags || [],
    trazas: p.traces_tags || [],
    tieneCafeina: (p.ingredients_tags || []).includes('en:caffeine'),
    sinTacc: etiquetas.some((t) => ['en:no-gluten', 'en:gluten-free', 'es:sin-tacc', 'ar:sin-tacc'].includes(t)),
  };
}
