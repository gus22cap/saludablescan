// Cálculo de octógonos (Ley 27.642, Decreto 151/2022 — valores de la etapa final),
// puntaje de 0 a 100 y resumen en lenguaje simple.
//
// Puntos de corte (etapa final, perfil de nutrientes de la OPS):
//   Azúcares añadidos:  ≥ 10 % de las calorías totales
//   Grasas totales:     ≥ 30 % de las calorías totales
//   Grasas saturadas:   ≥ 10 % de las calorías totales
//   Sodio:              ≥ 1 mg por kcal, o ≥ 300 mg cada 100 g/ml
//                       (bebidas sin calorías: ≥ 40 mg cada 100 ml)
//   Calorías:           ≥ 275 kcal cada 100 g o ≥ 25 kcal cada 100 ml,
//                       solo si además tiene exceso de azúcares o grasas
// Los sellos solo corresponden si al producto se le agregó azúcar, grasa o sodio.

import { fichaAditivo, esEdulcorante, ADITIVOS } from './aditivos.js';

const ORDEN_RIESGO = { alto: 0, moderado: 1, desconocido: 2, bajo: 3 };

export function normalizar(texto) {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, ''); // quita tildes
}

const num = (v) => (v === null || v === undefined || v === '' || isNaN(v) ? null : Number(v));

const PAL_AZUCAR = /\b(azucar(es)?|jarabes?|glucosa|fructosa|sacarosa|dextrosa|miel|melaza|maltosa|jmaf|jugos? concentrados?|panela|rapadura)\b/;
const PAL_GRASA = /\b(aceites?|grasas?|manteca|margarina|crema de leche|mantequilla|materia grasa|shortening)\b/;
const PAL_SODIO = /\b(sal|sodio|sodic[oa]s?|salmuera)\b/;
const PAL_EDULCORANTE = /edulcorante|stevia|estevia|esteviol|sucralosa|aspartam|acesulfam|sacarina|ciclamato|eritritol|xilitol|maltitol|sorbitol/;
const PAL_CAFEINA = /cafeina|caffeine/;

// Busca aditivos en las etiquetas de Open Food Facts y en el texto de ingredientes.
export function detectarAditivos(prod) {
  const codigos = new Set();
  for (const tag of prod.aditivosTags || []) {
    const m = /e(\d{3,4}[a-f]?)/.exec(tag.toLowerCase());
    if (m) codigos.add('e' + m[1]);
  }
  const texto = normalizar(prod.ingredientesTexto);
  // Códigos escritos como "INS 330", "INS N° 330", "E-330", "E 150d"
  const re = /\b(?:ins|e)\s*(?:n\s*[°º.]?\s*)?-?\s*(\d{3,4})\s*([a-f])?\b/g;
  let m;
  while ((m = re.exec(texto))) codigos.add('e' + m[1] + (m[2] || ''));
  // Forma abreviada que se usa en Argentina: "COL 150 d", "ACI 338", "CONS 211", "EDU 951"…
  const reAbrev = /\b(?:col|aci|acid|cons|edu|esp|emu|ant|antiox|estab|gel|reg|hum|resal|res|leu|aro)\.?\s*(\d{3,4})\s*([a-f])?\b/g;
  while ((m = reAbrev.exec(texto))) codigos.add('e' + m[1] + (m[2] || ''));
  // Nombres comunes ("ácido cítrico", "aspartamo"…)
  for (const [codigo, ficha] of Object.entries(ADITIVOS)) {
    if (ficha.a.some((alias) => alias.length > 3 && texto.includes(alias))) codigos.add(codigo);
  }
  // Si aparece "e150d" no hace falta repetir "e150"
  for (const c of [...codigos]) {
    if (/[a-f]$/.test(c) && codigos.has(c.slice(0, -1))) codigos.delete(c.slice(0, -1));
  }
  const vistos = new Set();
  return [...codigos]
    .map(fichaAditivo)
    .filter((a) => !vistos.has(a.codigo) && vistos.add(a.codigo))
    .sort((a, b) => ORDEN_RIESGO[a.r] - ORDEN_RIESGO[b.r]);
}

