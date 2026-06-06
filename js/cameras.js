import { CAMERAS } from './config.js';
import { state } from './state.js';
import { savePreferences } from './storage.js';

export function initCameras() {
  const tabs = document.getElementById('cameraTabs');
  if (!tabs) return;
  tabs.innerHTML = CAMERAS.map(cam => `<button type="button" data-camera="${cam.id}" title="${cam.description}">${cam.label}</button>`).join('');
  tabs.querySelectorAll('[data-camera]').forEach(btn => {
    btn.addEventListener('click', ev => {
      ev.stopPropagation();
      selectCamera(btn.dataset.camera);
    });
  });

  bind('btnOpenCameras', 'click', openCameraPanel);
  bind('btnCameraClose', 'click', closeCameraPanel);
  bind('btnCameraMinimize', 'click', toggleCameraMinimized);
  bind('btnCameraRotate', 'click', toggleCameraRotation);
  makeCameraDraggable();
  selectCamera(state.camera.activeId || CAMERAS[0].id, false);
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
    state.cameraRotateTimer = setInterval(selectNextCamera, 45000);
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

function selectCamera(id, persist = true) {
  const camera = CAMERAS.find(c => c.id === id) || CAMERAS[0];
  state.camera.activeId = camera.id;
  const frame = document.getElementById('cameraFrame');
  if (frame) {
    frame.src = `https://www.youtube.com/embed/${camera.videoId}?autoplay=1&mute=1&controls=1&rel=0&playsinline=1&enablejsapi=1`;
  }
  document.querySelectorAll('[data-camera]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.camera === camera.id);
  });
  if (persist) savePreferences({ activeCameraId: camera.id });
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
