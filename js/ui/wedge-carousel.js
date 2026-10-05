/**
 * GM ARCH TOOLS — Horizontal Module Wedge Carousel Engine
 * Reference: Netflix-style flowing horizontal card panels.
 * Features:
 *   - 13 Architecture Modules in exact order (01 to 13)
 *   - Active module expands to prominent width with rich blueprints and specifications
 *   - Neighbor wedges maintain depth with vertical typography
 *   - Multi-input navigation: Click, Wheel, Trackpad, Keyboard (← → ↵), Drag & Swipe
 *   - Smooth 650ms transform track translation with snap physics
 */

import { PLATFORM_MODULES, MODULE_STATUS } from '../data/modules-database.js';

let activeIndex = 0;
let trackElement = null;
let viewportElement = null;
let dotsContainer = null;
let counterElement = null;

let onOpenCalculativesCb = null;
let onOpenDesignerCb = null;
let onOpenSiteAnalysisCb = null;
let onOpenBasicToolsCb = null;
let onOpenRoadmapCb = null;

// Drag / Swipe State
let isDragging = false;
let startX = 0;
let currentTranslate = 0;
let prevTranslate = 0;
let animationId = null;
let hasDragged = false;
let isWheelCooldown = false;

export function initWedgeCarousel({ onOpenCalculatives, onOpenDesigner, onOpenSiteAnalysis, onOpenBasicTools, onOpenRoadmap } = {}) {
  onOpenCalculativesCb = onOpenCalculatives;
  onOpenDesignerCb = onOpenDesigner;
  onOpenSiteAnalysisCb = onOpenSiteAnalysis;
  onOpenBasicToolsCb = onOpenBasicTools;
  onOpenRoadmapCb = onOpenRoadmap;

  trackElement = document.getElementById('wedge-track');
  viewportElement = document.getElementById('wedge-viewport');
  dotsContainer = document.getElementById('wedge-dots-nav');
  counterElement = document.getElementById('wedge-counter-text');

  if (!trackElement || !viewportElement) return;

  renderWedgeTrack();
  bindNavigationControls();
  bindGestures();

  // Position at default active module 01
  setTimeout(() => {
    updateWedgePositions(false);
  }, 50);

  // Resize listener to re-center
  window.addEventListener('resize', debounce(() => {
    updateWedgePositions(false);
  }, 100));
}

function renderWedgeTrack() {
  trackElement.innerHTML = PLATFORM_MODULES.map((mod, index) => {
    const isActive = index === activeIndex;
    const isModuleActive = mod.status === MODULE_STATUS.ACTIVE;

    return `
      <article class="wedge-card ${isActive ? 'active' : ''} ${isModuleActive ? 'active-status' : ''}" 
               data-module-index="${index}" 
               id="wedge-card-${mod.id}"
               role="button"
               tabindex="0"
               aria-label="Module ${mod.id}: ${mod.name}">

        <!-- Technical Corner Crosshairs -->
        <span class="wedge-crosshair top-left"></span>
        <span class="wedge-crosshair top-right"></span>
        <span class="wedge-crosshair bottom-left"></span>
        <span class="wedge-crosshair bottom-right"></span>

        <!-- ================= COLLAPSED INACTIVE VIEW ================= -->
        <div class="wedge-collapsed-content" style="${isActive ? 'display: none;' : 'display: flex;'}">
          <div class="wedge-collapsed-num">${mod.id}</div>
          <div class="wedge-collapsed-title-wrap">
            <span class="wedge-collapsed-title">${escapeHtml(mod.name)}</span>
          </div>
          <div class="wedge-collapsed-footer">
            <span class="wedge-collapsed-icon">${mod.icon || '📐'}</span>
            <span class="wedge-collapsed-dot"></span>
          </div>
        </div>

        <!-- ================= EXPANDED ACTIVE VIEW ================= -->
        <div class="wedge-expanded-content" style="${isActive ? 'display: flex;' : 'display: none;'}">
          <!-- Background blueprint linework -->
          <div class="wedge-blueprint-bg"></div>
          <div class="wedge-radial-accent"></div>

          <!-- Active Header -->
          <div class="wedge-active-header">
            <span class="wedge-active-index">MODULE ${mod.id} / 13</span>
            <div class="wedge-status-pill ${isModuleActive ? 'active' : 'coming-soon'}">
              <span class="status-dot"></span>
              <span>${mod.status}</span>
            </div>
          </div>

          <!-- Titles -->
          <div class="wedge-active-title-block">
            <div class="wedge-active-category">${escapeHtml(mod.category)}</div>
            <h2 class="wedge-active-title">${escapeHtml(mod.name)}</h2>
          </div>

          <!-- Description -->
          <p class="wedge-active-desc">${escapeHtml(mod.description)}</p>

          <!-- Specifications Chips -->
          <div class="wedge-active-specs">
            ${getModuleSpecChips(mod)}
          </div>

          <!-- Bottom Actions -->
          <div class="wedge-active-actions">
            ${isModuleActive ? `
              <button type="button" class="wedge-open-module-btn" data-action="open-active">
                <span>OPEN MODULE</span>
                <span>→</span>
              </button>
            ` : `
              <button type="button" class="wedge-explore-roadmap-btn" data-action="explore-roadmap">
                <span>EXPLORE SCOPE</span>
                <span>↗</span>
              </button>
            `}
          </div>
        </div>

      </article>
    `;
  }).join('');

  renderDots();
  attachCardEvents();
}

