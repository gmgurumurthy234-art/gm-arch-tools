/**
 * GM ARCH TOOLS — THE DESIGNER: Master Workspace Coordinator
 * Author: Guru Murthy (GM)
 *
 * Coordinates:
 *   - Central Interactive 3D Viewport
 *   - Hidden Left-Edge Navigation Drawer (Projects, Module Hub, Dynamic Account)
 *   - Left 10-Design-Modes Panel (01 Massing Active, 02-10 Coming Soon)
 *   - Compact Floating Vertical Modelling Toolbar (Select, Polyline, Rectangle, Circle, Polygon, Measure, Divide, Delete, Undo, Redo)
 *   - Top Design Options System (OPTION 1, + New Option, Isolation, Preserved State)
 *   - Contextual Right Feature Panel (Site Location, Development Controls, Building Height, Coverage, Setbacks, Live Metrics)
 *   - Visual Infographics (FSI Gauge, Vertical Height Scale, Floor Stack, Coverage Bar)
 *   - Presentation Mode (Zero Chrome, Maximum 3D Focus)
 */

import { DesignerViewport } from './designer-viewport.js';
import { DesignerOptionManager } from './designer-options.js';
import { calculateOptionMetrics, divideMass } from './designer-massing.js';
import { getCurrentUser, isAuthenticated } from '../auth/account-manager.js';
import { SiteState } from '../state/site-state.js';

let viewportInstance = null;
let optionManagerInstance = null;
let activeModeId = '01'; // Default: 01 MASSING
let selectedMassId = null;
let isPresentationMode = false;
let isLayersDropdownOpen = false;
let edgeNavTimeout = null;

export function initDesignerApp() {
  const container = document.getElementById('designer-viewport-canvas-wrap');
  if (!container) return;

  // 1. Initialize Options Manager
  if (!optionManagerInstance) {
    optionManagerInstance = new DesignerOptionManager();
  }

  // 2. Initialize 3D Viewport
  if (!viewportInstance) {
    viewportInstance = new DesignerViewport('designer-viewport-canvas-wrap', {
      onSelectMass: (massId) => handleMassSelected(massId),
      onDrawingCompleted: (massData) => handleDrawingCompleted(massData),
      onMeasureCompleted: (dist) => handleMeasureCompleted(dist)
    });
  }

  // 3. Render Initial State
  renderOptionTabs();
  renderDesignModes();
  bindModellingToolbar();
  bindViewportToolbar();
  bindEdgeNavigation();
  bindRightPanelInputs();
  bindKeyboardShortcuts();

  // 4. Initial Scene & Telemetry Sync
  syncViewportAndPanels();

  // 5. Subscribe to Option Manager Changes
  optionManagerInstance.subscribe((eventType) => {
    renderOptionTabs();
    syncViewportAndPanels();
  });
}

export function pauseDesignerApp() {
  if (viewportInstance) {
    viewportInstance.pause();
  }
}

export function resumeDesignerApp() {
  if (viewportInstance) {
    viewportInstance.resume();
    syncViewportAndPanels();
  }
}

/* ==============================================================
   01. SYNCHRONIZATION: VIEWPORT & RIGHT PARAMETER PANEL
   ============================================================== */
function syncViewportAndPanels() {
  if (!optionManagerInstance || !viewportInstance) return;
  const activeOption = optionManagerInstance.getActiveOption();
  if (!activeOption) return;

  // 1. Update 3D Viewport
  viewportInstance.renderOption(activeOption, selectedMassId);

  // 2. Compute Metrics
  const metrics = calculateOptionMetrics(activeOption);

  // 3. Update Right Panel Inputs
  updateRightPanelValues(activeOption, metrics);

  // 4. Update Infographics
  updateInfographics(activeOption, metrics);
}

function handleDrawingCompleted(massData) {
  if (!optionManagerInstance) return;
  const activeOption = optionManagerInstance.getActiveOption();
  if (!activeOption) return;

  // Apply default floors & floor height from option parameters
  const massPayload = {
    ...massData,
    floors: activeOption.defaultFloors || 5,
    floorHeight: activeOption.defaultFloorHeight || 3.2
  };

  const newMass = optionManagerInstance.addMassToActive(massPayload);
  if (newMass) {
    selectedMassId = newMass.id;
    // Switch tool back to SELECT once shape is completed
    setModellingTool('SELECT');
    syncViewportAndPanels();
  }
}

