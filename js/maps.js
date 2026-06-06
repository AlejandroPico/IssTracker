import { state } from './state.js';
import { CLOUD_TEXTURE_URL, MAPS, URLS } from './config.js';
import { pointInPolygonFeature } from './utils.js';
import { renderIssLayers, renderPaths, renderPolygons } from './globe.js';
import { setStatus, showToast, updateLayerButtons, updateMapButtons } from './ui.js';

export function applyMapAppearance() {
  if (!state.world) return;
  const map = MAPS[state.currentMapType] || MAPS.satellite;
  const useClouds = state.currentMapType === 'satellite' && state.cloudsEnabled;
  const cloudBust = `?v=${Math.floor(Date.now() / (3 * 60 * 60 * 1000))}`;

  if (useClouds) {
    state.world.globeImageUrl(CLOUD_TEXTURE_URL + cloudBust);
    state.world.bumpImageUrl(MAPS.satellite.bump);
    setTileEngine(null);
    setStatus('mapStatus', 'Satélite con nubes activo.');
    setStatus('mapAttribution', 'Live Cloud Maps · NASA Blue Marble · Globe.gl');
  } else {
    state.world.globeImageUrl(map.image);
    state.world.bumpImageUrl(map.bump);
    setTileEngine(state.currentMapType);
    setStatus('mapStatus', map.status);
    setStatus('mapAttribution', map.attribution);
  }

  try {
    if (state.world.globeMaterial && state.world.globeMaterial()) {
      const material = state.world.globeMaterial();
      material.bumpScale = state.currentMapType === 'relief' ? 4.5 : 2.5;
      material.depthWrite = true;
      material.depthTest = true;
    }
  } catch (err) {}

  updateMapButtons();
  updateLayerButtons();
  renderPolygons();
  renderPaths();
  renderIssLayers();
}

function setTileEngine(type) {
  if (!state.world || typeof state.world.globeTileEngineUrl !== 'function') return;
  const map = type ? MAPS[type] : null;
  try {
    if (typeof state.world.globeTileEngineClearCache === 'function') state.world.globeTileEngineClearCache();
    if (typeof state.world.globeTileEngineMaxZoom === 'function') state.world.globeTileEngineMaxZoom(map?.maxZoom || 17);
    state.world.globeTileEngineUrl(map?.tileUrl || null);
  } catch (err) {
    console.warn('No se pudo aplicar el motor de teselas:', err);
  }
}

export function changeMapType(type) {
  if (!MAPS[type]) return;
  state.currentMapType = type;
  if (state.currentMapType !== 'satellite') state.cloudsEnabled = false;
  applyMapAppearance();
}

export function toggleClouds() {
  if (state.currentMapType !== 'satellite') {
    updateLayerButtons();
    showToast('Las nubes solo están disponibles en el modo Satélite.', 'warn');
    return;
  }
  state.cloudsEnabled = !state.cloudsEnabled;
  applyMapAppearance();
}

export function toggleBorders() {
  state.showingBorders = !state.showingBorders;
  updateLayerButtons();
  renderPaths();
}

export async function loadCountryData() {
  try {
    const res = await fetch(URLS.countriesGeoJson, { cache: 'force-cache' });
    if (!res.ok) throw new Error('GeoJSON de países no disponible');
    const geo = await res.json();
    const colors = ['#f4a261', '#e76f51', '#2a9d8f', '#e9c46a', '#264653', '#8ab17d'];
    state.countryPolygons = geo.features || [];
    state.borderPaths = [];
    state.countryPolygons.forEach((feature, idx) => {
      feature.properties = feature.properties || {};
      feature.properties.__color = colors[idx % colors.length];
      addFeatureBorders(feature);
    });
    renderPolygons();
    renderPaths();
  } catch (err) {
    console.warn('No se pudieron cargar países/fronteras:', err);
    showToast('No se pudieron cargar fronteras/países. El tracker seguirá funcionando sin esa capa.', 'warn');
  }
}

function addFeatureBorders(feature) {
  if (!feature?.geometry) return;
  const geom = feature.geometry;
  if (geom.type === 'Polygon') {
    geom.coordinates.forEach(ring => addBorderRing(ring));
  } else if (geom.type === 'MultiPolygon') {
    geom.coordinates.forEach(poly => poly.forEach(ring => addBorderRing(ring)));
  }
}

function addBorderRing(ring) {
  if (!Array.isArray(ring) || ring.length < 2) return;
  state.borderPaths.push({
    type: 'border',
    coords: ring.map(c => ({ lat: c[1], lng: c[0], alt: 0.014 }))
  });
}

export function findCountryAt(lat, lng) {
  if (!state.countryPolygons.length) return null;
  const feature = state.countryPolygons.find(f => pointInPolygonFeature(lat, lng, f));
  if (!feature) return null;
  return feature.properties?.ADMIN || feature.properties?.name || feature.properties?.NAME || null;
}
