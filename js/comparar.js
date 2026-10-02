// Pantalla Comparar: 2 o 3 productos lado a lado.
import {
  leerProducto, leerPerfil, leerComparacion, quitarDeComparacion, agregarAComparacion,
  listarHistorial, listarFavoritos, MAX_COMPARAR,
} from './db.js';
import { analizar, nivelDePuntaje } from './analisis.js';
import { evaluarParaMi, perfilActivo } from './perfil.js';
import { esc, ICONOS, marca, anillo, modo, cabecera, cargando, navegacion, filaProducto, aviso } from './ui.js';

const app = document.getElementById('app');

const redondear = (x, dec = 1) => (x === null || x === undefined ? null : Math.round(x * 10 ** dec) / 10 ** dec);

// Todo lo que se compara de un producto
function datosDe(codigo, prod, perfil) {
  const a = analizar(prod);
  const mio = evaluarParaMi(prod, a, perfil);
  const personal = perfilActivo(perfil) && a.puntaje !== null;
  const puntaje = personal ? mio.puntaje : a.puntaje;
  const n = prod.n || {};
  const porcion = Number(prod.porcion?.cantidad) || null;
  const porPorcion = (v) => (v === null || v === undefined || !porcion ? null : (v * porcion) / 100);
  const aditivos = a.aditivos;
  const sinIngredientes = !prod.ingredientesTexto;
  return {
    codigo,
    prod,
    puntaje,
    nivel: nivelDePuntaje(puntaje),
    sellos: a.sellos,
    // true = lo tiene; false = no lo tiene; null = no sabemos (sin ingredientes)
    edulcorantes: a.leyendas.edulcorantes ? true : sinIngredientes ? null : false,
    aspartamo: aditivos.some((x) => x.codigo === 'e951' || x.codigo === 'e962') ? true : sinIngredientes ? null : false,
    colorantes: aditivos.some((x) => x.f === 'colorante' && x.r !== 'bajo') ? true : sinIngredientes ? null : false,
    conservantes: aditivos.some((x) => x.f === 'conservante') ? true : sinIngredientes ? null : false,
    aModerar: sinIngredientes && !aditivos.length ? null : aditivos.filter((x) => x.r === 'alto' || x.r === 'moderado').length,
    alertas: mio.alertas.filter((x) => x.nivel === 'rojo').length,
    unidad: prod.esBebida ? 'ml' : 'g',
    porcion,
    kcal100: redondear(n.kcal, 0),
    azucar100: redondear(n.azucares),
    sodio100: redondear(n.sodioMg, 0),
    kcalPorcion: redondear(porPorcion(n.kcal), 0),
    azucarPorcion: redondear(porPorcion(n.azucares)),
  };
}

// Celda ✓ / ! / ✗ ("malo" = qué marca usar si lo tiene)
function celdaSiNo(valor, malo = 'mal') {
  if (valor === null || valor === undefined) return `<span class="comp-celda">${marca('gris')}<small>sin datos</small></span>`;
  return `<span class="comp-celda">${valor ? marca(malo) : marca('bien')}</span>`;
}

// Celda numérica: resalta el valor más bajo de la fila (menos es mejor)
function filaNumeros(titulo, items, campo, unidad, detalle = '') {
  const valores = items.map((i) => i[campo]);
  if (valores.every((v) => v === null)) return '';
  const conDato = valores.filter((v) => v !== null);
  const minimo = Math.min(...conDato);
  const hayDiferencia = conDato.length > 1 && conDato.some((v) => v !== minimo);
  return fila(titulo, items.map((i) => {
    const v = i[campo];
    if (v === null) return '<span class="comp-celda"><span class="sin-dato">sin dato</span></span>';
    const mejor = hayDiferencia && v === minimo;
    return `<span class="comp-celda comp-numero${mejor ? ' mejor' : ''}">${String(v).replace('.', ',')} ${unidad}</span>`;
  }), detalle);
}

function fila(titulo, celdas, detalle = '') {
  return `
    <div class="comp-fila">
      <div class="comp-etiqueta">${esc(titulo)}${detalle ? ` <small>${esc(detalle)}</small>` : ''}</div>
      <div class="comp-valores">${celdas.join('')}</div>
    </div>`;
}

