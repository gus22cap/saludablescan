// Perfil personal: preferencias, alergias e ingredientes a evitar.
// Con el perfil se calcula un puntaje personal y se arman alertas para cada producto.
import { normalizar } from './analisis.js';
import { esEdulcorante } from './aditivos.js';

// "Cuido…": si el producto tiene ese octógono, baja el puntaje personal
export const CUIDADOS = [
  { id: 'azucar', texto: 'Cuido el azúcar', sello: 'azucares', resta: 15 },
  { id: 'sal', texto: 'Cuido la sal', sello: 'sodio', resta: 15 },
  { id: 'grasas', texto: 'Cuido las grasas', sello: ['grasas', 'saturadas'], resta: 10 },
  { id: 'calorias', texto: 'Cuido las calorías', sello: 'calorias', resta: 10 },
];

// "Evito…": si el producto lo tiene, alerta roja
export const EVITAR = [
  { id: 'edulcorantes', texto: 'Edulcorantes' },
  { id: 'aspartamo', texto: 'Aspartamo' },
  { id: 'colorantes', texto: 'Colorantes artificiales' },
  { id: 'conservantes', texto: 'Conservantes' },
  { id: 'cafeina', texto: 'Cafeína' },
];

// Alergias e intolerancias: palabras a buscar en los ingredientes y etiquetas de Open Food Facts
export const ALERGIAS = [
  {
    id: 'gluten', texto: 'Gluten (celiaquía / TACC)', tags: ['en:gluten'],
    palabras: /\b(trigo|avena|cebada|centeno|gluten|malta|semola|salvado de trigo|harina(?! de (maiz|arroz|mandioca|garbanzos?|soja|almendras?|coco|lino|quinoa|algarroba))|pan rallado)\b/,
  },
  { id: 'leche', texto: 'Leche / lactosa', tags: ['en:milk'], palabras: /\b(leche(?! de (coco|almendras?|soja|avena|arroz))|lactosa|suero|lacteos?|caseina|caseinato|manteca(?! de cacao)|crema de leche|queso|yogur|ricota|muzzarella|mozzarella)\b/ },
  { id: 'huevo', texto: 'Huevo', tags: ['en:eggs'], palabras: /\b(huevos?|clara de huevo|yema|albumina|ovoalbumina)\b/ },
  { id: 'mani', texto: 'Maní', tags: ['en:peanuts'], palabras: /\b(mani|cacahuate|cacahuete)\b/ },
  { id: 'frutos-secos', texto: 'Frutos secos', tags: ['en:nuts'], palabras: /\b(almendras?|nuez|nueces|avellanas?|castanas? de caju|caju|anacardos?|pistachos?|pecan|macadamia)\b/ },
  { id: 'soja', texto: 'Soja', tags: ['en:soybeans'], palabras: /\b(soja|soya)\b/ },
  { id: 'pescado', texto: 'Pescado', tags: ['en:fish'], palabras: /\b(pescados?|atun|anchoas?|merluza|salmon|sardinas?|caballa|bacalao)\b/ },
  { id: 'mariscos', texto: 'Mariscos', tags: ['en:crustaceans', 'en:molluscs'], palabras: /\b(mariscos?|camarones?|langostinos?|crustaceos?|moluscos?|calamar(es)?|mejillones?|cangrejo)\b/ },
  { id: 'sesamo', texto: 'Sésamo', tags: ['en:sesame-seeds'], palabras: /\b(sesamo|tahini|ajonjoli)\b/ },
];

export function perfilVacio() {
  return { cuidados: [], evitar: [], alergias: [], ingredientes: '' };
}

export function perfilActivo(perfil) {
  return !!perfil && (perfil.cuidados.length || perfil.evitar.length || perfil.alergias.length || perfil.ingredientes.trim());
}

// Separa los ingredientes de la parte de "puede contener" (trazas)
function partesDelTexto(textoNormalizado) {
  const corte = /(puede contener|contiene trazas|elaborado en (una )?(planta|linea) que (tambien )?(procesa|elabora))/.exec(textoNormalizado);
  if (!corte) return { contiene: textoNormalizado, trazas: '' };
  return { contiene: textoNormalizado.slice(0, corte.index), trazas: textoNormalizado.slice(corte.index) };
}