function getModuleSpecChips(mod) {
  if (mod.id === '01') {
    return `
      <span class="wedge-spec-chip"><span class="chip-val">35</span> Architecture Calculators</span>
      <span class="wedge-spec-chip">FSI & Coverage</span>
      <span class="wedge-spec-chip">Parking & Setbacks</span>
      <span class="wedge-spec-chip">RERA Carpet Area</span>
    `;
  }
  if (mod.id === '02') {
    return `
      <span class="wedge-spec-chip"><span class="chip-val">3D</span> Parametric Massing</span>
      <span class="wedge-spec-chip">Interactive Viewport</span>
      <span class="wedge-spec-chip">Parametric Setbacks</span>
      <span class="wedge-spec-chip">Real-time FSI & Infographics</span>
    `;
  }
  if (mod.id === '03') {
    return `
      <span class="wedge-spec-chip"><span class="chip-val">10</span> Analysis Modes</span>
      <span class="wedge-spec-chip">Interactive 3D Viewport</span>
      <span class="wedge-spec-chip">Live Sun & Wind Flow</span>
      <span class="wedge-spec-chip">Conceptual Massing</span>
    `;
  }
  const chipsByModule = {
    '01': ['35 Core Calculators', 'FSI / FAR Analysis', 'Parking & Setbacks', 'Building Height Limits'],
    '02': ['Parametric Massing', 'Golden Ratio', 'Column Grids', 'Proportion Systems'],
    '03': ['Sun Path Azimuth', 'Wind Rose & Streamlines', 'Topography Contours', 'Interactive 3D'],
    '04': ['Adjacency Matrix', 'Room Schedules', 'Occupant Capacity', 'Space Briefs'],
    '05': ['Beam Depth Sizing', 'Column Sizing', 'Cantilever Ratios', 'Slab Thickness'],
    '06': ['Water Tanks UG/OH', 'HVAC Tonnage', 'Electrical Transformers', 'Drainage Slopes'],
    '07': ['NBC 2016 Clauses', 'URDPFI Guidelines', 'Model Bye-Laws', 'Municipal DCRs'],
    '08': ['BOQ Rates', 'Plinth Area Rates', 'Material Yields', 'Cost Models'],
    '09': ['Rainwater Catchment', 'Rooftop Solar PV', 'Daylight Factor', 'U-Values'],
    '10': ['Door-Window Schedule', 'Submission Checklist', 'Finishes Matrix', 'Reports'],
    '11': ['Drawing Scales', 'A0/A1 Margins', 'Palette Studio', 'Sheet Composition'],
    '12': ['Generative Bye-Laws', 'Zoning Query', 'Design Optimization', 'Concept Assistant'],
    '13': ['Project Dossier', 'Multi-Tool State', 'Client Export', 'Cross-Module Coordination']
  };
  const list = chipsByModule[mod.id] || ['Architectural Engine', 'System Workflow'];
  return list.map(c => `<span class="wedge-spec-chip">${escapeHtml(c)}</span>`).join('');
}

