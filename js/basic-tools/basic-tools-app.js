/**
 * GM ARCH TOOLS — Basic Tools Workspace Coordinator (Iteration 03)
 * Author: Guru Murthy (GM)
 * Tools inside Module 13 — BASIC TOOLS:
 *   01 IMPORT (SKP, 3DM, RVT, DWG, PNG, JPG)
 *   02 EXPORT (Transparent PNG, High-Res JPG, 1080p, 2K, 4K, Clean Presentation)
 *   03 UNIT CONVERSION (Linear, Area, Volume)
 *   04 MEASUREMENT (Scale ratio converter & dimensional verification)
 *   05 IMAGE / REFERENCE (Reference image opacity & overlay controls)
 *   06 PROJECT SETTINGS (Metadata, NBC 2016 standards, default units)
 *   07 ARCH CALCULATIVES (35 statutory calculations suite)
 */

import { importEngine } from './import-engine.js';
import { exportEngine } from './export-engine.js';
import { ProjectState } from '../state/project-state.js';
import { ARCH_CALCULATIVES, TOOL_CATEGORIES } from '../data/tools-database.js';
import { PLATFORM_MODULES } from '../data/modules-database.js';
import { openToolModal } from '../ui/modal-controller.js';

let activeToolId = '01'; // Default: IMPORT
let exportPreviewData = null;

export function initBasicToolsApp() {
  bindEdgeNav();
  renderToolsRail();
  renderActiveToolStage();
  renderAssetsPanel();

  // Subscribe to reactive project state updates
  ProjectState.subscribe(() => {
    renderAssetsPanel();
    if (activeToolId === '05') {
      renderActiveToolStage();
    }
  });

  // Back button
  const backBtn = document.getElementById('bt-back-btn');
  if (backBtn) {
    backBtn.onclick = () => {
      if (window.gmArchToolsRouter) {
        window.gmArchToolsRouter.showPlatformHub();
      }
    };
  }
}

export function selectBasicTool(toolId) {
  activeToolId = toolId;
  renderToolsRail();
  renderActiveToolStage();
}

/* ==============================================================
   01. LEFT TOOLS NAVIGATION RAIL
   ============================================================== */
const BASIC_TOOLS_LIST = [
  { id: '01', num: '01', name: 'IMPORT', icon: '📥', desc: 'SKP, 3DM, RVT, DWG, PNG, JPG files' },
  { id: '02', num: '02', name: 'EXPORT', icon: '📤', desc: 'Transparent PNG & High-Res Presentation Graphics' },
  { id: '03', num: '03', name: 'UNIT CONVERSION', icon: '⚖️', desc: 'Linear, Area & Volume Dual System' },
  { id: '04', num: '04', name: 'MEASUREMENT', icon: '📏', desc: 'Architectural Scale & Dimension Rules' },
  { id: '05', num: '05', name: 'IMAGE / REFERENCE', icon: '🖼️', desc: 'Overlay Plans, Sketches & Opacity' },
  { id: '06', num: '06', name: 'PROJECT SETTINGS', icon: '⚙️', desc: 'Standards, Location & Units' },
  { id: '07', num: '07', name: 'ARCH CALCULATIVES', icon: '📐', desc: '35 Statutory Building Calculators' }
];

function renderToolsRail() {
  const listEl = document.getElementById('bt-tools-list');
  if (!listEl) return;

  listEl.innerHTML = BASIC_TOOLS_LIST.map(t => {
    const isActive = t.id === activeToolId;
    return `
      <li>
        <button type="button" 
                class="bt-tool-btn ${isActive ? 'active' : ''}" 
                data-tool-id="${t.id}"
                aria-label="Tool ${t.num}: ${t.name}">
          <span class="bt-tool-num">${t.num}</span>
          <span class="bt-tool-title">${t.name}</span>
          <span class="bt-tool-icon">${t.icon}</span>
        </button>
      </li>
    `;
  }).join('');

  listEl.querySelectorAll('.bt-tool-btn').forEach(btn => {
    btn.onclick = () => {
      selectBasicTool(btn.dataset.toolId);
    };
  });

  // Update header pill
  const pillText = document.getElementById('bt-mode-indicator-text');
  const cur = BASIC_TOOLS_LIST.find(t => t.id === activeToolId);
  if (pillText && cur) {
    pillText.textContent = `TOOL ${cur.num}: ${cur.name}`;
  }
}

/* ==============================================================
   02. CENTRAL ACTIVE TOOL STAGE
   ============================================================== */
function renderActiveToolStage() {
  const stage = document.getElementById('bt-stage-container');
  if (!stage) return;

  switch (activeToolId) {
    case '01':
      renderImportScreen(stage);
      break;
    case '02':
      renderExportScreen(stage);
      break;
    case '03':
      renderUnitConversionScreen(stage);
      break;
    case '04':
      renderMeasurementScreen(stage);
      break;
    case '05':
      renderImageReferenceScreen(stage);
      break;
    case '06':
      renderProjectSettingsScreen(stage);
      break;
    case '07':
      renderCalculativesScreen(stage);
      break;
    default:
      renderImportScreen(stage);
      break;
  }
}

/* ==============================================================
   TOOL 01 — IMPORT SCREEN
   ============================================================== */
