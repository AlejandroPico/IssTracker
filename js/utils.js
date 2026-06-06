import { EARTH_RADIUS_KM } from './config.js';

export function deg2rad(deg) { return deg * Math.PI / 180; }
export function rad2deg(rad) { return rad * 180 / Math.PI; }

export function normalizeLng(lng) {
  const value = ((lng + 180) % 360 + 360) % 360 - 180;
  return value === -180 ? 180 : value;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[ch]));
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'short',
    timeStyle: 'medium'
  }).format(date);
}

export function formatTime(date) {
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
}

export function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes} min ${String(seconds).padStart(2, '0')} s`;
}

export function rgbaFromHex(hex, alpha) {
  const clean = String(hex || '#ffffff').replace('#', '');
  const n = parseInt(clean, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function vectorMagnitude(vec) {
  if (!vec) return null;
  const x = Number(vec.x) || 0;
  const y = Number(vec.y) || 0;
  const z = Number(vec.z) || 0;
  return Math.sqrt(x * x + y * y + z * z);
}

export function splitAntimeridian(coords, type) {
  const segments = [];
  let current = [];
  for (let i = 0; i < coords.length; i++) {
    if (i > 0 && Math.abs(coords[i].lng - coords[i - 1].lng) > 180) {
      if (current.length > 1) segments.push({ type, coords: current });
      current = [];
    }
    current.push(coords[i]);
  }
  if (current.length > 1) segments.push({ type, coords: current });
  return segments;
}

export function circleCoords(latDeg, lngDeg, radiusKm, steps = 160, alt = 0.018) {
  const angular = radiusKm / EARTH_RADIUS_KM;
  const lat1 = deg2rad(latDeg);
  const lon1 = deg2rad(lngDeg);
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const bearing = 2 * Math.PI * i / steps;
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angular) +
      Math.cos(lat1) * Math.sin(angular) * Math.cos(bearing)
    );
    const lon2 = lon1 + Math.atan2(
      Math.sin(bearing) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2)
    );
    out.push({ lat: rad2deg(lat2), lng: normalizeLng(rad2deg(lon2)), alt });
  }
  return out;
}

export function circleRingLngLat(latDeg, lngDeg, radiusKm, steps = 220) {
  return circleCoords(latDeg, lngDeg, radiusKm, steps, 0).map(p => [p.lng, p.lat]);
}

export function azimuthToCompass(deg) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  const index = Math.round((((deg % 360) + 360) % 360) / 45) % 8;
  return directions[index];
}

export function passQuality(maxElevation) {
  if (maxElevation >= 60) return { label: 'Excelente', className: 'high' };
  if (maxElevation >= 30) return { label: 'Buena', className: 'medium' };
  return { label: 'Baja', className: 'low' };
}

export function throttle(fn, waitMs) {
  let waiting = false;
  let lastArgs = null;
  return function throttled(...args) {
    lastArgs = args;
    if (waiting) return;
    waiting = true;
    setTimeout(() => {
      waiting = false;
      fn(...lastArgs);
    }, waitMs);
  };
}

export function interpolateGeoPoints(a, b, steps = 6) {
  if (!a || !b || steps <= 1) return [a, b].filter(Boolean);
  const lat1 = deg2rad(a.lat);
  const lon1 = deg2rad(a.lng);
  const lat2 = deg2rad(b.lat);
  const lon2 = deg2rad(b.lng);

  const p1 = [Math.cos(lat1) * Math.cos(lon1), Math.cos(lat1) * Math.sin(lon1), Math.sin(lat1)];
  const p2 = [Math.cos(lat2) * Math.cos(lon2), Math.cos(lat2) * Math.sin(lon2), Math.sin(lat2)];
  const dot = Math.max(-1, Math.min(1, p1[0] * p2[0] + p1[1] * p2[1] + p1[2] * p2[2]));
  const omega = Math.acos(dot);
  const sinOmega = Math.sin(omega);
  const out = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    let x; let y; let z;
    if (sinOmega < 1e-8) {
      x = p1[0] * (1 - t) + p2[0] * t;
      y = p1[1] * (1 - t) + p2[1] * t;
      z = p1[2] * (1 - t) + p2[2] * t;
    } else {
      const k1 = Math.sin((1 - t) * omega) / sinOmega;
      const k2 = Math.sin(t * omega) / sinOmega;
      x = p1[0] * k1 + p2[0] * k2;
      y = p1[1] * k1 + p2[1] * k2;
      z = p1[2] * k1 + p2[2] * k2;
    }
    const norm = Math.sqrt(x * x + y * y + z * z) || 1;
    x /= norm; y /= norm; z /= norm;
    out.push({
      lat: rad2deg(Math.asin(z)),
      lng: normalizeLng(rad2deg(Math.atan2(y, x))),
      alt: a.alt ?? b.alt ?? 0.1
    });
  }
  return out;
}

export function pointInRing(point, ring) {
  const x = point.lng;
  const y = point.lat;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-12) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function pointInPolygonFeature(lat, lng, feature) {
  if (!feature || !feature.geometry) return false;
  const point = { lat, lng };
  const geom = feature.geometry;
  if (geom.type === 'Polygon') {
    return polygonContainsPoint(point, geom.coordinates);
  }
  if (geom.type === 'MultiPolygon') {
    return geom.coordinates.some(poly => polygonContainsPoint(point, poly));
  }
  return false;
}

function polygonContainsPoint(point, rings) {
  if (!rings || !rings.length) return false;
  if (!pointInRing(point, rings[0])) return false;
  for (let i = 1; i < rings.length; i++) {
    if (pointInRing(point, rings[i])) return false;
  }
  return true;
}
