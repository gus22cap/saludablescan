// Lectura de texto en fotos del envase (tabla nutricional e ingredientes).
// Usa Tesseract, que reconoce texto dentro del mismo celular, gratis y sin servidor.
// La primera vez descarga el lector y el idioma español (unos 5 MB); después queda guardado.
/* global Tesseract */
import { normalizar } from './analisis.js';

let promesaLector = null;
let alProgresar = null;

function cargarScript(src) {
  return new Promise((resolver, rechazar) => {
    if (window.Tesseract) return resolver();
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolver;
    s.onerror = () => rechazar(new Error('no se pudo cargar el lector'));
    document.head.appendChild(s);
  });
}

function obtenerLector() {
  if (!promesaLector) {
    promesaLector = (async () => {
      await cargarScript('./lib/tesseract.min.js');
      return Tesseract.createWorker('spa', 1, {
        logger: (m) => alProgresar && alProgresar(m),
      });
    })();
    promesaLector.catch(() => { promesaLector = null; });
  }
  return promesaLector;
}

// Prepara la foto: escala de grises, más contraste y tamaño adecuado (mejora mucho la lectura)
function prepararImagen(src) {
  return new Promise((resolver, rechazar) => {
    const img = new Image();
    img.onload = () => {
      const ancho = Math.min(2200, Math.max(1400, img.width));
      const escala = ancho / img.width;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const datos = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const p = datos.data;
      for (let i = 0; i < p.length; i += 4) {
        const gris = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
        const v = Math.max(0, Math.min(255, (gris - 128) * 1.4 + 128));
        p[i] = p[i + 1] = p[i + 2] = v;
      }
      ctx.putImageData(datos, 0, 0);
      resolver(canvas);
    };
    img.onerror = rechazar;
    img.src = src;
  });
}

// Devuelve el texto de la foto. "progreso(texto, porcentaje)" informa cómo va.
export async function leerTextoDeFoto(src, progreso = () => {}) {
  const primeraVez = !promesaLector;
  alProgresar = (m) => {
    if (m.status === 'recognizing text') progreso('Leyendo la foto…', Math.round(m.progress * 100));
    else if (primeraVez) progreso('Preparando el lector (solo la primera vez, unos 5 MB)…', Math.round((m.progress || 0) * 100));
  };
  progreso(primeraVez ? 'Preparando el lector (solo la primera vez, unos 5 MB)…' : 'Leyendo la foto…', 0);
  const lector = await obtenerLector();
  const imagen = await prepararImagen(src);
  const { data } = await lector.recognize(imagen);
  alProgresar = null;
  return data.text || '';
}

// ---------- Entender la tabla nutricional ----------

const NUMERO = '(\\d+(?:[.,]\\d+)?)';

