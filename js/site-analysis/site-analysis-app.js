/**
 * GM ARCH TOOLS — Site Analysis Module Coordinator (Iteration 02)
 * Author: Guru Murthy (GM)
 * Coordinates the 3-column architectural workstation:
 *   - Edge-Triggered Left Navigation Drawer (Platform Hub, 13 Modules, Calculatives, About)
 *   - Central 3D Viewport with Three.js (Fog-free, Camera Presets, Measurements)
 *   - Top Floating Command Toolbar: FIT, TOP, ISO, PERSP, N, SUN, GRID, LAYERS, MASSING, MEASURE, PRESENTATION
 *   - Floating Layers & Global Transparency Drawer (0%–100% sliders & toggles)
 *   - Conceptual Massing & Synchronized Floors Drawer (Floors Counter, H = N * h, Areas)
 *   - Interactive 3D Measurement Tool HUD
 *   - 1-Click Presentation Mode (Hides all chrome, Esc to exit)
 *   - Left Panel (Topics 01-05) & Right Panel (Topics 06-10) with Collapsible Layout
 */

import { SITE_ANALYSIS_MODES } from './analysis-modes-data.js';
import { SiteViewport } from './site-viewport.js';
import { PLATFORM_MODULES } from '../data/modules-database.js';
import { SiteMapEngine } from './site-map-engine.js';
import { SiteState, formatArea } from '../state/site-state.js';

let viewportInstance = null;
let mapEngineInstance = null;
let activeModeId = '02'; // Default: Sun Path & Solar Analysis
let isLayersDrawerOpen = false;
let isMassingDrawerOpen = false;
let isPresentationMode = false;
let isLeftPanelCollapsed = false;
let isRightPanelCollapsed = false;

export function initSiteAnalysisApp() {
  const container = document.getElementById('sa-viewport-container');
  if (!container) return;

  // Initialize Viewport if not already created
  if (!viewportInstance) {
    viewportInstance = new SiteViewport('sa-viewport-container');
  }

  // Render Topic Lists on Left & Right Panels
  renderTopicLists();

  // Render Active Mode Controls & Info
  renderActiveModeDetails();

  // Bind Edge Navigation Drawer
  bindEdgeNav();

  // Bind Viewport Floating Command Toolbar
  bindViewportToolbar();

  // Bind Layers & Transparency Drawer
  bindLayersDrawer();

  // Bind Massing & Floors Drawer
  bindMassingDrawer();

  // Bind Measurement HUD
  bindMeasureHUD();

  // Bind Active Site HUD Buttons
  bindActiveSiteHud();

  // Bind Presentation Mode & Collapsible Panels
  bindPresentationAndPanels();

  // Back Button to Platform Hub
  const backBtn = document.getElementById('sa-back-btn');
  if (backBtn) {
    backBtn.onclick = () => {
      if (window.gmArchToolsRouter) {
        window.gmArchToolsRouter.showPlatformHub();
      }
    };
  }

  // Handle Window Resize
  window.addEventListener('resize', () => {
    if (viewportInstance) viewportInstance.handleResize();
  });
}

export function pauseSiteAnalysis() {
  if (viewportInstance) {
    viewportInstance.pause();
  }
}

export function resumeSiteAnalysis() {
  if (viewportInstance) {
    viewportInstance.resume();
    viewportInstance.handleResize();
  }
}

/* ==============================================================
   01. EDGE-TRIGGERED NAVIGATION DRAWER
   ============================================================== */
function bindEdgeNav() {
  const trigger = document.getElementById('sa-edge-nav-trigger');
  const drawer = document.getElementById('sa-edge-nav-drawer');
  const closeBtn = document.getElementById('sa-edge-nav-close');

  if (closeBtn && drawer) {
    closeBtn.onclick = () => {
      drawer.classList.remove('open');
    };
  }

  // Main Section Navigation Links
  const btnHub = document.getElementById('sa-nav-hub-btn');
  if (btnHub) {
    btnHub.onclick = () => {
      if (drawer) drawer.classList.remove('open');
      if (window.gmArchToolsRouter) window.gmArchToolsRouter.showPlatformHub();
    };
  }

  const btnAllMods = document.getElementById('sa-nav-all-modules-btn');
  if (btnAllMods) {
    btnAllMods.onclick = () => {
      if (drawer) drawer.classList.remove('open');
      if (window.gmArchToolsRouter) window.gmArchToolsRouter.showPlatformHub();
    };
  }

  if (trigger && drawer) {
    trigger.onclick = () => {
      drawer.classList.toggle('open');
    };
  }

  const btnCalcs = document.getElementById('sa-nav-calculatives-btn');
  if (btnCalcs) {
    btnCalcs.onclick = () => {
      if (drawer) drawer.classList.remove('open');
      if (window.gmArchToolsRouter) window.gmArchToolsRouter.showArchCalculatives();
    };
  }

  const btnBasic = document.getElementById('sa-nav-basic-btn');
  if (btnBasic) {
    btnBasic.onclick = () => {
      if (drawer) drawer.classList.remove('open');
      if (window.gmArchToolsRouter) window.gmArchToolsRouter.showBasicTools();
    };
  }

  const btnAbout = document.getElementById('sa-nav-about-btn');
  if (btnAbout) {
    btnAbout.onclick = () => {
      if (drawer) drawer.classList.remove('open');
      if (window.gmArchToolsRouter) window.gmArchToolsRouter.openAboutModal();
    };
  }

  // Populate 13 Modules Grid in Edge Drawer
  const modsGrid = document.getElementById('sa-drawer-modules-grid');
  if (modsGrid && PLATFORM_MODULES) {
    modsGrid.innerHTML = PLATFORM_MODULES.map(m => {
      const isCurrent = m.id === '03';
      return `
        <div class="sa-drawer-module-item ${isCurrent ? 'active' : ''}" data-mod-id="${m.id}">
          <span class="sa-drawer-mod-num">${m.num}</span>
          <span>${m.name}</span>
        </div>
      `;
    }).join('');

    modsGrid.querySelectorAll('.sa-drawer-module-item').forEach(el => {
      el.onclick = () => {
        const id = el.dataset.modId;
        if (drawer) drawer.classList.remove('open');
        if (id === '03') {
          // Already here in Site Analysis
        } else if (id === '01' && window.gmArchToolsRouter) {
          window.gmArchToolsRouter.showArchCalculatives();
        } else if (window.gmArchToolsRouter) {
          const modData = PLATFORM_MODULES.find(m => m.id === id);
          if (modData) window.gmArchToolsRouter.openRoadmapModal(modData);
        }
      };
    });
  }
}

