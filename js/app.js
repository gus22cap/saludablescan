// SaludableScan — pantallas y navegación.
import { buscarProducto, buscarEnPreciosClaros, codigoValido } from './api.js';
import { guardarProducto, leerProducto, registrarEscaneo, esFavorito, alternarFavorito, leerPerfil, agregarAComparacion, leerComparacion, MAX_COMPARAR, leerPendiente, borrarPendiente } from './db.js';
import { analizar, nivelDePuntaje } from './analisis.js';
import { evaluarParaMi, perfilActivo } from './perfil.js';
import { iniciarEscaner, detenerEscaner, linterna, leerDesdeFoto } from './escaner.js';
import { pantallaHistorial, pantallaFavoritos, pantallaPerfil } from './personal.js';
import { pantallaComparar } from './comparar.js';
import { pantallaFotos, pantallaPendientes, panelFotos, conectarPanelFotos, achicarFoto } from './fotos.js';
import {
  esc, ICONOS, marca, anillo, octogono, leyenda, aviso, riesgoATipo, TEXTO_RIESGO,
  modo, cabecera, cargando, navegacion, fechaRelativa,
} from './ui.js';

const app = document.getElementById('app');

// Cada vez que se cambia de pantalla sube este número; así una pantalla
// que tardó en cargar no pisa a la que el usuario abrió después.
let pantallaActual = 0;
// Código recién escaneado o tipeado (para anotarlo una sola vez en los escaneos)
let codigoNuevo = null;

function ir(ruta) {
  location.hash = ruta;
}

function abrirProducto(codigo) {
  codigoNuevo = codigo;
  ir('#/p/' + codigo);
}

async function router() {
  const yo = ++pantallaActual;
  await detenerEscaner();
  if (yo !== pantallaActual) return;
  window.scrollTo(0, 0);
  const [seccion, codigo, extra] = location.hash.replace(/^#\/?/, '').split('/');
  const vigente = () => yo === pantallaActual;
  try {
    if (seccion === 'p' && codigo) {
      if (extra === 'ingredientes') return await pantallaIngredientes(codigo, vigente);
      return await pantallaResultado(codigo, vigente);
    }
    if (seccion === 'cargar' && codigo) return await pantallaCargar(codigo, vigente);
    if (seccion === 'historial') return await pantallaHistorial(vigente);
    if (seccion === 'favoritos') return await pantallaFavoritos(vigente);
    if (seccion === 'perfil') return await pantallaPerfil(vigente);
    if (seccion === 'comparar') return await pantallaComparar(vigente);
    if (seccion === 'fotos' && codigo) return await pantallaFotos(codigo, vigente);
    if (seccion === 'pendientes') return await pantallaPendientes(vigente);
    // "#/escanear" prende la cámara de una; al abrir la app ("#/") espera a que el usuario la prenda
    return pantallaEscanear(seccion === 'escanear');
  } catch (err) {
    console.error(err);
    if (vigente()) pantallaMensaje('Algo salió mal', 'Ocurrió un error inesperado. Probá de nuevo.', [{ texto: 'Volver al inicio', href: '#/' }]);
  }
}

// ---------- Piezas comunes ----------

function pantallaMensaje(titulo, texto, botones) {
  modo(false);
  app.innerHTML = `
    ${cabecera(titulo)}
    <div class="contenido">
      <article class="tarjeta mensaje">
        <p>${texto}</p>
        <div class="botones">
          ${botones.map((b, i) => `<a class="btn ${i === 0 ? 'btn-verde' : 'btn-borde'}" href="${b.href}">${esc(b.texto)}</a>`).join('')}
        </div>
      </article>
    </div>`;
}

// ---------- Pantalla 1: Escanear ----------

function pantallaEscanear(prenderYa = false) {
  modo(true);
  app.innerHTML = `
    <section class="escanear">
      <header class="esc-cabecera">
        <div class="logo">${ICONOS.hoja}</div>
        <div>
          <h1>SaludableScan</h1>
          <p>Tu salud en cada elección</p>
        </div>
      </header>

      ${navigator.onLine ? '' : '<div class="franja franja-oscura">Sin internet: vas a ver los productos que ya consultaste. Los nuevos se buscan cuando vuelva la conexión.</div>'}

      <div class="visor">
        <div id="lector"></div>
        <div class="visor-esquinas"><i></i><i></i><i></i><i></i></div>
        <button class="visor-estado" id="estado" type="button">${ICONOS.camara}<span>Tocá el botón blanco para encender la cámara</span></button>
      </div>

      <p class="esc-ayuda"><strong>Apuntá la cámara al código de barras</strong><br>y te mostramos qué tan saludable es</p>

      <div class="esc-botones">
        <label class="btn-redondo" aria-label="Leer desde una foto">
          ${ICONOS.galeria}
          <input type="file" accept="image/*" id="foto" hidden>
        </label>
        <button class="btn-disparo" id="btn-camara" aria-label="Encender la cámara"><span></span></button>
        <button class="btn-redondo" id="btn-linterna" aria-label="Linterna">${ICONOS.linterna}</button>
      </div>

      <form class="esc-manual" id="form-codigo" autocomplete="off">
        <span class="esc-manual-icono">${ICONOS.teclado}</span>
        <input id="codigo" inputmode="numeric" placeholder="O tipeá el código de barras" aria-label="Código de barras">
        <button class="btn btn-verde" type="submit">Buscar</button>
      </form>
      ${navegacion('escanear', true)}
    </section>`;

  const estado = document.getElementById('estado');
  const textoEstado = estado.querySelector('span');
  const btnCamara = document.getElementById('btn-camara');
  let luz = false;
  let encendiendo = false;
  let consejo = null;
  const prendida = () => btnCamara.classList.contains('activa');

  async function encender() {
    if (encendiendo || prendida()) return;
    encendiendo = true;
    estado.hidden = false;
    textoEstado.textContent = 'Encendiendo la cámara…';
    try {
      await iniciarEscaner('lector', (codigo) => {
        if (navigator.vibrate) navigator.vibrate(80);
        abrirProducto(codigo);
      });
      if (!document.body.contains(estado)) return;
      estado.hidden = true;
      btnCamara.classList.add('activa');
      btnCamara.setAttribute('aria-label', 'Apagar la cámara');
      // Si en un rato no lee nada, damos consejos
      clearTimeout(consejo);
      consejo = setTimeout(() => {
        if (prendida() && document.body.contains(estado)) {
          aviso('¿No lo lee? Que el código ocupe casi todo el recuadro, con buena luz y sin reflejos. En la compu, la webcam suele no enfocar de cerca: probá alejarlo un poco o tipeá el número.', 8000);
        }
      }, 9000);
    } catch (err) {
      if (!document.body.contains(estado)) return;
      textoEstado.textContent = mensajeErrorCamara(err);
    } finally {
      encendiendo = false;
    }
  }

  async function apagar() {
    clearTimeout(consejo);
    await detenerEscaner();
    luz = false;
    btnCamara.classList.remove('activa');
    btnCamara.setAttribute('aria-label', 'Encender la cámara');
    estado.hidden = false;
    textoEstado.textContent = 'Cámara apagada. Tocá el botón blanco para encenderla.';
  }

  btnCamara.addEventListener('click', () => (prendida() ? apagar() : encender()));
  estado.addEventListener('click', encender);

  document.getElementById('btn-linterna').addEventListener('click', async () => {
    if (!prendida()) return aviso('Primero encendé la cámara con el botón blanco.');
    const ok = await linterna(!luz);
    if (ok) luz = !luz;
    else aviso('Este celular no permite usar la linterna desde el navegador.');
  });

  document.getElementById('foto').addEventListener('change', async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    const estabaPrendida = prendida();
    aviso('Buscando el código en la foto…');
    try {
      if (estabaPrendida) await apagar();
      const codigo = await leerDesdeFoto(archivo);
      if (!codigoValido(codigo)) throw new Error('no es un código de producto');
      abrirProducto(codigo);
    } catch {
      aviso('No encontramos un código de barras en esa foto. Probá con una más cerca y nítida.');
      if (estabaPrendida) encender();
    }
  });

  document.getElementById('form-codigo').addEventListener('submit', (e) => {
    e.preventDefault();
    const codigo = document.getElementById('codigo').value.replace(/\D/g, '');
    if (!codigoValido(codigo)) {
      aviso('El código de barras tiene entre 8 y 13 números. Revisalo y probá de nuevo.');
      return;
    }
    abrirProducto(codigo);
  });

  if (prenderYa) encender();
}

