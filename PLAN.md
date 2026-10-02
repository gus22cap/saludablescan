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

## Etapa 1 — Escanear y analizar ✅

- [x] Crear la estructura del proyecto y el estilo general (fondo claro, verde, tarjetas redondeadas)
- [x] **Pantalla Escanear:** cámara con recuadro verde, botón de linterna y opción de tipear el código a mano
- [x] Buscar el producto en Open Food Facts y guardarlo en caché en el celular
- [x] **Formulario para cargar a mano** los productos que no aparezcan (nombre, marca, foto, tabla nutricional cada 100 g o ml, ingredientes)
- [x] Calcular los **octógonos de la Ley 27.642** (azúcares, grasas totales, grasas saturadas, sodio, calorías, edulcorantes, cafeína)
- [x] Calcular el **puntaje de 0 a 100** con semáforo
- [x] **Pantalla Resultado:** foto, nombre, anillo con el puntaje, octógonos, chips ✓ / ! / ✗, resumen y datos por porción
- [x] **Pantalla Ingredientes y aditivos:** pestañas Todos / Ingredientes / Aditivos, riesgo de cada aditivo y recuadro "¿Qué significa esto?"
- [x] Armar una lista inicial de aditivos comunes (código INS/E, nombre, riesgo y explicación simple)
- [x] Probar en la compu (WAMP → `http://localhost/saludablescan`)
- [x] Publicar en GitHub Pages y **probar en el celular** → https://gus22cap.github.io/saludablescan/

**Terminada cuando:** escaneás un producto del súper y ves su puntaje, sus octógonos y sus aditivos. Si no aparece, lo podés cargar a mano.

---

## Etapa 2 — Lo personal ✅

- [x] **Perfil** sin login: "cuido el azúcar", "cuido la sal", "evito edulcorantes", "evito el aspartamo", alergias e ingredientes a evitar
- [x] Puntaje personal ajustado según el perfil
- [x] **Alerta roja** si el producto tiene algo que marcaste para evitar
- [x] Aviso en el perfil: "La app es orientativa, no es consejo médico"
- [x] **Historial** de escaneos
- [x] **Favoritos**
- [x] Botón **Exportar / Importar copia de seguridad** (para no perder datos si cambiás de celular)

---

## Etapa 3 — Comparar ✅

- [x] Elegir 2 o 3 productos (del historial o de favoritos)
- [x] **Pantalla Comparar:** anillos de puntaje lado a lado y filas con ✓ / ! / ✗ (aspartamo, colorantes, conservantes), azúcar y calorías por porción
- [x] Botón "Ver detalle de cada producto"

---

## Etapa 4 — Pulir ✅

- [x] Que funcione sin internet con lo ya guardado (modo offline)
- [x] Ícono y pantalla de inicio de la app
- [x] Revisar textos, colores y tamaños en distintos celulares
- [x] Mostrar "sin información" cuando falte un dato, en vez de inventarlo

---

## Etapa 5 — Fotos del envase y lectura automática (para productos sin datos) ✅ (pasos 1 y 2)

Objetivo: ir armando nuestra propia base de productos en el celular, con el menor tipeo posible.

**Paso 1 — "Sacar foto ahora, completar después"**
- [x] En el súper: sacar foto de la tabla nutricional y de los ingredientes, y guardar el producto como **pendiente** (con nombre y marca de Precios Claros)
- [x] Lista de **pendientes** para completar en casa, viendo la foto en pantalla mientras se copian los números
- [x] Al escanear un producto pendiente, mostrar "Te falta completar este producto"

**Paso 2 — Que la app lea la foto sola**, gratis y sin servidor, con la librería **Tesseract** (lee texto de fotos dentro del celular)

- [x] Botón **"Leer ingredientes con la cámara"**: pasa el texto de la foto al campo de ingredientes (de ahí salen aditivos, edulcorantes, cafeína y si tiene azúcar, grasa o sal agregadas)
- [ ] ~~Botón "Leer tabla con la cámara"~~ → **se sacó**: con fotos reales (envases curvos, rayas, fondos de color) el lector gratuito no leyó ningún número. Queda como opción futura leerla con inteligencia artificial (paga, ~US$ 0,003 por foto con Claude Haiku 4.5, necesita un pequeño servidor)
- [x] El usuario siempre revisa y corrige antes de guardar
- [x] Consejos en pantalla para una buena foto (luz, sin reflejos, de frente)
- [x] Poder leer también las fotos de los productos pendientes que ya se guardaron

