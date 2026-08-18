import { state } from './state.js';
import { DEFAULT_PASS_HOURS_AHEAD, DEFAULT_MIN_VISIBLE_ELEVATION_DEG, PASS_RESULTS_PAGE_SIZE } from './config.js';
import { escapeHtml, formatDate, formatDuration, passQuality } from './utils.js';
import { savePreferences } from './storage.js';
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
  bind('btnOpenAbout', 'click', () => openModal('aboutModal'));
  bind('btnCalculatePasses', 'click', calculateVisiblePasses);

  document.querySelectorAll('[data-map]').forEach(btn => {
    btn.addEventListener('click', () => changeMapType(btn.dataset.map));
  });
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', closeModals);
  });
  document.getElementById('aboutModal')?.addEventListener('click', event => {
    if (event.target === event.currentTarget) closeModals();
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
  if (modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    modal.querySelector('button, a, input')?.focus();
  }
  document.getElementById('sideMenu')?.classList.remove('open');
}

export function closeModals() {
  document.querySelectorAll('.modal, .about-modal').forEach(modal => {
    modal.classList.remove('active');
    if (modal.classList.contains('about-modal')) modal.setAttribute('aria-hidden', 'true');
  });
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
    btn.setAttribute('aria-pressed', String(state.isTelemetryVisible));
    btn.textContent = 'Telemetría';
  }
}

