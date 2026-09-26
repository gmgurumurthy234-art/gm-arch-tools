/**
 * GM ARCH TOOLS — Authentication & Account Manager
 * Manages user authentication state, dynamic email rendering,
 * and minimal account menu (Profile, Settings, Projects, Sign In / Sign Out).
 */

const STORAGE_KEY = 'gm_arch_user_auth';

const DEFAULT_USER = {
  isAuthenticated: true,
  email: 'guru@example.com',
  name: 'Guru Murthy',
  role: 'Principal Architect',
  firm: 'GM Architectural Computation Studio',
  initials: 'GM',
  preferences: {
    units: 'metric', // 'metric' | 'imperial'
    precision: 2,
    autoSave: true
  }
};

let userState = loadUserState();

function loadUserState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_USER, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Could not read user state from localStorage:', e);
  }
  return { ...DEFAULT_USER };
}

function saveUserState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userState));
  } catch (e) {
    console.warn('Could not save user state to localStorage:', e);
  }
}

export function getCurrentUser() {
  return { ...userState };
}

export function isAuthenticated() {
  return !!userState.isAuthenticated;
}

export function signInUser(email, name = 'Architect') {
  userState.isAuthenticated = true;
  userState.email = email || 'architect@design.studio';
  userState.name = name;
  userState.initials = (name.split(' ').map(n => n[0]).join('') || 'GM').substring(0, 2).toUpperCase();
  saveUserState();
  renderAccountUI();
}

export function signOutUser() {
  userState.isAuthenticated = false;
  saveUserState();
  renderAccountUI();
}

export function updateUserProfile(updates) {
  userState = { ...userState, ...updates };
  if (userState.name) {
    userState.initials = (userState.name.split(' ').map(n => n[0]).join('') || 'GM').substring(0, 2).toUpperCase();
  }
  saveUserState();
  renderAccountUI();
}

export function initAccountManager() {
  renderAccountUI();
  bindAccountEvents();
}

export function renderAccountUI() {
  const container = document.getElementById('sidebar-account');
  if (!container) return;

  if (userState.isAuthenticated) {
    container.innerHTML = `
      <div class="account-label">ACCOUNT</div>
      <button type="button" class="account-trigger-btn" id="account-trigger-btn" aria-haspopup="true" aria-expanded="false" title="Account Menu">
        <div class="account-avatar">${userState.initials || 'GM'}</div>
        <div class="account-meta">
          <span class="account-email" id="account-email-display">${escapeHtml(userState.email)}</span>
          <span class="account-role">${escapeHtml(userState.role || 'Architect')}</span>
        </div>
        <span class="account-chevron">▾</span>
      </button>

      <!-- Account Popover Menu -->
      <div class="account-menu-popover" id="account-menu-popover" role="menu">
        <div class="account-menu-header">
          <div class="account-menu-avatar">${userState.initials || 'GM'}</div>
          <div>
            <div class="account-menu-name">${escapeHtml(userState.name)}</div>
            <div class="account-menu-email">${escapeHtml(userState.email)}</div>
          </div>
        </div>
        <div class="account-menu-divider"></div>
        <button type="button" class="account-menu-item" id="menu-item-profile" role="menuitem">
          <span class="menu-icon">👤</span>
          <span>Architect Profile</span>
        </button>
        <button type="button" class="account-menu-item" id="menu-item-settings" role="menuitem">
          <span class="menu-icon">⚙️</span>
          <span>Preferences & Units</span>
        </button>
        <button type="button" class="account-menu-item" id="menu-item-projects" role="menuitem">
          <span class="menu-icon">📁</span>
          <span>Saved Projects</span>
        </button>
        <div class="account-menu-divider"></div>
        <button type="button" class="account-menu-item text-danger" id="menu-item-signout" role="menuitem">
          <span class="menu-icon">🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="account-label">ACCOUNT</div>
      <button type="button" class="account-signin-btn" id="account-signin-btn" title="Sign into GM ARCH TOOLS">
        <span class="signin-icon">🔑</span>
        <span>SIGN IN</span>
      </button>
    `;
  }

  attachMenuListeners();
}

