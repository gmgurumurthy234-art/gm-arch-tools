/**
 * GM ARCH TOOLS — Site Analysis Module Coordinator
 * Author: Guru Murthy (GM)
 * Coordinates the 3-column architectural workspace:
 *   - Left Panel (Topics 01 to 05)
 *   - Central 3D Viewport (Three.js & OrbitControls)
 *   - Right Panel (Topics 06 to 10)
 *   - Mode-specific Infographic & Information Panels
 *   - Conceptual Massing Drawer & View Controls
 */

import { SITE_ANALYSIS_MODES } from './analysis-modes-data.js';
import { SiteViewport } from './site-viewport.js';

let viewportInstance = null;
let activeModeId = '02'; // Default: Sun Path & Solar Analysis
let isMassingDrawerOpen = false;

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

  // Bind Viewport Camera Toolbar
  bindCameraToolbar();

  // Bind Layer Toggles
  bindLayerToggles();

  // Bind Massing Drawer Controls
  bindMassingDrawer();

  // Handle Window Resize
  window.addEventListener('resize', () => {
    if (viewportInstance) viewportInstance.handleResize();
  });
}

/* ==============================================================
   TOPIC LISTS RENDERING (LEFT: 01-05 | RIGHT: 06-10)
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
    rightList.innerHTML = rightModes.map(m => renderTopicBtn(m)).join('');
  }

  // Attach Click Handlers to All Topic Buttons
  const topicBtns = document.querySelectorAll('.sa-topic-btn');
  topicBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const modeId = btn.dataset.modeId;
      selectAnalysisMode(modeId);
    });
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
   MODE SWITCHER (Smooth transition without scene reload)
   ============================================================== */