function renderImportScreen(container) {
  container.innerHTML = `
    <div class="bt-stage-header">
      <h2 class="bt-stage-title">ARCHITECTURAL FILE IMPORT</h2>
      <p class="bt-stage-desc">
        Import architectural CAD drawings, 3D BIM models, and reference plans into your project. Scale, orientation, layers, and geometry are preserved for use across all GM Arch Tools modules.
      </p>
    </div>

    <!-- Drag & Drop Zone -->
    <div class="bt-dropzone-container" id="bt-import-dropzone">
      <span class="bt-drop-icon">📁</span>
      <div class="bt-drop-title">Drag & Drop Architectural Files Here</div>
      <div class="bt-drop-sub">or click browse to select from your device</div>
      <button type="button" class="bt-browse-btn" id="bt-browse-trigger-btn">
        <span>Browse Files</span>
        <span>⇪</span>
      </button>
      <input type="file" id="bt-file-input" style="display: none;" accept=".skp,.3dm,.rvt,.dwg,.png,.jpg,.jpeg">

      <div class="bt-format-badges">
        <span class="bt-fmt-badge">.SKP · SketchUp</span>
        <span class="bt-fmt-badge">.3DM · Rhino</span>
        <span class="bt-fmt-badge">.RVT · Revit BIM</span>
        <span class="bt-fmt-badge">.DWG · AutoCAD</span>
        <span class="bt-fmt-badge">.PNG · Image</span>
        <span class="bt-fmt-badge">.JPG / .JPEG · Photo</span>
      </div>
    </div>

    <!-- Validation / Import Report Container -->
    <div id="bt-import-feedback-container"></div>
  `;

  bindImportHandlers();
}

function bindImportHandlers() {
  const dropzone = document.getElementById('bt-import-dropzone');
  const fileInput = document.getElementById('bt-file-input');
  const browseBtn = document.getElementById('bt-browse-trigger-btn');

  if (browseBtn && fileInput) {
    browseBtn.onclick = (e) => {
      e.stopPropagation();
      fileInput.click();
    };
  }

  if (dropzone && fileInput) {
    dropzone.onclick = () => fileInput.click();

    dropzone.ondragover = (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    };

    dropzone.ondragleave = () => {
      dropzone.classList.remove('drag-over');
    };

    dropzone.ondrop = (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileImport(e.dataTransfer.files[0]);
      }
    };

    fileInput.onchange = (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileImport(e.target.files[0]);
      }
    };
  }
}

async function handleFileImport(file) {
  const feedback = document.getElementById('bt-import-feedback-container');
  if (!feedback) return;

  const validation = importEngine.validateFile(file);

  if (!validation.valid) {
    feedback.innerHTML = `
      <div class="bt-validation-card" style="border-color: rgba(239, 68, 68, 0.4);">
        <div class="bt-validation-header">
          <span class="bt-val-filename">${file.name}</span>
          <span class="bt-val-status unsupported">Unsupported Format</span>
        </div>
        <p style="color: var(--bt-accent-red); font-size: 13px; margin: 0;">
          ${validation.error}
        </p>
      </div>
    `;
    return;
  }

  feedback.innerHTML = `
    <div class="bt-validation-card">
      <div class="bt-validation-header">
        <div>
          <div class="bt-val-filename">${file.name}</div>
          <div style="font-size: 11px; color: var(--bt-text-muted); font-family: var(--bt-font-mono);">${validation.format}</div>
        </div>
        <span class="bt-val-status supported">✓ Supported</span>
      </div>

      <div class="bt-val-grid">
        <div class="bt-val-item">
          <span class="bt-val-label">File Size</span>
          <span class="bt-val-value">${validation.sizeFormatted}</span>
        </div>
        <div class="bt-val-item">
          <span class="bt-val-label">File Type</span>
          <span class="bt-val-value">${validation.type}</span>
        </div>
        <div class="bt-val-item">
          <span class="bt-val-label">Extension</span>
          <span class="bt-val-value">.${validation.ext}</span>
        </div>
      </div>

      <div class="bt-units-selector-bar">
        <span style="font-family: var(--bt-font-mono); font-size: 11px; color: var(--bt-text-muted);">Choose Unit / Scale:</span>
        <button type="button" class="bt-unit-btn active" data-unit="m">m (Metres)</button>
        <button type="button" class="bt-unit-btn" data-unit="mm">mm (Millimetres)</button>
        <button type="button" class="bt-unit-btn" data-unit="cm">cm (Centimetres)</button>
        <button type="button" class="bt-unit-btn" data-unit="ft">ft (Feet)</button>
        <button type="button" class="bt-unit-btn" data-unit="in">in (Inches)</button>
      </div>

      <button type="button" class="bt-browse-btn" id="bt-confirm-import-btn" style="margin-top: 6px;">
        <span>Ingest into Project Assets</span>
        <span>✓</span>
      </button>
    </div>
  `;

  let chosenUnit = 'm';
  const unitBtns = feedback.querySelectorAll('.bt-unit-btn');
  unitBtns.forEach(btn => {
    btn.onclick = () => {
      unitBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      chosenUnit = btn.dataset.unit;
    };
  });

  const confirmBtn = document.getElementById('bt-confirm-import-btn');
  if (confirmBtn) {
    confirmBtn.onclick = async () => {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<span>Processing Model...</span>';
      const result = await importEngine.processFile(file, chosenUnit);

      feedback.innerHTML = `
        <div class="bt-validation-card" style="border-color: rgba(16, 185, 129, 0.4);">
          <div class="bt-validation-header">
            <span class="bt-val-filename">${file.name}</span>
            <span class="bt-val-status supported">✓ Successfully Ingested</span>
          </div>
          <div class="bt-val-grid">
            ${Object.entries(result.details).map(([k, v]) => `
              <div class="bt-val-item">
                <span class="bt-val-label">${k}</span>
                <span class="bt-val-value">${v}</span>
              </div>
            `).join('')}
          </div>
          <div style="font-size: 12px; color: var(--bt-accent-green); font-family: var(--bt-font-mono);">
            ● Asset registered in project repository. Available across Site Analysis &amp; Presentation Studio.
          </div>
        </div>
      `;
    };
  }
}

