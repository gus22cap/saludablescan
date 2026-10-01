// Lectura de códigos de barras con la cámara.
// Usa el detector que trae el navegador (Chrome en Android) y, si no hay, la librería ZXing.
// Analiza la imagen en su tamaño original: así se leen también códigos chicos o algo lejanos.
/* global ZXing, BarcodeDetector */

const FORMATOS_NATIVOS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];

let flujo = null; // la cámara encendida
let temporizador = null;
let turno = 0; // cambia cada vez que se apaga: corta búsquedas viejas
let lectorZXing = null;
let detectorNativo; // undefined = todavía no averiguamos; null = no hay

async function obtenerDetectorNativo() {
  if (detectorNativo !== undefined) return detectorNativo;
  detectorNativo = null;
  try {
    if ('BarcodeDetector' in window) {
      const soportados = await BarcodeDetector.getSupportedFormats();
      const formatos = FORMATOS_NATIVOS.filter((f) => soportados.includes(f));
      if (formatos.length) detectorNativo = new BarcodeDetector({ formats: formatos });
    }
  } catch { /* sin detector nativo */ }
  return detectorNativo;
}

function obtenerLectorZXing() {
  if (!lectorZXing) {
    const pistas = new Map();
    pistas.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
      ZXing.BarcodeFormat.EAN_13, ZXing.BarcodeFormat.EAN_8, ZXing.BarcodeFormat.UPC_A, ZXing.BarcodeFormat.UPC_E,
    ]);
    pistas.set(ZXing.DecodeHintType.TRY_HARDER, true);
    lectorZXing = new ZXing.MultiFormatReader();
    lectorZXing.setHints(pistas);
  }
  return lectorZXing;
}

// Busca un código en un canvas. "metodo" alterna dos formas de pasar la imagen a blanco y negro.
function decodificarConZXing(canvas, metodo = 0) {
  const lector = obtenerLectorZXing();
  try {
    const fuente = new ZXing.HTMLCanvasElementLuminanceSource(canvas);
    const binarizador = metodo === 0 ? new ZXing.HybridBinarizer(fuente) : new ZXing.GlobalHistogramBinarizer(fuente);
    return lector.decode(new ZXing.BinaryBitmap(binarizador)).getText();
  } catch {
    return null;
  } finally {
    lector.reset();
  }
}

async function decodificar(canvas, metodo) {
  const nativo = await obtenerDetectorNativo();
  if (nativo) {
    try {
      const encontrados = await nativo.detect(canvas);
      if (encontrados.length) return encontrados[0].rawValue;
    } catch { /* probamos con ZXing */ }
  }
  return decodificarConZXing(canvas, metodo);
}

const esCodigoDeProducto = (texto) => /^\d{8,14}$/.test(texto || '');

// Copia al canvas la parte central de la imagen. Si "vertical", toma una franja alta
// y la gira 90° para que un código parado quede acostado (ZXing solo lee acostados).
function dibujarRecorte(ctx, canvas, origen, ancho, alto, vertical) {
  const recorteAncho = Math.round(ancho * (vertical ? 0.6 : 0.9));
  const recorteAlto = Math.round(alto * (vertical ? 0.9 : 0.6));
  const x = (ancho - recorteAncho) / 2;
  const y = (alto - recorteAlto) / 2;
  if (vertical) {
    canvas.width = recorteAlto;
    canvas.height = recorteAncho;
    ctx.setTransform(0, 1, -1, 0, recorteAlto, 0); // giro de 90° a la derecha
  } else {
    canvas.width = recorteAncho;
    canvas.height = recorteAlto;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  ctx.drawImage(origen, x, y, recorteAncho, recorteAlto, 0, 0, recorteAncho, recorteAlto);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

export async function iniciarEscaner(idElemento, alLeer) {
  await detenerEscaner();
  const miTurno = turno;

  const nuevoFlujo = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
  });
  if (miTurno !== turno) {
    nuevoFlujo.getTracks().forEach((t) => t.stop());
    return;
  }
  flujo = nuevoFlujo;

  // Enfoque automático continuo, si la cámara lo permite
  const pista = flujo.getVideoTracks()[0];
  try {
    const capacidades = pista.getCapabilities ? pista.getCapabilities() : {};
    if (capacidades.focusMode && capacidades.focusMode.includes('continuous')) {
      await pista.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
    }
  } catch { /* no se pudo, seguimos igual */ }

  const video = document.createElement('video');
  video.setAttribute('playsinline', '');
  video.muted = true;
  video.srcObject = flujo;
  document.getElementById(idElemento).replaceChildren(video);
  await video.play();

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const hayNativo = !!(await obtenerDetectorNativo());
  let cuadro = 0;

  const buscar = async () => {
    if (miTurno !== turno) return;
    if (video.readyState >= 2 && video.videoWidth) {
      // Analizamos la parte central de la imagen sin achicarla.
      // Con ZXing alternamos: código horizontal / código vertical (imagen girada 90°).
      // El detector del navegador ya lee en cualquier posición, así que no hace falta girar.
      const vertical = !hayNativo && cuadro % 2 === 1;
      const metodo = Math.floor(cuadro / 2) % 2;
      cuadro++;
      dibujarRecorte(ctx, canvas, video, video.videoWidth, video.videoHeight, vertical);
      const texto = await decodificar(canvas, metodo);
      if (miTurno !== turno) return;
      if (esCodigoDeProducto(texto)) {
        turno++; // deja de buscar
        alLeer(texto);
        return;
      }
    }
    temporizador = setTimeout(buscar, 100);
  };
  buscar();
}

export async function detenerEscaner() {
  turno++;
  clearTimeout(temporizador);
  if (flujo) {
    flujo.getTracks().forEach((t) => t.stop());
    flujo = null;
  }
}

// Prende o apaga la linterna. Devuelve false si el celular no lo permite.
export async function linterna(prender) {
  const pista = flujo && flujo.getVideoTracks()[0];
  if (!pista) return false;
  try {
    const capacidades = pista.getCapabilities ? pista.getCapabilities() : {};
    if (!capacidades.torch) return false;
    await pista.applyConstraints({ advanced: [{ torch: prender }] });
    return true;
  } catch {
    return false;
  }
}

// Lee un código de barras desde una foto de la galería.
export async function leerDesdeFoto(archivo) {
  const imagen = await createImageBitmap(archivo);
  const escala = Math.min(1, 2000 / Math.max(imagen.width, imagen.height));
  // Primero pasamos la foto (achicada si es enorme) a un canvas
  const foto = document.createElement('canvas');
  foto.width = Math.round(imagen.width * escala);
  foto.height = Math.round(imagen.height * escala);
  foto.getContext('2d').drawImage(imagen, 0, 0, foto.width, foto.height);
  // Probamos con la foto entera, acostada y girada (por si el código está parado)
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  for (const vertical of [false, true]) {
    for (const metodo of [0, 1]) {
      if (vertical) {
        canvas.width = foto.height;
        canvas.height = foto.width;
        ctx.setTransform(0, 1, -1, 0, foto.height, 0);
      } else {
        canvas.width = foto.width;
        canvas.height = foto.height;
      }
      ctx.drawImage(foto, 0, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const texto = await decodificar(canvas, metodo);
      if (esCodigoDeProducto(texto)) return texto;
    }
  }
  throw new Error('sin código');
}