export function selectAnalysisMode(modeId) {
  activeModeId = modeId;

  // 1. Update Buttons Active State
  const btns = document.querySelectorAll('.sa-topic-btn');
  btns.forEach(b => {
    b.classList.toggle('active', b.dataset.modeId === modeId);
  });

  // 2. Update Header Mode Pill
  const modeData = SITE_ANALYSIS_MODES.find(m => m.id === modeId);
  const pill = document.getElementById('sa-mode-indicator-text');
  if (pill && modeData) {
    pill.textContent = `MODE ${modeData.num}: ${modeData.name}`;
  }

  // 3. Update 3D Viewport Overlays
  if (viewportInstance && viewportInstance.overlays) {
    viewportInstance.overlays.setMode(modeId);
  }

  // 4. Update Viewport Legend
  updateViewportLegend(modeData);

  // 5. Render Active Mode Information & Controls
  renderActiveModeDetails();
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
   MODE DETAILS & INTERACTIVE CONTROLS RENDERING
   ============================================================== */
function renderActiveModeDetails() {
  const mode = SITE_ANALYSIS_MODES.find(m => m.id === activeModeId);
  if (!mode) return;

  // Determine Target Panel for Details
  // If active mode is on left (01-05), dock details under left panel
  // If active mode is on right (06-10), dock details under right panel
  const isLeft = mode.panel === 'left';
  const targetContainer = isLeft 
    ? document.getElementById('sa-left-details-container')
    : document.getElementById('sa-right-details-container');

  const otherContainer = isLeft
    ? document.getElementById('sa-right-details-container')
    : document.getElementById('sa-left-details-container');

  if (otherContainer) otherContainer.innerHTML = '';
  if (!targetContainer) return;

  targetContainer.innerHTML = `
    <!-- Interactive Mode Controls Section -->
    <div class="sa-mode-controls-panel">
      <div class="sa-controls-title">
        <span>${mode.num} PARAMETRIC CONTROLS</span>
        <span style="font-size: 11px; opacity: 0.7;">Interactive</span>
      </div>
      ${renderModeSpecificControls(mode)}
    </div>

    <!-- Structured Information & Infographic Card (Section 29) -->
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

      <!-- Key Parameters -->
      <div class="sa-info-block">
        <h4 class="sa-info-heading">KEY PARAMETERS</h4>
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

      <!-- Strict Calculation Coming Soon Notice (Section 30 & 32) -->
      <div class="sa-coming-soon-box">
        <div class="sa-cs-title">
          <span>🔒</span>
          <span>${mode.calculationStatus}</span>
        </div>
        <p class="sa-cs-desc">${mode.calculationNote}</p>
      </div>

      <!-- Sources & References (Section 31 & 33) -->
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

function renderModeSpecificControls(mode) {
  if (mode.id === '02') {
    // Sun Path Controls
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
          <span>06:00 Sunrise</span>
          <span>12:00 Noon</span>
          <span>18:00 Sunset</span>
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
    // Wind Controls
    const wind = viewportInstance ? viewportInstance.overlays.windState : { direction: 'SW', speed: 1.0, isPlaying: true };
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

    return `
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <div style="font-family: var(--sa-font-mono); font-size: 10px; color: var(--sa-text-muted);">
          Select Prevailing Wind Direction:
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
          <span class="sa-field-label">Flow Speed</span>
          <input type="range" id="sa-wind-speed-slider" class="sa-slider" min="0.3" max="2.5" step="0.1" value="${wind.speed}">
        </div>

        <div class="sa-anim-controls-row">
          <button type="button" class="sa-anim-btn ${wind.isPlaying ? 'playing' : ''}" id="sa-wind-play-btn">
            <span>${wind.isPlaying ? '⏸ Pause Flow' : '▶ Play Flow'}</span>
          </button>
          <button type="button" class="sa-anim-btn" id="sa-wind-reset-btn">
            <span>↺ Reset Particles</span>
          </button>
        </div>
      </div>
    `;
  }

  if (mode.id === '04') {
    // Orientation Controls
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
          Align building long-axis along East-West to minimize direct solar heat gain on high-exposure facades.
        </p>
      </div>
    `;
  }

  if (mode.id === '10') {
    // Utilities Toggles
    const layers = viewportInstance ? viewportInstance.overlays.utilityLayers : { water: true, power: true, sewer: true, storm: true };
    return `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <label class="sa-layer-toggle">
          <input type="checkbox" id="util-layer-water" ${layers.water ? 'checked' : ''}>
          <span style="color: #2563eb;">●</span>
          <span>Potable Water Supply (Pressurized)</span>
        </label>
        <label class="sa-layer-toggle">
          <input type="checkbox" id="util-layer-power" ${layers.power ? 'checked' : ''}>
          <span style="color: #eab308;">●</span>
          <span>Electrical Power (HV / Transformer)</span>
        </label>
        <label class="sa-layer-toggle">
          <input type="checkbox" id="util-layer-sewer" ${layers.sewer ? 'checked' : ''}>
          <span style="color: #d946ef;">●</span>
          <span>Sanitary Waste Sewer (Gravity)</span>
        </label>
        <label class="sa-layer-toggle">
          <input type="checkbox" id="util-layer-storm" ${layers.storm ? 'checked' : ''}>
          <span style="color: #06b6d4;">●</span>
          <span>Stormwater Drainage (Percolation)</span>
        </label>
      </div>
    `;
  }

  return `
    <div style="font-size: 11px; color: var(--sa-text-muted); line-height: 1.5;">
      Rotate and orbit the 3D viewport to inspect site relationships. Click camera buttons above to view orthogonal elevations.
    </div>
  `;
}

