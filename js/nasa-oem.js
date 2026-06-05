import { state } from './state.js';
import { NASA_OEM_REFRESH_MS, URLS } from './config.js';
import { normalizeLng, rad2deg, splitAntimeridian, vectorMagnitude } from './utils.js';
import { renderPaths } from './globe.js';
import { showToast, updateDataStatus, updateLayerButtons } from './ui.js';

export async function toggleNasaTrajectory() {
  state.isNasaTrajectoryVisible = !state.isNasaTrajectoryVisible;
  updateLayerButtons();
  if (state.isNasaTrajectoryVisible) {
    await fetchNasaOem();
    buildNasaTrajectoryPaths();
  } else {
    state.nasaTrajectoryPaths = [];
  }
  renderPaths();
}

export async function fetchNasaOem(force = false) {
  const fresh = state.nasaOem.loaded && (Date.now() - state.nasaOem.loadedAt < NASA_OEM_REFRESH_MS);
  if (!force && fresh) return state.nasaOem.vectors;
  if (state.nasaOem.loading) return state.nasaOem.vectors;

  state.nasaOem.loading = true;
  state.nasaOem.sourceLabel = 'cargando…';
  updateDataStatus();

  try {
    const res = await fetch(URLS.nasaOemTxt, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const vectors = parseOemTxt(text);
    if (!vectors.length) throw new Error('No se encontraron vectores OEM');
    state.nasaOem.loaded = true;
    state.nasaOem.loading = false;
    state.nasaOem.loadedAt = Date.now();
    state.nasaOem.sourceLabel = 'NASA OEM';
    state.nasaOem.vectors = vectors;
    state.nasaOem.error = null;
    updateDataStatus();
    return vectors;
  } catch (err) {
    state.nasaOem.loaded = false;
    state.nasaOem.loading = false;
    state.nasaOem.sourceLabel = 'no disponible desde el navegador';
    state.nasaOem.error = err;
    updateDataStatus();
    showToast('No se pudo cargar la trayectoria NASA OEM. Se mantiene la órbita TLE como fuente operativa.', 'warn');
    return [];
  }
}

function parseOemTxt(text) {
  const out = [];
  const lines = text.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!/^\d{4}-\d{2}-\d{2}T/.test(line)) continue;
    const parts = line.split(/\s+/);
    if (parts.length < 7) continue;
    const epoch = new Date(parts[0].replace(/Z?$/, 'Z'));
    const x = Number(parts[1]);
    const y = Number(parts[2]);
    const z = Number(parts[3]);
    const vx = Number(parts[4]);
    const vy = Number(parts[5]);
    const vz = Number(parts[6]);
    if (![x, y, z, vx, vy, vz].every(Number.isFinite) || Number.isNaN(epoch.getTime())) continue;

    const gmst = satellite.gstime(epoch);
    const gd = satellite.eciToGeodetic({ x, y, z }, gmst);
    out.push({
      epoch,
      lat: rad2deg(gd.latitude),
      lng: normalizeLng(rad2deg(gd.longitude)),
      altitudeKm: gd.height,
      velocityKmH: vectorMagnitude({ x: vx, y: vy, z: vz }) * 3600
    });
  }
  return out;
}

export function buildNasaTrajectoryPaths() {
  if (!state.nasaOem.loaded || !state.nasaOem.vectors.length) {
    state.nasaTrajectoryPaths = [];
    return;
  }

  const now = Date.now();
  const windowMsPast = 46 * 60 * 1000;
  const windowMsFuture = 120 * 60 * 1000;
  const past = [];
  const future = [];

  for (const v of state.nasaOem.vectors) {
    const t = v.epoch.getTime();
    if (t >= now - windowMsPast && t <= now) past.push({ lat: v.lat, lng: v.lng, alt: 0.085 });
    if (t >= now && t <= now + windowMsFuture) future.push({ lat: v.lat, lng: v.lng, alt: 0.085 });
  }

  state.nasaTrajectoryPaths = splitAntimeridian(past, 'nasaPast')
    .concat(splitAntimeridian(future, 'nasaFuture'));
}