// Arregla confusiones típicas de la lectura: "1O g" → "10 g", "0,5g" → "0,5 g"
function limpiarLinea(linea) {
  return normalizar(linea)
    .replace(/(\d)[o](?=\s*(g|mg|kcal|kj)\b)/g, '$10')
    .replace(/\b[o](?=[.,]\d)/g, '0')
    .replace(/(\d)o(?=\d)/g, (m, d) => d + '0')
    .replace(/(\d)\s*([.,])\s*(\d)/g, '$1$2$3')
    // La "g" de gramos suele leerse como "q" o "9"; "mg" como "mq" o "rng"; "kcal" como "kca1"
    .replace(/(\d)\s*q\b/g, '$1 g')
    .replace(/(\d)\s*(mq|rng|rnq)\b/g, '$1 mg')
    .replace(/kca[l1i|]\b/g, 'kcal')
    .replace(/(\d(?:[.,]\d+)?)\s+9(?=\s+(\d+\s*%|-|$))/g, '$1 g')
    .replace(/(\d(?:[.,]\d+)?)\s+9$/g, '$1 g')
    .replace(/(\d)(g|mg|kcal|kj)\b/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
}

const aNumero = (t) => Number(String(t).replace(',', '.'));

// Todas las cantidades con unidad de una línea, sin los porcentajes (%VD)
function cantidades(linea) {
  const re = new RegExp(NUMERO + '\\s*(kcal|kj|mg|g)\\b', 'g');
  const lista = [];
  let m;
  while ((m = re.exec(linea))) lista.push({ valor: aNumero(m[1]), unidad: m[2], pos: m.index });
  return lista;
}

const CAMPOS = [
  { id: 'kcal', etiqueta: /(valor energetico|energia|calorias)/ },
  { id: 'azucaresAnadidos', etiqueta: /azucares? (anadidos?|agregados?)/ },
  { id: 'azucares', etiqueta: /azucares?( totales)?/, excluir: /anadid|agregad/ },
  { id: 'saturadas', etiqueta: /grasas? saturadas?/ },
  { id: 'grasas', etiqueta: /grasas? totales?/ },
  { id: 'fibra', etiqueta: /fibra/ },
  { id: 'proteinas', etiqueta: /proteinas?/ },
  { id: 'sodioMg', etiqueta: /sodio/ },
];

// Devuelve { valores: {kcal, azucares…}, porcion, base: 'porcion'|'100', encontrados }
export function interpretarTabla(texto) {
  const lineas = texto.split(/\n+/).map(limpiarLinea).filter(Boolean);

  // ¿Qué columnas tiene la tabla? (por porción, cada 100 g, o las dos)
  // (el renglón "Porción: 200 ml" no es el encabezado)
  const esTamanioPorcion = (l) => /porcion[^\d]{0,5}\d/.test(l);
  const encabezado =
    lineas.find((l) => /(por|cada|en) 100 ?(g|ml)/.test(l) && /porcion/.test(l) && !esTamanioPorcion(l)) ||
    lineas.find((l) => /(por|cada|en) 100 ?(g|ml)/.test(l) && !esTamanioPorcion(l)) ||
    lineas.find((l) => /(cantidad )?por porcion|% ?vd/.test(l) && !esTamanioPorcion(l)) ||
    '';
  const pos100 = encabezado.search(/100 ?(g|ml)/);
  const posPorcion = encabezado.search(/porcion/);
  const tiene100 = lineas.some((l) => /(por|cada|en) 100 ?(g|ml)/.test(l)) || pos100 >= 0;

  const valores = {};
  let dosColumnas = false;
  for (const campo of CAMPOS) {
    const linea = lineas.find((l) => campo.etiqueta.test(l) && !(campo.excluir && campo.excluir.test(l)));
    if (!linea) continue;
    const despues = linea.slice(linea.search(campo.etiqueta));
    let lista = cantidades(despues);
    if (campo.id === 'kcal') {
      const kcal = lista.filter((c) => c.unidad === 'kcal');
      const kj = lista.filter((c) => c.unidad === 'kj');
      lista = kcal.length ? kcal : kj.map((c) => ({ ...c, valor: Math.round(c.valor / 4.184), unidad: 'kcal' }));
    } else {
      lista = lista.filter((c) => c.unidad !== 'kcal' && c.unidad !== 'kj');
    }
    // Respaldo: si no se reconoció la unidad, el primer número que no sea un porcentaje
    if (!lista.length && campo.id !== 'kcal') {
      const m = new RegExp(NUMERO + '(?!\\s*[%\\d.,])').exec(despues);
      if (m) lista = [{ valor: aNumero(m[1]), unidad: campo.id === 'sodioMg' ? 'mg' : 'g', pos: m.index }];
    }
    if (!lista.length) continue;
    if (lista.length >= 2) dosColumnas = true;
    // Con dos columnas, si la de 100 g va primero tomamos esa; si no, la segunda
    const primero100 = pos100 >= 0 && (posPorcion < 0 || pos100 < posPorcion);
    const elegido = lista.length >= 2 && tiene100 ? (primero100 ? lista[0] : lista[1]) : lista[0];
    let v = elegido.valor;
    if (campo.id === 'sodioMg' && elegido.unidad === 'g') v = v * 1000;
    valores[campo.id] = Math.round(v * 100) / 100;
  }

  // Porción: "Porción 30 g", "porcion: 200 ml (1 vaso)"
  const lineaPorcion = lineas.find((l) => /porcion/.test(l) && new RegExp(NUMERO + '\\s*(g|ml|cc)\\b').test(l));
  let porcion = null;
  if (lineaPorcion) {
    const m = new RegExp('porcion[^\\d]{0,25}' + NUMERO + '\\s*(g|ml|cc)\\b').exec(lineaPorcion);
    if (m) porcion = aNumero(m[1]);
  }

  const base = (dosColumnas && tiene100) || (tiene100 && posPorcion < 0) ? '100' : 'porcion';
  return { valores, porcion, base, encontrados: Object.keys(valores).length };
}

// ---------- Entender la lista de ingredientes ----------

export function interpretarIngredientes(texto) {
  let t = texto
    .replace(/-\s*\n\s*/g, '') // palabras cortadas al final de renglón
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // Empieza después de "Ingredientes:"
  const inicio = t.search(/ingredientes?\s*[:;.]?/i);
  if (inicio >= 0) t = t.slice(inicio).replace(/^ingredientes?\s*[:;.]?\s*/i, '');
  // Termina antes de datos que no son ingredientes
  const fin = t.search(/\b(conservar|consumir preferentemente|fecha de vencimiento|vence|elaborado (por|en)|industria argentina|r\.?n\.?p\.?a|r\.?n\.?e|lote|contenido neto|informaci[oó]n nutricional)\b/i);
  if (fin > 0) t = t.slice(0, fin);
  t = t.trim().replace(/[\s,;]+$/, '');
  if (t && !/[.]$/.test(t)) t += '.';
  // "AZÚCAR, JARABE…" → "Azúcar, jarabe…" (si vino todo en mayúsculas)
  if (t === t.toUpperCase()) t = t.charAt(0) + t.slice(1).toLowerCase();
  return t;
}
