# ISS Tracker

**ISS Tracker** es una aplicación web interactiva para seguir la posición de la Estación Espacial Internacional sobre un globo 3D, consultar su trayectoria orbital, visualizar pasos visibles desde una ciudad y acceder a cámaras y fuentes oficiales del sector espacial.

El proyecto está diseñado como una herramienta visual, técnica y divulgativa: suficientemente clara para uso educativo, pero con una presentación sobria y modular propia de un repositorio público cuidado.

---

## Características principales

### Seguimiento de la ISS

- Posición aproximada de la Estación Espacial Internacional en tiempo real.
- Representación de la ISS mediante icono SVG local.
- Guía vertical sobre el globo para identificar con claridad el punto de la Tierra sobrevolado.
- Telemetría compacta con datos dinámicos:
  - latitud,
  - longitud,
  - altitud,
  - velocidad,
  - visibilidad orbital,
  - zona o país sobrevolado.

### Globo 3D interactivo

- Globo 3D a pantalla completa con atmósfera y fondo espacial.
- Navegación con ratón o controles táctiles.
- Zoom progresivo y fino para acercarse a la superficie con mayor control.
- Cuatro modos visuales:
  - satélite,
  - político,
  - relieve,
  - nocturno.
- Carga de teselas HD en los modos compatibles.
- Capas opcionales:
  - nubes,
  - fronteras,
  - órbita TLE,
  - trayectoria NASA OEM,
  - sombra día/noche,
  - Sol/Luna.

### Órbita y trayectoria

- Trayectoria orbital basada en TLE mediante Satellite.js.
- Diferenciación visual entre recorrido pasado y futuro.
- Soporte experimental para trayectoria NASA OEM cuando el navegador y las políticas CORS permiten cargarla.
- Estado resumido de fuentes de datos en una única fila:
  - ISS,
  - TLE,
  - NASA OEM.
- Tooltip de detalle al pasar el ratón sobre cada fuente.

### Pasos visibles

- Cálculo de próximos pasos visibles desde una ciudad.
- Búsqueda de ciudad mediante geocodificación.
- Configuración de elevación mínima.
- Configuración de horas a futuro.
- Listado paginado de resultados en grupos de 10.
- Selección de cualquier paso para representarlo sobre el globo.
- Trayectoria visible destacada en color magenta/violeta.
- Guía vertical de ubicación para marcar la ciudad elegida.

### Cámaras ISS/NASA

- Panel flotante para cámaras y emisiones relacionadas con NASA/ISS.
- Ventana arrastrable y redimensionable desde las esquinas.
- Controles compactos:
  - rotación automática,
  - minimizar,
  - cerrar.
- Rotación automática entre cámaras cada 30 segundos.

### Interfaz

- Menú lateral sobrio, compacto y sin iconografía decorativa.
- Identidad visual de la ISS en el encabezado y favicon SVG disponible desde la raíz.
- Ventana «Acerca de» con información del proyecto, autor, repositorio y portfolio.
- Paneles minimalistas y estilo oscuro técnico.
- Telemetría sin contenedor exterior, formada por cajas independientes.
- Scrollbars minimalistas en zonas donde puedan aparecer por resolución reducida.
- Adaptación inicial para pantallas móviles y portátiles.
- PWA básica con `manifest.webmanifest` y `service worker`.

---

## Fuentes de datos y servicios utilizados

| Fuente | Uso |
|---|---|
| WhereTheISS.at | Posición actual y TLE de la ISS. |
| CelesTrak | Fuente alternativa de TLE. |
| NASA OEM | Trayectoria oficial experimental cuando está disponible desde navegador. |
| Open-Meteo Geocoding | Conversión de ciudad a coordenadas. |
| NASA / YouTube Embed | Cámaras y emisiones relacionadas con ISS/NASA. |
| Esri / ArcGIS tiles | Teselas de mapa en modos satélite, político y relieve. |
| Globe.gl | Renderizado del globo 3D. |
| Satellite.js | Propagación orbital a partir de TLE. |

La capa NASA OEM es experimental porque puede depender de políticas CORS, disponibilidad del origen y comportamiento del navegador. Cuando no está disponible, la aplicación mantiene la órbita TLE como fuente operativa.

---

## Enlaces de referencia incluidos

El menú incorpora enlaces oficiales y de interés general relacionados con exploración espacial, ISS, agencias espaciales y operadores de lanzamiento:

- NASA.
- ISS NASA.
- Spot the Station.
- HDEV / vídeo ISS.
- ESA.
- ESA ISS.
- JAXA.
- JAXA ISS / Kibo.
- ISRO.
- CNSA.
- Canadian Space Agency.
- SpaceX.
- Blue Origin.
- Rocket Lab.
- United Launch Alliance.
- Arianespace.
- ArianeGroup.
- ESO.

---

## Estructura del proyecto

```text
iss-tracker/
├── index.html
├── favicon.svg
├── README.md
├── LICENSE
├── manifest.webmanifest
├── sw.js
├── css/
│   └── styles.css
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
├── assets/
│   └── icons/
│       ├── iss.svg
│       └── iss-top-view.svg
└── data/
    └── README.md
```

---

## Arquitectura JavaScript