/* ==============================================================
   02. TOPIC LISTS RENDERING (LEFT: 01-05 | RIGHT: 06-10 | MAPS)
   ============================================================== */
function renderTopicLists() {
  const leftList = document.getElementById('sa-left-topic-list');
  const rightList = document.getElementById('sa-right-topic-list');

  const leftModes = SITE_ANALYSIS_MODES.filter(m => m.panel === 'left');
  const rightModes = SITE_ANALYSIS_MODES.filter(m => m.panel === 'right');

  if (leftList) {
    leftList.innerHTML = leftModes.map(m => renderTopicBtn(m)).join('');
  }

  if (rightList) {
    const isMapsActive = activeModeId === 'MAPS';
    const mapsBtnHtml = `
      <li class="sa-maps-topic-item" style="margin-top: 8px; border-top: 1px dashed var(--sa-panel-border); padding-top: 8px;">
        <button type="button" 
                class="sa-topic-btn sa-maps-topic-btn ${isMapsActive ? 'active' : ''}" 
                data-mode-id="MAPS"
                id="sa-btn-maps-topic"
                aria-label="Maps and Site Boundary Import Workspace">
          <span class="sa-topic-num" style="color: #38bdf8; font-weight: 800;">MAP</span>
          <span class="sa-topic-title" style="color: #38bdf8; font-weight: 700;">MAPS &amp; SITE IMPORT</span>
          <span class="sa-topic-icon">🗺️</span>
        </button>
      </li>
    `;
    rightList.innerHTML = rightModes.map(m => renderTopicBtn(m)).join('') + mapsBtnHtml;
  }

  // Attach Click Handlers to All Topic Buttons
  const topicBtns = document.querySelectorAll('.sa-topic-btn');
  topicBtns.forEach(btn => {
    btn.onclick = () => {
      const modeId = btn.dataset.modeId;
      selectAnalysisMode(modeId);
    };
  });
}

function renderTopicBtn(m) {
  const isActive = m.id === activeModeId;
  return `
    <li>
      <button type="button" 
              class="sa-topic-btn ${isActive ? 'active' : ''}" 
              data-mode-id="${m.id}"
              aria-label="Mode ${m.num}: ${m.name}">
        <span class="sa-topic-num">${m.num}</span>
        <span class="sa-topic-title">${m.name}</span>
        <span class="sa-topic-icon">${m.icon}</span>
      </button>
    </li>
  `;
}

/* ==============================================================
   03. MODE SWITCHER (MODES 01-10 & MAPS WORKSPACE)
   ============================================================== */
export function selectAnalysisMode(modeId) {
  activeModeId = modeId;

  // 1. Update Buttons Active State
  const btns = document.querySelectorAll('.sa-topic-btn');
  btns.forEach(b => {
    b.classList.toggle('active', b.dataset.modeId === modeId);
  });

  const mapWorkspace = document.getElementById('sa-map-workspace');
  const viewportContainer = document.getElementById('sa-viewport-container');
  const activeSiteHud = document.getElementById('sa-active-site-hud');
  const legendBox = document.getElementById('sa-mode-legend');
  const pill = document.getElementById('sa-mode-indicator-text');

  if (modeId === 'MAPS') {
    if (pill) pill.textContent = 'SITE ANALYSIS // MAPS & SITE BOUNDARY IMPORT';
    if (mapWorkspace) mapWorkspace.style.display = 'flex';
    if (viewportContainer) viewportContainer.style.display = 'none';
    if (activeSiteHud) activeSiteHud.style.display = 'none';
    if (legendBox) legendBox.style.display = 'none';

    // Pause 3D Viewport to ensure max performance for mapping (Section 30)
    if (viewportInstance) viewportInstance.pause();

    // Initialize Map Engine if not done yet
    if (!mapEngineInstance) {
      mapEngineInstance = new SiteMapEngine('sa-map-container', {
        onSiteImported: (importedSite) => {
          handleSiteImported(importedSite);
        },
        onCloseRequested: () => {
          selectAnalysisMode('02');
        }
      });
    } else {
      mapEngineInstance.invalidateSize();
    }

    renderActiveModeDetails();
    return;
  }

  // Non-MAPS (Modes 01 to 10):
  if (mapWorkspace) mapWorkspace.style.display = 'none';
  if (viewportContainer) viewportContainer.style.display = 'block';
  if (activeSiteHud) activeSiteHud.style.display = 'flex';
  if (legendBox) legendBox.style.display = 'block';

  // Resume 3D Viewport
  if (viewportInstance) {
    viewportInstance.resume();
    if (viewportInstance.overlays) {
      viewportInstance.overlays.setMode(modeId);
    }
    viewportInstance.updateActiveSiteHUD(SiteState.getActiveSite());
  }

  // Update Header Mode Pill
  const modeData = SITE_ANALYSIS_MODES.find(m => m.id === modeId);
  if (pill && modeData) {
    pill.textContent = `MODE ${modeData.num}: ${modeData.name}`;
  }

  // Update Viewport Legend
  updateViewportLegend(modeData);

  // Render Active Mode Information & Controls
  renderActiveModeDetails();
}