/* ==============================================================
   TOOL 02 — EXPORT SCREEN
   ============================================================== */
function renderExportScreen(container) {
  let format = 'PNG';
  let background = 'TRANSPARENT';
  let resolution = '1080P';
  let cleanPresentation = true;

  container.innerHTML = `
    <div class="bt-stage-header">
      <h2 class="bt-stage-title">ARCHITECTURAL PRESENTATION EXPORT</h2>
      <p class="bt-stage-desc">
        Export high-resolution drawings and analytical captures. Support for transparent PNG background allows immediate drag-and-drop into Photoshop, Illustrator, InDesign, and architectural presentation boards.
      </p>
    </div>

    <div class="bt-export-container">
      <!-- Options Form -->
      <div class="bt-export-form">
        <!-- 1. Format Selection -->
        <div>
          <h4 class="bt-form-section-title">01 · Format</h4>
          <div class="bt-option-group" style="margin-top: 8px;">
            <button type="button" class="bt-opt-btn active" id="exp-fmt-png">PNG (Lossless &amp; Alpha)</button>
            <button type="button" class="bt-opt-btn" id="exp-fmt-jpg">JPG (Compressed)</button>
          </div>
        </div>

        <!-- 2. Background Selection -->
        <div>
          <h4 class="bt-form-section-title">02 · Background</h4>
          <div class="bt-option-group" style="margin-top: 8px;">
            <button type="button" class="bt-opt-btn active" id="exp-bg-trans">Transparent Background</button>
            <button type="button" class="bt-opt-btn" id="exp-bg-solid">Solid Dark Background</button>
            <button type="button" class="bt-opt-btn" id="exp-bg-view">Current Viewport Background</button>
          </div>
          <!-- JPG Alert -->
          <div class="bt-alert-box" id="bt-jpg-alert" style="margin-top: 8px;">
            ⚠️ <strong>JPG format does not support transparency.</strong><br>
            Please choose either <strong>PNG + Transparent</strong> or <strong>JPG + Solid Background</strong>.
          </div>
        </div>

        <!-- 3. Resolution Selection -->
        <div>
          <h4 class="bt-form-section-title">03 · Output Resolution</h4>
          <div class="bt-option-group" style="margin-top: 8px;">
            <button type="button" class="bt-opt-btn" id="exp-res-cur">Current Viewport</button>
            <button type="button" class="bt-opt-btn active" id="exp-res-1080">1920 × 1080 (FHD)</button>
            <button type="button" class="bt-opt-btn" id="exp-res-2k">2560 × 1440 (2K)</button>
            <button type="button" class="bt-opt-btn" id="exp-res-4k">3840 × 2160 (4K UHD)</button>
          </div>
        </div>

        <!-- 4. Presentation Cleanliness -->
        <div>
          <h4 class="bt-form-section-title">04 · Export Mode</h4>
          <div class="bt-option-group" style="margin-top: 8px;">
            <button type="button" class="bt-opt-btn active" id="exp-mode-clean">Clean Presentation (Pure Graphics)</button>
            <button type="button" class="bt-opt-btn" id="exp-mode-full">Include Drafting Titleblock</button>
          </div>
        </div>

        <button type="button" class="bt-browse-btn" id="bt-update-preview-btn" style="width: 100%; justify-content: center;">
          <span>Generate Live Preview</span>
          <span>↺</span>
        </button>
      </div>

      <!-- Preview & Download Card -->
      <div class="bt-export-preview-card">
        <h4 class="bt-form-section-title">Export Preview</h4>
        <div class="bt-preview-canvas-wrap" id="bt-preview-wrap">
          <span style="font-family: var(--bt-font-mono); font-size: 11px; color: var(--bt-text-faint);">Click Generate Live Preview</span>
        </div>

        <div style="font-family: var(--bt-font-mono); font-size: 10.5px; color: var(--bt-text-muted); display: flex; flex-direction: column; gap: 4px;">
          <div>Format: <strong id="bt-prev-fmt-val" style="color: var(--bt-accent-cyan);">PNG</strong></div>
          <div>Dimensions: <strong id="bt-prev-dims-val" style="color: var(--bt-accent-cyan);">1920 × 1080 px</strong></div>
          <div>Background: <strong id="bt-prev-bg-val" style="color: var(--bt-accent-cyan);">Transparent (Alpha)</strong></div>
        </div>

        <button type="button" class="bt-export-action-btn" id="bt-trigger-download-btn">
          <span>DOWNLOAD IMAGE</span>
          <span>↓</span>
        </button>
      </div>
    </div>
  `;

  // Bind Form Buttons
  const btnPng = document.getElementById('exp-fmt-png');
  const btnJpg = document.getElementById('exp-fmt-jpg');
  const btnBgTrans = document.getElementById('exp-bg-trans');
  const btnBgSolid = document.getElementById('exp-bg-solid');
  const btnBgView = document.getElementById('exp-bg-view');
  const alertBox = document.getElementById('bt-jpg-alert');

  const updateFormatBgState = () => {
    if (format === 'JPG' && background === 'TRANSPARENT') {
      alertBox.classList.add('active');
    } else {
      alertBox.classList.remove('active');
    }
  };

  btnPng.onclick = () => {
    format = 'PNG';
    btnPng.classList.add('active');
    btnJpg.classList.remove('active');
    updateFormatBgState();
  };

  btnJpg.onclick = () => {
    format = 'JPG';
    btnJpg.classList.add('active');
    btnPng.classList.remove('active');
    updateFormatBgState();
  };

  btnBgTrans.onclick = () => {
    background = 'TRANSPARENT';
    btnBgTrans.classList.add('active');
    btnBgSolid.classList.remove('active');
    btnBgView.classList.remove('active');
    updateFormatBgState();
  };

  btnBgSolid.onclick = () => {
    background = 'SOLID';
    btnBgSolid.classList.add('active');
    btnBgTrans.classList.remove('active');
    btnBgView.classList.remove('active');
    updateFormatBgState();
  };

  btnBgView.onclick = () => {
    background = 'VIEWPORT';
    btnBgView.classList.add('active');
    btnBgTrans.classList.remove('active');
    btnBgSolid.classList.remove('active');
    updateFormatBgState();
  };

  // Resolutions
  ['cur', '1080', '2k', '4k'].forEach(r => {
    const el = document.getElementById(`exp-res-${r}`);
    if (el) {
      el.onclick = () => {
        ['cur', '1080', '2k', '4k'].forEach(k => document.getElementById(`exp-res-${k}`).classList.remove('active'));
        el.classList.add('active');
        resolution = r === 'cur' ? 'CURRENT' : r === '1080' ? '1080P' : r.toUpperCase();
      };
    }
  });

  // Modes
  const btnClean = document.getElementById('exp-mode-clean');
  const btnFull = document.getElementById('exp-mode-full');
  btnClean.onclick = () => {
    cleanPresentation = true;
    btnClean.classList.add('active');
    btnFull.classList.remove('active');
  };
  btnFull.onclick = () => {
    cleanPresentation = false;
    btnFull.classList.add('active');
    btnClean.classList.remove('active');
  };

  // Preview Generation
  const previewWrap = document.getElementById('bt-preview-wrap');
  const previewBtn = document.getElementById('bt-update-preview-btn');
  const downloadBtn = document.getElementById('bt-trigger-download-btn');

  const generatePreview = async () => {
    try {
      exportPreviewData = await exportEngine.generateExportData({
        format,
        background,
        resolution,
        cleanPresentation
      });

      previewWrap.innerHTML = `<img src="${exportPreviewData.dataUrl}" alt="Export Preview">`;
      document.getElementById('bt-prev-fmt-val').textContent = format;
      document.getElementById('bt-prev-dims-val').textContent = `${exportPreviewData.width} × ${exportPreviewData.height} px`;
      document.getElementById('bt-prev-bg-val').textContent = background === 'TRANSPARENT' ? 'Transparent (Alpha)' : background === 'SOLID' ? 'Solid Dark (#06090f)' : 'Viewport Gradient';
    } catch (err) {
      alertBox.textContent = err.message;
      alertBox.classList.add('active');
    }
  };

  previewBtn.onclick = generatePreview;

  downloadBtn.onclick = async () => {
    if (!exportPreviewData) {
      await generatePreview();
    }
    if (exportPreviewData) {
      const ext = format.toLowerCase();
      const fn = `GM_ARCH_TOOLS_EXPORT_${Date.now()}.${ext}`;
      exportEngine.downloadImage(exportPreviewData.dataUrl, fn);
    }
  };

  // Auto trigger initial preview
  generatePreview();
}

