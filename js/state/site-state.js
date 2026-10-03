/**
 * GM ARCH TOOLS — Global Site State & Geographic Coordinate Engine (Iteration 06)
 * Author: Guru Murthy (GM)
 * Central reactive store for:
 *   - Active Site Identity (Location Name, City, Coordinates, WGS84 Reference)
 *   - Geodesic Boundary Geometry (Rectangles & Irregular Polygons)
 *   - Geodesic Metric Projections (3D Scene coordinates: -Z=North, +X=East)
 *   - Geodesic Calculations: Haversine distance, Geodesic Area, Dimensions
 *   - Cross-module synchronization (Map Workspace ↔ 3D Viewport ↔ 10 Site Topics)
 */

export const EARTH_RADIUS_METRES = 6371008.8; // WGS 84 mean radius

/**
 * Calculates geodesic distance between two {lat, lng} coordinates using Haversine formula
 * @param {{lat: number, lng: number}} p1 
 * @param {{lat: number, lng: number}} p2 
 * @returns {number} Distance in metres
 */
export function haversineDistance(p1, p2) {
  if (!p1 || !p2) return 0;
  const lat1 = (p1.lat * Math.PI) / 180;
  const lat2 = (p2.lat * Math.PI) / 180;
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METRES * c;
}

/**
 * Calculates geodesic area of a closed polygon on the sphere (WGS84)
 * @param {Array<{lat: number, lng: number}>} coords 
 * @returns {number} Area in square metres
 */
export function calculateGeodesicPolygonArea(coords) {
  if (!coords || coords.length < 3) return 0;
  let total = 0;
  const n = coords.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const lat1 = (coords[i].lat * Math.PI) / 180;
    const lat2 = (coords[j].lat * Math.PI) / 180;
    const lng1 = (coords[i].lng * Math.PI) / 180;
    const lng2 = (coords[j].lng * Math.PI) / 180;

    total += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  return Math.abs((total * EARTH_RADIUS_METRES * EARTH_RADIUS_METRES) / 2);
}

/**
 * Projects an array of geographic {lat, lng} coordinates into 3D metric coordinates
 * centered at (0, 0) with architectural orientation:
 *   -X = West, +X = East
 *   -Z = North, +Z = South (Standard Three.js coordinate system where -Z points forward/North)
 * 
 * @param {Array<{lat: number, lng: number}>} geoPoints 
 * @param {number} centerLat 
 * @param {number} centerLng 
 * @returns {Array<{x: number, z: number, lat: number, lng: number}>}
 */
export function convertGeoToLocal3D(geoPoints, centerLat, centerLng) {
  if (!geoPoints || geoPoints.length === 0) return [];

  // Compute centroid if not provided
  if (typeof centerLat !== 'number' || typeof centerLng !== 'number') {
    centerLat = geoPoints.reduce((sum, p) => sum + p.lat, 0) / geoPoints.length;
    centerLng = geoPoints.reduce((sum, p) => sum + p.lng, 0) / geoPoints.length;
  }

  const radLat0 = (centerLat * Math.PI) / 180;

  return geoPoints.map(p => {
    const dLat = ((p.lat - centerLat) * Math.PI) / 180;
    const dLng = ((p.lng - centerLng) * Math.PI) / 180;

    // Metric projection
    const x = dLng * Math.cos(radLat0) * EARTH_RADIUS_METRES;
    // In Three.js: -Z is North, so positive latitude (North of center) becomes negative Z
    const z = -dLat * EARTH_RADIUS_METRES;

    return {
      x,
      z,
      lat: p.lat,
      lng: p.lng
    };
  });
}

/**
 * Formats square metres into human readable metric and imperial strings
 * @param {number} sqM 
 * @returns {{ sqMeters: string, acres: string, sqFt: string }}
 */
export function formatArea(sqM) {
  if (!sqM || sqM <= 0) {
    return { sqMeters: '0 m²', acres: '0.00 Acres', sqFt: '0 sq ft' };
  }
  const acres = sqM / 4046.8564224;
  const sqFt = sqM * 10.7639104167;

  return {
    sqMeters: `${Math.round(sqM).toLocaleString('en-US')} m²`,
    acres: `${acres.toFixed(2)} Acres`,
    sqFt: `${Math.round(sqFt).toLocaleString('en-US')} sq ft`
  };
}

/**
 * Intelligent Coordinate String Parser
 * Accepts: "13.0827, 80.2707", "13.0827,80.2707", "13.0827 N, 80.2707 E", etc.
 * @param {string} input 
 * @returns {{ isValid: boolean, lat?: number, lng?: number, error?: string }}
 */