function handleSiteImported(siteData) {
  // Return to Sun Path Analysis mode in 3D Viewport with imported site
  selectAnalysisMode('02');
  if (viewportInstance) {
    viewportInstance.renderImportedBoundary(siteData);
  }
}

function bindActiveSiteHud() {
  const editBtn = document.getElementById('sa-btn-edit-site');
  if (editBtn) {
    editBtn.onclick = () => {
      selectAnalysisMode('MAPS');
      if (mapEngineInstance) mapEngineInstance.setEditMode(true);
    };
  }

  const changeBtn = document.getElementById('sa-btn-change-site');
  if (changeBtn) {
    changeBtn.onclick = () => {
      selectAnalysisMode('MAPS');
      if (mapEngineInstance) {
        mapEngineInstance.setEditMode(false);
        mapEngineInstance.focusSearch();
      }
    };
  }

  if (viewportInstance) {
    viewportInstance.updateActiveSiteHUD(SiteState.getActiveSite());
  }
}

function updateViewportLegend(modeData) {
  const legendBox = document.getElementById('sa-mode-legend');
  if (!legendBox || !modeData) return;

  const itemsHtml = (modeData.legend || []).map(item => `
    <div class="sa-legend-item">
      <span class="sa-legend-swatch" style="background-color: ${item.color};"></span>
      <span>${item.label}</span>
    </div>
  `).join('');

  legendBox.innerHTML = `
    <div class="sa-legend-title">${modeData.num} — ${modeData.shortName} LEGEND</div>
    ${itemsHtml}
  `;
}

/* ==============================================================
   04. MODE DETAILS & INTERACTIVE CONTROLS RENDERING
   ============================================================== */
