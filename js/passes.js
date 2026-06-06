import { state } from './state.js';
import { DEFAULT_MIN_VISIBLE_ELEVATION_DEG, DEFAULT_PASS_HOURS_AHEAD, EARTH_RADIUS_KM, MAX_PASSES_TO_SHOW, URLS } from './config.js';
import { azimuthToCompass, circleCoords, clamp, deg2rad, escapeHtml, rad2deg, splitAntimeridian } from './utils.js';
import { getSatrec, getSatelliteSample } from './iss-api.js';
import { pointOfView, renderIssLayers, renderPaths } from './globe.js';
import { visibilityRadiusKm } from './visibility.js';
import { renderPassResults, showError } from './ui.js';
import { savePreferences } from './storage.js';

export async function calculateVisiblePasses() {
  const result = document.getElementById('passResult');
  if (result) {
    result.hidden = false;
    result.innerHTML = 'Calculando próximos pasos…';
  }

  try {
    const cityText = document.getElementById('cityInput')?.value.trim() || 'Barcelona, España';
    const minElevation = clamp(Number(document.getElementById('minElevationInput')?.value || DEFAULT_MIN_VISIBLE_ELEVATION_DEG), 0, 45);
    const hoursAhead = clamp(Number(document.getElementById('hoursAheadInput')?.value || DEFAULT_PASS_HOURS_AHEAD), 6, 168);
    savePreferences({ city: cityText, minElevation, hoursAhead });

    const location = await resolveLocation(cityText);
    const satrec = await getSatrec();
    const passes = findUpcomingPasses(satrec, location.lat, location.lng, hoursAhead, minElevation, MAX_PASSES_TO_SHOW);

    drawObserver(location);
    if (passes[0]) drawVisibility(location, passes[0], minElevation);
    renderPassResults(location, passes, minElevation, hoursAhead);
  } catch (err) {
    if (result) result.innerHTML = 'No se pudo calcular el paso: ' + escapeHtml(err.message);
    showError('No se pudo calcular el paso: ' + err.message);
  }
}

async function resolveLocation(text) {
  const clean = text.trim();
  if (!clean || /barcelona/i.test(clean)) {
    return { name: 'Barcelona, España', lat: 41.3874, lng: 2.1686 };
  }
  const url = `${URLS.openMeteoGeocode}?count=1&language=es&format=json&name=${encodeURIComponent(clean)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('No se pudo consultar la ciudad.');
  const data = await res.json();
  if (!data.results || !data.results.length) throw new Error('No he encontrado esa ciudad.');
  const r = data.results[0];
  return {
    name: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
    lat: Number(r.latitude),
    lng: Number(r.longitude)
  };
}

function findUpcomingPasses(satrec, lat, lng, hoursAhead, minElevation, maxPasses) {
  const observerGd = {
    longitude: deg2rad(lng),
    latitude: deg2rad(lat),
    height: 0
  };
  const now = new Date();
  const end = new Date(now.getTime() + hoursAhead * 3600 * 1000);
  const stepMs = 30 * 1000;
  const passes = [];
  let active = false;
  let currentPass = null;
  let previousElevation = -90;
  let firstAzimuth = null;

  for (let t = now.getTime(); t <= end.getTime(); t += stepMs) {
    const date = new Date(t);
    const propagated = satellite.propagate(satrec, date);
    if (!propagated || !propagated.position) continue;
    const gmst = satellite.gstime(date);
    const ecf = satellite.eciToEcf(propagated.position, gmst);
    const look = satellite.ecfToLookAngles(observerGd, ecf);
    const elevation = rad2deg(look.elevation);
    const azimuth = rad2deg(look.azimuth);
    const geo = getSatelliteSample(satrec, date);

    if (elevation >= minElevation && !active && previousElevation < minElevation) {
      active = true;
      firstAzimuth = azimuth;
      currentPass = {
        start: date,
        end: date,
        maxTime: date,
        maxElevation: elevation,
        maxAzimuth: azimuth,
        firstAzimuth: azimuth,
        lastAzimuth: azimuth,
        track: []
      };
    }

    if (active && currentPass) {
      currentPass.end = date;
      currentPass.lastAzimuth = azimuth;
      if (geo) currentPass.track.push({ lat: geo.lat, lng: geo.lng, alt: 0.082 });
      if (elevation > currentPass.maxElevation) {
        currentPass.maxElevation = elevation;
        currentPass.maxAzimuth = azimuth;
        currentPass.maxTime = date;
      }
    }

    if (active && elevation < minElevation && currentPass) {
      currentPass.direction = `${azimuthToCompass(firstAzimuth)} → ${azimuthToCompass(currentPass.lastAzimuth)}`;
      passes.push(currentPass);
      active = false;
      currentPass = null;
      firstAzimuth = null;
      if (passes.length >= maxPasses) break;
    }
    previousElevation = elevation;
  }

  return passes;
}

function drawObserver(location) {
  state.observerPoint = { lat: location.lat, lng: location.lng, alt: 0.014, radius: 0.22, color: '#00ffcc' };
  state.observerLabel = { lat: location.lat, lng: location.lng, alt: 0.036, text: 'Ubicación · ' + location.name, size: 0.58, color: '#ffffff' };
  renderIssLayers();
}

function drawVisibility(location, pass, minElevation) {
  const radiusKm = visibilityRadiusKm(420, minElevation);
  const circle = circleCoords(location.lat, location.lng, radiusKm, 160, 0.018);
  state.visibilityPaths = [{ type: 'visibility', coords: circle }];
  if (pass.track && pass.track.length > 1) {
    state.visibilityPaths.push(...splitAntimeridian(pass.track, 'visiblePass'));
  }
  renderPaths();
  pointOfView({ lat: location.lat, lng: location.lng, altitude: 1.75 }, 0);
}