function redondear(n, dec = 1) {
  const f = 10 ** dec;
  return Math.round(n * f) / f;
}

export function analizar(prod) {
  const n = prod.n || {};
  const bebida = !!prod.esBebida;
  const unidad = bebida ? '100 ml' : '100 g';
  const avisos = [];

  const texto = normalizar(prod.ingredientesTexto);
  const hayIngredientes = texto.replace(/[^a-z]/g, '').length > 5;
  const textoLimpio = texto.replace(/\bsin (azucar(es)?|sal|grasas?)( agregad[oa]s?| anadid[oa]s?)?/g, ' ');
  // ¿Se le agregó azúcar, grasa o sal? true / false si lo sabemos; null si no hay ingredientes.
  // Primero usamos lo que clasificó Open Food Facts; si no, buscamos palabras en castellano.
  // Si cualquiera de las dos fuentes dice que sí, cuenta como agregado.
  const combinar = (deEtiquetas, regex) => {
    const deTexto = hayIngredientes ? regex.test(textoLimpio) : null;
    if (deEtiquetas === true || deTexto === true) return true;
    if (deEtiquetas === false || deTexto === false) return false;
    return null;
  };
  const etiquetas = prod.agregados || {};
  const agregado = {
    azucar: combinar(etiquetas.azucar, PAL_AZUCAR),
    grasa: combinar(etiquetas.grasa, PAL_GRASA),
    sodio: combinar(etiquetas.sodio, PAL_SODIO),
  };

  const kcal = num(n.kcal);
  const aditivos = detectarAditivos(prod);

  // ---- Octógonos ----
  const sellos = [];
  const sello = (clave, titulo, estado, detalle, estimado = false) =>
    sellos.push({ clave, titulo, estado, detalle, estimado });

  // Azúcares (si "añadidos" figura en 0 pero el producto lleva azúcar, el dato está mal cargado)
  let azucar = num(n.azucaresAnadidos);
  let usaTotales = false;
  if (azucar === 0 && num(n.azucares) > 0 && agregado.azucar !== false) azucar = null;
  if (azucar === null && num(n.azucares) !== null) {
    azucar = num(n.azucares);
    usaTotales = true;
  }
  if (azucar === null || kcal === null) {
    sello('azucares', 'Exceso en azúcares', '?', 'Falta el dato de azúcares o de calorías.');
  } else if (usaTotales && agregado.azucar === false) {
    sello('azucares', 'Exceso en azúcares', 'no', 'Según los ingredientes, no tiene azúcar agregada.');
  } else {
    const pct = kcal > 0 ? (azucar * 4 * 100) / kcal : azucar > 0 ? 100 : 0;
    sello('azucares', 'Exceso en azúcares', pct >= 10 ? 'si' : 'no',
      `${redondear(pct)} % de las calorías vienen del azúcar (límite: 10 %).`,
      usaTotales || agregado.azucar === null);
  }

  // Grasas totales y saturadas
  const grasas = num(n.grasas);
  const saturadas = num(n.saturadas);
  const evaluarGrasa = (clave, titulo, valor, limite) => {
    if (valor === null || kcal === null) {
      sello(clave, titulo, '?', 'Falta el dato en la tabla nutricional.');
    } else if (agregado.grasa === false) {
      sello(clave, titulo, 'no', 'Según los ingredientes, no tiene grasas agregadas.');
    } else {
      const pct = kcal > 0 ? (valor * 9 * 100) / kcal : valor > 0 ? 100 : 0;
      sello(clave, titulo, pct >= limite ? 'si' : 'no',
        `${redondear(pct)} % de las calorías vienen de estas grasas (límite: ${limite} %).`,
        agregado.grasa === null);
    }
  };
  evaluarGrasa('grasas', 'Exceso en grasas totales', grasas, 30);
  evaluarGrasa('saturadas', 'Exceso en grasas saturadas', saturadas, 10);

  // Sodio
  const sodio = num(n.sodioMg);
  if (sodio === null || kcal === null) {
    sello('sodio', 'Exceso en sodio', '?', 'Falta el dato de sodio o de calorías.');
  } else if (agregado.sodio === false) {
    sello('sodio', 'Exceso en sodio', 'no', 'Según los ingredientes, no tiene sal ni sodio agregados.');
  } else if (agregado.sodio === null && sodio < 40) {
    // Sin ingredientes no sabemos si le agregaron sal; con tan poco sodio, suponemos que no
    sello('sodio', 'Exceso en sodio', 'no', `${redondear(sodio, 0)} mg cada ${unidad}: cantidad muy baja.`, true);
  } else if (bebida && kcal < 1) {
    sello('sodio', 'Exceso en sodio', sodio >= 40 ? 'si' : 'no',
      `${redondear(sodio, 0)} mg cada 100 ml (límite para bebidas sin calorías: 40 mg).`,
      agregado.sodio === null);
  } else {
    const porKcal = kcal > 0 ? sodio / kcal : 0;
    const exceso = sodio >= 300 || porKcal >= 1;
    sello('sodio', 'Exceso en sodio', exceso ? 'si' : 'no',
      `${redondear(sodio, 0)} mg cada ${unidad} (${redondear(porKcal, 2)} mg por kcal; límite: 1 mg por kcal o 300 mg).`,
      agregado.sodio === null);
  }

  // Calorías
  if (kcal === null) {
    sello('calorias', 'Exceso en calorías', '?', 'Falta el dato de calorías.');
  } else {
    const limite = bebida ? 25 : 275;
    const conExceso = sellos.some((s) => ['azucares', 'grasas', 'saturadas'].includes(s.clave) && s.estado === 'si');
    const supera = kcal >= limite;
    sello('calorias', 'Exceso en calorías', supera && conExceso ? 'si' : 'no',
      `${redondear(kcal, 0)} kcal cada ${unidad} (límite: ${limite} kcal)` +
        (supera && !conExceso ? ', pero no tiene exceso de azúcares ni grasas.' : '.'));
  }

  // Leyendas
  const edulcorantes = aditivos.some((a) => esEdulcorante(a.codigo)) || PAL_EDULCORANTE.test(texto);
  const cafeina = !!prod.tieneCafeina || PAL_CAFEINA.test(texto);

  // ---- Avisos sobre datos faltantes ----
  if (kcal === null) {
    avisos.push('Falta la tabla nutricional, así que no podemos calcular los octógonos ni el puntaje. Podés completarla a mano.');
  }
  if (!hayIngredientes) {
    avisos.push('No tenemos la lista de ingredientes: suponemos que tiene azúcar, grasas y sal agregadas, y puede haber aditivos que no veamos.');
  }
  if (usaTotales && agregado.azucar !== false && kcal !== null) {
    avisos.push('Usamos los azúcares totales porque falta el dato de azúcares añadidos. Pueden incluir el azúcar natural de la leche o la fruta.');
  }

  // Casos especiales que la ley no cubre (por ahora: café torrado, mezclas y sucedáneos)
  const especiales = evaluarCafe(prod, texto);

  // Productos que la ley exceptúa de los octógonos (azúcar, aceites, sal, frutos secos).
  // En pantalla no mostramos sellos (igual que el envase), pero el puntaje sigue teniendo en cuenta los excesos.
  const exento = productoExento(prod, texto);
  let sellosEnvase = sellos;
  if (exento) {
    sellosEnvase = sellos.map((s) => (s.estado === 'si'
      ? { ...s, estado: 'no', detalle: `Por ley no lleva octógonos (${exento.motivo}). Según la tabla: ${s.detalle}` }
      : s));
    if (sellos.some((s) => s.estado === 'si')) {
      const excesos = sellos.filter((s) => s.estado === 'si').map((s) => s.titulo.replace('Exceso en ', ''));
      especiales.notas.push({
        titulo: 'Sin octógonos por ley, pero con excesos',
        texto: `La ley de etiquetado no les exige octógonos a ${exento.motivo}. Igual, según su tabla nutricional, tiene mucho de: ${listar(excesos)}. Usalo con moderación.`,
        resumen: 'La ley lo exceptúa de los octógonos.',
      });
    }
  }

  // ---- Puntaje ----
  const motivos = [];
  let puntaje = null;
  if (kcal !== null) {
    puntaje = 100;
    const PESOS = { azucares: 20, saturadas: 15, sodio: 15, grasas: 10, calorias: 10 };
    for (const s of sellos) {
      if (s.estado === 'si') {
        puntaje -= PESOS[s.clave];
        motivos.push({ puntos: -PESOS[s.clave], texto: s.titulo });
      }
    }
    if (edulcorantes) { puntaje -= 8; motivos.push({ puntos: -8, texto: 'Contiene edulcorantes' }); }
    if (cafeina) { puntaje -= 3; motivos.push({ puntos: -3, texto: 'Contiene cafeína' }); }

    const altos = aditivos.filter((a) => a.r === 'alto');
    const moderados = aditivos.filter((a) => a.r === 'moderado');
    const restaAditivos = Math.min(30, altos.length * 12 + moderados.length * 5);
    if (restaAditivos > 0) {
      const cuantos = altos.length + moderados.length;
      motivos.push({ puntos: -restaAditivos, texto: `${cuantos} aditivo${cuantos > 1 ? 's' : ''} a moderar` });
      puntaje -= restaAditivos;
    }

    for (const r of especiales.restas) {
      puntaje -= r.puntos;
      motivos.push({ puntos: -r.puntos, texto: r.texto });
    }

    const fibra = num(n.fibra);
    if (fibra !== null && fibra >= 6) { puntaje += 5; motivos.push({ puntos: 5, texto: 'Buena fuente de fibra' }); }
    else if (fibra !== null && fibra >= 3) { puntaje += 3; motivos.push({ puntos: 3, texto: 'Tiene fibra' }); }
    const proteinas = num(n.proteinas);
    if (proteinas !== null && proteinas >= 10) { puntaje += 3; motivos.push({ puntos: 3, texto: 'Buena fuente de proteínas' }); }

    // Con octógonos nunca es "buena opción"; con 3 o más, siempre es "poco saludable".
    const cantSellos = sellos.filter((s) => s.estado === 'si').length;
    // Exceptuados por ley (aceite, azúcar, sal, frutos secos): como mucho "Regular", nunca castigados como un procesado
    const tope = cantSellos === 0 ? 100 : exento ? 69 : cantSellos >= 3 ? 39 : 69;
    if (puntaje > tope) {
      motivos.push({ puntos: tope - Math.round(puntaje), texto: `Tope por tener ${cantSellos} octógono${cantSellos > 1 ? 's' : ''}` });
      puntaje = tope;
    }
    if (especiales.tope !== null && puntaje > especiales.tope) {
      motivos.push({ puntos: especiales.tope - Math.round(puntaje), texto: especiales.motivoTope });
      puntaje = especiales.tope;
    }

    puntaje = Math.max(0, Math.min(100, Math.round(puntaje)));
  }

  const nivel = nivelDePuntaje(puntaje);

  return {
    sellos: sellosEnvase, // como deberían figurar en el envase
    sellosCalculados: sellos, // según la tabla, aunque la ley lo exceptúe (para puntaje y perfil)
    sellosActivos: sellosEnvase.filter((s) => s.estado === 'si'),
    leyendas: { edulcorantes, cafeina },
    aditivos,
    puntaje,
    nivel,
    motivos,
    avisos,
    notas: especiales.notas,
    chips: [...especiales.chips, ...armarChips(prod, sellos, aditivos, edulcorantes)].slice(0, 5),
    resumen: [armarResumen(sellos, aditivos, edulcorantes, cafeina, puntaje), ...especiales.notas.map((x) => x.resumen)].join(' '),
    porcion: datosPorcion(prod),
  };
}