function renderActiveModeDetails() {
  if (activeModeId === 'MAPS') {
    const rightContainer = document.getElementById('sa-right-details-container');
    const leftContainer = document.getElementById('sa-left-details-container');
    if (leftContainer) leftContainer.innerHTML = '';
    if (!rightContainer) return;

    const site = SiteState.getActiveSite();
    const areaFmt = formatArea(site.areaSqMeters || 2000);

    rightContainer.innerHTML = `
      <div class="sa-mode-controls-panel">
        <div class="sa-controls-title">
          <span>MAPS &amp; SITE IMPORT</span>
          <span style="font-size: 11px; opacity: 0.7;">Active Workspace</span>
        </div>
        <p style="font-family: var(--sa-font-sans); font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0 0 12px 0;">
          Search any named location or enter coordinates. Use the drafting tools to define your parcel boundary, then click <b>IMPORT TO 3D VIEWPORT</b> to transfer geometry and solar positioning into the 3D workspace.
        </p>

        <div class="sa-active-site-context-card" style="margin-bottom: 0;">
          <div class="sa-ascc-header">
            <span class="sa-ascc-badge">📍 SELECTED LOCATION</span>
            <span class="sa-ascc-coords">${site.latitude.toFixed(4)}° N, ${site.longitude.toFixed(4)}° E</span>
          </div>
          <div class="sa-ascc-name">${site.locationName}</div>
          <div class="sa-ascc-meta">
            <span>Area: ${areaFmt.sqMeters}</span>
            <span>Boundary: ${site.boundaryType}</span>
          </div>
          <div class="sa-ascc-status">
            Geodesic WGS 84 coordinate reference active. Ready to import or modify boundary.
          </div>
        </div>
      </div>

      <div class="sa-info-card-container">
        <div class="sa-info-block">
          <h4 class="sa-info-heading">HOW TO USE</h4>
          <ol style="padding-left: 16px; margin: 4px 0; font-size: 11.5px; color: var(--sa-text-muted); line-height: 1.6;">
            <li><b>Search:</b> Type "Chennai", "Marina Beach", or coordinates "13.0827, 80.2707".</li>
            <li><b>View:</b> Switch between NORMAL, SATELLITE, and TERRAIN layers.</li>
            <li><b>Draft Boundary:</b> Click <b>RECTANGLE</b> or <b>POLYLINE</b> to trace site edges.</li>
            <li><b>Import:</b> Click <b>IMPORT TO 3D VIEWPORT</b> to transfer parcel to 3D.</li>
          </ol>
        </div>

        <div class="sa-info-block">
          <h4 class="sa-info-heading">DATA SOURCES &amp; LICENSING</h4>
          <div style="font-size: 11px; color: #94a3b8; line-height: 1.5;">
            <b>Roads &amp; Buildings:</b> OpenStreetMap &amp; CartoDB Voyager<br>
            <b>Satellite Imagery:</b> Esri World Imagery (Maxar/USGS)<br>
            <b>Contours:</b> SRTM Digital Elevation Model via OpenTopoMap<br>
            <b>Google Maps:</b> Official Maps Platform API integration supported.
          </div>
        </div>
      </div>
    `;
    return;
  }

  const mode = SITE_ANALYSIS_MODES.find(m => m.id === activeModeId);
  if (!mode) return;

  const isLeft = mode.panel === 'left';
  const targetContainer = isLeft 
    ? document.getElementById('sa-left-details-container')
    : document.getElementById('sa-right-details-container');

  const otherContainer = isLeft
    ? document.getElementById('sa-right-details-container')
    : document.getElementById('sa-left-details-container');

  if (otherContainer) otherContainer.innerHTML = '';
  if (!targetContainer) return;

  const activeSite = SiteState.getActiveSite();

  targetContainer.innerHTML = `
    <!-- Active Site Context Card (Iteration 06 Location-Awareness) -->
    ${renderActiveSiteContextCard(activeSite, mode)}

    <!-- Interactive Mode Controls Section -->
    <div class="sa-mode-controls-panel">
      <div class="sa-controls-title">
        <span>${mode.num} PARAMETRIC CONTROLS</span>
        <span style="font-size: 11px; opacity: 0.7;">Interactive</span>
      </div>
      ${renderModeSpecificControls(mode)}
    </div>

    <!-- Structured Information & Infographic Card -->
    <div class="sa-info-card-container">
      
      <!-- What is it? -->
      <div class="sa-info-block">
        <h4 class="sa-info-heading">WHAT IS IT?</h4>
        <p class="sa-info-text">${mode.whatIsIt}</p>
      </div>

      <!-- Why is it important? -->
      <div class="sa-info-block">
        <h4 class="sa-info-heading">WHY IS IT IMPORTANT?</h4>
        <p class="sa-info-text">${mode.whyImportant}</p>
      </div>

      <!-- What do architects study? -->
      <div class="sa-info-block">
        <h4 class="sa-info-heading">WHAT DO ARCHITECTS STUDY?</h4>
        <ul style="padding-left: 16px; margin: 4px 0; font-size: 11.5px; color: var(--sa-text-muted); line-height: 1.55;">
          ${mode.architectsStudy.map(s => `<li>${s}</li>`).join('')}
        </ul>
      </div>

      <!-- Key Parameters & Infographics -->
      <div class="sa-info-block">
        <h4 class="sa-info-heading">KEY PARAMETERS & INFOGRAPHICS</h4>
        <div class="sa-params-grid">
          ${mode.parameters.map(p => `
            <div class="sa-param-item">
              <span class="sa-param-key">${p.key}</span>
              <span class="sa-param-val">${p.val}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Strict Disclaimer if present -->
      ${mode.disclaimer ? `
        <div class="sa-disclaimer-box">
          ${mode.disclaimer}
        </div>
      ` : ''}

      <!-- Strict Calculation Coming Soon Notice -->
      <div class="sa-coming-soon-box">
        <div class="sa-cs-title">
          <span>🔒</span>
          <span>${mode.calculationStatus}</span>
        </div>
        <p class="sa-cs-desc">${mode.calculationNote}</p>
      </div>

      <!-- Sources & References -->
      <div class="sa-sources-box">
        <div class="sa-sources-title">OFFICIAL SOURCES & STANDARDS</div>
        ${mode.sources.map(s => `
          <div class="sa-source-item">
            <strong>${s.name}</strong><br>
            <span>${s.ref}</span>
          </div>
        `).join('')}
      </div>

    </div>
  `;

  // Bind Events for Active Mode Controls
  bindModeSpecificControls(mode);
}

function renderActiveSiteContextCard(site, mode) {
  if (!site) site = SiteState.getActiveSite();
  const areaFmt = formatArea(site.areaSqMeters || 2000);

  let statusStatement = '';
  switch (mode.id) {
    case '01': // Climate
      statusStatement = `Active Site: ${site.city || site.locationName}. Climate classification active. Hourly TMY3/EPW weather dataset integration required.`;
      break;
    case '02': // Sun Path
      statusStatement = `Active Site: ${site.city || site.locationName}. Latitude ${site.latitude.toFixed(4)}° dynamically calculates true NOAA solar declination and zenith trajectory.`;
      break;
    case '03': // Wind
      statusStatement = `Active Site: ${site.city || site.locationName}. Location-specific anemometer / IMD weather station dataset integration required for measured wind roses. Conceptual aerodynamic streamlines active.`;
      break;
    case '04': // Orientation
      statusStatement = `Active Site: ${site.city || site.locationName}. Cardinal alignment (East sunrise, South zenith, West sunset, True North) mapped to WGS 84 datum.`;
      break;
    case '05': // Topography
      statusStatement = `Active Site: ${site.city || site.locationName}. High-resolution LiDAR / SRTM DEM elevation dataset integration required for parcel contours. Conceptual grading plane active.`;
      break;
    case '06': // Access
      statusStatement = `Active Site: ${site.city || site.locationName}. Site boundary footprint (${areaFmt.sqMeters}) mapped to urban access context.`;
      break;
    case '07': // Vegetation
      statusStatement = `Active Site: ${site.city || site.locationName}. Regional canopy coverage analysis. Multispectral NDVI satellite dataset integration required.`;
      break;
    case '08': // Views
      statusStatement = `Active Site: ${site.city || site.locationName}. Site-centric panoramic view corridors and visual sightline isovists active.`;
      break;
    case '09': // Noise
      statusStatement = `Active Site: ${site.city || site.locationName}. Municipal acoustic sensor / decibel monitoring integration required. Conceptual attenuation active.`;
      break;
    case '10': // Utilities
      statusStatement = `Active Site: ${site.city || site.locationName}. Municipal GIS utility infrastructure network integration required. Conceptual service points active.`;
      break;
    default:
      statusStatement = `Active Location: ${site.locationName} (${site.latitude.toFixed(4)}°, ${site.longitude.toFixed(4)}°).`;
  }

  return `
    <div class="sa-active-site-context-card">
      <div class="sa-ascc-header">
        <span class="sa-ascc-badge">📍 ACTIVE SITE CONTEXT</span>
        <span class="sa-ascc-coords">${site.latitude.toFixed(4)}° N, ${site.longitude.toFixed(4)}° E</span>
      </div>
      <div class="sa-ascc-name">${site.locationName}</div>
      <div class="sa-ascc-meta">
        <span>Area: ${areaFmt.sqMeters}</span>
        <span>Boundary: ${site.boundaryType}</span>
      </div>
      <div class="sa-ascc-status">
        ${statusStatement}
      </div>
    </div>
  `;
}

function renderModeSpecificControls(mode) {
  if (mode.id === '02') {
    const sun = viewportInstance ? viewportInstance.overlays.sunState : { hour: 12, isPlaying: false, altitudeDeg: 65, azimuthDeg: 180 };
    const h = Math.floor(sun.hour);
    const m = Math.floor((sun.hour % 1) * 60);
    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    return `
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <div class="sa-field-row">
          <span class="sa-field-label">Solar Time</span>
          <div class="sa-time-readout" id="sa-sun-time-display">${timeStr} hrs</div>
        </div>

        <input type="range" 
               id="sa-sun-time-slider" 
               class="sa-slider" 
               min="6.0" 
               max="18.0" 
               step="0.1" 
               value="${sun.hour}">

        <div style="display: flex; justify-content: space-between; font-family: var(--sa-font-mono); font-size: 9.5px; color: var(--sa-text-faint);">
          <span>06:00 Sunrise (+X)</span>
          <span>12:00 Noon (+Z)</span>
          <span>18:00 Sunset (-X)</span>
        </div>

        <div class="sa-anim-controls-row">
          <button type="button" class="sa-anim-btn ${sun.isPlaying ? 'playing' : ''}" id="sa-sun-play-btn">
            <span>${sun.isPlaying ? '⏸ Pause' : '▶ Play Diurnal Orbit'}</span>
          </button>
          <button type="button" class="sa-anim-btn" id="sa-sun-reset-btn" title="Reset to Solar Noon">
            <span>↺ Noon</span>
          </button>
        </div>

        <div class="sa-field-row" style="margin-top: 4px;">
          <span class="sa-field-label">Trajectory</span>
          <div class="sa-shape-selector" style="flex: 1;">
            <button type="button" class="sa-shape-btn active" data-season="EQUINOX" id="season-equinox">Equinox</button>
            <button type="button" class="sa-shape-btn" data-season="SUMMER" id="season-summer">Summer</button>
            <button type="button" class="sa-shape-btn" data-season="WINTER" id="season-winter">Winter</button>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; font-family: var(--sa-font-mono); font-size: 10px; background: rgba(0,0,0,0.3); padding: 5px 8px; border-radius: 4px;">
          <span>Altitude: <strong id="sa-alt-readout" style="color: var(--sa-accent-cyan);">${sun.altitudeDeg}°</strong></span>
          <span>Azimuth: <strong id="sa-az-readout" style="color: var(--sa-accent-cyan);">${sun.azimuthDeg}°</strong></span>
        </div>
      </div>
    `;
  }

  if (mode.id === '03') {
    const wind = viewportInstance ? viewportInstance.overlays.windState : { direction: 'SW', speed: 1.0, isPlaying: true };
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

    return `
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <div style="font-family: var(--sa-font-mono); font-size: 10px; color: var(--sa-text-muted);">
          Select Prevailing CFD Streamline Direction:
        </div>

        <div class="sa-wind-dir-grid">
          ${dirs.map(d => `
            <button type="button" 
                    class="sa-dir-btn ${wind.direction === d ? 'active' : ''}" 
                    data-wind-dir="${d}">
              ${d}
            </button>
          `).join('')}
        </div>

        <div class="sa-field-row" style="margin-top: 4px;">
          <span class="sa-field-label">Stream Speed</span>
          <input type="range" id="sa-wind-speed-slider" class="sa-slider" min="0.3" max="2.5" step="0.1" value="${wind.speed}">
        </div>

        <div class="sa-anim-controls-row">
          <button type="button" class="sa-anim-btn ${wind.isPlaying ? 'playing' : ''}" id="sa-wind-play-btn">
            <span>${wind.isPlaying ? '⏸ Pause Stream' : '▶ Play Stream'}</span>
          </button>
          <button type="button" class="sa-anim-btn" id="sa-wind-reset-btn">
            <span>↺ Re-center Vectors</span>
          </button>
        </div>
      </div>
    `;
  }

  if (mode.id === '04') {
    const massParams = viewportInstance ? viewportInstance.massing.params : { rotation: 0 };
    return `
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <div class="sa-field-row">
          <span class="sa-field-label">Rotate Mass</span>
          <div class="sa-field-inputs">
            <input type="range" id="sa-orient-slider" class="sa-slider" min="0" max="360" step="5" value="${massParams.rotation}">
            <span class="sa-num-unit" id="sa-orient-val">${massParams.rotation}°</span>
          </div>
        </div>
        <p style="font-size: 11px; color: var(--sa-text-muted); margin: 0; line-height: 1.4;">
          Cardinal alignment: North is along -Z. South facade faces +Z for direct winter gain.
        </p>
      </div>
    `;
  }

  if (mode.id === '10') {
    return `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="font-family: var(--sa-font-mono); font-size: 10px; color: var(--sa-text-muted);">Infrastructure Traces:</div>
        <label class="sa-layer-toggle" style="font-size: 11px;">
          <input type="checkbox" id="util-layer-water" checked>
          <span>Potable Water Main (Cyan)</span>
        </label>
        <label class="sa-layer-toggle" style="font-size: 11px;">
          <input type="checkbox" id="util-layer-power" checked>
          <span>Electrical Grid & Substation (Yellow)</span>
        </label>
        <label class="sa-layer-toggle" style="font-size: 11px;">
          <input type="checkbox" id="util-layer-sewer" checked>
          <span>Sanitary Sewer Network (Magenta)</span>
        </label>
        <label class="sa-layer-toggle" style="font-size: 11px;">
          <input type="checkbox" id="util-layer-storm" checked>
          <span>Stormwater Culvert (Dashed Cyan)</span>
        </label>
      </div>
    `;
  }

  return '';
}

function bindModeSpecificControls(mode) {
  if (mode.id === '02') {
    const slider = document.getElementById('sa-sun-time-slider');
    const display = document.getElementById('sa-sun-time-display');
    const playBtn = document.getElementById('sa-sun-play-btn');
    const resetBtn = document.getElementById('sa-sun-reset-btn');
    const altReadout = document.getElementById('sa-alt-readout');
    const azReadout = document.getElementById('sa-az-readout');

    if (slider) {
      slider.oninput = (e) => {
        const val = parseFloat(e.target.value);
        if (viewportInstance && viewportInstance.overlays) {
          viewportInstance.overlays.setSunTime(val);
          const sun = viewportInstance.overlays.sunState;
          const h = Math.floor(sun.hour);
          const m = Math.floor((sun.hour % 1) * 60);
          if (display) display.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} hrs`;
          if (altReadout) altReadout.textContent = `${sun.altitudeDeg}°`;
          if (azReadout) azReadout.textContent = `${sun.azimuthDeg}°`;
        }
      };
    }

    if (playBtn) {
      playBtn.onclick = () => {
        if (!viewportInstance || !viewportInstance.overlays) return;
        const sun = viewportInstance.overlays.sunState;
        sun.isPlaying = !sun.isPlaying;
        playBtn.classList.toggle('playing', sun.isPlaying);
        playBtn.innerHTML = sun.isPlaying ? '<span>⏸ Pause</span>' : '<span>▶ Play Diurnal Orbit</span>';
      };
    }

    if (resetBtn) {
      resetBtn.onclick = () => {
        if (!viewportInstance || !viewportInstance.overlays) return;
        viewportInstance.overlays.setSunTime(12.0);
        if (slider) slider.value = 12.0;
        if (display) display.textContent = '12:00 hrs';
      };
    }

    ['equinox', 'summer', 'winter'].forEach(s => {
      const btn = document.getElementById(`season-${s}`);
      if (btn) {
        btn.onclick = () => {
          document.querySelectorAll('[data-season]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          if (viewportInstance && viewportInstance.overlays) {
            viewportInstance.overlays.setSeason(s.toUpperCase());
          }
        };
      }
    });
  }

  if (mode.id === '03') {
    const dirBtns = document.querySelectorAll('[data-wind-dir]');
    dirBtns.forEach(btn => {
      btn.onclick = () => {
        dirBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const dir = btn.dataset.windDir;
        if (viewportInstance && viewportInstance.overlays) {
          viewportInstance.overlays.setWindDirection(dir);
        }
      };
    });

    const speedSlider = document.getElementById('sa-wind-speed-slider');
    if (speedSlider) {
      speedSlider.oninput = (e) => {
        const val = parseFloat(e.target.value);
        if (viewportInstance && viewportInstance.overlays) {
          viewportInstance.overlays.setWindSpeed(val);
        }
      };
    }

    const playBtn = document.getElementById('sa-wind-play-btn');
    if (playBtn) {
      playBtn.onclick = () => {
        if (!viewportInstance || !viewportInstance.overlays) return;
        const wind = viewportInstance.overlays.windState;
        wind.isPlaying = !wind.isPlaying;
        playBtn.classList.toggle('playing', wind.isPlaying);
        playBtn.innerHTML = wind.isPlaying ? '<span>⏸ Pause Stream</span>' : '<span>▶ Play Stream</span>';
      };
    }

    const resetBtn = document.getElementById('sa-wind-reset-btn');
    if (resetBtn) {
      resetBtn.onclick = () => {
        if (!viewportInstance || !viewportInstance.overlays) return;
        viewportInstance.overlays.setWindDirection(viewportInstance.overlays.windState.direction);
      };
    }
  }

  if (mode.id === '04') {
    const orientSlider = document.getElementById('sa-orient-slider');
    const orientVal = document.getElementById('sa-orient-val');
    if (orientSlider) {
      orientSlider.oninput = (e) => {
        const deg = parseFloat(e.target.value);
        if (orientVal) orientVal.textContent = `${deg}°`;
        if (viewportInstance && viewportInstance.massing) {
          viewportInstance.massing.updateParam('rotation', deg);
        }
      };
    }
  }

  if (mode.id === '10') {
    ['water', 'power', 'sewer', 'storm'].forEach(k => {
      const cb = document.getElementById(`util-layer-${k}`);
      if (cb) {
        cb.onchange = (e) => {
          if (viewportInstance && viewportInstance.overlays) {
            viewportInstance.overlays.setUtilityLayer(k, e.target.checked);
          }
        };
      }
    });
  }
}

