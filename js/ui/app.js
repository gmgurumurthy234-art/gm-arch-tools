/**
 * GM ARCH TOOLS — Main Application Orchestrator
 * Connects Platform Hub (13 Modules), Flowing Wedge Carousel, Left Sidebar,
 * Arch Calculatives Suite (35 Tools), Global Search Engine, Breadcrumbs, and Modals.
 */

import { PLATFORM_MODULES, MODULE_STATUS } from '../data/modules-database.js';
import { ARCH_CALCULATIVES } from '../data/tools-database.js';
import { searchTools, SUGGESTED_SEARCHES } from '../search/search-engine.js';
import { initIntro } from '../intro.js';
import { initModal, openToolModal } from './modal-controller.js';
import { initAccountManager } from '../auth/account-manager.js';
import { initWedgeCarousel, setActiveModule } from './wedge-carousel.js';
import { initSiteAnalysisApp, selectAnalysisMode, pauseSiteAnalysis, resumeSiteAnalysis } from '../site-analysis/site-analysis-app.js?v=6.2.5';
import { initBasicToolsApp } from '../basic-tools/basic-tools-app.js';
import { initDesignerApp, pauseDesignerApp, resumeDesignerApp } from '../designer/designer-app.js?v=6.3.1';

let currentView = 'HUB'; // 'HUB' | 'CALCULATIVES' | 'DESIGNER' | 'SITE_ANALYSIS' | 'BASIC_TOOLS'
let activeCategory = 'ALL';
let searchResults = [];
let selectedSearchIndex = -1;

export function initApp() {
  // 1. Initialize Brand Intro Sequence
  initIntro();

  // 2. Initialize Account & Authentication State (Left Sidebar)
  initAccountManager();

  // 3. Initialize Modals
  initModal();
  initRoadmapModal();
  initProjectsModal();
  initAboutModal();

  // Expose global router for cross-module links
  window.gmArchToolsRouter = {
    showPlatformHub: (updateHash, viewMode) => showPlatformHub(updateHash, viewMode),
    showArchCalculatives: (updateHash) => showArchCalculatives(updateHash),
    showTheDesigner: (updateHash) => showTheDesigner(updateHash),
    showSiteAnalysis: (updateHash) => showSiteAnalysis(updateHash),
    showBasicTools: (updateHash) => showBasicTools(updateHash),
    openRoadmapModal: (mod) => openRoadmapModal(mod),
    openAboutModal: () => {
      const modal = document.getElementById('about-modal-backdrop');
      if (modal) modal.classList.add('active');
    }
  };

  // 4. Initialize Horizontal Module Wedge Carousel
  initWedgeCarousel({
    onOpenCalculatives: () => showArchCalculatives(),
    onOpenDesigner: () => showTheDesigner(),
    onOpenSiteAnalysis: () => showSiteAnalysis(),
    onOpenBasicTools: () => showBasicTools(),
    onOpenRoadmap: (mod) => openRoadmapModal(mod)
  });

  // 5. Render Platform 13-Modules Grid (Secondary Overview)
  renderModulesGrid();

  // 6. Render Arch Calculatives Categories & 35 Tool Cards
  renderCategoryFilterBar();
  renderToolsGrid();

  // 7. Setup Global Search System
  initSearchEngineUI();

  // 8. Bind Global Navigation Events & Breadcrumbs
  bindNavigationEvents();

  // 9. Check URL hash for routing (e.g. #modules, #arch-calculatives, #tool-03)
  checkUrlHash();

  window.addEventListener('hashchange', checkUrlHash);
}

/* ==============================================================
   VIEW SWITCHER & BREADCRUMBS
   ============================================================== */
