import { state } from './state.js';
import { EMBEDDED_TLE, ISS_REFRESH_MS, TLE_REFRESH_MS, URLS } from './config.js';
import { normalizeLng, rad2deg, vectorMagnitude } from './utils.js';
import { pointOfView, renderIssLayers } from './globe.js';
import { findCountryAt } from './maps.js';
import { showError, showToast, updateDataStatus, updateTelemetryPanel } from './ui.js';

export function startIssTracking() {
  ensureIssPosition().then(() => {
    if (state.issData && !state.hasAutoCenteredOnIss) {
      state.hasAutoCenteredOnIss = true;
      pointOfView({ lat: state.issData.lat, lng: state.issData.lng, altitude: 1.7 }, 0);
    }
  });
  clearInterval(state.issTimer);
  state.issTimer = setInterval(ensureIssPosition, ISS_REFRESH_MS);
}

export async function centerOnISS() {
  try {
    await ensureIssPosition();
    if (!state.issData) {
      showToast('Todavía no hay una posición válida de la ISS.', 'warn');
      return;
    }
    pointOfView({ lat: state.issData.lat, lng: state.issData.lng, altitude: 1.45 }, 0);
    document.getElementById('sideMenu')?.classList.remove('open');
  } catch (err) {
    showError('No se pudo centrar en la ISS: ' + err.message);
  }
}

export async function ensureIssPosition() {
  let data = await fetchIssFromApi().catch(() => null);
  if (!data) data = await fetchIssFromTle().catch(() => null);
  if (!data) {
    updateTelemetryPanel();
    return null;
  }

  const overflight = findCountryAt(data.lat, normalizeLng(data.lng));
  state.issData = {
    kind: 'iss',
    lat: data.lat,
    lng: normalizeLng(data.lng),
    altitudeKm: data.altitudeKm || 420,
    velocityKmH: data.velocityKmH || null,
    visibilityLabel: data.visibilityLabel || inferVisibilityLabel(data.visibility),
    sourceLabel: data.sourceLabel || 'API',
    overflight: overflight || 'Océano / sin país detectado',
    updatedAt: new Date(),
    htmlAlt: 0.065,
    alt: 0.07,
    radius: 0.34,
    color: '#00b7ff',
    text: 'ISS',
    size: 0.72
  };

  renderIssLayers();
  updateTelemetryPanel();
  return state.issData;
}

async function fetchIssFromApi() {
  const res = await fetch(URLS.wheretheissPosition, { cache: 'no-store' });
  if (!res.ok) throw new Error('API directa ISS no disponible');
  const json = await res.json();
  if (!Number.isFinite(json.latitude) || !Number.isFinite(json.longitude)) throw new Error('Coordenadas ISS inválidas');
  return {
    lat: Number(json.latitude),
    lng: Number(json.longitude),
    altitudeKm: Number(json.altitude) || 420,
    velocityKmH: Number(json.velocity) || null,
    visibility: json.visibility,
    visibilityLabel: inferVisibilityLabel(json.visibility),
    sourceLabel: 'WhereTheISS.at'
  };
}

async function fetchIssFromTle() {
  const satrec = await getSatrec();
  const sample = getSatelliteSample(satrec, new Date());
  if (!sample) throw new Error('No se pudo propagar la ISS');
  return {
    ...sample,
    sourceLabel: state.tleSourceLabel.includes('embebido') ? 'TLE fallback embebido' : `TLE ${state.tleSourceLabel}`
  };
}

export async function getSatrec(force = false) {
  const isFresh = state.tleSatrec && (Date.now() - state.tleLoadedAt < TLE_REFRESH_MS);
  if (!force && isFresh) return state.tleSatrec;

  const loaders = [
    {
      label: 'WhereTheISS.at',
      load: async () => {
        const res = await fetch(URLS.wheretheissTle, { cache: 'no-store' });
        if (!res.ok) throw new Error('TLE wheretheiss no disponible');
        const json = await res.json();
        return [json.line1, json.line2];
      }
    },
    {
      label: 'CelesTrak GP/TLE',
      load: async () => {
        const res = await fetch(URLS.celestrakTle, { cache: 'no-store' });
        if (!res.ok) throw new Error('TLE CelesTrak no disponible');
        const text = await res.text();
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        return [lines.find(l => l.startsWith('1 ')), lines.find(l => l.startsWith('2 '))];
      }
    },
    {
      label: 'TLE embebido de emergencia',
      load: async () => EMBEDDED_TLE
    }
  ];

  let lastErr = null;
  for (const source of loaders) {
    try {
      const lines = await source.load();
      if (!lines[0] || !lines[1]) throw new Error('TLE incompleto');
      state.tleSatrec = satellite.twoline2satrec(lines[0], lines[1]);
      state.tleLoadedAt = Date.now();
      state.tleSourceLabel = source.label;
      state.tleLines = lines;
      updateDataStatus();
      if (source.label.includes('embebido')) {
        showToast('Se está usando un TLE embebido de emergencia. La precisión puede estar degradada.', 'warn');
      }
      return state.tleSatrec;
    } catch (err) {
      lastErr = err;
      console.warn('Fuente TLE fallida:', source.label, err);
    }
  }
  state.tleSourceLabel = 'no disponible';
  updateDataStatus();
  throw lastErr || new Error('No hay TLE disponible');
}

export function getSatelliteSample(satrec, date) {
  const propagated = satellite.propagate(satrec, date);
  if (!propagated || !propagated.position) return null;
  const gmst = satellite.gstime(date);
  const gd = satellite.eciToGeodetic(propagated.position, gmst);
  const speedKmH = propagated.velocity ? vectorMagnitude(propagated.velocity) * 3600 : null;
  return {
    lat: rad2deg(gd.latitude),
    lng: normalizeLng(rad2deg(gd.longitude)),
    altitudeKm: gd.height,
    velocityKmH: speedKmH,
    positionEci: propagated.position,
    velocityEci: propagated.velocity
  };
}

function inferVisibilityLabel(value) {
  if (value === 'daylight') return 'Iluminada';
  if (value === 'eclipsed') return 'Eclipse / sombra';
  if (value === 'visible') return 'Visible';
  return value ? String(value) : '—';
}