/* ==============================================================
   05. FLOATING VIEWPORT COMMAND TOOLBAR
   FIT, TOP, ISO, PERSP, N, SUN, GRID, LAYERS, MASSING, MEASURE, PRESENTATION
   ============================================================== */
function bindViewportToolbar() {
  const btnFit = document.getElementById('sa-btn-fit');
  const btnTop = document.getElementById('sa-btn-top');
  const btnIso = document.getElementById('sa-btn-iso');
  const btnPersp = document.getElementById('sa-btn-persp');
  const btnNorth = document.getElementById('sa-btn-north');
  const btnSun = document.getElementById('sa-btn-sun');
  const btnGrid = document.getElementById('sa-btn-grid');
  const btnLayers = document.getElementById('sa-btn-layers');
  const btnMassing = document.getElementById('sa-btn-massing');
  const btnMeasure = document.getElementById('sa-btn-measure');
  const btnPresentation = document.getElementById('sa-btn-presentation');

  // Camera presets
  const camBtns = [btnTop, btnIso, btnPersp];
  const setCamActive = (activeBtn) => {
    camBtns.forEach(b => { if (b) b.classList.remove('active'); });
    if (activeBtn) activeBtn.classList.add('active');
  };

  if (btnFit) {
    btnFit.onclick = () => {
      if (viewportInstance) viewportInstance.setCameraPreset('FIT_SITE');
    };
  }

  if (btnTop) {
    btnTop.onclick = () => {
      setCamActive(btnTop);
      if (viewportInstance) viewportInstance.setCameraPreset('TOP');
    };
  }

  if (btnIso) {
    btnIso.onclick = () => {
      setCamActive(btnIso);
      if (viewportInstance) viewportInstance.setCameraPreset('ISO');
    };
  }

  if (btnPersp) {
    btnPersp.onclick = () => {
      setCamActive(btnPersp);
      if (viewportInstance) viewportInstance.setCameraPreset('PERSP');
    };
  }

  if (btnNorth) {
    btnNorth.onclick = () => {
      if (viewportInstance) viewportInstance.setCameraPreset('NORTH');
    };
  }

  if (btnSun) {
    btnSun.onclick = () => {
      selectAnalysisMode('02');
      if (viewportInstance && viewportInstance.overlays) {
        const sun = viewportInstance.overlays.sunState;
        sun.isPlaying = !sun.isPlaying;
        btnSun.classList.toggle('active', sun.isPlaying);
      }
    };
  }

  if (btnGrid) {
    btnGrid.onclick = () => {
      if (viewportInstance) {
        const isVisible = viewportInstance.toggleGrid();
        btnGrid.classList.toggle('active', isVisible);
        const gridCb = document.getElementById('layer-vis-grid');
        if (gridCb) gridCb.checked = isVisible;
      }
    };
  }

  if (btnLayers) {
    btnLayers.onclick = () => {
      toggleLayersDrawer();
    };
  }

  if (btnMassing) {
    btnMassing.onclick = () => {
      toggleMassingDrawer();
    };
  }

  if (btnMeasure) {
    btnMeasure.onclick = () => {
      if (!viewportInstance) return;
      const willBeActive = !viewportInstance.isMeasureMode;
      viewportInstance.setMeasureMode(willBeActive);
      btnMeasure.classList.toggle('active', willBeActive);
    };
  }

  if (btnPresentation) {
    btnPresentation.onclick = () => {
      setPresentationMode(true);
    };
  }
}

