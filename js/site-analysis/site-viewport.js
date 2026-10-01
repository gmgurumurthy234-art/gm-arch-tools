/**
 * GM ARCH TOOLS — 3D Site Analysis Viewport Engine (Iteration 02)
 * Author: Guru Murthy (GM)
 * Central architectural 3D environment with Three.js & OrbitControls:
 *   - Zero Fog Washout: Crystal-clear, high-contrast drafting linework at any zoom distance
 *   - High Performance: Active RAF loop pausing when navigating outside Site Analysis
 *   - Camera Presets: FIT_SITE, FIT_BUILDING, TOP, NORTH, SOUTH, EAST, WEST, ISO, PERSP, RESET
 *   - Interactive 3D Measurement Tool: Raycasting ground & massing with live dimension HUD
 *   - Master Layer Control & Opacity passthroughs to Massing and Analysis Overlays
 *   - Dynamic True North Gyro Compass Gizmo
 */

import { MassingController } from './massing-controller.js';
import { ModeOverlays } from './mode-overlays.js';
import { SiteState, formatArea } from '../state/site-state.js';

export class SiteViewport {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);
    if (!this.container) return;

    // Viewport Dimensions
    this.width = this.container.clientWidth || 800;
    this.height = this.container.clientHeight || 600;

    // Core Three.js Components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.clock = new THREE.Clock();

    // Measurement Tool State
    this.isMeasureMode = false;
    this.measurePoints = [];
    this.measureGroup = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Layers & Subsystems
    this.gridHelper = null;
    this.axisHelper = null;
    this.boundaryLine = null;
    this.boundaryGroup = null;
    this.groundMesh = null;
    this.massing = null;
    this.overlays = null;

    // Layer Visibilities & Opacities
    this.layers = {
      building: { visible: true, opacity: 0.85 },
      grid: { visible: true, opacity: 0.8 },
      north: { visible: true, opacity: 1.0 },
      site: { visible: true, opacity: 0.9 },
      wind: { visible: true, opacity: 0.85 },
      sun: { visible: true, opacity: 0.9 },
      terrain: { visible: true, opacity: 0.75 },
      shadows: { visible: true, opacity: 0.45 },
      context: { visible: true, opacity: 0.4 },
      vegetation: { visible: true, opacity: 0.9 },
      roads: { visible: true, opacity: 0.9 },
      utilities: { visible: true, opacity: 0.9 },
      graphics: { visible: true, opacity: 0.85 }
    };

    // Camera Presets
    this.defaultCamPos = new THREE.Vector3(38, 30, 46);
    this.defaultTarget = new THREE.Vector3(0, 4, 0);

    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initControls();
    this.initEnvironment();
    this.initSubsystems();
    this.initMeasureTool();

    // Start Rendering Loop
    this.animate = this.animate.bind(this);
    this.isRendering = true;
    requestAnimationFrame(this.animate);

    // Resize Observer
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);
  }

  /* ==============================================================
     SCENE INITIALIZATION (FOG COMPLETELY REMOVED FOR MAXIMUM CLARITY)
     ============================================================== */
  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06090f);
    // Explicitly NO FOG: Prevents any washout or fading when zooming out in large architectural views
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.width / this.height,
      0.5,
      1200
    );
    this.camera.position.copy(this.defaultCamPos);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.id = 'sa-three-canvas';
    this.container.appendChild(this.renderer.domElement);
  }

  initControls() {
    if (typeof THREE.OrbitControls === 'undefined') {
      console.warn('OrbitControls not yet loaded on window.THREE');
      return;
    }
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.02; // Allow slightly below horizon
    this.controls.minDistance = 4;
    this.controls.maxDistance = 500;
    this.controls.target.copy(this.defaultTarget);

    // Sync North Gizmo rotation when orbiting
    this.controls.addEventListener('change', () => this.updateNorthGizmo());
  }

  initEnvironment() {
    // 1. Ambient Lighting (Architectural Neutral)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    // Subtle Fill Light
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.45);
    fillLight.position.set(-35, 25, -35);
    this.scene.add(fillLight);

    // 2. Architectural Ground Grid (10m Major, 2m Minor)
    const gridSize = 120;
    const gridDivisions = 60;
    this.gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x38bdf8, 0x1e293b);
    this.gridHelper.position.y = 0.01;
    this.gridHelper.material.transparent = true;
    this.gridHelper.material.opacity = 0.8;
    this.scene.add(this.gridHelper);

    // 3. Ground Plane for Shadow Catching & Measurement Raycasting
    const groundGeom = new THREE.PlaneGeometry(160, 160);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.45 });
    this.groundMesh = new THREE.Mesh(groundGeom, groundMat);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.receiveShadow = true;
    this.groundMesh.name = 'GroundPlane';
    this.scene.add(this.groundMesh);

    // 4. Dynamic Site Boundary (Imported from Map Engine or Default)
    this.renderImportedBoundary(SiteState.getActiveSite());
    this.unsubscribeSite = SiteState.subscribe(site => {
      this.renderImportedBoundary(site);
    });

    // 5. Origin Axes (X: Red, Y: Green, Z: Blue)
    this.axisHelper = new THREE.AxesHelper(14);
    this.axisHelper.position.set(0, 0.05, 0);
    this.scene.add(this.axisHelper);
  }

  initSubsystems() {
    // Conceptual Building Mass
    this.massing = new MassingController(this.scene);

    // 10 Analytical Overlays
    this.overlays = new ModeOverlays(this.scene, this.massing);
  }

  /* ==============================================================
     INTERACTIVE 3D MEASUREMENT TOOL
     ============================================================== */
  initMeasureTool() {
    this.measureGroup = new THREE.Group();
    this.measureGroup.name = 'MeasurementToolGroup';
    this.scene.add(this.measureGroup);

    // Click handler on renderer domElement
    this.renderer.domElement.addEventListener('click', (e) => {
      if (!this.isMeasureMode) return;
      this.handleMeasureClick(e);
    });
  }

  setMeasureMode(active) {
    this.isMeasureMode = active;
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.style.cursor = active ? 'crosshair' : 'grab';
    }
    const hud = document.getElementById('sa-measure-hud');
    if (hud) hud.style.display = active ? 'flex' : 'none';

    if (!active) {
      this.clearMeasurement();
    }
  }

  handleMeasureClick(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects([this.groundMesh, this.massing.mesh].filter(Boolean), true);

    if (intersects.length > 0) {
      const pt = intersects[0].point.clone();
      pt.y += 0.05; // Slightly above surface
      this.measurePoints.push(pt);

      this.renderMeasurementGraphics();

      if (this.measurePoints.length >= 2) {
        // Distance calculated
        const p1 = this.measurePoints[0];
        const p2 = this.measurePoints[1];
        const dist = p1.distanceTo(p2);

        const valEl = document.getElementById('sa-measure-dist-val');
        if (valEl) valEl.textContent = `${dist.toFixed(2)} m`;

        // Reset for next pair on subsequent clicks
        this.measurePoints = [];
      }
    }
  }

  renderMeasurementGraphics() {
    // Clear old visual markers
    while (this.measureGroup.children.length > 0) {
      const obj = this.measureGroup.children[0];
      this.measureGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
    }

    if (this.measurePoints.length === 1) {
      // First point marker
      const markerGeom = new THREE.SphereGeometry(0.35, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
      const marker = new THREE.Mesh(markerGeom, markerMat);
      marker.position.copy(this.measurePoints[0]);
      this.measureGroup.add(marker);
    } else if (this.measurePoints.length >= 2) {
      const p1 = this.measurePoints[0];
      const p2 = this.measurePoints[1];

      // End sphere markers
      [p1, p2].forEach(p => {
        const markerGeom = new THREE.SphereGeometry(0.35, 16, 16);
        const markerMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
        const marker = new THREE.Mesh(markerGeom, markerMat);
        marker.position.copy(p);
        this.measureGroup.add(marker);
      });

      // Connecting Dimension Line
      const lineGeom = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const lineMat = new THREE.LineDashedMaterial({
        color: 0x00f2fe,
        dashSize: 0.8,
        gapSize: 0.4,
        linewidth: 2
      });
      const dimLine = new THREE.Line(lineGeom, lineMat);
      dimLine.computeLineDistances();
      this.measureGroup.add(dimLine);
    }
  }

  clearMeasurement() {
    this.measurePoints = [];
    while (this.measureGroup.children.length > 0) {
      const obj = this.measureGroup.children[0];
      this.measureGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
    }
    const valEl = document.getElementById('sa-measure-dist-val');
    if (valEl) valEl.textContent = '0.00 m';
  }

  /* ==============================================================
     CAMERA PRESET COMMANDS
     FIT_SITE, FIT_BUILDING, TOP, NORTH, SOUTH, EAST, WEST, ISO, PERSP, RESET
     ============================================================== */
  setCameraPreset(preset) {
    if (!this.controls) return;

    const bounds = this.massing.getBounds();
    const target = bounds.center.clone();
    const d = 52;

    switch (preset) {
      case 'TOP':
        // Plan view looking straight down from +Y
        this.animateCameraTo(new THREE.Vector3(target.x, target.y + 70, target.z + 0.001), new THREE.Vector3(target.x, 0, target.z));
        break;

      case 'NORTH':
      case 'FRONT':
        // View looking towards North (-Z), camera at South (+Z)
        this.animateCameraTo(new THREE.Vector3(target.x, target.y + 14, target.z + d), target);
        break;

      case 'SOUTH':
      case 'BACK':
        // View looking towards South (+Z), camera at North (-Z)
        this.animateCameraTo(new THREE.Vector3(target.x, target.y + 14, target.z - d), target);
        break;

      case 'EAST':
      case 'LEFT':
        // View looking towards East (+X), camera at West (-X)
        this.animateCameraTo(new THREE.Vector3(target.x - d, target.y + 14, target.z), target);
        break;

      case 'WEST':
      case 'RIGHT':
        // View looking towards West (-X), camera at East (+X)
        this.animateCameraTo(new THREE.Vector3(target.x + d, target.y + 14, target.z), target);
        break;

      case 'ISO':
      case 'ISOMETRIC':
        // Classic 45° isometric axonometric view
        this.animateCameraTo(new THREE.Vector3(target.x + 38, target.y + 36, target.z + 38), target);
        break;

      case 'PERSP':
      case 'PERSPECTIVE':
        // Eye-level architectural perspective
        this.animateCameraTo(new THREE.Vector3(target.x + 32, target.y + 12, target.z + 32), target);
        break;

      case 'FIT_BUILDING':
        // Tightly zoom and center on building massing
        {
          const maxDim = Math.max(bounds.size.x, bounds.size.y, bounds.size.z, 15);
          const distance = maxDim * 2.2;
          const dir = new THREE.Vector3().subVectors(this.camera.position, this.controls.target).normalize();
          if (dir.lengthSq() < 0.001) dir.set(1, 0.8, 1).normalize();
          const newPos = target.clone().add(dir.multiplyScalar(distance));
          this.animateCameraTo(newPos, target);
        }
        break;

      case 'FIT_SITE':
      case 'FIT':
        // Frame entire site boundary
        this.animateCameraTo(new THREE.Vector3(0, 36, 56), new THREE.Vector3(0, 2, 0));
        break;

      case 'RESET':
      default:
        this.animateCameraTo(this.defaultCamPos.clone(), this.defaultTarget.clone());
        break;
    }
  }

  animateCameraTo(targetPos, targetLookAt) {
    if (!this.controls) return;

    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const startTime = performance.now();
    const duration = 450; // Smooth 450ms interpolation

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);

      this.camera.position.lerpVectors(startPos, targetPos, ease);
      this.controls.target.lerpVectors(startTarget, targetLookAt, ease);
      this.controls.update();
      this.updateNorthGizmo();

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }

  updateNorthGizmo() {
    const arrow = document.getElementById('sa-north-arrow');
    if (!arrow) return;

    // Calculate camera yaw relative to North (-Z)
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    const angleRad = Math.atan2(dir.x, -dir.z);
    const angleDeg = (angleRad * 180) / Math.PI;

    arrow.style.transform = `rotate(${-angleDeg}deg)`;
  }

  /* ==============================================================
     DYNAMIC SITE BOUNDARY & ACTIVE SITE HUD (ITERATION 06)
     ============================================================== */
  renderImportedBoundary(siteData) {
    if (!siteData) siteData = SiteState.getActiveSite();

    // Dispose old boundary objects
    if (this.boundaryGroup) {
      this.scene.remove(this.boundaryGroup);
      this.boundaryGroup.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
      this.boundaryGroup = null;
    }

    this.boundaryGroup = new THREE.Group();
    this.boundaryGroup.name = 'SiteBoundaryGroup';

    let points3D = [];
    if (siteData.boundary3D && siteData.boundary3D.length >= 3) {
      // Normalization scale for architectural viewport if user selected an immense parcel
      const maxDist = Math.max(...siteData.boundary3D.map(p => Math.sqrt(p.x * p.x + p.z * p.z)));
      let scale = 1.0;
      if (maxDist > 140) {
        scale = 80 / maxDist;
      }

      points3D = siteData.boundary3D.map(p => new THREE.Vector3(p.x * scale, 0.05, p.z * scale));
    } else {
      // Default 50m x 40m rectangular boundary
      const bW = 25;
      const bD = 20;
      points3D = [
        new THREE.Vector3(-bW, 0.05, -bD),
        new THREE.Vector3(bW, 0.05, -bD),
        new THREE.Vector3(bW, 0.05, bD),
        new THREE.Vector3(-bW, 0.05, bD)
      ];
    }

    // 1. Closed Outline Line
    const closedPoints = [...points3D, points3D[0]];
    const boundaryGeom = new THREE.BufferGeometry().setFromPoints(closedPoints);
    const boundaryMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 2.0,
      gapSize: 1.2,
      linewidth: 2.5,
      transparent: true,
      opacity: this.layers.site.opacity
    });
    this.boundaryLine = new THREE.Line(boundaryGeom, boundaryMat);
    this.boundaryLine.computeLineDistances();
    this.boundaryLine.name = 'SiteBoundaryLine';
    this.boundaryGroup.add(this.boundaryLine);

    // 2. Glowing Corner Vertices
    const vGeom = new THREE.SphereGeometry(0.4, 14, 14);
    const vMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: this.layers.site.opacity
    });
    points3D.forEach(pt => {
      const vDot = new THREE.Mesh(vGeom, vMat);
      vDot.position.copy(pt);
      this.boundaryGroup.add(vDot);
    });

    // 3. Subtle Translucent Ground Footprint Fill
    if (points3D.length >= 3) {
      try {
        const shape = new THREE.Shape();
        shape.moveTo(points3D[0].x, points3D[0].z);
        for (let i = 1; i < points3D.length; i++) {
          shape.lineTo(points3D[i].x, points3D[i].z);
        }
        shape.closePath();
        const fillGeom = new THREE.ShapeGeometry(shape);
        const fillMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.07 * this.layers.site.opacity,
          side: THREE.DoubleSide
        });
        const fillMesh = new THREE.Mesh(fillGeom, fillMat);
        fillMesh.rotation.x = Math.PI / 2;
        fillMesh.position.y = 0.02;
        this.boundaryGroup.add(fillMesh);
      } catch (e) {
        // Fallback for self-intersecting polygon
      }
    }

    this.scene.add(this.boundaryGroup);
    this.updateActiveSiteHUD(siteData);
  }

  updateActiveSiteHUD(siteData) {
    if (!siteData) siteData = SiteState.getActiveSite();
    const hud = document.getElementById('sa-active-site-hud');
    if (!hud) return;

    const nameEl = document.getElementById('sa-ash-location-name');
    const coordsEl = document.getElementById('sa-ash-coords');
    const areaEl = document.getElementById('sa-ash-area');
    const boundEl = document.getElementById('sa-ash-boundary');

    if (nameEl) nameEl.textContent = siteData.locationName || 'Active Site';
    if (coordsEl) {
      const lat = siteData.latitude || 13.0827;
      const lng = siteData.longitude || 80.2707;
      coordsEl.textContent = `${lat.toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}, ${lng.toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`;
    }
    if (areaEl) {
      const fmt = formatArea(siteData.areaSqMeters || 2000);
      areaEl.textContent = `Area: ${fmt.sqMeters} (${fmt.acres})`;
    }
    if (boundEl) {
      if (siteData.boundaryType === 'RECTANGLE' && siteData.dimensions) {
        boundEl.textContent = `Boundary: ${siteData.dimensions.widthMetres}m × ${siteData.dimensions.lengthMetres}m`;
      } else if (siteData.boundary3D) {
        boundEl.textContent = `Boundary: Custom (${siteData.boundary3D.length} Vertices)`;
      } else {
        boundEl.textContent = 'Boundary: Defined';
      }
    }

    hud.style.display = 'flex';
  }

  /* ==============================================================
     MASTER LAYER CONTROL & TRANSPARENCY
     ============================================================== */
  setLayerVisibility(layer, isVisible) {
    if (this.layers[layer]) {
      this.layers[layer].visible = isVisible;
    }

    if (layer === 'building' && this.massing) {
      this.massing.setVisible(isVisible);
    }
    if (layer === 'grid' && this.gridHelper) {
      this.gridHelper.visible = isVisible;
      if (this.axisHelper) this.axisHelper.visible = isVisible;
    }
    if (layer === 'north') {
      const gizmo = document.getElementById('sa-north-gizmo');
      if (gizmo) gizmo.style.display = isVisible ? 'flex' : 'none';
    }
    if (layer === 'site') {
      if (this.boundaryGroup) this.boundaryGroup.visible = isVisible;
      if (this.boundaryLine) this.boundaryLine.visible = isVisible;
    }
    if (layer === 'shadows' && this.groundMesh) {
      this.groundMesh.visible = isVisible;
    }
    if (this.overlays) {
      this.overlays.setLayerVisibility(layer, isVisible);
    }
  }

  setLayerOpacity(layer, opacityVal) {
    const op = Math.max(0, Math.min(1, parseFloat(opacityVal)));
    if (this.layers[layer]) {
      this.layers[layer].opacity = op;
    }

    if (layer === 'building' && this.massing) {
      this.massing.setOpacity(op);
    }
    if (layer === 'grid' && this.gridHelper) {
      this.gridHelper.material.opacity = op;
    }
    if (layer === 'site') {
      if (this.boundaryLine && this.boundaryLine.material) {
        this.boundaryLine.material.opacity = op;
      }
      if (this.boundaryGroup) {
        this.boundaryGroup.traverse(c => {
          if (c.isMesh && c.material) {
            c.material.opacity = 0.07 * op;
          }
        });
      }
    }
    if (layer === 'shadows' && this.groundMesh) {
      this.groundMesh.material.opacity = 0.45 * op;
    }
    if (this.overlays) {
      this.overlays.setLayerOpacity(layer, op);
    }
  }

  toggleGrid() {
    const current = this.layers.grid.visible;
    this.setLayerVisibility('grid', !current);
    return !current;
  }

  toggleNorth() {
    const current = this.layers.north.visible;
    this.setLayerVisibility('north', !current);
    return !current;
  }

  /* ==============================================================
     LIFECYCLE & PERFORMANCE MANAGEMENT
     ============================================================== */
  pause() {
    this.isRendering = false;
  }

  resume() {
    if (this.isRendering) return;
    this.isRendering = true;
    this.clock.getDelta(); // flush accumulated delta
    requestAnimationFrame(this.animate);
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

  animate() {
    if (!this.isRendering) return;
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();

    if (this.controls) {
      this.controls.update();
    }

    if (this.overlays) {
      this.overlays.update(delta);
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.isRendering = false;
    if (this.unsubscribeSite) {
      this.unsubscribeSite();
      this.unsubscribeSite = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