function handleMassSelected(massId) {
  selectedMassId = massId;
  syncViewportAndPanels();
  updateSelectedMassCard();
}

function handleMeasureCompleted(dist) {
  const badge = document.getElementById('designer-measure-result-badge');
  if (badge) {
    badge.textContent = `DISTANCE: ${dist.toFixed(2)} m (${(dist * 3.28084).toFixed(1)} ft)`;
    badge.style.display = 'block';
    setTimeout(() => {
      badge.style.display = 'none';
    }, 4500);
  }
}

/* ==============================================================
   02. TOP DESIGN OPTION TABS SYSTEM
   ============================================================== */
function renderOptionTabs() {
  const container = document.getElementById('designer-option-tabs-container');
  if (!container || !optionManagerInstance) return;

  const options = optionManagerInstance.getAllOptions();
  const activeId = optionManagerInstance.activeOptionId;

  container.innerHTML = options.map(opt => {
    const isActive = opt.id === activeId;
    return `
      <div class="designer-option-tab ${isActive ? 'active' : ''}" data-option-id="${opt.id}">
        <span class="designer-opt-name" title="Click to switch option">${escapeHtml(opt.name)}</span>
        ${options.length > 1 ? `
          <button type="button" class="designer-opt-delete-btn" data-action="delete" title="Delete ${opt.name}">✕</button>
        ` : ''}
      </div>
    `;
  }).join('');

  // Add "+" New Option Button
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'designer-add-option-btn';
  addBtn.id = 'designer-btn-add-option';
  addBtn.title = 'Create New Design Option';
  addBtn.innerHTML = `<span>+</span> <span class="btn-label">NEW OPTION</span>`;
  container.appendChild(addBtn);

  // Tab click events
  container.querySelectorAll('.designer-option-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const optId = tab.dataset.optionId;
      if (e.target.closest('[data-action="delete"]')) {
        e.stopPropagation();
        if (confirm(`Delete ${tab.querySelector('.designer-opt-name').textContent}?`)) {
          optionManagerInstance.deleteOption(optId);
        }
        return;
      }
      selectedMassId = null;
      optionManagerInstance.switchOption(optId);
    });
  });

  addBtn.addEventListener('click', () => {
    selectedMassId = null;
    optionManagerInstance.createOption();
  });
}

/* ==============================================================
   03. LEFT DESIGN MODES (01 MASSING ACTIVE | 02-10 COMING SOON)
   ============================================================== */
const DESIGNER_MODES = [
  { id: '01', num: '01', name: 'MASSING', status: 'ACTIVE', icon: '🏛️' },
  { id: '02', num: '02', name: 'DESIGN MODE', status: 'COMING SOON', icon: '📐' },
  { id: '03', num: '03', name: 'DESIGN MODE', status: 'COMING SOON', icon: '🏢' },
  { id: '04', num: '04', name: 'DESIGN MODE', status: 'COMING SOON', icon: '🌿' },
  { id: '05', num: '05', name: 'DESIGN MODE', status: 'COMING SOON', icon: '☀️' },
  { id: '06', num: '06', name: 'DESIGN MODE', status: 'COMING SOON', icon: '⚡' },
  { id: '07', num: '07', name: 'DESIGN MODE', status: 'COMING SOON', icon: '📊' },
  { id: '08', num: '08', name: 'DESIGN MODE', status: 'COMING SOON', icon: '🧭' },
  { id: '09', num: '09', name: 'DESIGN MODE', status: 'COMING SOON', icon: '📐' },
  { id: '10', num: '10', name: 'DESIGN MODE', status: 'COMING SOON', icon: '🎯' }
];

