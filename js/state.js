export const state = {
  world: null,
  currentMapType: 'satellite',
  cloudsEnabled: false,
  showingBorders: false,
  isOrbitVisible: false,
  isNasaTrajectoryVisible: false,
  isNightShadowVisible: false,
  isSunMoonVisible: false,
  isTelemetryVisible: true,
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
  observerMarker: null,
  observerVerticalPath: null,
  visibilityPaths: [],
  visiblePasses: [],
  visiblePassLocation: null,
  visiblePassMinElevation: 10,
  selectedVisiblePassIndex: 0,
  visiblePassPage: 0,

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
