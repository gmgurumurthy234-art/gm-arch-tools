/**
 * GM ARCH TOOLS — THE DESIGNER: Option State Management
 * Author: Guru Murthy (GM)
 *
 * Implements independent multi-option design state:
 *   - Each Design Option maintains independent 3D masses, footprints, parameters,
 *     setbacks, floor counts, heights, and view state.
 *   - Switching options restores exact state without data loss.
 *   - Supports New Option (+), Duplicate Option, Delete Option, and Rename Option.
 *   - Session/Local storage persistence.
 */

export class DesignerOption {
  constructor(id, name, data = {}) {
    this.id = id || `opt-${Date.now()}`;
    this.name = name || 'OPTION 1';
    this.createdAt = data.createdAt || new Date().toISOString();

    // 3D Masses in this design option
    this.masses = data.masses ? JSON.parse(JSON.stringify(data.masses)) : [];

    // Planning & Regulatory Parameters (User-defined inputs)
    this.parameters = {
      siteArea: data.parameters?.siteArea ?? 2000,
      siteWidth: data.parameters?.siteWidth ?? 50,
      siteLength: data.parameters?.siteLength ?? 40,
      setbacks: {
        front: data.parameters?.setbacks?.front ?? 6.0,
        rear: data.parameters?.setbacks?.rear ?? 3.0,
        left: data.parameters?.setbacks?.left ?? 3.0,
        right: data.parameters?.setbacks?.right ?? 3.0
      },
      fsi: data.parameters?.fsi ?? 2.0,
      far: data.parameters?.far ?? 2.0,
      maxCoverage: data.parameters?.maxCoverage ?? 45, // %
      latitude: data.parameters?.latitude ?? 12.9716,
      longitude: data.parameters?.longitude ?? 77.5946,
      locationName: data.parameters?.locationName ?? 'Custom Architectural Site',
      ...data.parameters
    };

    // Active tool settings when creating new masses
    this.defaultFloors = data.defaultFloors ?? 5;
    this.defaultFloorHeight = data.defaultFloorHeight ?? 3.2;

    // View state
    this.cameraState = data.cameraState || null;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      createdAt: this.createdAt,
      masses: this.masses,
      parameters: this.parameters,
      defaultFloors: this.defaultFloors,
      defaultFloorHeight: this.defaultFloorHeight,
      cameraState: this.cameraState
    };
  }
}

export class DesignerOptionManager {
  constructor(options = {}) {
    this.storageKey = 'gm_designer_project_state_v1';
    this.options = [];
    this.activeOptionId = null;
    this.listeners = new Set();
    this.historyStack = [];
    this.redoStack = [];
    this.maxHistory = 30;

    this.onOptionChanged = options.onOptionChanged || null;

    this.loadState();
    if (this.options.length === 0) {
      this.initDefaultOption();
    }
  }

  createSampleMass() {
    return {
      id: 'mass-default-01',
      name: 'Tower Block A',
      type: 'RECTANGLE',
      width: 20,
      length: 30,
      floors: 5,
      floorHeight: 3.2,
      position: { x: 0, y: 0, z: -1.5 },
      rotation: 0,
      color: '#38bdf8'
    };
  }

  initDefaultOption() {
    const defaultOption = new DesignerOption('opt-1', 'OPTION 1', {
      masses: [this.createSampleMass()],
      parameters: {
        siteArea: 2000,
        siteWidth: 50,
        siteLength: 40,
        setbacks: { front: 6.0, rear: 3.0, left: 3.0, right: 3.0 },
        fsi: 2.0,
        far: 2.0,
        maxCoverage: 45,
        latitude: 12.9716,
        longitude: 77.5946,
        locationName: 'Design Site 01'
      },
      defaultFloors: 5,
      defaultFloorHeight: 3.2
    });

    this.options = [defaultOption];
    this.activeOptionId = defaultOption.id;
    this.saveState();
  }

  getActiveOption() {
    const found = this.options.find(o => o.id === this.activeOptionId);
    return found || this.options[0] || null;
  }

  getAllOptions() {
    return [...this.options];
  }

