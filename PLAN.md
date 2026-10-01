# SaludableScan — Plan de trabajo

App web (PWA) para el celular: escaneás el código de barras de un alimento o bebida y te muestra qué tan saludable es.

Vamos **etapa por etapa**. No se pasa a la siguiente hasta probar la anterior en el celular.

---

## Tecnología elegida

| Qué | Con qué | Por qué |
|---|---|---|
| La app | HTML + CSS + JavaScript | Simple, sin servidor, se abre en el navegador del celular |
| Leer el código de barras | Detector del navegador (Android) o librería ZXing | Gratis. Analiza la imagen en tamaño completo, así lee códigos chicos o lejanos |
| Datos de los productos | API de Open Food Facts + Precios Claros (respaldo) | Gratis. Precios Claros tiene casi todo el súper argentino, pero solo nombre, marca y tamaño |
| Datos del usuario | IndexedDB (con la librería Dexie) | Base de datos que ya trae el navegador. Funciona sin internet |
| Instalarla en el celular | PWA | Queda con ícono en la pantalla de inicio, como una app |
| Publicarla con https | GitHub Pages o Netlify (gratis) | La cámara del celular solo anda con https |

**Descartado por ahora:** SQLite o MySQL (necesitan un servidor o la PC prendida), reconocimiento por foto (necesita IA paga), apps nativas (Flutter o React Native).

---

## Etapa 1 — Escanear y analizar ⬅️ *en prueba*

- [x] Crear la estructura del proyecto y el estilo general (fondo claro, verde, tarjetas redondeadas)
- [x] **Pantalla Escanear:** cámara con recuadro verde, botón de linterna y opción de tipear el código a mano
- [x] Buscar el producto en Open Food Facts y guardarlo en caché en el celular
- [x] **Formulario para cargar a mano** los productos que no aparezcan (nombre, marca, foto, tabla nutricional cada 100 g o ml, ingredientes)
- [x] Calcular los **octógonos de la Ley 27.642** (azúcares, grasas totales, grasas saturadas, sodio, calorías, edulcorantes, cafeína)
- [x] Calcular el **puntaje de 0 a 100** con semáforo
- [x] **Pantalla Resultado:** foto, nombre, anillo con el puntaje, octógonos, chips ✓ / ! / ✗, resumen y datos por porción
- [x] **Pantalla Ingredientes y aditivos:** pestañas Todos / Ingredientes / Aditivos, riesgo de cada aditivo y recuadro "¿Qué significa esto?"
- [x] Armar una lista inicial de aditivos comunes (código INS/E, nombre, riesgo y explicación simple)
- [ ] Probar en la compu (WAMP → `http://localhost/saludablescan`)
- [ ] Publicar en Netlify o GitHub Pages y **probar en el celular** con productos reales

**Terminada cuando:** escaneás un producto del súper y ves su puntaje, sus octógonos y sus aditivos. Si no aparece, lo podés cargar a mano.

---

## Etapa 2 — Lo personal

- [ ] **Perfil** sin login: "cuido el azúcar", "cuido la sal", "evito edulcorantes", "evito el aspartamo", alergias e ingredientes a evitar
- [ ] Puntaje personal ajustado según el perfil
- [ ] **Alerta roja** si el producto tiene algo que marcaste para evitar
- [ ] Aviso en el perfil: "La app es orientativa, no es consejo médico"
- [ ] **Historial** de escaneos
- [ ] **Favoritos**
- [ ] Botón **Exportar / Importar copia de seguridad** (para no perder datos si cambiás de celular)

---

## Etapa 3 — Comparar

- [ ] Elegir 2 o 3 productos (del historial o de favoritos)
- [ ] **Pantalla Comparar:** anillos de puntaje lado a lado y filas con ✓ / ! / ✗ (aspartamo, colorantes, conservantes), azúcar y calorías por porción
- [ ] Botón "Ver detalle de cada producto"

---

## Etapa 4 — Pulir

- [ ] Que funcione sin internet con lo ya guardado (modo offline)
- [ ] Ícono y pantalla de inicio de la app
- [ ] Revisar textos, colores y tamaños en distintos celulares
- [ ] Mostrar "sin información" cuando falte un dato, en vez de inventarlo

---

## Etapa 5 — Fotos del envase y lectura automática (para productos sin datos)

Objetivo: ir armando nuestra propia base de productos en el celular, con el menor tipeo posible.

**Paso 1 — "Sacar foto ahora, completar después"**
- [ ] En el súper: sacar foto de la tabla nutricional y de los ingredientes, y guardar el producto como **pendiente** (con nombre y marca de Precios Claros)
- [ ] Lista de **pendientes** para completar en casa, viendo la foto en pantalla mientras se copian los números
- [ ] Al escanear un producto pendiente, mostrar "Te falta completar este producto"

