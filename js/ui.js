import { state } from './state.js';
import { DEFAULT_PASS_HOURS_AHEAD, DEFAULT_MIN_VISIBLE_ELEVATION_DEG } from './config.js';
import { escapeHtml, formatDate, formatDuration, passQuality } from './utils.js';
import { savePreferences, resetPreferences } from './storage.js';
import { changeMapType, toggleBorders, toggleClouds } from './maps.js';
import { toggleOrbit } from './orbit.js';
import { toggleNightShadow, toggleSunMoon } from './visibility.js';
import { toggleNasaTrajectory } from './nasa-oem.js';
import { centerOnISS } from './iss-api.js';
import { calculateVisiblePasses } from './passes.js';
import { openCameraPanel } from './cameras.js';

export function initUI(prefs) {
  bind('menuBtn', 'click', () => document.getElementById('sideMenu')?.classList.toggle('open'));
  bind('btnClouds', 'click', toggleClouds);
  bind('btnBorders', 'click', toggleBorders);
  bind('btnOrbit', 'click', toggleOrbit);
  bind('btnNasaTrajectory', 'click', toggleNasaTrajectory);
  bind('btnNightShadow', 'click', toggleNightShadow);
  bind('btnSunMoon', 'click', toggleSunMoon);
  bind('btnTelemetry', 'click', toggleTelemetryPanel);
  bind('btnCenterIss', 'click', centerOnISS);
  bind('btnOpenPasses', 'click', () => openModal('passModal'));
  bind('btnOpenCameras', 'click', openCameraPanel);
  bind('btnCalculatePasses', 'click', calculateVisiblePasses);
  bind('btnResetPreferences', 'click', () => {
    resetPreferences();
    showToast('Preferencias restablecidas. Recarga la página para volver al estado inicial.');
  });

  document.querySelectorAll('[data-map]').forEach(btn => {
    btn.addEventListener('click', () => changeMapType(btn.dataset.map));
  });
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', closeModals);
  });
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') closeModals();
  });

  const cityInput = document.getElementById('cityInput');
  const minElevationInput = document.getElementById('minElevationInput');
  const hoursAheadInput = document.getElementById('hoursAheadInput');
  if (cityInput) cityInput.value = prefs.city || 'Barcelona, España';
  if (minElevationInput) minElevationInput.value = prefs.minElevation || DEFAULT_MIN_VISIBLE_ELEVATION_DEG;
  if (hoursAheadInput) hoursAheadInput.value = prefs.hoursAhead || DEFAULT_PASS_HOURS_AHEAD;

  updateLayerButtons();
  updateMapButtons();
  updateTelemetryVisibility();
  updateTelemetryPanel();
}

function bind(id, event, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener(event, handler);
}

export function openModal(id) {
  closeModals();
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
  document.getElementById('sideMenu')?.classList.remove('open');
}

export function closeModals() {
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
}

function toggleTelemetryPanel() {
  state.isTelemetryVisible = !state.isTelemetryVisible;
  updateTelemetryVisibility();
  savePreferences();
}

export function updateTelemetryVisibility() {
  const panel = document.getElementById('statusPanel');
  const btn = document.getElementById('btnTelemetry');
  if (panel) panel.hidden = !state.isTelemetryVisible;
  if (btn) {
    btn.classList.toggle('active', state.isTelemetryVisible);
    btn.textContent = state.isTelemetryVisible
      ? 'Panel de telemetría: ACTIVADO'
      : 'Panel de telemetría: DESACTIVADO';
  }
}

export function setStatus(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

export function showError(text) {
  console.error(text);
  const box = document.getElementById('errorBox');
  if (box) {
    box.style.display = 'block';
    box.textContent = text;
    setTimeout(() => { box.style.display = 'none'; }, 12000);
  }
}

export function showToast(message, type = 'info') {
  const area = document.getElementById('toastArea');
  if (!area) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  area.appendChild(toast);
  setTimeout(() => toast.remove(), 5200);
}

export function updateMapButtons() {
  document.querySelectorAll('[data-map]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.map === state.currentMapType);
  });
}

export function updateLayerButtons() {
  const clouds = document.getElementById('btnClouds');
  const borders = document.getElementById('btnBorders');
  const orbit = document.getElementById('btnOrbit');
  const nasa = document.getElementById('btnNasaTrajectory');
  const nightShadow = document.getElementById('btnNightShadow');
  const sunMoon = document.getElementById('btnSunMoon');

  if (clouds) {
    const available = state.currentMapType === 'satellite';
    clouds.classList.toggle('disabled', !available);
    clouds.classList.toggle('active', state.cloudsEnabled && available);
    clouds.textContent = available
      ? (state.cloudsEnabled ? 'Nubes: ACTIVADAS' : 'Nubes: DESACTIVADAS')
      : 'Nubes: NO DISPONIBLE';
  }
  if (borders) {
    borders.classList.toggle('active', state.showingBorders);
    borders.textContent = state.showingBorders ? 'Fronteras: ACTIVADAS' : 'Fronteras: DESACTIVADAS';
  }
  if (orbit) {
    orbit.classList.toggle('active', state.isOrbitVisible);
    orbit.textContent = state.isOrbitVisible ? 'Órbita TLE: ACTIVADA' : 'Órbita TLE: DESACTIVADA';
  }
  if (nasa) {
    nasa.classList.toggle('active', state.isNasaTrajectoryVisible);
    nasa.textContent = state.isNasaTrajectoryVisible ? 'Trayectoria NASA OEM: ACTIVADA' : 'Trayectoria NASA OEM: DESACTIVADA';
  }
  if (nightShadow) {
    nightShadow.classList.toggle('active', state.isNightShadowVisible);
    nightShadow.textContent = state.isNightShadowVisible ? 'Sombra día/noche: ACTIVADA' : 'Sombra día/noche: DESACTIVADA';
  }
  if (sunMoon) {
    sunMoon.classList.toggle('active', state.isSunMoonVisible);
    sunMoon.textContent = state.isSunMoonVisible ? 'Sol/Luna: ACTIVADO' : 'Sol/Luna: DESACTIVADO';
  }
  savePreferences();
}