function renderDesignModes() {
  const container = document.getElementById('designer-modes-list');
  if (!container) return;

  container.innerHTML = DESIGNER_MODES.map(mode => {
    const isActive = mode.id === activeModeId;
    const isComingSoon = mode.status === 'COMING SOON';

    return `
      <li class="designer-mode-item ${isActive ? 'active' : ''} ${isComingSoon ? 'coming-soon' : ''}">
        <button type="button" 
                class="designer-mode-btn" 
                data-mode-id="${mode.id}"
                title="${isComingSoon ? 'Coming Soon' : mode.name}">
          <span class="d-mode-num">${mode.num}</span>
          <span class="d-mode-title">${mode.name}</span>
          <span class="d-mode-status ${isComingSoon ? 'status-soon' : 'status-active'}">
            ${isComingSoon ? 'SOON' : 'ACTIVE'}
          </span>
        </button>
      </li>
    `;
  }).join('');

  container.querySelectorAll('.designer-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modeId = btn.dataset.modeId;
      if (modeId === '01') {
        activeModeId = '01';
        renderDesignModes();
        updateRightPanelContext();
      } else {
        showTemporaryToast(`Mode ${modeId} is reserved for future architectural capability.`);
      }
    });
  });
}

function updateRightPanelContext() {
  const titleEl = document.getElementById('designer-panel-context-title');
  if (titleEl) {
    titleEl.textContent = activeModeId === '01' ? 'MASSING PARAMETERS' : `MODE ${activeModeId} PARAMETERS`;
  }
}

/* ==============================================================
   04. COMPACT FLOATING MODELLING TOOLBAR
   ============================================================== */
function bindModellingToolbar() {
  const toolbar = document.getElementById('designer-modelling-toolbar');
  if (!toolbar) return;

  toolbar.querySelectorAll('.designer-tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.tool;

      if (action === 'DELETE') {
        if (selectedMassId && optionManagerInstance) {
          optionManagerInstance.removeMass(selectedMassId);
          selectedMassId = null;
          syncViewportAndPanels();
        }
        return;
      }

      if (action === 'DUPLICATE') {
        if (selectedMassId && optionManagerInstance) {
          const dup = optionManagerInstance.duplicateMass(selectedMassId);
          if (dup) selectedMassId = dup.id;
          syncViewportAndPanels();
        }
        return;
      }

      if (action === 'DIVIDE') {
        if (selectedMassId && optionManagerInstance) {
          const active = optionManagerInstance.getActiveOption();
          const targetMass = active?.masses.find(m => m.id === selectedMassId);
          if (targetMass) {
            const divided = divideMass(targetMass);
            if (divided) {
              optionManagerInstance.removeMass(selectedMassId);
              divided.forEach(m => optionManagerInstance.addMassToActive(m));
              selectedMassId = divided[0].id;
              syncViewportAndPanels();
              showTemporaryToast('Mass conceptually divided into two portions.');
            }
          }
        }
        return;
      }

      if (action === 'UNDO') {
        if (optionManagerInstance) optionManagerInstance.undo();
        return;
      }

      if (action === 'REDO') {
        if (optionManagerInstance) optionManagerInstance.redo();
        return;
      }

      // Drafting / Selection tools
      setModellingTool(action);
    });
  });
}

function setModellingTool(toolName) {
  if (viewportInstance) {
    viewportInstance.setTool(toolName);
  }

  const toolbar = document.getElementById('designer-modelling-toolbar');
  if (toolbar) {
    toolbar.querySelectorAll('.designer-tool-btn').forEach(btn => {
      const isTarget = btn.dataset.tool === toolName;
      btn.classList.toggle('active', isTarget);
    });
  }

  // Update prompt HUD
  const promptEl = document.getElementById('designer-active-tool-prompt');
  if (promptEl) {
    const prompts = {
      SELECT: 'SELECT: Click a building mass to edit properties.',
      RECTANGLE: 'RECTANGLE: Click first corner, then click opposite corner on the ground grid.',
      POLYLINE: 'POLYLINE: Click vertices on the ground. Click near start point or press Enter to close.',
      CIRCLE: 'CIRCLE: Click center point, drag radius and click to finalize circular mass.',
      POLYGON: 'POLYGON: Click center point, drag radius and click to finalize polygon.',
      MEASURE: 'MEASURE: Click start point, then click end point to measure 3D distance.'
    };
    promptEl.textContent = prompts[toolName] || '';
  }
}

