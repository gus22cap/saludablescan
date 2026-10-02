// Lectura de texto en fotos del envase (por ahora, la lista de ingredientes).
// Usa Tesseract, que reconoce texto dentro del mismo celular, gratis y sin servidor.
// La primera vez descarga el lector y el idioma español (unos 5 MB); después queda guardado.
/* global Tesseract */

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