export function updateDataStatus() {
  const el = document.getElementById('dataStatus');
  if (!el) return;
  const issOk = Boolean(state.issData);
  const tleOk = Boolean(state.tleSatrec);
  const oemOk = state.nasaOem.loaded;
  const oemLoading = state.nasaOem.loading;
  el.innerHTML = `
    <div><span class="status-dot ${issOk ? 'ok' : 'pending'}"></span>ISS: ${issOk ? escapeHtml(state.issData.sourceLabel || 'activa') : 'inicializando…'}</div>
    <div><span class="status-dot ${tleOk ? 'ok' : 'pending'}"></span>TLE: ${escapeHtml(state.tleSourceLabel || 'pendiente')}</div>
    <div><span class="status-dot ${oemOk ? 'ok' : (oemLoading ? 'pending' : 'warn')}"></span>NASA OEM: ${oemOk ? `${state.nasaOem.vectors.length} vectores` : (oemLoading ? 'cargando…' : escapeHtml(state.nasaOem.sourceLabel || 'pendiente'))}</div>
  `;
}

export function updateTelemetryPanel() {
  const readout = document.getElementById('issReadout');
  const grid = document.getElementById('telemetryGrid');
  const badge = document.getElementById('liveBadge');
  if (!readout || !grid || !badge) return;

  if (!state.issData) {
    readout.textContent = 'Cargando posición de la ISS…';
    badge.textContent = 'INICIANDO';
    badge.className = 'badge muted';
    grid.innerHTML = '';
    updateDataStatus();
    return;
  }

  const d = state.issData;
  const speed = Number.isFinite(d.velocityKmH) ? `${Math.round(d.velocityKmH).toLocaleString('es-ES')} km/h` : '—';
  const altitude = Number.isFinite(d.altitudeKm) ? `${Math.round(d.altitudeKm)} km` : '—';
  const visibility = d.visibilityLabel || '—';
  const over = d.overflight || 'Océano / sin país detectado';
  const moon = state.moonInfo ? `${state.moonInfo.phaseName} · ${Math.round(state.moonInfo.illumination * 100)}%` : '—';
  const celestial = [
    state.isNightShadowVisible ? 'sombra' : null,
    state.isSunMoonVisible ? 'Sol/Luna' : null
  ].filter(Boolean).join(' + ') || 'desactivado';

  readout.textContent = `ISS · lat ${d.lat.toFixed(3)} · lng ${d.lng.toFixed(3)} · alt ${Math.round(d.altitudeKm || 420)} km`;
  badge.textContent = d.sourceLabel?.includes('fallback') ? 'DEGRADADO' : 'LIVE';
  badge.className = d.sourceLabel?.includes('fallback') ? 'badge warn' : 'badge';

  grid.innerHTML = [
    telemetryItem('Altitud', altitude),
    telemetryItem('Velocidad', speed),
    telemetryItem('Visibilidad', visibility),
    telemetryItem('Sobrevuelo', over),
    telemetryItem('Órbita', '≈ 90 min'),
    telemetryItem('Inclinación', '51,6°'),
    telemetryItem('Luna', moon),
    telemetryItem('Capas celestes', celestial),
    telemetryItem('Fuente', d.sourceLabel || '—'),
    telemetryItem('Actualizado', d.updatedAt ? new Intl.DateTimeFormat('es-ES', { timeStyle: 'medium' }).format(d.updatedAt) : '—')
  ].join('');

  updateDataStatus();
}

function telemetryItem(label, value) {
  return `<div class="telemetry-item"><span class="telemetry-label">${escapeHtml(label)}</span><span class="telemetry-value" title="${escapeHtml(value)}">${escapeHtml(value)}</span></div>`;
}

export function renderPassResults(location, passes, minElevation, hoursAhead) {
  const result = document.getElementById('passResult');
  if (!result) return;
  result.hidden = false;

  if (!passes.length) {
    result.innerHTML = `No he encontrado pasos por encima de <b>${minElevation}°</b> sobre <b>${escapeHtml(location.name)}</b> en las próximas <b>${hoursAhead}</b> horas.`;
    return;
  }

  const rows = passes.map((pass, idx) => {
    const q = passQuality(pass.maxElevation);
    return `
      <tr>
        <td>${idx + 1}</td>
        <td>${formatDate(pass.start)}</td>
        <td>${formatDate(pass.maxTime)}</td>
        <td>${formatDate(pass.end)}</td>
        <td>${formatDuration(pass.end - pass.start)}</td>
        <td>${pass.maxElevation.toFixed(1)}°</td>
        <td>${escapeHtml(pass.direction)}</td>
        <td><span class="quality ${q.className}">${q.label}</span></td>
      </tr>
    `;
  }).join('');

  result.innerHTML = `
    <div class="pass-summary">
      <div><b>${escapeHtml(location.name)}</b></div>
      <div>Elevación mínima usada: <b>${minElevation}°</b> · Ventana: <b>${hoursAhead} h</b> · Resultados: <b>${passes.length}</b></div>
    </div>
    <div class="pass-table-wrap">
      <table class="pass-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Inicio</th>
            <th>Máximo</th>
            <th>Fin</th>
            <th>Duración</th>
            <th>Elevación</th>
            <th>Dirección</th>
            <th>Calidad</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}