/* ==============================================================
   06. LAYERS & GLOBAL TRANSPARENCY DRAWER
   ============================================================== */
function toggleLayersDrawer() {
  const drawer = document.getElementById('sa-layers-drawer');
  const toolbarBtn = document.getElementById('sa-btn-layers');
  if (!drawer) return;

  isLayersDrawerOpen = !isLayersDrawerOpen;
  drawer.classList.toggle('collapsed', !isLayersDrawerOpen);
  if (toolbarBtn) toolbarBtn.classList.toggle('active', isLayersDrawerOpen);

  // Close massing drawer if both were opened
  if (isLayersDrawerOpen && isMassingDrawerOpen) {
    toggleMassingDrawer();
  }
}

function bindLayersDrawer() {
  const closeBtn = document.getElementById('sa-layers-close-btn');
  if (closeBtn) {
    closeBtn.onclick = () => toggleLayersDrawer();
  }

  const layerKeys = [
    'building', 'wind', 'sun', 'terrain', 'shadows',
    'context', 'vegetation', 'roads', 'utilities', 'grid'
  ];

  layerKeys.forEach(k => {
    const cb = document.getElementById(`layer-vis-${k}`);
    const slider = document.getElementById(`layer-op-${k}`);
    const valText = document.getElementById(`layer-op-val-${k}`);

    if (cb) {
      cb.onchange = (e) => {
        if (viewportInstance) {
          viewportInstance.setLayerVisibility(k, e.target.checked);
        }
      };
    }

    if (slider) {
      slider.oninput = (e) => {
        const val = parseFloat(e.target.value);
        if (valText) valText.textContent = `${Math.round(val * 100)}%`;
        if (viewportInstance) {
          viewportInstance.setLayerOpacity(k, val);
        }
      };
    }
  });
}