**Paso 2 — Que la app lea la foto sola**, gratis y sin servidor, con la librería **Tesseract** (lee texto de fotos dentro del celular)

- [ ] Botón **"Leer ingredientes con la cámara"**: pasa el texto de la foto al campo de ingredientes (de ahí salen aditivos, edulcorantes, cafeína y si tiene azúcar, grasa o sal agregadas)
- [ ] Botón **"Leer tabla con la cámara"**: intenta reconocer calorías, azúcares, grasas, saturadas, sodio, fibra, proteínas y la porción
- [ ] El usuario siempre revisa y corrige antes de guardar
- [ ] Consejos en pantalla para una buena foto (luz, sin reflejos, de frente)
- [ ] Poder leer también las fotos de los productos pendientes que ya se guardaron

A tener en cuenta:
- Los **excesos (octógonos)** salen de la **tabla nutricional**, no de los ingredientes: hacen falta las dos fotos.
- Los ingredientes se leen bien; la tabla cuesta más (columnas, letra chica, envases curvos o brillantes).
- La primera vez descarga unos 5 MB; después queda guardado.
- Si no alcanza la precisión: leer la foto con inteligencia artificial es mucho más preciso, pero es pago y necesita servidor.

Esfuerzo estimado: paso 1 bajo, paso 2 medio.

**Paso 3 (opcional) — Compartir lo que cargamos**
- [ ] Subir a **Open Food Facts** los productos que cargamos (base colaborativa y gratuita: así le sirven a todos y la próxima vez el producto aparece solo). Requiere una cuenta gratis en Open Food Facts.
- [ ] Más adelante, con servidor propio: tener la misma base en varios celulares o compartirla con otras personas.

---

## Para más adelante (no ahora)

Cosméticos e higiene (Open Beauty Facts), servidor propio y cuentas de usuario, aportes de otros usuarios, reporte de errores, escaneo de menús, despensa con vencimientos y notificaciones.

---

## Criterios usados en la app

**Octógonos** (Decreto 151/2022, valores de la etapa final, perfil de la OPS). Se confirmaron con fuentes públicas, pero conviene compararlos con algunos envases reales:
- Azúcares añadidos: ≥ 10 % de las calorías
- Grasas totales: ≥ 30 % de las calorías
- Grasas saturadas: ≥ 10 % de las calorías
- Sodio: ≥ 1 mg por kcal, o ≥ 300 mg cada 100 g/ml (bebidas sin calorías: ≥ 40 mg cada 100 ml)
- Calorías: ≥ 275 kcal cada 100 g o ≥ 25 kcal cada 100 ml, y solo si además tiene exceso de azúcares o grasas
- Los sellos solo se ponen si al producto se le **agregó** azúcar, grasa o sal (se mira la lista de ingredientes). Si no hay ingredientes, se supone que sí y se avisa.
- Si falta el dato de azúcares añadidos, se usan los totales y se marca "estimado".

**Puntaje** (empieza en 100):
- Octógonos: azúcares −20, grasas saturadas −15, sodio −15, grasas totales −10, calorías −10
- Contiene edulcorantes −8, cafeína −3
- Aditivos: riesgo alto −12 c/u, moderado −5 c/u (máximo −30 en total)
- Fibra ≥ 6 g +5 (≥ 3 g +3), proteínas ≥ 10 g +3
- Tope: con 1 o 2 octógonos, máximo 69 (nunca "buena opción"); con 3 o más, máximo 39
- Semáforo: 85+ muy buena · 70–84 buena · 40–69 regular · menos de 40 poco saludable

## Pendientes a verificar

- [x] Valores de los octógonos (ver arriba)
- [ ] Comparar 5 o 6 envases reales con lo que calcula la app
- [ ] Revisar los niveles de riesgo de la lista de aditivos ([js/aditivos.js](js/aditivos.js))

---

## Registro de avances

| Fecha | Qué se hizo |
|---|---|
| 30/09/2026 | Se definió el enfoque (app web + código de barras + IndexedDB) y se armó este plan |
| 30/09/2026 | Etapa 1 programada: escáner, búsqueda, octógonos, puntaje, ingredientes/aditivos y carga manual. Probado con Coca-Cola, Coca Zero, Oreo y Bon o Bon. Falta probar en el celular |
| 30/09/2026 | La cámara ya no se prende sola. Se cambió el lector de códigos (el anterior achicaba la imagen y no leía códigos chicos) |
| 30/09/2026 | Si Open Food Facts no tiene el producto, se busca en Precios Claros (nombre, marca y tamaño) y se completa el formulario solo |