function mensajeErrorCamara(err) {
  const texto = String(err?.name || err?.message || err);
  if (!window.isSecureContext) return 'La cámara solo funciona si la app se abre con https. Mientras tanto, podés tipear el código abajo.';
  if (/NotAllowed|Permission/i.test(texto)) return 'No hay permiso para usar la cámara. Tocá el candado de la barra de direcciones, permití la cámara y tocá el botón blanco.';
  if (/NotFound|Requested device not found|no camera/i.test(texto)) return 'No encontramos ninguna cámara. Podés tipear el código abajo.';
  if (/NotReadable|in use/i.test(texto)) return 'La cámara está ocupada por otra app. Cerrala y tocá el botón blanco.';
  return 'No pudimos encender la cámara. Tocá el botón blanco para reintentar o tipeá el código abajo.';
}

// ---------- Pantalla 2: Resultado ----------

// Si el producto tiene fotos guardadas para completar, lo recuerda. Devuelve true si mostró el mensaje.
async function mensajePendiente(codigo, vigente) {
  const pendiente = await leerPendiente(codigo);
  if (!pendiente || !vigente()) return false;
  pantallaMensaje('Te falta completarlo',
    `${pendiente.nombre ? `<b>${esc(pendiente.nombre)}</b><br><br>` : ''}` +
    `Ya le sacaste fotos al envase (${fechaRelativa(pendiente.fecha).toLowerCase()}). Completá los datos mirando las fotos y vas a ver su análisis.`,
    [{ texto: 'Completar ahora', href: '#/cargar/' + codigo }, { texto: 'Cambiar las fotos', href: '#/fotos/' + codigo }, { texto: 'Escanear otro', href: '#/escanear' }]);
  return true;
}

