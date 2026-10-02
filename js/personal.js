// Pantallas personales: historial, favoritos y perfil.
import { listarHistorial, borrarHistorial, listarFavoritos, leerPerfil, guardarPerfil, exportarTodo, importarTodo } from './db.js';
import { analizar, nivelDePuntaje } from './analisis.js';
import { CUIDADOS, EVITAR, ALERGIAS, perfilVacio, evaluarParaMi } from './perfil.js';
import { esc, ICONOS, modo, cabecera, cargando, navegacion, filaProducto, fechaRelativa, aviso } from './ui.js';

const app = document.getElementById('app');

// Puntaje que se muestra en las listas (personal si hay perfil)
function puntajeDe(prod, perfil) {
  if (!prod) return { puntaje: null, nivel: nivelDePuntaje(null), alerta: false };
  const a = analizar(prod);
  const mio = evaluarParaMi(prod, a, perfil);
  return { puntaje: mio.puntaje, nivel: nivelDePuntaje(mio.puntaje), alerta: mio.alertas.some((x) => x.nivel === 'rojo') };
}

function listaVacia(icono, titulo, texto) {
  return `
    <article class="tarjeta vacio">
      <span class="vacio-icono">${icono}</span>
      <h3>${titulo}</h3>
      <p class="gris">${texto}</p>
      <a class="btn btn-verde" href="#/escanear">Escanear un producto</a>
    </article>`;
}

function filas(items, perfil, detalle) {
  return `<div class="tarjeta lista">${items.map((i) => {
    const { puntaje, nivel, alerta } = puntajeDe(i.producto, perfil);
    return filaProducto(i.codigo, i.producto, puntaje, nivel, (alerta ? '⚠️ Tiene algo que evitás · ' : '') + detalle(i));
  }).join('')}</div>`;
}

// ---------- Historial ----------

export async function pantallaHistorial(vigente) {
  modo(false);
  app.innerHTML = cabecera('Historial', null) + cargando('Cargando…') + navegacion('historial');
  const [items, perfil] = await Promise.all([listarHistorial(), leerPerfil()]);
  if (!vigente()) return;

  app.innerHTML = `
    ${cabecera('Historial', null)}
    <div class="contenido con-navegacion">
      ${items.length
        ? `${filas(items, perfil, (i) => fechaRelativa(i.fecha))}
           <button class="btn btn-texto" id="borrar-historial" type="button">Borrar historial</button>`
        : listaVacia(ICONOS.reloj, 'Todavía no escaneaste nada', 'Acá vas a ver los productos que escanees.')}
    </div>
    ${navegacion('historial')}`;

  const borrar = document.getElementById('borrar-historial');
  if (borrar) {
    // Confirmación en dos toques (sin ventanas emergentes)
    borrar.addEventListener('click', async () => {
      if (!borrar.classList.contains('confirmar')) {
        borrar.classList.add('confirmar');
        borrar.textContent = 'Tocá de nuevo para borrar todo el historial';
        setTimeout(() => {
          if (document.body.contains(borrar)) {
            borrar.classList.remove('confirmar');
            borrar.textContent = 'Borrar historial';
          }
        }, 4000);
        return;
      }
      await borrarHistorial();
      aviso('Historial borrado. Los productos y favoritos siguen guardados.');
      pantallaHistorial(vigente);
    });
  }
}

// ---------- Favoritos ----------

export async function pantallaFavoritos(vigente) {
  modo(false);
  app.innerHTML = cabecera('Favoritos', null) + cargando('Cargando…') + navegacion('favoritos');
  const [items, perfil] = await Promise.all([listarFavoritos(), leerPerfil()]);
  if (!vigente()) return;

  app.innerHTML = `
    ${cabecera('Favoritos', null)}
    <div class="contenido con-navegacion">
      ${items.length
        ? filas(items, perfil, (i) => 'Guardado ' + fechaRelativa(i.fecha).toLowerCase())
        : listaVacia(ICONOS.estrella, 'No tenés favoritos', 'Tocá la estrella ☆ arriba a la derecha en el resultado de un producto para guardarlo acá.')}
    </div>
    ${navegacion('favoritos')}`;
}

// ---------- Perfil ----------

