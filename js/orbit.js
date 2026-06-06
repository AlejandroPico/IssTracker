import { state } from './state.js';
import { ORBIT_BACK_MINUTES, ORBIT_FORWARD_MINUTES, ORBIT_REFRESH_MS, ORBIT_STEP_SECONDS } from './config.js';
import { splitAntimeridian } from './utils.js';
import { renderPaths } from './globe.js';
import { getSatrec, getSatelliteSample } from './iss-api.js';
import { showError, updateLayerButtons } from './ui.js';

export function toggleOrbit() {
  state.isOrbitVisible = !state.isOrbitVisible;
  updateLayerButtons();
  if (state.isOrbitVisible) {
    calculateOrbit();
    clearInterval(state.orbitTimer);
    state.orbitTimer = setInterval(calculateOrbit, ORBIT_REFRESH_MS);
  } else {
    clearInterval(state.orbitTimer);
    state.orbitPaths = [];
    renderPaths();
  }
}

export async function calculateOrbit() {
  if (!state.isOrbitVisible || !state.world) return;
  try {
    const satrec = await getSatrec();
    const now = new Date();
    const past = [];
    const future = [];

    for (let s = -ORBIT_BACK_MINUTES * 60; s <= ORBIT_FORWARD_MINUTES * 60; s += ORBIT_STEP_SECONDS) {
      const sample = getSatelliteSample(satrec, new Date(now.getTime() + s * 1000));
      if (!sample) continue;
      const p = { lat: sample.lat, lng: sample.lng, alt: 0.07 };
      if (s <= 0) past.push(p);
      if (s >= 0) future.push(p);
    }

    state.orbitPaths = splitAntimeridian(past, 'past').concat(splitAntimeridian(future, 'future'));
    renderPaths();
  } catch (err) {
    showError('No se pudo calcular la órbita TLE: ' + err.message);
  }
}
