// Fotos del envase: sacarlas en el súper y completar el producto después.
import { guardarPendiente, leerPendiente, listarPendientes, borrarPendiente, leerProducto } from './db.js';
import { buscarEnPreciosClaros } from './api.js';
import { esc, ICONOS, modo, cabecera, cargando, navegacion, fechaRelativa, aviso } from './ui.js';

const app = document.getElementById('app');

export const TIPOS_FOTO = [
  { id: 'tabla', titulo: 'Tabla nutricional', ayuda: 'La tabla con calorías, azúcares, grasas y sodio.' },
  { id: 'ingredientes', titulo: 'Ingredientes', ayuda: 'La lista que empieza con "Ingredientes:".' },
  { id: 'frente', titulo: 'Frente del producto', ayuda: 'Opcional: para reconocerlo en las listas.' },
];

// Achica la foto para que no ocupe tanto lugar. Las del envase van más grandes para que se lea la letra chica.
export function achicarFoto(archivo, maximo = 640, calidad = 0.8) {
  return new Promise((resolver, rechazar) => {
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, maximo / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolver(canvas.toDataURL('image/jpeg', calidad));
    };
    img.onerror = rechazar;
    img.src = URL.createObjectURL(archivo);
  });
}

// ---------- Visor a pantalla completa (tocar = acercar / alejar) ----------

export function verFoto(src, titulo = '') {
  const visor = document.createElement('div');
  visor.className = 'visor-foto';
  visor.innerHTML = `
    <div class="visor-foto-barra">
      <span>${esc(titulo)}</span>
      <button type="button" aria-label="Cerrar">${ICONOS.cerrar}</button>
    </div>
    <div class="visor-foto-imagen"><img src="${src}" alt="${esc(titulo)}"></div>
    <p class="visor-foto-ayuda">Tocá la foto para acercar o alejar</p>`;
  document.body.appendChild(visor);
  const contenedor = visor.querySelector('.visor-foto-imagen');
  contenedor.addEventListener('click', (e) => {
    const acercada = contenedor.classList.toggle('acercada');
    if (acercada) {
      // Acerca hacia el punto tocado
      const rect = contenedor.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      requestAnimationFrame(() => {
        contenedor.scrollLeft = x * contenedor.scrollWidth - rect.width / 2;
        contenedor.scrollTop = y * contenedor.scrollHeight - rect.height / 2;
      });
    }
  });
  const cerrar = () => {
    visor.remove();
    window.removeEventListener('hashchange', cerrar);
  };
  visor.querySelector('button').addEventListener('click', cerrar);
  window.addEventListener('hashchange', cerrar);
}

// ---------- Panel de fotos arriba del formulario de carga ----------

export function panelFotos(pendiente) {
  const disponibles = TIPOS_FOTO.filter((t) => pendiente.fotos[t.id]);
  if (!disponibles.length) return '';
  return `
    <div class="panel-fotos" id="panel-fotos">
      <div class="panel-fotos-pestanas">
        ${disponibles.map((t, i) => `<button type="button" data-foto="${t.id}" class="${i === 0 ? 'activa' : ''}">${esc(t.titulo)}</button>`).join('')}
        <button type="button" class="panel-fotos-ocultar" data-ocultar aria-label="Ocultar fotos">Ocultar</button>
      </div>
      <img src="${pendiente.fotos[disponibles[0].id]}" alt="${esc(disponibles[0].titulo)}" id="panel-fotos-img">
      <small>Tocá la foto para verla grande</small>
    </div>`;
}

export function conectarPanelFotos(pendiente) {
  const panel = document.getElementById('panel-fotos');
  if (!panel) return;
  const img = document.getElementById('panel-fotos-img');
  let actual = panel.querySelector('[data-foto]').dataset.foto;
  panel.querySelectorAll('[data-foto]').forEach((b) =>
    b.addEventListener('click', () => {
      actual = b.dataset.foto;
      panel.querySelectorAll('[data-foto]').forEach((x) => x.classList.toggle('activa', x === b));
      img.src = pendiente.fotos[actual];
      panel.classList.remove('oculto');
    })
  );
  panel.querySelector('[data-ocultar]').addEventListener('click', () => {
    const oculto = panel.classList.toggle('oculto');
    panel.querySelector('[data-ocultar]').textContent = oculto ? 'Mostrar' : 'Ocultar';
  });
  img.addEventListener('click', () => verFoto(img.src, TIPOS_FOTO.find((t) => t.id === actual).titulo));
}

// ---------- Pantalla: sacar las fotos ----------