| Módulo | Responsabilidad |
|---|---|
| `main.js` | Punto de entrada de la aplicación. |
| `config.js` | Constantes, URLs, mapas, cámaras y parámetros orbitales. |
| `state.js` | Estado compartido de la aplicación. |
| `utils.js` | Utilidades de fechas, coordenadas, HTML y formato. |
| `storage.js` | Persistencia de preferencias en `localStorage`. |
| `ui.js` | Menú, modales, telemetría, estado de datos y render de resultados. |
| `globe.js` | Inicialización del globo, capas visuales y render principal. |
| `maps.js` | Modos de mapa, nubes, fronteras y teselas. |
| `iss-api.js` | Posición actual, TLE, fallback y propagación base. |
| `orbit.js` | Órbita TLE, trayectoria NASA OEM y líneas orbitales. |
| `passes.js` | Cálculo y selección de pasos visibles. |
| `visibility.js` | Sombra día/noche, Sol/Luna y visibilidad. |
| `nasa-oem.js` | Carga y análisis de datos NASA OEM. |
| `cameras.js` | Panel de cámaras, rotación, arrastre y redimensionado. |

---

## Cómo ejecutar el proyecto

### Opción recomendada: servidor local

Desde la carpeta del proyecto:

```bash
python -m http.server 8000
```

Después abre:

```text
http://localhost:8000/
```

También puedes usar Live Server en Visual Studio Code o publicar directamente en GitHub Pages.

No se recomienda abrir el archivo como `file://`, ya que algunas fuentes externas, cámaras y módulos pueden no funcionar correctamente sin servidor web.

---

## Publicación en GitHub Pages

El proyecto es completamente estático. Puede publicarse en GitHub Pages sin backend.

Pasos habituales:

1. Subir el contenido del proyecto al repositorio.
2. Activar GitHub Pages desde la configuración del repositorio.
3. Seleccionar la rama principal y la carpeta raíz.
4. Abrir la URL pública generada por GitHub Pages.

---

## Limitaciones

ISS Tracker es una herramienta educativa y visual. No debe usarse para navegación, observación astronómica crítica ni cálculo orbital profesional.

Limitaciones principales:

- Las predicciones de paso visible son aproximadas.
- La visibilidad real depende de nubosidad, contaminación lumínica, brillo de la ISS, hora solar y condiciones atmosféricas.
- Las cámaras pueden mostrar pantalla negra, cortes o restricciones de inserción según la fuente.
- La trayectoria NASA OEM puede fallar desde navegador por CORS o disponibilidad temporal.
- Las teselas y texturas dependen de servicios externos.

---

## Licencia

Este proyecto se distribuye bajo licencia MIT.

Consulta el archivo `LICENSE` para más información.

---

## Historial de versiones

### v1 · Modularización inicial

- Separación del proyecto en HTML, CSS y módulos JavaScript.
- README actualizado.
- Base preparada para entregas en ZIP completas.

### v2 · Sol/Luna y NASA OEM

- Añadidos Sol y Luna como elementos visuales propios.
- Fase lunar aproximada.
- Primer soporte experimental para NASA OEM.
- Ajustes de renderizado para reducir artefactos.

### v3 · Cámaras, capas y zoom

- Sol/Luna desactivados por defecto.
- Separación entre capa Sol/Luna y sombra día/noche.
- Panel de cámaras simplificado.
- Zoom más gradual.
- Trayectoria NASA OEM suavizada.

### v4 · Zoom fino y cámaras redimensionables

- Rotación de cámaras cada 30 segundos.
- Redimensionado desde las cuatro esquinas.
- Mayor recorrido de zoom hacia superficie.

### v5 · Interfaz profesional

- Eliminación de emoticonos decorativos.
- Menú lateral más sobrio.
- Telemetría conmutable.
- Sustitución del marcador ISS por SVG local.

### v6 · Menú compacto y responsive

- Cabecera reducida a ISS Tracker.
- Apariencia del globo en rejilla 2x2.
- Primeros ajustes responsive para móvil y portátil.

### v7 · Menú y telemetría refinados

- Nombre unificado como ISS Tracker.
- Capas y herramientas en rejilla compacta.
- Estado de datos simplificado.
- Telemetría reducida a datos dinámicos útiles.

### v8 · Estética de notificaciones y cámaras

- Notificaciones rediseñadas y compactadas.
- Iconos funcionales en controles de cámara.
- Modal de estado reducido.

### v9 · Limpieza de estado e información

- Eliminación de notificaciones de arranque.
- Estado de datos integrado en menú.
- Sección de información inicial.
- Etiquetas de ubicación limpias y compatibles con acentos.
- Telemetría sin contenedor exterior.

### v10 · Pasos seleccionables y marcadores verticales

- Listado de pasos visibles seleccionables.
- Representación visual del paso elegido.
- Trayectoria visible destacada.
- Guías verticales para ciudad e ISS.
- Corrección de enlaces de información iniciales.

### v11 · Guías sincronizadas y enlaces revisados

- Guía vertical de la ISS sincronizada con el marcador.
- Guías más visibles.
- Enlaces de información revisados.

### v12 · Enlaces, estado compacto y paginación

- Información ampliada con enlaces oficiales.
- Estado de datos en una fila de tres indicadores.
- Tooltips de detalle para ISS, TLE y NASA OEM.
- Paginación de pasos visibles en bloques de 10.

### v13 · Acabado de presentación

- Más enlaces oficiales, organizados en tres columnas.
- Scrollbars minimalistas en el menú.
- Modal de pasos ajustado para evitar scroll vertical en escritorio.
- README reescrito como presentación profesional del proyecto.
- Historial de versiones consolidado al final del documento.
