/**
 * GM ARCH TOOLS — Tool Detail & Modal Controller
 * Renders the 8-part architectural concept card for any tool,
 * with dedicated interactive logic for Tool 03 Unit Conversion.
 */

import { ARCH_CALCULATIVES } from '../data/tools-database.js';
import { calculateTool } from '../engines/arch-calculators.js';
import { 
  DIMENSIONS, 
  LENGTH_UNITS, 
  AREA_UNITS, 
  convertArchitecturalUnit,
  normalizeUnitKey
} from '../engines/unit-converter.js';

let activeTool = null;
let currentValues = {};

// Specialized state for Tool 03
let converterState = {
  mode: DIMENSIONS.LENGTH,
  fromValue: 7450,
  fromUnit: 'mm',
  toUnit: 'm'
};

export function initModal() {
  const backdrop = document.getElementById('tool-detail-backdrop');
  const closeBtn = document.getElementById('tool-detail-close-btn');

  if (closeBtn && backdrop) {
    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeModal();
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop && backdrop.classList.contains('open')) {
      closeModal();
    }
  });
}

export function closeModal() {
  const backdrop = document.getElementById('tool-detail-backdrop');
  if (backdrop) {
    backdrop.classList.remove('open');
  }
  activeTool = null;
  // Clear hash without jump
  if (window.location.hash.startsWith('#tool-')) {
    history.pushState(null, '', window.location.pathname + window.location.search);
  }
}

export function openToolModal(toolId) {
  const id = toolId.toString().padStart(2, '0');
  const tool = ARCH_CALCULATIVES.find(t => t.id === id);
  if (!tool) return;

  activeTool = tool;
  const backdrop = document.getElementById('tool-detail-backdrop');
  const container = document.getElementById('tool-detail-content');
  if (!backdrop || !container) return;

  // Set window hash for easy sharing and routing
  window.location.hash = `tool-${tool.id}`;

  // Initialize default input values
  currentValues = {};
  if (tool.inputs) {
    for (const inp of tool.inputs) {
      currentValues[inp.key] = inp.defaultValue !== undefined ? inp.defaultValue : '';
    }
  }

  renderToolContent(tool, container);
  backdrop.classList.add('open');

  // Trigger initial calculation
  executeCalculation(tool);
}

function renderToolContent(tool, container) {
  const isUnitConverter = tool.id === '03';

  container.innerHTML = `
    <!-- HEADER -->
    <div class="tool-detail-header">
      <div class="tool-detail-header-left">
        <span class="tool-card-id">${tool.id}</span>
        <div>
          <div style="font-family: var(--font-mono); font-size: 11px; color: var(--text-faint); letter-spacing: 0.5px; margin-bottom: 2px;">
            GM ARCH TOOLS &gt; ARCH CALCULATIVES &gt; ${tool.id} — ${tool.name.toUpperCase()}
          </div>
          <h2 class="result-tool-name" style="font-size: 20px;">${tool.name}</h2>
          <span class="result-tool-category">${tool.category}</span>
        </div>
      </div>
      <button id="tool-detail-close-btn" class="tool-detail-close-btn" title="Close (Esc)">✕</button>
    </div>

    <!-- BODY: 8-STAGE ARCHITECTURAL CARD -->
    <div class="tool-detail-body">
      
      <!-- 1. TOOL INFORMATION -->
      <div class="arch-section">
        <div class="arch-section-title">Tool Information & Purpose</div>
        <p class="tool-info-purpose">${tool.purpose}</p>
      </div>

      <!-- 2 & 3. CALCULATION EXPLANATION & REQUIREMENTS -->
      <div class="arch-grid-two-col">
        <div class="arch-section">
          <div class="arch-section-title">Calculation Explanation</div>
          <p class="tool-info-purpose">${tool.calculationExplanation}</p>
        </div>
        <div class="arch-section">
          <div class="arch-section-title">Requirements & Inputs</div>
          <ul class="req-list">
            ${(tool.requirements || []).map(r => `<li class="req-item">${r}</li>`).join('')}
          </ul>
        </div>
      </div>

      <!-- 4. FORMULA -->
      <div class="arch-section">
        <div class="arch-section-title">Architectural Formula</div>
        <div class="formula-box">${tool.formula}</div>
      </div>

      <!-- 5. CALCULATOR (SPECIALIZED OR STANDARD) -->
      <div class="arch-section" id="calculator-section">
        <div class="arch-section-title">Interactive Calculator</div>
        ${isUnitConverter ? renderUnitConverterUI() : renderStandardInputsUI(tool)}
      </div>

      <!-- 6. RESULT -->
      <div class="arch-section" id="result-section">
        <div class="arch-section-title">Calculated Result</div>
        <div class="result-card-box">
          <div class="result-card-top">
            <span class="result-label" id="calc-primary-label">Primary Metric</span>
            <button class="copy-result-btn" id="copy-result-btn">Copy Result</button>
          </div>
          <div class="primary-result-value" id="calc-primary-value">—</div>
          <div class="secondary-metrics-row" id="calc-secondary-metrics"></div>
        </div>
      </div>

      <!-- 7. CALCULATION BREAKDOWN -->
      <div class="arch-section">
        <div class="arch-section-title">Calculation Breakdown (Step-by-Step Math)</div>
        <div class="breakdown-terminal" id="calc-breakdown-box">
          <!-- Populated live -->
        </div>
      </div>

      <!-- 8. SOURCE / REFERENCE -->
      <div class="source-citation">
        <span class="citation-tag">STANDARDS REFERENCE:</span>
        <span>${tool.sourceReference}</span>
      </div>

    </div>
  `;

  // Attach re-bound close button inside rendered header
  const closeBtn = container.querySelector('#tool-detail-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  // Attach copy button
  const copyBtn = container.querySelector('#copy-result-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const valElem = container.querySelector('#calc-primary-value');
      if (valElem) {
        navigator.clipboard.writeText(valElem.innerText).then(() => {
          copyBtn.innerText = 'Copied!';
          setTimeout(() => { copyBtn.innerText = 'Copy Result'; }, 1800);
        });
      }
    });
  }

  // Attach input event listeners
  if (isUnitConverter) {
    bindUnitConverterEvents(container);
  } else {
    bindStandardInputEvents(tool, container);
  }
}