export function showPlatformHub(updateHash = true, viewMode = 'wedges') {
  currentView = 'HUB';
  document.body.classList.remove('site-analysis-active');
  document.body.classList.remove('basic-tools-active');
  document.body.classList.remove('designer-active');
  pauseSiteAnalysis();
  pauseDesignerApp();

  const hubView = document.getElementById('platform-modules-view');
  const calcView = document.getElementById('arch-calculatives-view');
  const saView = document.getElementById('site-analysis-view');
  const btView = document.getElementById('basic-tools-view');
  const desView = document.getElementById('designer-workspace-view');
  const wedgeContainer = document.getElementById('wedge-portal-container');
  const gridContainer = document.getElementById('modules-grid');
  const btnWedges = document.getElementById('toggle-view-wedges');
  const btnGrid = document.getElementById('toggle-view-grid');

  if (hubView) {
    hubView.classList.add('active-view');
    hubView.style.display = 'block';
  }
  if (calcView) {
    calcView.classList.remove('active-view');
    calcView.style.display = 'none';
  }
  if (saView) {
    saView.classList.remove('active-view');
    saView.style.display = 'none';
  }
  if (btView) {
    btView.classList.remove('active-view');
    btView.style.display = 'none';
  }
  if (desView) {
    desView.classList.remove('active-view');
    desView.style.display = 'none';
  }

  if (viewMode === 'grid') {
    document.body.classList.remove('home-portal-active');
    if (wedgeContainer) wedgeContainer.style.display = 'none';
    if (gridContainer) gridContainer.style.display = 'grid';
    if (btnWedges) btnWedges.classList.remove('active');
    if (btnGrid) btnGrid.classList.add('active');
    setSidebarActive('all-modules');
    updateBreadcrumbs(['GM ARCH TOOLS', 'ALL MODULES']);
  } else {
    document.body.classList.add('home-portal-active');
    if (wedgeContainer) wedgeContainer.style.display = 'flex';
    if (gridContainer) gridContainer.style.display = 'none';
    if (btnWedges) btnWedges.classList.add('active');
    if (btnGrid) btnGrid.classList.remove('active');
    setSidebarActive('home');
    updateBreadcrumbs(['GM ARCH TOOLS']);
  }

  if (updateHash && window.location.hash !== '#modules') {
    history.pushState(null, '', '#modules');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function showArchCalculatives(updateHash = true) {
  currentView = 'CALCULATIVES';
  document.body.classList.remove('home-portal-active');
  document.body.classList.remove('site-analysis-active');
  document.body.classList.remove('basic-tools-active');
  document.body.classList.remove('designer-active');
  pauseSiteAnalysis();
  pauseDesignerApp();

  const hubView = document.getElementById('platform-modules-view');
  const calcView = document.getElementById('arch-calculatives-view');
  const saView = document.getElementById('site-analysis-view');
  const btView = document.getElementById('basic-tools-view');
  const desView = document.getElementById('designer-workspace-view');

  if (hubView) {
    hubView.classList.remove('active-view');
    hubView.style.display = 'none';
  }
  if (calcView) {
    calcView.classList.add('active-view');
    calcView.style.display = 'block';
  }
  if (saView) {
    saView.classList.remove('active-view');
    saView.style.display = 'none';
  }
  if (btView) {
    btView.classList.remove('active-view');
    btView.style.display = 'none';
  }
  if (desView) {
    desView.classList.remove('active-view');
    desView.style.display = 'none';
  }

  setSidebarActive('all-modules');
  updateBreadcrumbs(['GM ARCH TOOLS', 'ARCH CALCULATIVES']);

  if (updateHash && !window.location.hash.startsWith('#tool-') && window.location.hash !== '#arch-calculatives') {
    history.pushState(null, '', '#arch-calculatives');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function showTheDesigner(updateHash = true) {
  currentView = 'DESIGNER';
  document.body.classList.remove('home-portal-active');
  document.body.classList.remove('site-analysis-active');
  document.body.classList.remove('basic-tools-active');
  pauseSiteAnalysis();
  document.body.classList.add('designer-active');

  const hubView = document.getElementById('platform-modules-view');
  const calcView = document.getElementById('arch-calculatives-view');
  const saView = document.getElementById('site-analysis-view');
  const btView = document.getElementById('basic-tools-view');
  const desView = document.getElementById('designer-workspace-view');

  if (hubView) {
    hubView.classList.remove('active-view');
    hubView.style.display = 'none';
  }
  if (calcView) {
    calcView.classList.remove('active-view');
    calcView.style.display = 'none';
  }
  if (saView) {
    saView.classList.remove('active-view');
    saView.style.display = 'none';
  }
  if (btView) {
    btView.classList.remove('active-view');
    btView.style.display = 'none';
  }
  if (desView) {
    desView.classList.add('active-view');
    desView.style.display = 'flex';
  }

  setSidebarActive('all-modules');
  updateBreadcrumbs(['GM ARCH TOOLS', 'THE DESIGNER']);

  if (updateHash && window.location.hash !== '#the-designer') {
    history.pushState(null, '', '#the-designer');
  }

  setTimeout(() => {
    initDesignerApp();
    resumeDesignerApp();
  }, 40);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function showSiteAnalysis(updateHash = true) {
  currentView = 'SITE_ANALYSIS';
  document.body.classList.remove('home-portal-active');
  document.body.classList.remove('basic-tools-active');
  document.body.classList.remove('designer-active');
  pauseDesignerApp();
  document.body.classList.add('site-analysis-active');

  const hubView = document.getElementById('platform-modules-view');
  const calcView = document.getElementById('arch-calculatives-view');
  const saView = document.getElementById('site-analysis-view');
  const btView = document.getElementById('basic-tools-view');
  const desView = document.getElementById('designer-workspace-view');

  if (hubView) {
    hubView.classList.remove('active-view');
    hubView.style.display = 'none';
  }
  if (calcView) {
    calcView.classList.remove('active-view');
    calcView.style.display = 'none';
  }
  if (saView) {
    saView.classList.add('active-view');
    saView.style.display = 'flex';
  }
  if (btView) {
    btView.classList.remove('active-view');
    btView.style.display = 'none';
  }
  if (desView) {
    desView.classList.remove('active-view');
    desView.style.display = 'none';
  }

  setSidebarActive('all-modules');
  updateBreadcrumbs(['GM ARCH TOOLS', 'SITE ANALYSIS']);

  if (updateHash && window.location.hash !== '#site-analysis') {
    history.pushState(null, '', '#site-analysis');
  }

  setTimeout(() => {
    initSiteAnalysisApp();
    resumeSiteAnalysis();
  }, 40);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function showBasicTools(updateHash = true) {
  currentView = 'BASIC_TOOLS';
  document.body.classList.remove('home-portal-active');
  document.body.classList.remove('site-analysis-active');
  document.body.classList.remove('designer-active');
  pauseSiteAnalysis();
  pauseDesignerApp();
  document.body.classList.add('basic-tools-active');

  const hubView = document.getElementById('platform-modules-view');
  const calcView = document.getElementById('arch-calculatives-view');
  const saView = document.getElementById('site-analysis-view');
  const btView = document.getElementById('basic-tools-view');
  const desView = document.getElementById('designer-workspace-view');

  if (hubView) {
    hubView.classList.remove('active-view');
    hubView.style.display = 'none';
  }
  if (calcView) {
    calcView.classList.remove('active-view');
    calcView.style.display = 'none';
  }
  if (saView) {
    saView.classList.remove('active-view');
    saView.style.display = 'none';
  }
  if (btView) {
    btView.classList.add('active-view');
    btView.style.display = 'flex';
  }
  if (desView) {
    desView.classList.remove('active-view');
    desView.style.display = 'none';
  }

  setSidebarActive('all-modules');
  updateBreadcrumbs(['GM ARCH TOOLS', 'BASIC TOOLS']);

  if (updateHash && window.location.hash !== '#basic-tools') {
    history.pushState(null, '', '#basic-tools');
  }

  setTimeout(() => {
    initBasicToolsApp();
  }, 20);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setSidebarActive(target) {
  const items = document.querySelectorAll('.sidebar-nav-item');
  items.forEach(item => {
    const isMatch = item.dataset.navTarget === target;
    item.classList.toggle('active', isMatch);
  });
}

function updateBreadcrumbs(pathArray) {
  const container = document.getElementById('breadcrumbs-container');
  if (!container) return;

  container.innerHTML = pathArray.map((crumb, idx) => {
    const isLast = idx === pathArray.length - 1;
    let clickAttr = '';

    if (idx === 0) {
      clickAttr = 'data-nav="hub"';
    } else if (idx === 1 && crumb === 'ARCH CALCULATIVES') {
      clickAttr = 'data-nav="calculatives"';
    } else if (idx === 1 && crumb === 'THE DESIGNER') {
      clickAttr = 'data-nav="the-designer"';
    } else if (idx === 1 && crumb === 'SITE ANALYSIS') {
      clickAttr = 'data-nav="site-analysis"';
    } else if (idx === 1 && crumb === 'BASIC TOOLS') {
      clickAttr = 'data-nav="basic-tools"';
    } else if (idx === 1 && crumb === 'ALL MODULES') {
      clickAttr = 'data-nav="grid"';
    }

    const itemHtml = isLast
      ? `<span class="breadcrumb-item active">${crumb}</span>`
      : `<a href="#" class="breadcrumb-item" ${clickAttr}>${crumb}</a>`;

    const sep = isLast ? '' : '<span class="breadcrumb-separator">&gt;</span>';
    return itemHtml + sep;
  }).join('');

  // Attach breadcrumb click actions
  const hubLink = container.querySelector('[data-nav="hub"]');
  if (hubLink) {
    hubLink.addEventListener('click', (e) => {
      e.preventDefault();
      showPlatformHub(true, 'wedges');
    });
  }

  const calcLink = container.querySelector('[data-nav="calculatives"]');
  if (calcLink) {
    calcLink.addEventListener('click', (e) => {
      e.preventDefault();
      showArchCalculatives();
    });
  }

  const desLink = container.querySelector('[data-nav="the-designer"]');
  if (desLink) {
    desLink.addEventListener('click', (e) => {
      e.preventDefault();
      showTheDesigner();
    });
  }

  const saLink = container.querySelector('[data-nav="site-analysis"]');
  if (saLink) {
    saLink.addEventListener('click', (e) => {
      e.preventDefault();
      showSiteAnalysis();
    });
  }

  const btLink = container.querySelector('[data-nav="basic-tools"]');
  if (btLink) {
    btLink.addEventListener('click', (e) => {
      e.preventDefault();
      showBasicTools();
    });
  }

  const gridLink = container.querySelector('[data-nav="grid"]');
  if (gridLink) {
    gridLink.addEventListener('click', (e) => {
      e.preventDefault();
      showPlatformHub(true, 'grid');
    });
  }
}

function bindNavigationEvents() {
  // Brand Logo click -> Return to Platform Hub (Wedges)
  const brandLink = document.getElementById('brand-home-link');
  if (brandLink) {
    brandLink.addEventListener('click', (e) => {
      e.preventDefault();
      showPlatformHub(true, 'wedges');
    });
  }

  // Header "All Modules" quick button
  const headerModulesBtn = document.getElementById('header-modules-btn');
  if (headerModulesBtn) {
    headerModulesBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showPlatformHub(true, 'grid');
    });
  }

  // Back to Modules button inside Arch Calculatives view
  const backToModulesBtn = document.getElementById('back-to-modules-btn');
  if (backToModulesBtn) {
    backToModulesBtn.addEventListener('click', () => {
      showPlatformHub(true, 'wedges');
    });
  }

  // Back to Modules button inside Site Analysis view
  const saBackBtn = document.getElementById('sa-back-btn');
  if (saBackBtn) {
    saBackBtn.addEventListener('click', () => {
      showPlatformHub(true, 'wedges');
    });
  }

  // Back to Modules button inside Basic Tools view
  const btBackBtn = document.getElementById('bt-back-btn');
  if (btBackBtn) {
    btBackBtn.addEventListener('click', () => {
      showPlatformHub(true, 'wedges');
    });
  }

  // Left Sidebar Nav Buttons
  const navHome = document.getElementById('sidebar-nav-home');
  if (navHome) {
    navHome.addEventListener('click', () => {
      showPlatformHub(true, 'wedges');
    });
  }

  const navModules = document.getElementById('sidebar-nav-modules');
  if (navModules) {
    navModules.addEventListener('click', () => {
      showPlatformHub(true, 'grid');
    });
  }

  const navProjects = document.getElementById('sidebar-nav-projects');
  if (navProjects) {
    navProjects.addEventListener('click', () => {
      openProjectsModal();
    });
  }

  const navAbout = document.getElementById('sidebar-nav-about');
  if (navAbout) {
    navAbout.addEventListener('click', () => {
      openAboutModal();
    });
  }

  // View Switcher Buttons (Wedge vs Grid)
  const toggleWedges = document.getElementById('toggle-view-wedges');
  const toggleGrid = document.getElementById('toggle-view-grid');

  if (toggleWedges) {
    toggleWedges.addEventListener('click', () => {
      showPlatformHub(true, 'wedges');
    });
  }

  if (toggleGrid) {
    toggleGrid.addEventListener('click', () => {
      showPlatformHub(true, 'grid');
    });
  }
}

function checkUrlHash() {
  const hash = window.location.hash;

  if (hash.startsWith('#tool-')) {
    const toolId = hash.replace('#tool-', '');
    showArchCalculatives(false);
    openToolModal(toolId);
    const tool = ARCH_CALCULATIVES.find(t => t.id === toolId.padStart(2, '0'));
    if (tool) {
      updateBreadcrumbs(['GM ARCH TOOLS', 'ARCH CALCULATIVES', `${tool.id} — ${tool.name.toUpperCase()}`]);
    }
  } else if (hash === '#the-designer' || hash === '#designer' || hash === '#module-02') {
    showTheDesigner(false);
  } else if (hash === '#site-analysis' || hash === '#module-03') {
    showSiteAnalysis(false);
  } else if (hash === '#site-analysis-maps') {
    showSiteAnalysis(false);
    setTimeout(() => {
      selectAnalysisMode('MAPS');
    }, 60);
  } else if (hash === '#arch-calculatives' || hash === '#module-01') {
    showArchCalculatives(false);
  } else if (hash === '#basic-tools' || hash === '#module-13') {
    showBasicTools(false);
  } else {
    // Default to Platform Hub
    showPlatformHub(false);
  }
}

/* ==============================================================
   13-MODULES PLATFORM GRID
   ============================================================== */
function renderModulesGrid() {
  const grid = document.getElementById('modules-grid');
  if (!grid) return;

  grid.innerHTML = PLATFORM_MODULES.map(mod => {
    const isActive = mod.status === MODULE_STATUS.ACTIVE;

    return `
      <article class="module-card ${isActive ? 'active-module' : 'coming-soon-module'}" data-module-id="${mod.id}">
        <div>
          <div class="module-card-header">
            <span class="module-num">${mod.id}</span>
            <span class="module-status-badge ${isActive ? 'active-status' : 'coming-soon-status'}">
              ${isActive ? '<span class="active-dot"></span>ACTIVE' : 'COMING SOON'}
            </span>
          </div>

          <div class="module-card-body">
            <div class="module-icon-wrap">${mod.icon}</div>
            <h3 class="module-card-title">${mod.name}</h3>
            <div class="module-card-tagline">${mod.tagline}</div>
            <p class="module-card-desc">${mod.description}</p>
          </div>
        </div>

        <div class="module-card-footer">
          <span class="module-tools-count">
            ${isActive ? `● ${mod.toolsCount} Architecture Tools` : 'In Development'}
          </span>
          <span class="module-enter-action">
            ${isActive ? 'Open Module →' : 'View Scope ↗'}
          </span>
        </div>
      </article>
    `;
  }).join('');

  // Attach card click handlers
  const cards = grid.querySelectorAll('.module-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const modId = card.getAttribute('data-module-id');
      const mod = PLATFORM_MODULES.find(m => m.id === modId);

      if (modId === '01') {
        showArchCalculatives();
      } else if (modId === '02') {
        showTheDesigner();
      } else if (modId === '03') {
        showSiteAnalysis();
      } else if (mod) {
        openRoadmapModal(mod);
      }
    });
  });
}

/* ==============================================================
   ROADMAP MODAL FOR COMING SOON MODULES
   ============================================================== */
function initRoadmapModal() {
  const backdrop = document.getElementById('roadmap-modal-backdrop');
  const closeBtn = document.getElementById('roadmap-close-btn');

  if (closeBtn && backdrop) {
    closeBtn.addEventListener('click', closeRoadmapModal);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeRoadmapModal();
    });
  }
}