function bindModeSpecificControls(mode) {
  if (mode.id === '02') {
    const slider = document.getElementById('sa-sun-time-slider');
    const playBtn = document.getElementById('sa-sun-play-btn');
    const resetBtn = document.getElementById('sa-sun-reset-btn');
    const display = document.getElementById('sa-sun-time-display');

    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (viewportInstance && viewportInstance.overlays) {
          viewportInstance.overlays.sunState.isPlaying = false;
          viewportInstance.overlays.setSunTime(val);
          updateSunReadouts();
        }
        if (playBtn) playBtn.innerHTML = '<span>▶ Play Diurnal Orbit</span>';
      });
    }

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (!viewportInstance || !viewportInstance.overlays) return;
        const sun = viewportInstance.overlays.sunState;
        sun.isPlaying = !sun.isPlaying;
        playBtn.classList.toggle('playing', sun.isPlaying);
        playBtn.innerHTML = sun.isPlaying ? '<span>⏸ Pause</span>' : '<span>▶ Play Diurnal Orbit</span>';
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (!viewportInstance || !viewportInstance.overlays) return;
        viewportInstance.overlays.sunState.isPlaying = false;
        viewportInstance.overlays.setSunTime(12.0);
        if (slider) slider.value = 12.0;
        if (playBtn) {
          playBtn.classList.remove('playing');
          playBtn.innerHTML = '<span>▶ Play Diurnal Orbit</span>';
        }
        updateSunReadouts();
      });
    }

    // Season Preset Buttons
    ['EQUINOX', 'SUMMER', 'WINTER'].forEach(s => {
      const btn = document.getElementById(`season-${s.toLowerCase()}`);
      if (btn) {
        btn.addEventListener('click', () => {
          document.querySelectorAll('[data-season]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          if (viewportInstance && viewportInstance.overlays) {
            viewportInstance.overlays.setSunSeason(s);
            updateSunReadouts();
          }
        });
      }
    });

    // Helper to update readouts
    const updateSunReadouts = () => {
      if (!viewportInstance || !viewportInstance.overlays) return;
      const sun = viewportInstance.overlays.sunState;
      const h = Math.floor(sun.hour);
      const m = Math.floor((sun.hour % 1) * 60);
      if (display) display.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} hrs`;

      const altEl = document.getElementById('sa-alt-readout');
      const azEl = document.getElementById('sa-az-readout');
      if (altEl) altEl.textContent = `${sun.altitudeDeg}°`;
      if (azEl) azEl.textContent = `${sun.azimuthDeg}°`;
    };
  }

  if (mode.id === '03') {
    // Wind Direction Buttons
    const dirBtns = document.querySelectorAll('.sa-dir-btn');
    dirBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        dirBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const dir = btn.dataset.windDir;
        if (viewportInstance && viewportInstance.overlays) {
          viewportInstance.overlays.setWindDirection(dir);
        }
      });
    });

    const speedSlider = document.getElementById('sa-wind-speed-slider');
    if (speedSlider) {
      speedSlider.addEventListener('input', (e) => {
        if (viewportInstance && viewportInstance.overlays) {
          viewportInstance.overlays.windState.speed = parseFloat(e.target.value);
        }
      });
    }

    const playBtn = document.getElementById('sa-wind-play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (!viewportInstance || !viewportInstance.overlays) return;
        const wind = viewportInstance.overlays.windState;
        wind.isPlaying = !wind.isPlaying;
        playBtn.classList.toggle('playing', wind.isPlaying);
        playBtn.innerHTML = wind.isPlaying ? '<span>⏸ Pause Flow</span>' : '<span>▶ Play Flow</span>';
      });
    }

    const resetBtn = document.getElementById('sa-wind-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (!viewportInstance || !viewportInstance.overlays) return;
        viewportInstance.overlays.setWindDirection(viewportInstance.overlays.windState.direction);
      });
    }
  }

  if (mode.id === '04') {
    const orientSlider = document.getElementById('sa-orient-slider');
    const orientVal = document.getElementById('sa-orient-val');
    if (orientSlider) {
      orientSlider.addEventListener('input', (e) => {
        const deg = parseFloat(e.target.value);
        if (orientVal) orientVal.textContent = `${deg}°`;
        if (viewportInstance && viewportInstance.massing) {
          viewportInstance.massing.updateParam('rotation', deg);
        }
      });
    }
  }

  if (mode.id === '10') {
    ['water', 'power', 'sewer', 'storm'].forEach(k => {
      const cb = document.getElementById(`util-layer-${k}`);
      if (cb) {
        cb.addEventListener('change', (e) => {
          if (viewportInstance && viewportInstance.overlays) {
            viewportInstance.overlays.setUtilityLayer(k, e.target.checked);
          }
        });
      }
    });
  }
}

/* ==============================================================
   VIEWPORT CAMERA TOOLBAR (Section 9)
   TOP, FRONT, RIGHT, LEFT, BACK, ISOMETRIC, PERSPECTIVE, RESET, FIT
   ============================================================== */
function bindCameraToolbar() {
  const camBtns = document.querySelectorAll('.sa-cam-btn');
  camBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.cam;
      camBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (viewportInstance) {
        viewportInstance.setCameraPreset(preset);
      }
    });
  });
}

/* ==============================================================
   LAYER TOGGLES (Section 37)
   Building, Grid, North, Context, Analysis Overlay
   ============================================================== */
function bindLayerToggles() {
  const toggles = [
    { id: 'sa-layer-building', layer: 'building' },
    { id: 'sa-layer-grid', layer: 'grid' },
    { id: 'sa-layer-north', layer: 'north' },
    { id: 'sa-layer-context', layer: 'context' },
    { id: 'sa-layer-overlay', layer: 'overlay' }
  ];

  toggles.forEach(t => {
    const el = document.getElementById(t.id);
    if (el) {
      el.addEventListener('change', (e) => {
        if (viewportInstance) {
          viewportInstance.setLayerVisibility(t.layer, e.target.checked);
        }
      });
    }
  });
}

/* ==============================================================
   CONCEPTUAL MASSING TOOLS DRAWER (Section 6 & 7)
   ============================================================== */
function bindMassingDrawer() {
  const toggleBtn = document.getElementById('sa-toggle-massing-btn');
  const drawer = document.getElementById('sa-massing-drawer');
  const closeBtn = document.getElementById('sa-drawer-close-btn');

  if (toggleBtn && drawer) {
    toggleBtn.addEventListener('click', () => {
      isMassingDrawerOpen = !isMassingDrawerOpen;
      drawer.classList.toggle('collapsed', !isMassingDrawerOpen);
      toggleBtn.classList.toggle('active', isMassingDrawerOpen);
    });
  }

  if (closeBtn && drawer) {
    closeBtn.addEventListener('click', () => {
      isMassingDrawerOpen = false;
      drawer.classList.add('collapsed');
      if (toggleBtn) toggleBtn.classList.remove('active');
    });
  }

  // Shape Type Buttons
  const shapeBtns = document.querySelectorAll('.sa-shape-btn[data-shape]');
  shapeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      shapeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const shape = btn.dataset.shape;
      if (viewportInstance && viewportInstance.massing) {
        viewportInstance.massing.setShapeType(shape);
      }
    });
  });

  // Numeric & Slider Synchronized Inputs
  const fields = ['length', 'width', 'height', 'posX', 'posZ', 'rotation'];
  fields.forEach(field => {
    const slider = document.getElementById(`sa-mass-${field}-slider`);
    const numInput = document.getElementById(`sa-mass-${field}-num`);

    if (slider && numInput) {
      slider.addEventListener('input', (e) => {
        numInput.value = e.target.value;
        if (viewportInstance && viewportInstance.massing) {
          viewportInstance.massing.updateParam(field, e.target.value);
        }
      });

      numInput.addEventListener('input', (e) => {
        slider.value = e.target.value;
        if (viewportInstance && viewportInstance.massing) {
          viewportInstance.massing.updateParam(field, e.target.value);
        }
      });
    }
  });
}
