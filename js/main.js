import { loadPreferences } from './storage.js';
import { initUI, showError, showToast, updateLayerButtons } from './ui.js';
import { initGlobe } from './globe.js';
import { applyMapAppearance, loadCountryData } from './maps.js';
import { startIssTracking } from './iss-api.js';
import { calculateOrbit } from './orbit.js';
import { startDayNightTracking } from './visibility.js';
import { fetchNasaOem, buildNasaTrajectoryPaths } from './nasa-oem.js';
import { initCameras } from './cameras.js';
import { state } from './state.js';

window.addEventListener('error', event => {
  showError('Error JavaScript: ' + event.message + '\n' + (event.filename || '') + ':' + (event.lineno || ''));
});
window.addEventListener('unhandledrejection', event => {
  const reason = event.reason?.message || String(event.reason);
  showError('Promesa rechazada: ' + reason);
});

document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
  try {
    const prefs = loadPreferences();
    initGlobe();
    initUI(prefs);
    initCameras();
    applyMapAppearance();
    startDayNightTracking();
    loadCountryData();
    startIssTracking();

    fetchNasaOem().then(() => {
      buildNasaTrajectoryPaths();
      if (state.isNasaTrajectoryVisible) updateLayerButtons();
    });

    if (state.isOrbitVisible) calculateOrbit();
    showToast('Sistema inicializado.');

    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('./sw.js').catch(err => {
        console.warn('No se pudo registrar el service worker:', err);
      });
    }
  } catch (err) {
    showError('No se pudo inicializar el tracker: ' + err.message);
    throw err;
  }
}
