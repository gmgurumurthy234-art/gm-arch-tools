/**
 * GM ARCH TOOLS — Site Analysis Map Engine & Boundary Import (Iteration 06)
 * Author: Guru Murthy (GM)
 * Provides:
 *   - Normal, Satellite, Terrain, and Earth 3D map tile providers
 *   - Intelligent Location Search (Auto-detects Named Location vs Coordinates)
 *   - Geodesic Distance Measuring Tool (m, km, ft, mi)
 *   - Geodesic Rectangle Site Boundary Drawing Tool
 *   - Custom Geodesic Polyline / Polygon Site Boundary Drawing Tool
 *   - Active Site Info Panel & [ IMPORT TO 3D VIEWPORT ] / [ UPDATE SITE ]
 *   - Optional Google Maps Platform API integration with in-app key configuration
 */

import {
  SiteState,
  haversineDistance,
  calculateGeodesicPolygonArea,
  convertGeoToLocal3D,
  formatArea,
  parseCoordinates
} from '../state/site-state.js';

export class SiteMapEngine {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.onSiteImported = options.onSiteImported || null;
    this.onCloseRequested = options.onCloseRequested || null;

    // Leaflet map instance
    this.map = null;
    this.activeLayerName = 'NORMAL'; // 'NORMAL' | 'SATELLITE' | 'TERRAIN' | 'EARTH'
    this.tileLayers = {};

    // Current Marker & Drawings
    this.locationMarker = null;
    this.drawnItemsGroup = null;

    // Drawing Tool States
    this.currentTool = 'NONE'; // 'NONE' | 'MEASURE' | 'RECTANGLE' | 'POLYLINE'
    this.measurePoints = [];
    this.measureLayer = null;

    this.rectStartPoint = null;
    this.rectLayer = null;
    this.rectPreviewLayer = null;

    this.polygonPoints = [];
    this.polygonLayer = null;
    this.polygonVertexMarkers = [];

    // Current Selected Site Data (pre-import preview)
    const initialSite = SiteState.getActiveSite();
    this.currentSite = {
      locationName: initialSite.locationName || 'Chennai, Tamil Nadu, India',
      lat: initialSite.latitude || 13.0827,
      lng: initialSite.longitude || 80.2707,
      boundaryType: initialSite.boundaryType || 'RECTANGLE',
      boundaryGeo: initialSite.boundaryGeo || [],
      areaSqMeters: initialSite.areaSqMeters || 2000,
      dimensions: initialSite.dimensions || { widthMetres: 50, lengthMetres: 40 },
      isImported: true
    };

    this.isEditMode = false;