export async function pantallaComparar(vigente) {
  modo(false);
  app.innerHTML = cabecera('Comparar', null) + cargando('Cargando…') + navegacion('comparar');
  const [codigos, perfil] = await Promise.all([leerComparacion(), leerPerfil()]);
  const productos = (await Promise.all(codigos.map(async (c) => ({ codigo: c, prod: await leerProducto(c) })))).filter((x) => x.prod);
  if (!vigente()) return;

  const items = productos.map((x) => datosDe(x.codigo, x.prod, perfil));
  const lugar = items.length < MAX_COMPARAR;

  let cuerpo;
  if (!items.length) {
    cuerpo = `
      <article class="tarjeta vacio">
        <span class="vacio-icono">${ICONOS.comparar}</span>
        <h3>Compará hasta 3 productos</h3>
        <p class="gris">Escaneá un producto y tocá <b>"Comparar"</b> en el resultado, o elegilos de tu historial.</p>
        <button class="btn btn-verde" type="button" data-agregar>Elegir del historial</button>
        <a class="btn btn-borde" href="#/escanear">Escanear un producto</a>
      </article>`;
  } else {
    // Mejor opción: el de mayor puntaje (si hay al menos 2 con puntaje)
    const conPuntaje = items.filter((i) => i.puntaje !== null);
    const max = Math.max(...conPuntaje.map((i) => i.puntaje));
    const ganadores = conPuntaje.filter((i) => i.puntaje === max);
    const nombreCorto = (i) => i.prod.marca || i.prod.nombre;
    const cartel = items.length < 2
      ? '<div class="franja">Agregá al menos otro producto para comparar.</div>'
      : conPuntaje.length < 2
        ? '<div class="franja">Faltan datos de algunos productos para elegir el mejor.</div>'
        : ganadores.length === items.length
          ? '<div class="comp-ganador">🤝 Están parejos: tienen el mismo puntaje.</div>'
          : `<div class="comp-ganador">🏆 Mejor opción${perfilActivo(perfil) ? ' para vos' : ''}: <b>${esc(ganadores.map(nombreCorto).join(' y '))}</b></div>`;

    const sellosPresentes = ['azucares', 'grasas', 'saturadas', 'sodio', 'calorias']
      .filter((clave) => items.some((i) => i.sellos.find((s) => s.clave === clave && s.estado === 'si')));
    const nombresSello = { azucares: 'Exceso en azúcares', grasas: 'Exceso en grasas', saturadas: 'Exceso en grasas saturadas', sodio: 'Exceso en sodio', calorias: 'Exceso en calorías' };

    cuerpo = `
      ${cartel}
      <article class="tarjeta comparacion" style="--columnas:${items.length}">
        <div class="comp-valores comp-cabeza">
          ${items.map((i) => `
            <div class="comp-producto">
              <button class="comp-quitar" type="button" data-quitar="${esc(i.codigo)}" aria-label="Quitar de la comparación">${ICONOS.cerrar}</button>
              <span class="comp-foto">${i.prod.imagen ? `<img src="${esc(i.prod.imagen)}" alt="">` : ICONOS.camara}</span>
              <b>${esc(i.prod.marca || i.prod.nombre)}</b>
              <small>${esc(i.prod.marca ? i.prod.nombre : '')}</small>
              <small class="gris">${esc(i.prod.cantidad || '')}</small>
              ${anillo(i.puntaje, i.nivel, 76)}
              <span class="comp-nivel texto-${i.nivel.color}">${esc(i.nivel.texto)}</span>
            </div>`).join('')}
        </div>

        ${perfilActivo(perfil) ? fila('Algo que evitás', items.map((i) => celdaSiNo(i.alertas > 0))) : ''}
        ${fila('Octógonos', items.map((i) => {
          const cant = i.sellos.filter((s) => s.estado === 'si').length;
          const sinDatos = i.sellos.every((s) => s.estado === '?');
          if (sinDatos) return celdaSiNo(null);
          return `<span class="comp-celda">${cant ? `<span class="comp-octo">${cant}</span>` : marca('bien')}</span>`;
        }))}
        ${sellosPresentes.map((clave) => fila(nombresSello[clave], items.map((i) => {
          const s = i.sellos.find((x) => x.clave === clave);
          return celdaSiNo(s.estado === '?' ? null : s.estado === 'si');
        }))).join('')}
        ${fila('Edulcorantes', items.map((i) => celdaSiNo(i.edulcorantes, 'ojo')))}
        ${fila('Aspartamo', items.map((i) => celdaSiNo(i.aspartamo)))}
        ${fila('Colorantes artificiales', items.map((i) => celdaSiNo(i.colorantes, 'ojo')))}
        ${fila('Conservantes', items.map((i) => celdaSiNo(i.conservantes, 'ojo')))}
        ${filaNumeros('Aditivos a moderar', items, 'aModerar', '')}
        ${filaNumeros('Azúcar', items, 'azucarPorcion', 'g', 'por porción')}
        ${filaNumeros('Calorías', items, 'kcalPorcion', 'kcal', 'por porción')}
        ${filaNumeros('Azúcar', items, 'azucar100', 'g', 'cada 100 g/ml')}
        ${filaNumeros('Calorías', items, 'kcal100', 'kcal', 'cada 100 g/ml')}
        ${filaNumeros('Sodio', items, 'sodio100', 'mg', 'cada 100 g/ml')}

        <div class="comp-valores comp-pie">
          ${items.map((i) => `<a class="btn btn-verde btn-chico" href="#/p/${esc(i.codigo)}">Ver detalle</a>`).join('')}
        </div>
      </article>
      <p class="pie">En verde, el valor más bajo de cada fila. Las porciones pueden ser distintas entre productos: para comparar parejo, mirá los valores cada 100 g/ml.</p>
      ${lugar ? `<button class="btn btn-borde" type="button" data-agregar>${ICONOS.mas} Agregar otro producto</button>` : ''}
      <button class="btn btn-texto" type="button" id="vaciar">Vaciar comparación</button>`;
  }

  app.innerHTML = `
    ${cabecera('Comparar', null)}
    <div class="contenido con-navegacion">${cuerpo}</div>
    ${navegacion('comparar')}`;

  app.querySelectorAll('[data-quitar]').forEach((b) =>
    b.addEventListener('click', async () => {
      await quitarDeComparacion(b.dataset.quitar);
      pantallaComparar(vigente);
    })
  );
  app.querySelectorAll('[data-agregar]').forEach((b) => b.addEventListener('click', () => elegirProducto(codigos, vigente)));
  const vaciar = document.getElementById('vaciar');
  if (vaciar) {
    vaciar.addEventListener('click', async () => {
      for (const c of codigos) await quitarDeComparacion(c);
      pantallaComparar(vigente);
    });
  }
}