export async function pantallaFotos(codigo, vigente) {
  modo(false);
  app.innerHTML = cabecera('Fotos del envase', '#/p/' + codigo) + cargando('Preparando…');
  const [previo, producto, conocido] = await Promise.all([leerPendiente(codigo), leerProducto(codigo), buscarEnPreciosClaros(codigo)]);
  if (!vigente()) return;

  const fotos = { ...(previo?.fotos || {}) };
  const nombre = previo?.nombre || (producto && producto.nombre !== 'Producto sin nombre' ? producto.nombre : '') || conocido?.nombre || '';
  const datos = {
    codigo,
    nombre,
    marca: previo?.marca || producto?.marca || conocido?.marca || '',
    cantidad: previo?.cantidad || producto?.cantidad || conocido?.cantidad || '',
    esBebida: previo?.esBebida ?? producto?.esBebida ?? conocido?.esBebida ?? false,
  };

  app.innerHTML = `
    ${cabecera('Fotos del envase', '#/p/' + codigo)}
    <div class="contenido">
      <article class="tarjeta">
        ${nombre ? `<h3>${esc(nombre)}</h3>` : ''}
        <p class="gris chico">Sacale foto ahora y completalo en casa con calma. Las fotos quedan guardadas solo en tu celular.</p>
        <p class="gris chico">Consejo: de frente, con buena luz y sin reflejos, que se lean bien los números.</p>
      </article>

      ${TIPOS_FOTO.map((t) => `
        <label class="tarjeta foto-envase" data-tipo="${t.id}">
          <span class="foto-envase-vista">${fotos[t.id] ? `<img src="${fotos[t.id]}" alt="">` : ICONOS.camara}</span>
          <span class="foto-envase-texto">
            <b>${esc(t.titulo)}</b>
            <small>${esc(t.ayuda)}</small>
            <span class="foto-envase-accion">${fotos[t.id] ? '✓ Lista · tocá para cambiarla' : 'Tocá para sacar la foto'}</span>
          </span>
          <input type="file" accept="image/*" capture="environment" hidden>
        </label>`).join('')}

      <div class="botones">
        <button class="btn btn-verde" type="button" id="guardar-fotos" ${Object.keys(fotos).length ? '' : 'disabled'}>Guardar para completar después</button>
        <a class="btn btn-borde" href="#/cargar/${esc(codigo)}">Prefiero completarlo ahora</a>
      </div>
    </div>`;

  const botonGuardar = document.getElementById('guardar-fotos');

  app.querySelectorAll('.foto-envase').forEach((tarjeta) => {
    tarjeta.querySelector('input').addEventListener('change', async (e) => {
      const archivo = e.target.files[0];
      if (!archivo) return;
      const tipo = tarjeta.dataset.tipo;
      try {
        // Tabla e ingredientes en buena resolución (letra chica); el frente, más chico
        fotos[tipo] = await achicarFoto(archivo, tipo === 'frente' ? 640 : 1600, 0.85);
        tarjeta.querySelector('.foto-envase-vista').innerHTML = `<img src="${fotos[tipo]}" alt="">`;
        tarjeta.querySelector('.foto-envase-accion').textContent = '✓ Lista · tocá para cambiarla';
        botonGuardar.disabled = false;
      } catch {
        aviso('No pudimos usar esa foto. Probá de nuevo.');
      }
    });
  });

  botonGuardar.addEventListener('click', async () => {
    await guardarPendiente({ ...datos, fotos });
    aviso('Guardado. Lo completás cuando quieras desde Historial → "Para completar".', 4500);
    location.hash = '#/escanear';
  });
}

// ---------- Pantalla: lista de pendientes ----------

export async function pantallaPendientes(vigente) {
  modo(false);
  app.innerHTML = cabecera('Para completar', '#/historial') + cargando('Cargando…');
  const pendientes = await listarPendientes();
  if (!vigente()) return;

  app.innerHTML = `
    ${cabecera('Para completar', '#/historial')}
    <div class="contenido con-navegacion">
      ${pendientes.length ? `
        <p class="gris chico">Productos con fotos guardadas. Tocá "Completar" para copiar los datos mirando la foto.</p>
        <div class="tarjeta lista">
          ${pendientes.map((p) => {
            const miniatura = p.fotos.frente || p.fotos.tabla || p.fotos.ingredientes;
            return `
              <div class="fila-pendiente">
                <span class="fila-foto">${miniatura ? `<img src="${miniatura}" alt="">` : ICONOS.camara}</span>
                <span class="fila-datos">
                  <b>${esc(p.nombre || 'Producto ' + p.codigo)}</b>
                  <small>${esc([p.marca, fechaRelativa(p.fecha)].filter(Boolean).join(' · '))}</small>
                </span>
                <span class="fila-acciones">
                  <a class="btn btn-verde btn-chico" href="#/cargar/${esc(p.codigo)}">Completar</a>
                  <button class="btn btn-texto btn-chico" type="button" data-descartar="${esc(p.codigo)}">Descartar</button>
                </span>
              </div>`;
          }).join('')}
        </div>`
      : `<article class="tarjeta vacio">
          <span class="vacio-icono">${ICONOS.camara}</span>
          <h3>No tenés productos para completar</h3>
          <p class="gris">Cuando un producto no tiene datos, tocá "Sacar fotos y completar después" y aparece acá.</p>
          <a class="btn btn-verde" href="#/escanear">Escanear un producto</a>
        </article>`}
    </div>
    ${navegacion('historial')}`;

  // Descartar en dos toques
  app.querySelectorAll('[data-descartar]').forEach((b) =>
    b.addEventListener('click', async () => {
      if (!b.classList.contains('confirmar')) {
        b.classList.add('confirmar');
        b.textContent = '¿Seguro?';
        return;
      }
      await borrarPendiente(b.dataset.descartar);
      pantallaPendientes(vigente);
    })
  );
}