/* ==============================================================
   07. CONCEPTUAL MASSING & SYNCHRONIZED FLOORS DRAWER
   ============================================================== */
function toggleMassingDrawer() {
  const drawer = document.getElementById('sa-massing-drawer');
  const toolbarBtn = document.getElementById('sa-btn-massing');
  if (!drawer) return;

  isMassingDrawerOpen = !isMassingDrawerOpen;
  drawer.classList.toggle('collapsed', !isMassingDrawerOpen);
  if (toolbarBtn) toolbarBtn.classList.toggle('active', isMassingDrawerOpen);

  // Close layers drawer if both opened
  if (isMassingDrawerOpen && isLayersDrawerOpen) {
    toggleLayersDrawer();
  }
}

function updateMassingAreaMetrics() {
  if (!viewportInstance || !viewportInstance.massing) return;
  const metrics = viewportInstance.massing.getMetrics();

  const fpVal = document.getElementById('sa-mass-footprint-val');
  const buVal = document.getElementById('sa-mass-builtup-val');
  const floorsBadge = document.getElementById('sa-floors-count-val');
  const totalHNum = document.getElementById('sa-mass-height-num');
  const totalHSlider = document.getElementById('sa-mass-height-slider');

  if (fpVal) fpVal.textContent = `${metrics.footprint.toLocaleString()} m²`;
  if (buVal) buVal.textContent = `${metrics.builtUp.toLocaleString()} m²`;
  if (floorsBadge) floorsBadge.textContent = metrics.floors;
  if (totalHNum) totalHNum.value = metrics.totalHeight.toFixed(1);
  if (totalHSlider) totalHSlider.value = metrics.totalHeight.toFixed(1);
}