export function parseCoordinates(input) {
  if (!input || typeof input !== 'string') {
    return { isValid: false, error: 'Empty coordinate input.' };
  }

  const trimmed = input.trim();
  // Standard decimal format: 13.0827, 80.2707 or 13.0827 -80.2707
  const decimalMatch = trimmed.match(/^([-+]?\d{1,2}(?:\.\d+)?)\s*[,;\s]\s*([-+]?\d{1,3}(?:\.\d+)?)$/);
  if (decimalMatch) {
    const lat = parseFloat(decimalMatch[1]);
    const lng = parseFloat(decimalMatch[2]);

    if (lat < -90 || lat > 90) {
      return { isValid: false, error: 'Latitude must be between -90 and 90 degrees.' };
    }
    if (lng < -180 || lng > 180) {
      return { isValid: false, error: 'Longitude must be between -180 and 180 degrees.' };
    }

    return { isValid: true, lat, lng };
  }

  // Directional format: 13.0827 N, 80.2707 E
  const dirMatch = trimmed.match(/^(\d{1,2}(?:\.\d+)?)\s*([NSns])\s*[,;\s]\s*(\d{1,3}(?:\.\d+)?)\s*([EWew])$/);
  if (dirMatch) {
    let lat = parseFloat(dirMatch[1]);
    let lng = parseFloat(dirMatch[3]);
    if (dirMatch[2].toUpperCase() === 'S') lat = -lat;
    if (dirMatch[4].toUpperCase() === 'W') lng = -lng;

    if (lat < -90 || lat > 90) return { isValid: false, error: 'Latitude out of range (-90 to 90).' };
    if (lng < -180 || lng > 180) return { isValid: false, error: 'Longitude out of range (-180 to 180).' };

    return { isValid: true, lat, lng };
  }

  return { isValid: false, error: 'Not recognized as coordinates format.' };
}

/**
 * SiteStateManager Singleton
 */
class SiteStateManager {
  constructor() {
    this.storageKey = 'gm_arch_tools_active_site_v6_2';
    this.listeners = new Set();

    // Default Site: Adhiyamaan College of Engineering, Hosur, Tamil Nadu, India
    this.site = {
      isImported: true,
      locationName: 'Adhiyamaan College of Engineering, Hosur, Tamil Nadu, India',
      city: 'Hosur',
      state: 'Tamil Nadu',
      country: 'India',
      latitude: 12.7152,
      longitude: 77.8678,
      boundaryType: 'RECTANGLE', // 'RECTANGLE' | 'POLYGON' | 'NONE'
      boundaryGeo: [
        { lat: 12.7161, lng: 77.8669 },
        { lat: 12.7161, lng: 77.8687 },
        { lat: 12.7143, lng: 77.8687 },
        { lat: 12.7143, lng: 77.8669 }
      ],
      boundary3D: [
        { x: -25, z: -20, lat: 12.7161, lng: 77.8669 },
        { x: 25, z: -20, lat: 12.7161, lng: 77.8687 },
        { x: 25, z: 20, lat: 12.7143, lng: 77.8687 },
        { x: -25, z: 20, lat: 12.7143, lng: 77.8669 }
      ],
      dimensions: {
        widthMetres: 200,
        lengthMetres: 200
      },
      areaSqMeters: 40000,
      areaAcres: 9.88,
      areaSqFt: 430556,
      coordinateReference: 'WGS 84 (EPSG:4326)',
      importTimestamp: new Date().toISOString(),
      sourceAttribution: 'GM Architectural Geodesic Engine & OpenStreetMap / Esri'
    };

    this.loadState();
  }

  loadState() {
    try {
      if (typeof sessionStorage === 'undefined') return;
      const saved = sessionStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
          this.site = { ...this.site, ...parsed };
        }
      }
    } catch (e) {
      console.warn('Could not restore site state from storage', e);
    }
  }

  saveState() {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(this.storageKey, JSON.stringify(this.site));
      }
    } catch (e) {
      console.warn('Could not persist site state', e);
    }
    this.notify();
  }

  getActiveSite() {
    return { ...this.site };
  }

  getLatitude() {
    return this.site.latitude;
  }

  getLongitude() {
    return this.site.longitude;
  }

  getLocationName() {
    return this.site.locationName;
  }

  /**
   * Set new active site data and notify subscribers
   * @param {Object} newSiteData 
   */
  setActiveSite(newSiteData) {
    if (!newSiteData) return;

    this.site = {
      ...this.site,
      ...newSiteData,
      isImported: true,
      importTimestamp: new Date().toISOString()
    };

    this.saveState();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    const copy = this.getActiveSite();
    this.listeners.forEach(fn => {
      try {
        fn(copy);
      } catch (err) {
        console.error('Error in SiteState listener', err);
      }
    });
  }
}

export const SiteState = new SiteStateManager();
