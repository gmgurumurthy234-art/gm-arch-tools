/**
 * GM ARCH TOOLS — THE DESIGNER: Interactive 3D Architectural Viewport
 * Author: Guru Murthy (GM)
 *
 * Implements:
 *   - High-performance Three.js 3D viewport with OrbitControls.
 *   - Fog-free technical architectural visualization with clean dark background.
 *   - Dynamic architectural modelling grid with major/minor lines, origin crosshairs, and axes.
 *   - Interactive ground plane raycasting for drawing tools:
 *       * Rectangle (Corner 1 -> Drag -> Corner 2)
 *       * Polyline (Point-by-point drawing -> Close shape)
 *       * Circle (Center -> Radius)
 *       * Polygon (Center -> Regular N-gon)
 *       * Measure (Point-to-point 3D dimensioning)
 *   - Object Selection & live bounding box highlight.
 *   - Camera Presets: FIT, TOP, FRONT, SIDE, ISO, PERSP, RESET.
 *   - Layers visibility toggles (Site, Setbacks, Massing, Measurements, Grid, Axes).
 *   - Clean pause/resume lifecycle to prevent background GPU/CPU drain.
 */

import { createMass3DObject, createSetbackVisualizer3D } from './designer-massing.js';

export class DesignerViewport {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.onSelectMass = options.onSelectMass || null;
    this.onDrawingCompleted = options.onDrawingCompleted || null;
    this.onMeasureCompleted = options.onMeasureCompleted || null;

    // Viewport dimensions
    this.width = this.container.clientWidth || 800;
    this.height = this.container.clientHeight || 600;

    // Three.js Core
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.animFrameId = null;
    this.isPaused = false;

    // Raycasting & Interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.planeIntersection = new THREE.Vector3();

    // Scene Groups
    this.gridGroup = new THREE.Group();
    this.axesHelper = null;
    this.siteGroup = new THREE.Group();
    this.massesGroup = new THREE.Group();
    this.drawingGroup = new THREE.Group();
    this.measureGroup = new THREE.Group();

    // Active Tool & Drawing States
    this.currentTool = 'SELECT'; // 'SELECT' | 'RECTANGLE' | 'POLYLINE' | 'CIRCLE' | 'POLYGON' | 'MEASURE'
    this.snapToGrid = true;
    this.gridSnapSize = 1.0; // 1m architectural snap
    this.selectedMassId = null;

    // Drawing transient data
    this.isDrawing = false;
    this.rectStart = null;
    this.polylinePoints = [];
    this.circleCenter = null;
    this.polygonCenter = null;
    this.polygonSides = 6;
    this.measureStart = null;

    // Layer Visibilities
    this.layers = {
      grid: true,
      axes: true,
      site: true,
      setbacks: true,
      massing: true,
      measurements: true
    };

    // Camera preset defaults
    this.defaultCamPos = new THREE.Vector3(45, 35, 45);
    this.defaultTarget = new THREE.Vector3(0, 5, 0);

    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initControls();
    this.initLighting();
    this.initGridAndAxes();
    this.bindEvents();