// Devuelve { alertas: [{ nivel: 'rojo'|'amarillo', texto }], puntaje, restas: [{ puntos, texto }] }
export function evaluarParaMi(prod, analisis, perfil) {
  const resultado = { alertas: [], puntaje: analisis.puntaje, restas: [] };
  if (!perfilActivo(perfil)) return resultado;

  const texto = normalizar(prod.ingredientesTexto);
  const { contiene, trazas } = partesDelTexto(texto);
  const hayIngredientes = texto.replace(/[^a-z]/g, '').length > 5;
  const rojo = (t) => resultado.alertas.push({ nivel: 'rojo', texto: t });
  const amarillo = (t) => resultado.alertas.push({ nivel: 'amarillo', texto: t });

  // Alergias
  const tagsAlergenos = prod.alergenos || [];
  const tagsTrazas = prod.trazas || [];
  for (const id of perfil.alergias) {
    const a = ALERGIAS.find((x) => x.id === id);
    if (!a) continue;
    if (id === 'gluten' && prod.sinTacc) continue; // lleva el sello "Sin TACC"
    const nombre = a.texto.split(' (')[0].toLowerCase(); // "Gluten (celiaquía / TACC)" → "gluten"
    if (a.tags.some((t) => tagsAlergenos.includes(t)) || a.palabras.test(contiene)) rojo(`Contiene ${nombre}`);
    else if (a.tags.some((t) => tagsTrazas.includes(t)) || (trazas && a.palabras.test(trazas))) amarillo(`Puede contener trazas de ${nombre}`);
  }

  // Cosas que el usuario evita
  const aditivos = analisis.aditivos;
  const tiene = {
    edulcorantes: analisis.leyendas.edulcorantes || aditivos.some((x) => esEdulcorante(x.codigo)),
    aspartamo: aditivos.some((x) => x.codigo === 'e951' || x.codigo === 'e962') || /aspartam/.test(texto),
    colorantes: aditivos.some((x) => x.f === 'colorante' && x.r !== 'bajo'),
    conservantes: aditivos.some((x) => x.f === 'conservante'),
    cafeina: analisis.leyendas.cafeina || /\b(cafe|nescafe|cafeina|guarana|mate|yerba)\b/.test(normalizar(prod.nombre)),
  };
  for (const id of perfil.evitar) {
    const e = EVITAR.find((x) => x.id === id);
    if (e && tiene[id]) rojo(`Tiene ${e.texto.toLowerCase()}`);
  }

  // Ingredientes que el usuario escribió
  const propios = perfil.ingredientes.split(/[,;\n]/).map((s) => normalizar(s).trim()).filter((s) => s.length > 2);
  for (const ingrediente of propios) {
    if (contiene.includes(ingrediente)) rojo(`Tiene "${ingrediente}"`);
    else if (trazas.includes(ingrediente)) amarillo(`Puede contener trazas de "${ingrediente}"`);
  }

  if ((perfil.alergias.length || perfil.evitar.length || propios.length) && !hayIngredientes) {
    amarillo('No tenemos la lista de ingredientes: no podemos revisar tus alergias ni lo que evitás');
  }

  // Puntaje personal
  if (analisis.puntaje !== null) {
    for (const id of perfil.cuidados) {
      const c = CUIDADOS.find((x) => x.id === id);
      if (!c) continue;
      const sellos = [].concat(c.sello);
      if ((analisis.sellosCalculados || analisis.sellos).some((s) => sellos.includes(s.clave) && s.estado === 'si')) {
        resultado.restas.push({ puntos: c.resta, texto: c.texto });
      }
    }
    const rojas = resultado.alertas.filter((x) => x.nivel === 'rojo').length;
    if (rojas) resultado.restas.push({ puntos: 20, texto: 'Tiene algo que evitás' });
    const total = resultado.restas.reduce((s, r) => s + r.puntos, 0);
    resultado.puntaje = Math.max(0, analisis.puntaje - total);
    // Si tiene algo que evitás, nunca puede ser "buena opción" para vos
    if (rojas && resultado.puntaje > 39) resultado.puntaje = 39;
  }

  return resultado;
}