export function setStatus(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

export function showError(text) {
  console.error(text);
  updateDataStatus();
}

export function showToast() {
  // Sin notificaciones visuales ni emergentes: la interfaz se mantiene limpia.
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
    clouds.setAttribute('aria-pressed', String(state.cloudsEnabled && available));
    clouds.textContent = 'Nubes';
    clouds.title = available ? 'Capa de nubes disponible en modo Satélite.' : 'Disponible solo en modo Satélite.';
  }
  if (borders) {
    borders.classList.toggle('active', state.showingBorders);
    borders.setAttribute('aria-pressed', String(state.showingBorders));
    borders.textContent = 'Fronteras';
  }
  if (orbit) {
    orbit.classList.toggle('active', state.isOrbitVisible);
    orbit.setAttribute('aria-pressed', String(state.isOrbitVisible));
    orbit.textContent = 'Órbita TLE';
  }
  if (nasa) {
    nasa.classList.toggle('active', state.isNasaTrajectoryVisible);
    nasa.setAttribute('aria-pressed', String(state.isNasaTrajectoryVisible));
    nasa.textContent = 'NASA OEM';
  }
  if (nightShadow) {
    nightShadow.classList.toggle('active', state.isNightShadowVisible);
    nightShadow.setAttribute('aria-pressed', String(state.isNightShadowVisible));
    nightShadow.textContent = 'Sombra';
  }
  if (sunMoon) {
    sunMoon.classList.toggle('active', state.isSunMoonVisible);
    sunMoon.setAttribute('aria-pressed', String(state.isSunMoonVisible));
    sunMoon.textContent = 'Sol/Luna';
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

  const issDetail = issOk
    ? `ISS operativa · ${state.issData.sourceLabel || 'fuente activa'}`
    : 'ISS: inicializando posición en tiempo real.';
  const tleDetail = tleOk
    ? `TLE operativo · ${state.tleSourceLabel || 'fuente activa'}`
    : 'TLE: pendiente de carga.';
  const oemDetail = oemOk
    ? `NASA OEM operativo · ${state.nasaOem.vectors.length} vectores · ${state.nasaOem.sourceLabel || 'fuente activa'}`
    : (oemLoading
      ? 'NASA OEM: cargando trayectoria oficial.'
      : `NASA OEM: ${state.nasaOem.error || state.nasaOem.sourceLabel || 'pendiente de carga.'}`);

  el.innerHTML = `
    <div class="data-chip" title="${escapeHtml(issDetail)}"><span class="status-dot ${issOk ? 'ok' : 'pending'}"></span><span>ISS</span></div>
    <div class="data-chip" title="${escapeHtml(tleDetail)}"><span class="status-dot ${tleOk ? 'ok' : 'pending'}"></span><span>TLE</span></div>
    <div class="data-chip" title="${escapeHtml(oemDetail)}"><span class="status-dot ${oemOk ? 'ok' : (oemLoading ? 'pending' : 'warn')}"></span><span>NASA OEM</span></div>
  `;
}

export function updateTelemetryPanel() {
  const grid = document.getElementById('telemetryGrid');
  if (!grid) return;

  if (!state.issData) {
    grid.innerHTML = telemetryItem('Estado', 'Inicializando…');
    updateDataStatus();
    return;
  }

  const d = state.issData;
  const lat = Number.isFinite(d.lat) ? `${d.lat.toFixed(3)}°` : '—';
  const lng = Number.isFinite(d.lng) ? `${d.lng.toFixed(3)}°` : '—';
  const altitude = Number.isFinite(d.altitudeKm) ? `${Math.round(d.altitudeKm)} km` : '—';
  const speed = Number.isFinite(d.velocityKmH) ? `${Math.round(d.velocityKmH).toLocaleString('es-ES')} km/h` : '—';
  const visibility = d.visibilityLabel || '—';
  const over = d.overflight || 'Océano / sin país detectado';

  grid.innerHTML = [
    telemetryItem('Latitud', lat),
    telemetryItem('Longitud', lng),
    telemetryItem('Altitud', altitude),
    telemetryItem('Velocidad', speed),
    telemetryItem('Visibilidad', visibility),
    telemetryItem('Sobrevuelo', over)
  ].join('');

  updateDataStatus();
}

function telemetryItem(label, value) {
  return `<div class="telemetry-item"><span class="telemetry-label">${escapeHtml(label)}</span><span class="telemetry-value" title="${escapeHtml(value)}">${escapeHtml(value)}</span></div>`;
}

export function renderPassResults(location, passes, minElevation, hoursAhead, selectedIndex = 0, page = 0) {
  const result = document.getElementById('passResult');
  if (!result) return;
  result.hidden = false;

  if (!passes.length) {
    result.innerHTML = `No he encontrado pasos por encima de <b>${minElevation}°</b> sobre <b>${escapeHtml(location.name)}</b> en las próximas <b>${hoursAhead}</b> horas.`;
    return;
  }

  const totalPages = Math.max(1, Math.ceil(passes.length / PASS_RESULTS_PAGE_SIZE));
  const safePage = Math.min(Math.max(Number(page) || 0, 0), totalPages - 1);
  const start = safePage * PASS_RESULTS_PAGE_SIZE;
  const visiblePasses = passes.slice(start, start + PASS_RESULTS_PAGE_SIZE);

  const rows = visiblePasses.map((pass, visibleIdx) => {
    const idx = start + visibleIdx;
    const q = passQuality(pass.maxElevation);
    const active = idx === selectedIndex ? ' selected' : '';
    return `
      <tr class="pass-row${active}" data-pass-index="${idx}" tabindex="0" role="button" aria-label="Mostrar paso ${idx + 1}">
        <td><button type="button" class="pass-number" data-pass-index="${idx}">${idx + 1}</button></td>
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

  const prevDisabled = safePage <= 0 ? ' disabled aria-disabled="true"' : '';
  const nextDisabled = safePage >= totalPages - 1 ? ' disabled aria-disabled="true"' : '';
  const pagination = totalPages > 1 ? `
    <div class="pass-pagination" aria-label="Paginación de pasos visibles">
      <button type="button" class="pass-page-btn" data-pass-page="${safePage - 1}"${prevDisabled} aria-label="Página anterior">‹</button>
      <span>${safePage + 1} / ${totalPages}</span>
      <button type="button" class="pass-page-btn" data-pass-page="${safePage + 1}"${nextDisabled} aria-label="Página siguiente">›</button>
    </div>
  ` : '';

  result.innerHTML = `
    <div class="pass-summary compact-pass-summary">
      <div><b>${escapeHtml(location.name)}</b> · ${passes.length} pasos · mín. ${minElevation}° · ${hoursAhead} h</div>
      <div>Selecciona una fila para representar ese paso sobre el globo.</div>
    </div>
    <div class="pass-table-wrap">
      <table class="pass-table selectable-pass-table">
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
    ${pagination}
  `;
}
