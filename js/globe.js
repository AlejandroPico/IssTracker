import { state } from './state.js';
import { MAPS, URLS } from './config.js';
import { rgbaFromHex } from './utils.js';
import { updateTelemetryPanel } from './ui.js';
import { toggleOrbit } from './orbit.js';

export function initGlobe() {
  if (typeof Globe !== 'function') throw new Error('No se ha cargado Globe.gl. Revisa la conexión a internet.');
  if (typeof satellite === 'undefined') throw new Error('No se ha cargado Satellite.js. Revisa la conexión a internet.');

  state.world = Globe()(document.getElementById('globeViz'))
    .globeImageUrl(MAPS.satellite.image)
    .bumpImageUrl(MAPS.satellite.bump)
    .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
    .showAtmosphere(true)
    .atmosphereColor('#3a6680')
    .atmosphereAltitude(0.15)
    .htmlLat('lat')
    .htmlLng('lng')
    .htmlAltitude('htmlAlt')
    .htmlTransitionDuration(0)
    .htmlElement(createHtmlMarker)
    .pointLat('lat')
    .pointLng('lng')
    .pointAltitude('alt')
    .pointRadius('radius')
    .pointColor('color')
    .pointsTransitionDuration(0)
    .labelLat('lat')
    .labelLng('lng')
    .labelAltitude('alt')
    .labelText('text')
    .labelSize('size')
    .labelColor('color')
    .labelResolution(2)
    .labelIncludeDot(true)
    .labelDotRadius(0.08)
    .labelsTransitionDuration(0)
    .pathPoints('coords')
    .pathPointLat('lat')
    .pathPointLng('lng')
    .pathPointAlt('alt')
    .pathResolution(1)
    .pathTransitionDuration(0)
    .pathDashAnimateTime(0)
    .polygonAltitude(d => d?.properties?.__kind === 'night' ? (d.properties.__alt || 0.008) : 0.002)
    .polygonsTransitionDuration(0);

  configureControls();
  window.addEventListener('resize', () => {
    if (state.world) state.world.width(window.innerWidth).height(window.innerHeight);
  });
}

function configureControls() {
  try {
    const controls = state.world.controls();
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.rotateSpeed = 0.36;
    // Zoom muy fino: más pasos de rueda para recorrer desde vista global hasta superficie.
    controls.zoomSpeed = 0.006;
    // Globe.gl usa una esfera de radio ~100; este margen permite acercamiento extremo sin entrar en el globo.
    controls.minDistance = 100.006;
    // Vista lejana algo más contenida para no alejarse excesivamente del planeta.
    controls.maxDistance = 1500;
    controls.screenSpacePanning = false;
    controls.update();
  } catch (err) {
    console.warn('No se pudieron ajustar controles:', err);
  }

  try {
    const camera = state.world.camera();
    camera.near = 0.001;
    camera.far = 8000;
    camera.updateProjectionMatrix();
  } catch (err) {
    console.warn('No se pudo ajustar la cámara:', err);
  }

  try {
    if (typeof state.world.globeCurvatureResolution === 'function') state.world.globeCurvatureResolution(0.9);
    if (typeof state.world.renderer === 'function') {
      const renderer = state.world.renderer();
      if (renderer?.setPixelRatio) renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    }
    if (state.world.globeMaterial && state.world.globeMaterial()) state.world.globeMaterial().bumpScale = 3.5;
  } catch (err) {
    console.warn('No se pudo ajustar el material del globo:', err);
  }
}

function createHtmlMarker(d) {
  const el = document.createElement('div');
  if (d && d.kind === 'iss') {
    el.className = 'iss-marker';
    el.innerHTML = `<img src="${URLS.issIcon}" alt="ISS" />`;
    el.title = 'ISS · clic para activar/desactivar la órbita TLE';
    el.addEventListener('click', ev => {
      ev.stopPropagation();
      toggleOrbit();
    });
  } else if (d && d.kind === 'sun') {
    el.className = 'celestial-marker sun-marker';
    el.title = d.title || 'Sol';
    el.innerHTML = '<span class="sun-glow"></span><span class="celestial-label">Sol</span>';
  } else if (d && d.kind === 'moon') {
    el.className = `celestial-marker moon-marker ${d.phaseClass || 'unknown'}`;
    el.title = d.title || 'Luna';
    el.innerHTML = `<span class="moon-disc"><span class="moon-shade"></span></span><span class="celestial-label">Luna</span>`;
  }
  return el;
}