// ---------- Productos exceptuados de los octógonos por la Ley 27.642 ----------
// Azúcar común, aceites vegetales, frutos secos y sal común de mesa (de un solo ingrediente).

const EXENTOS = [
  { motivo: 'los aceites vegetales', ingrediente: /^aceite (de |vegetal|virgen|extra|puro|100)[a-z0-9 %]*$/, nombre: /^aceite (de |vegetal|virgen|extra|puro|mezcla)/ },
  { motivo: 'el azúcar común', ingrediente: /^azucar( (comun|blanca|refinada|rubia|mascabo|organica|integral|impalpable))*$/, nombre: /^azucar\b(?!.*(caramelo|chocolate|galletit))/ },
  { motivo: 'la sal común de mesa', ingrediente: /^sal\b( (fina|gruesa|entrefina|comun|de mesa|marina|del himalaya|parrillera))*/, nombre: /^sal\b( (fina|gruesa|entrefina|comun|de mesa|marina|del himalaya|parrillera|light))*\b/ },
  {
    motivo: 'los frutos secos',
    ingrediente: /^(nueces|nuez|almendras?|avellanas?|castanas de caju|caju|pistachos?|mani|pecan|macadamia|nueces de pecan)( (peladas?|enteras?|naturales?|tostad[oa]s?|sin sal|crud[oa]s?|en mitades|mariposa))*$/,
    nombre: /^(nueces|nuez|almendras|avellanas|castanas|caju|pistachos|mani)\b(?!.*(salad|confitad|bañad|banad|chocolate|garrapiñ|garrapin|japones))/,
  },
];