function openRoadmapModal(mod) {
  const backdrop = document.getElementById('roadmap-modal-backdrop');
  const title = document.getElementById('roadmap-title');
  const category = document.getElementById('roadmap-category');
  const desc = document.getElementById('roadmap-desc');
  const badge = document.getElementById('roadmap-status-badge');

  if (!backdrop) return;

  if (title) title.innerText = `${mod.id} — ${mod.name}`;
  if (category) category.innerText = mod.category;
  if (desc) desc.innerText = mod.description;
  if (badge) badge.innerText = mod.status;

  backdrop.classList.add('open');
}

function closeRoadmapModal() {
  const backdrop = document.getElementById('roadmap-modal-backdrop');
  if (backdrop) backdrop.classList.remove('open');
}

/* ==============================================================
   PROJECTS WORKSPACE MODAL
   ============================================================== */
export function initProjectsModal() {
  const backdrop = document.getElementById('projects-modal-backdrop');
  const closeBtn = document.getElementById('projects-close-btn');

  if (closeBtn && backdrop) {
    closeBtn.addEventListener('click', closeProjectsModal);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeProjectsModal();
    });
  }

  window.openProjectsModal = openProjectsModal;
}

export function openProjectsModal() {
  const backdrop = document.getElementById('projects-modal-backdrop');
  if (backdrop) backdrop.classList.add('open');
}