function attachMenuListeners() {
  const triggerBtn = document.getElementById('account-trigger-btn');
  const popover = document.getElementById('account-menu-popover');
  const signinBtn = document.getElementById('account-signin-btn');

  if (triggerBtn && popover) {
    triggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = popover.classList.toggle('show');
      triggerBtn.setAttribute('aria-expanded', isOpen.toString());
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!triggerBtn.contains(e.target) && !popover.contains(e.target)) {
        popover.classList.remove('show');
        triggerBtn.setAttribute('aria-expanded', 'false');
      }
    });

    const profileBtn = document.getElementById('menu-item-profile');
    if (profileBtn) {
      profileBtn.addEventListener('click', () => {
        popover.classList.remove('show');
        openProfileModal();
      });
    }

    const settingsBtn = document.getElementById('menu-item-settings');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        popover.classList.remove('show');
        openSettingsModal();
      });
    }

    const projectsBtn = document.getElementById('menu-item-projects');
    if (projectsBtn) {
      projectsBtn.addEventListener('click', () => {
        popover.classList.remove('show');
        window.openProjectsModal && window.openProjectsModal();
      });
    }

    const signoutBtn = document.getElementById('menu-item-signout');
    if (signoutBtn) {
      signoutBtn.addEventListener('click', () => {
        popover.classList.remove('show');
        signOutUser();
      });
    }
  }

  if (signinBtn) {
    signinBtn.addEventListener('click', () => {
      openSignInModal();
    });
  }
}

function bindAccountEvents() {
  // Global modal escape
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAccountDialogs();
    }
  });
}

function closeAccountDialogs() {
  const modal = document.getElementById('account-dialog-backdrop');
  if (modal) modal.remove();
}

function openProfileModal() {
  closeAccountDialogs();
  const modal = document.createElement('div');
  modal.id = 'account-dialog-backdrop';
  modal.className = 'account-dialog-backdrop';
  modal.innerHTML = `
    <div class="account-dialog-panel" role="dialog" aria-modal="true" aria-label="Architect Profile">
      <div class="account-dialog-header">
        <div class="dialog-title-block">
          <span class="dialog-badge">AUTHENTICATION & IDENTITY</span>
          <h2 class="dialog-title">Architect Profile</h2>
        </div>
        <button type="button" class="dialog-close-btn" id="dialog-close-btn">✕</button>
      </div>

      <form id="profile-edit-form" class="account-dialog-body">
        <div class="form-group">
          <label class="form-label" for="profile-name-input">Full Name</label>
          <input type="text" id="profile-name-input" class="form-input" value="${escapeHtml(userState.name)}" required>
        </div>

        <div class="form-group">
          <label class="form-label" for="profile-email-input">Account Email</label>
          <input type="email" id="profile-email-input" class="form-input" value="${escapeHtml(userState.email)}" required>
          <div class="form-hint">Displayed in left sidebar navigation.</div>
        </div>

        <div class="form-group">
          <label class="form-label" for="profile-role-input">Professional Role</label>
          <input type="text" id="profile-role-input" class="form-input" value="${escapeHtml(userState.role || '')}" placeholder="e.g. Lead Architect, Urban Planner">
        </div>

        <div class="form-group">
          <label class="form-label" for="profile-firm-input">Architecture Practice / Studio</label>
          <input type="text" id="profile-firm-input" class="form-input" value="${escapeHtml(userState.firm || '')}" placeholder="Studio name">
        </div>

        <div class="account-dialog-footer">
          <button type="button" class="btn-secondary" id="dialog-cancel-btn">Cancel</button>
          <button type="submit" class="btn-primary">Save Profile</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#dialog-close-btn').addEventListener('click', closeAccountDialogs);
  modal.querySelector('#dialog-cancel-btn').addEventListener('click', closeAccountDialogs);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeAccountDialogs();
  });

  const form = modal.querySelector('#profile-edit-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = modal.querySelector('#profile-name-input').value.trim();
    const email = modal.querySelector('#profile-email-input').value.trim();
    const role = modal.querySelector('#profile-role-input').value.trim();
    const firm = modal.querySelector('#profile-firm-input').value.trim();

    if (email) {
      updateUserProfile({ name, email, role, firm });
      closeAccountDialogs();
    }
  });
}

function openSettingsModal() {
  closeAccountDialogs();
  const modal = document.createElement('div');
  modal.id = 'account-dialog-backdrop';
  modal.className = 'account-dialog-backdrop';
  modal.innerHTML = `
    <div class="account-dialog-panel" role="dialog" aria-modal="true" aria-label="Preferences & Settings">
      <div class="account-dialog-header">
        <div class="dialog-title-block">
          <span class="dialog-badge">PLATFORM CONFIGURATION</span>
          <h2 class="dialog-title">Preferences & Units</h2>
        </div>
        <button type="button" class="dialog-close-btn" id="dialog-close-btn">✕</button>
      </div>

      <div class="account-dialog-body">
        <div class="settings-section">
          <h4 class="settings-sec-title">Default Dimensional Standard</h4>
          <div class="settings-radio-group">
            <label class="radio-option">
              <input type="radio" name="pref-units" value="metric" ${userState.preferences.units === 'metric' ? 'checked' : ''}>
              <div class="radio-meta">
                <span class="radio-title">Metric Standard (m, mm, m²)</span>
                <span class="radio-desc">Recommended for Indian/Global NBC & URDPFI compliance</span>
              </div>
            </label>
            <label class="radio-option">
              <input type="radio" name="pref-units" value="imperial" ${userState.preferences.units === 'imperial' ? 'checked' : ''}>
              <div class="radio-meta">
                <span class="radio-title">Imperial Standard (ft, in, sq ft)</span>
                <span class="radio-desc">Traditional feet & inches layout measurements</span>
              </div>
            </label>
          </div>
        </div>

        <div class="settings-section">
          <h4 class="settings-sec-title">Calculation Decimal Precision</h4>
          <select id="pref-precision-select" class="form-input">
            <option value="2" ${userState.preferences.precision === 2 ? 'selected' : ''}>2 Decimal Places (Standard e.g. 24.50 m²)</option>
            <option value="3" ${userState.preferences.precision === 3 ? 'selected' : ''}>3 Decimal Places (High Precision e.g. 24.525 m²)</option>
            <option value="4" ${userState.preferences.precision === 4 ? 'selected' : ''}>4 Decimal Places (Statutory FSI e.g. 1.7500)</option>
          </select>
        </div>

        <div class="settings-section">
          <label class="checkbox-option">
            <input type="checkbox" id="pref-autosave-checkbox" ${userState.preferences.autoSave ? 'checked' : ''}>
            <span>Auto-save calculation parameters across sessions</span>
          </label>
        </div>

        <div class="account-dialog-footer">
          <button type="button" class="btn-primary" id="save-settings-btn" style="width: 100%;">Apply Preferences</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#dialog-close-btn').addEventListener('click', closeAccountDialogs);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeAccountDialogs();
  });

  modal.querySelector('#save-settings-btn').addEventListener('click', () => {
    const selectedUnits = modal.querySelector('input[name="pref-units"]:checked').value;
    const precision = parseInt(modal.querySelector('#pref-precision-select').value, 10);
    const autoSave = modal.querySelector('#pref-autosave-checkbox').checked;

    userState.preferences = { units: selectedUnits, precision, autoSave };
    saveUserState();
    closeAccountDialogs();
  });
}