A tener en cuenta:
- Los **excesos (octógonos)** salen de la **tabla nutricional**, no de los ingredientes: hacen falta las dos fotos.
- Los ingredientes se leen bien; la tabla cuesta más (columnas, letra chica, envases curvos o brillantes).
- La primera vez descarga unos 5 MB; después queda guardado.
- Si no alcanza la precisión: leer la foto con inteligencia artificial es mucho más preciso, pero es pago y necesita servidor.

Esfuerzo estimado: paso 1 bajo, paso 2 medio.

(El paso 3, compartir, pasó a ser la Etapa 7.)

---

## Etapa 6 — Cosmética e higiene ⬅️ *próxima*

Que la app también analice shampoo, jabón, cremas, desodorantes, pasta dental, protector solar, etc. Hoy los reconoce como "no alimenticios" y no los analiza.

- [ ] Buscar el producto en **Open Beauty Facts** (la base hermana de Open Food Facts para cosmética, también gratis), con Precios Claros de respaldo para nombre y marca
- [ ] Analizar la **lista de ingredientes** (nombres INCI, los que figuran en el envase en inglés/latín: *Aqua, Sodium Laureth Sulfate, Parfum…*). En cosmética no hay tabla nutricional ni octógonos: todo sale de los ingredientes
- [ ] Lista inicial de ingredientes a tener en cuenta, con riesgo bajo / moderado / alto y explicación simple. Por ejemplo: parabenos, ftalatos, liberadores de formaldehído, triclosán, sulfatos (SLS/SLES), fragancia/perfume (alérgenos), alcohol desnaturalizado, siliconas, aceites minerales, filtros solares como la oxibenzona
- [ ] Puntaje 0–100 y semáforo propios de cosmética (sin octógonos), con la misma pantalla de resultado e ingredientes
- [ ] Perfil: sumar sensibilidades de piel (fragancias, sulfatos, parabenos, alcohol, etc.) con alerta roja
- [ ] Carga a mano: para cosmética solo nombre, marca, foto y lista de ingredientes (sin tabla nutricional)
- [ ] Historial, favoritos y comparar también con cosméticos (comparar solo productos del mismo tipo)
- [ ] Productos de **limpieza** (detergente, lavandina…): quedan afuera por ahora; la app sigue avisando que no los analiza

A verificar: criterios de riesgo de cada ingrediente con fuentes confiables (regulación de la Unión Europea, ANMAT). Igual que con alimentos, la app es orientativa y no reemplaza a un dermatólogo.

---

## Etapa 7 — Compartir solo lo que yo elija

Regla principal: **nada se comparte automáticamente**. Cada producto se comparte solo si el usuario lo decide, uno por uno.

- [ ] En los productos cargados a mano, botón **"Compartir este producto"**
- [ ] Antes de enviar, mostrar exactamente qué se va a compartir (nombre, marca, tabla, ingredientes, fotos) y poder destildar fotos o datos
- [ ] Destino: **Open Food Facts** (alimentos) u **Open Beauty Facts** (cosmética). Así, la próxima vez que alguien lo escanee, aparece solo
- [ ] Hace falta una cuenta gratis en Open Food Facts; los datos de la cuenta quedan guardados solo en el celular
- [ ] Marcar en la app cuáles ya se compartieron
- [ ] Nunca se comparten el perfil, las alergias, el historial ni los favoritos

---

## Para más adelante (no ahora)

Servidor propio y cuentas de usuario (la misma base en varios celulares), aportes de otros usuarios, reporte de errores, escaneo de menús, despensa con vencimientos, notificaciones y lectura de la tabla nutricional con inteligencia artificial.

---

## Criterios usados en la app

