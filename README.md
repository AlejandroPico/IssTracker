# ISS Tracker 3D

Tracker 3D de la Estación Espacial Internacional desarrollado con **HTML**, **JavaScript**, **Globe.gl** y **Satellite.js**.

El proyecto muestra la posición aproximada de la ISS en tiempo real sobre un globo interactivo, con mapas de alta resolución, trayectoria orbital, predicción básica de pasos visibles por ciudad y acceso a emisiones en directo de NASA/ISS.

![Estado](https://img.shields.io/badge/estado-en%20desarrollo-blue)
![Frontend](https://img.shields.io/badge/frontend-HTML%20%2B%20JavaScript-orange)
![3D](https://img.shields.io/badge/3D-Globe.gl-00aaff)

---

## Características principales

- Globo 3D interactivo con atmósfera y fondo espacial.
- Seguimiento aproximado de la ISS en tiempo real.
- Órbita diferenciada por colores:
  - **Rojo**: recorrido ya realizado.
  - **Verde**: recorrido pendiente.
- Cuatro modos visuales de mapa:
  - Satélite.
  - Nubes casi en directo.
  - Político.
  - Relieve/topográfico.
- Carga de teselas HD al hacer zoom en los modos compatibles.
- Activación y desactivación de fronteras.
- Centrado automático sobre la ISS.
- Cálculo del próximo paso visible por ciudad.
- Marcador de ciudad anclado al globo.
- Cono aproximado de visibilidad desde la ubicación elegida.
- Línea del tramo visible previsto de la ISS.
- Panel flotante de cámaras en directo:
  - Ventana arrastrable.
  - Ventana redimensionable.
  - Rotación automática entre cámaras.
  - Controles internos del reproductor de YouTube.

---

## Captura conceptual

El objetivo visual del proyecto es mantener una estética oscura, limpia y técnica, evitando interfaces recargadas. La interfaz principal se compone de:

- Globo 3D a pantalla completa.
- Menú lateral minimalista.
- Controles de apariencia por iconos.
- Panel de cámaras flotante tipo ventana.
- Modal para cálculo de pasos visibles.

---

## Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| HTML5 | Estructura de la aplicación |
| CSS3 | Estilos, paneles, menús y ventana flotante |
| JavaScript | Lógica principal del tracker |
| Globe.gl | Renderizado del globo 3D |
| Three.js | Motor 3D utilizado por Globe.gl |
| Satellite.js | Propagación orbital a partir de TLE |
| WhereTheISS.at | Posición actual y TLE de la ISS |
| Open-Meteo Geocoding | Conversión de ciudad a latitud/longitud |
| YouTube Embed | Cámaras en directo NASA/ISS |
| Esri map tiles | Teselas HD de satélite, mapa político y relieve |
| Live Cloud Maps | Textura global de nubes casi en directo |

---

## Cómo ejecutar el proyecto

### Opción recomendada: servidor local

No abras el archivo haciendo doble clic como `file://`, especialmente si quieres usar las cámaras de YouTube.

Desde la carpeta del proyecto, ejecuta:

```bash
python -m http.server 8000
```

Después abre en el navegador:

```text
http://localhost:8000/iss_tracker_v10_camara_readme.html
```

También puedes usar extensiones como **Live Server** en Visual Studio Code.

---

## Estructura sugerida del repositorio

```text
iss-tracker-3d/
│
├── iss_tracker_v10_camara_readme.html
├── README.md
└── LICENSE
```

En versiones futuras convendría separar el proyecto en varios archivos:

```text
iss-tracker-3d/
│
├── index.html
├── README.md
├── LICENSE
│
├── css/
│   └── styles.css
│
└── js/
    ├── app.js
    ├── cameras.js
    ├── maps.js
    ├── orbit.js
    └── passes.js
```

Por ahora se mantiene en un único HTML para que sea fácil de probar, mover y subir a GitHub Pages.

---

## Uso básico

1. Abre el proyecto desde un servidor local.
2. Usa el menú lateral para cambiar el tipo de mapa.
3. Activa o desactiva las fronteras.
4. Activa la órbita de la ISS.
5. Pulsa “Centrar en la ISS” para enfocar la cámara sobre la estación.
6. En “Paso por mi ciudad”, introduce una ciudad, por ejemplo:

```text
Barcelona, España
```

7. Abre una cámara desde la sección “Cámaras”.
8. Arrastra la ventana de vídeo desde la barra superior.
9. Cambia su tamaño desde el borde inferior derecho de la ventana.
10. Usa el icono de rotación para activar o desactivar el cambio automático entre cámaras.

---

## Sobre el error 153 de YouTube

YouTube puede mostrar el **error 153** cuando el reproductor embebido no recibe una cabecera `HTTP Referer` o una identificación equivalente del cliente.

Por ese motivo, el proyecto incluye:

```html
<meta name="referrer" content="strict-origin-when-cross-origin">
```

Y el iframe de YouTube utiliza:

```html
referrerpolicy="strict-origin-when-cross-origin"
```

Aun así, si el HTML se abre directamente como archivo local (`file://`), el navegador puede no enviar un `Referer` válido. La solución práctica es ejecutar el proyecto desde:

- `http://localhost:8000`
- Live Server de VS Code
- GitHub Pages
- Netlify
- Vercel
- Cualquier servidor web estático

---

## Cámaras en directo

Las cámaras usadas son emisiones de NASA/ISS mediante YouTube Embed.

Es normal que la emisión pueda mostrar:

- Pantalla negra cuando la ISS está en la zona nocturna de la Tierra.
- Pantalla gris o cortes temporales si la señal no está disponible.
- Cambios de cámara realizados por NASA.
- Sustitución o baja de una emisión si NASA cambia sus directos oficiales.

---

## Limitaciones actuales

Este proyecto es educativo y visual. No debe usarse para navegación, observación astronómica profesional ni cálculo orbital crítico.

Limitaciones relevantes:

- La predicción de paso visible es aproximada.
- El modelo de sombra terrestre usado es simplificado.
- La visibilidad real depende de nubosidad local, contaminación lumínica, brillo de la ISS, elevación, hora solar y condiciones atmosféricas.
- Las texturas y teselas dependen de servicios externos.
- Los directos de YouTube pueden fallar si cambia la política de embebido, la emisión oficial o el origen desde el que se ejecuta la página.

---

## Mejoras futuras

Ideas para próximas versiones:

- Separar HTML, CSS y JavaScript en módulos.
- Añadir configuración persistente con `localStorage`.
- Permitir ciudad por defecto configurable.
- Añadir selector de elevación mínima para pasos visibles.
- Mostrar varios pasos futuros en una tabla.
- Añadir modo nocturno/diurno sobre el globo.
- Dibujar la zona real de iluminación solar.
- Añadir panel de telemetría con altitud, velocidad y país/región sobrevolada.
- Añadir pruebas unitarias para cálculos orbitales auxiliares.
- Crear una versión instalable como PWA.

---

## Fuentes y servicios externos

- Globe.gl: https://globe.gl/
- Satellite.js: https://github.com/shashwatak/satellite-js
- WhereTheISS.at: https://wheretheiss.at/
- Open-Meteo Geocoding API: https://open-meteo.com/en/docs/geocoding-api
- Live Cloud Maps: https://github.com/matteason/live-cloud-maps
- NASA HDEV / ISS live video: https://eol.jsc.nasa.gov/esrs/hdev/
- YouTube IFrame Player API: https://developers.google.com/youtube/iframe_api_reference
- YouTube embedded player requirements: https://developers.google.com/youtube/terms/required-minimum-functionality
- Esri ArcGIS map tiles: https://www.arcgis.com/

---

## Licencia

Este proyecto puede publicarse bajo licencia MIT si quieres permitir su reutilización con pocas restricciones.

Ejemplo de cabecera recomendada:

```text
MIT License

Copyright (c) 2026 Alejandro Pico

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files, to deal in the Software
without restriction, including without limitation the rights to use, copy,
modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.
```

---

## Estado del proyecto

Proyecto en evolución. La versión actual prioriza:

- Estabilidad visual.
- Mejor experiencia de mapa.
- Órbita ISS más clara.
- Panel de cámaras menos intrusivo.
- Base preparada para futuras mejoras.
