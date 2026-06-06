import { state } from './state.js';
import { DAY_NIGHT_REFRESH_MS, EARTH_RADIUS_KM } from './config.js';
import { circleRingLngLat, deg2rad, normalizeLng, rad2deg } from './utils.js';
import { renderIssLayers, renderPaths, renderPolygons } from './globe.js';
import { updateLayerButtons, updateTelemetryPanel } from './ui.js';

export function startDayNightTracking() {
  updateDayNightLayers();
  clearInterval(state.dayNightTimer);
  state.dayNightTimer = setInterval(updateDayNightLayers, DAY_NIGHT_REFRESH_MS);
}

export function toggleNightShadow() {
  state.isNightShadowVisible = !state.isNightShadowVisible;
  updateLayerButtons();
  updateDayNightLayers();
}

export function toggleSunMoon() {
  state.isSunMoonVisible = !state.isSunMoonVisible;
  updateLayerButtons();
  updateDayNightLayers();
}

// Compatibilidad interna con versiones anteriores: ahora equivale a la sombra día/noche.
export function toggleDayNight() {
  toggleNightShadow();
}

export function updateDayNightLayers(date = new Date()) {
  if (!state.isNightShadowVisible && !state.isSunMoonVisible) {
    state.dayNightPaths = [];
    state.nightPolygons = [];
    state.sunMarker = null;
    state.moonMarker = null;
    state.moonInfo = null;
    renderPolygons();
    renderPaths();
    renderIssLayers();
    updateTelemetryPanel();
    return;
  }

  const sun = getSunSubpoint(date);
  const moon = getMoonSubpoint(date, sun.eclipticLongitudeDeg);

  // La línea de terminador queda eliminada: la capa día/noche vuelve a ser una
  // sombra gradual y opcional, menos intrusiva que la línea discontinua de v2.
  state.dayNightPaths = [];
  state.nightPolygons = state.isNightShadowVisible ? buildNightShadowPolygons(sun) : [];

  state.moonInfo = moon;
  state.sunMarker = state.isSunMoonVisible ? {
    kind: 'sun',
    lat: sun.lat,
    lng: sun.lng,
    htmlAlt: 1.18,
    title: 'Sol · punto subsolar aproximado'
  } : null;
  state.moonMarker = state.isSunMoonVisible ? {
    kind: 'moon',
    lat: moon.lat,
    lng: moon.lng,
    htmlAlt: 1.02,
    title: `Luna · ${moon.phaseName} · ${Math.round(moon.illumination * 100)}% iluminada`,
    phaseClass: moon.phaseClass,
    phaseName: moon.phaseName,
    illumination: moon.illumination
  } : null;

  renderPolygons();
  renderPaths();
  renderIssLayers();
  updateTelemetryPanel();
}

function buildNightShadowPolygons(sun) {
  const antiLat = -sun.lat;
  const antiLng = normalizeLng(sun.lng + 180);
  const bands = [
    { radiusKm: Math.PI * EARTH_RADIUS_KM / 2, alpha: 0.18, alt: 0.006 },
    { radiusKm: Math.PI * EARTH_RADIUS_KM * 0.43, alpha: 0.16, alt: 0.007 },
    { radiusKm: Math.PI * EARTH_RADIUS_KM * 0.36, alpha: 0.14, alt: 0.008 },
    { radiusKm: Math.PI * EARTH_RADIUS_KM * 0.29, alpha: 0.10, alt: 0.009 }
  ];

  return bands.map((band, idx) => ({
    type: 'Feature',
    properties: {
      __kind: 'night',
      __alpha: band.alpha,
      __alt: band.alt,
      __band: idx
    },
    geometry: {
      type: 'Polygon',
      coordinates: [circleRingLngLat(antiLat, antiLng, band.radiusKm, 240)]
    }
  }));
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
  const jd = julianDate(date);
  const n = jd - 2451545.0;
  const L = normalizeDegrees(280.460 + 0.9856474 * n);
  const g = normalizeDegrees(357.528 + 0.9856003 * n);
  const lambda = normalizeDegrees(L + 1.915 * Math.sin(deg2rad(g)) + 0.020 * Math.sin(deg2rad(2 * g)));
  const epsilon = 23.439 - 0.0000004 * n;

  const eq = eclipticToEquatorial(lambda, 0, epsilon);
  const gmst = greenwichMeanSiderealTimeDeg(jd);

  return {
    lat: eq.decDeg,
    lng: normalizeLng(eq.raDeg - gmst),
    eclipticLongitudeDeg: lambda
  };
}

export function getMoonSubpoint(date, sunEclipticLongitudeDeg = null) {
  const jd = julianDate(date);
  const d = jd - 2451545.0;

  // Aproximación ligera, suficiente para visualización: longitud/latitud lunar
  // con los términos principales de anomalía y argumento de latitud.
  const L = normalizeDegrees(218.316 + 13.176396 * d);
  const M = normalizeDegrees(134.963 + 13.064993 * d);
  const F = normalizeDegrees(93.272 + 13.229350 * d);
  const lon = normalizeDegrees(L + 6.289 * Math.sin(deg2rad(M)));
  const lat = 5.128 * Math.sin(deg2rad(F));
  const epsilon = 23.439 - 0.0000004 * d;
  const eq = eclipticToEquatorial(lon, lat, epsilon);
  const gmst = greenwichMeanSiderealTimeDeg(jd);

  const sunLon = sunEclipticLongitudeDeg ?? getSunSubpoint(date).eclipticLongitudeDeg;
  const elongation = normalizeDegrees(lon - sunLon);
  const illumination = (1 - Math.cos(deg2rad(elongation))) / 2;
  const phase = classifyMoonPhase(elongation);

  return {
    lat: eq.decDeg,
    lng: normalizeLng(eq.raDeg - gmst),
    eclipticLongitudeDeg: lon,
    illumination,
    elongationDeg: elongation,
    phaseName: phase.name,
    phaseClass: phase.className
  };
}

function eclipticToEquatorial(lonDeg, latDeg, obliquityDeg) {
  const lon = deg2rad(lonDeg);
  const lat = deg2rad(latDeg);
  const eps = deg2rad(obliquityDeg);

  const sinDec = Math.sin(lat) * Math.cos(eps) + Math.cos(lat) * Math.sin(eps) * Math.sin(lon);
  const dec = Math.asin(sinDec);
  const y = Math.sin(lon) * Math.cos(eps) - Math.tan(lat) * Math.sin(eps);
  const x = Math.cos(lon);
  const ra = Math.atan2(y, x);

  return {
    raDeg: normalizeDegrees(rad2deg(ra)),
    decDeg: rad2deg(dec)
  };
}

function classifyMoonPhase(elongationDeg) {
  const e = normalizeDegrees(elongationDeg);
  if (e < 22.5 || e >= 337.5) return { name: 'luna nueva', className: 'new' };
  if (e < 67.5) return { name: 'creciente', className: 'waxing-crescent' };
  if (e < 112.5) return { name: 'cuarto creciente', className: 'first-quarter' };
  if (e < 157.5) return { name: 'gibosa creciente', className: 'waxing-gibbous' };
  if (e < 202.5) return { name: 'luna llena', className: 'full' };
  if (e < 247.5) return { name: 'gibosa menguante', className: 'waning-gibbous' };
  if (e < 292.5) return { name: 'cuarto menguante', className: 'last-quarter' };
  return { name: 'menguante', className: 'waning-crescent' };
}

function julianDate(date) {
  return date.getTime() / 86400000 + 2440587.5;
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
