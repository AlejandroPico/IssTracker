import { state } from './state.js';
import { NASA_OEM_REFRESH_MS, URLS } from './config.js';
import { interpolateGeoPoints, normalizeLng, rad2deg, splitAntimeridian, vectorMagnitude } from './utils.js';
import { renderPaths } from './globe.js';
import { updateDataStatus, updateLayerButtons } from './ui.js';

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

  const sources = buildOemSources();
  const errors = [];

  for (const source of sources) {
    try {
      const res = await fetch(source.url, { cache: 'no-store', mode: 'cors' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const vectors = source.format === 'xml' ? parseOemXml(text) : parseOemTxt(text);
      if (!vectors.length) throw new Error('No se encontraron vectores OEM');
      setOemSuccess(vectors, source.label);
      return vectors;
    } catch (err) {
      errors.push(`${source.label}: ${err.message}`);
      console.warn('Fuente NASA OEM fallida:', source.label, err);
    }
  }

  state.nasaOem.loaded = false;
  state.nasaOem.loading = false;
  state.nasaOem.sourceLabel = 'no disponible en navegador';
  state.nasaOem.error = new Error(errors.join(' | '));
  updateDataStatus();
  return [];
}

function buildOemSources() {
  const txt = URLS.nasaOemTxt;
  const xml = URLS.nasaOemXml;
  const proxy = URLS.corsProxyRaw;
  const proxyAlt = URLS.corsProxyAlt;
  const proxyIso = URLS.corsProxyIso;
  return [
    { label: 'NASA OEM TXT directo', url: txt, format: 'txt' },
    { label: 'NASA OEM XML directo', url: xml, format: 'xml' },
    { label: 'NASA OEM TXT vía AllOrigins', url: proxy + encodeURIComponent(txt), format: 'txt' },
    { label: 'NASA OEM XML vía AllOrigins', url: proxy + encodeURIComponent(xml), format: 'xml' },
    { label: 'NASA OEM TXT vía corsproxy.io', url: proxyAlt + encodeURIComponent(txt), format: 'txt' },
    { label: 'NASA OEM XML vía corsproxy.io', url: proxyAlt + encodeURIComponent(xml), format: 'xml' },
    { label: 'NASA OEM TXT vía isomorphic-git', url: proxyIso + txt, format: 'txt' },
    { label: 'NASA OEM XML vía isomorphic-git', url: proxyIso + xml, format: 'xml' }
  ];
}

function setOemSuccess(vectors, sourceLabel) {
  state.nasaOem.loaded = true;
  state.nasaOem.loading = false;
  state.nasaOem.loadedAt = Date.now();
  state.nasaOem.sourceLabel = sourceLabel;
  state.nasaOem.vectors = vectors;
  state.nasaOem.error = null;
  updateDataStatus();
}

function parseOemTxt(text) {
  const out = [];
  const lines = text.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!/^\d{4}-\d{2}-\d{2}T/.test(line)) continue;
    const parts = line.split(/\s+/);
    if (parts.length < 7) continue;
    const vector = makeVector(parts[0], parts[1], parts[2], parts[3], parts[4], parts[5], parts[6]);
    if (vector) out.push(vector);
  }
  return out;
}

function parseOemXml(text) {
  const out = [];
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) throw new Error('XML OEM inválido');

  doc.querySelectorAll('stateVector, STATE_VECTOR, state_vector').forEach(node => {
    const epoch = textOf(node, 'EPOCH') || textOf(node, 'epoch');
    const vector = makeVector(
      epoch,
      textOf(node, 'X') || textOf(node, 'x'),
      textOf(node, 'Y') || textOf(node, 'y'),
      textOf(node, 'Z') || textOf(node, 'z'),
      textOf(node, 'X_DOT') || textOf(node, 'x_DOT') || textOf(node, 'x_dot'),
      textOf(node, 'Y_DOT') || textOf(node, 'y_DOT') || textOf(node, 'y_dot'),
      textOf(node, 'Z_DOT') || textOf(node, 'z_DOT') || textOf(node, 'z_dot')
    );
    if (vector) out.push(vector);
  });

  return out;
}

function textOf(node, tagName) {
  const direct = node.getElementsByTagName(tagName)[0];
  if (direct) return direct.textContent.trim();
  const wanted = tagName.toLowerCase();
  for (const child of node.children) {
    if (child.tagName.toLowerCase() === wanted) return child.textContent.trim();
  }
  return null;
}

function makeVector(epochText, xText, yText, zText, vxText, vyText, vzText) {
  const epoch = new Date(String(epochText || '').replace(/Z?$/, 'Z'));
  const x = Number(xText);
  const y = Number(yText);
  const z = Number(zText);
  const vx = Number(vxText);
  const vy = Number(vyText);
  const vz = Number(vzText);
  if (![x, y, z, vx, vy, vz].every(Number.isFinite) || Number.isNaN(epoch.getTime())) return null;

  const gmst = satellite.gstime(epoch);
  const gd = satellite.eciToGeodetic({ x, y, z }, gmst);
  return {
    epoch,
    lat: rad2deg(gd.latitude),
    lng: normalizeLng(rad2deg(gd.longitude)),
    altitudeKm: gd.height,
    velocityKmH: vectorMagnitude({ x: vx, y: vy, z: vz }) * 3600
  };
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
    if (t >= now - windowMsPast && t <= now) past.push({ lat: v.lat, lng: v.lng, alt: 0.115, epoch: v.epoch });
    if (t >= now && t <= now + windowMsFuture) future.push({ lat: v.lat, lng: v.lng, alt: 0.115, epoch: v.epoch });
  }

  const smoothPast = densifyTrajectory(past);
  const smoothFuture = densifyTrajectory(future);
  state.nasaTrajectoryPaths = splitAntimeridian(smoothPast, 'nasaPast')
    .concat(splitAntimeridian(smoothFuture, 'nasaFuture'));
}

function densifyTrajectory(points) {
  if (points.length < 2) return points.map(stripEpoch);
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dtMinutes = Math.abs(b.epoch - a.epoch) / 60000;
    const steps = Math.max(2, Math.min(12, Math.round(dtMinutes * 2)));
    const segment = interpolateGeoPoints(a, b, steps).map(stripEpoch);
    if (i > 0) segment.shift();
    out.push(...segment);
  }
  return out;
}

function stripEpoch(point) {
  return { lat: point.lat, lng: point.lng, alt: point.alt };
}