// Lista para elegir productos del historial y favoritos
async function elegirProducto(yaElegidos, vigente) {
  const [historial, favoritos, perfil] = await Promise.all([listarHistorial(), listarFavoritos(), leerPerfil()]);
  if (!vigente()) return;
  const vistos = new Set(yaElegidos);
  const opciones = [];
  for (const i of [...favoritos, ...historial]) {
    if (vistos.has(i.codigo) || !i.producto) continue;
    vistos.add(i.codigo);
    opciones.push(i);
  }

  app.innerHTML = `
    ${cabecera('Elegí un producto', '#/comparar')}
    <div class="contenido con-navegacion">
      ${opciones.length
        ? `<p class="gris chico">De tus favoritos e historial. Tocá uno para agregarlo.</p>
           <div class="tarjeta lista">${opciones.map((i) => {
             const a = analizar(i.producto);
             const mio = evaluarParaMi(i.producto, a, perfil);
             const p = perfilActivo(perfil) && a.puntaje !== null ? mio.puntaje : a.puntaje;
             return filaProducto(i.codigo, i.producto, p, nivelDePuntaje(p), favoritos.some((f) => f.codigo === i.codigo) ? '⭐ Favorito' : '')
               .replace('<a class="fila-producto"', `<a class="fila-producto" data-elegir="${esc(i.codigo)}"`);
           }).join('')}</div>`
        : `<article class="tarjeta vacio">
             <h3>No hay más productos</h3>
             <p class="gris">Escaneá productos para poder compararlos.</p>
             <a class="btn btn-verde" href="#/escanear">Escanear un producto</a>
           </article>`}
    </div>
    ${navegacion('comparar')}`;

  // La flecha vuelve a la comparación (estamos en la misma dirección, así que hay que redibujar)
  app.querySelector('.btn-atras').addEventListener('click', (e) => {
    e.preventDefault();
    pantallaComparar(vigente);
  });

  app.querySelectorAll('[data-elegir]').forEach((a) =>
    a.addEventListener('click', async (e) => {
      e.preventDefault();
      const r = await agregarAComparacion(a.dataset.elegir);
      if (r === 'lleno') aviso(`Ya tenés ${MAX_COMPARAR} productos para comparar.`);
      if (location.hash === '#/comparar') pantallaComparar(vigente);
      else location.hash = '#/comparar';
    })
  );
}