**Octógonos** (Decreto 151/2022, valores de la etapa final, perfil de la OPS). Se confirmaron con fuentes públicas, pero conviene compararlos con algunos envases reales:
- Azúcares añadidos: ≥ 10 % de las calorías
- Grasas totales: ≥ 30 % de las calorías
- Grasas saturadas: ≥ 10 % de las calorías
- Sodio: ≥ 1 mg por kcal, o ≥ 300 mg cada 100 g/ml (bebidas sin calorías: ≥ 40 mg cada 100 ml)
- Calorías: ≥ 275 kcal cada 100 g o ≥ 25 kcal cada 100 ml, y solo si además tiene exceso de azúcares o grasas
- Los sellos solo se ponen si al producto se le **agregó** azúcar, grasa o sal (se mira la lista de ingredientes). Si no hay ingredientes, se supone que sí y se avisa.
- Exceptuados por ley (sin octógonos): azúcar común, aceites vegetales, frutos secos y sal común de mesa. La app no muestra sellos, avisa que igual tienen excesos y su puntaje queda como máximo en "Regular"
- Si falta el dato de azúcares añadidos, se usan los totales y se marca "estimado".

**Puntaje** (empieza en 100):
- Octógonos: azúcares −20, grasas saturadas −15, sodio −15, grasas totales −10, calorías −10
- Contiene edulcorantes −8, cafeína −3
- Aditivos: riesgo alto −12 c/u, moderado −5 c/u (máximo −30 en total)
- Fibra ≥ 6 g +5 (≥ 3 g +3), proteínas ≥ 10 g +3
- Tope: con 1 o 2 octógonos, máximo 69 (nunca "buena opción"); con 3 o más, máximo 39
- Semáforo: 85+ muy buena · 70–84 buena · 40–69 regular · menos de 40 poco saludable

**Café** (casos que la ley no cubre):
- Torrado: resta hasta 40 puntos según el porcentaje (100 % torrado → 60, regular). Sin porcentaje: "torrado" = 100 %, "mezcla" = 50 %. Con algo de torrado, máximo 84 (nunca "muy buena")
- Primer ingrediente que no es café: −15 ("no es principalmente café")
- Achicoria, cebada, malta o cereales: −16
- Saborizantes o aromatizantes: −5
- Se muestran en una tarjeta amarilla "A tener en cuenta"

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
| 30/09/2026 | Se reconocen productos no alimenticios (higiene, limpieza) y se mejoró la pantalla de productos sin tabla nutricional |
| 30/09/2026 | Publicada en GitHub Pages y probada en el celular: funciona. **Próximo: comparar envases reales y seguir con la Etapa 2** |
| 01/10/2026 | Avisos especiales para café: torrado (según porcentaje), no es principalmente café, achicoria/cereales y saborizantes |
| 01/10/2026 | Etapa 2: barra de navegación, perfil (cuidados, cosas a evitar, alergias, ingredientes propios), alertas roja/amarilla, puntaje personal, historial, favoritos y copia de seguridad |
| 01/10/2026 | Etapa 3: comparar hasta 3 productos lado a lado (mejor opción, ✓/!/✗, valores por porción y cada 100 g con el mejor en verde). Se agrega desde el resultado o desde el historial |
| 01/10/2026 | Etapa 4: íconos PNG (Android e iPhone), fotos guardadas para ver sin internet, aviso de "sin internet", pantallas revisadas a 360 px, números con coma y "sin dato" cuando falta información. Las actualizaciones llegan al reabrir la app |
| 01/10/2026 | Etapa 5: fotos del envase guardadas como "pendientes" (Historial → Para completar), foto fija arriba del formulario con visor para acercar, y lectura automática de tabla e ingredientes con Tesseract (8 de 8 datos en fotos de prueba, también torcidas y borrosas) |
| 01/10/2026 | Probado con una foto real: la lectura de la tabla no sirve y se sacó. Formulario rediseñado como la tabla del envase (mismo orden, porción en g o ml, "Siguiente" pasa al renglón de abajo). Productos exceptuados por ley (aceites, azúcar, sal, frutos secos) sin octógonos y con aviso |
| 01/10/2026 | Próximos pasos definidos: Etapa 6 (cosmética e higiene) y Etapa 7 (compartir solo los productos que el usuario elija) |