function openSignInModal() {
  closeAccountDialogs();
  const modal = document.createElement('div');
  modal.id = 'account-dialog-backdrop';
  modal.className = 'account-dialog-backdrop';
  modal.innerHTML = `
    <div class="account-dialog-panel" role="dialog" aria-modal="true" aria-label="Sign In">
      <div class="account-dialog-header">
        <div class="dialog-title-block">
          <span class="dialog-badge">GM ARCH TOOLS ACCESS</span>
          <h2 class="dialog-title">Sign In to Platform</h2>
        </div>
        <button type="button" class="dialog-close-btn" id="dialog-close-btn">✕</button>
      </div>

      <form id="signin-form" class="account-dialog-body">
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
          Access your architectural workspace, custom presets, and saved calculations.
        </p>

        <div class="form-group">
          <label class="form-label" for="signin-name-input">Architect Name</label>
          <input type="text" id="signin-name-input" class="form-input" placeholder="e.g. Guru Murthy" value="Guru Murthy" required>
        </div>

        <div class="form-group">
          <label class="form-label" for="signin-email-input">Work Email</label>
          <input type="email" id="signin-email-input" class="form-input" placeholder="architect@studio.design" value="guru@example.com" required>
        </div>

        <div class="account-dialog-footer">
          <button type="button" class="btn-secondary" id="dialog-cancel-btn">Cancel</button>
          <button type="submit" class="btn-primary">Sign In</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#dialog-close-btn').addEventListener('click', closeAccountDialogs);
  modal.querySelector('#dialog-cancel-btn').addEventListener('click', closeAccountDialogs);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeAccountDialogs();
  });

  const form = modal.querySelector('#signin-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = modal.querySelector('#signin-name-input').value.trim();
    const email = modal.querySelector('#signin-email-input').value.trim();
    if (email) {
      signInUser(email, name);
      closeAccountDialogs();
    }
  });
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