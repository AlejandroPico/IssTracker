import { CAMERAS, CAMERA_ROTATION_MS } from './config.js';
import { state } from './state.js';
import { savePreferences } from './storage.js';

let youtubeApiPromise = null;
let cameraPlayer = null;
let playerReady = false;
let pendingCamera = null;
let failoverTimer = null;
const failedCameraIds = new Set();

export function initCameras() {
  const tabs = document.getElementById('cameraTabs');
  if (!tabs) return;
  tabs.innerHTML = CAMERAS.map(cam => `
    <button type="button" data-camera="${cam.id}" title="${cam.provider}: ${cam.description}">
      ${cam.label}
    </button>
  `).join('');
  tabs.querySelectorAll('[data-camera]').forEach(btn => {
    btn.addEventListener('click', ev => {
      ev.stopPropagation();
      failedCameraIds.clear();
      selectCamera(btn.dataset.camera);
    });
  });

  bind('btnOpenCameras', 'click', openCameraPanel);
  bind('btnCameraClose', 'click', closeCameraPanel);
  bind('btnCameraMinimize', 'click', toggleCameraMinimized);
  bind('btnCameraRotate', 'click', toggleCameraRotation);
  bind('btnCameraNext', 'click', ev => {
    ev.stopPropagation();
    failedCameraIds.clear();
    selectNextCamera();
  });
  makeCameraDraggable();
  makeCameraResizable();
  selectCamera(state.camera.activeId || CAMERAS[0].id, false, false);
}

function bind(id, event, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener(event, handler);
}

export function openCameraPanel() {
  const panel = document.getElementById('cameraPanel');
  if (!panel) return;
  panel.hidden = false;
  panel.classList.toggle('minimized', state.camera.minimized);
  selectCamera(state.camera.activeId || CAMERAS[0].id, false);
  document.getElementById('sideMenu')?.classList.remove('open');
}

function closeCameraPanel() {
  const panel = document.getElementById('cameraPanel');
  if (panel) panel.hidden = true;
  try {
    cameraPlayer?.pauseVideo?.();
  } catch (err) {
    console.warn('No se pudo pausar la cámara:', err);
  }
  stopCameraRotation();
}

function toggleCameraMinimized(ev) {
  ev?.stopPropagation();
  state.camera.minimized = !state.camera.minimized;
  document.getElementById('cameraPanel')?.classList.toggle('minimized', state.camera.minimized);
}

function toggleCameraRotation(ev) {
  ev?.stopPropagation();
  state.camera.rotating = !state.camera.rotating;
  const btn = document.getElementById('btnCameraRotate');
  if (btn) btn.classList.toggle('active', state.camera.rotating);
  if (state.camera.rotating) {
    clearInterval(state.cameraRotateTimer);
    state.cameraRotateTimer = setInterval(selectNextCamera, CAMERA_ROTATION_MS);
  } else {
    stopCameraRotation();
  }
}

function stopCameraRotation() {
  state.camera.rotating = false;
  clearInterval(state.cameraRotateTimer);
  const btn = document.getElementById('btnCameraRotate');
  if (btn) btn.classList.remove('active');
}

function selectNextCamera() {
  const idx = CAMERAS.findIndex(c => c.id === state.camera.activeId);
  const next = CAMERAS[(idx + 1) % CAMERAS.length];
  selectCamera(next.id);
}

function selectCamera(id, persist = true, loadVideo = true) {
  const camera = CAMERAS.find(c => c.id === id) || CAMERAS[0];
  clearTimeout(failoverTimer);
  state.camera.activeId = camera.id;
  pendingCamera = camera;
  updateCameraDetails(camera);
  document.querySelectorAll('[data-camera]').forEach(btn => {
    const active = btn.dataset.camera === camera.id;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
  if (persist) savePreferences({ activeCameraId: camera.id });
  if (loadVideo) loadCameraVideo(camera);
}

function loadCameraVideo(camera) {
  setCameraStatus('loading', 'Conectando con la señal…');
  setCameraLoading(true, `Conectando con ${camera.provider}…`);

  loadYouTubeApi()
    .then(() => {
      if (!cameraPlayer) {
        createCameraPlayer(pendingCamera || camera);
        return;
      }
      if (!playerReady) return;
      playCamera(pendingCamera || camera);
    })
    .catch(err => {
      console.warn('No se pudo iniciar la API de YouTube; se usa el reproductor básico:', err);
      loadBasicEmbed(pendingCamera || camera);
    });
}

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    const timeout = window.setTimeout(() => reject(new Error('Tiempo de espera agotado')), 15000);

    window.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timeout);
      previousReady?.();
      resolve(window.YT);
    };

    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (existing) return;

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error('No se pudo descargar el reproductor'));
    };
    document.head.appendChild(script);
  });

  return youtubeApiPromise;
}