export function renderIssLayers() {
  if (!state.world) return;
  const htmlData = state.issData ? [state.issData] : [];
  if (state.isSunMoonVisible && state.sunMarker) htmlData.push(state.sunMarker);
  if (state.isSunMoonVisible && state.moonMarker) htmlData.push(state.moonMarker);
  const pointData = [];
  const labelData = [];

  // La ISS se representa únicamente con el marcador SVG.
  // Se evita el punto/label adicional para mantener el mapa más sobrio.
  if (state.observerPoint) pointData.push(state.observerPoint);
  if (state.observerLabel) labelData.push(state.observerLabel);

  state.world.htmlElementsData(htmlData);
  state.world.pointsData(pointData);
  state.world.labelsData(labelData);
  updateTelemetryPanel();
}

export function renderPaths() {
  if (!state.world) return;
  let paths = [];
  if (state.showingBorders) {
    paths = paths.concat(state.borderPaths.map(p => ({
      type: 'border',
      coords: p.coords.map(c => ({ lat: c.lat, lng: c.lng, alt: 0.014 }))
    })));
  }
  if (state.isNightShadowVisible && state.dayNightPaths.length) paths = paths.concat(state.dayNightPaths);
  if (state.isOrbitVisible) paths = paths.concat(state.orbitPaths);
  if (state.isNasaTrajectoryVisible) paths = paths.concat(state.nasaTrajectoryPaths);
  if (state.visibilityPaths.length) paths = paths.concat(state.visibilityPaths);

  state.world.pathsData(paths)
    .pathColor(d => {
      if (d.type === 'border') return state.currentMapType === 'relief' ? '#111111' : 'rgba(230,245,255,0.78)';
      if (d.type === 'past') return '#ff2020';
      if (d.type === 'future') return '#20ff46';
      if (d.type === 'nasaPast') return '#ff9f1c';
      if (d.type === 'nasaFuture') return '#b0ff00';
      if (d.type === 'terminator') return 'rgba(255, 230, 150, 0.82)';
      if (d.type === 'visibility') return '#00ffff';
      if (d.type === 'visiblePass') return '#00aaff';
      return '#ffffff';
    })
    .pathStroke(d => {
      if (d.type === 'past' || d.type === 'future' || d.type === 'nasaPast' || d.type === 'nasaFuture') return 0.62;
      if (d.type === 'visiblePass') return 0.56;
      if (d.type === 'visibility') return 0.22;
      if (d.type === 'terminator') return 0.28;
      return 0.14;
    })
    .pathDashLength(d => (d.type === 'visibility' || d.type === 'terminator') ? 0.035 : 1)
    .pathDashGap(d => (d.type === 'visibility' || d.type === 'terminator') ? 0.018 : 0)
    .pathDashAnimateTime(0)
    .pathTransitionDuration(0);
}

export function renderPolygons() {
  if (!state.world) return;
  const polygons = [];
  if (state.isNightShadowVisible && state.nightPolygons.length) polygons.push(...state.nightPolygons);

  state.world.polygonsData(polygons)
    .polygonCapColor(d => {
      if (d?.properties?.__kind === 'night') return `rgba(0, 8, 22, ${d.properties.__alpha || 0.16})`;
      return rgbaFromHex(d?.properties?.__color, 0.24);
    })
    .polygonSideColor(d => d?.properties?.__kind === 'night' ? 'rgba(0, 0, 0, 0)' : 'rgba(0,0,0,0.06)')
    .polygonStrokeColor(d => d?.properties?.__kind === 'night' ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0.58)');
}

export function pointOfView(view, duration = 0) {
  if (state.world) state.world.pointOfView(view, duration);
}