/* ==============================================================
   TOOL 03: UNIT CONVERTER SPECIALIZED UI & EVENTS
   ============================================================== */
function renderUnitConverterUI() {
  const isLength = converterState.mode === DIMENSIONS.LENGTH;
  const currentUnits = isLength ? LENGTH_UNITS : AREA_UNITS;
  const quickList = Object.values(currentUnits);

  return `
    <div class="unit-converter-panel">
      <!-- CONVERSION TYPE -->
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
        <div class="converter-label">Conversion Type</div>
        <div class="unit-mode-switcher">
          <button type="button" class="unit-mode-btn ${isLength ? 'active' : ''}" id="mode-length-btn">LENGTH</button>
          <button type="button" class="unit-mode-btn ${!isLength ? 'active' : ''}" id="mode-area-btn">AREA</button>
        </div>
      </div>

      <!-- ARCHITECTURE QUICK UNITS -->
      <div class="quick-units-bar">
        <span class="quick-units-label">Quick Units:</span>
        ${quickList.map(u => `
          <button type="button" 
                  class="quick-unit-chip ${u.id === converterState.fromUnit ? 'from-active' : ''} ${u.id === converterState.toUnit ? 'to-active' : ''}" 
                  data-unit="${u.id}" 
                  title="${u.name}">
            ${u.quickLabel}
          </button>
        `).join('')}
      </div>

      <!-- DIMENSION MISMATCH ERROR MESSAGE -->
      <div class="dimension-mismatch-banner" id="dimension-mismatch-alert">
        <span>⚠</span>
        <span id="dimension-mismatch-text">Length and area are different dimensions. Select compatible units.</span>
      </div>

      <!-- CONVERTER MAIN INTERACTIVE ROW: FROM -> SWAP -> TO -->
      <div class="converter-main-grid">
        <!-- FROM -->
        <div class="converter-block">
          <label class="converter-label" for="converter-from-value">
            <span>FROM</span>
            <span id="from-unit-title">${currentUnits[converterState.fromUnit]?.name || ''}</span>
          </label>
          <div class="converter-input-box">
            <input type="number" 
                   id="converter-from-value" 
                   class="converter-number-input" 
                   value="${converterState.fromValue}" 
                   step="any" 
                   placeholder="Value">
            <div class="converter-select-wrap">
              <select id="converter-from-select" class="converter-select">
                ${renderUnitOptions(converterState.fromUnit)}
              </select>
            </div>
          </div>
        </div>

        <!-- SWAP BUTTON -->
        <div class="converter-swap-wrap">
          <button type="button" 
                  id="converter-swap-btn" 
                  class="converter-swap-btn" 
                  title="Swap Units (⇄)">
            ⇄
          </button>
        </div>

        <!-- TO -->
        <div class="converter-block">
          <label class="converter-label" for="converter-to-select">
            <span>TO</span>
            <span id="to-unit-title">${currentUnits[converterState.toUnit]?.name || ''}</span>
          </label>
          <div class="converter-input-box">
            <div class="converter-number-input" 
                 id="converter-live-preview" 
                 style="color: var(--cyan-accent); font-weight: 700; display: flex; align-items: center;">
              —
            </div>
            <div class="converter-select-wrap">
              <select id="converter-to-select" class="converter-select">
                ${renderUnitOptions(converterState.toUnit)}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderUnitOptions(selectedId) {
  const isLength = converterState.mode === DIMENSIONS.LENGTH;
  const unitSet = isLength ? LENGTH_UNITS : AREA_UNITS;
  return Object.values(unitSet).map(u => `
    <option value="${u.id}" ${u.id === selectedId ? 'selected' : ''}>
      ${u.symbol} (${u.name})
    </option>
  `).join('');
}

function bindUnitConverterEvents(container) {
  const modeLengthBtn = container.querySelector('#mode-length-btn');
  const modeAreaBtn = container.querySelector('#mode-area-btn');
  const fromInput = container.querySelector('#converter-from-value');
  const fromSelect = container.querySelector('#converter-from-select');
  const toSelect = container.querySelector('#converter-to-select');
  const swapBtn = container.querySelector('#converter-swap-btn');
  const quickChips = container.querySelectorAll('.quick-unit-chip');

  function handleModeChange(newMode) {
    if (converterState.mode === newMode) return;
    converterState.mode = newMode;
    if (newMode === DIMENSIONS.LENGTH) {
      converterState.fromUnit = 'mm';
      converterState.toUnit = 'm';
      converterState.fromValue = 7450;
    } else {
      converterState.fromUnit = 'm2';
      converterState.toUnit = 'ft2';
      converterState.fromValue = 100;
    }
    renderToolContent(activeTool, container);
    executeUnitConversion();
  }

  if (modeLengthBtn) modeLengthBtn.addEventListener('click', () => handleModeChange(DIMENSIONS.LENGTH));
  if (modeAreaBtn) modeAreaBtn.addEventListener('click', () => handleModeChange(DIMENSIONS.AREA));

  // Live input changes
  if (fromInput) {
    fromInput.addEventListener('input', (e) => {
      converterState.fromValue = e.target.value;
      executeUnitConversion();
    });
  }

  if (fromSelect) {
    fromSelect.addEventListener('change', (e) => {
      converterState.fromUnit = e.target.value;
      executeUnitConversion();
      updateQuickChipStates(container);
    });
  }

  if (toSelect) {
    toSelect.addEventListener('change', (e) => {
      converterState.toUnit = e.target.value;
      executeUnitConversion();
      updateQuickChipStates(container);
    });
  }

  // ⇄ Swap Button
  if (swapBtn) {
    swapBtn.addEventListener('click', () => {
      const temp = converterState.fromUnit;
      converterState.fromUnit = converterState.toUnit;
      converterState.toUnit = temp;

      if (fromSelect) fromSelect.value = converterState.fromUnit;
      if (toSelect) toSelect.value = converterState.toUnit;

      executeUnitConversion();
      updateQuickChipStates(container);
    });
  }

  // Quick unit chips click handler
  quickChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const unitKey = chip.getAttribute('data-unit');
      // If clicking already selected fromUnit, make it toUnit
      if (converterState.fromUnit === unitKey) {
        converterState.toUnit = unitKey;
      } else {
        converterState.toUnit = unitKey;
      }
      if (toSelect) toSelect.value = converterState.toUnit;
      executeUnitConversion();
      updateQuickChipStates(container);
    });
  });

  executeUnitConversion();
}

function updateQuickChipStates(container) {
  const chips = container.querySelectorAll('.quick-unit-chip');
  chips.forEach(chip => {
    const key = chip.getAttribute('data-unit');
    chip.classList.toggle('from-active', key === converterState.fromUnit);
    chip.classList.toggle('to-active', key === converterState.toUnit);
  });
}

function executeUnitConversion() {
  const alertBanner = document.getElementById('dimension-mismatch-alert');
  const livePreview = document.getElementById('converter-live-preview');
  const primaryLabel = document.getElementById('calc-primary-label');
  const primaryValue = document.getElementById('calc-primary-value');
  const secMetrics = document.getElementById('calc-secondary-metrics');
  const breakdownBox = document.getElementById('calc-breakdown-box');

  const conv = convertArchitecturalUnit(converterState.fromValue, converterState.fromUnit, converterState.toUnit);

  if (!conv.success) {
    if (conv.isDimensionMismatch && alertBanner) {
      alertBanner.classList.add('visible');
    }
    if (primaryValue) primaryValue.innerText = 'Incompatible Units';
    if (livePreview) livePreview.innerText = '—';
    if (breakdownBox) {
      breakdownBox.innerHTML = `<div class="breakdown-step-line"><span class="step-prefix">⚠</span><span>${conv.error}</span></div>`;
    }
    return;
  }

  if (alertBanner) alertBanner.classList.remove('visible');

  if (livePreview) livePreview.innerText = `${conv.result} ${conv.symbol}`;
  if (primaryLabel) primaryLabel.innerText = `RESULT (${conv.unitName})`;
  if (primaryValue) primaryValue.innerText = `${conv.result} ${conv.symbol}`;

  if (secMetrics) {
    secMetrics.innerHTML = `
      <div class="sec-metric-item">
        <span class="sec-metric-label">Conversion Dimension</span>
        <span class="sec-metric-val">${converterState.mode}</span>
      </div>
      <div class="sec-metric-item">
        <span class="sec-metric-label">Source Value</span>
        <span class="sec-metric-val">${converterState.fromValue} ${conv.breakdown[0].split(' ')[1] || ''}</span>
      </div>
      <div class="sec-metric-item">
        <span class="sec-metric-label">Precision Engine</span>
        <span class="sec-metric-val">Deterministic Math (Zero AI)</span>
      </div>
    `;
  }

  if (breakdownBox) {
    breakdownBox.innerHTML = conv.breakdown.map((line, idx) => `
      <div class="breakdown-step-line">
        <span class="step-prefix">${idx === conv.breakdown.length - 1 ? '▶' : '·'}</span>
        <span style="${idx === conv.breakdown.length - 1 ? 'color: var(--cyan-accent); font-weight: 700;' : ''}">${line}</span>
      </div>
    `).join('');
  }
}

/* ==============================================================
   STANDARD CALCULATORS UI & EVENTS (TOOLS 01, 02, 04 - 35)
   ============================================================== */
function renderStandardInputsUI(tool) {
  return `
    <div class="calc-inputs-grid">
      ${(tool.inputs || []).map(inp => `
        <div class="input-field-group">
          <label class="input-field-label" for="inp-${inp.key}">
            <span>${inp.label}</span>
            <span class="unit-badge">${inp.unit}</span>
          </label>
          <div class="input-control-wrap">
            <input type="number" 
                   id="inp-${inp.key}" 
                   class="calc-num-input" 
                   data-key="${inp.key}" 
                   value="${inp.defaultValue !== undefined ? inp.defaultValue : ''}" 
                   min="${inp.min !== undefined ? inp.min : ''}" 
                   max="${inp.max !== undefined ? inp.max : ''}" 
                   step="${inp.step !== undefined ? inp.step : 'any'}">
            <span class="calc-input-suffix">${inp.unit}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function bindStandardInputEvents(tool, container) {
  const inputs = container.querySelectorAll('.calc-num-input');
  inputs.forEach(input => {
    input.addEventListener('input', (e) => {
      const key = e.target.getAttribute('data-key');
      currentValues[key] = e.target.value;
      executeCalculation(tool);
    });
  });
}

function executeCalculation(tool) {
  if (tool.id === '03') {
    executeUnitConversion();
    return;
  }

  const primaryLabel = document.getElementById('calc-primary-label');
  const primaryValue = document.getElementById('calc-primary-value');
  const secMetrics = document.getElementById('calc-secondary-metrics');
  const breakdownBox = document.getElementById('calc-breakdown-box');

  const res = calculateTool(tool.id, currentValues);

  if (primaryLabel) primaryLabel.innerText = res.primaryLabel || 'Calculated Metric';
  if (primaryValue) primaryValue.innerText = res.primaryValue || '—';

  if (secMetrics) {
    secMetrics.innerHTML = (res.secondaryMetrics || []).map(m => `
      <div class="sec-metric-item">
        <span class="sec-metric-label">${m.label}</span>
        <span class="sec-metric-val">${m.value}</span>
      </div>
    `).join('');
  }

  if (breakdownBox) {
    breakdownBox.innerHTML = (res.breakdown || []).map((step, idx) => `
      <div class="breakdown-step-line">
        <span class="step-prefix">${idx === res.breakdown.length - 1 ? '▶' : '·'}</span>
        <span style="${idx === res.breakdown.length - 1 ? 'color: var(--cyan-accent); font-weight: 700;' : ''}">${step}</span>
      </div>
    `).join('');
  }
}
