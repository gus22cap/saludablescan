// Lista de aditivos comunes (código INS / E).
// r = riesgo orientativo: 'bajo' | 'moderado' | 'alto'
// a = otros nombres con los que aparece en las etiquetas (en minúscula y sin tildes)
// Es una guía simple, no un dictamen médico.

export const ADITIVOS = {
  // Colorantes
  e100: { n: 'Curcumina', f: 'colorante', r: 'bajo', x: 'Colorante amarillo que sale de la cúrcuma. Se considera seguro.', a: ['curcumina'] },
  e101: { n: 'Riboflavina (vitamina B2)', f: 'colorante', r: 'bajo', x: 'Es una vitamina usada como colorante amarillo. Segura.', a: ['riboflavina'] },
  e102: { n: 'Tartrazina', f: 'colorante', r: 'moderado', x: 'Colorante artificial amarillo. Puede causar reacciones en personas sensibles y se asoció con hiperactividad en chicos.', a: ['tartrazina'] },
  e104: { n: 'Amarillo de quinoleína', f: 'colorante', r: 'moderado', x: 'Colorante artificial. Se asoció con hiperactividad en chicos.', a: ['amarillo de quinoleina'] },
  e110: { n: 'Amarillo ocaso', f: 'colorante', r: 'moderado', x: 'Colorante artificial naranja. Puede causar reacciones en personas sensibles y se asoció con hiperactividad en chicos.', a: ['amarillo ocaso', 'amarillo sunset'] },
  e120: { n: 'Carmín (cochinilla)', f: 'colorante', r: 'moderado', x: 'Colorante rojo que se obtiene de un insecto. Puede causar alergias en personas sensibles.', a: ['carmin', 'cochinilla', 'acido carminico'] },
  e122: { n: 'Azorrubina', f: 'colorante', r: 'moderado', x: 'Colorante artificial rojo. Se asoció con hiperactividad en chicos.', a: ['azorrubina', 'carmoisina'] },
  e124: { n: 'Rojo Ponceau 4R', f: 'colorante', r: 'moderado', x: 'Colorante artificial rojo. Se asoció con hiperactividad en chicos.', a: ['ponceau', 'rojo punzo'] },
  e127: { n: 'Eritrosina', f: 'colorante', r: 'moderado', x: 'Colorante artificial rosado con uso muy limitado en varios países.', a: ['eritrosina'] },
  e129: { n: 'Rojo allura', f: 'colorante', r: 'moderado', x: 'Colorante artificial rojo. Se asoció con hiperactividad en chicos.', a: ['rojo allura', 'rojo 40'] },
  e131: { n: 'Azul patente V', f: 'colorante', r: 'moderado', x: 'Colorante artificial azul. Puede causar reacciones alérgicas poco frecuentes.', a: ['azul patente'] },
  e132: { n: 'Índigo carmín', f: 'colorante', r: 'bajo', x: 'Colorante artificial azul. En las dosis permitidas se considera seguro.', a: ['indigotina', 'indigo carmin'] },
  e133: { n: 'Azul brillante', f: 'colorante', r: 'bajo', x: 'Colorante artificial azul. En las dosis permitidas se considera seguro.', a: ['azul brillante'] },
  e140: { n: 'Clorofila', f: 'colorante', r: 'bajo', x: 'Colorante verde natural de las plantas. Seguro.', a: ['clorofila'] },
  e141: { n: 'Clorofila cúprica', f: 'colorante', r: 'bajo', x: 'Colorante verde derivado de la clorofila. Seguro en dosis permitidas.', a: ['clorofilina'] },
  e150: { n: 'Colorante caramelo', f: 'colorante', r: 'bajo', x: 'Da color marrón. Algunos tipos (caramelo III y IV) generan un compuesto bajo estudio.', a: ['colorante caramelo'] },
  e150a: { n: 'Caramelo I (simple)', f: 'colorante', r: 'bajo', x: 'Azúcar tostada usada para dar color marrón. Seguro.', a: ['caramelo i'] },
  e150c: { n: 'Caramelo III (amónico)', f: 'colorante', r: 'moderado', x: 'Colorante marrón que puede contener 4-MEI, un compuesto bajo estudio por sus posibles efectos.', a: ['caramelo iii'] },
  e150d: { n: 'Caramelo IV (sulfito amónico)', f: 'colorante', r: 'moderado', x: 'Colorante marrón típico de las gaseosas cola. Puede contener 4-MEI, un compuesto bajo estudio.', a: ['caramelo iv'] },
  e151: { n: 'Negro brillante', f: 'colorante', r: 'moderado', x: 'Colorante artificial. Puede causar reacciones en personas sensibles.', a: ['negro brillante'] },
  e153: { n: 'Carbón vegetal', f: 'colorante', r: 'bajo', x: 'Colorante negro de origen vegetal.', a: ['carbon vegetal'] },
  e155: { n: 'Marrón HT', f: 'colorante', r: 'moderado', x: 'Colorante artificial marrón. Puede causar reacciones en personas sensibles.', a: ['marron ht'] },
  e160a: { n: 'Betacaroteno', f: 'colorante', r: 'bajo', x: 'Colorante naranja natural (el de la zanahoria). Seguro.', a: ['betacaroteno', 'beta caroteno'] },
  e160b: { n: 'Annatto (urucú)', f: 'colorante', r: 'bajo', x: 'Colorante natural anaranjado. Rara vez causa alergias.', a: ['annatto', 'urucu', 'bixina'] },
  e160c: { n: 'Extracto de pimentón', f: 'colorante', r: 'bajo', x: 'Colorante natural rojo del pimentón. Seguro.', a: ['paprika', 'extracto de pimenton'] },
  e162: { n: 'Rojo de remolacha', f: 'colorante', r: 'bajo', x: 'Colorante natural de la remolacha. Seguro.', a: ['rojo de remolacha', 'betanina'] },
  e163: { n: 'Antocianinas', f: 'colorante', r: 'bajo', x: 'Colorante natural de frutas y verduras violetas. Seguro.', a: ['antocianinas'] },
  e171: { n: 'Dióxido de titanio', f: 'colorante', r: 'alto', x: 'Colorante blanco prohibido como aditivo en la Unión Europea desde 2022 porque no se pudo descartar que dañe el ADN.', a: ['dioxido de titanio'] },

  // Conservantes
  e200: { n: 'Ácido sórbico', f: 'conservante', r: 'bajo', x: 'Evita hongos y levaduras. Generalmente seguro en las dosis permitidas.', a: ['acido sorbico'] },
  e202: { n: 'Sorbato de potasio', f: 'conservante', r: 'bajo', x: 'Evita hongos y levaduras. Generalmente seguro en las dosis permitidas.', a: ['sorbato de potasio'] },
  e210: { n: 'Ácido benzoico', f: 'conservante', r: 'moderado', x: 'Conservante. Puede causar reacciones en personas sensibles o asmáticas.', a: ['acido benzoico'] },
  e211: { n: 'Benzoato de sodio', f: 'conservante', r: 'moderado', x: 'Conservante. Junto con vitamina C puede formar pequeñas cantidades de benceno. Puede causar reacciones en personas sensibles.', a: ['benzoato de sodio'] },
  e212: { n: 'Benzoato de potasio', f: 'conservante', r: 'moderado', x: 'Conservante parecido al benzoato de sodio.', a: ['benzoato de potasio'] },
  e220: { n: 'Dióxido de azufre', f: 'conservante', r: 'moderado', x: 'Sulfito. Puede causar reacciones en personas asmáticas o sensibles.', a: ['dioxido de azufre', 'anhidrido sulfuroso'] },
  e221: { n: 'Sulfito de sodio', f: 'conservante', r: 'moderado', x: 'Sulfito. Puede causar reacciones en personas asmáticas o sensibles.', a: ['sulfito de sodio'] },
  e223: { n: 'Metabisulfito de sodio', f: 'conservante', r: 'moderado', x: 'Sulfito. Puede causar reacciones en personas asmáticas o sensibles.', a: ['metabisulfito de sodio'] },
  e224: { n: 'Metabisulfito de potasio', f: 'conservante', r: 'moderado', x: 'Sulfito. Puede causar reacciones en personas asmáticas o sensibles.', a: ['metabisulfito de potasio'] },
  e249: { n: 'Nitrito de potasio', f: 'conservante', r: 'alto', x: 'Se usa en fiambres y embutidos. Puede formar nitrosaminas, compuestos asociados a mayor riesgo de cáncer.', a: ['nitrito de potasio'] },
  e250: { n: 'Nitrito de sodio', f: 'conservante', r: 'alto', x: 'Se usa en fiambres y embutidos. Puede formar nitrosaminas, compuestos asociados a mayor riesgo de cáncer.', a: ['nitrito de sodio'] },
  e251: { n: 'Nitrato de sodio', f: 'conservante', r: 'moderado', x: 'Se usa en fiambres. En el cuerpo puede transformarse en nitrito.', a: ['nitrato de sodio'] },
  e252: { n: 'Nitrato de potasio', f: 'conservante', r: 'moderado', x: 'Se usa en fiambres. En el cuerpo puede transformarse en nitrito.', a: ['nitrato de potasio'] },
  e260: { n: 'Ácido acético', f: 'acidulante', r: 'bajo', x: 'Es el ácido del vinagre. Seguro.', a: ['acido acetico'] },
  e270: { n: 'Ácido láctico', f: 'acidulante', r: 'bajo', x: 'Ácido natural presente en los fermentados. Seguro.', a: ['acido lactico'] },
  e280: { n: 'Ácido propiónico', f: 'conservante', r: 'bajo', x: 'Evita hongos en el pan. Generalmente seguro.', a: ['acido propionico'] },
  e281: { n: 'Propionato de sodio', f: 'conservante', r: 'bajo', x: 'Evita hongos en el pan. Generalmente seguro.', a: ['propionato de sodio'] },
  e282: { n: 'Propionato de calcio', f: 'conservante', r: 'bajo', x: 'Evita hongos en el pan. Generalmente seguro.', a: ['propionato de calcio'] },
  e290: { n: 'Dióxido de carbono', f: 'gasificante', r: 'bajo', x: 'Es el gas de las bebidas con gas. Seguro.', a: ['dioxido de carbono', 'gas carbonico'] },

  // Antioxidantes y acidulantes
  e296: { n: 'Ácido málico', f: 'acidulante', r: 'bajo', x: 'Ácido natural de las frutas. Seguro.', a: ['acido malico'] },
  e300: { n: 'Ácido ascórbico (vitamina C)', f: 'antioxidante', r: 'bajo', x: 'Es vitamina C. Evita que el producto se oxide. Seguro.', a: ['acido ascorbico'] },
  e301: { n: 'Ascorbato de sodio', f: 'antioxidante', r: 'bajo', x: 'Forma de vitamina C. Seguro.', a: ['ascorbato de sodio'] },
  e306: { n: 'Tocoferoles (vitamina E)', f: 'antioxidante', r: 'bajo', x: 'Es vitamina E. Evita que las grasas se pongan rancias. Seguro.', a: ['tocoferoles', 'tocoferol'] },
  e307: { n: 'Alfa-tocoferol', f: 'antioxidante', r: 'bajo', x: 'Es vitamina E. Seguro.', a: ['alfa tocoferol'] },
  e319: { n: 'TBHQ', f: 'antioxidante', r: 'moderado', x: 'Antioxidante sintético para aceites. En dosis altas genera dudas; mejor no abusar.', a: ['tbhq', 'terbutilhidroquinona'] },
  e320: { n: 'BHA', f: 'antioxidante', r: 'moderado', x: 'Antioxidante sintético clasificado como "posible cancerígeno" en dosis altas.', a: ['bha', 'butilhidroxianisol'] },
  e321: { n: 'BHT', f: 'antioxidante', r: 'moderado', x: 'Antioxidante sintético con estudios contradictorios. Mejor no abusar.', a: ['bht', 'butilhidroxitolueno'] },
  e322: { n: 'Lecitina', f: 'emulsionante', r: 'bajo', x: 'Suele venir de la soja o el girasol. Ayuda a mezclar agua y grasa. Segura.', a: ['lecitina', 'lecitina de soja', 'lecitina de girasol'] },
  e325: { n: 'Lactato de sodio', f: 'regulador de acidez', r: 'bajo', x: 'Regula la acidez. Seguro, aunque aporta algo de sodio.', a: ['lactato de sodio'] },
  e330: { n: 'Ácido cítrico', f: 'acidulante', r: 'bajo', x: 'Es el ácido del limón. Muy común y seguro.', a: ['acido citrico'] },
  e331: { n: 'Citrato de sodio', f: 'regulador de acidez', r: 'bajo', x: 'Regula la acidez. Seguro.', a: ['citrato de sodio'] },
  e332: { n: 'Citrato de potasio', f: 'regulador de acidez', r: 'bajo', x: 'Regula la acidez. Seguro.', a: ['citrato de potasio'] },
  e334: { n: 'Ácido tartárico', f: 'acidulante', r: 'bajo', x: 'Ácido natural de la uva. Seguro.', a: ['acido tartarico'] },
  e338: { n: 'Ácido fosfórico', f: 'acidulante', r: 'moderado', x: 'Típico de las gaseosas cola. Consumido seguido en exceso puede afectar dientes y huesos.', a: ['acido fosforico'] },
  e339: { n: 'Fosfatos de sodio', f: 'regulador de acidez', r: 'bajo', x: 'Regulan la acidez y la textura. El exceso de fosfatos no es recomendable para personas con problemas renales.', a: ['fosfato de sodio', 'fosfato disodico', 'fosfato monosodico'] },
  e340: { n: 'Fosfatos de potasio', f: 'regulador de acidez', r: 'bajo', x: 'Regulan la acidez. El exceso de fosfatos no es recomendable para personas con problemas renales.', a: ['fosfato de potasio', 'fosfato dipotasico'] },
  e341: { n: 'Fosfatos de calcio', f: 'regulador de acidez', r: 'bajo', x: 'Regulan la acidez y aportan calcio. Seguros.', a: ['fosfato de calcio', 'fosfato tricalcico'] },
  e385: { n: 'EDTA', f: 'secuestrante', r: 'bajo', x: 'Ayuda a conservar el color y el sabor. Seguro en dosis permitidas.', a: ['edta'] },

  // Espesantes, gelificantes, estabilizantes
  e400: { n: 'Ácido algínico', f: 'espesante', r: 'bajo', x: 'Viene de algas. Espesa. Seguro.', a: ['acido alginico'] },
  e401: { n: 'Alginato de sodio', f: 'espesante', r: 'bajo', x: 'Viene de algas. Espesa. Seguro.', a: ['alginato de sodio'] },
  e406: { n: 'Agar-agar', f: 'gelificante', r: 'bajo', x: 'Gelificante que viene de algas. Seguro.', a: ['agar agar', 'agar'] },
  e407: { n: 'Carragenina', f: 'espesante', r: 'moderado', x: 'Espesante de algas. Algunos estudios lo asocian a irritación intestinal; en dosis normales se considera aceptable.', a: ['carragenina', 'carragenano', 'carragenina'] },
  e410: { n: 'Goma garrofín', f: 'espesante', r: 'bajo', x: 'Espesante natural de la algarroba. Seguro.', a: ['goma garrofin', 'goma de algarrobo', 'goma algarroba'] },
  e412: { n: 'Goma guar', f: 'espesante', r: 'bajo', x: 'Espesante natural de una semilla. Seguro.', a: ['goma guar'] },
  e414: { n: 'Goma arábiga', f: 'espesante', r: 'bajo', x: 'Espesante natural de la acacia. Seguro.', a: ['goma arabiga', 'goma acacia'] },
  e415: { n: 'Goma xántica', f: 'espesante', r: 'bajo', x: 'Espesante que se obtiene por fermentación. Seguro.', a: ['goma xantica', 'goma xantan', 'xantana'] },
  e418: { n: 'Goma gellan', f: 'espesante', r: 'bajo', x: 'Espesante que se obtiene por fermentación. Seguro.', a: ['goma gellan'] },
  e420: { n: 'Sorbitol', f: 'edulcorante', r: 'bajo', x: 'Edulcorante tipo poliol. En cantidad puede tener efecto laxante.', a: ['sorbitol'] },
  e421: { n: 'Manitol', f: 'edulcorante', r: 'bajo', x: 'Edulcorante tipo poliol. En cantidad puede tener efecto laxante.', a: ['manitol'] },
  e422: { n: 'Glicerol', f: 'humectante', r: 'bajo', x: 'Mantiene la humedad. Seguro.', a: ['glicerina', 'glicerol'] },
  e433: { n: 'Polisorbato 80', f: 'emulsionante', r: 'moderado', x: 'Emulsionante sintético. Estudios en animales lo asocian a alteraciones de la flora intestinal.', a: ['polisorbato 80'] },
  e440: { n: 'Pectina', f: 'gelificante', r: 'bajo', x: 'Fibra natural de las frutas que gelifica. Segura.', a: ['pectina'] },
  e450: { n: 'Difosfatos', f: 'regulador de acidez', r: 'bajo', x: 'Leudantes y estabilizantes. El exceso de fosfatos no es recomendable para personas con problemas renales.', a: ['pirofosfato', 'difosfato'] },
  e451: { n: 'Trifosfatos', f: 'estabilizante', r: 'moderado', x: 'Muy usados en fiambres para retener agua. El exceso de fosfatos no es recomendable.', a: ['tripolifosfato', 'trifosfato'] },
  e452: { n: 'Polifosfatos', f: 'estabilizante', r: 'moderado', x: 'Muy usados en fiambres para retener agua. El exceso de fosfatos no es recomendable.', a: ['polifosfato', 'hexametafosfato'] },
  e460: { n: 'Celulosa', f: 'espesante', r: 'bajo', x: 'Fibra vegetal. Segura.', a: ['celulosa microcristalina'] },
  e461: { n: 'Metilcelulosa', f: 'espesante', r: 'bajo', x: 'Derivado de la celulosa. Seguro.', a: ['metilcelulosa'] },
  e466: { n: 'Carboximetilcelulosa', f: 'espesante', r: 'moderado', x: 'Espesante sintético. Estudios en animales lo asocian a alteraciones de la flora intestinal.', a: ['carboximetilcelulosa', 'cmc'] },
  e471: { n: 'Mono y diglicéridos de ácidos grasos', f: 'emulsionante', r: 'bajo', x: 'Emulsionante muy común. Ayuda a mezclar agua y grasa.', a: ['mono y digliceridos', 'monogliceridos'] },
  e472e: { n: 'Ésteres de ácido diacetiltartárico', f: 'emulsionante', r: 'bajo', x: 'Emulsionante usado en panificados. Seguro.', a: ['datem'] },
  e476: { n: 'Polirricinoleato de poliglicerol', f: 'emulsionante', r: 'bajo', x: 'Emulsionante usado en chocolates. Seguro en dosis permitidas.', a: ['polirricinoleato', 'pgpr'] },
  e481: { n: 'Estearoil lactilato de sodio', f: 'emulsionante', r: 'bajo', x: 'Mejora la masa del pan. Seguro.', a: ['estearoil lactilato de sodio'] },
  e491: { n: 'Monoestearato de sorbitán', f: 'emulsionante', r: 'bajo', x: 'Emulsionante. Seguro en dosis permitidas.', a: ['monoestearato de sorbitan'] },
  e492: { n: 'Triestearato de sorbitán', f: 'emulsionante', r: 'bajo', x: 'Emulsionante usado en chocolates y coberturas. Seguro en dosis permitidas.', a: ['triestearato de sorbitan'] },
  e500: { n: 'Bicarbonato de sodio', f: 'leudante', r: 'bajo', x: 'Leudante común. Aporta algo de sodio.', a: ['bicarbonato de sodio', 'carbonato de sodio'] },
  e501: { n: 'Carbonato de potasio', f: 'leudante', r: 'bajo', x: 'Regulador de acidez. Seguro.', a: ['carbonato de potasio'] },
  e503: { n: 'Carbonato de amonio', f: 'leudante', r: 'bajo', x: 'Leudante de galletitas. Se evapora al hornear. Seguro.', a: ['bicarbonato de amonio', 'carbonato de amonio'] },
  e509: { n: 'Cloruro de calcio', f: 'estabilizante', r: 'bajo', x: 'Da firmeza. Seguro.', a: ['cloruro de calcio'] },
  e551: { n: 'Dióxido de silicio', f: 'antiaglutinante', r: 'bajo', x: 'Evita que los polvos se apelmacen. Seguro.', a: ['dioxido de silicio'] },

  // Resaltadores de sabor
  e621: { n: 'Glutamato monosódico', f: 'resaltador de sabor', r: 'bajo', x: 'Realza el sabor. Se considera seguro, pero aporta sodio y algunas personas dicen ser sensibles.', a: ['glutamato monosodico'] },
  e627: { n: 'Guanilato disódico', f: 'resaltador de sabor', r: 'bajo', x: 'Realza el sabor. Suele acompañar al glutamato.', a: ['guanilato disodico'] },
  e631: { n: 'Inosinato disódico', f: 'resaltador de sabor', r: 'bajo', x: 'Realza el sabor. Suele acompañar al glutamato.', a: ['inosinato disodico'] },
  e635: { n: 'Ribonucleótidos disódicos', f: 'resaltador de sabor', r: 'bajo', x: 'Realza el sabor. Suele acompañar al glutamato.', a: ['ribonucleotidos'] },

  // Edulcorantes
  e950: { n: 'Acesulfame K', f: 'edulcorante', r: 'moderado', x: 'Edulcorante artificial sin calorías. Aprobado, pero con estudios en curso; mejor no abusar.', a: ['acesulfame', 'acesulfamo'] },
  e951: { n: 'Aspartamo', f: 'edulcorante', r: 'moderado', x: 'Edulcorante artificial. En 2023 la OMS (IARC) lo clasificó como "posiblemente cancerígeno" en dosis altas. No apto para personas con fenilcetonuria.', a: ['aspartamo', 'aspartame'] },
  e952: { n: 'Ciclamato', f: 'edulcorante', r: 'moderado', x: 'Edulcorante artificial. Está prohibido en Estados Unidos; en Argentina está permitido con límites.', a: ['ciclamato'] },
  e954: { n: 'Sacarina', f: 'edulcorante', r: 'moderado', x: 'Edulcorante artificial muy antiguo. Aprobado, pero mejor no abusar.', a: ['sacarina'] },
  e955: { n: 'Sucralosa', f: 'edulcorante', r: 'moderado', x: 'Edulcorante artificial. Estudios recientes generan dudas sobre su efecto en la flora intestinal; mejor no abusar.', a: ['sucralosa'] },
  e960: { n: 'Stevia (glucósidos de esteviol)', f: 'edulcorante', r: 'bajo', x: 'Edulcorante de origen vegetal sin calorías. Se considera seguro en dosis normales.', a: ['stevia', 'estevia', 'glucosidos de esteviol', 'steviosido'] },
  e961: { n: 'Neotamo', f: 'edulcorante', r: 'moderado', x: 'Edulcorante artificial derivado del aspartamo.', a: ['neotamo'] },
  e962: { n: 'Sal de aspartamo-acesulfamo', f: 'edulcorante', r: 'moderado', x: 'Mezcla de dos edulcorantes artificiales.', a: ['sal de aspartamo'] },
  e965: { n: 'Maltitol', f: 'edulcorante', r: 'bajo', x: 'Edulcorante tipo poliol. En cantidad puede tener efecto laxante.', a: ['maltitol'] },
  e966: { n: 'Lactitol', f: 'edulcorante', r: 'bajo', x: 'Edulcorante tipo poliol. En cantidad puede tener efecto laxante.', a: ['lactitol'] },
  e967: { n: 'Xilitol', f: 'edulcorante', r: 'bajo', x: 'Edulcorante tipo poliol. En cantidad puede tener efecto laxante. Muy tóxico para perros.', a: ['xilitol'] },
  e968: { n: 'Eritritol', f: 'edulcorante', r: 'moderado', x: 'Edulcorante tipo poliol. Un estudio de 2023 lo asoció a riesgo cardiovascular; se sigue investigando.', a: ['eritritol'] },

  // Almidones modificados
  e1412: { n: 'Fosfato de dialmidón', f: 'espesante', r: 'bajo', x: 'Almidón modificado para espesar. Seguro.', a: [] },
  e1422: { n: 'Adipato de dialmidón acetilado', f: 'espesante', r: 'bajo', x: 'Almidón modificado para espesar. Seguro.', a: [] },
  e1442: { n: 'Fosfato de dialmidón hidroxipropilado', f: 'espesante', r: 'bajo', x: 'Almidón modificado para espesar. Seguro.', a: [] },
  e1450: { n: 'Octenilsuccinato de almidón sódico', f: 'emulsionante', r: 'bajo', x: 'Almidón modificado. Seguro.', a: [] },
};

// Códigos que cuentan como edulcorante (para la leyenda "Contiene edulcorantes")
export const EDULCORANTES = new Set([
  'e420', 'e421', 'e950', 'e951', 'e952', 'e953', 'e954', 'e955', 'e957', 'e959',
  'e960', 'e961', 'e962', 'e964', 'e965', 'e966', 'e967', 'e968', 'e969',
]);

// Devuelve la ficha de un aditivo a partir de su código ("e150d", "e322i"…).
export function fichaAditivo(codigo) {
  const c = codigo.toLowerCase();
  const base = c.replace(/[ivx]+$/, ''); // e322i → e322
  const sinLetra = base.replace(/[a-f]$/, ''); // e150d → e150
  const ficha = ADITIVOS[base] || ADITIVOS[sinLetra];
  if (ficha) return { codigo: base, ...ficha };
  return {
    codigo: base,
    n: 'Aditivo ' + base.toUpperCase(),
    f: 'aditivo',
    r: 'desconocido',
    x: 'Todavía no tenemos información sobre este aditivo.',
    a: [],
  };
}

export function esEdulcorante(codigo) {
  const c = codigo.replace(/[a-f]$/, '');
  return EDULCORANTES.has(codigo) || EDULCORANTES.has(c);
}
