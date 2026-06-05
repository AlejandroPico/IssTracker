export const ISS_NORAD_ID = 25544;
export const EARTH_RADIUS_KM = 6371;
export const ORBIT_BACK_MINUTES = 46;
export const ORBIT_FORWARD_MINUTES = 46;
export const ORBIT_STEP_SECONDS = 30;
export const ORBIT_REFRESH_MS = 15000;
export const ISS_REFRESH_MS = 3000;
export const TLE_REFRESH_MS = 10 * 60 * 1000;
export const DAY_NIGHT_REFRESH_MS = 60 * 1000;
export const NASA_OEM_REFRESH_MS = 6 * 60 * 60 * 1000;
export const DEFAULT_MIN_VISIBLE_ELEVATION_DEG = 10;
export const DEFAULT_PASS_HOURS_AHEAD = 72;
export const MAX_PASSES_TO_SHOW = 8;

export const EMBEDDED_TLE = [
  '1 25544U 98067A   26139.48801487  .00005163  00000+0  10086-3 0  9993',
  '2 25544  51.6327  82.1724 0007543  75.4903 284.6922 15.49271759567301'
];

export const URLS = {
  wheretheissPosition: `https://api.wheretheiss.at/v1/satellites/${ISS_NORAD_ID}`,
  wheretheissTle: `https://api.wheretheiss.at/v1/satellites/${ISS_NORAD_ID}/tles`,
  celestrakTle: `https://celestrak.org/NORAD/elements/gp.php?CATNR=${ISS_NORAD_ID}&FORMAT=TLE`,
  nasaOemTxt: 'https://nasa-public-data.s3.amazonaws.com/iss-coords/current/ISS_OEM/ISS.OEM_J2K_EPH.txt',
  countriesGeoJson: 'https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson',
  openMeteoGeocode: 'https://geocoding-api.open-meteo.com/v1/search',
  issIcon: './assets/icons/iss.svg'
};

export const MAPS = {
  satellite: {
    label: 'Satélite',
    image: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
    bump: 'https://unpkg.com/three-globe/example/img/earth-topology.png',
    tileUrl: (x, y, z) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
    maxZoom: 23,
    status: 'Satélite activo. Nubes disponibles en este modo.',
    attribution: 'Esri World Imagery · NASA Blue Marble · Globe.gl'
  },
  political: {
    label: 'Político',
    image: 'https://unpkg.com/three-globe/example/img/earth-water.png',
    bump: 'https://unpkg.com/three-globe/example/img/earth-topology.png',
    tileUrl: (x, y, z) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${z}/${y}/${x}`,
    maxZoom: 23,
    status: 'Mapa político/callejero activo.',
    attribution: 'Esri World Street Map · Natural Earth · Globe.gl'
  },
  relief: {
    label: 'Relieve',
    image: 'https://unpkg.com/three-globe/example/img/earth-topology.png',
    bump: 'https://unpkg.com/three-globe/example/img/earth-topology.png',
    tileUrl: (x, y, z) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${z}/${y}/${x}`,
    maxZoom: 18,
    status: 'Relieve/topográfico activo.',
    attribution: 'Esri World Topographic Map · Globe.gl'
  },
  night: {
    label: 'Nocturno',
    image: 'https://unpkg.com/three-globe/example/img/earth-night.jpg',
    bump: 'https://unpkg.com/three-globe/example/img/earth-topology.png',
    tileUrl: null,
    maxZoom: 8,
    status: 'Mapa nocturno activo. Textura global de luces nocturnas.',
    attribution: 'Earth night texture · Globe.gl'
  }
};

export const CLOUD_TEXTURE_URL = 'https://clouds.matteason.co.uk/images/8192x4096/earth.jpg';

export const CAMERAS = [
  {
    id: 'iss-live',
    label: 'ISS Live',
    videoId: 'uwXgcTc8oY8',
    description: 'Vídeo oficial NASA desde la Estación Espacial Internacional.'
  },
  {
    id: 'earth-hd',
    label: 'Earth HD',
    videoId: 'FuuC4dpSQ1M',
    description: 'Vistas HD de la Tierra desde una cámara externa de la ISS.'
  },
  {
    id: 'nasa-live',
    label: 'NASA Live',
    videoId: 'P11y8N22Rq0',
    description: 'Canal en directo de NASA para eventos y programación.'
  }
];