/* ==============================================================
   05. VIEWPORT TOP TOOLBAR CONTROLS
   ============================================================== */
function bindViewportToolbar() {
  // Preset Camera Buttons
  const cameraBtns = document.querySelectorAll('.designer-view-btn[data-view]');
  cameraBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      cameraBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (viewportInstance) viewportInstance.setCameraPreset(view);
    });
  });

  // Grid Toggle
  const gridToggle = document.getElementById('designer-btn-toggle-grid');
  if (gridToggle) {
    gridToggle.addEventListener('click', () => {
      const isCurrentlyActive = gridToggle.classList.toggle('active');
      if (viewportInstance) viewportInstance.setGridVisible(isCurrentlyActive);
    });
  }

  // Axes Toggle
  const axesToggle = document.getElementById('designer-btn-toggle-axes');
  if (axesToggle) {
    axesToggle.addEventListener('click', () => {
      const isCurrentlyActive = axesToggle.classList.toggle('active');
      if (viewportInstance) viewportInstance.setAxesVisible(isCurrentlyActive);
    });
  }

  // Layers Dropdown
  const layersBtn = document.getElementById('designer-btn-layers');
  const layersDropdown = document.getElementById('designer-layers-dropdown');
  if (layersBtn && layersDropdown) {
    layersBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      isLayersDropdownOpen = !isLayersDropdownOpen;
      layersDropdown.style.display = isLayersDropdownOpen ? 'block' : 'none';
      layersBtn.classList.toggle('active', isLayersDropdownOpen);
    });

    document.addEventListener('click', () => {
      if (isLayersDropdownOpen) {
        isLayersDropdownOpen = false;
        layersDropdown.style.display = 'none';
        layersBtn.classList.remove('active');
      }
    });

    layersDropdown.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const layerKey = cb.dataset.layer;
        if (viewportInstance) {
          viewportInstance.setLayerVisible(layerKey, cb.checked);
        }
      });
    });
  }

  // Presentation Mode Toggle
  const presBtn = document.getElementById('designer-btn-presentation');
  const exitPresBtn = document.getElementById('designer-exit-presentation-btn');
  if (presBtn) {
    presBtn.addEventListener('click', () => setPresentationMode(true));
  }
  if (exitPresBtn) {
    exitPresBtn.addEventListener('click', () => setPresentationMode(false));
  }
}

function setPresentationMode(enabled) {
  isPresentationMode = enabled;
  document.body.classList.toggle('designer-presentation-mode', enabled);
  const exitBtn = document.getElementById('designer-exit-presentation-btn');
  if (exitBtn) exitBtn.style.display = enabled ? 'flex' : 'none';

  setTimeout(() => {
    if (viewportInstance) viewportInstance.handleResize();
  }, 100);
}

/* ==============================================================
   06. HIDDEN LEFT-EDGE NAVIGATION DRAWER
   ============================================================== */
function bindEdgeNavigation() {
  const trigger = document.getElementById('designer-edge-nav-trigger');
  const drawer = document.getElementById('designer-edge-nav-drawer');
  const closeBtn = document.getElementById('designer-drawer-close-btn');
  const backdrop = document.getElementById('designer-drawer-backdrop');

  if (!trigger || !drawer) return;

  function openDrawer() {
    clearTimeout(edgeNavTimeout);
    drawer.classList.add('open');
    if (backdrop) backdrop.classList.add('active');
    updateDrawerAccountInfo();
  }

  function scheduleCloseDrawer() {
    clearTimeout(edgeNavTimeout);
    edgeNavTimeout = setTimeout(() => {
      drawer.classList.remove('open');
      if (backdrop) backdrop.classList.remove('active');
    }, 380); // 380ms intentional delay to defeat flickering
  }

  trigger.addEventListener('mouseenter', openDrawer);
  drawer.addEventListener('mouseenter', () => clearTimeout(edgeNavTimeout));
  drawer.addEventListener('mouseleave', scheduleCloseDrawer);

  if (closeBtn) closeBtn.addEventListener('click', () => {
    drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
  });

  if (backdrop) backdrop.addEventListener('click', () => {
    drawer.classList.remove('open');
    backdrop.classList.remove('active');
  });

  // Module Hub Link: Returns to main 13-modules portal (#modules)
  const hubBtn = document.getElementById('designer-nav-module-hub');
  if (hubBtn) {
    hubBtn.addEventListener('click', (e) => {
      e.preventDefault();
      drawer.classList.remove('open');
      if (backdrop) backdrop.classList.remove('active');
      if (window.gmArchToolsRouter) {
        window.gmArchToolsRouter.showPlatformHub(true);
      } else {
        window.location.hash = '#modules';
      }
    });
  }

  // Projects Link
  const projectsBtn = document.getElementById('designer-nav-projects');
  if (projectsBtn) {
    projectsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      drawer.classList.remove('open');
      if (backdrop) backdrop.classList.remove('active');
      showProjectsModal();
    });
  }
}