async function obtener(codigo, vigente) {
  try {
    const r = await buscarProducto(codigo);
    if (!vigente()) return null;
    if (!r.producto) {
      if (await mensajePendiente(codigo, vigente)) return null;
      const conocido = await buscarEnPreciosClaros(codigo);
      if (!vigente()) return null;
      const fotos = { texto: '📷 Sacar fotos y completar después', href: '#/fotos/' + codigo };
      if (conocido && conocido.noEsAlimento) {
        pantallaMensaje('Producto no alimenticio',
          `Encontramos el producto:<br><b>${esc(conocido.nombre)}</b><br><br>` +
          'Por ahora la app analiza solo <b>alimentos y bebidas</b>. ' +
          'Los productos de higiene, cosmética y limpieza están en el plan para más adelante.',
          [{ texto: 'Escanear otro', href: '#/escanear' }, { texto: 'Es un alimento, cargarlo igual', href: '#/cargar/' + codigo }]);
      } else if (conocido) {
        pantallaMensaje('Falta la tabla nutricional',
          `Encontramos el producto:<br><b>${esc(conocido.nombre)}</b>` +
          `${conocido.marca ? '<br>' + esc(conocido.marca) : ''}<br><br>` +
          'Pero todavía nadie cargó su tabla nutricional. Si tenés el envase a mano, copiala en un minuto ' +
          '(el nombre y la marca ya quedan completos) y queda guardado en tu celular.',
          [{ texto: 'Cargar tabla nutricional', href: '#/cargar/' + codigo }, fotos, { texto: 'Escanear otro', href: '#/escanear' }]);
      } else {
        pantallaMensaje('Producto no encontrado',
          `No encontramos el código <b>${esc(codigo)}</b>.<br><br>Si tenés el envase a mano, cargalo vos en un minuto: queda guardado en tu celular.`,
          [{ texto: 'Cargarlo a mano', href: '#/cargar/' + codigo }, fotos, { texto: 'Escanear otro', href: '#/escanear' }]);
      }
      return null;
    }
    return r;
  } catch {
    if (await mensajePendiente(codigo, vigente)) return null;
    if (vigente()) {
      pantallaMensaje(navigator.onLine ? 'No se pudo buscar' : 'Sin internet',
        navigator.onLine
          ? 'No pudimos consultar la base de productos: puede que el servicio esté lento. Probá de nuevo en un ratito, o cargalo a mano.'
          : 'Este producto todavía no está guardado en tu celular y no hay conexión para buscarlo. Probá cuando vuelva internet, o cargalo a mano.',
        [{ texto: 'Reintentar', href: '#/p/' + codigo + '?' + Date.now() }, { texto: 'Cargarlo a mano', href: '#/cargar/' + codigo }]);
    }
    return null;
  }
}

// Avisos especiales que la ley de etiquetado no cubre (ej.: café torrado)
function tarjetaNotas(notas) {
  if (!notas || !notas.length) return '';
  return `
    <article class="tarjeta notas">
      <h3>${marca('ojo')} A tener en cuenta</h3>
      ${notas.map((x) => `<div><b>${esc(x.titulo)}</b><p>${esc(x.texto)}</p></div>`).join('')}
    </article>`;
}

// Número con coma decimal y unidad, o "sin dato" si falta
function dato(valor, unidad) {
  if (valor === null || valor === undefined || isNaN(valor)) return '<span class="sin-dato">sin dato</span>';
  return `${String(Math.round(valor * 10) / 10).replace('.', ',')} ${unidad}`;
}

function tarjetaProducto(p) {
  const sinNombre = !p.nombre || p.nombre === 'Producto sin nombre';
  const titulo = p.marca || (sinNombre ? 'Producto sin nombre' : p.nombre);
  return `
    <article class="tarjeta producto">
      <div class="prod-foto">${p.imagen ? `<img src="${esc(p.imagen)}" alt="" loading="lazy">` : ICONOS.camara}</div>
      <div class="prod-datos">
        <h2>${esc(titulo)}</h2>
        ${p.marca ? (sinNombre ? '<p class="gris">Sin nombre en la base</p>' : `<p>${esc(p.nombre)}</p>`) : ''}
        ${p.cantidad ? `<p class="gris">${esc(p.cantidad)}</p>` : ''}
        <span class="etiqueta">${p.fuente === 'manual' ? 'Cargado por vos' : 'Open Food Facts'}</span>
      </div>
    </article>`;
}