    this.initMap();
    this.bindDomEvents();
    this.updateInfoPanel();
  }

  /* ==============================================================
     01. MAP INITIALIZATION & TILE PROVIDERS
     ============================================================== */
  initMap() {
    if (typeof L === 'undefined') {
      console.error('Leaflet is not loaded on window.L');
      return;
    }

    // Initialize Map with Chennai coordinates or saved site coordinates
    const startLat = this.currentSite.lat;
    const startLng = this.currentSite.lng;

    this.map = L.map(this.container, {
      center: [startLat, startLng],
      zoom: 16,
      zoomControl: false, // We use custom architectural zoom controls
      attributionControl: false
    });

    // Custom Architectural Tile Providers:
    // 1. NORMAL: CartoDB Voyager / OpenStreetMap (clean, high contrast, crisp linework)
    this.tileLayers.NORMAL = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; CartoDB &copy; OpenStreetMap contributors'
      }
    );

    // 2. SATELLITE: Esri World Imagery (high resolution aerial photography)
    this.tileLayers.SATELLITE = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      }
    );

    // 3. TERRAIN: OpenTopoMap (topographic contours and hillshade)
    this.tileLayers.TERRAIN = L.tileLayer(
      'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 17,
        attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)'
      }
    );

    // Set Default View
    this.tileLayers.NORMAL.addTo(this.map);

    // Feature group for drawn boundaries & measurements
    this.drawnItemsGroup = L.featureGroup().addTo(this.map);

    // Set Initial Marker
    this.updateLocationMarker(startLat, startLng, this.currentSite.locationName);

    // If site has boundary points, render them initially
    if (this.currentSite.boundaryGeo && this.currentSite.boundaryGeo.length >= 3) {
      this.renderExistingBoundary(this.currentSite.boundaryGeo, this.currentSite.boundaryType);
    }

    // Map Event Listeners
    this.map.on('click', (e) => this.handleMapClick(e));
    this.map.on('mousemove', (e) => this.handleMapMouseMove(e));
    this.map.on('dblclick', (e) => this.handleMapDblClick(e));
  }

  setLayer(layerName) {
    if (!this.map) return;
    if (layerName === 'EARTH') {
      this.showEarth3DModal();
      return;
    }

    if (!this.tileLayers[layerName]) return;

    // Remove active tile layer
    if (this.tileLayers[this.activeLayerName]) {
      this.map.removeLayer(this.tileLayers[this.activeLayerName]);
    }

    // Add new tile layer
    this.tileLayers[layerName].addTo(this.map);
    this.activeLayerName = layerName;

    // Update UI Switcher buttons
    const btns = document.querySelectorAll('.sa-map-view-btn');
    btns.forEach(b => {
      b.classList.toggle('active', b.dataset.layer === layerName);
    });

    // Update Data Attribution in UI
    const attrEl = document.getElementById('sa-map-data-source-text');
    if (attrEl) {
      if (layerName === 'SATELLITE') {
        attrEl.textContent = 'Esri World Imagery (Maxar / Earthstar Geographics / USGS)';
      } else if (layerName === 'TERRAIN') {
        attrEl.textContent = 'OpenTopoMap (SRTM Digital Elevation Model & Contours)';
      } else {
        attrEl.textContent = 'CartoDB Voyager / OpenStreetMap (WGS 84)';
      }
    }
  }

  showEarth3DModal() {
    const modal = document.getElementById('sa-map-earth-modal');
    if (modal) {
      modal.style.display = 'flex';
    }
  }

  hideEarth3DModal() {
    const modal = document.getElementById('sa-map-earth-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  /* ==============================================================
     02. INTELLIGENT SEARCH (COORDINATES VS NAMED LOCATION)
     ============================================================== */
  async handleSearch(queryText) {
    const searchStatus = document.getElementById('sa-map-search-status');
    const resultsDropdown = document.getElementById('sa-map-search-results');
    if (!queryText || !queryText.trim()) return;

    const query = queryText.trim();
    if (searchStatus) {
      searchStatus.textContent = 'Searching...';
      searchStatus.style.display = 'block';
      searchStatus.className = 'sa-map-search-status searching';
    }
    if (resultsDropdown) resultsDropdown.style.display = 'none';

    // 1. INTELLIGENT DETECTION: Check if coordinates
    const coordCheck = parseCoordinates(query);
    if (coordCheck.isValid) {
      if (searchStatus) {
        searchStatus.textContent = `Coordinates detected: ${coordCheck.lat.toFixed(4)}°, ${coordCheck.lng.toFixed(4)}°`;
        searchStatus.className = 'sa-map-search-status success';
      }
      await this.flyToCoordinates(coordCheck.lat, coordCheck.lng, `Coordinates (${coordCheck.lat.toFixed(4)}, ${coordCheck.lng.toFixed(4)})`);
      return;
    }

    // 2. NAMED LOCATION: Query OpenStreetMap Nominatim Geocoder API
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en' }
      });

      if (!res.ok) {
        throw new Error('Map geocoding service temporarily unavailable.');
      }

      const results = await res.json();

      if (!results || results.length === 0) {
        if (searchStatus) {
          searchStatus.textContent = 'Location not found. Please check spelling or enter coordinates (lat, lng).';
          searchStatus.className = 'sa-map-search-status error';
        }
        return;
      }

      if (results.length === 1) {
        // Single unambiguous match
        const first = results[0];
        const lat = parseFloat(first.lat);
        const lng = parseFloat(first.lon);
        if (searchStatus) {
          searchStatus.textContent = `Location matched: ${first.display_name.split(',')[0]}`;
          searchStatus.className = 'sa-map-search-status success';
        }
        await this.flyToCoordinates(lat, lng, first.display_name);
      } else {
        // Multiple matches -> show disambiguation dropdown (Section 7)
        if (searchStatus) {
          searchStatus.textContent = `Found ${results.length} locations. Select from list below:`;
          searchStatus.className = 'sa-map-search-status';
        }
        this.renderSearchResults(results);
      }
    } catch (err) {
      console.warn('Geocoding search error:', err);
      if (searchStatus) {
        searchStatus.textContent = 'Map service temporarily unavailable. You can enter exact coordinates (e.g. 13.0827, 80.2707).';
        searchStatus.className = 'sa-map-search-status error';
      }
    }
  }

  renderSearchResults(results) {
    const resultsDropdown = document.getElementById('sa-map-search-results');
    if (!resultsDropdown) return;

    resultsDropdown.innerHTML = results.map((r, idx) => {
      const parts = r.display_name.split(',');
      const title = parts[0] ? parts[0].trim() : r.display_name;
      const subtitle = parts.slice(1).join(',').trim();

      return `
        <div class="sa-map-result-item" data-idx="${idx}">
          <div class="sa-result-icon">📍</div>
          <div class="sa-result-info">
            <div class="sa-result-title">${title}</div>
            <div class="sa-result-sub">${subtitle}</div>
          </div>
        </div>
      `;
    }).join('');

    resultsDropdown.style.display = 'block';

    resultsDropdown.querySelectorAll('.sa-map-result-item').forEach(el => {
      el.onclick = () => {
        const idx = parseInt(el.dataset.idx, 10);
        const selected = results[idx];
        if (selected) {
          const lat = parseFloat(selected.lat);
          const lng = parseFloat(selected.lon);
          resultsDropdown.style.display = 'none';
          const searchStatus = document.getElementById('sa-map-search-status');
          if (searchStatus) {
            searchStatus.textContent = `Selected: ${selected.display_name.split(',')[0]}`;
            searchStatus.className = 'sa-map-search-status success';
          }
          this.flyToCoordinates(lat, lng, selected.display_name);
        }
      };
    });
  }

  async flyToCoordinates(lat, lng, locationName) {
    if (!this.map) return;

    this.currentSite.lat = lat;
    this.currentSite.lng = lng;
    this.currentSite.locationName = locationName;

    // Smoothly fly map to coordinates
    this.map.flyTo([lat, lng], 17, {
      duration: 1.2,
      easeLinearity: 0.25
    });

    this.updateLocationMarker(lat, lng, locationName);

    // If reverse geocoding is needed (e.g. coordinates were manually entered)
    if (!locationName || locationName.startsWith('Coordinates')) {
      this.reverseGeocode(lat, lng);
    } else {
      this.updateInfoPanel();
    }
  }

  async reverseGeocode(lat, lng) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          this.currentSite.locationName = data.display_name;
          this.updateInfoPanel();
          if (this.locationMarker) {
            this.locationMarker.setPopupContent(`<b>${data.display_name.split(',')[0]}</b><br>${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
          }
        }
      }
    } catch (e) {
      console.warn('Reverse geocoding error:', e);
    }
  }

  updateLocationMarker(lat, lng, label) {
    if (this.locationMarker && this.map) {
      this.map.removeLayer(this.locationMarker);
    }

    // Architectural custom pulsing marker icon
    const customIcon = L.divIcon({
      className: 'sa-map-center-pin',
      html: `
        <div class="sa-pin-pulse"></div>
        <div class="sa-pin-point"></div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    this.locationMarker = L.marker([lat, lng], { icon: customIcon }).addTo(this.map);
    if (label) {
      this.locationMarker.bindPopup(`<b>${label.split(',')[0]}</b><br>${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
    }
  }

  /* ==============================================================
     03. DRAWING & MEASUREMENT TOOLS
     ============================================================== */
  setTool(toolName) {
    // If clicking same tool again, deactivate
    if (this.currentTool === toolName) {
      this.currentTool = 'NONE';
    } else {
      this.currentTool = toolName;
    }

    // Reset interim drawing states
    this.resetDrawingState();

    // Update UI Toolbar
    const toolBtns = document.querySelectorAll('.sa-map-tool-btn');
    toolBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.tool === this.currentTool);
    });

    // Update Map Cursor
    if (this.container) {
      if (this.currentTool === 'MEASURE' || this.currentTool === 'RECTANGLE' || this.currentTool === 'POLYLINE') {
        this.container.style.cursor = 'crosshair';
      } else {
        this.container.style.cursor = '';
      }
    }

    // Update Tool Hint Bar
    const hintEl = document.getElementById('sa-map-tool-hint');
    if (hintEl) {
      switch (this.currentTool) {
        case 'MEASURE':
          hintEl.textContent = 'MEASURE TOOL: Click Point A, then Point B to calculate geodesic distance.';
          hintEl.style.display = 'block';
          break;
        case 'RECTANGLE':
          hintEl.textContent = 'RECTANGLE BOUNDARY: Click first corner, drag or click opposite corner.';
          hintEl.style.display = 'block';
          break;
        case 'POLYLINE':
          hintEl.textContent = 'POLYLINE / POLYGON: Click vertices to draw custom boundary. Double-click or click first point to close.';
          hintEl.style.display = 'block';
          break;
        default:
          hintEl.style.display = 'none';
          break;
      }
    }
  }

  resetDrawingState() {
    this.measurePoints = [];
    if (this.measureLayer && this.drawnItemsGroup) {
      this.drawnItemsGroup.removeLayer(this.measureLayer);
      this.measureLayer = null;
    }

    this.rectStartPoint = null;
    if (this.rectPreviewLayer && this.drawnItemsGroup) {
      this.drawnItemsGroup.removeLayer(this.rectPreviewLayer);
      this.rectPreviewLayer = null;
    }

    this.polygonPoints = [];
    this.polygonVertexMarkers.forEach(m => this.drawnItemsGroup.removeLayer(m));
    this.polygonVertexMarkers = [];
  }

  handleMapClick(e) {
    const latlng = e.latlng;

    if (this.currentTool === 'MEASURE') {
      this.handleMeasureClick(latlng);
    } else if (this.currentTool === 'RECTANGLE') {
      this.handleRectangleClick(latlng);
    } else if (this.currentTool === 'POLYLINE') {
      this.handlePolygonClick(latlng);
    }
  }

  handleMapMouseMove(e) {
    const latlng = e.latlng;

    if (this.currentTool === 'RECTANGLE' && this.rectStartPoint) {
      // Dynamic rectangle preview
      const bounds = L.latLngBounds(this.rectStartPoint, latlng);
      if (!this.rectPreviewLayer) {
        this.rectPreviewLayer = L.rectangle(bounds, {
          color: '#38bdf8',
          weight: 2,
          dashArray: '4, 4',
          fillColor: '#38bdf8',
          fillOpacity: 0.15
        }).addTo(this.drawnItemsGroup);
      } else {
        this.rectPreviewLayer.setBounds(bounds);
      }
    }
  }

  handleMapDblClick(e) {
    if (this.currentTool === 'POLYLINE' && this.polygonPoints.length >= 3) {
      // Double click closes polygon
      this.finishPolygonBoundary();
    }
  }

  /* --- 3A. MEASURE TOOL --- */
  handleMeasureClick(latlng) {
    this.measurePoints.push(latlng);

    if (this.measurePoints.length === 1) {
      // Add first point marker
      const marker = L.circleMarker(latlng, {
        radius: 5,
        color: '#00f2fe',
        fillColor: '#00f2fe',
        fillOpacity: 1
      }).addTo(this.drawnItemsGroup);
      this.measureLayer = L.featureGroup([marker]).addTo(this.drawnItemsGroup);
    } else if (this.measurePoints.length >= 2) {
      const p1 = this.measurePoints[this.measurePoints.length - 2];
      const p2 = this.measurePoints[this.measurePoints.length - 1];

      const distM = haversineDistance(
        { lat: p1.lat, lng: p1.lng },
        { lat: p2.lat, lng: p2.lng }
      );

      // Distance line
      const line = L.polyline([p1, p2], {
        color: '#00f2fe',
        weight: 3,
        dashArray: '6, 6'
      });
      const endMarker = L.circleMarker(p2, {
        radius: 5,
        color: '#00f2fe',
        fillColor: '#00f2fe',
        fillOpacity: 1
      });

      // Label at midpoint
      const midLat = (p1.lat + p2.lat) / 2;
      const midLng = (p1.lng + p2.lng) / 2;

      let distText = `${distM.toFixed(1)} m`;
      if (distM >= 1000) {
        distText = `${(distM / 1000).toFixed(2)} km (${Math.round(distM * 3.28084)} ft)`;
      } else {
        distText = `${distM.toFixed(1)} m (${Math.round(distM * 3.28084)} ft)`;
      }

      const label = L.marker([midLat, midLng], {
        icon: L.divIcon({
          className: 'sa-map-measure-label',
          html: `<span>${distText}</span>`,
          iconSize: [100, 20],
          iconAnchor: [50, 10]
        })
      });

      if (this.measureLayer) {
        this.measureLayer.addLayer(line);
        this.measureLayer.addLayer(endMarker);
        this.measureLayer.addLayer(label);
      }
    }
  }

  /* --- 3B. RECTANGLE TOOL --- */
  handleRectangleClick(latlng) {
    if (!this.rectStartPoint) {
      // Point 1
      this.rectStartPoint = latlng;
    } else {
      // Point 2 -> Commit Rectangle
      const p1 = this.rectStartPoint;
      const p2 = latlng;
      const bounds = L.latLngBounds(p1, p2);

      // Clear preview
      if (this.rectPreviewLayer && this.drawnItemsGroup) {
        this.drawnItemsGroup.removeLayer(this.rectPreviewLayer);
        this.rectPreviewLayer = null;
      }

      // Clear previous boundary if any
      this.clearBoundary();

      // Form 4 corners of rectangle in clockwise order
      const nw = bounds.getNorthWest();
      const ne = bounds.getNorthEast();
      const se = bounds.getSouthEast();
      const sw = bounds.getSouthWest();

      const coords = [
        { lat: nw.lat, lng: nw.lng },
        { lat: ne.lat, lng: ne.lng },
        { lat: se.lat, lng: se.lng },
        { lat: sw.lat, lng: sw.lng }
      ];

      // Geodesic calculations
      const width = haversineDistance(coords[0], coords[1]);
      const length = haversineDistance(coords[1], coords[2]);
      const area = width * length;

      this.currentSite.boundaryType = 'RECTANGLE';
      this.currentSite.boundaryGeo = coords;
      this.currentSite.areaSqMeters = area;
      this.currentSite.dimensions = {
        widthMetres: Math.round(width),
        lengthMetres: Math.round(length)
      };

      // Draw permanent boundary on map
      this.rectLayer = L.rectangle(bounds, {
        color: '#38bdf8',
        weight: 3,
        fillColor: '#38bdf8',
        fillOpacity: 0.22
      }).addTo(this.drawnItemsGroup);

      this.rectStartPoint = null;
      this.setTool('NONE');
      this.updateInfoPanel();
    }
  }

  /* --- 3C. POLYLINE / POLYGON TOOL --- */
  handlePolygonClick(latlng) {
    this.polygonPoints.push(latlng);

    // Place vertex marker
    const vMarker = L.circleMarker(latlng, {
      radius: 5,
      color: '#38bdf8',
      fillColor: '#06090f',
      fillOpacity: 1,
      weight: 2
    }).addTo(this.drawnItemsGroup);
    this.polygonVertexMarkers.push(vMarker);

    // If closing on first point
    if (this.polygonPoints.length > 2) {
      const first = this.polygonPoints[0];
      const distToFirst = haversineDistance(
        { lat: latlng.lat, lng: latlng.lng },
        { lat: first.lat, lng: first.lng }
      );
      // If within 15 meters or clicked on first point, close polygon
      if (distToFirst < 15 && this.polygonPoints.length >= 3) {
        this.polygonPoints.pop(); // remove duplicate point
        this.finishPolygonBoundary();
        return;
      }
    }

    // Dynamic polyline preview
    if (!this.polygonLayer) {
      this.polygonLayer = L.polyline(this.polygonPoints, {
        color: '#38bdf8',
        weight: 3,
        dashArray: '5, 5'
      }).addTo(this.drawnItemsGroup);
    } else {
      this.polygonLayer.setLatLngs(this.polygonPoints);
    }

    // Show "Finish Polygon" button in hint
    const hintEl = document.getElementById('sa-map-tool-hint');
    if (hintEl && this.polygonPoints.length >= 3) {
      hintEl.innerHTML = `
        <span>POLYGON: ${this.polygonPoints.length} vertices placed. </span>
        <button type="button" class="sa-map-hint-btn" id="sa-map-finish-poly-btn">COMPLETE BOUNDARY</button>
      `;
      const btn = document.getElementById('sa-map-finish-poly-btn');
      if (btn) btn.onclick = () => this.finishPolygonBoundary();
    }
  }

  finishPolygonBoundary() {
    if (this.polygonPoints.length < 3) return;

    const coords = this.polygonPoints.map(p => ({ lat: p.lat, lng: p.lng }));
    const area = calculateGeodesicPolygonArea(coords);

    // Replace polyline with closed polygon
    if (this.polygonLayer && this.drawnItemsGroup) {
      this.drawnItemsGroup.removeLayer(this.polygonLayer);
      this.polygonLayer = null;
    }

    this.polygonLayer = L.polygon(this.polygonPoints, {
      color: '#38bdf8',
      weight: 3,
      fillColor: '#38bdf8',
      fillOpacity: 0.22
    }).addTo(this.drawnItemsGroup);

    this.currentSite.boundaryType = 'POLYGON';
    this.currentSite.boundaryGeo = coords;
    this.currentSite.areaSqMeters = area;
    this.currentSite.dimensions = {
      widthMetres: Math.round(Math.sqrt(area)),
      lengthMetres: Math.round(Math.sqrt(area))
    };

    this.setTool('NONE');
    this.updateInfoPanel();
  }

  renderExistingBoundary(coords, type) {
    if (!coords || coords.length < 3) return;
    const latlngs = coords.map(c => [c.lat, c.lng]);

    if (type === 'RECTANGLE') {
      const bounds = L.latLngBounds(latlngs);
      this.rectLayer = L.rectangle(bounds, {
        color: '#38bdf8',
        weight: 3,
        fillColor: '#38bdf8',
        fillOpacity: 0.22
      }).addTo(this.drawnItemsGroup);
    } else {
      this.polygonLayer = L.polygon(latlngs, {
        color: '#38bdf8',
        weight: 3,
        fillColor: '#38bdf8',
        fillOpacity: 0.22
      }).addTo(this.drawnItemsGroup);
    }
  }

  clearBoundary() {
    if (this.rectLayer && this.drawnItemsGroup) {
      this.drawnItemsGroup.removeLayer(this.rectLayer);
      this.rectLayer = null;
    }
    if (this.polygonLayer && this.drawnItemsGroup) {
      this.drawnItemsGroup.removeLayer(this.polygonLayer);
      this.polygonLayer = null;
    }
    this.polygonVertexMarkers.forEach(m => this.drawnItemsGroup.removeLayer(m));
    this.polygonVertexMarkers = [];

    this.currentSite.boundaryGeo = [];
    this.currentSite.boundaryType = 'NONE';
    this.currentSite.areaSqMeters = 0;
    this.updateInfoPanel();
  }

  /* ==============================================================
     04. ACTIVE SITE INFORMATION PANEL & IMPORT ACTION
     ============================================================== */
  updateInfoPanel() {
    const locNameEl = document.getElementById('sa-info-location-name');
    const latEl = document.getElementById('sa-info-lat');
    const lngEl = document.getElementById('sa-info-lng');
    const areaEl = document.getElementById('sa-info-area');
    const boundEl = document.getElementById('sa-info-boundary');
    const importBtn = document.getElementById('sa-btn-import-site');

    if (locNameEl) locNameEl.textContent = this.currentSite.locationName;
    if (latEl) latEl.textContent = `${this.currentSite.lat.toFixed(4)}° ${this.currentSite.lat >= 0 ? 'N' : 'S'}`;
    if (lngEl) lngEl.textContent = `${this.currentSite.lng.toFixed(4)}° ${this.currentSite.lng >= 0 ? 'E' : 'W'}`;

    if (areaEl) {
      const areaFmt = formatArea(this.currentSite.areaSqMeters);
      areaEl.textContent = `${areaFmt.sqMeters} (${areaFmt.acres})`;
    }

    if (boundEl) {
      if (this.currentSite.boundaryType === 'RECTANGLE') {
        const w = this.currentSite.dimensions.widthMetres;
        const l = this.currentSite.dimensions.lengthMetres;
        boundEl.textContent = `Rectangle (${w}m × ${l}m)`;
      } else if (this.currentSite.boundaryType === 'POLYGON') {
        const count = this.currentSite.boundaryGeo.length;
        boundEl.textContent = `Custom Polygon (${count} Vertices)`;
      } else {
        boundEl.textContent = 'None Defined';
      }
    }

    if (importBtn) {
      importBtn.textContent = this.isEditMode ? 'UPDATE SITE' : 'IMPORT TO 3D VIEWPORT';
    }
  }

  importActiveSite() {
    // Generate 3D boundary coordinates
    let bGeo = this.currentSite.boundaryGeo;
    let bType = this.currentSite.boundaryType;

    // Fallback: If user didn't draw a custom boundary, generate a 50m x 40m rectangular boundary centered on the coordinates
    if (!bGeo || bGeo.length < 3) {
      const lat = this.currentSite.lat;
      const lng = this.currentSite.lng;
      const dLat = (20 / 6371008.8) * (180 / Math.PI); // 20m North/South
      const dLng = (25 / (6371008.8 * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI); // 25m East/West

      bGeo = [
        { lat: lat + dLat, lng: lng - dLng },
        { lat: lat + dLat, lng: lng + dLng },
        { lat: lat - dLat, lng: lng + dLng },
        { lat: lat - dLat, lng: lng - dLng }
      ];
      bType = 'RECTANGLE';
      this.currentSite.boundaryGeo = bGeo;
      this.currentSite.boundaryType = 'RECTANGLE';
      this.currentSite.areaSqMeters = 2000;
      this.currentSite.dimensions = { widthMetres: 50, lengthMetres: 40 };
    }

    // Convert Geo to 3D metric coordinates centered at [0, 0]
    const b3D = convertGeoToLocal3D(bGeo, this.currentSite.lat, this.currentSite.lng);

    // Save into SiteState
    SiteState.setActiveSite({
      locationName: this.currentSite.locationName,
      latitude: this.currentSite.lat,
      longitude: this.currentSite.lng,
      boundaryType: bType,
      boundaryGeo: bGeo,
      boundary3D: b3D,
      dimensions: this.currentSite.dimensions,
      areaSqMeters: this.currentSite.areaSqMeters,
      coordinateReference: 'WGS 84 (EPSG:4326)',
      isImported: true
    });

    if (typeof this.onSiteImported === 'function') {
      this.onSiteImported(SiteState.getActiveSite());
    }
  }

  /* ==============================================================
     05. DOM EVENT BINDING
     ============================================================== */
  bindDomEvents() {
    // 1. Search Bar Input & Form
    const searchForm = document.getElementById('sa-map-search-form');
    const searchInput = document.getElementById('sa-map-search-input');
    const searchClear = document.getElementById('sa-map-search-clear');

    if (searchForm && searchInput) {
      searchForm.onsubmit = (e) => {
        e.preventDefault();
        this.handleSearch(searchInput.value);
      };
    }

    if (searchClear && searchInput) {
      searchClear.onclick = () => {
        searchInput.value = '';
        const searchStatus = document.getElementById('sa-map-search-status');
        if (searchStatus) searchStatus.style.display = 'none';
        const dropdown = document.getElementById('sa-map-search-results');
        if (dropdown) dropdown.style.display = 'none';
        searchInput.focus();
      };
    }

    // Quick City Search Chips
    const chips = document.querySelectorAll('.sa-map-quick-chip');
    chips.forEach(chip => {
      chip.onclick = () => {
        const query = chip.dataset.query;
        if (searchInput) searchInput.value = query;
        this.handleSearch(query);
      };
    });

    // 2. Map View Switcher (NORMAL, SATELLITE, TERRAIN, EARTH)
    const viewBtns = document.querySelectorAll('.sa-map-view-btn');
    viewBtns.forEach(btn => {
      btn.onclick = () => {
        const layer = btn.dataset.layer;
        this.setLayer(layer);
      };
    });

    // 3. Navigation Controls (+, -, Reset)
    const zoomInBtn = document.getElementById('sa-map-btn-zoomin');
    if (zoomInBtn && this.map) {
      zoomInBtn.onclick = () => this.map.zoomIn();
    }
    const zoomOutBtn = document.getElementById('sa-map-btn-zoomout');
    if (zoomOutBtn && this.map) {
      zoomOutBtn.onclick = () => this.map.zoomOut();
    }
    const resetBtn = document.getElementById('sa-map-btn-reset');
    if (resetBtn && this.map) {
      resetBtn.onclick = () => {
        this.map.flyTo([this.currentSite.lat, this.currentSite.lng], 16);
      };
    }

    // 4. Drawing Tools (MEASURE, RECTANGLE, POLYLINE, CLEAR)
    const toolBtns = document.querySelectorAll('.sa-map-tool-btn');
    toolBtns.forEach(btn => {
      btn.onclick = () => {
        const tool = btn.dataset.tool;
        if (tool === 'CLEAR') {
          this.clearBoundary();
          this.resetDrawingState();
        } else {
          this.setTool(tool);
        }
      };
    });

    // 5. Import Action
    const importBtn = document.getElementById('sa-btn-import-site');
    if (importBtn) {
      importBtn.onclick = () => this.importActiveSite();
    }

    // 6. Return / Close Map Button
    const closeBtn = document.getElementById('sa-map-close-btn');
    if (closeBtn) {
      closeBtn.onclick = () => {
        if (typeof this.onCloseRequested === 'function') {
          this.onCloseRequested();
        }
      };
    }

    // 7. Earth Modal Dismiss
    const earthClose = document.getElementById('sa-earth-modal-close');
    if (earthClose) {
      earthClose.onclick = () => this.hideEarth3DModal();
    }

    // 8. Google Maps API Key Config Save
    const saveGmpKeyBtn = document.getElementById('sa-save-gmp-key-btn');
    const gmpInput = document.getElementById('sa-gmp-key-input');
    if (saveGmpKeyBtn && gmpInput) {
      saveGmpKeyBtn.onclick = () => {
        const key = gmpInput.value.trim();
        if (key) {
          try {
            sessionStorage.setItem('GOOGLE_MAPS_API_KEY', key);
            alert('Google Maps API key saved for this session.');
            this.hideEarth3DModal();
          } catch (e) {
            console.error(e);
          }
        }
      };
    }
  }

  setEditMode(isEdit) {
    this.isEditMode = isEdit;
    const importBtn = document.getElementById('sa-btn-import-site');
    if (importBtn) {
      importBtn.textContent = isEdit ? 'UPDATE SITE' : 'IMPORT TO 3D VIEWPORT';
    }
  }

  focusSearch() {
    const input = document.getElementById('sa-map-search-input');
    if (input) {
      input.focus();
      input.select();
    }
  }

  invalidateSize() {
    if (this.map) {
      setTimeout(() => this.map.invalidateSize(), 50);
    }
  }
}
