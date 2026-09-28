/**
 * GM ARCH TOOLS — 3D Site Analysis Viewport Engine
 * Author: Guru Murthy (GM)
 * Central architectural 3D environment with Three.js & OrbitControls:
 *   - Clean architectural drafting grid & CAD axes
 *   - True North 3D gizmo
 *   - Site boundary perimeter
 *   - Camera presets: TOP, FRONT, RIGHT, LEFT, BACK, ISOMETRIC, PERSPECTIVE, RESET, FIT
 *   - Responsive rendering & smooth camera interpolation
 */

import { MassingController } from './massing-controller.js';
import { ModeOverlays } from './mode-overlays.js';

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

    // Layers & Subsystems
    this.gridHelper = null;
    this.axisHelper = null;
    this.boundaryLine = null;
    this.massing = null;
    this.overlays = null;

    // Layer Visibilities
    this.layers = {
      building: true,
      grid: true,
      north: true,
      context: true,
      overlay: true
    };

    // Camera Presets
    this.defaultCamPos = new THREE.Vector3(38, 32, 48);
    this.defaultTarget = new THREE.Vector3(0, 4, 0);

    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initControls();
    this.initEnvironment();
    this.initSubsystems();

    // Start Rendering Loop
    this.animate = this.animate.bind(this);
    this.isRendering = true;
    requestAnimationFrame(this.animate);

    // Resize Observer
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06090f);
    // Subtle architectural horizon fog
    this.scene.fog = new THREE.FogExp2(0x06090f, 0.008);
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.width / this.height,
      0.5,
      500
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
    this.controls.minDistance = 6;
    this.controls.maxDistance = 220;
    this.controls.target.copy(this.defaultTarget);

    // Sync North Gizmo rotation when orbiting
    this.controls.addEventListener('change', () => this.updateNorthGizmo());
  }

  initEnvironment() {
    // 1. Ambient Lighting (Architectural Neutral)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(ambientLight);

    // Subtle Fill Light from Opposite Side
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
    fillLight.position.set(-30, 20, -30);
    this.scene.add(fillLight);

    // 2. Architectural Ground Grid (10m Major, 2m Minor)
    const gridSize = 100;
    const gridDivisions = 50;
    this.gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x38bdf8, 0x1e293b);
    this.gridHelper.position.y = 0.01;
    this.scene.add(this.gridHelper);

    // 3. Ground Plane for Shadow Catching
    const groundGeom = new THREE.PlaneGeometry(120, 120);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.45 });
    const groundMesh = new THREE.Mesh(groundGeom, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    this.scene.add(groundMesh);

    // 4. Site Boundary Outline (Dashed CAD Polygon, 50m x 40m)
    const bW = 25; // half width (50m)
    const bD = 20; // half depth (40m)
    const boundaryPoints = [
      new THREE.Vector3(-bW, 0.05, -bD),
      new THREE.Vector3(bW, 0.05, -bD),
      new THREE.Vector3(bW, 0.05, bD),
      new THREE.Vector3(-bW, 0.05, bD),
      new THREE.Vector3(-bW, 0.05, -bD)
    ];
    const boundaryGeom = new THREE.BufferGeometry().setFromPoints(boundaryPoints);
    const boundaryMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 2.5,
      gapSize: 1.5,
      linewidth: 2
    });
    this.boundaryLine = new THREE.Line(boundaryGeom, boundaryMat);
    this.boundaryLine.computeLineDistances();
    this.scene.add(this.boundaryLine);

    // 5. Origin Axes (X: Red, Y: Green, Z: Blue)
    this.axisHelper = new THREE.AxesHelper(12);
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
     CAMERA PRESET COMMANDS (Section 9)
     TOP, FRONT, RIGHT, LEFT, BACK, ISOMETRIC, PERSPECTIVE, RESET, FIT
     ============================================================== */
  setCameraPreset(preset) {
    if (!this.controls) return;

    const bounds = this.massing.getBounds();
    const target = bounds.center.clone();
    const d = 55;

    switch (preset) {
      case 'TOP':
        this.animateCameraTo(new THREE.Vector3(target.x, target.y + d, target.z + 0.01), target);
        break;
      case 'FRONT':
        // Looking from South (+Z) towards North (-Z)
        this.animateCameraTo(new THREE.Vector3(target.x, target.y + 10, target.z + d), target);
        break;
      case 'BACK':
        // Looking from North (-Z) towards South (+Z)
        this.animateCameraTo(new THREE.Vector3(target.x, target.y + 10, target.z - d), target);
        break;
      case 'RIGHT':
        // Looking from East (+X)
        this.animateCameraTo(new THREE.Vector3(target.x + d, target.y + 10, target.z), target);
        break;
      case 'LEFT':
        // Looking from West (-X)
        this.animateCameraTo(new THREE.Vector3(target.x - d, target.y + 10, target.z), target);
        break;
      case 'ISOMETRIC':
        // Classic 45° isometric axonometric view
        this.animateCameraTo(new THREE.Vector3(target.x + 40, target.y + 40, target.z + 40), target);
        break;
      case 'PERSPECTIVE':
        // Normal eye-level perspective
        this.animateCameraTo(new THREE.Vector3(target.x + 35, target.y + 14, target.z + 35), target);
        break;
      case 'FIT':
        this.fitModel();
        break;
      case 'RESET':
      default:
        this.animateCameraTo(this.defaultCamPos.clone(), this.defaultTarget.clone());
        break;
    }
  }

  fitModel() {
    const bounds = this.massing.getBounds();
    const target = bounds.center.clone();
    const maxDim = Math.max(bounds.size.x, bounds.size.y, bounds.size.z, 20);
    const distance = maxDim * 2.5;

    const dir = new THREE.Vector3().subVectors(this.camera.position, this.controls.target).normalize();
    const newPos = target.clone().add(dir.multiplyScalar(distance));
    this.animateCameraTo(newPos, target);
  }

  animateCameraTo(targetPos, targetLookAt) {
    if (!this.controls) return;

    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const startTime = performance.now();
    const duration = 500; // ms

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);

      this.camera.position.lerpVectors(startPos, targetPos, ease);
      this.controls.target.lerpVectors(startTarget, targetLookAt, ease);
      this.controls.update();

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }

  updateNorthGizmo() {
    const arrow = document.getElementById('sa-north-arrow');
    if (!arrow) return;

    // Calculate camera horizontal bearing (yaw) relative to North (-Z)
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    // Angle in degrees in X-Z plane
    const angleRad = Math.atan2(dir.x, -dir.z);
    const angleDeg = (angleRad * 180) / Math.PI;

    arrow.style.transform = `rotate(${-angleDeg}deg)`;
  }

  /* ==============================================================
     LAYER TOGGLES (Section 37)
     Building, Grid, North, Context, Analysis Overlay
     ============================================================== */
  setLayerVisibility(layer, isVisible) {
    this.layers[layer] = isVisible;

    if (layer === 'building' && this.massing) {
      this.massing.setVisible(isVisible);
    }
    if (layer === 'grid' && this.gridHelper) {
      this.gridHelper.visible = isVisible;
      this.axisHelper.visible = isVisible;
    }
    if (layer === 'north') {
      const gizmo = document.getElementById('sa-north-gizmo');
      if (gizmo) gizmo.style.display = isVisible ? 'flex' : 'none';
    }
    if (layer === 'context' && this.overlays) {
      const ctxGrp = this.overlays.groups['04'];
      if (ctxGrp) ctxGrp.visible = isVisible;
    }
    if (layer === 'overlay' && this.overlays) {
      this.overlays.setVisible(isVisible);
    }
  }

  handleResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;

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
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
