import { CAMERAS, CAMERA_ROTATION_MS } from './config.js';
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
  makeCameraResizable();
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