async function pantallaResultado(codigo, vigente) {
  codigo = codigo.split('?')[0];
  modo(false);
  app.innerHTML = cabecera('Resultado del análisis') + cargando('Buscando el producto…');

  const r = await obtener(codigo, vigente);
  if (!r) return;
  const p = r.producto;
  const a = analizar(p);
  const [perfil, favorito] = await Promise.all([leerPerfil(), esFavorito(codigo)]);
  if (!vigente()) return;
  // Evaluación según el perfil del usuario (alertas y puntaje personal)
  const mio = evaluarParaMi(p, a, perfil);
  const personal = perfilActivo(perfil) && a.puntaje !== null && mio.puntaje !== a.puntaje;
  const puntajeVisible = personal ? mio.puntaje : a.puntaje;
  const nivelVisible = nivelDePuntaje(puntajeVisible);
  const barra = cabecera('Resultado del análisis', '#/', botonFavorito(favorito));

  if (codigoNuevo === codigo) {
    codigoNuevo = null;
    registrarEscaneo(codigo);
  }

  // Sin tabla nutricional no hay análisis posible: mostramos lo que hay y pedimos completarla
  if (a.puntaje === null) {
    const aModerar = a.aditivos.filter((x) => x.r === 'alto' || x.r === 'moderado');
    const pendiente = await leerPendiente(codigo);
    if (!vigente()) return;
    app.innerHTML = `
      ${barra}
      <div class="contenido">
        ${tarjetaProducto(p)}
        ${tarjetaAlertas(mio.alertas)}
        ${tarjetaNotas(a.notas)}
        <article class="tarjeta mensaje">
          <h3 class="centrado">Faltan datos para analizarlo</h3>
          <p>Este producto está en la base, pero ${p.ingredientesTexto ? 'sin' : 'sin la lista de ingredientes ni'} la tabla nutricional, así que no podemos calcular sus octógonos ni su puntaje.</p>
          <p>${pendiente
            ? `Ya le sacaste fotos al envase (${fechaRelativa(pendiente.fecha).toLowerCase()}): completá los datos mirándolas.`
            : 'Si tenés el envase a mano, copiá la tabla en un minuto y queda guardado en tu celular.'}</p>
          <div class="botones">
            <a class="btn btn-verde" href="#/cargar/${codigo}">${pendiente ? 'Completar ahora (con tus fotos)' : 'Completar con el envase'}</a>
            ${pendiente ? '' : `<a class="btn btn-borde" href="#/fotos/${codigo}">📷 Sacar fotos y completar después</a>`}
            ${p.ingredientesTexto ? `<a class="btn btn-borde" href="#/p/${codigo}/ingredientes">Ver ingredientes y aditivos${aModerar.length ? ` (${aModerar.length} a moderar)` : ''}</a>` : ''}
            <a class="btn btn-texto" href="#/escanear">Escanear otro producto</a>
          </div>
        </article>
        <p class="pie">Código ${esc(codigo)}</p>
      </div>`;
    conectarFavorito(codigo);
    return;
  }

  const desconocidos = a.sellos.filter((s) => s.estado === '?');
  const unidad = p.esBebida ? '100 ml' : '100 g';
  const n = p.n || {};
  const fila = (nombre, valor, u) => `<tr><td>${nombre}</td><td>${dato(valor, u)}</td></tr>`;

  app.innerHTML = `
    ${barra}
    <div class="contenido">
      ${r.origen === 'sin-conexion' ? '<div class="franja">Sin conexión: te mostramos los datos guardados en el celular.</div>' : ''}

      ${tarjetaProducto(p)}

      ${tarjetaAlertas(mio.alertas)}

      <article class="tarjeta puntaje">
        <div class="puntaje-anillo">
          ${anillo(puntajeVisible, nivelVisible)}
          <p class="nivel texto-${nivelVisible.color}">${esc(nivelVisible.texto)}</p>
          ${personal ? `<p class="gris chico centrado-texto">Tu puntaje<br>General: ${a.puntaje}</p>` : ''}
        </div>
        <ul class="chips">
          ${a.chips.map((c) => `<li>${marca(c.tipo)}<span>${esc(c.texto)}</span></li>`).join('')}
        </ul>
      </article>

      ${tarjetaNotas(a.notas)}

      ${a.avisos.length ? `<article class="tarjeta avisos">${a.avisos.map((t) => `<p>${ICONOS.info}<span>${esc(t)}</span></p>`).join('')}</article>` : ''}

      <article class="tarjeta">
        <h3>Etiquetado frontal</h3>
        ${a.sellosActivos.length || a.leyendas.edulcorantes || a.leyendas.cafeina ? `
          <div class="octos">${a.sellosActivos.map(octogono).join('')}</div>
          ${a.leyendas.edulcorantes ? leyenda('Contiene edulcorantes, no recomendable en niños/as') : ''}
          ${a.leyendas.cafeina ? leyenda('Contiene cafeína. Evitar en niños/as') : ''}
        ` : (desconocidos.length < a.sellos.length ? `<p class="sin-octos">${marca('bien')} No lleva octógonos</p>` : '')}
        ${desconocidos.length ? `<p class="gris chico">Sin datos suficientes para: ${desconocidos.map((s) => s.titulo.replace('Exceso en ', '')).join(', ')}.</p>` : ''}
        <details>
          <summary>Ver cómo se calculó</summary>
          <ul class="calculo">
            ${a.sellos.map((s) => `<li>${marca(s.estado === 'si' ? 'mal' : s.estado === 'no' ? 'bien' : 'gris')}<div><b>${esc(s.titulo)}</b><br>${esc(s.detalle)}${s.estimado ? ' <i>(estimado)</i>' : ''}</div></li>`).join('')}
          </ul>
          <p class="gris chico">Según la Ley 27.642 de Etiquetado Frontal (Decreto 151/2022). Cálculo propio a partir de la tabla nutricional; puede no coincidir con el envase.</p>
        </details>
      </article>

      <article class="tarjeta">
        <h3>Resumen de la evaluación</h3>
        <p class="resumen">${esc(a.resumen)}</p>
        ${a.puntaje !== null ? `
          <div class="termometro">
            <div class="termometro-barra"><span style="left:${puntajeVisible}%"></span></div>
            <div class="termometro-textos"><span class="texto-rojo">Poco saludable</span><span class="texto-amarillo">Regular</span><span class="texto-verde">Muy saludable</span></div>
          </div>` : ''}
      </article>

      <article class="tarjeta">
        <div class="caja-puntaje">${ICONOS.hoja}<span>Puntaje nutricional</span><b>${a.puntaje ?? '—'}<small>/100</small></b></div>
        <div class="porcion">
          <div><span>Calorías</span><b>${dato(a.porcion.kcal, 'kcal')}</b><small>${esc(a.porcion.etiqueta)}</small></div>
          <div><span>Azúcares</span><b>${dato(a.porcion.azucares, 'g')}</b><small>${esc(a.porcion.etiqueta)}</small></div>
        </div>
      </article>

      ${a.puntaje !== null ? `
      <article class="tarjeta">
        <details>
          <summary>¿Por qué este puntaje?</summary>
          <ul class="motivos">
            <li><span>Puntaje inicial</span><b>100</b></li>
            ${a.motivos.map((m) => `<li><span>${esc(m.texto)}</span><b class="${m.puntos < 0 ? 'texto-rojo' : 'texto-verde'}">${m.puntos > 0 ? '+' : ''}${m.puntos}</b></li>`).join('')}
            <li class="total"><span>Puntaje general</span><b>${a.puntaje}</b></li>
            ${personal ? `
              ${mio.restas.map((m) => `<li><span>Tu perfil: ${esc(m.texto.toLowerCase())}</span><b class="texto-rojo">-${m.puntos}</b></li>`).join('')}
              <li class="total"><span>Tu puntaje${mio.alertas.some((x) => x.nivel === 'rojo') ? ' (máximo 39 si tiene algo que evitás)' : ''}</span><b>${mio.puntaje}</b></li>` : ''}
          </ul>
        </details>
      </article>` : ''}

      <article class="tarjeta">
        <details>
          <summary>Tabla nutricional (cada ${unidad})</summary>
          <table class="tabla">
            ${fila('Calorías', n.kcal, 'kcal')}
            ${fila('Azúcares totales', n.azucares, 'g')}
            ${fila('Azúcares añadidos', n.azucaresAnadidos, 'g')}
            ${fila('Grasas totales', n.grasas, 'g')}
            ${fila('Grasas saturadas', n.saturadas, 'g')}
            ${fila('Sodio', n.sodioMg, 'mg')}
            ${fila('Fibra', n.fibra, 'g')}
            ${fila('Proteínas', n.proteinas, 'g')}
          </table>
        </details>
      </article>

      <div class="botones">
        <a class="btn btn-verde" href="#/p/${codigo}/ingredientes">Ver ingredientes y aditivos</a>
        <button class="btn btn-borde" type="button" id="btn-comparar">${ICONOS.comparar} Comparar con otro producto</button>
        <a class="btn btn-borde" href="#/cargar/${codigo}">${p.fuente === 'manual' ? 'Editar datos' : 'Completar o corregir datos'}</a>
        <a class="btn btn-texto" href="#/escanear">Escanear otro producto</a>
      </div>

      <p class="pie">Información orientativa: no reemplaza el consejo de un profesional de la salud.<br>
      ${p.fuente === 'off' ? 'Datos de <a href="https://world.openfoodfacts.org/product/' + esc(codigo) + '" target="_blank" rel="noopener">Open Food Facts</a>.' : ''} Código ${esc(codigo)}</p>
    </div>`;
  conectarFavorito(codigo);
  conectarComparar(codigo);
}