  createOption(customName) {
    this.snapshot();
    const count = this.options.length + 1;
    const name = customName || `OPTION ${count}`;
    const id = `opt-${Date.now()}`;

    // New option starts with a clean canvas (empty masses) and inherits base site parameters
    const current = this.getActiveOption();
    const baseParams = current ? JSON.parse(JSON.stringify(current.parameters)) : {};

    const newOption = new DesignerOption(id, name, {
      masses: [],
      parameters: baseParams,
      defaultFloors: current ? current.defaultFloors : 5,
      defaultFloorHeight: current ? current.defaultFloorHeight : 3.2
    });

    this.options.push(newOption);
    this.activeOptionId = newOption.id;
    this.saveState();
    this.notify('OPTION_CREATED', newOption);
    return newOption;
  }

  duplicateOption(sourceId) {
    this.snapshot();
    const source = this.options.find(o => o.id === (sourceId || this.activeOptionId));
    if (!source) return null;

    const count = this.options.length + 1;
    const newName = `${source.name} (COPY)`;
    const newId = `opt-${Date.now()}`;

    const duplicated = new DesignerOption(newId, newName, {
      masses: source.masses,
      parameters: source.parameters,
      defaultFloors: source.defaultFloors,
      defaultFloorHeight: source.defaultFloorHeight,
      cameraState: source.cameraState
    });

    this.options.push(duplicated);
    this.activeOptionId = duplicated.id;
    this.saveState();
    this.notify('OPTION_DUPLICATED', duplicated);
    return duplicated;
  }

  deleteOption(targetId) {
    if (this.options.length <= 1) {
      console.warn('Cannot delete the only remaining design option.');
      return false;
    }

    this.snapshot();
    const idToDelete = targetId || this.activeOptionId;
    const index = this.options.findIndex(o => o.id === idToDelete);
    if (index === -1) return false;

    this.options.splice(index, 1);

    if (this.activeOptionId === idToDelete) {
      const nextActive = this.options[Math.max(0, index - 1)];
      this.activeOptionId = nextActive.id;
    }

    this.saveState();
    this.notify('OPTION_DELETED', { deletedId: idToDelete, newActiveId: this.activeOptionId });
    return true;
  }

  renameOption(id, newName) {
    if (!newName || !newName.trim()) return false;
    const target = this.options.find(o => o.id === id);
    if (!target) return false;

    this.snapshot();
    target.name = newName.trim();
    this.saveState();
    this.notify('OPTION_RENAMED', target);
    return true;
  }

  switchOption(targetId) {
    if (this.activeOptionId === targetId) return false;
    const target = this.options.find(o => o.id === targetId);
    if (!target) return false;

    this.activeOptionId = target.id;
    this.saveState();
    this.notify('OPTION_SWITCHED', target);
    return true;
  }