/* ==============================================================
   TOOL 03 — UNIT CONVERSION SCREEN
   ============================================================== */
function renderUnitConversionScreen(container) {
  container.innerHTML = `
    <div class="bt-stage-header">
      <h2 class="bt-stage-title">ARCHITECTURAL UNIT CONVERSION</h2>
      <p class="bt-stage-desc">
        Enforces strict separation between linear lengths, surface areas, and volumetric quantities with exact architectural precision.
      </p>
    </div>

    <div style="background: rgba(10, 15, 25, 0.9); border: 1px solid var(--bt-panel-border); border-radius: var(--bt-radius-md); padding: 24px; max-width: 680px;">
      <!-- Linear Conversion -->
      <h4 class="bt-form-section-title">Linear Dimensions (Length / Setbacks / Heights)</h4>
      <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 12px; align-items: center; margin: 12px 0 24px;">
        <div>
          <input type="number" id="uc-lin-in" value="10" style="width: 100%; background: rgba(255,255,255,0.04); border: 1px solid var(--bt-panel-border); color: #fff; padding: 8px 12px; border-radius: 4px; font-family: var(--bt-font-mono);">
          <select id="uc-lin-unit-in" style="width: 100%; margin-top: 6px; background: #0a0f19; color: #38bdf8; border: 1px solid var(--bt-panel-border); padding: 6px; border-radius: 4px; font-family: var(--bt-font-mono);">
            <option value="m" selected>Metres (m)</option>
            <option value="mm">Millimetres (mm)</option>
            <option value="cm">Centimetres (cm)</option>
            <option value="ft">Feet (ft)</option>
            <option value="in">Inches (in)</option>
          </select>
        </div>
        <span style="color: var(--bt-accent-cyan); font-size: 20px;">=</span>
        <div>
          <div id="uc-lin-out" style="background: rgba(56, 189, 248, 0.1); border: 1px solid var(--bt-panel-border); color: #00f2fe; padding: 8px 12px; border-radius: 4px; font-family: var(--bt-font-mono); font-weight: 700; font-size: 15px;">32.81</div>
          <select id="uc-lin-unit-out" style="width: 100%; margin-top: 6px; background: #0a0f19; color: #38bdf8; border: 1px solid var(--bt-panel-border); padding: 6px; border-radius: 4px; font-family: var(--bt-font-mono);">
            <option value="ft" selected>Feet (ft)</option>
            <option value="m">Metres (m)</option>
            <option value="mm">Millimetres (mm)</option>
            <option value="cm">Centimetres (cm)</option>
            <option value="in">Inches (in)</option>
          </select>
        </div>
      </div>

      <!-- Area Conversion -->
      <h4 class="bt-form-section-title">Surface Areas (Plot / Built-up / Carpet)</h4>
      <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 12px; align-items: center; margin: 12px 0;">
        <div>
          <input type="number" id="uc-area-in" value="100" style="width: 100%; background: rgba(255,255,255,0.04); border: 1px solid var(--bt-panel-border); color: #fff; padding: 8px 12px; border-radius: 4px; font-family: var(--bt-font-mono);">
          <select id="uc-area-unit-in" style="width: 100%; margin-top: 6px; background: #0a0f19; color: #38bdf8; border: 1px solid var(--bt-panel-border); padding: 6px; border-radius: 4px; font-family: var(--bt-font-mono);">
            <option value="sqm" selected>Square Metres (m²)</option>
            <option value="sqft">Square Feet (sq ft)</option>
            <option value="acre">Acres</option>
            <option value="hectare">Hectares</option>
            <option value="sqyd">Square Yards / Ganj</option>
          </select>
        </div>
        <span style="color: var(--bt-accent-cyan); font-size: 20px;">=</span>
        <div>
          <div id="uc-area-out" style="background: rgba(56, 189, 248, 0.1); border: 1px solid var(--bt-panel-border); color: #00f2fe; padding: 8px 12px; border-radius: 4px; font-family: var(--bt-font-mono); font-weight: 700; font-size: 15px;">1,076.39</div>
          <select id="uc-area-unit-out" style="width: 100%; margin-top: 6px; background: #0a0f19; color: #38bdf8; border: 1px solid var(--bt-panel-border); padding: 6px; border-radius: 4px; font-family: var(--bt-font-mono);">
            <option value="sqft" selected>Square Feet (sq ft)</option>
            <option value="sqm">Square Metres (m²)</option>
            <option value="acre">Acres</option>
            <option value="hectare">Hectares</option>
            <option value="sqyd">Square Yards</option>
          </select>
        </div>
      </div>
    </div>
  `;

  // Live Linear Converter logic
  const linIn = document.getElementById('uc-lin-in');
  const linUIn = document.getElementById('uc-lin-unit-in');
  const linOut = document.getElementById('uc-lin-out');
  const linUOut = document.getElementById('uc-lin-unit-out');

  const linFactors = { m: 1, mm: 0.001, cm: 0.01, ft: 0.3048, in: 0.0254 };
  const calcLin = () => {
    const val = parseFloat(linIn.value) || 0;
    const inMeters = val * linFactors[linUIn.value];
    const converted = inMeters / linFactors[linUOut.value];
    linOut.textContent = converted.toFixed(2);
  };

  linIn.oninput = calcLin;
  linUIn.onchange = calcLin;
  linUOut.onchange = calcLin;

  // Live Area Converter logic
  const areaIn = document.getElementById('uc-area-in');
  const areaUIn = document.getElementById('uc-area-unit-in');
  const areaOut = document.getElementById('uc-area-out');
  const areaUOut = document.getElementById('uc-area-unit-out');

  const areaFactors = { sqm: 1, sqft: 0.092903, acre: 4046.86, hectare: 10000, sqyd: 0.836127 };
  const calcArea = () => {
    const val = parseFloat(areaIn.value) || 0;
    const inSqm = val * areaFactors[areaUIn.value];
    const converted = inSqm / areaFactors[areaUOut.value];
    areaOut.textContent = converted.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  areaIn.oninput = calcArea;
  areaUIn.onchange = calcArea;
  areaUOut.onchange = calcArea;
}

/* ==============================================================
   TOOL 04 — MEASUREMENT SCREEN
   ============================================================== */
function renderMeasurementScreen(container) {
  container.innerHTML = `
    <div class="bt-stage-header">
      <h2 class="bt-stage-title">ARCHITECTURAL SCALE &amp; MEASUREMENT</h2>
      <p class="bt-stage-desc">
        Calculate physical drawing dimensions across standard architectural drafting scales (1:50, 1:100, 1:200, 1:500).
      </p>
    </div>

    <div style="background: rgba(10, 15, 25, 0.9); border: 1px solid var(--bt-panel-border); border-radius: var(--bt-radius-md); padding: 24px; max-width: 680px;">
      <h4 class="bt-form-section-title">Scale Ratio Calculator</h4>
      
      <div style="display: flex; gap: 14px; margin-top: 14px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 200px;">
          <label style="font-family: var(--bt-font-mono); font-size: 11px; color: var(--bt-text-muted);">Real World Dimension:</label>
          <div style="display: flex; gap: 6px; margin-top: 6px;">
            <input type="number" id="ms-real-val" value="12" style="flex: 1; background: rgba(255,255,255,0.04); border: 1px solid var(--bt-panel-border); color: #fff; padding: 8px; border-radius: 4px; font-family: var(--bt-font-mono);">
            <span style="font-family: var(--bt-font-mono); font-size: 13px; color: var(--bt-accent-cyan); display: flex; align-items: center;">m</span>
          </div>
        </div>

        <div style="flex: 1; min-width: 200px;">
          <label style="font-family: var(--bt-font-mono); font-size: 11px; color: var(--bt-text-muted);">Architectural Scale:</label>
          <select id="ms-scale-select" style="width: 100%; margin-top: 6px; background: #0a0f19; color: #38bdf8; border: 1px solid var(--bt-panel-border); padding: 8px; border-radius: 4px; font-family: var(--bt-font-mono);">
            <option value="1">1 : 1 (Full Scale)</option>
            <option value="20">1 : 20 (Detail Section)</option>
            <option value="50">1 : 50 (Enlarged Plan)</option>
            <option value="100" selected>1 : 100 (Standard Floor Plan)</option>
            <option value="200">1 : 200 (Site Layout)</option>
            <option value="500">1 : 500 (Master Plan)</option>
            <option value="1000">1 : 1000 (Zoning Context)</option>
          </select>
        </div>
      </div>

      <div style="margin-top: 24px; padding: 18px; background: rgba(56, 189, 248, 0.08); border: 1px solid var(--bt-panel-border); border-radius: var(--bt-radius-sm); text-align: center;">
        <span style="font-family: var(--bt-font-mono); font-size: 11px; color: var(--bt-text-muted);">Length on Printed Drawing Sheet:</span>
        <div id="ms-drawing-result" style="font-size: 28px; font-weight: 800; color: var(--bt-accent-glow); font-family: var(--bt-font-mono); margin-top: 6px;">
          12.00 cm (120 mm)
        </div>
      </div>
    </div>
  `;

  const realInput = document.getElementById('ms-real-val');
  const scaleSelect = document.getElementById('ms-scale-select');
  const resultDiv = document.getElementById('ms-drawing-result');

  const updateScaleCalc = () => {
    const realMeters = parseFloat(realInput.value) || 0;
    const ratio = parseFloat(scaleSelect.value) || 100;
    const drawingMeters = realMeters / ratio;
    const drawingCm = drawingMeters * 100;
    const drawingMm = drawingMeters * 1000;
    resultDiv.textContent = `${drawingCm.toFixed(2)} cm (${drawingMm.toFixed(1)} mm)`;
  };

  realInput.oninput = updateScaleCalc;
  scaleSelect.onchange = updateScaleCalc;
}

/* ==============================================================
   TOOL 05 — IMAGE / REFERENCE SCREEN
   ============================================================== */
function renderImageReferenceScreen(container) {
  const assets = ProjectState.getAssets().filter(a => a.type === 'IMAGE_REF');

  container.innerHTML = `
    <div class="bt-stage-header">
      <h2 class="bt-stage-title">REFERENCE IMAGE &amp; TRACING CONTROLS</h2>
      <p class="bt-stage-desc">
        Position site photos, satellite captures, survey drawings, and conceptual sketches directly into your design workspace with live opacity adjustments.
      </p>
    </div>

    ${assets.length === 0 ? `
      <div style="background: rgba(10, 15, 25, 0.8); border: 1px solid var(--bt-panel-border); border-radius: var(--bt-radius-md); padding: 32px; text-align: center;">
        <span style="font-size: 36px; display: block; margin-bottom: 8px;">🖼️</span>
        <div style="color: #fff; font-weight: 700; margin-bottom: 4px;">No Reference Images Ingested Yet</div>
        <p style="color: var(--bt-text-muted); font-size: 13px; margin-bottom: 18px;">Import a PNG or JPG file to manage its transparency, placement and lock status.</p>
        <button type="button" class="bt-browse-btn" id="bt-jump-to-import-btn">
          <span>Go to Import Tool</span>
          <span>→</span>
        </button>
      </div>
    ` : `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
        ${assets.map(a => `
          <div style="background: rgba(10, 15, 25, 0.9); border: 1px solid var(--bt-panel-border); border-radius: var(--bt-radius-md); padding: 16px; display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-family: var(--bt-font-mono); font-size: 12px; font-weight: 700; color: #fff;">${a.name}</span>
              <span style="font-size: 10px; color: var(--bt-accent-cyan); font-family: var(--bt-font-mono);">${a.sizeFormatted}</span>
            </div>

            ${a.dataUrl ? `
              <div style="width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 4px; overflow: hidden; opacity: ${a.opacity};">
                <img src="${a.dataUrl}" style="width: 100%; height: 100%; object-fit: cover;">
              </div>
            ` : ''}

            <!-- Opacity Slider -->
            <div>
              <div style="display: flex; justify-content: space-between; font-family: var(--bt-font-mono); font-size: 10.5px; color: var(--bt-text-muted); margin-bottom: 4px;">
                <span>Opacity</span>
                <span id="img-op-val-${a.id}">${Math.round(a.opacity * 100)}%</span>
              </div>
              <input type="range" class="bt-asset-op-slider" id="img-op-slider-${a.id}" min="0" max="1" step="0.05" value="${a.opacity}" style="width: 100%;">
              
              <div style="display: flex; gap: 4px; margin-top: 6px;">
                ${[0, 0.25, 0.5, 0.75, 1.0].map(p => `
                  <button type="button" class="bt-unit-btn" data-preset-op="${p}" data-asset-id="${a.id}" style="flex: 1; padding: 2px;">${p * 100}%</button>
                `).join('')}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `}
  `;

  const jumpBtn = document.getElementById('bt-jump-to-import-btn');
  if (jumpBtn) {
    jumpBtn.onclick = () => selectBasicTool('01');
  }

  // Bind Opacity sliders
  assets.forEach(a => {
    const slider = document.getElementById(`img-op-slider-${a.id}`);
    const valText = document.getElementById(`img-op-val-${a.id}`);
    if (slider) {
      slider.oninput = (e) => {
        const val = parseFloat(e.target.value);
        if (valText) valText.textContent = `${Math.round(val * 100)}%`;
        ProjectState.setAssetOpacity(a.id, val);
      };
    }
  });

  // Preset buttons
  container.querySelectorAll('[data-preset-op]').forEach(btn => {
    btn.onclick = () => {
      const op = parseFloat(btn.dataset.presetOp);
      const id = btn.dataset.assetId;
      ProjectState.setAssetOpacity(id, op);
      const slider = document.getElementById(`img-op-slider-${id}`);
      const valText = document.getElementById(`img-op-val-${id}`);
      if (slider) slider.value = op;
      if (valText) valText.textContent = `${Math.round(op * 100)}%`;
    };
  });
}

/* ==============================================================
   TOOL 06 — PROJECT SETTINGS SCREEN
   ============================================================== */
function renderProjectSettingsScreen(container) {
  const prj = ProjectState.getProject();

  container.innerHTML = `
    <div class="bt-stage-header">
      <h2 class="bt-stage-title">PROJECT SETTINGS &amp; PARAMETERS</h2>
      <p class="bt-stage-desc">
        Configure statutory building bye-laws, geographic coordinates, and dimensional unit conventions for this architectural session.
      </p>
    </div>

    <div style="background: rgba(10, 15, 25, 0.9); border: 1px solid var(--bt-panel-border); border-radius: var(--bt-radius-md); padding: 24px; max-width: 680px; display: flex; flex-direction: column; gap: 16px;">
      <div>
        <label style="font-family: var(--bt-font-mono); font-size: 11px; color: var(--bt-text-muted);">Project Identifier:</label>
        <input type="text" id="prj-name-input" value="${prj.name}" style="width: 100%; margin-top: 6px; background: rgba(255,255,255,0.04); border: 1px solid var(--bt-panel-border); color: #fff; padding: 8px 12px; border-radius: 4px; font-family: var(--bt-font-mono);">
      </div>

      <div>
        <label style="font-family: var(--bt-font-mono); font-size: 11px; color: var(--bt-text-muted);">Architect / Author:</label>
        <input type="text" id="prj-author-input" value="${prj.author}" style="width: 100%; margin-top: 6px; background: rgba(255,255,255,0.04); border: 1px solid var(--bt-panel-border); color: #fff; padding: 8px 12px; border-radius: 4px; font-family: var(--bt-font-mono);">
      </div>

      <div>
        <label style="font-family: var(--bt-font-mono); font-size: 11px; color: var(--bt-text-muted);">Applicable Building Code &amp; Regulations:</label>
        <select id="prj-code-select" style="width: 100%; margin-top: 6px; background: #0a0f19; color: #38bdf8; border: 1px solid var(--bt-panel-border); padding: 8px 12px; border-radius: 4px; font-family: var(--bt-font-mono);">
          <option value="NBC 2016" selected>National Building Code of India (NBC 2016)</option>
          <option value="Model Bye-Laws 2016">Model Building Bye-Laws (MBBL 2016)</option>
          <option value="URDPFI Guidelines">URDPFI Urban Planning Guidelines</option>
          <option value="ECBC 2017">Energy Conservation Building Code (ECBC 2017)</option>
        </select>
      </div>

      <button type="button" class="bt-browse-btn" id="prj-save-btn" style="align-self: flex-start; margin-top: 10px;">
        <span>Save Project Settings</span>
        <span>✓</span>
      </button>
    </div>
  `;

  const saveBtn = document.getElementById('prj-save-btn');
  if (saveBtn) {
    saveBtn.onclick = () => {
      ProjectState.updateProject({
        name: document.getElementById('prj-name-input').value,
        author: document.getElementById('prj-author-input').value,
        codeStandard: document.getElementById('prj-code-select').value
      });
      saveBtn.innerHTML = '<span>Settings Saved!</span><span>✓</span>';
      setTimeout(() => {
        saveBtn.innerHTML = '<span>Save Project Settings</span><span>✓</span>';
      }, 1500);
    };
  }
}

/* ==============================================================
   TOOL 07 — ARCH CALCULATIVES (35 TOOLS SUITE)
   ============================================================== */
function renderCalculativesScreen(container) {
  container.innerHTML = `
    <div class="bt-stage-header">
      <h2 class="bt-stage-title">ARCH CALCULATIVES SUITE (35 TOOLS)</h2>
      <p class="bt-stage-desc">
        Complete deterministic calculation suite covering site analysis, FSI/FAR compliance, ground coverage, parking ratios, building height envelopes, and RERA carpet standards.
      </p>
    </div>

    <!-- Category Filters -->
    <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 12px; margin-bottom: 18px;" id="bt-calc-filter-bar">
      <button type="button" class="bt-opt-btn active" data-cat="ALL">ALL (35)</button>
      ${TOOL_CATEGORIES.map(c => `
        <button type="button" class="bt-opt-btn" data-cat="${c.id}">${c.name}</button>
      `).join('')}
    </div>

    <!-- Tools Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px;" id="bt-calc-tools-grid">
      ${renderToolCards('ALL')}
    </div>
  `;

  // Bind Category Filters
  const filterBtns = container.querySelectorAll('#bt-calc-filter-bar button');
  const grid = document.getElementById('bt-calc-tools-grid');

  filterBtns.forEach(btn => {
    btn.onclick = () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      grid.innerHTML = renderToolCards(cat);
      bindToolCardClicks(grid);
    };
  });

  bindToolCardClicks(grid);
}

function renderToolCards(category) {
  const filtered = category === 'ALL' 
    ? ARCH_CALCULATIVES 
    : ARCH_CALCULATIVES.filter(t => t.category === category);

  return filtered.map(t => `
    <article class="bt-asset-card" data-tool-id="${t.id}" style="cursor: pointer;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-family: var(--bt-font-mono); font-size: 10px; color: var(--bt-accent-cyan); font-weight: 700;">TOOL ${t.id}</span>
        <span style="font-size: 10px; color: var(--bt-text-muted); font-family: var(--bt-font-mono);">${t.category}</span>
      </div>
      <div style="font-size: 13px; font-weight: 700; color: #fff;">${t.name}</div>
      <p style="font-size: 11px; color: var(--bt-text-muted); margin: 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
        ${t.description}
      </p>
      <div style="margin-top: auto; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.04); padding-top: 6px;">
        <span style="font-family: var(--bt-font-mono); font-size: 9.5px; color: var(--bt-accent-cyan);">${t.formula}</span>
        <span style="font-size: 12px; color: var(--bt-accent-glow);">→</span>
      </div>
    </article>
  `).join('');
}

function bindToolCardClicks(container) {
  container.querySelectorAll('[data-tool-id]').forEach(card => {
    card.onclick = () => {
      const id = card.dataset.toolId;
      openToolModal(id);
    };
  });
}

/* ==============================================================
   03. RIGHT PANEL: IMPORTED ASSETS MANAGER
   ============================================================== */
function renderAssetsPanel() {
  const panel = document.getElementById('bt-assets-list');
  const countEl = document.getElementById('bt-assets-count');
  if (!panel) return;

  const assets = ProjectState.getAssets();
  if (countEl) countEl.textContent = `${assets.length} ASSETS`;

  if (assets.length === 0) {
    panel.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--bt-text-faint); font-family: var(--bt-font-mono); font-size: 11px;">
        No assets ingested. Use Tool 01 Import to add CAD, 3D or reference plans.
      </div>
    `;
    return;
  }

  panel.innerHTML = assets.map(a => `
    <li class="bt-asset-card">
      <div class="bt-asset-top">
        <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
          <span class="bt-asset-visibility-dot ${a.visible ? 'visible' : 'hidden'}"></span>
          <span class="bt-asset-name" title="${a.name}">${a.name}</span>
        </div>
        <button type="button" class="bt-asset-action-btn" data-toggle-vis="${a.id}" title="Toggle Visibility">
          ${a.visible ? '👁' : '🚫'}
        </button>
      </div>

      <div class="bt-asset-meta">
        <span>${a.format}</span>
        <span>${a.sizeFormatted}</span>
      </div>

      <div class="bt-asset-controls-row">
        <span style="font-size: 9.5px; color: var(--bt-text-faint); font-family: var(--bt-font-mono);">Alpha</span>
        <input type="range" class="bt-asset-op-slider" data-asset-slider="${a.id}" min="0" max="1" step="0.05" value="${a.opacity}">
        <button type="button" class="bt-asset-action-btn delete" data-delete-asset="${a.id}" title="Remove Asset">✕</button>
      </div>
    </li>
  `).join('');

  // Bind Actions
  panel.querySelectorAll('[data-toggle-vis]').forEach(btn => {
    btn.onclick = () => {
      ProjectState.toggleAssetVisibility(btn.dataset.toggleVis);
    };
  });

  panel.querySelectorAll('[data-asset-slider]').forEach(slider => {
    slider.oninput = (e) => {
      ProjectState.setAssetOpacity(slider.dataset.assetSlider, e.target.value);
    };
  });

  panel.querySelectorAll('[data-delete-asset]').forEach(btn => {
    btn.onclick = () => {
      ProjectState.removeAsset(btn.dataset.deleteAsset);
    };
  });
}

/* ==============================================================
   04. UNIVERSAL EDGE-TRIGGERED NAVIGATION DRAWER
   ============================================================== */
function bindEdgeNav() {
  const trigger = document.getElementById('bt-edge-nav-trigger');
  const drawer = document.getElementById('bt-edge-nav-drawer');
  const closeBtn = document.getElementById('bt-edge-nav-close');

  if (trigger && drawer) {
    trigger.onclick = () => {
      drawer.classList.toggle('open');
    };
  }

  if (closeBtn && drawer) {
    closeBtn.onclick = () => {
      drawer.classList.remove('open');
    };
  }

  const btnHub = document.getElementById('bt-nav-hub-btn');
  if (btnHub) {
    btnHub.onclick = () => {
      if (drawer) drawer.classList.remove('open');
      if (window.gmArchToolsRouter) window.gmArchToolsRouter.showPlatformHub();
    };
  }

  const btnSite = document.getElementById('bt-nav-site-btn');
  if (btnSite) {
    btnSite.onclick = () => {
      if (drawer) drawer.classList.remove('open');
      if (window.gmArchToolsRouter) window.gmArchToolsRouter.showSiteAnalysis();
    };
  }

  const btnBasic = document.getElementById('bt-nav-basic-btn');
  if (btnBasic) {
    btnBasic.onclick = () => {
      if (drawer) drawer.classList.remove('open');
    };
  }

  const btnAbout = document.getElementById('bt-nav-about-btn');
  if (btnAbout) {
    btnAbout.onclick = () => {
      if (drawer) drawer.classList.remove('open');
      if (window.gmArchToolsRouter) window.gmArchToolsRouter.openAboutModal();
    };
  }

  const modsGrid = document.getElementById('bt-drawer-modules-grid');
  if (modsGrid && PLATFORM_MODULES) {
    modsGrid.innerHTML = PLATFORM_MODULES.map(m => {
      const isCurrent = m.id === '13';
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
        if (id === '02' && window.gmArchToolsRouter) {
          window.gmArchToolsRouter.showSiteAnalysis();
        } else if (id === '13') {
          // Already here in Basic Tools
        } else if (window.gmArchToolsRouter) {
          const modData = PLATFORM_MODULES.find(m => m.id === id);
          if (modData) window.gmArchToolsRouter.openRoadmapModal(modData);
        }
      };
    });
  }
}