export function closeProjectsModal() {
  const backdrop = document.getElementById('projects-modal-backdrop');
  if (backdrop) backdrop.classList.remove('open');
}

/* ==============================================================
   ABOUT PLATFORM MODAL
   ============================================================== */
export function initAboutModal() {
  const backdrop = document.getElementById('about-modal-backdrop');
  const closeBtn = document.getElementById('about-close-btn');

  if (closeBtn && backdrop) {
    closeBtn.addEventListener('click', closeAboutModal);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeAboutModal();
    });
  }
}

export function openAboutModal() {
  const backdrop = document.getElementById('about-modal-backdrop');
  if (backdrop) backdrop.classList.add('open');
}

export function closeAboutModal() {
  const backdrop = document.getElementById('about-modal-backdrop');
  if (backdrop) backdrop.classList.remove('open');
}

/* ==============================================================
   CATEGORY FILTERING & TOOLS GRID (ARCH CALCULATIVES)
   ============================================================== */
function renderCategoryFilterBar() {
  const bar = document.getElementById('category-filter-bar');
  if (!bar) return;

  const categories = ['ALL', ...new Set(ARCH_CALCULATIVES.map(t => t.category))];

  bar.innerHTML = categories.map(cat => {
    const count = cat === 'ALL' 
      ? ARCH_CALCULATIVES.length 
      : ARCH_CALCULATIVES.filter(t => t.category === cat).length;
    const label = cat === 'ALL' ? `All Tools (${count})` : `${cat} (${count})`;
    return `
      <button type="button" 
              class="filter-btn ${cat === activeCategory ? 'active' : ''}" 
              data-category="${cat}">
        ${label}
      </button>
    `;
  }).join('');

  const buttons = bar.querySelectorAll('.filter-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.getAttribute('data-category');
      buttons.forEach(b => b.classList.toggle('active', b === btn));
      renderToolsGrid();
    });
  });
}