function botonFavorito(activo) {
  return `<button class="btn-estrella${activo ? ' activa' : ''}" id="btn-favorito" type="button"
    aria-label="${activo ? 'Quitar de favoritos' : 'Agregar a favoritos'}" aria-pressed="${activo}">
    ${activo ? ICONOS.estrellaLlena : ICONOS.estrella}</button>`;
}

function conectarComparar(codigo) {
  const boton = document.getElementById('btn-comparar');
  if (!boton) return;
  boton.addEventListener('click', async () => {
    const r = await agregarAComparacion(codigo);
    if (r === 'lleno') aviso(`Ya tenés ${MAX_COMPARAR} productos para comparar: sacá uno con la ✕ para sumar este.`, 4000);
    else if ((await leerComparacion()).length < 2) aviso('Agregado. Sumá otro desde tu historial o escaneando otro producto.', 4000);
    ir('#/comparar');
  });
}

function conectarFavorito(codigo) {
  const boton = document.getElementById('btn-favorito');
  if (!boton) return;
  boton.addEventListener('click', async () => {
    const activo = await alternarFavorito(codigo);
    boton.outerHTML = botonFavorito(activo);
    conectarFavorito(codigo);
    aviso(activo ? 'Agregado a favoritos ⭐' : 'Quitado de favoritos', 1800);
  });
}

// Alertas según el perfil (lo que el usuario evita, alergias)
function tarjetaAlertas(alertas) {
  if (!alertas.length) return '';
  const rojas = alertas.filter((x) => x.nivel === 'rojo');
  return `
    <article class="tarjeta alertas ${rojas.length ? 'alertas-rojo' : 'alertas-amarillo'}" role="alert">
      <h3>${ICONOS.alerta} ${rojas.length ? 'Ojo: tiene algo que evitás' : 'Revisá antes de comprar'}</h3>
      <ul>${alertas.map((x) => `<li>${marca(x.nivel === 'rojo' ? 'mal' : 'ojo')}<span>${esc(x.texto)}</span></li>`).join('')}</ul>
      <a class="chico" href="#/perfil">Cambiar mi perfil</a>
    </article>`;
}

// ---------- Pantalla 3: Ingredientes y aditivos ----------

function separarIngredientes(texto) {
  const limpio = (texto || '').replace(/^\s*ingredientes?\s*:\s*/i, '').replace(/\.\s*$/, '');
  const partes = [];
  let actual = '';
  let nivel = 0;
  for (const c of limpio) {
    if (c === '(' || c === '[') nivel++;
    if (c === ')' || c === ']') nivel = Math.max(0, nivel - 1);
    if ((c === ',' || c === ';') && nivel === 0) {
      partes.push(actual);
      actual = '';
    } else actual += c;
  }
  partes.push(actual);
  return partes
    .map((s) => s.replace(/_/g, '').trim())
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));
}