function renderDots() {
  if (!dotsContainer) return;

  dotsContainer.innerHTML = PLATFORM_MODULES.map((mod, i) => `
    <button type="button" 
            class="wedge-dot ${i === activeIndex ? 'active' : ''}" 
            data-dot-index="${i}"
            title="Module ${mod.id}: ${mod.name}"
            aria-label="Go to Module ${mod.id}"></button>
  `).join('');

  // Attach dot click listeners
  dotsContainer.querySelectorAll('.wedge-dot').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.dotIndex, 10);
      setActiveModule(idx, true);
    });
  });

  updateCounterText();
}

function updateCounterText() {
  if (!counterElement) return;
  const mod = PLATFORM_MODULES[activeIndex];
  if (mod) {
    counterElement.innerHTML = `<strong>${mod.id} / 13</strong> — ${escapeHtml(mod.name)}`;
  }
}

function attachCardEvents() {
  const cards = trackElement.querySelectorAll('.wedge-card');
  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      // If clicking action buttons inside active card
      if (e.target.closest('[data-action="open-active"]')) {
        e.stopPropagation();
        triggerOpenActive();
        return;
      }
      if (e.target.closest('[data-action="explore-roadmap"]')) {
        e.stopPropagation();
        const mod = PLATFORM_MODULES[activeIndex];
        if (onOpenRoadmapCb) onOpenRoadmapCb(mod);
        return;
      }

      // If dragging just occurred, don't trigger click
      if (hasDragged) {
        hasDragged = false;
        return;
      }

      const idx = parseInt(card.dataset.moduleIndex, 10);
      if (idx !== activeIndex) {
        setActiveModule(idx, true);
      } else {
        // Clicking active card opens it
        triggerOpenActive();
      }
    });

    // Keyboard Enter / Space on focused card
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const idx = parseInt(card.dataset.moduleIndex, 10);
        if (idx !== activeIndex) {
          setActiveModule(idx, true);
        } else {
          triggerOpenActive();
        }
      }
    });
  });
}

export function setActiveModule(index, smooth = true) {
  if (index < 0 || index >= PLATFORM_MODULES.length) return;
  if (index === activeIndex) {
    updateWedgePositions(smooth);
    return;
  }

  activeIndex = index;

  // Toggle active class and content displays
  const cards = trackElement.querySelectorAll('.wedge-card');
  cards.forEach((card, i) => {
    const isTarget = i === activeIndex;
    const collapsed = card.querySelector('.wedge-collapsed-content');
    const expanded = card.querySelector('.wedge-expanded-content');

    if (isTarget) {
      card.classList.add('active');
      if (collapsed) collapsed.style.display = 'none';
      if (expanded) expanded.style.display = 'flex';
    } else {
      card.classList.remove('active');
      if (collapsed) collapsed.style.display = 'flex';
      if (expanded) expanded.style.display = 'none';
    }
  });

  // Update dots
  if (dotsContainer) {
    const dots = dotsContainer.querySelectorAll('.wedge-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === activeIndex);
    });
  }

  updateCounterText();
  updateWedgePositions(smooth);
}

export function stepModule(direction) {
  const nextIdx = activeIndex + direction;
  if (nextIdx >= 0 && nextIdx < PLATFORM_MODULES.length) {
    setActiveModule(nextIdx, true);
  }
}

function updateWedgePositions(smooth = true) {
  if (!trackElement || !viewportElement) return;

  const cards = trackElement.querySelectorAll('.wedge-card');
  const activeCard = cards[activeIndex];
  if (!activeCard) return;

  if (smooth) {
    trackElement.classList.remove('dragging');
  } else {
    trackElement.classList.add('dragging');
  }

  const viewportWidth = viewportElement.clientWidth;
  const cardLeft = activeCard.offsetLeft;
  const cardWidth = activeCard.offsetWidth;

  // Center the active card in the viewport
  const targetOffset = (viewportWidth / 2) - (cardLeft + cardWidth / 2);

  currentTranslate = targetOffset;
  prevTranslate = targetOffset;
  trackElement.style.transform = `translate3d(${targetOffset}px, 0, 0)`;

  if (!smooth) {
    // Re-enable smooth transition on next tick
    requestAnimationFrame(() => {
      trackElement.classList.remove('dragging');
    });
  }
}