function bindMassingDrawer() {
  const closeBtn = document.getElementById('sa-massing-close-btn');
  if (closeBtn) {
    closeBtn.onclick = () => toggleMassingDrawer();
  }

  // Shape Type Buttons
  const shapeBtns = document.querySelectorAll('.sa-shape-btn[data-shape]');
  shapeBtns.forEach(btn => {
    btn.onclick = () => {
      shapeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const shape = btn.dataset.shape;
      if (viewportInstance && viewportInstance.massing) {
        viewportInstance.massing.setShapeType(shape);
        updateMassingAreaMetrics();
      }
    };
  });

  // Floors Stepper [−] [+]
  const decBtn = document.getElementById('sa-floor-decrement-btn');
  const incBtn = document.getElementById('sa-floor-increment-btn');

  if (decBtn) {
    decBtn.onclick = () => {
      if (viewportInstance && viewportInstance.massing) {
        const cur = viewportInstance.massing.params.floors;
        if (cur > 1) {
          viewportInstance.massing.setFloors(cur - 1);
          updateMassingAreaMetrics();
        }
      }
    };
  }

  if (incBtn) {
    incBtn.onclick = () => {
      if (viewportInstance && viewportInstance.massing) {
        const cur = viewportInstance.massing.params.floors;
        if (cur < 25) {
          viewportInstance.massing.setFloors(cur + 1);
          updateMassingAreaMetrics();
        }
      }
    };
  }

  // Floor Height Slider & Input
  const fHeightSlider = document.getElementById('sa-mass-floorHeight-slider');
  const fHeightNum = document.getElementById('sa-mass-floorHeight-num');
  if (fHeightSlider && fHeightNum) {
    const handleFHeight = (val) => {
      fHeightSlider.value = val;
      fHeightNum.value = val;
      if (viewportInstance && viewportInstance.massing) {
        viewportInstance.massing.setFloorHeight(val);
        updateMassingAreaMetrics();
      }
    };
    fHeightSlider.oninput = (e) => handleFHeight(e.target.value);
    fHeightNum.oninput = (e) => handleFHeight(e.target.value);
  }

  // Total Height Slider & Input
  const totalHSlider = document.getElementById('sa-mass-height-slider');
  const totalHNum = document.getElementById('sa-mass-height-num');
  if (totalHSlider && totalHNum) {
    const handleTotalH = (val) => {
      totalHSlider.value = val;
      totalHNum.value = val;
      if (viewportInstance && viewportInstance.massing) {
        viewportInstance.massing.setTotalHeight(val);
        updateMassingAreaMetrics();
      }
    };
    totalHSlider.oninput = (e) => handleTotalH(e.target.value);
    totalHNum.oninput = (e) => handleTotalH(e.target.value);
  }

  // Dimensions & Transformation Inputs
  const fields = ['length', 'width', 'posX', 'posZ', 'rotation'];
  fields.forEach(f => {
    const slider = document.getElementById(`sa-mass-${f}-slider`);
    const num = document.getElementById(`sa-mass-${f}-num`);

    if (slider && num) {
      const handleField = (val) => {
        slider.value = val;
        num.value = val;
        if (viewportInstance && viewportInstance.massing) {
          viewportInstance.massing.updateParam(f, val);
          updateMassingAreaMetrics();
        }
      };
      slider.oninput = (e) => handleField(e.target.value);
      num.oninput = (e) => handleField(e.target.value);
    }
  });

  // Initial metrics update
  updateMassingAreaMetrics();
}

/* ==============================================================
   08. MEASUREMENT TOOL HUD
   ============================================================== */
function bindMeasureHUD() {
  const clearBtn = document.getElementById('sa-measure-clear-btn');
  const exitBtn = document.getElementById('sa-measure-exit-btn');
  const toolbarMeasureBtn = document.getElementById('sa-btn-measure');

  if (clearBtn) {
    clearBtn.onclick = () => {
      if (viewportInstance) viewportInstance.clearMeasurement();
    };
  }

  if (exitBtn) {
    exitBtn.onclick = () => {
      if (viewportInstance) {
        viewportInstance.setMeasureMode(false);
        if (toolbarMeasureBtn) toolbarMeasureBtn.classList.remove('active');
      }
    };
  }
}

/* ==============================================================
   09. PRESENTATION MODE & COLLAPSIBLE PANELS
   ============================================================== */
function setPresentationMode(active) {
  isPresentationMode = active;
  const view = document.getElementById('site-analysis-view');
  if (view) {
    view.classList.toggle('presentation-mode-active', active);
  }

  setTimeout(() => {
    if (viewportInstance) viewportInstance.handleResize();
  }, 60);
}

function bindPresentationAndPanels() {
  // Exit Presentation Button
  const exitPresBtn = document.getElementById('sa-exit-presentation-btn');
  if (exitPresBtn) {
    exitPresBtn.onclick = () => setPresentationMode(false);
  }

  // Global Escape Key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (isPresentationMode) {
        setPresentationMode(false);
      }
      if (viewportInstance && viewportInstance.isMeasureMode) {
        viewportInstance.setMeasureMode(false);
        const btnMeasure = document.getElementById('sa-btn-measure');
        if (btnMeasure) btnMeasure.classList.remove('active');
      }
    }
  });

  // Collapsible Side Panels
  const wsBody = document.getElementById('sa-workspace-body');
  const leftPanel = document.getElementById('sa-left-panel');
  const rightPanel = document.getElementById('sa-right-panel');

  const btnToggleLeft = document.getElementById('sa-toggle-left-btn');
  const btnCollapseLeft = document.getElementById('sa-left-collapse-btn');
  const btnToggleRight = document.getElementById('sa-toggle-right-btn');
  const btnCollapseRight = document.getElementById('sa-right-collapse-btn');

  const toggleLeft = () => {
    isLeftPanelCollapsed = !isLeftPanelCollapsed;
    if (leftPanel) leftPanel.classList.toggle('collapsed', isLeftPanelCollapsed);
    if (wsBody) wsBody.classList.toggle('left-collapsed', isLeftPanelCollapsed);
    if (btnToggleLeft) btnToggleLeft.classList.toggle('active', isLeftPanelCollapsed);
    setTimeout(() => {
      if (viewportInstance) viewportInstance.handleResize();
    }, 60);
  };

  const toggleRight = () => {
    isRightPanelCollapsed = !isRightPanelCollapsed;
    if (rightPanel) rightPanel.classList.toggle('collapsed', isRightPanelCollapsed);
    if (wsBody) wsBody.classList.toggle('right-collapsed', isRightPanelCollapsed);
    if (btnToggleRight) btnToggleRight.classList.toggle('active', isRightPanelCollapsed);
    setTimeout(() => {
      if (viewportInstance) viewportInstance.handleResize();
    }, 60);
  };

  if (btnToggleLeft) btnToggleLeft.onclick = toggleLeft;
  if (btnCollapseLeft) btnCollapseLeft.onclick = toggleLeft;
  if (btnToggleRight) btnToggleRight.onclick = toggleRight;
  if (btnCollapseRight) btnCollapseRight.onclick = toggleRight;
}