function casillas(nombre, opciones, elegidas) {
  return `<div class="casillas">${opciones.map((o) => `
    <label><input type="checkbox" name="${nombre}" value="${o.id}" ${elegidas.includes(o.id) ? 'checked' : ''}><span>${esc(o.texto)}</span></label>`).join('')}
  </div>`;
}

export async function pantallaPerfil(vigente) {
  modo(false);
  app.innerHTML = cabecera('Mi perfil', null) + cargando('Cargando…') + navegacion('perfil');
  const perfil = (await leerPerfil()) || perfilVacio();
  if (!vigente()) return;

  app.innerHTML = `
    ${cabecera('Mi perfil', null)}
    <form class="contenido con-navegacion formulario" id="form-perfil">
      <article class="tarjeta">
        <h3>¿Qué cuidás?</h3>
        <p class="gris chico">Baja tu puntaje personal si el producto tiene ese octógono.</p>
        ${casillas('cuidados', CUIDADOS, perfil.cuidados)}
      </article>

      <article class="tarjeta">
        <h3>¿Qué evitás?</h3>
        <p class="gris chico">Te mostramos una alerta roja si el producto lo tiene.</p>
        ${casillas('evitar', EVITAR, perfil.evitar)}
      </article>

      <article class="tarjeta">
        <h3>Alergias e intolerancias</h3>
        <p class="gris chico">Alerta roja si lo contiene y amarilla si dice "puede contener trazas".</p>
        ${casillas('alergias', ALERGIAS, perfil.alergias)}
      </article>

      <article class="tarjeta">
        <h3>Otros ingredientes a evitar</h3>
        <label>Escribilos separados por coma
          <textarea name="ingredientes" rows="3" placeholder="Ej.: aceite de palma, jarabe de maíz">${esc(perfil.ingredientes)}</textarea>
        </label>
      </article>

      <article class="tarjeta caja-info">
        <h3>${ICONOS.info} Importante</h3>
        <p>SaludableScan es una guía orientativa para elegir mejor en el súper. <b>No reemplaza el consejo de un médico o nutricionista</b>, sobre todo si tenés diabetes, hipertensión, celiaquía o alergias. Ante cualquier duda, leé siempre el envase.</p>
      </article>

      <article class="tarjeta">
        <h3>Copia de seguridad</h3>
        <p class="gris chico">Tus datos (productos cargados, historial, favoritos y perfil) se guardan solo en este celular. Bajá una copia para no perderlos o para pasarlos a otro teléfono.</p>
        <div class="botones">
          <button class="btn btn-borde" type="button" id="exportar">Descargar copia</button>
          <label class="btn btn-borde">Restaurar una copia<input type="file" accept=".json,application/json" id="importar" hidden></label>
        </div>
      </article>
    </form>
    ${navegacion('perfil')}`;

  const form = document.getElementById('form-perfil');

  // Se guarda solo, en cada cambio
  let espera = null;
  const guardar = () => {
    const datos = new FormData(form);
    const nuevo = {
      cuidados: datos.getAll('cuidados'),
      evitar: datos.getAll('evitar'),
      alergias: datos.getAll('alergias'),
      ingredientes: String(datos.get('ingredientes') || ''),
    };
    clearTimeout(espera);
    espera = setTimeout(async () => {
      await guardarPerfil(nuevo);
      aviso('Perfil guardado', 1500);
    }, 400);
  };
  form.addEventListener('change', guardar);
  form.querySelector('textarea').addEventListener('input', guardar);
  form.addEventListener('submit', (e) => e.preventDefault());

  document.getElementById('exportar').addEventListener('click', async () => {
    const copia = await exportarTodo();
    const archivo = new Blob([JSON.stringify(copia)], { type: 'application/json' });
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(archivo);
    enlace.download = `saludablescan-copia-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(enlace.href), 5000);
    aviso(`Copia descargada (${copia.productos.length} productos). Guardala en un lugar seguro, por ejemplo Google Drive.`, 5000);
  });

  document.getElementById('importar').addEventListener('change', async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    try {
      const cantidad = await importarTodo(JSON.parse(await archivo.text()));
      aviso(`Copia restaurada: ${cantidad} productos.`, 4000);
      pantallaPerfil(vigente);
    } catch {
      aviso('Ese archivo no es una copia de SaludableScan.', 4000);
    }
  });
}