async function pantallaIngredientes(codigo, vigente) {
  modo(false);
  const volver = '#/p/' + codigo;
  app.innerHTML = cabecera('Ingredientes y aditivos', volver) + cargando('Cargando…');

  const r = await obtener(codigo, vigente);
  if (!r) return;
  const p = r.producto;
  const a = analizar(p);
  const ingredientes = separarIngredientes(p.ingredientesTexto);
  const aModerar = a.aditivos.filter((x) => x.r === 'alto' || x.r === 'moderado');

  const funciones = [...new Set(aModerar.map((x) => x.f))];
  const explicacion = aModerar.length
    ? `Este producto tiene ${aModerar.length === 1 ? 'un aditivo' : aModerar.length + ' aditivos'} a moderar (${esc(funciones.join(', '))}). ` +
      'En general son aditivos aprobados, pero hay estudios que recomiendan no consumirlos seguido, sobre todo en chicos o personas sensibles. ' +
      'Consumirlos de vez en cuando no es un problema; lo importante es la frecuencia.'
    : a.aditivos.length
      ? 'Los aditivos de este producto se consideran de bajo riesgo en las cantidades permitidas.'
      : 'No detectamos aditivos en este producto.';

  app.innerHTML = `
    ${cabecera('Ingredientes y aditivos', volver)}
    <div class="contenido">
      <div class="pestanas" role="tablist">
        <button class="activa" data-tab="todos">Todos</button>
        <button data-tab="ingredientes">Ingredientes</button>
        <button data-tab="aditivos">Aditivos${a.aditivos.length ? ` (${a.aditivos.length})` : ''}</button>
      </div>

      <article class="tarjeta" data-seccion="ingredientes">
        <h3>Ingredientes</h3>
        ${ingredientes.length
          ? `<ul class="lista-ingredientes">${ingredientes.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`
          : `<p class="gris">No tenemos la lista de ingredientes de este producto.</p>
             <a class="btn btn-borde" href="#/cargar/${codigo}">Cargar ingredientes</a>`}
      </article>

      <article class="tarjeta" data-seccion="aditivos">
        <h3>Aditivos</h3>
        ${a.aditivos.length
          ? `<ul class="lista-aditivos">${a.aditivos.map((x) => `
              <li>
                ${marca(riesgoATipo(x.r))}
                <div>
                  <b class="riesgo-${x.r}">${esc(x.n)} (${esc('E' + x.codigo.slice(1))})</b>
                  <small>${esc(x.f.charAt(0).toUpperCase() + x.f.slice(1))} · ${TEXTO_RIESGO[x.r]}</small>
                  <p>${esc(x.x)}</p>
                </div>
              </li>`).join('')}</ul>`
          : '<p class="gris">No detectamos aditivos.</p>'}
      </article>

      <article class="tarjeta caja-info" data-seccion="aditivos">
        <h3>${ICONOS.info} ¿Qué significa esto?</h3>
        <p>${explicacion}</p>
        <p class="referencias">${marca('bien')} riesgo bajo &nbsp; ${marca('ojo')} moderado &nbsp; ${marca('mal')} alto</p>
      </article>

      <p class="pie">Los aditivos se detectan a partir de los datos del producto y la lista de ingredientes. La evaluación de riesgo es orientativa.</p>
    </div>`;

  const botones = app.querySelectorAll('.pestanas button');
  botones.forEach((b) =>
    b.addEventListener('click', () => {
      botones.forEach((x) => x.classList.toggle('activa', x === b));
      app.querySelectorAll('[data-seccion]').forEach((s) => {
        s.hidden = b.dataset.tab !== 'todos' && s.dataset.seccion !== b.dataset.tab;
      });
    })
  );
}

// ---------- Pantalla 4: Cargar o completar un producto a mano ----------

// Renglones en el mismo orden que la tabla nutricional argentina.
// (Carbohidratos y grasas trans no se piden: no hacen falta para el análisis.)
const CAMPOS_NUTRI = [
  { id: 'kcal', nombre: 'Valor energético', unidad: 'kcal', obligatorio: true, ayuda: 'el número que va con "kcal"' },
  { id: 'azucares', nombre: 'Azúcares totales', unidad: 'g' },
  { id: 'azucaresAnadidos', nombre: 'Azúcares añadidos', unidad: 'g' },
  { id: 'proteinas', nombre: 'Proteínas', unidad: 'g', opcional: true },
  { id: 'grasas', nombre: 'Grasas totales', unidad: 'g' },
  { id: 'saturadas', nombre: 'Grasas saturadas', unidad: 'g' },
  { id: 'fibra', nombre: 'Fibra alimentaria', unidad: 'g', opcional: true },
  { id: 'sodioMg', nombre: 'Sodio', unidad: 'mg' },
];

// ---------- Lectura automática de los ingredientes ----------
// (La tabla nutricional no se lee automáticamente: con fotos reales el lector gratuito no es confiable.)

// Botón para leer los ingredientes: usa la foto guardada si hay, o pide una nueva
function botonLeer(tipo, pendiente) {
  const guardada = pendiente?.fotos[tipo];
  return `
    <div class="leer-foto" data-leer="${tipo}">
      ${guardada
        ? '<button class="btn btn-leer" type="button" data-usar-guardada>✨ Intentar leer los ingredientes de tu foto</button>'
        : '<label class="btn btn-leer">📷 Intentar leer los ingredientes con la cámara<input type="file" accept="image/*" capture="environment" hidden></label>'}
      <p class="leer-estado" hidden></p>
    </div>`;
}

function conectarLectura(form, pendiente) {
  form.querySelectorAll('[data-leer]').forEach((caja) => {
    const tipo = caja.dataset.leer;
    const estado = caja.querySelector('.leer-estado');
    const mostrar = (texto, clase = '') => {
      estado.hidden = false;
      estado.className = 'leer-estado ' + clase;
      estado.textContent = texto;
    };

    const leer = async (src) => {
      const boton = caja.querySelector('.btn-leer');
      boton.classList.add('ocupado');
      try {
        const { leerTextoDeFoto, interpretarIngredientes } = await import('./lector-texto.js');
        const texto = await leerTextoDeFoto(src, (msj, pct) => mostrar(pct ? `${msj} ${pct}%` : msj));
        const ingredientes = interpretarIngredientes(texto);
        if (ingredientes.replace(/[^a-záéíóúñ]/gi, '').length < 8) {
          mostrar('No pudimos leer los ingredientes. Probá con una foto más de cerca, de frente y con buena luz, o copialos a mano.', 'mal');
          return;
        }
        const area = form.querySelector('[name="ingredientes"]');
        area.value = ingredientes;
        area.classList.add('leido');
        mostrar('Listo. Revisá el texto con la foto y corregí lo que haga falta antes de guardar.', 'bien');
      } catch (err) {
        console.error(err);
        mostrar(navigator.onLine
          ? 'No se pudo leer la foto. Probá de nuevo en un rato.'
          : 'La primera vez hace falta internet para preparar el lector.', 'mal');
      } finally {
        boton.classList.remove('ocupado');
      }
    };

    const guardada = caja.querySelector('[data-usar-guardada]');
    if (guardada) guardada.addEventListener('click', () => leer(pendiente.fotos[tipo]));
    const input = caja.querySelector('input[type="file"]');
    if (input) {
      input.addEventListener('change', async (e) => {
        const archivo = e.target.files[0];
        if (!archivo) return;
        leer(await achicarFoto(archivo, 1600, 0.9));
      });
    }
  });
}

async function pantallaCargar(codigo, vigente) {
  modo(false);
  app.innerHTML = cabecera('Cargar producto') + cargando('Preparando el formulario…');
  const [previo, pendiente] = await Promise.all([leerProducto(codigo), leerPendiente(codigo)]);
  // Si es nuevo, traemos nombre, marca y tamaño de Precios Claros para no tener que tipearlos
  const conocido = previo || pendiente ? null : await buscarEnPreciosClaros(codigo);
  if (!vigente()) return;
  const { noEsAlimento, ...sugerido } = conocido || {};
  const p = previo || { codigo, n: {}, ...sugerido };
  // Datos que se anotaron al sacar las fotos
  if (pendiente) {
    if (!p.nombre || p.nombre === 'Producto sin nombre') p.nombre = pendiente.nombre;
    p.marca = p.marca || pendiente.marca;
    p.cantidad = p.cantidad || pendiente.cantidad;
    if (!previo) p.esBebida = pendiente.esBebida;
  }
  const volver = previo ? '#/p/' + codigo : pendiente ? '#/pendientes' : '#/';
  const valor = (x) => (x === null || x === undefined ? '' : String(Math.round(x * 10) / 10).replace('.', ','));
  let foto = p.imagen || pendiente?.fotos.frente || null;
  // Al editar, si conocemos la porción mostramos los valores por porción (como en el envase)
  const porcionGuardada = Number(p.porcion?.cantidad) || null;
  const mostrarPorPorcion = !previo || !!porcionGuardada;
  const inicial = (v) => (v === null || v === undefined ? null : mostrarPorPorcion && porcionGuardada ? (v * porcionGuardada) / 100 : v);
  const unidadPorcion = p.porcion?.unidad || (p.esBebida ? 'ml' : 'g');

  app.innerHTML = `
    ${cabecera(previo ? 'Completar datos' : 'Cargar producto', volver)}
    ${pendiente ? panelFotos(pendiente) : ''}
    <form class="contenido formulario" id="form-cargar" novalidate>
      <article class="tarjeta">
        <p class="gris chico">Código de barras: <b>${esc(codigo)}</b></p>
        <label class="foto-carga">
          <span class="foto-prev">${foto ? `<img src="${esc(foto)}" alt="">` : ICONOS.camara}</span>
          <span>${foto ? 'Cambiar la foto' : 'Sacar o elegir una foto'}</span>
          <input type="file" accept="image/*" capture="environment" id="foto-producto" hidden>
        </label>
        <label>Nombre del producto *<input name="nombre" required value="${esc(p.nombre === 'Producto sin nombre' ? '' : p.nombre)}" placeholder="Ej.: Gelatina sabor frutilla"></label>
        <label>Marca<input name="marca" value="${esc(p.marca)}" placeholder="Ej.: Royal"></label>
        <label>Contenido neto<input name="cantidad" value="${esc(p.cantidad)}" placeholder="Ej.: 125 g"></label>
        <fieldset class="opciones">
          <legend>¿Qué es?</legend>
          <label><input type="radio" name="tipo" value="solido" ${!p.esBebida ? 'checked' : ''}> Alimento</label>
          <label><input type="radio" name="tipo" value="bebida" ${p.esBebida ? 'checked' : ''}> Bebida</label>
        </fieldset>
      </article>

      <article class="tarjeta">
        <h3>Información nutricional</h3>
        <p class="gris chico">Copiá renglón por renglón, igual que en el envase. Carbohidratos y grasas trans no hacen falta. Si un renglón no está, dejalo vacío.</p>

        <div class="tabla-carga">
          <div class="tabla-carga-porcion">
            <span>Porción</span>
            <input name="porcion" inputmode="decimal" enterkeyhint="next" value="${valor(porcionGuardada)}" placeholder="ej. 30" aria-label="Tamaño de la porción">
            <select name="unidadPorcion" aria-label="Unidad de la porción">
              <option value="g" ${unidadPorcion === 'g' ? 'selected' : ''}>g</option>
              <option value="ml" ${unidadPorcion === 'ml' ? 'selected' : ''}>ml</option>
            </select>
          </div>
          <p class="tabla-carga-ayuda">Ej.: "Porción: 13 ml (1 cuchara de sopa)" → 13 ml</p>

          <fieldset class="tabla-carga-base">
            <legend class="sr-solo">Los valores son</legend>
            <label><input type="radio" name="base" value="porcion" ${mostrarPorPorcion ? 'checked' : ''}> Cant. por porción</label>
            <label><input type="radio" name="base" value="100" ${mostrarPorPorcion ? '' : 'checked'}> Cada 100 g / ml</label>
          </fieldset>

          ${CAMPOS_NUTRI.map((c) => `
            <label class="tabla-carga-fila${c.opcional ? ' opcional' : ''}">
              <span>${c.nombre}${c.obligatorio ? ' <b class="obligatorio">*</b>' : ''}${c.opcional ? ' <small>(opcional)</small>' : ''}${c.ayuda ? `<small class="bloque">${c.ayuda}</small>` : ''}</span>
              <span class="tabla-carga-valor">
                <input name="${c.id}" inputmode="decimal" enterkeyhint="next" value="${valor(inicial(p.n?.[c.id]))}">
                <i>${c.unidad}</i>
              </span>
            </label>`).join('')}
        </div>
        <p class="gris chico">Si el sodio figura en gramos, multiplicalo por 1000 (0,3 g = 300 mg).</p>
      </article>

      <article class="tarjeta">
        <h3>Ingredientes</h3>
        ${botonLeer('ingredientes', pendiente)}
        <label>Copiá la lista tal cual figura en el envase
          <textarea name="ingredientes" rows="5" placeholder="Ej.: Agua, gelatina, azúcar, acidulante: ácido cítrico (INS 330)…">${esc(p.ingredientesTexto)}</textarea>
        </label>
      </article>

      <p class="error" id="error-form" hidden></p>
      <div class="botones">
        <button class="btn btn-verde" type="submit">Guardar y analizar</button>
        <a class="btn btn-texto" href="${volver}">Cancelar</a>
      </div>
    </form>`;

  const form = document.getElementById('form-cargar');
  if (pendiente) conectarPanelFotos(pendiente);
  conectarLectura(form, pendiente);

  // "Siguiente" en el teclado pasa al próximo número (en vez de enviar el formulario)
  const numeros = [...form.querySelectorAll('input[inputmode="decimal"]')];
  numeros.forEach((input, i) =>
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      if (numeros[i + 1]) numeros[i + 1].focus();
      else form.querySelector('[name="ingredientes"]').focus();
    })
  );

  document.getElementById('foto-producto').addEventListener('change', async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    try {
      foto = await achicarFoto(archivo);
      form.querySelector('.foto-prev').innerHTML = `<img src="${foto}" alt="">`;
    } catch {
      aviso('No pudimos usar esa foto. Probá con otra.');
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const datos = new FormData(form);
    const numero = (nombre) => {
      const t = String(datos.get(nombre) || '').trim().replace(',', '.');
      return t === '' || isNaN(t) ? null : Number(t);
    };
    const error = (texto) => {
      const el = document.getElementById('error-form');
      el.textContent = texto;
      el.hidden = false;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const nombre = String(datos.get('nombre') || '').trim();
    const porcion = numero('porcion');
    const porPorcion = datos.get('base') === 'porcion';
    if (!nombre) return error('Falta el nombre del producto.');
    if (numero('kcal') === null) return error('Faltan las calorías: son necesarias para calcular los octógonos.');
    if (porPorcion && !(porcion > 0)) return error('Falta el tamaño de la porción (el número que figura arriba de la tabla, por ejemplo "Porción: 13 ml").');

    const factor = porPorcion ? 100 / porcion : 1;
    const n = {};
    for (const c of CAMPOS_NUTRI) {
      const v = numero(c.id);
      n[c.id] = v === null ? null : Math.round(v * factor * 100) / 100;
    }

    const producto = {
      ...p,
      codigo,
      fuente: 'manual',
      nombre,
      marca: String(datos.get('marca') || '').trim(),
      cantidad: String(datos.get('cantidad') || '').trim(),
      imagen: foto,
      esBebida: datos.get('tipo') === 'bebida',
      porcion: porcion > 0 ? { cantidad: porcion, unidad: datos.get('unidadPorcion') || 'g', texto: '' } : null,
      n,
      ingredientesTexto: String(datos.get('ingredientes') || '').trim(),
    };
    // Si el usuario reescribe los ingredientes, todo se recalcula desde su texto
    if (!previo || previo.ingredientesTexto !== producto.ingredientesTexto) {
      producto.aditivosTags = [];
      producto.agregados = null;
      producto.tieneCafeina = false;
    }
    await guardarProducto(producto);
    if (pendiente) await borrarPendiente(codigo);
    aviso('Producto guardado en tu celular.');
    if (!previo) codigoNuevo = codigo;
    ir('#/p/' + codigo);
  });
}


// ---------- Arranque ----------

window.addEventListener('hashchange', router);
router();

if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