function triggerOpenActive() {
  const mod = PLATFORM_MODULES[activeIndex];
  if (!mod) return;

  if (mod.id === '01') {
    if (onOpenCalculativesCb) onOpenCalculativesCb();
  } else if (mod.id === '02') {
    if (onOpenDesignerCb) onOpenDesignerCb();
  } else if (mod.id === '03') {
    if (onOpenSiteAnalysisCb) onOpenSiteAnalysisCb();
  } else {
    if (onOpenRoadmapCb) onOpenRoadmapCb(mod);
  }
}

function bindNavigationControls() {
  const prevBtn = document.getElementById('wedge-nav-prev');
  const nextBtn = document.getElementById('wedge-nav-next');

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      stepModule(-1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      stepModule(1);
    });
  }

  // Keyboard navigation (ArrowLeft, ArrowRight, Enter)
  window.addEventListener('keydown', (e) => {
    // Ignore if inside search modal or form inputs
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (document.querySelector('.search-modal-backdrop.open')) return;
    if (document.getElementById('tool-detail-backdrop')?.classList.contains('open')) return;
    if (document.getElementById('account-dialog-backdrop')) return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      stepModule(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      stepModule(1);
    } else if (e.key === 'Enter') {
      // If no interactive element has focus, trigger open
      if (document.activeElement === document.body || document.activeElement.classList.contains('wedge-card')) {
        e.preventDefault();
        triggerOpenActive();
      }
    }
  });

  // Mouse wheel & trackpad horizontal scroll
  viewportElement.addEventListener('wheel', (e) => {
    if (isWheelCooldown) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) > 25) {
      isWheelCooldown = true;
      if (delta > 0) {
        stepModule(1);
      } else {
        stepModule(-1);
      }
      setTimeout(() => {
        isWheelCooldown = false;
      }, 380);
    }
  }, { passive: true });
}

function bindGestures() {
  if (!viewportElement) return;

  // Touch handlers
  viewportElement.addEventListener('touchstart', touchStart, { passive: true });
  viewportElement.addEventListener('touchmove', touchMove, { passive: true });
  viewportElement.addEventListener('touchend', touchEnd);

  // Mouse drag handlers
  viewportElement.addEventListener('mousedown', dragStart);
  viewportElement.addEventListener('mousemove', dragMove);
  viewportElement.addEventListener('mouseup', dragEnd);
  viewportElement.addEventListener('mouseleave', () => {
    if (isDragging) dragEnd();
  });
}

function touchStart(e) {
  if (e.touches && e.touches[0]) {
    startDrag(e.touches[0].clientX);
  }
}

function touchMove(e) {
  if (!isDragging) return;
  if (e.touches && e.touches[0]) {
    moveDrag(e.touches[0].clientX);
  }
}

function touchEnd() {
  endDrag();
}

function dragStart(e) {
  if (e.button !== 0) return; // Left click only
  startDrag(e.clientX);
}

function dragMove(e) {
  if (!isDragging) return;
  moveDrag(e.clientX);
}

function dragEnd() {
  endDrag();
}

function startDrag(clientX) {
  isDragging = true;
  hasDragged = false;
  startX = clientX;
  trackElement.classList.add('dragging');
  cancelAnimationFrame(animationId);
}

function moveDrag(clientX) {
  const diffX = clientX - startX;
  if (Math.abs(diffX) > 6) {
    hasDragged = true;
  }
  currentTranslate = prevTranslate + diffX;
  trackElement.style.transform = `translate3d(${currentTranslate}px, 0, 0)`;
}

function endDrag() {
  if (!isDragging) return;
  isDragging = false;
  trackElement.classList.remove('dragging');

  const diffX = currentTranslate - prevTranslate;

  // Swipe threshold
  if (diffX < -50 && activeIndex < PLATFORM_MODULES.length - 1) {
    stepModule(1);
  } else if (diffX > 50 && activeIndex > 0) {
    stepModule(-1);
  } else {
    // Snap back cleanly to active module
    updateWedgePositions(true);
  }
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}