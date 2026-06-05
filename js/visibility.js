import { state } from './state.js';
import { DAY_NIGHT_REFRESH_MS, EARTH_RADIUS_KM } from './config.js';
import { circleCoords, circleRingLngLat, deg2rad, normalizeLng, rad2deg } from './utils.js';
import { renderIssLayers, renderPaths, renderPolygons } from './globe.js';
import { updateLayerButtons } from './ui.js';

export function startDayNightTracking() {
  updateDayNightLayers();
  clearInterval(state.dayNightTimer);
  state.dayNightTimer = setInterval(updateDayNightLayers, DAY_NIGHT_REFRESH_MS);
}

export function toggleDayNight() {
  state.isDayNightVisible = !state.isDayNightVisible;
  updateLayerButtons();
  updateDayNightLayers();
}

export function updateDayNightLayers(date = new Date()) {
  if (!state.isDayNightVisible) {
    state.dayNightPaths = [];
    state.nightPolygon = null;
    state.sunPoint = null;
    state.sunLabel = null;
    renderPolygons();
    renderPaths();
    renderIssLayers();
    return;
  }

  const sun = getSunSubpoint(date);
  const antiSun = {
    lat: -sun.lat,
    lng: normalizeLng(sun.lng + 180)
  };
  const terminator = circleCoords(sun.lat, sun.lng, Math.PI * EARTH_RADIUS_KM / 2, 260, 0.012);
  const nightRing = circleRingLngLat(antiSun.lat, antiSun.lng, Math.PI * EARTH_RADIUS_KM / 2, 260);

  state.dayNightPaths = [{ type: 'terminator', coords: terminator }];
  state.nightPolygon = {
    type: 'Feature',
    properties: { __kind: 'night' },
    geometry: {
      type: 'Polygon',
      coordinates: [nightRing]
    }
  };
  state.sunPoint = { lat: sun.lat, lng: sun.lng, alt: 0.018, radius: 0.18, color: '#ffd166' };
  state.sunLabel = { lat: sun.lat, lng: sun.lng, alt: 0.045, text: '☀ Sol', size: 0.52, color: '#fff3b0' };

  renderPolygons();
  renderPaths();
  renderIssLayers();
}

export function visibilityRadiusKm(altitudeKm, minElevDeg) {
  const r = EARTH_RADIUS_KM;
  const h = altitudeKm;
  const e = deg2rad(minElevDeg);
  const rho = r / (r + h);
  const central = Math.acos(rho * Math.cos(e)) - e;
  return Math.max(0, central * r);
}

export function getSunSubpoint(date) {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const n = jd - 2451545.0;
  const L = normalizeDegrees(280.460 + 0.9856474 * n);
  const g = normalizeDegrees(357.528 + 0.9856003 * n);
  const lambda = normalizeDegrees(L + 1.915 * Math.sin(deg2rad(g)) + 0.020 * Math.sin(deg2rad(2 * g)));
  const epsilon = 23.439 - 0.0000004 * n;

  const lambdaRad = deg2rad(lambda);
  const epsilonRad = deg2rad(epsilon);
  const ra = Math.atan2(Math.cos(epsilonRad) * Math.sin(lambdaRad), Math.cos(lambdaRad));
  const dec = Math.asin(Math.sin(epsilonRad) * Math.sin(lambdaRad));
  const gmst = greenwichMeanSiderealTimeDeg(jd);

  return {
    lat: rad2deg(dec),
    lng: normalizeLng(rad2deg(ra) - gmst)
  };
}

function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360;
}

function greenwichMeanSiderealTimeDeg(jd) {
  const T = (jd - 2451545.0) / 36525;
  return normalizeDegrees(
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000
  );
}
