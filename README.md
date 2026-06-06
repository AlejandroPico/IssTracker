# ISS Tracker 3D

Tracker 3D de la Estación Espacial Internacional desarrollado con **HTML**, **CSS**, **JavaScript modular**, **Globe.gl** y **Satellite.js**.

El proyecto muestra la posición aproximada de la ISS en tiempo real sobre un globo interactivo, con mapas de alta resolución, trayectoria orbital, predicción de pasos visibles por ciudad, telemetría, capa Sol/Luna, fase lunar, trayectoria NASA OEM experimental y panel de cámaras en directo.

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
- Cuatro modos visuales de mapa:
  - Satélite.
  - Político.
  - Relieve/topográfico.
  - Nocturno.
- Capa de nubes casi en directo en modo satélite.
- Fronteras y países opcionales.
- Capa Sol/Luna con terminador solar aproximado.
- Marcadores visuales HTML/CSS para Sol y Luna, sin depender de emojis ni labels 3D.
- Fase lunar aproximada y porcentaje de iluminación en telemetría.
- Marcador SVG propio para la ISS.
- Centrado automático y manual sobre la estación.
- Panel de telemetría:
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
  - Fuentes seleccionables.
  - Ventana arrastrable.
  - Ventana redimensionable.
  - Modo minimizar.
  - Rotación automática entre cámaras.
  - Controles internos del reproductor de YouTube.
- Persistencia de preferencias con `localStorage`.
- Base PWA con `manifest.webmanifest` y `sw.js`.

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
│   ├── icons/
│   │   └── iss.svg
│   └── screenshots/
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
| `utils.js` | Funciones matemáticas, fechas, HTML seguro, geodesia y utilidades. |
| `storage.js` | Preferencias persistentes en `localStorage`. |
| `ui.js` | Menú, modales, botones, telemetría, resultados y mensajes. |
| `globe.js` | Inicialización y renderizado de Globe.gl. |
| `maps.js` | Mapas, nubes, fronteras y países. |
| `iss-api.js` | Posición ISS, TLE, propagación orbital y fallback. |
| `orbit.js` | Órbita TLE pasada/futura. |
| `passes.js` | Cálculo de pasos visibles por ciudad. |
| `visibility.js` | Sol/Luna, fase lunar, terminador solar y círculo de visibilidad. |
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

Es normal que la emisión pueda mostrar:

- Pantalla negra cuando la ISS está en la zona nocturna de la Tierra.
- Pantalla gris o cortes temporales si la señal no está disponible.
- Cambios de cámara realizados por NASA.
- Sustitución o baja de una emisión si NASA cambia sus directos oficiales.
- Error de YouTube si se abre el proyecto como `file://` o si el origen no cumple las políticas de embed.

---

## Sobre la trayectoria NASA OEM

NASA publica la trayectoria de la ISS en formato **CCSDS Orbit Ephemeris Message** (`.txt` y `.xml`). Esta versión intenta cargar primero las fuentes oficiales directas y, si el navegador lo bloquea por CORS, prueba una ruta alternativa mediante proxy CORS público.

Notas importantes:

- El formato OEM usa vectores de estado en el marco J2000.
- La conversión visual en navegador se trata como aproximación divulgativa.
- Si el navegador bloquea la petición o la fuente no responde, el proyecto sigue funcionando con TLE y Satellite.js.
- El modo TLE sigue siendo la capa operativa principal.
- El proxy CORS se usa solo como fallback y no debe considerarse infraestructura crítica.

---

## Limitaciones actuales

Este proyecto es educativo y visual. No debe usarse para navegación, observación astronómica profesional ni cálculo orbital crítico.

Limitaciones relevantes:

- La predicción de paso visible es aproximada.
- El terminador solar, la subposición lunar y la fase lunar son aproximaciones visuales.
- El país sobrevolado se calcula con polígonos simplificados.
- La trayectoria NASA OEM se muestra como capa experimental y puede fallar si la fuente oficial o el proxy CORS no responden.
- Las texturas, teselas, cámaras y APIs dependen de servicios externos.
- Los directos de YouTube pueden fallar si cambia la política de embebido, la emisión oficial o el origen desde el que se ejecuta la página.
- El Service Worker solo cachea archivos principales del proyecto, no garantiza disponibilidad offline de APIs ni mapas externos.

---

## Cambios destacados de la v2

- Eliminado el marcador textual/emoji del Sol que podía aparecer como `?` en algunos navegadores.
- Añadidos marcadores visuales de Sol y Luna mediante HTML/CSS.
- Añadida fase lunar aproximada al panel de telemetría.
- Eliminada la sombra nocturna como polígono semitransparente por defecto para reducir artefactos de renderizado.
- Conservado el terminador solar como línea más ligera y estable.
- Reducida la carga visual de polígonos en modo político; las fronteras se renderizan como líneas elevadas para evitar z-fighting.
- Ajustados parámetros de cámara, bump mapping y resolución del globo para reducir parpadeos.
- Mejorada la carga NASA OEM con fuentes TXT/XML y fallback por proxy CORS.
- Actualizado el Service Worker a caché v2.

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
- NASA ISS OEM TXT: https://nasa-public-data.s3.amazonaws.com/iss-coords/current/ISS_OEM/ISS.OEM_J2K_EPH.txt
- NASA HDEV / ISS live video: https://eol.jsc.nasa.gov/esrs/HDEV/
- NASA Live: https://www.nasa.gov/live/
- Open-Meteo Geocoding API: https://open-meteo.com/en/docs/geocoding-api
- YouTube IFrame Player API: https://developers.google.com/youtube/iframe_api_reference
- Esri ArcGIS map tiles: https://www.arcgis.com/
- Live Cloud Maps: https://github.com/matteason/live-cloud-maps
