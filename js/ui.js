// Piezas visuales reutilizables.

// Escapa texto para meterlo en HTML sin riesgos (los datos vienen de internet).
export function esc(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export const ICONOS = {
  atras: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  galeria: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
  linterna: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
  teclado: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M7 15h10"/></svg>',
  hoja: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M17 4C10 4 5 8 5 14c0 1.6.4 3 1.2 4.1 1.2-3.8 4-6.6 8.1-8.1-3.2 2.2-5.6 5-6.8 9 1.2.7 2.5 1 3.9 1 6 0 7.6-6.5 5.6-16z"/></svg>',
  info: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-5M12 8h.01"/></svg>',
  codigo: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8v8M10 8v8M13 8v8M17 8v8"/></svg>',
  reloj: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  estrella: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/></svg>',
  estrellaLlena: '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/></svg>',
  persona: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>',
  alerta: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
  camara: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
};

// ---------- Estructura de pantalla ----------

// Pantalla oscura (escanear) o clara (el resto)
export function modo(oscuro) {
  document.body.classList.toggle('oscuro', oscuro);
  document.querySelector('meta[name="theme-color"]').content = oscuro ? '#0f1a14' : '#1e9e4a';
}

// Barra superior. "volver" = a dónde lleva la flecha (null = sin flecha); "derecha" = botón opcional
export function cabecera(titulo, volver = '#/', derecha = '') {
  return `
    <header class="barra">
      ${volver ? `<a href="${volver}" class="btn-atras" aria-label="Volver">${ICONOS.atras}</a>` : '<span class="barra-hueco"></span>'}
      <h1>${esc(titulo)}</h1>
      ${derecha || '<span class="barra-hueco"></span>'}
    </header>`;
}

export function cargando(texto) {
  return `<div class="cargando"><div class="ruedita"></div><p>${esc(texto)}</p></div>`;
}

// Barra de navegación de abajo
export function navegacion(activa, oscura = false) {
  const items = [
    { id: 'escanear', href: '#/', icono: ICONOS.codigo, texto: 'Escanear' },
    { id: 'historial', href: '#/historial', icono: ICONOS.reloj, texto: 'Historial' },
    { id: 'favoritos', href: '#/favoritos', icono: ICONOS.estrella, texto: 'Favoritos' },
    { id: 'perfil', href: '#/perfil', icono: ICONOS.persona, texto: 'Perfil' },
  ];
  return `
    <nav class="navegacion${oscura ? ' navegacion-oscura' : ''}">
      ${items.map((i) => `<a href="${i.href}" class="${i.id === activa ? 'activa' : ''}"${i.id === activa ? ' aria-current="page"' : ''}>${i.icono}<span>${i.texto}</span></a>`).join('')}
    </nav>`;
}

// Fila de producto para las listas (historial, favoritos)
export function filaProducto(codigo, prod, puntaje, nivel, detalle = '') {
  const nombre = prod ? (prod.nombre && prod.nombre !== 'Producto sin nombre' ? prod.nombre : prod.marca || 'Producto sin nombre') : 'Producto sin datos';
  return `
    <a class="fila-producto" href="#/p/${esc(codigo)}">
      <span class="fila-foto">${prod && prod.imagen ? `<img src="${esc(prod.imagen)}" alt="" loading="lazy">` : ICONOS.camara}</span>
      <span class="fila-datos">
        <b>${esc(nombre)}</b>
        <small>${esc([prod && prod.nombre !== 'Producto sin nombre' ? prod.marca : '', detalle].filter(Boolean).join(' · '))}</small>
      </span>
      <span class="pastilla pastilla-${nivel.color}">${puntaje ?? '—'}</span>
    </a>`;
}

export function fechaRelativa(ms) {
  const dias = Math.floor((Date.now() - ms) / 864e5);
  const hora = new Date(ms).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  if (dias <= 0 && new Date(ms).getDate() === new Date().getDate()) return 'Hoy ' + hora;
  if (dias <= 1) return 'Ayer ' + hora;
  if (dias < 7) return `Hace ${dias} días`;
  return new Date(ms).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

// Ícono redondo ✓ / ! / ✗
export function marca(tipo) {
  const simbolo = { bien: '✓', ojo: '!', mal: '✕', gris: '?' }[tipo] || '?';
  return `<span class="marca marca-${tipo}" aria-hidden="true">${simbolo}</span>`;
}

// Anillo circular con el puntaje
export function anillo(puntaje, nivel, tam = 132) {
  const r = 52;
  const largo = 2 * Math.PI * r;
  const valor = puntaje ?? 0;
  const relleno = (largo * valor) / 100;
  return `
    <div class="anillo anillo-${nivel.color}" style="width:${tam}px;height:${tam}px">
      <svg viewBox="0 0 120 120" width="${tam}" height="${tam}" aria-hidden="true">
        <circle cx="60" cy="60" r="${r}" class="anillo-fondo"/>
        <circle cx="60" cy="60" r="${r}" class="anillo-valor"
          stroke-dasharray="${relleno} ${largo}" transform="rotate(-90 60 60)"/>
      </svg>
      <div class="anillo-texto">
        <strong>${puntaje ?? '—'}</strong><span>/100</span>
      </div>
    </div>`;
}

// Octógono negro al estilo de la Ley de Etiquetado Frontal
export function octogono(sello) {
  const nombre = sello.titulo.replace('Exceso en ', '').toUpperCase();
  return `
    <div class="octo" title="${esc(sello.detalle)}">
      <div class="octo-borde"><div class="octo-linea"><div class="octo-cuerpo">
        <small>EXCESO EN</small><b>${esc(nombre)}</b>
      </div></div></div>
      ${sello.estimado ? '<span class="octo-estimado">estimado</span>' : ''}
    </div>`;
}

export function leyenda(texto) {
  return `<div class="leyenda">${esc(texto)}</div>`;
}

export function aviso(texto, duracion = 3200) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = texto;
  el.classList.add('visible');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("visible"), duracion);
}

export function riesgoATipo(riesgo) {
  return { bajo: 'bien', moderado: 'ojo', alto: 'mal' }[riesgo] || 'gris';
}

export const TEXTO_RIESGO = { bajo: 'Riesgo bajo', moderado: 'Riesgo moderado', alto: 'Riesgo alto', desconocido: 'Sin información' };