    this.animate = this.animate.bind(this);
    this.animate();
  }

  /* ==============================================================
     01. INITIALIZATION & SETUP
     ============================================================== */
  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06090f);

    this.scene.add(this.gridGroup);
    this.scene.add(this.siteGroup);
    this.scene.add(this.massesGroup);
    this.scene.add(this.drawingGroup);
    this.scene.add(this.measureGroup);
  }

  initCamera() {
    const aspect = this.width / this.height;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.5, 1500);
    this.camera.position.copy(this.defaultCamPos);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    // Clear any previous canvas
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);
  }

  initControls() {
    if (typeof THREE.OrbitControls === 'undefined') {
      console.warn('OrbitControls is not loaded.');
      return;
    }
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.target.copy(this.defaultTarget);
    this.controls.maxPolarAngle = Math.PI / 2 + 0.05; // Do not go below ground
    this.controls.minDistance = 3;
    this.controls.maxDistance = 600;
  }

  initLighting() {
    // Ambient light: Soft cool blue tone
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.2);
    this.scene.add(ambientLight);

    // Directional Sunlight: Simulates natural architectural lighting
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.6);
    this.sunLight.position.set(60, 90, 45);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 300;
    const d = 70;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // Subtle cyan fill light from opposite angle
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.5);
    fillLight.position.set(-50, 40, -50);
    this.scene.add(fillLight);
  }

  initGridAndAxes() {
    // 1. Dual architectural grid: Minor (1m, faint) + Major (10m, crisp)
    const gridSize = 120;
    const minorDivisions = 120; // 1m per cell
    const minorGrid = new THREE.GridHelper(gridSize, minorDivisions, 0x1e293b, 0x0f172a);
    minorGrid.position.y = -0.01;
    this.gridGroup.add(minorGrid);

    const majorDivisions = 12; // 10m per major cell
    const majorGrid = new THREE.GridHelper(gridSize, majorDivisions, 0x38bdf8, 0x1e293b);
    majorGrid.position.y = 0;
    this.gridGroup.add(majorGrid);

    // 2. Axes Helper: X (Red), Y (Green), Z (Blue)
    this.axesHelper = new THREE.AxesHelper(15);
    this.axesHelper.position.set(0, 0.05, 0);
    this.gridGroup.add(this.axesHelper);

    // 3. Origin Indicator (Crosshair dot)
    const originGeo = new THREE.RingGeometry(0.4, 0.6, 32);
    originGeo.rotateX(-Math.PI / 2);
    const originMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const originRing = new THREE.Mesh(originGeo, originMat);
    originRing.position.y = 0.02;
    this.gridGroup.add(originRing);
  }

  /* ==============================================================
     02. SCENE DATA RENDERING (MASSES & SITE)
     ============================================================== */
  renderOption(option, selectedMassId = null) {
    if (!option) return;
    this.selectedMassId = selectedMassId;

    // 1. Clear existing masses
    while (this.massesGroup.children.length > 0) {
      const child = this.massesGroup.children[0];
      this.massesGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
        else child.material.dispose();
      }
    }

    // 2. Clear and render Site Boundary & Setbacks
    while (this.siteGroup.children.length > 0) {
      const child = this.siteGroup.children[0];
      this.siteGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
    }

    if (option.parameters) {
      const setbackVisualizer = createSetbackVisualizer3D(option.parameters);
      if (setbackVisualizer) {
        this.siteGroup.add(setbackVisualizer);
      }
    }

    // 3. Render Masses
    const masses = option.masses || [];
    masses.forEach(mass => {
      const isSelected = mass.id === this.selectedMassId;
      const massObj = createMass3DObject(mass, isSelected);
      if (massObj) {
        this.massesGroup.add(massObj);
      }
    });

    // 4. Update guidance visibility based on mass count
    this.updateFirstTimeGuidance(masses.length === 0);
  }

  updateFirstTimeGuidance(show) {
    const banner = document.getElementById('designer-guidance-banner');
    if (banner) {
      banner.style.display = show ? 'flex' : 'none';
    }
  }

  /* ==============================================================
     03. INTERACTIVE MODELLING & DRAFTING (GROUND RAYCASTING)
     ============================================================== */
  setTool(toolName) {
    this.currentTool = toolName;
    this.cancelDrawing();

    // Disable orbit controls while drafting to prevent accidental camera rotation
    const isDraftingTool = ['RECTANGLE', 'POLYLINE', 'CIRCLE', 'POLYGON', 'MEASURE'].includes(toolName);
    if (this.controls) {
      this.controls.enableRotate = !isDraftingTool;
    }

    // Update cursor
    if (this.container) {
      this.container.style.cursor = isDraftingTool ? 'crosshair' : 'default';
    }
  }

  cancelDrawing() {
    this.isDrawing = false;
    this.rectStart = null;
    this.polylinePoints = [];
    this.circleCenter = null;
    this.polygonCenter = null;
    this.measureStart = null;
    this.clearDrawingGroup();
    if (this.controls) this.controls.enableRotate = true;
  }

  clearDrawingGroup() {
    while (this.drawingGroup.children.length > 0) {
      const c = this.drawingGroup.children[0];
      this.drawingGroup.remove(c);
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
    }
  }

  getGroundIntersection(event) {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hit = this.raycaster.ray.intersectPlane(this.groundPlane, this.planeIntersection);
    if (!hit) return null;

    let pt = this.planeIntersection.clone();
    if (this.snapToGrid) {
      pt.x = Math.round(pt.x / this.gridSnapSize) * this.gridSnapSize;
      pt.z = Math.round(pt.z / this.gridSnapSize) * this.gridSnapSize;
    }
    pt.y = 0;
    return pt;
  }

  handlePointerDown(e) {
    if (e.button !== 0) return; // Left click only
    const pt = this.getGroundIntersection(e);
    if (!pt) return;

    if (this.currentTool === 'SELECT') {
      this.handleSelectRaycast(e);
      return;
    }

    if (this.currentTool === 'RECTANGLE') {
      if (!this.isDrawing) {
        this.isDrawing = true;
        this.rectStart = pt;
      } else {
        // Finalize rectangle
        const p1 = this.rectStart;
        const p2 = pt;
        const width = Math.abs(p2.x - p1.x);
        const length = Math.abs(p2.z - p1.z);

        if (width >= 2 && length >= 2) {
          const centerX = (p1.x + p2.x) / 2;
          const centerZ = (p1.z + p2.z) / 2;

          if (this.onDrawingCompleted) {
            this.onDrawingCompleted({
              type: 'RECTANGLE',
              width: Math.round(width),
              length: Math.round(length),
              position: { x: centerX, y: 0, z: centerZ }
            });
          }
        }
        this.cancelDrawing();
      }
      return;
    }

    if (this.currentTool === 'POLYLINE') {
      if (!this.isDrawing) {
        this.isDrawing = true;
        this.polylinePoints = [pt];
      } else {
        const firstPt = this.polylinePoints[0];
        const distToStart = pt.distanceTo(firstPt);

        // Click near start point (< 2m snap) closes the shape
        if (this.polylinePoints.length >= 3 && distToStart < 2.5) {
          this.finalizePolyline();
        } else {
          this.polylinePoints.push(pt);
          this.updatePolylinePreview(pt);
        }
      }
      return;
    }

    if (this.currentTool === 'CIRCLE') {
      if (!this.isDrawing) {
        this.isDrawing = true;
        this.circleCenter = pt;
      } else {
        const radius = pt.distanceTo(this.circleCenter);
        if (radius >= 2) {
          if (this.onDrawingCompleted) {
            this.onDrawingCompleted({
              type: 'CIRCLE',
              radius: Math.round(radius * 10) / 10,
              position: { x: this.circleCenter.x, y: 0, z: this.circleCenter.z }
            });
          }
        }
        this.cancelDrawing();
      }
      return;
    }

    if (this.currentTool === 'POLYGON') {
      if (!this.isDrawing) {
        this.isDrawing = true;
        this.polygonCenter = pt;
      } else {
        const radius = pt.distanceTo(this.polygonCenter);
        if (radius >= 2) {
          if (this.onDrawingCompleted) {
            this.onDrawingCompleted({
              type: 'POLYGON',
              radius: Math.round(radius * 10) / 10,
              sides: this.polygonSides,
              position: { x: this.polygonCenter.x, y: 0, z: this.polygonCenter.z }
            });
          }
        }
        this.cancelDrawing();
      }
      return;
    }

    if (this.currentTool === 'MEASURE') {
      if (!this.isDrawing) {
        this.isDrawing = true;
        this.measureStart = pt;
      } else {
        const dist = this.measureStart.distanceTo(pt);
        this.createPersistentMeasure(this.measureStart, pt, dist);
        if (this.onMeasureCompleted) {
          this.onMeasureCompleted(dist);
        }
        this.cancelDrawing();
      }
      return;
    }
  }

  handlePointerMove(e) {
    if (!this.isDrawing) return;
    const pt = this.getGroundIntersection(e);
    if (!pt) return;

    if (this.currentTool === 'RECTANGLE' && this.rectStart) {
      this.updateRectanglePreview(this.rectStart, pt);
    } else if (this.currentTool === 'POLYLINE' && this.polylinePoints.length > 0) {
      this.updatePolylinePreview(pt);
    } else if (this.currentTool === 'CIRCLE' && this.circleCenter) {
      this.updateCirclePreview(this.circleCenter, pt);
    } else if (this.currentTool === 'POLYGON' && this.polygonCenter) {
      this.updatePolygonPreview(this.polygonCenter, pt);
    } else if (this.currentTool === 'MEASURE' && this.measureStart) {
      this.updateMeasurePreview(this.measureStart, pt);
    }
  }

  finalizePolyline() {
    if (this.polylinePoints.length < 3) return;

    // Convert absolute points to local points relative to polygon centroid
    let sumX = 0, sumZ = 0;
    this.polylinePoints.forEach(p => { sumX += p.x; sumZ += p.z; });
    const centroidX = sumX / this.polylinePoints.length;
    const centroidZ = sumZ / this.polylinePoints.length;

    const localPoints = this.polylinePoints.map(p => ({
      x: p.x - centroidX,
      z: p.z - centroidZ
    }));

    if (this.onDrawingCompleted) {
      this.onDrawingCompleted({
        type: 'POLYLINE',
        points: localPoints,
        position: { x: centroidX, y: 0, z: centroidZ }
      });
    }
    this.cancelDrawing();
  }

  // --- Dynamic Previews ---
  updateRectanglePreview(p1, p2) {
    this.clearDrawingGroup();
    const w = Math.abs(p2.x - p1.x);
    const l = Math.abs(p2.z - p1.z);
    if (w < 0.5 || l < 0.5) return;

    const minX = Math.min(p1.x, p2.x);
    const maxX = Math.max(p1.x, p2.x);
    const minZ = Math.min(p1.z, p2.z);
    const maxZ = Math.max(p1.z, p2.z);

    const pts = [
      new THREE.Vector3(minX, 0.08, minZ),
      new THREE.Vector3(maxX, 0.08, minZ),
      new THREE.Vector3(maxX, 0.08, maxZ),
      new THREE.Vector3(minX, 0.08, maxZ),
      new THREE.Vector3(minX, 0.08, minZ)
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: 0x00f2fe, linewidth: 2 });
    const line = new THREE.Line(geo, mat);
    this.drawingGroup.add(line);

    // Translucent footprint fill
    const planeGeo = new THREE.PlaneGeometry(w, l);
    planeGeo.rotateX(-Math.PI / 2);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide
    });
    const fill = new THREE.Mesh(planeGeo, planeMat);
    fill.position.set((minX + maxX) / 2, 0.06, (minZ + maxZ) / 2);
    this.drawingGroup.add(fill);
  }

  updatePolylinePreview(currentHoverPt) {
    this.clearDrawingGroup();
    if (this.polylinePoints.length === 0) return;

    const pts = [...this.polylinePoints, currentHoverPt];
    const geo = new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(p.x, 0.08, p.z)));
    const mat = new THREE.LineBasicMaterial({ color: 0x00f2fe, linewidth: 2 });
    const line = new THREE.Line(geo, mat);
    this.drawingGroup.add(line);

    // Draw vertex point rings
    this.polylinePoints.forEach((p, idx) => {
      const ringGeo = new THREE.RingGeometry(0.3, 0.5, 16);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? 0x10b981 : 0x38bdf8,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(p.x, 0.1, p.z);
      this.drawingGroup.add(ring);
    });
  }

  updateCirclePreview(center, edgePt) {
    this.clearDrawingGroup();
    const r = center.distanceTo(edgePt);
    if (r < 0.5) return;

    const ringPts = [];
    for (let i = 0; i <= 36; i++) {
      const theta = (i / 36) * Math.PI * 2;
      ringPts.push(new THREE.Vector3(center.x + Math.cos(theta) * r, 0.08, center.z + Math.sin(theta) * r));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(ringPts);
    const mat = new THREE.LineBasicMaterial({ color: 0x00f2fe, linewidth: 2 });
    this.drawingGroup.add(new THREE.Line(geo, mat));

    const diskGeo = new THREE.CircleGeometry(r, 36);
    diskGeo.rotateX(-Math.PI / 2);
    const diskMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide
    });
    const disk = new THREE.Mesh(diskGeo, diskMat);
    disk.position.set(center.x, 0.06, center.z);
    this.drawingGroup.add(disk);
  }

  updatePolygonPreview(center, edgePt) {
    this.clearDrawingGroup();
    const r = center.distanceTo(edgePt);
    if (r < 0.5) return;
    const n = this.polygonSides;

    const pts = [];
    for (let i = 0; i <= n; i++) {
      const theta = (i / n) * Math.PI * 2;
      pts.push(new THREE.Vector3(center.x + Math.cos(theta) * r, 0.08, center.z + Math.sin(theta) * r));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: 0x00f2fe, linewidth: 2 });
    this.drawingGroup.add(new THREE.Line(geo, mat));
  }

  updateMeasurePreview(p1, p2) {
    this.clearDrawingGroup();
    const pts = [
      new THREE.Vector3(p1.x, 0.1, p1.z),
      new THREE.Vector3(p2.x, 0.1, p2.z)
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineDashedMaterial({ color: 0xf59e0b, dashSize: 1, gapSize: 0.5 });
    const line = new THREE.Line(geo, mat);
    line.computeLineDistances();
    this.drawingGroup.add(line);
  }

  createPersistentMeasure(p1, p2, dist) {
    const pts = [
      new THREE.Vector3(p1.x, 0.1, p1.z),
      new THREE.Vector3(p2.x, 0.1, p2.z)
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2 });
    const line = new THREE.Line(geo, mat);
    this.measureGroup.add(line);

    // End ticks
    const tickGeo1 = new THREE.BoxGeometry(0.6, 0.1, 0.6);
    const tickMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const tick1 = new THREE.Mesh(tickGeo1, tickMat);
    tick1.position.set(p1.x, 0.1, p1.z);
    this.measureGroup.add(tick1);

    const tick2 = new THREE.Mesh(tickGeo1, tickMat);
    tick2.position.set(p2.x, 0.1, p2.z);
    this.measureGroup.add(tick2);
  }

  clearMeasurements() {
    while (this.measureGroup.children.length > 0) {
      const c = this.measureGroup.children[0];
      this.measureGroup.remove(c);
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
    }
  }

  // --- Raycast Selection ---
  handleSelectRaycast(event) {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.massesGroup.children, true);

    if (intersects.length > 0) {
      let current = intersects[0].object;
      while (current && current.parent && current.parent !== this.massesGroup) {
        current = current.parent;
      }
      if (current && current.userData && current.userData.massId) {
        const massId = current.userData.massId;
        this.selectedMassId = massId;
        if (this.onSelectMass) this.onSelectMass(massId);
        return;
      }
    }

    // Deselect if clicking on ground
    this.selectedMassId = null;
    if (this.onSelectMass) this.onSelectMass(null);
  }

  /* ==============================================================
     04. CAMERA PRESETS & VIEWPORT CONTROLS
     ============================================================== */
  setCameraPreset(preset) {
    if (!this.camera || !this.controls) return;

    const target = this.controls.target || new THREE.Vector3(0, 0, 0);

    switch (preset) {
      case 'FIT': {
        const box = new THREE.Box3().setFromObject(this.massesGroup.children.length > 0 ? this.massesGroup : this.siteGroup);
        if (box.isEmpty()) {
          this.camera.position.set(45, 35, 45);
          this.controls.target.set(0, 5, 0);
        } else {
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z, 25);
          this.camera.position.set(center.x + maxDim * 1.3, center.y + maxDim * 1.1, center.z + maxDim * 1.3);
          this.controls.target.copy(center);
        }
        break;
      }
      case 'TOP':
        this.camera.position.set(target.x, target.y + 90, target.z + 0.0001);
        break;
      case 'FRONT':
        this.camera.position.set(target.x, target.y + 15, target.z + 75);
        break;
      case 'SIDE':
        this.camera.position.set(target.x + 75, target.y + 15, target.z);
        break;
      case 'ISO':
        this.camera.position.set(target.x + 50, target.y + 40, target.z + 50);
        break;
      case 'PERSP':
        this.camera.position.copy(this.defaultCamPos);
        this.controls.target.copy(this.defaultTarget);
        break;
      case 'RESET':
        this.camera.position.copy(this.defaultCamPos);
        this.controls.target.copy(this.defaultTarget);
        break;
    }

    this.controls.update();
  }

  // --- Layer Controls ---
  setGridVisible(visible) {
    this.layers.grid = visible;
    this.gridGroup.visible = visible;
  }

  setAxesVisible(visible) {
    this.layers.axes = visible;
    if (this.axesHelper) this.axesHelper.visible = visible;
  }

  setLayerVisible(layerKey, visible) {
    this.layers[layerKey] = visible;
    if (layerKey === 'site' || layerKey === 'setbacks') {
      this.siteGroup.visible = this.layers.site;
    } else if (layerKey === 'massing') {
      this.massesGroup.visible = visible;
    } else if (layerKey === 'measurements') {
      this.measureGroup.visible = visible;
    } else if (layerKey === 'grid') {
      this.setGridVisible(visible);
    } else if (layerKey === 'axes') {
      this.setAxesVisible(visible);
    }
  }

  /* ==============================================================
     05. LIFECYCLE & EVENT HANDLING
     ============================================================== */
  bindEvents() {
    this.onPointerDownBound = (e) => this.handlePointerDown(e);
    this.onPointerMoveBound = (e) => this.handlePointerMove(e);
    this.onResizeBound = () => this.handleResize();
    this.onKeyDownBound = (e) => {
      if (e.key === 'Escape') {
        this.cancelDrawing();
      } else if (e.key === 'Enter') {
        if (this.currentTool === 'POLYLINE' && this.isDrawing) {
          this.finalizePolyline();
        }
      }
    };

    this.container.addEventListener('pointerdown', this.onPointerDownBound);
    window.addEventListener('pointermove', this.onPointerMoveBound);
    window.addEventListener('resize', this.onResizeBound);
    window.addEventListener('keydown', this.onKeyDownBound);
  }

  handleResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    if (this.width === 0 || this.height === 0) return;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  pause() {
    this.isPaused = true;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.handleResize();
    this.animate();
  }

  animate() {
    if (this.isPaused) return;
    this.animFrameId = requestAnimationFrame(this.animate);

    if (this.controls) {
      this.controls.update();
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  destroy() {
    this.pause();
    this.container.removeEventListener('pointerdown', this.onPointerDownBound);
    window.removeEventListener('pointermove', this.onPointerMoveBound);
    window.removeEventListener('resize', this.onResizeBound);
    window.removeEventListener('keydown', this.onKeyDownBound);

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }
}
