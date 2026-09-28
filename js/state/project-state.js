/**
 * GM ARCH TOOLS — Global Project State & Assets Store (Iteration 03)
 * Author: Guru Murthy (GM)
 * Central reactive store for:
 *   - Imported Assets (SKP, 3DM, RVT, DWG, PNG, JPG)
 *   - Reference Images & Opacity Layers
 *   - Project Metadata & Global Settings
 *   - Cross-module synchronization (Basic Tools ↔ Site Analysis ↔ Presentation)
 */

class ProjectStateManager {
  constructor() {
    this.storageKey = 'gm_arch_tools_project_v3';
    this.listeners = new Set();

    // Default State
    this.state = {
      project: {
        name: 'UNIFIED_ARCH_PROJECT_01',
        author: 'Architect Guru Murthy',
        location: 'Bengaluru, India (12.9716° N, 77.5946° E)',
        codeStandard: 'NBC 2016 / Local Municipal Bye-Laws',
        defaultUnits: 'm', // 'm' | 'mm' | 'ft' | 'in'
        createdAt: new Date().toISOString()
      },
      assets: [
        {
          id: 'asset_demo_site_model',
          name: 'CONCEPTUAL_MASSING_01.SKP',
          format: 'SketchUp Model',
          ext: 'SKP',
          sizeBytes: 19293798,
          sizeFormatted: '18.4 MB',
          type: '3D_MODEL',
          supported: true,
          units: 'Metres',
          visible: true,
          locked: false,
          opacity: 1.0,
          dataUrl: null,
          details: {
            layers: 8,
            groups: 24,
            components: 12,
            materials: 6,
            scale: '1.0 (True Size)'
          }
        },
        {
          id: 'asset_demo_cad_plan',
          name: 'SURVEY_CONTOURS.DWG',
          format: 'AutoCAD Drawing',
          ext: 'DWG',
          sizeBytes: 4613734,
          sizeFormatted: '4.4 MB',
          type: 'CAD_DWG',
          supported: true,
          units: 'Millimetres',
          visible: true,
          locked: true,
          opacity: 0.85,
          dataUrl: null,
          details: {
            layers: 18,
            blocks: 42,
            dimensions: 36,
            lineEntities: 1284
          }
        }
      ]
    };

    this.loadState();
  }

  loadState() {
    try {
      if (typeof sessionStorage === 'undefined') return;
      const saved = sessionStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.project) this.state.project = { ...this.state.project, ...parsed.project };
        if (Array.isArray(parsed.assets)) {
          // Merge preserving demo defaults if empty
          this.state.assets = parsed.assets.length > 0 ? parsed.assets : this.state.assets;
        }
      }
    } catch (e) {
      console.warn('Could not load project state from session storage', e);
    }
  }

  saveState() {
    try {
      if (typeof sessionStorage === 'undefined') {
        this.notify();
        return;
      }
      // Don't persist large dataUrls into sessionStorage to avoid quota exceeded
      const sanitizedAssets = this.state.assets.map(a => {
        if (a.dataUrl && a.dataUrl.length > 500000) {
          return { ...a, dataUrl: null };
        }
        return a;
      });
      sessionStorage.setItem(this.storageKey, JSON.stringify({
        project: this.state.project,
        assets: sanitizedAssets
      }));
    } catch (e) {
      console.warn('Session storage save skipped', e);
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(fn => {
      try { fn(this.state); } catch (e) { console.error('ProjectState listener error', e); }
    });
  }

  // --- Asset Management ---
  getAssets() {
    return [...this.state.assets];
  }

  getAsset(id) {
    return this.state.assets.find(a => a.id === id) || null;
  }

  addAsset(assetData) {
    const asset = {
      id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: assetData.name || 'UNTITLED_FILE',
      format: assetData.format || 'Unknown Format',
      ext: assetData.ext || 'FILE',
      sizeBytes: assetData.sizeBytes || 0,
      sizeFormatted: assetData.sizeFormatted || '0 KB',
      type: assetData.type || 'DOCUMENT',
      supported: assetData.supported !== false,
      units: assetData.units || 'm',
      visible: true,
      locked: false,
      opacity: 1.0,
      dataUrl: assetData.dataUrl || null,
      details: assetData.details || {},
      ...assetData
    };

    this.state.assets.unshift(asset);
    this.saveState();
    return asset;
  }

  removeAsset(id) {
    this.state.assets = this.state.assets.filter(a => a.id !== id);
    this.saveState();
  }

  clearAllAssets() {
    this.state.assets = [];
    this.saveState();
  }

  updateAsset(id, changes) {
    const idx = this.state.assets.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.state.assets[idx] = { ...this.state.assets[idx], ...changes };
      this.saveState();
    }
  }

  toggleAssetVisibility(id) {
    const asset = this.getAsset(id);
    if (asset) {
      this.updateAsset(id, { visible: !asset.visible });
    }
  }

  setAssetOpacity(id, opacity) {
    const val = Math.max(0, Math.min(1, parseFloat(opacity)));
    this.updateAsset(id, { opacity: val });
  }

  // --- Project Settings ---
  getProject() {
    return { ...this.state.project };
  }

  updateProject(changes) {
    this.state.project = { ...this.state.project, ...changes };
    this.saveState();
  }
}

export const ProjectState = new ProjectStateManager();