// Lo que se le puede agregar sin dejar de ser "aceite" o "sal de mesa": aditivos y fortificantes
const SOLO_ADITIVO = /^(antioxidantes?|antiaglutinantes?|yodato|ioduro|yodo|fluor|fluoruro|vitaminas?|tocoferol|tbhq|bht|bha|ins|e ?\d{3}|\d{3})\b/;

function productoExento(prod, textoIngredientes) {
  const ingredientes = textoIngredientes
    .replace(/^\s*ingredientes?\s*:\s*/, '')
    .replace(/\(.*?\)/g, ' ')
    .replace(/[.;]\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  const partes = ingredientes.split(/[,;]/).map((s) => s.replace(/^.*?:\s*/, '').trim()).filter(Boolean);
  const nombre = normalizar(prod.nombre).trim();
  for (const e of EXENTOS) {
    if (partes.length && e.ingrediente.test(partes[0]) && partes.slice(1).every((x) => SOLO_ADITIVO.test(x))) return e;
    // Sin lista de ingredientes, nos guiamos por el nombre
    if (!ingredientes && e.nombre.test(nombre)) return e;
  }
  return null;
}

// ---------- Café: torrado, mezclas y productos que no son café puro ----------

const PAL_CAFE = /\b(cafe|nescafe|dolca|arlistan|cappuccino|capuchino|espresso|expreso)\b/;
// Productos que llevan café pero no son café (postres, golosinas…)
const PAL_NO_CAFE = /\b(alfajor|galletit|helado|chocolate|bombon|licor|yogur|torta|budin|bizcocho|caramelo|turron|barra|cereal en barra)/;

function primerIngrediente(texto) {
  const limpio = texto.replace(/^\s*ingredientes?\s*:\s*/, '');
  let nivel = 0;
  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i];
    if (c === '(' || c === '[') nivel++;
    else if (c === ')' || c === ']') nivel = Math.max(0, nivel - 1);
    else if ((c === ',' || c === ';' || c === '.') && nivel === 0) return limpio.slice(0, i).trim();
  }
  return limpio.trim();
}

