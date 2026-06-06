import { state } from './state.js';

const STORAGE_KEY = 'iss-tracker-3d.preferences.v3';

const DEFAULTS = {
  currentMapType: 'satellite',
  cloudsEnabled: false,
  showingBorders: false,
  isOrbitVisible: false,
  isNasaTrajectoryVisible: false,
  isNightShadowVisible: false,
  isSunMoonVisible: false,
  city: 'Barcelona, España',
  minElevation: 10,
  hoursAhead: 72,
  activeCameraId: 'iss-live'
};

export function loadPreferences() {
  let prefs = { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) prefs = { ...prefs, ...JSON.parse(raw) };
  } catch (err) {
    console.warn('No se pudieron leer preferencias:', err);
  }

  state.currentMapType = prefs.currentMapType;
  state.cloudsEnabled = Boolean(prefs.cloudsEnabled);
  state.showingBorders = Boolean(prefs.showingBorders);
  state.isOrbitVisible = Boolean(prefs.isOrbitVisible);
  state.isNasaTrajectoryVisible = Boolean(prefs.isNasaTrajectoryVisible);
  state.isNightShadowVisible = Boolean(prefs.isNightShadowVisible);
  state.isSunMoonVisible = Boolean(prefs.isSunMoonVisible);
  state.camera.activeId = prefs.activeCameraId || 'iss-live';

  return prefs;
}

export function savePreferences(extra = {}) {
  const prefs = {
    currentMapType: state.currentMapType,
    cloudsEnabled: state.cloudsEnabled,
    showingBorders: state.showingBorders,
    isOrbitVisible: state.isOrbitVisible,
    isNasaTrajectoryVisible: state.isNasaTrajectoryVisible,
    isNightShadowVisible: state.isNightShadowVisible,
    isSunMoonVisible: state.isSunMoonVisible,
    activeCameraId: state.camera.activeId,
    city: document.getElementById('cityInput')?.value || DEFAULTS.city,
    minElevation: Number(document.getElementById('minElevationInput')?.value || DEFAULTS.minElevation),
    hoursAhead: Number(document.getElementById('hoursAheadInput')?.value || DEFAULTS.hoursAhead),
    ...extra
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.warn('No se pudieron guardar preferencias:', err);
  }
}

export function resetPreferences() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('No se pudieron borrar preferencias:', err);
  }
}

export { DEFAULTS };