  // --- Massing Manipulation Inside Active Option ---
  addMassToActive(massData) {
    this.snapshot();
    const active = this.getActiveOption();
    if (!active) return null;

    const massId = massData.id || `mass-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newMass = {
      id: massId,
      name: massData.name || `Mass ${active.masses.length + 1}`,
      type: massData.type || 'RECTANGLE', // 'RECTANGLE' | 'POLYLINE' | 'CIRCLE' | 'POLYGON'
      points: massData.points || [], // Local 2D points on ground plane
      width: massData.width ?? 20,
      length: massData.length ?? 30,
      radius: massData.radius ?? 15,
      sides: massData.sides ?? 6,
      floors: massData.floors ?? active.defaultFloors,
      floorHeight: massData.floorHeight ?? active.defaultFloorHeight,
      position: massData.position || { x: 0, y: 0, z: 0 },
      rotation: massData.rotation ?? 0,
      color: massData.color || '#38bdf8'
    };

    active.masses.push(newMass);
    this.saveState();
    this.notify('MASS_ADDED', newMass);
    return newMass;
  }

  updateMass(massId, updates) {
    this.snapshot();
    const active = this.getActiveOption();
    if (!active) return null;

    const mass = active.masses.find(m => m.id === massId);
    if (!mass) return null;

    Object.assign(mass, updates);
    this.saveState();
    this.notify('MASS_UPDATED', mass);
    return mass;
  }

  removeMass(massId) {
    this.snapshot();
    const active = this.getActiveOption();
    if (!active) return false;

    const idx = active.masses.findIndex(m => m.id === massId);
    if (idx === -1) return false;

    const removed = active.masses.splice(idx, 1)[0];
    this.saveState();
    this.notify('MASS_REMOVED', removed);
    return true;
  }

  duplicateMass(massId) {
    this.snapshot();
    const active = this.getActiveOption();
    if (!active) return null;

    const mass = active.masses.find(m => m.id === massId);
    if (!mass) return null;

    const copy = JSON.parse(JSON.stringify(mass));
    copy.id = `mass-${Date.now()}`;
    copy.name = `${mass.name} (Copy)`;
    // Offset slightly so it doesn't overlap identically
    copy.position.x += 5;
    copy.position.z += 5;

    active.masses.push(copy);
    this.saveState();
    this.notify('MASS_ADDED', copy);
    return copy;
  }

  updateActiveParameters(updates) {
    const active = this.getActiveOption();
    if (!active) return null;

    if (updates.setbacks) {
      active.parameters.setbacks = { ...active.parameters.setbacks, ...updates.setbacks };
      delete updates.setbacks;
    }
    Object.assign(active.parameters, updates);
    this.saveState();
    this.notify('PARAMETERS_UPDATED', active.parameters);
    return active.parameters;
  }

  // --- Undo / Redo System ---
  snapshot() {
    try {
      const stateCopy = JSON.stringify({
        options: this.options.map(o => o.toJSON()),
        activeOptionId: this.activeOptionId
      });
      this.historyStack.push(stateCopy);
      if (this.historyStack.length > this.maxHistory) {
        this.historyStack.shift();
      }
      this.redoStack = []; // Clear redo branch on new action
    } catch (e) {
      console.warn('Could not record snapshot', e);
    }
  }

  undo() {
    if (this.historyStack.length === 0) return false;

    // Save current to redo
    const currentState = JSON.stringify({
      options: this.options.map(o => o.toJSON()),
      activeOptionId: this.activeOptionId
    });
    this.redoStack.push(currentState);

    const previous = JSON.parse(this.historyStack.pop());
    this.options = previous.options.map(o => new DesignerOption(o.id, o.name, o));
    this.activeOptionId = previous.activeOptionId;
    this.saveState();
    this.notify('HISTORY_RESTORED', this.getActiveOption());
    return true;
  }

  redo() {
    if (this.redoStack.length === 0) return false;

    const currentState = JSON.stringify({
      options: this.options.map(o => o.toJSON()),
      activeOptionId: this.activeOptionId
    });
    this.historyStack.push(currentState);

    const next = JSON.parse(this.redoStack.pop());
    this.options = next.options.map(o => new DesignerOption(o.id, o.name, o));
    this.activeOptionId = next.activeOptionId;
    this.saveState();
    this.notify('HISTORY_RESTORED', this.getActiveOption());
    return true;
  }

  // --- Storage Persistence ---
  loadState() {
    try {
      if (typeof localStorage === 'undefined') return;
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.options && Array.isArray(parsed.options) && parsed.options.length > 0) {
          this.options = parsed.options.map(o => new DesignerOption(o.id, o.name, o));
          this.activeOptionId = parsed.activeOptionId || this.options[0].id;
        }
      }
      // If user had previous empty state, seed default mass
      if (this.options.length > 0 && this.options[0].masses.length === 0) {
        this.options[0].masses = [this.createSampleMass()];
      }
    } catch (e) {
      console.warn('Could not restore Designer options from storage', e);
    }
  }

  saveState() {
    try {
      if (typeof localStorage === 'undefined') return;
      const payload = {
        options: this.options.map(o => o.toJSON()),
        activeOptionId: this.activeOptionId,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(payload));
    } catch (e) {
      console.warn('Could not persist Designer options', e);
    }
  }

  // --- Reactive Subscriptions ---
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify(eventType, payload) {
    this.listeners.forEach(fn => {
      try {
        fn(eventType, payload, this.getActiveOption());
      } catch (err) {
        console.error('DesignerOptionManager listener error:', err);
      }
    });
  }
}