function evaluarCafe(prod, textoIngredientes) {
  const resultado = { notas: [], restas: [], chips: [], tope: null, motivoTope: '' };
  const nombre = normalizar(prod.nombre);
  const todo = nombre + ' ' + textoIngredientes;
  if (!PAL_CAFE.test(nombre) || PAL_NO_CAFE.test(nombre)) return resultado;

  const hayIngredientes = textoIngredientes.replace(/[^a-z]/g, '').length > 5;

  // 1) Torrado: café tostado con azúcar
  // (no confundir con un "3 en 1": ahí el azúcar se agrega aparte, no en el tostado)
  const conAzucar = /tostado con azucar|cafe tostado \([^)]*azucar/.test(textoIngredientes);
  if (/torrad/.test(todo) || conAzucar) {
    // Porcentaje: "30% torrado", "torrado 30%", "café torrado 50 %"
    const m = /(\d{1,3})\s*%\s*(?:de\s+)?(?:cafe\s+)?torrad/.exec(todo) || /torrad[oa]s?\s*(?:al\s*)?\(?\s*(\d{1,3})\s*%/.exec(todo);
    let porcentaje = m ? Math.min(100, Number(m[1])) : /mezcla/.test(todo) ? 50 : 100;
    if (porcentaje <= 0) porcentaje = 100;
    const estimado = !m;
    const resta = Math.round((40 * porcentaje) / 100);
    const textoPct = porcentaje === 100 ? 'torrado' : `${porcentaje}% torrado`;
    resultado.restas.push({ puntos: resta, texto: `Café ${textoPct}${estimado ? ' (estimado)' : ''}` });
    resultado.tope = 84; // nunca "muy buena opción"
    resultado.motivoTope = 'Tope por tener café torrado';
    resultado.chips.push({ tipo: porcentaje >= 70 ? 'mal' : 'ojo', texto: porcentaje === 100 ? 'Café torrado' : `Café ${porcentaje}% torrado` });
    resultado.notas.push({
      titulo: porcentaje === 100 ? 'Café torrado' : `Mezcla con ${porcentaje}% de café torrado`,
      texto: 'El café torrado se tuesta con azúcar. Aunque no tenga octógonos (porque en la taza pasa poca azúcar), el azúcar quemada genera más compuestos del tostado, como la acrilamida. Conviene elegir café tostado natural.' +
        (estimado ? (porcentaje === 50 ? ' No encontramos el porcentaje en los datos: suponemos una mezcla mitad y mitad.' : ' No encontramos el porcentaje en los datos: suponemos que es todo torrado.') : ''),
      resumen: porcentaje === 100 ? 'Es café torrado (tostado con azúcar).' : `Es una mezcla con ${porcentaje}% de café torrado.`,
    });
  }

  if (!hayIngredientes) return resultado;

  // 2) ¿El ingrediente principal es café? (los ingredientes van de mayor a menor cantidad)
  const primero = primerIngrediente(textoIngredientes);
  if (primero && !/\bcafe\b/.test(primero)) {
    resultado.restas.push({ puntos: 15, texto: 'No es principalmente café' });
    resultado.chips.unshift({ tipo: 'mal', texto: 'No es principalmente café' });
    resultado.notas.push({
      titulo: 'No es principalmente café',
      texto: `Los ingredientes se ordenan de mayor a menor cantidad, y el primero es "${primero}". Es un producto a base de café, no café puro.`,
      resumen: 'No es principalmente café.',
    });
  }

  // 3) Achicoria, cereales o malta
  const rinde = /\b(achicoria|cebada|malta|centeno|cereales?|trigo tostado)\b/.exec(textoIngredientes);
  if (rinde) {
    resultado.restas.push({ puntos: 16, texto: 'Mezclado con ' + rinde[1] });
    resultado.chips.push({ tipo: 'ojo', texto: 'Con ' + rinde[1] });
    resultado.notas.push({
      titulo: 'No es café puro',
      texto: `Está mezclado con ${rinde[1]}. No es dañino, pero tiene menos café del que parece.`,
      resumen: `Está mezclado con ${rinde[1]}.`,
    });
  }

  // 4) Saborizantes o aromatizantes
  if (/\b(saborizantes?|aromatizantes?|aromas?|sabor artificial|esencia)\b/.test(textoIngredientes)) {
    resultado.restas.push({ puntos: 5, texto: 'Saborizantes o aromatizantes' });
    resultado.chips.push({ tipo: 'ojo', texto: 'Saborizantes' });
    resultado.notas.push({
      titulo: 'Tiene saborizantes o aromatizantes',
      texto: 'El sabor no viene solo del café: lleva saborizantes o aromatizantes agregados.',
      resumen: 'Lleva saborizantes.',
    });
  }

  return resultado;
}

export function nivelDePuntaje(p) {
  if (p === null) return { color: 'gris', texto: 'Sin datos' };
  if (p >= 85) return { color: 'verde', texto: 'Muy buena opción' };
  if (p >= 70) return { color: 'verde', texto: 'Buena opción' };
  if (p >= 40) return { color: 'amarillo', texto: 'Regular' };
  return { color: 'rojo', texto: 'Poco saludable' };
}

// Chips cortitos con ✓ / ! / ✗ para la tarjeta del puntaje
function armarChips(prod, sellos, aditivos, edulcorantes) {
  const chips = [];
  const corto = { azucares: 'azúcares', grasas: 'grasas', saturadas: 'grasas saturadas', sodio: 'sodio', calorias: 'calorías' };
  for (const s of sellos) {
    if (s.estado === 'si') chips.push({ tipo: 'mal', texto: 'Exceso en ' + corto[s.clave] });
  }
  for (const a of aditivos.filter((a) => a.r === 'alto')) chips.push({ tipo: 'mal', texto: a.n });
  if (edulcorantes) chips.push({ tipo: 'ojo', texto: 'Edulcorantes' });
  const funciones = new Set(aditivos.filter((a) => a.r === 'moderado').map((a) => a.f));
  if (funciones.has('colorante')) chips.push({ tipo: 'ojo', texto: 'Colorantes' });
  if (funciones.has('conservante')) chips.push({ tipo: 'ojo', texto: 'Conservantes' });
  if (prod.sinTacc) chips.push({ tipo: 'bien', texto: 'Sin TACC' });
  for (const clave of ['azucares', 'sodio', 'grasas']) {
    const s = sellos.find((x) => x.clave === clave);
    if (s && s.estado === 'no') chips.push({ tipo: 'bien', texto: 'Sin exceso de ' + corto[clave] });
  }
  if (aditivos.length === 0 && prod.ingredientesTexto) chips.push({ tipo: 'bien', texto: 'Sin aditivos detectados' });
  return chips.slice(0, 5);
}

function armarResumen(sellos, aditivos, edulcorantes, cafeina, puntaje) {
  if (puntaje === null) return 'Nos faltan datos de este producto para evaluarlo. Si tenés el envase a mano, podés completar la tabla nutricional.';
  const partes = [];
  const activos = sellos.filter((s) => s.estado === 'si').map((s) => s.titulo.replace('Exceso en ', ''));
  if (activos.length === 0) partes.push('No tiene octógonos de advertencia: su perfil nutricional es bueno.');
  else partes.push(`Tiene exceso en ${listar(activos)}.`);
  if (edulcorantes) partes.push('Contiene edulcorantes, no recomendables para chicos.');
  if (cafeina) partes.push('Contiene cafeína.');
  const aModerar = aditivos.filter((a) => a.r === 'alto' || a.r === 'moderado');
  if (aModerar.length) partes.push(`Tiene ${aModerar.length === 1 ? 'un aditivo' : aModerar.length + ' aditivos'} a moderar: ${listar(aModerar.map((a) => a.n.toLowerCase()))}.`);
  else if (aditivos.length) partes.push('Sus aditivos se consideran de bajo riesgo.');
  return partes.join(' ');
}

function listar(items) {
  if (items.length <= 1) return items.join('');
  return items.slice(0, -1).join(', ') + ' y ' + items[items.length - 1];
}

function datosPorcion(prod) {
  const n = prod.n || {};
  const cant = num(prod.porcion?.cantidad);
  const unidad = prod.porcion?.unidad || (prod.esBebida ? 'ml' : 'g');
  if (cant && cant > 0) {
    const f = cant / 100;
    return {
      etiqueta: `por porción (${redondear(cant, 0)} ${unidad})`,
      kcal: num(n.kcal) !== null ? redondear(n.kcal * f, 0) : null,
      azucares: num(n.azucares) !== null ? redondear(n.azucares * f) : null,
    };
  }
  return {
    etiqueta: `cada 100 ${unidad}`,
    kcal: num(n.kcal) !== null ? redondear(n.kcal, 0) : null,
    azucares: num(n.azucares) !== null ? redondear(n.azucares) : null,
  };
}