function createCameraPlayer(camera) {
  const playerVars = {
    autoplay: 1,
    mute: 1,
    controls: 1,
    rel: 0,
    playsinline: 1,
    modestbranding: 1,
    iv_load_policy: 3
  };
  if (location.protocol === 'http:' || location.protocol === 'https:') {
    playerVars.origin = location.origin;
  }

  cameraPlayer = new window.YT.Player('cameraFrame', {
    host: 'https://www.youtube-nocookie.com',
    videoId: camera.videoId,
    playerVars,
    events: {
      onReady: event => {
        playerReady = true;
        const selected = pendingCamera || camera;
        if (selected.videoId !== camera.videoId) {
          playCamera(selected);
          return;
        }
        event.target.mute();
        event.target.playVideo();
      },
      onStateChange: handlePlayerState,
      onError: handlePlayerError
    }
  });
}

function playCamera(camera) {
  try {
    cameraPlayer.loadVideoById(camera.videoId);
    cameraPlayer.mute();
    cameraPlayer.playVideo();
  } catch (err) {
    console.warn('No se pudo cambiar la señal:', err);
    handleUnavailableCamera('No se pudo cargar esta señal');
  }
}

function handlePlayerState(event) {
  const playerState = window.YT?.PlayerState;
  if (!playerState) return;

  if (event.data === playerState.PLAYING) {
    failedCameraIds.delete(state.camera.activeId);
    setCameraLoading(false);
    setCameraStatus('live', 'En reproducción');
  } else if (event.data === playerState.BUFFERING || event.data === playerState.CUED) {
    setCameraLoading(true, 'Sincronizando emisión…');
    setCameraStatus('loading', 'Sincronizando emisión…');
  } else if (event.data === playerState.ENDED) {
    handleUnavailableCamera('La emisión ha finalizado');
  }
}

function handlePlayerError(event) {
  const messages = {
    2: 'El enlace de la emisión no es válido',
    5: 'El navegador no puede reproducir esta señal',
    100: 'La emisión ya no está disponible',
    101: 'El proveedor no permite integrar esta señal',
    150: 'El proveedor no permite integrar esta señal',
    153: 'YouTube no pudo verificar el reproductor integrado'
  };
  handleUnavailableCamera(messages[event.data] || 'No se pudo reproducir esta señal');
}

function handleUnavailableCamera(message) {
  failedCameraIds.add(state.camera.activeId);
  setCameraLoading(true, `${message}. Buscando alternativa…`);
  setCameraStatus('error', message);

  const next = CAMERAS.find(cam => !failedCameraIds.has(cam.id));
  if (!next) {
    setCameraLoading(true, 'No hay una señal reproducible ahora mismo. Puedes abrir la fuente original o reintentarlo más tarde.');
    setCameraStatus('error', 'Todas las señales han rechazado la conexión');
    return;
  }

  failoverTimer = window.setTimeout(() => selectCamera(next.id, true), 1600);
}