function updateDrawerAccountInfo() {
  const emailEl = document.getElementById('designer-drawer-user-email');
  if (!emailEl) return;

  const auth = isAuthenticated();
  const user = getCurrentUser();

  if (auth && user && user.email) {
    emailEl.textContent = user.email;
    emailEl.classList.remove('sign-in-prompt');
  } else {
    emailEl.textContent = 'SIGN IN';
    emailEl.classList.add('sign-in-prompt');
  }
}

function showProjectsModal() {
  const modal = document.getElementById('designer-projects-modal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

/* ==============================================================
   07. CONTEXTUAL RIGHT PARAMETER PANEL INPUT BINDINGS
   ============================================================== */
function bindRightPanelInputs() {
  // A. Coordinates
  const latInput = document.getElementById('d-param-lat');
  const lngInput = document.getElementById('d-param-lng');
  const importSiteBtn = document.getElementById('d-btn-import-site-coords');

  if (latInput) {
    latInput.addEventListener('change', () => {
      const val = parseFloat(latInput.value);
      if (!isNaN(val) && val >= -90 && val <= 90 && optionManagerInstance) {
        optionManagerInstance.updateActiveParameters({ latitude: val });
      }
    });
  }

  if (lngInput) {
    lngInput.addEventListener('change', () => {
      const val = parseFloat(lngInput.value);
      if (!isNaN(val) && val >= -180 && val <= 180 && optionManagerInstance) {
        optionManagerInstance.updateActiveParameters({ longitude: val });
      }
    });
  }

  if (importSiteBtn) {
    importSiteBtn.addEventListener('click', () => {
      const site = SiteState.getActiveSite();
      if (site && site.latitude && optionManagerInstance) {
        optionManagerInstance.updateActiveParameters({
          latitude: site.latitude,
          longitude: site.longitude,
          siteArea: site.areaSqMeters || 2000,
          locationName: site.locationName
        });
        showTemporaryToast(`Imported site coordinates: ${site.latitude.toFixed(4)}°, ${site.longitude.toFixed(4)}°`);
      }
    });
  }

  // B. Development Controls (FSI / FAR / Site Area)
  const fsiInput = document.getElementById('d-param-fsi');
  const farInput = document.getElementById('d-param-far');
  const siteAreaInput = document.getElementById('d-param-site-area');

  if (fsiInput) {
    fsiInput.addEventListener('input', () => {
      const val = parseFloat(fsiInput.value);
      if (!isNaN(val) && val >= 0 && optionManagerInstance) {
        optionManagerInstance.updateActiveParameters({ fsi: val, far: val });
      }
    });
  }

  if (farInput) {
    farInput.addEventListener('input', () => {
      const val = parseFloat(farInput.value);
      if (!isNaN(val) && val >= 0 && optionManagerInstance) {
        optionManagerInstance.updateActiveParameters({ far: val, fsi: val });
      }
    });
  }

  if (siteAreaInput) {
    siteAreaInput.addEventListener('change', () => {
      const val = parseFloat(siteAreaInput.value);
      if (!isNaN(val) && val > 0 && optionManagerInstance) {
        optionManagerInstance.updateActiveParameters({ siteArea: val });
      }
    });
  }

  // C. Building Height & Floor Controls
  const floorDecBtn = document.getElementById('d-btn-floor-dec');
  const floorIncBtn = document.getElementById('d-btn-floor-inc');
  const floorCountInput = document.getElementById('d-param-floors');
  const floorHeightSlider = document.getElementById('d-param-floor-height-slider');
  const floorHeightInput = document.getElementById('d-param-floor-height-num');

  if (floorDecBtn) {
    floorDecBtn.addEventListener('click', () => {
      modifyActiveFloors(-1);
    });
  }

  if (floorIncBtn) {
    floorIncBtn.addEventListener('click', () => {
      modifyActiveFloors(1);
    });
  }

  if (floorCountInput) {
    floorCountInput.addEventListener('change', () => {
      const val = parseInt(floorCountInput.value, 10);
      if (!isNaN(val) && val >= 1) {
        setActiveFloors(val);
      }
    });
  }

  if (floorHeightSlider && floorHeightInput) {
    floorHeightSlider.addEventListener('input', () => {
      const val = parseFloat(floorHeightSlider.value);
      floorHeightInput.value = val.toFixed(1);
      setActiveFloorHeight(val);
    });

    floorHeightInput.addEventListener('change', () => {
      const val = parseFloat(floorHeightInput.value);
      if (!isNaN(val) && val >= 2.0 && val <= 8.0) {
        floorHeightSlider.value = val;
        setActiveFloorHeight(val);
      }
    });
  }

  // D. Setbacks Controls (Front, Rear, Left, Right)
  const setbackInputs = ['front', 'rear', 'left', 'right'];
  setbackInputs.forEach(key => {
    const el = document.getElementById(`d-param-sb-${key}`);
    if (el) {
      el.addEventListener('change', () => {
        const val = Math.max(0, parseFloat(el.value) || 0);
        if (optionManagerInstance) {
          optionManagerInstance.updateActiveParameters({
            setbacks: { [key]: val }
          });
        }
      });
    }
  });

  // Selected Mass Property Adjusters
  const massDelBtn = document.getElementById('d-btn-delete-selected-mass');
  if (massDelBtn) {
    massDelBtn.addEventListener('click', () => {
      if (selectedMassId && optionManagerInstance) {
        optionManagerInstance.removeMass(selectedMassId);
        selectedMassId = null;
        syncViewportAndPanels();
      }
    });
  }
}

function modifyActiveFloors(delta) {
  if (!optionManagerInstance) return;
  const activeOption = optionManagerInstance.getActiveOption();
  if (!activeOption) return;

  if (selectedMassId) {
    const mass = activeOption.masses.find(m => m.id === selectedMassId);
    if (mass) {
      const newFloors = Math.max(1, (mass.floors || 1) + delta);
      optionManagerInstance.updateMass(selectedMassId, { floors: newFloors });
      return;
    }
  }

  // Update default option floors
  activeOption.defaultFloors = Math.max(1, (activeOption.defaultFloors || 5) + delta);
  // Also update all masses if none selected
  activeOption.masses.forEach(m => {
    m.floors = Math.max(1, (m.floors || 1) + delta);
  });
  optionManagerInstance.saveState();
  syncViewportAndPanels();
}

function setActiveFloors(floors) {
  if (!optionManagerInstance) return;
  const activeOption = optionManagerInstance.getActiveOption();
  if (!activeOption) return;

  if (selectedMassId) {
    optionManagerInstance.updateMass(selectedMassId, { floors });
    return;
  }

  activeOption.defaultFloors = floors;
  activeOption.masses.forEach(m => { m.floors = floors; });
  optionManagerInstance.saveState();
  syncViewportAndPanels();
}

function setActiveFloorHeight(floorHeight) {
  if (!optionManagerInstance) return;
  const activeOption = optionManagerInstance.getActiveOption();
  if (!activeOption) return;

  if (selectedMassId) {
    optionManagerInstance.updateMass(selectedMassId, { floorHeight });
    return;
  }

  activeOption.defaultFloorHeight = floorHeight;
  activeOption.masses.forEach(m => { m.floorHeight = floorHeight; });
  optionManagerInstance.saveState();
  syncViewportAndPanels();
}

/* ==============================================================
   08. LIVE PANEL VALUES & INFOGRAPHICS RENDERING
   ============================================================== */
function updateRightPanelValues(option, metrics) {
  const params = option.parameters || {};

  // Location
  const latEl = document.getElementById('d-param-lat');
  const lngEl = document.getElementById('d-param-lng');
  if (latEl && !latEl.matches(':focus')) latEl.value = params.latitude || 12.9716;
  if (lngEl && !lngEl.matches(':focus')) lngEl.value = params.longitude || 77.5946;

  // Development
  const fsiEl = document.getElementById('d-param-fsi');
  const farEl = document.getElementById('d-param-far');
  const siteAreaEl = document.getElementById('d-param-site-area');
  const permFsiEl = document.getElementById('d-val-permissible-fsi-area');

  if (fsiEl && !fsiEl.matches(':focus')) fsiEl.value = params.fsi || 2.0;
  if (farEl && !farEl.matches(':focus')) farEl.value = params.far || 2.0;
  if (siteAreaEl && !siteAreaEl.matches(':focus')) siteAreaEl.value = params.siteArea || 2000;
  if (permFsiEl) permFsiEl.textContent = `${metrics.permissibleFSIArea.toLocaleString()} m²`;

  // Height & Floors
  const floorCountEl = document.getElementById('d-param-floors');
  const floorHeightSlider = document.getElementById('d-param-floor-height-slider');
  const floorHeightNum = document.getElementById('d-param-floor-height-num');
  const totalHeightEl = document.getElementById('d-val-total-height');

  const activeMass = option.masses.find(m => m.id === selectedMassId) || option.masses[0];
  const currentFloors = activeMass ? activeMass.floors : (option.defaultFloors || 5);
  const currentFloorH = activeMass ? activeMass.floorHeight : (option.defaultFloorHeight || 3.2);

  if (floorCountEl && !floorCountEl.matches(':focus')) floorCountEl.value = currentFloors;
  if (floorHeightSlider) floorHeightSlider.value = currentFloorH;
  if (floorHeightNum && !floorHeightNum.matches(':focus')) floorHeightNum.value = currentFloorH.toFixed(1);
  if (totalHeightEl) totalHeightEl.textContent = `${metrics.totalHeight.toFixed(1)} m`;

  // Coverage
  const footprintEl = document.getElementById('d-val-footprint-area');
  const coveragePctEl = document.getElementById('d-val-ground-coverage');
  const coverageWarningEl = document.getElementById('d-coverage-warning-badge');

  if (footprintEl) footprintEl.textContent = `${metrics.footprintArea.toLocaleString()} m²`;
  if (coveragePctEl) coveragePctEl.textContent = `${metrics.groundCoveragePct.toFixed(1)}%`;

  if (coverageWarningEl) {
    if (metrics.isCoverageExceeded) {
      coverageWarningEl.textContent = `⚠ EXCEEDS CURRENT DESIGN CONSTRAINT (${metrics.groundCoveragePct.toFixed(1)}% > ${params.maxCoverage}%)`;
      coverageWarningEl.style.display = 'block';
    } else {
      coverageWarningEl.style.display = 'none';
    }
  }

  // Setbacks
  const sb = params.setbacks || {};
  ['front', 'rear', 'left', 'right'].forEach(k => {
    const el = document.getElementById(`d-param-sb-${k}`);
    if (el && !el.matches(':focus')) {
      el.value = (sb[k] !== undefined ? sb[k] : 3.0);
    }
  });

  // Live Metrics Summary Cards
  const liveBuiltUp = document.getElementById('d-metric-built-up-area');
  const liveFSI = document.getElementById('d-metric-current-fsi');
  const liveCoverage = document.getElementById('d-metric-coverage');
  const liveMassCount = document.getElementById('d-metric-mass-count');

  if (liveBuiltUp) liveBuiltUp.textContent = `${metrics.totalBuiltUpArea.toLocaleString()} m²`;
  if (liveFSI) liveFSI.textContent = metrics.currentFSI.toFixed(2);
  if (liveCoverage) liveCoverage.textContent = `${metrics.groundCoveragePct.toFixed(1)}%`;
  if (liveMassCount) liveMassCount.textContent = metrics.massCount;
}

function updateInfographics(option, metrics) {
  // 1. FSI Capacity Progress Bar / Gauge
  const fsiFill = document.getElementById('d-info-fsi-fill');
  const fsiPercentText = document.getElementById('d-info-fsi-pct');
  const clampedFsiPct = Math.min(100, Math.max(0, metrics.fsiUtilizationPct));

  if (fsiFill) fsiFill.style.width = `${clampedFsiPct}%`;
  if (fsiPercentText) fsiPercentText.textContent = `${metrics.fsiUtilizationPct.toFixed(0)}% USED`;

  // 2. Vertical Building Height Scale Graphic
  const heightBar = document.getElementById('d-info-height-bar');
  const heightValLabel = document.getElementById('d-info-height-val');
  const maxScaleHeight = 80; // 80m max analytical baseline
  const heightPct = Math.min(100, (metrics.totalHeight / maxScaleHeight) * 100);

  if (heightBar) heightBar.style.height = `${Math.max(4, heightPct)}%`;
  if (heightValLabel) heightValLabel.textContent = `${metrics.totalHeight.toFixed(1)} m`;

  // 3. Floor Stack Diagram
  const floorStackList = document.getElementById('d-info-floor-stack-list');
  if (floorStackList) {
    const floorCount = Math.min(16, metrics.maxFloors || 1);
    let stackHtml = `<div class="d-floor-level roof-level"><span>ROOF</span> <span>${metrics.totalHeight.toFixed(1)}m</span></div>`;
    for (let f = floorCount; f >= 1; f--) {
      const activeMass = option.masses.find(m => m.id === selectedMassId) || option.masses[0];
      const floorH = activeMass ? activeMass.floorHeight : 3.2;
      const elev = (f * floorH).toFixed(1);
      stackHtml += `
        <div class="d-floor-level">
          <span class="lvl-num">F${f.toString().padStart(2, '0')}</span>
          <span class="lvl-dash">────────────</span>
          <span class="lvl-elev">${elev}m</span>
        </div>
      `;
    }
    stackHtml += `<div class="d-floor-level ground-level"><span>GND</span> <span>0.0m</span></div>`;
    floorStackList.innerHTML = stackHtml;
  }
}

function updateSelectedMassCard() {
  const card = document.getElementById('designer-selected-mass-card');
  if (!card || !optionManagerInstance) return;

  const activeOption = optionManagerInstance.getActiveOption();
  const mass = activeOption?.masses.find(m => m.id === selectedMassId);

  if (!mass) {
    card.style.display = 'none';
    return;
  }

  card.style.display = 'block';
  const nameEl = document.getElementById('d-sel-mass-name');
  const typeEl = document.getElementById('d-sel-mass-type');
  const dimEl = document.getElementById('d-sel-mass-dim');

  if (nameEl) nameEl.textContent = mass.name;
  if (typeEl) typeEl.textContent = mass.type;
  if (dimEl) {
    if (mass.type === 'RECTANGLE') {
      dimEl.textContent = `${mass.width}m × ${mass.length}m (${mass.width * mass.length} m²)`;
    } else if (mass.type === 'CIRCLE') {
      dimEl.textContent = `Radius: ${mass.radius}m (${(Math.PI * mass.radius * mass.radius).toFixed(1)} m²)`;
    } else {
      dimEl.textContent = `${mass.type} Footprint`;
    }
  }
}

/* ==============================================================
   09. KEYBOARD SHORTCUTS & HELPERS
   ============================================================== */
function bindKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    // Only handle if designer workspace is currently active
    if (!document.body.classList.contains('designer-active')) return;

    // Ignore if typing inside input/textarea
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (e.key === 'Escape') {
      if (isPresentationMode) {
        setPresentationMode(false);
      }
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedMassId && optionManagerInstance) {
        optionManagerInstance.removeMass(selectedMassId);
        selectedMassId = null;
        syncViewportAndPanels();
      }
    } else if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (optionManagerInstance) optionManagerInstance.redo();
        } else {
          if (optionManagerInstance) optionManagerInstance.undo();
        }
      } else if (e.key.toLowerCase() === 'y') {
        e.preventDefault();
        if (optionManagerInstance) optionManagerInstance.redo();
      }
    }
  });
}

function showTemporaryToast(message) {
  const toast = document.getElementById('designer-toast-hud');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
