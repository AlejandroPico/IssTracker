# ISS Tracker 3D

Tracker 3D de la Estación Espacial Internacional desarrollado con **HTML**, **CSS**, **JavaScript modular**, **Globe.gl** y **Satellite.js**.

El proyecto muestra la posición aproximada de la ISS en tiempo real sobre un globo interactivo, con mapas de alta resolución, trayectoria orbital, predicción de pasos visibles por ciudad, telemetría, capa de sombra día/noche opcional, Sol/Luna opcionales con fase lunar, trayectoria NASA OEM experimental y panel de cámaras en directo.

![Estado](https://img.shields.io/badge/estado-en%20desarrollo-blue)
![Frontend](https://img.shields.io/badge/frontend-HTML%20%2B%20CSS%20%2B%20JavaScript-orange)
![3D](https://img.shields.io/badge/3D-Globe.gl-00aaff)
![Licencia](https://img.shields.io/badge/license-MIT-green)

---

## Demo

El proyecto está pensado para funcionar en **GitHub Pages**, **Netlify**, **Vercel** o cualquier servidor web estático.

> Importante: no abras `index.html` directamente como `file://`. Usa un servidor local o GitHub Pages para evitar bloqueos de CORS, YouTube Embed y Service Worker.

---

## Características principales

- Globo 3D interactivo con atmósfera y fondo espacial.
- Seguimiento aproximado de la ISS en tiempo real.
- Órbita TLE diferenciada por colores:
  - **Rojo**: recorrido ya realizado.
  - **Verde**: recorrido pendiente.
- Trayectoria NASA OEM experimental:
  - **Naranja**: tramo pasado OEM.
  - **Verde lima**: tramo futuro OEM.
- Suavizado visual de la trayectoria OEM mediante interpolación geodésica entre vectores.
- Cuatro modos visuales de mapa:
  - Satélite.
  - Político.
  - Relieve/topográfico.
  - Nocturno.
- Capa de nubes casi en directo en modo satélite.
- Fronteras y países opcionales.
- Capa **Sombra día/noche** independiente y opcional, con oscurecimiento gradual del hemisferio nocturno.
- Capa **Sol/Luna** independiente y opcional, desactivada por defecto.
- Sol y Luna situados a mayor altitud visual respecto a la esfera para reducir molestias sobre el mapa.
- Marcadores visuales HTML/CSS para Sol y Luna, sin depender de emojis ni labels 3D.
- Fase lunar aproximada y porcentaje de iluminación cuando la capa celeste está activa.
- Marcador SVG superior de la ISS, sin punto ni etiqueta fija sobre el mapa.
- Centrado automático y manual sobre la estación.
- Zoom mucho más gradual, con más pasos de rueda y acercamiento extremo a la superficie sin atravesar el globo.
- Panel de telemetría conmutable desde el menú:
  - Latitud y longitud.
  - Altitud.
  - Velocidad aproximada.
  - Visibilidad según fuente disponible.
  - País o zona sobrevolada aproximada.
  - Fuente de datos activa.
  - Hora de actualización.
- Cálculo de varios pasos visibles por ciudad.
- Tabla de pasos futuros con inicio, máximo, fin, duración, elevación, dirección y calidad.
- Marcador de ciudad sobre el globo.
- Cono aproximado de visibilidad desde la ubicación elegida.
- Línea del tramo visible previsto de la ISS.
- Panel flotante de cámaras ISS/NASA:
  - Diseño minimalista centrado en el vídeo.
  - Selector de cámara integrado en la barra superior.
  - Ventana arrastrable corregida mediante Pointer Events y `setPointerCapture`.
  - Ventana redimensionable desde las cuatro esquinas, sin indicadores visuales intrusivos.
  - Modo minimizar.
  - Rotación automática entre cámaras cada 30 segundos.
  - Controles internos del reproductor de YouTube.
- Persistencia de preferencias con `localStorage`.
- Base PWA con `manifest.webmanifest` y `sw.js`.


### Cambios de la v6

- Menú hamburguesa más compacto, con tres barras más juntas y proporción visual más discreta.
- Cabecera lateral simplificada: se elimina `MISSION CONTROL`, se elimina el subtítulo y queda solo `ISS Tracker`.
- El título del menú se alinea a la derecha del botón hamburguesa para evitar solapamientos visuales.
- Eliminadas las descripciones de estado bajo los modos de mapa.
- Los cuatro modos de apariencia del globo vuelven a mostrarse en una rejilla 2x2, con texto centrado vertical y horizontalmente.
- Añadida una primera adaptación responsive para móvil: menú más compacto, paneles ajustados al viewport, cámara adaptada a pantalla estrecha y controles táctiles más consistentes.
- Actualizado `localStorage` a preferencias v6 y Service Worker a caché v6.



### Cambios de la v5

- Eliminados los emoticonos del menú lateral, botones de capas, herramientas y estado.
- Renovado el menú hamburguesa con estética más técnica y sobria.
- Añadido control para activar/desactivar el panel fijo de telemetría.
- Eliminado el punto y la etiqueta fija `ISS` del marcador orbital; ahora la estación se representa solo mediante SVG.
- Sustituido el marcador anterior por una silueta superior más reconocible de la Estación Espacial Internacional.
- Eliminados símbolos decorativos del marcador de ciudad y de los botones principales.
- Actualizado `localStorage` a preferencias v5 y Service Worker a caché v5.

El nuevo icono local de la ISS se ha redibujado como una silueta superior simplificada para marcador de mapa. La referencia documental usada para el cambio es la ilustración de vista superior de la ISS publicada por NASA y alojada en Wikimedia Commons como dominio público en EE. UU. No se ha incorporado el logotipo oficial de NASA ni insignias protegidas.

---

## Estructura del repositorio

```text
iss-tracker-3d/
│
├── index.html
├── README.md
├── LICENSE
├── manifest.webmanifest
├── sw.js
├── .gitignore
│
├── css/
│   └── styles.css
│
├── js/
│   ├── main.js
│   ├── config.js
│   ├── state.js
│   ├── utils.js
│   ├── storage.js
│   ├── ui.js
│   ├── globe.js
│   ├── maps.js
│   ├── iss-api.js
│   ├── orbit.js
│   ├── passes.js
│   ├── visibility.js
│   ├── nasa-oem.js
│   └── cameras.js
│
├── assets/
│   └── icons/
│       ├── iss.svg
│       └── iss-top-view.svg
│
└── data/
    └── README.md
```

---

## Arquitectura JavaScript

| Módulo | Responsabilidad |
|---|---|
| `main.js` | Arranque de la aplicación. |
| `config.js` | Constantes, URLs, mapas, cámaras y configuración orbital. |
| `state.js` | Estado compartido de la aplicación. |
| `utils.js` | Funciones matemáticas, fechas, HTML seguro, geodesia e interpolación. |
| `storage.js` | Preferencias persistentes en `localStorage`. |
| `ui.js` | Menú, modales, botones, telemetría, resultados y mensajes. |
| `globe.js` | Inicialización y renderizado de Globe.gl. |
| `maps.js` | Mapas, nubes, fronteras y países. |
| `iss-api.js` | Posición ISS, TLE, propagación orbital y fallback. |
| `orbit.js` | Órbita TLE pasada/futura. |
| `passes.js` | Cálculo de pasos visibles por ciudad. |
| `visibility.js` | Sombra día/noche, Sol/Luna, fase lunar y círculo de visibilidad. |
| `nasa-oem.js` | Carga y visualización experimental de trayectoria NASA OEM. |
| `cameras.js` | Panel flotante de cámaras ISS/NASA. |

---

## Cómo ejecutar el proyecto

### Opción recomendada: servidor local con Python

Desde la carpeta del proyecto:

```bash
python -m http.server 8000
```

Después abre:

```text
http://localhost:8000/
```

### Opción alternativa: Live Server

También puedes usar la extensión **Live Server** de Visual Studio Code.

### Publicación en GitHub Pages

1. Sube los archivos a tu repositorio.
2. En GitHub, entra en **Settings → Pages**.
3. Selecciona la rama que quieras publicar.
4. Usa `/root` como carpeta de publicación si el proyecto está en la raíz.

---

## Fuentes de datos

| Fuente | Uso |
|---|---|
| WhereTheISS.at | Posición actual de la ISS y TLE como fuente principal. |
| CelesTrak | Fuente alternativa de TLE/GP para NORAD 25544. |
| NASA ISS OEM | Trayectoria oficial en formato CCSDS OEM, cargada de forma experimental. |
| Open-Meteo Geocoding | Conversión de ciudad a latitud/longitud. |
| NASA / YouTube | Emisiones de vídeo en directo de la ISS y NASA. |
| Globe.gl / Three.js | Renderizado 3D del globo. |
| Esri | Teselas de mapa satélite, callejero y topográfico. |
| Live Cloud Maps | Textura global de nubes casi en directo. |

---

## Cámaras en directo

El panel de cámaras usa reproductores embebidos de YouTube con emisiones públicas relacionadas con NASA/ISS.

En la v5 la ventana mantiene el diseño minimalista de la v3, pero añade redimensionado manual desde las cuatro esquinas. La barra superior contiene únicamente selector de cámara, zona de arrastre y botones de rotación, minimizar y cerrar. La rotación automática cambia de cámara cada 30 segundos.

Es normal que la emisión pueda mostrar pantalla negra, gris, cortes temporales o errores de YouTube si el directo no está disponible, si NASA cambia la emisión o si el proyecto se abre como `file://`.

---

## Sobre la trayectoria NASA OEM

NASA publica la trayectoria de la ISS en formato **CCSDS Orbit Ephemeris Message** (`.txt` y `.xml`). Esta versión intenta cargar primero las fuentes oficiales directas y, si el navegador lo bloquea por CORS, prueba una ruta alternativa mediante proxy CORS público.

Notas importantes:

- El formato OEM usa vectores de estado en el marco J2000.
- La conversión visual en navegador se trata como aproximación divulgativa.
- Los vectores OEM están más espaciados que la órbita TLE calculada localmente; por eso la v3 interpola puntos intermedios para suavizar la línea.
- Si el navegador bloquea la petición o la fuente no responde, el proyecto sigue funcionando con TLE y Satellite.js.
- El modo TLE sigue siendo la capa operativa principal.
- El proxy CORS se usa solo como fallback y no debe considerarse infraestructura crítica.

---

## Limitaciones actuales

Este proyecto es educativo y visual. No debe usarse para navegación, observación astronómica profesional ni cálculo orbital crítico.

Limitaciones relevantes:

- La predicción de paso visible es aproximada.
- La sombra día/noche, la subposición lunar y la fase lunar son aproximaciones visuales.
- El país sobrevolado se calcula con polígonos simplificados.
- La trayectoria NASA OEM se muestra como capa experimental y puede fallar si la fuente oficial o el proxy CORS no responden.
- Las texturas, teselas, cámaras y APIs dependen de servicios externos.
- Los directos de YouTube pueden fallar si cambia la política de embebido, la emisión oficial o el origen desde el que se ejecuta la página.
- El Service Worker solo cachea archivos principales del proyecto, no garantiza disponibilidad offline de APIs ni mapas externos.

---

## Cambios destacados de la v4

- Rotación automática de cámaras ajustada a **30 segundos**.
- Ventana de cámaras redimensionable desde las cuatro esquinas: superior izquierda, superior derecha, inferior izquierda e inferior derecha.
- Redimensionado personalizado con Pointer Events, sin indicadores visuales adicionales.
- El panel de cámaras usa altura real flexible para que el vídeo aproveche mejor el espacio al redimensionar.
- Zoom del globo mucho más fino: `zoomSpeed` reducido a `0.006`.
- Acercamiento máximo ampliado: `minDistance` ajustado a `100.006` para aproximarse mucho más a la superficie sin entrar en la esfera.
- Vista lejana contenida: `maxDistance` ajustado a `1500` para no alejarse tanto del planeta.
- Cámara ajustada con `near = 0.001` para mejorar la visualización a distancias muy próximas.
- Actualizado `localStorage` a preferencias v4.
- Actualizado Service Worker a caché v4.

## Cambios destacados de la v3

- Sol/Luna desactivados por defecto.
- Separadas las capas **Sombra día/noche** y **Sol/Luna**.
- Recuperada la sombra nocturna gradual como capa independiente.
- Eliminada la línea discontinua de terminador solar.
- Sol y Luna colocados más lejos de la esfera.
- Panel de cámaras simplificado: barra superior compacta y vídeo como elemento principal.
- Eliminados título, subtítulo y nota inferior del panel de cámaras.
- Corregido el arrastre de la ventana de cámaras usando captura de puntero en la cabecera.
- Trayectoria NASA OEM suavizada mediante interpolación entre vectores.

---

## Roadmap sugerido

- Añadir tests unitarios para utilidades orbitales y geodesia.
- Sustituir carga CDN por dependencias empaquetadas con Vite.
- Añadir panel de eventos orbitales: nodo ascendente, nodo descendente y próxima salida/entrada de eclipse.
- Añadir selector de ciudad por geolocalización del navegador.
- Añadir notificaciones de próximos pasos visibles.
- Guardar varias ciudades favoritas.
- Añadir exportación de tabla de pasos a CSV.
- Añadir capturas automáticas para README.
- Integrar un dataset local de países para reducir dependencias externas.

---

## Licencia

Este proyecto se distribuye bajo licencia **MIT**.

MIT es una licencia abierta y permisiva: permite usar, copiar, modificar y redistribuir el código, incluso en otros proyectos, manteniendo el aviso de copyright y la licencia.

---

## Créditos y referencias

- Globe.gl: https://globe.gl/
- Satellite.js: https://github.com/shashwatak/satellite-js
- WhereTheISS.at API: https://wheretheiss.at/w/developer
- CelesTrak GP/TLE: https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE
- NASA Spot The Station: https://www.nasa.gov/spot-the-station/
- NASA HDEV / ISS live video: https://eol.jsc.nasa.gov/esrs/hdev/
- Open-Meteo Geocoding API: https://open-meteo.com/en/docs/geocoding-api
- YouTube IFrame Player API: https://developers.google.com/youtube/iframe_api_reference
