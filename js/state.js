export const state = {
  world: null,
  currentMapType: 'satellite',
  cloudsEnabled: false,
  showingBorders: false,
  isOrbitVisible: false,
  isNasaTrajectoryVisible: false,
  isNightShadowVisible: false,
  isSunMoonVisible: false,
  hasAutoCenteredOnIss: false,

  issData: null,
  tleSatrec: null,
  tleLoadedAt: 0,
  tleSourceLabel: 'pendiente',
  tleLines: null,

  nasaOem: {
    loaded: false,
    loading: false,
    loadedAt: 0,
    sourceLabel: 'pendiente',
    vectors: [],
    error: null
  },

  orbitPaths: [],
  nasaTrajectoryPaths: [],
  borderPaths: [],
  countryPolygons: [],
  dayNightPaths: [],
  nightPolygons: [],
  sunMarker: null,
  moonMarker: null,
  moonInfo: null,

  observerPoint: null,
  observerLabel: null,
  visibilityPaths: [],

  orbitTimer: null,
  issTimer: null,
  dayNightTimer: null,
  cameraRotateTimer: null,

  camera: {
    activeId: 'iss-live',
    rotating: false,
    minimized: false
  }
};