function renderToolsGrid() {
  const grid = document.getElementById('tools-grid');
  if (!grid) return;

  const filtered = activeCategory === 'ALL'
    ? ARCH_CALCULATIVES
    : ARCH_CALCULATIVES.filter(t => t.category === activeCategory);

  grid.innerHTML = filtered.map(tool => `
    <article class="tool-card" data-tool-id="${tool.id}">
      <div>
        <div class="tool-card-header">
          <span class="tool-card-id">${tool.id}</span>
          <span class="tool-card-category">${tool.category}</span>
        </div>
        <h3 class="tool-card-title">${tool.name}</h3>
        <p class="tool-card-desc">${tool.description}</p>
        <div class="tool-card-formula-preview" title="${tool.formula}">
          ${tool.formula}
        </div>
      </div>
      <div class="tool-card-footer">
        <div class="tool-card-tags">
          ${(tool.tags || []).slice(0, 3).map(tag => `<span class="tool-card-tag">#${tag}</span>`).join('')}
        </div>
        <div class="open-tool-action">
          Open Calculator <span>→</span>
        </div>
      </div>
    </article>
  `).join('');

  const cards = grid.querySelectorAll('.tool-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const toolId = card.getAttribute('data-tool-id');
      const tool = ARCH_CALCULATIVES.find(t => t.id === toolId);
      openToolModal(toolId);
      if (tool) {
        updateBreadcrumbs(['GM ARCH TOOLS', 'ARCH CALCULATIVES', `${tool.id} — ${tool.name.toUpperCase()}`]);
      }
    });
  });
}

/* ==============================================================
   GLOBAL SEARCH SYSTEM (KEYBOARD + MODAL + DETERMINISTIC ENGINE)
   ============================================================== */
function initSearchEngineUI() {
  const searchTriggerBtn = document.getElementById('header-search-btn');
  const searchModal = document.getElementById('search-modal-backdrop');
  const searchInput = document.getElementById('search-main-input');
  const searchClearBtn = document.getElementById('search-clear-btn');
  const resultsContainer = document.getElementById('search-results-list');

  if (!searchModal || !searchInput) return;

  function openSearch(initialQuery = '') {
    searchModal.classList.add('open');
    if (initialQuery) {
      searchInput.value = initialQuery;
    }
    searchInput.focus();
    searchInput.select();
    executeSearch(searchInput.value);
  }

  function closeSearch() {
    searchModal.classList.remove('open');
    searchInput.blur();
    selectedSearchIndex = -1;
  }

  if (searchTriggerBtn) {
    searchTriggerBtn.addEventListener('click', () => openSearch());
  }

  searchModal.addEventListener('click', (e) => {
    if (e.target === searchModal) {
      closeSearch();
    }
  });

  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchClearBtn.style.display = 'none';
      executeSearch('');
      searchInput.focus();
    });
  }

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (searchModal.classList.contains('open')) {
        closeSearch();
      } else {
        openSearch();
      }
    }

    if (e.key === 'Escape' && searchModal.classList.contains('open')) {
      closeSearch();
    }
  });

  searchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    if (searchClearBtn) {
      searchClearBtn.style.display = val ? 'block' : 'none';
    }
    executeSearch(val);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedSearchIndex = (selectedSearchIndex + 1) % searchResults.length;
      updateSelectedSearchItem();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedSearchIndex = selectedSearchIndex <= 0 ? searchResults.length - 1 : selectedSearchIndex - 1;
      updateSelectedSearchItem();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSearchIndex >= 0 && selectedSearchIndex < searchResults.length) {
        const chosen = searchResults[selectedSearchIndex];
        selectToolFromSearch(chosen, closeSearch);
      } else if (searchResults.length > 0) {
        selectToolFromSearch(searchResults[0], closeSearch);
      }
    }
  });

  function executeSearch(query) {
    selectedSearchIndex = -1;
    const trimmed = query.trim();

    if (!trimmed) {
      renderSearchSuggestions(resultsContainer, openSearch);
      searchResults = [];
      return;
    }

    searchResults = searchTools(trimmed, { limit: 10 });

    if (searchResults.length === 0) {
      renderSearchEmptyState(resultsContainer, trimmed, openSearch);
      return;
    }

    renderSearchResults(resultsContainer, searchResults, closeSearch);
  }
}

function selectToolFromSearch(tool, closeSearch) {
  closeSearch();
  showArchCalculatives(false);
  openToolModal(tool.id);
  updateBreadcrumbs(['GM ARCH TOOLS', 'ARCH CALCULATIVES', `${tool.id} — ${tool.name.toUpperCase()}`]);
}

function updateSelectedSearchItem() {
  const items = document.querySelectorAll('.search-result-item');
  items.forEach((item, idx) => {
    item.classList.toggle('selected', idx === selectedSearchIndex);
    if (idx === selectedSearchIndex) {
      item.scrollIntoView({ block: 'nearest' });
    }
  });
}

function renderSearchResults(container, results, onClose) {
  container.innerHTML = results.map((tool, idx) => `
    <li class="search-result-item ${idx === 0 ? 'selected' : ''}" data-tool-id="${tool.id}">
      <div class="search-result-top">
        <div class="search-result-title">
          <span class="result-tool-id">${tool.id}</span>
          <span class="result-tool-name">${tool.name}</span>
        </div>
        <span class="result-tool-category">${tool.category}</span>
      </div>
      <p class="result-tool-desc">${tool.description}</p>
      <div class="result-tool-formula">${tool.formula}</div>
    </li>
  `).join('');

  selectedSearchIndex = 0;

  const items = container.querySelectorAll('.search-result-item');
  items.forEach(item => {
    item.addEventListener('click', () => {
      const toolId = item.getAttribute('data-tool-id');
      const tool = ARCH_CALCULATIVES.find(t => t.id === toolId);
      if (tool) {
        selectToolFromSearch(tool, onClose);
      }
    });
  });
}

function renderSearchEmptyState(container, query, onSearchAgain) {
  container.innerHTML = `
    <div class="search-empty-state">
      <div class="empty-title">No tools found matching "${query}".</div>
      <div class="empty-suggestions">
        <span class="empty-suggestions-label">Try searching for:</span>
        <div class="suggestion-chips">
          ${SUGGESTED_SEARCHES.map(s => `
            <button type="button" class="suggestion-chip" data-query="${s}">
              ${s}
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  attachSuggestionChipListeners(container, onSearchAgain);
}

function renderSearchSuggestions(container, onSearchAgain) {
  container.innerHTML = `
    <div class="search-empty-state" style="padding: 24px 20px;">
      <div class="empty-suggestions">
        <span class="empty-suggestions-label">Popular Architecture Tools:</span>
        <div class="suggestion-chips">
          ${SUGGESTED_SEARCHES.map(s => `
            <button type="button" class="suggestion-chip" data-query="${s}">
              ${s}
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  attachSuggestionChipListeners(container, onSearchAgain);
}

function attachSuggestionChipListeners(container, onSearchAgain) {
  const chips = container.querySelectorAll('.suggestion-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const query = chip.getAttribute('data-query');
      const searchInput = document.getElementById('search-main-input');
      if (searchInput) {
        searchInput.value = query;
        searchInput.focus();
        onSearchAgain(query);
      }
    });
  });
}