function loadBasicEmbed(camera) {
  const mount = document.getElementById('cameraFrame');
  if (!mount) return;
  mount.innerHTML = `<iframe
    title="${camera.provider}: ${camera.label}"
    src="https://www.youtube-nocookie.com/embed/${camera.videoId}?autoplay=1&mute=1&controls=1&rel=0&playsinline=1"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
    referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  setCameraLoading(false);
  setCameraStatus('warning', 'Modo compatible · cambia de señal si no responde');
}

function updateCameraDetails(camera) {
  const idx = CAMERAS.findIndex(cam => cam.id === camera.id);
  const name = document.getElementById('cameraSourceName');
  const position = document.getElementById('cameraSourcePosition');
  const description = document.getElementById('cameraSourceDescription');
  const link = document.getElementById('cameraSourceLink');

  if (name) name.textContent = `${camera.provider} · ${camera.quality}`;
  if (position) position.textContent = `${idx + 1}/${CAMERAS.length}`;
  if (description) description.textContent = camera.description;
  if (link) {
    link.href = camera.sourceUrl;
    link.setAttribute('aria-label', `Abrir la fuente original de ${camera.provider}`);
  }
}

function setCameraStatus(status, message) {
  const dot = document.getElementById('cameraStatusDot');
  if (dot) {
    dot.className = `camera-status-dot ${status}`;
    dot.title = message;
  }
}

function setCameraLoading(visible, message = '') {
  const loading = document.getElementById('cameraLoading');
  if (!loading) return;
  loading.hidden = !visible;
  if (message) loading.textContent = message;
}

function makeCameraDraggable() {
  const panel = document.getElementById('cameraPanel');
  const header = document.getElementById('cameraHeader');
  if (!panel || !header) return;

  let dragging = false;
  let pointerId = null;
  let offsetX = 0;
  let offsetY = 0;

  header.addEventListener('pointerdown', ev => {
    if (ev.button !== 0 || ev.target.closest('button')) return;
    dragging = true;
    pointerId = ev.pointerId;
    const rect = panel.getBoundingClientRect();
    offsetX = ev.clientX - rect.left;
    offsetY = ev.clientY - rect.top;
    header.setPointerCapture?.(ev.pointerId);
    ev.preventDefault();
  });

  header.addEventListener('pointermove', ev => {
    if (!dragging || ev.pointerId !== pointerId) return;
    movePanel(panel, ev.clientX - offsetX, ev.clientY - offsetY);
    ev.preventDefault();
  });

  const endDrag = ev => {
    if (pointerId !== null && ev.pointerId !== pointerId) return;
    dragging = false;
    if (pointerId !== null) header.releasePointerCapture?.(pointerId);
    pointerId = null;
  };

  header.addEventListener('pointerup', endDrag);
  header.addEventListener('pointercancel', endDrag);
  header.addEventListener('lostpointercapture', () => {
    dragging = false;
    pointerId = null;
  });
}


function makeCameraResizable() {
  const panel = document.getElementById('cameraPanel');
  if (!panel) return;

  const corners = ['nw', 'ne', 'sw', 'se'];
  corners.forEach(corner => {
    if (panel.querySelector(`[data-resize-corner="${corner}"]`)) return;
    const handle = document.createElement('div');
    handle.className = `camera-resize-handle camera-resize-${corner}`;
    handle.dataset.resizeCorner = corner;
    handle.setAttribute('aria-hidden', 'true');
    panel.appendChild(handle);
    bindResizeHandle(panel, handle, corner);
  });
}

function bindResizeHandle(panel, handle, corner) {
  const minWidth = 320;
  const minHeight = 220;
  const margin = 8;
  let start = null;

  handle.addEventListener('pointerdown', ev => {
    if (ev.button !== 0) return;
    const rect = panel.getBoundingClientRect();
    start = {
      pointerId: ev.pointerId,
      x: ev.clientX,
      y: ev.clientY,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      right: rect.right,
      bottom: rect.bottom
    };
    panel.style.left = `${rect.left}px`;
    panel.style.top = `${rect.top}px`;
    panel.style.right = 'auto';
    panel.style.width = `${rect.width}px`;
    panel.style.height = `${rect.height}px`;
    handle.setPointerCapture?.(ev.pointerId);
    ev.preventDefault();
    ev.stopPropagation();
  });

  handle.addEventListener('pointermove', ev => {
    if (!start || ev.pointerId !== start.pointerId) return;

    const dx = ev.clientX - start.x;
    const dy = ev.clientY - start.y;
    const maxWidth = Math.max(minWidth, window.innerWidth - margin * 2);
    const maxHeight = Math.max(minHeight, window.innerHeight - margin * 2);

    let left = start.left;
    let top = start.top;
    let width = start.width;
    let height = start.height;

    if (corner.includes('e')) {
      width = clamp(start.width + dx, minWidth, maxWidth - start.left + margin);
    }
    if (corner.includes('s')) {
      height = clamp(start.height + dy, minHeight, maxHeight - start.top + margin);
    }
    if (corner.includes('w')) {
      const proposedLeft = clamp(start.left + dx, margin, start.right - minWidth);
      left = proposedLeft;
      width = clamp(start.right - proposedLeft, minWidth, maxWidth);
    }
    if (corner.includes('n')) {
      const proposedTop = clamp(start.top + dy, margin, start.bottom - minHeight);
      top = proposedTop;
      height = clamp(start.bottom - proposedTop, minHeight, maxHeight);
    }

    if (left + width > window.innerWidth - margin) width = window.innerWidth - margin - left;
    if (top + height > window.innerHeight - margin) height = window.innerHeight - margin - top;

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
    panel.style.width = `${Math.max(minWidth, width)}px`;
    panel.style.height = `${Math.max(minHeight, height)}px`;
    ev.preventDefault();
    ev.stopPropagation();
  });

  const endResize = ev => {
    if (!start || ev.pointerId !== start.pointerId) return;
    handle.releasePointerCapture?.(start.pointerId);
    start = null;
  };

  handle.addEventListener('pointerup', endResize);
  handle.addEventListener('pointercancel', endResize);
  handle.addEventListener('lostpointercapture', () => { start = null; });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function movePanel(panel, left, top) {
  const rect = panel.getBoundingClientRect();
  const margin = 8;
  const maxLeft = Math.max(margin, window.innerWidth - Math.min(rect.width, window.innerWidth - margin * 2) - margin);
  const maxTop = Math.max(margin, window.innerHeight - Math.min(rect.height, window.innerHeight - margin * 2) - margin);
  const x = Math.max(margin, Math.min(maxLeft, left));
  const y = Math.max(margin, Math.min(maxTop, top));
  panel.style.left = `${x}px`;
  panel.style.top = `${y}px`;
  panel.style.right = 'auto';
}
