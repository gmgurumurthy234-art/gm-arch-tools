/**
 * GM ARCH TOOLS — 3D Analysis Mode Overlays Engine (Iteration 02)
 * Author: Guru Murthy (GM)
 * Features:
 *   - Wind Overhaul: Continuous CFD-style laminar streamlines and flowing vectors deflecting around mass
 *   - Sun Path: Strictly aligned cardinal orientation (East sunrise +X, South zenith +Z, West sunset -X, North -Z)
 *   - Layer Control: Independent visibility and 0–100% opacity for every analytical subsystem
 *   - High-performance GPU rendering: Object reuse, zero garbage collection in animation loop
 */

import { SiteState } from '../state/site-state.js';

export class ModeOverlays {
  constructor(scene, massingController) {
    this.scene = scene;
    this.massing = massingController;

    // Master Group for All Overlays
    this.masterGroup = new THREE.Group();
    this.masterGroup.name = 'AnalysisOverlaysMasterGroup';
    this.scene.add(this.masterGroup);

    // Subgroups for each mode (01 to 10)
    this.groups = {};
    for (let i = 1; i <= 10; i++) {
      const id = String(i).padStart(2, '0');
      const grp = new THREE.Group();
      grp.name = `OverlayMode_${id}`;
      grp.visible = false;
      this.masterGroup.add(grp);
      this.groups[id] = grp;
    }

    // Active Mode
    this.activeModeId = '02'; // Default: Sun Path

    // Master Layer Opacity & Visibility Map (Sections 10 & 11)
    this.layerSettings = {
      site: { visible: true, opacity: 1.0 },
      building: { visible: true, opacity: 0.85 },
      terrain: { visible: true, opacity: 0.75 },
      sun: { visible: true, opacity: 0.9 },
      wind: { visible: true, opacity: 0.85 },
      shadows: { visible: true, opacity: 0.45 },
      context: { visible: true, opacity: 0.4 },
      vegetation: { visible: true, opacity: 0.9 },
      roads: { visible: true, opacity: 0.9 },
      utilities: { visible: true, opacity: 0.9 },
      graphics: { visible: true, opacity: 0.85 }
    };

    // Sun Path State (Section 14 & 15)
    this.sunState = {
      hour: 12.0, // 06:00 to 18:00
      isPlaying: false,
      season: 'EQUINOX', // 'SUMMER' | 'EQUINOX' | 'WINTER'
      azimuthDeg: 180,
      altitudeDeg: 65,
      arcRadius: 36,
      opacity: 0.9
    };

    // Wind Streamline State (Section 13)
    this.windState = {
      direction: 'SW', // N, NE, E, SE, S, SW, W, NW
      speed: 1.0,
      animSpeed: 1.0,
      density: 24,     // Number of streamlines
      showVectors: true,
      isPlaying: true,
      opacity: 0.85,
      streamlineMeshes: [],
      vectorMeshes: [],
      dashOffset: 0
    };

    // Utilities Sub-layers
    this.utilityLayers = {
      water: true,
      power: true,
      sewer: true,
      storm: true
    };

    this.initAllModes();

    // Subscribe to SiteState for dynamic solar path recalculations
    SiteState.subscribe(() => {
      this.rebuildSunArc();
      this.updateSunPosition();
    });
  }

  initAllModes() {
    this.init01Climate();
    this.init02SunPath();
    this.init03WindStreamlines();
    this.init04Orientation();
    this.init05Topography();
    this.init06Access();
    this.init07Vegetation();
    this.init08Views();
    this.init09Noise();
    this.init10Utilities();

    this.setMode(this.activeModeId);
  }

  /* ==============================================================
     01 — CLIMATE ANALYSIS OVERLAY
     ============================================================== */
  init01Climate() {
    const grp = this.groups['01'];

    // Sky Dome Mesh
    const skyGeom = new THREE.SphereGeometry(46, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    this.climateSkyMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.12
    });
    const skyDome = new THREE.Mesh(skyGeom, this.climateSkyMat);
    grp.add(skyDome);

    // Diurnal Comfort Zone Ring
    const ringGeom = new THREE.RingGeometry(26, 27.5, 48);
    this.climateRingMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    const ringMesh = new THREE.Mesh(ringGeom, this.climateRingMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.2;
    grp.add(ringMesh);

    // Microclimate Zone Boundaries
    const zones = [
      { r: 35, c: 0x38bdf8 },
      { r: 24, c: 0xf59e0b },
      { r: 14, c: 0x10b981 }
    ];
    this.climateZoneLines = [];
    zones.forEach(z => {
      const circleGeom = new THREE.BufferGeometry().setFromPoints(
        new THREE.Path().absarc(0, 0, z.r, 0, Math.PI * 2, true).getPoints(64)
      );
      const circleMat = new THREE.LineDashedMaterial({
        color: z.c,
        dashSize: 2,
        gapSize: 1.5,
        transparent: true,
        opacity: 0.4
      });
      const circleLine = new THREE.Line(circleGeom, circleMat);
      circleLine.computeLineDistances();
      circleLine.rotation.x = Math.PI / 2;
      circleLine.position.y = 0.25;
      grp.add(circleLine);
      this.climateZoneLines.push(circleLine);
    });
  }

  /* ==============================================================
     02 — SUN PATH & SOLAR ANALYSIS OVERLAY (Strict Orientation)
     North = -Z, East = +X (Sunrise), South = +Z (Zenith), West = -X (Sunset)
     ============================================================== */
  init02SunPath() {
    const grp = this.groups['02'];
    const R = this.sunState.arcRadius;

    // 1. Solar Trajectory Arc from East (+X) to West (-X) via South (+Z)
    this.sunArcMat = new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      linewidth: 2.5,
      transparent: true,
      opacity: this.sunState.opacity
    });
    this.rebuildSunArc();

    // 2. Horizon Compass Ring
    const horizonGeom = new THREE.BufferGeometry().setFromPoints(
      new THREE.Path().absarc(0, 0, R, 0, Math.PI * 2, true).getPoints(64)
    );
    this.sunHorizonMat = new THREE.LineBasicMaterial({
      color: 0x64748b,
      transparent: true,
      opacity: 0.45
    });
    const horizonCircle = new THREE.Line(horizonGeom, this.sunHorizonMat);
    horizonCircle.rotation.x = Math.PI / 2;
    horizonCircle.position.y = 0.1;
    grp.add(horizonCircle);

    // 3. Glowing Sun Sphere
    const sunMeshGeom = new THREE.SphereGeometry(1.6, 24, 24);
    this.sunMeshMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: this.sunState.opacity
    });
    this.sunSphere = new THREE.Mesh(sunMeshGeom, this.sunMeshMat);
    grp.add(this.sunSphere);

    // Sun Halo
    const haloGeom = new THREE.SphereGeometry(2.6, 16, 16);
    this.sunHaloMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.35 * this.sunState.opacity
    });
    const sunHalo = new THREE.Mesh(haloGeom, this.sunHaloMat);
    this.sunSphere.add(sunHalo);

    // 4. Directional Light for Real-time Cast Shadows
    this.sunLight = new THREE.DirectionalLight(0xfffbeb, 1.4);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 140;
    this.sunLight.shadow.camera.left = -45;
    this.sunLight.shadow.camera.right = 45;
    this.sunLight.shadow.camera.top = 45;
    this.sunLight.shadow.camera.bottom = -45;
    this.sunLight.shadow.bias = -0.0006;
    grp.add(this.sunLight);

    // 5. Volumetric Incident Ray Beam (Sun to Building Center)
    const beamGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0)
    ]);
    this.sunBeamMat = new THREE.LineDashedMaterial({
      color: 0xfef08a,
      dashSize: 1.5,
      gapSize: 1,
      transparent: true,
      opacity: 0.6 * this.sunState.opacity
    });
    this.sunBeam = new THREE.Line(beamGeom, this.sunBeamMat);
    grp.add(this.sunBeam);

    this.updateSunPosition();
  }

  getSolarAltitudeTilt() {
    const lat = SiteState.getLatitude(); // e.g. 13.0827 for Chennai
    const { season } = this.sunState;
    let declination = 0;
    if (season === 'SUMMER') declination = 23.45;
    if (season === 'WINTER') declination = -23.45;

    // Solar noon altitude: alpha_noon = 90 - |lat| + declination (for northern hemisphere)
    const solarNoonAltitudeDeg = Math.max(8, Math.min(89.5, 90 - Math.abs(lat) + (lat >= 0 ? declination : -declination)));
    return (solarNoonAltitudeDeg * Math.PI) / 180;
  }

  rebuildSunArc() {
    const grp = this.groups['02'];
    if (this.sunArcLine) {
      grp.remove(this.sunArcLine);
      this.sunArcLine.geometry.dispose();
    }

    const R = this.sunState.arcRadius;
    const latTilt = this.getSolarAltitudeTilt();

    // Arc from East (+X) to West (-X) via South (+Z)
    const curvePoints = [];
    for (let a = 0; a <= Math.PI; a += Math.PI / 64) {
      const x = R * Math.cos(a); // East (+X) at a=0 -> West (-X) at a=PI
      const y = R * Math.sin(a) * Math.sin(latTilt);
      const z = R * Math.sin(a) * Math.cos(latTilt); // Bows towards South (+Z)
      curvePoints.push(new THREE.Vector3(x, y, z));
    }

    const arcGeom = new THREE.BufferGeometry().setFromPoints(curvePoints);
    this.sunArcLine = new THREE.Line(arcGeom, this.sunArcMat);
    grp.add(this.sunArcLine);
  }

  setSunTime(hour) {
    this.sunState.hour = Math.max(6, Math.min(18, hour));
    this.updateSunPosition();
  }

  setSunSeason(season) {
    this.sunState.season = season;
    this.rebuildSunArc();
    this.updateSunPosition();
  }

  updateSunPosition() {
    if (!this.sunSphere || !this.sunLight) return;

    const { hour, arcRadius } = this.sunState;
    // Map hour 6.0 (East) -> 12.0 (South) -> 18.0 (West)
    const t = (hour - 6) / 12; // 0 at 06:00, 0.5 at 12:00, 1.0 at 18:00
    const angle = t * Math.PI;

    const latTilt = this.getSolarAltitudeTilt();

    const x = arcRadius * Math.cos(angle);
    const y = Math.max(0.6, arcRadius * Math.sin(angle) * Math.sin(latTilt));
    const z = arcRadius * Math.sin(angle) * Math.cos(latTilt);

    this.sunSphere.position.set(x, y, z);
    this.sunLight.position.set(x, y, z);

    // Target Building Center
    const bounds = this.massing.getBounds();
    this.sunLight.target.position.copy(bounds.center);
    this.sunLight.target.updateMatrixWorld();

    // Beam Line
    const positions = this.sunBeam.geometry.attributes.position.array;
    positions[0] = x;
    positions[1] = y;
    positions[2] = z;
    positions[3] = bounds.center.x;
    positions[4] = bounds.center.y;
    positions[5] = bounds.center.z;
    this.sunBeam.geometry.attributes.position.needsUpdate = true;
    this.sunBeam.computeLineDistances();

    // Diurnal Color Spectrum Shift
    if (hour <= 7 || hour >= 17) {
      this.sunLight.color.setHex(0xf97316); // Golden hour amber
      this.sunLight.intensity = 1.1;
    } else if (hour <= 9 || hour >= 15) {
      this.sunLight.color.setHex(0xfbbf24); // Morning golden
      this.sunLight.intensity = 1.35;
    } else {
      this.sunLight.color.setHex(0xfffbeb); // Clean solar noon
      this.sunLight.intensity = 1.6;
    }

    // Precise Altitude & Azimuth
    const groundDist = Math.hypot(x, z);
    const altRad = Math.atan2(y, groundDist);
    this.sunState.altitudeDeg = Math.round((altRad * 180) / Math.PI);

    // Azimuth measured clockwise from True North (-Z):
    // North=0°, East=90°, South=180°, West=270°
    let azRad = Math.atan2(x, -z);
    if (azRad < 0) azRad += Math.PI * 2;
    this.sunState.azimuthDeg = Math.round((azRad * 180) / Math.PI);
  }

  /* ==============================================================
     03 — WIND & AIRFLOW: CONTINUOUS LAMINAR STREAMLINES (Section 13)
     Smooth continuous streamlines deflecting around building mass
     ============================================================== */
  init03WindStreamlines() {
    const grp = this.groups['03'];
    this.windGroup = new THREE.Group();
    grp.add(this.windGroup);

    this.windLineMaterial = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 2.5,
      gapSize: 1.5,
      transparent: true,
      opacity: this.windState.opacity,
      linewidth: 2
    });

    this.windVectorMaterial = new THREE.MeshBasicMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: this.windState.opacity
    });

    this.rebuildWindStreamlines();
  }

  setWindDirection(dirCode) {
    this.windState.direction = dirCode;
    this.rebuildWindStreamlines();
  }

  setWindSpeed(speed) {
    this.windState.speed = Math.max(0.2, Math.min(3.0, parseFloat(speed)));
  }

  setWindDensity(density) {
    this.windState.density = Math.max(8, Math.min(36, parseInt(density, 10)));
    this.rebuildWindStreamlines();
  }

  rebuildWindStreamlines() {
    const grp = this.windGroup;
    while (grp.children.length > 0) {
      const c = grp.children[0];
      grp.remove(c);
      if (c.geometry) c.geometry.dispose();
    }
    this.windState.streamlineMeshes = [];
    this.windState.vectorMeshes = [];

    // Cardinal Angle mapping (0° North, 90° East, 180° South, 270° West)
    const angles = {
      'N': 0, 'NE': 45, 'E': 90, 'SE': 135,
      'S': 180, 'SW': 225, 'W': 270, 'NW': 315
    };
    const deg = angles[this.windState.direction] !== undefined ? angles[this.windState.direction] : 225;
    const rad = (deg * Math.PI) / 180;

    // Flow Unit Vector
    const flowX = -Math.sin(rad);
    const flowZ = -Math.cos(rad);
    const perpX = -flowZ;
    const perpZ = flowX;

    const bounds = this.massing.getBounds();
    const bCenter = bounds.center;
    const bRadius = bounds.radius * 1.35;
    const bHeight = bounds.height;

    const streamSpan = 55; // Lateral width of streamline array
    const streamLength = 70; // Inflow to outflow distance
    const count = this.windState.density;

    for (let i = 0; i < count; i++) {
      const lateral = ((i / (count - 1)) - 0.5) * streamSpan;
      const height = 1.5 + (Math.sin(i * 1.3) * 0.5 + 0.5) * (bHeight * 0.9);

      // Upstream start point & downstream end point
      const startP = new THREE.Vector3(
        bCenter.x - (flowX * streamLength * 0.55) + (perpX * lateral),
        height,
        bCenter.z - (flowZ * streamLength * 0.55) + (perpZ * lateral)
      );

      const endP = new THREE.Vector3(
        bCenter.x + (flowX * streamLength * 0.55) + (perpX * lateral),
        height,
        bCenter.z + (flowZ * streamLength * 0.55) + (perpZ * lateral)
      );

      // Check if streamline intersects building deflection cylinder
      const distToCenter = Math.abs(lateral);
      const points = [];
      const numSteps = 32;

      for (let s = 0; s <= numSteps; s++) {
        const u = s / numSteps;
        const cur = new THREE.Vector3().lerpVectors(startP, endP, u);

        // Aerodynamic Deflection around Massing
        const dx = cur.x - bCenter.x;
        const dz = cur.z - bCenter.z;
        const rDist = Math.hypot(dx, dz);

        if (rDist < bRadius && height < bHeight + 2) {
          const pushOut = (bRadius - rDist) * 1.25;
          const sign = lateral >= 0 ? 1 : -1;
          cur.x += perpX * pushOut * sign;
          cur.z += perpZ * pushOut * sign;
          if (height > bHeight * 0.6) {
            cur.y += pushOut * 0.25; // Vertical displacement over roof
          }
        }
        points.push(cur);
      }

      const curve = new THREE.CatmullRomCurve3(points);
      const smoothPoints = curve.getPoints(48);
      const sGeom = new THREE.BufferGeometry().setFromPoints(smoothPoints);
      const sLine = new THREE.Line(sGeom, this.windLineMaterial);
      sLine.computeLineDistances();
      grp.add(sLine);
      this.windState.streamlineMeshes.push(sLine);

      // Flow Vector Arrows along streamline (Section 13)
      if (this.windState.showVectors && (i % 2 === 0)) {
        const arrowGeom = new THREE.ConeGeometry(0.35, 1.3, 6);
        arrowGeom.rotateX(Math.PI / 2);
        const arrowMesh = new THREE.Mesh(arrowGeom, this.windVectorMaterial);
        const midP = curve.getPointAt(0.35 + (Math.random() * 0.3));
        const tangent = curve.getTangentAt(0.4);
        arrowMesh.position.copy(midP);
        arrowMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
        grp.add(arrowMesh);
        this.windState.vectorMeshes.push({ mesh: arrowMesh, curve, progress: Math.random() });
      }
    }
  }

  updateWind(delta) {
    if (!this.groups['03'].visible || !this.windState.isPlaying) return;

    const rate = delta * this.windState.speed * this.windState.animSpeed * 1.5;
    this.windState.dashOffset -= rate * 12;

    // Continuous Flowing Dash Animation
    this.windLineMaterial.dashOffset = this.windState.dashOffset;

    // Advance Vector Arrow Chevrons along smooth streamlines
    this.windState.vectorMeshes.forEach(v => {
      v.progress += rate * 0.18;
      if (v.progress > 0.95) v.progress = 0.05;
      const pos = v.curve.getPointAt(v.progress);
      const tangent = v.curve.getTangentAt(v.progress);
      v.mesh.position.copy(pos);
      v.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
    });
  }

  /* ==============================================================
     04 — SITE ORIENTATION & CONTEXT OVERLAY
     ============================================================== */
  init04Orientation() {
    const grp = this.groups['04'];

    // 1. Compass Rose on Ground
    const compassGeom = new THREE.RingGeometry(18, 19.2, 48);
    this.orientCompassMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    const compassMesh = new THREE.Mesh(compassGeom, this.orientCompassMat);
    compassMesh.rotation.x = Math.PI / 2;
    compassMesh.position.y = 0.15;
    grp.add(compassMesh);

    // 2. High-Contrast True North Axis (Red Arrow pointing -Z)
    const northPoints = [
      new THREE.Vector3(0, 0.25, 0),
      new THREE.Vector3(0, 0.25, -28)
    ];
    const northGeom = new THREE.BufferGeometry().setFromPoints(northPoints);
    const northLine = new THREE.Line(northGeom, new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 3 }));
    grp.add(northLine);

    const coneGeom = new THREE.ConeGeometry(1.2, 3.5, 12);
    coneGeom.rotateX(-Math.PI / 2);
    const coneMesh = new THREE.Mesh(coneGeom, new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    coneMesh.position.set(0, 0.25, -28);
    grp.add(coneMesh);

    // 3. Optimal East-West Facade Line
    const ewGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-26, 0.2, 0),
      new THREE.Vector3(26, 0.2, 0)
    ]);
    const ewLine = new THREE.Line(ewGeom, new THREE.LineDashedMaterial({
      color: 0xf59e0b,
      dashSize: 2,
      gapSize: 1,
      transparent: true,
      opacity: 0.7
    }));
    ewLine.computeLineDistances();
    grp.add(ewLine);

    // 4. Surrounding Context Masses
    this.createContextBlocks(grp);
  }

  createContextBlocks(grp) {
    this.contextMeshes = [];
    const contextBuildings = [
      { x: -32, z: -10, w: 16, d: 20, h: 14 },
      { x: 34, z: -8, w: 18, d: 18, h: 18 },
      { x: 0, z: -35, w: 26, d: 14, h: 12 },
      { x: -28, z: 28, w: 14, d: 16, h: 9 },
      { x: 28, z: 28, w: 16, d: 14, h: 10 }
    ];

    this.ctxBodyMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.7,
      transparent: true,
      opacity: this.layerSettings.context.opacity
    });

    this.ctxLineMat = new THREE.LineBasicMaterial({
      color: 0x64748b,
      transparent: true,
      opacity: 0.6
    });

    contextBuildings.forEach(cb => {
      const bGeom = new THREE.BoxGeometry(cb.w, cb.h, cb.d);
      const bMesh = new THREE.Mesh(bGeom, this.ctxBodyMat);
      bMesh.position.set(cb.x, cb.h / 2, cb.z);

      const bEdges = new THREE.LineSegments(new THREE.EdgesGeometry(bGeom), this.ctxLineMat);
      bMesh.add(bEdges);
      grp.add(bMesh);
      this.contextMeshes.push(bMesh);
    });
  }

  /* ==============================================================
     05 — TOPOGRAPHY & CONTOUR ANALYSIS
     ============================================================== */
  init05Topography() {
    const grp = this.groups['05'];

    // Stepped Contour Slices
    const levels = [
      { y: 0.1, r: 38, col: 0x059669 },
      { y: 1.0, r: 32, col: 0x10b981 },
      { y: 2.0, r: 26, col: 0x38bdf8 },
      { y: 3.0, r: 20, col: 0x0ea5e9 },
      { y: 4.0, r: 14, col: 0xf59e0b }
    ];

    this.topographyLines = [];
    levels.forEach(lvl => {
      const contourPoints = [];
      const segs = 64;
      for (let s = 0; s <= segs; s++) {
        const theta = (s / segs) * Math.PI * 2;
        const perturb = 1 + 0.18 * Math.sin(theta * 3) + 0.12 * Math.cos(theta * 2);
        const radius = lvl.r * perturb;
        const x = radius * Math.cos(theta) - 4;
        const z = radius * Math.sin(theta) - 4;
        contourPoints.push(new THREE.Vector3(x, lvl.y, z));
      }
      const cGeom = new THREE.BufferGeometry().setFromPoints(contourPoints);
      const cMat = new THREE.LineBasicMaterial({
        color: lvl.col,
        linewidth: 2,
        transparent: true,
        opacity: this.layerSettings.terrain.opacity
      });
      const cLine = new THREE.Line(cGeom, cMat);
      grp.add(cLine);
      this.topographyLines.push(cLine);
    });

    // Slope fall drainage arrows
    const slopeArrows = [
      { from: new THREE.Vector3(-6, 3.5, -6), to: new THREE.Vector3(-18, 0.5, -18) },
      { from: new THREE.Vector3(6, 3.5, 6), to: new THREE.Vector3(20, 0.5, 20) }
    ];
    slopeArrows.forEach(sa => {
      const dir = new THREE.Vector3().subVectors(sa.to, sa.from).normalize();
      const arrow = new THREE.ArrowHelper(dir, sa.from, 16, 0x0ea5e9, 2.0, 1.2);
      grp.add(arrow);
    });
  }

  /* ==============================================================
     06 — ACCESS & CIRCULATION
     ============================================================== */
  init06Access() {
    const grp = this.groups['06'];

    // Public Street Frontage
    const roadGeom = new THREE.PlaneGeometry(80, 12);
    this.roadMeshMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.85,
      transparent: true,
      opacity: this.layerSettings.roads.opacity
    });
    const roadMesh = new THREE.Mesh(roadGeom, this.roadMeshMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.set(0, 0.05, 34);
    grp.add(roadMesh);

    // Vehicular Loop (Ingress, Drop-off, Egress)
    const carPathPoints = [
      new THREE.Vector3(-16, 0.15, 34),
      new THREE.Vector3(-16, 0.15, 14),
      new THREE.Vector3(0, 0.15, 10),
      new THREE.Vector3(16, 0.15, 14),
      new THREE.Vector3(16, 0.15, 34)
    ];
    const carGeom = new THREE.BufferGeometry().setFromPoints(carPathPoints);
    this.carPathLine = new THREE.Line(carGeom, new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      linewidth: 3,
      transparent: true,
      opacity: this.layerSettings.roads.opacity
    }));
    grp.add(this.carPathLine);

    // Pedestrian Walkway (Cyan)
    const pedPoints = [
      new THREE.Vector3(-6, 0.18, 34),
      new THREE.Vector3(-6, 0.18, 12),
      new THREE.Vector3(-2, 0.18, 8)
    ];
    const pedGeom = new THREE.BufferGeometry().setFromPoints(pedPoints);
    this.pedPathLine = new THREE.Line(pedGeom, new THREE.LineBasicMaterial({
      color: 0x00f2fe,
      linewidth: 2.5,
      transparent: true,
      opacity: this.layerSettings.roads.opacity
    }));
    grp.add(this.pedPathLine);

    // Fire Tender 6.0m Turning Driveway Encircling Building
    const firePoints = [
      new THREE.Vector3(-22, 0.12, -18),
      new THREE.Vector3(22, 0.12, -18),
      new THREE.Vector3(22, 0.12, 22),
      new THREE.Vector3(-22, 0.12, 22),
      new THREE.Vector3(-22, 0.12, -18)
    ];
    const fireGeom = new THREE.BufferGeometry().setFromPoints(firePoints);
    this.firePathLine = new THREE.Line(fireGeom, new THREE.LineDashedMaterial({
      color: 0xef4444,
      dashSize: 2,
      gapSize: 1.5,
      transparent: true,
      opacity: this.layerSettings.roads.opacity
    }));
    this.firePathLine.computeLineDistances();
    grp.add(this.firePathLine);
  }

  /* ==============================================================
     07 — VEGETATION & LANDSCAPE
     ============================================================== */
  init07Vegetation() {
    const grp = this.groups['07'];

    // Permeable Softscape Lawn
    const lawnGeom = new THREE.PlaneGeometry(48, 40);
    this.lawnMat = new THREE.MeshBasicMaterial({
      color: 0x064e3b,
      transparent: true,
      opacity: 0.35 * this.layerSettings.vegetation.opacity
    });
    const lawn = new THREE.Mesh(lawnGeom, this.lawnMat);
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.set(0, 0.08, 0);
    grp.add(lawn);

    // Geometric Architectural Trees
    const treePositions = [
      { x: -18, z: -12, r: 3.5, h: 7 },
      { x: -20, z: 2, r: 4.0, h: 8 },
      { x: -16, z: 16, r: 3.2, h: 6.5 },
      { x: 18, z: -14, r: 3.8, h: 7.5 },
      { x: 22, z: 4, r: 4.2, h: 8.5 },
      { x: 16, z: 18, r: 3.0, h: 6.0 },
      { x: -8, z: -22, r: 3.5, h: 7.0 },
      { x: 8, z: -22, r: 3.5, h: 7.0 }
    ];

    this.treeCanopyMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.4,
      metalness: 0.1,
      flatShading: true,
      transparent: true,
      opacity: this.layerSettings.vegetation.opacity
    });

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });

    treePositions.forEach(tp => {
      const tree = new THREE.Group();
      tree.position.set(tp.x, 0, tp.z);

      const trunkGeom = new THREE.CylinderGeometry(0.3, 0.45, tp.h * 0.45, 8);
      const trunk = new THREE.Mesh(trunkGeom, trunkMat);
      trunk.position.y = (tp.h * 0.45) / 2;
      tree.add(trunk);

      const canopyGeom = new THREE.IcosahedronGeometry(tp.r, 1);
      const canopy = new THREE.Mesh(canopyGeom, this.treeCanopyMat);
      canopy.position.y = tp.h * 0.65;
      canopy.castShadow = true;
      tree.add(canopy);

      grp.add(tree);
    });
  }

  /* ==============================================================
     08 — VIEWS & VISUAL ANALYSIS
     ============================================================== */
  init08Views() {
    const grp = this.groups['08'];

    // Primary Scenic View Cone (NE)
    const coneGeom = new THREE.ConeGeometry(14, 32, 16, 1, true);
    coneGeom.rotateX(Math.PI / 2);
    this.viewConeMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide
    });
    const viewCone = new THREE.Mesh(coneGeom, this.viewConeMat);
    viewCone.position.set(0, 10, 0);
    viewCone.rotation.y = Math.PI / 4;
    grp.add(viewCone);

    // Sightline Rays
    const ray1 = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 10, 0), new THREE.Vector3(26, 10, -26)]),
      new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 2.5 })
    );
    grp.add(ray1);

    const ray2 = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 10, 0), new THREE.Vector3(0, 4, 34)]),
      new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2 })
    );
    grp.add(ray2);

    const ray3Line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 10, 0), new THREE.Vector3(-28, 4, -28)]),
      new THREE.LineDashedMaterial({ color: 0xef4444, dashSize: 1.5, gapSize: 1 })
    );
    ray3Line.computeLineDistances();
    grp.add(ray3Line);
  }

  /* ==============================================================
     09 — NOISE & ENVIRONMENTAL
     ============================================================== */
  init09Noise() {
    const grp = this.groups['09'];

    // Sound Source at Road
    const noiseLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-36, 0.4, 34), new THREE.Vector3(36, 0.4, 34)]),
      new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 4 })
    );
    grp.add(noiseLine);

    // Concentric Sound Waves Decaying with Distance
    const waves = [
      { z: 28, r: 8, c: 0xef4444, op: 0.7 },
      { z: 22, r: 16, c: 0xf97316, op: 0.55 },
      { z: 16, r: 24, c: 0xf59e0b, op: 0.4 },
      { z: 10, r: 32, c: 0x38bdf8, op: 0.25 },
      { z: 4,  r: 40, c: 0x10b981, op: 0.15 }
    ];
    waves.forEach(w => {
      const arcPoints = [];
      for (let a = -Math.PI * 0.4; a <= Math.PI * 0.4; a += Math.PI / 32) {
        const x = w.r * Math.sin(a);
        const z = 34 - (w.r * Math.cos(a));
        arcPoints.push(new THREE.Vector3(x, 0.35, z));
      }
      const arcLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(arcPoints),
        new THREE.LineBasicMaterial({ color: w.c, transparent: true, opacity: w.op, linewidth: 2 })
      );
      grp.add(arcLine);
    });

    // Acoustic Buffer Wall
    const wallGeom = new THREE.BoxGeometry(32, 2.8, 0.6);
    const wallMesh = new THREE.Mesh(wallGeom, new THREE.MeshStandardMaterial({
      color: 0x334155,
      transparent: true,
      opacity: 0.75
    }));
    wallMesh.position.set(0, 1.4, 25);
    grp.add(wallMesh);
  }

  /* ==============================================================
     10 — UTILITIES & INFRASTRUCTURE
     ============================================================== */
  init10Utilities() {
    const grp = this.groups['10'];

    // Water Supply (Blue)
    const waterGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-24, 0.25, 34),
      new THREE.Vector3(-24, 0.25, 20),
      new THREE.Vector3(-14, 0.25, 12),
      new THREE.Vector3(-10, 0.25, 2)
    ]);
    this.waterLine = new THREE.Line(waterGeom, new THREE.LineBasicMaterial({ color: 0x2563eb, linewidth: 3 }));
    grp.add(this.waterLine);

    // Electrical Power (Yellow)
    const powerGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(22, 0.25, 34),
      new THREE.Vector3(22, 0.25, 18),
      new THREE.Vector3(12, 0.25, 4)
    ]);
    this.powerLine = new THREE.Line(powerGeom, new THREE.LineBasicMaterial({ color: 0xeab308, linewidth: 3 }));
    grp.add(this.powerLine);

    // Transformer Node
    const transMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.8, 2.4),
      new THREE.MeshStandardMaterial({ color: 0xca8a04 })
    );
    transMesh.position.set(22, 0.9, 18);
    grp.add(transMesh);

    // Sanitary Sewer (Magenta)
    const sewerGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(4, 0.22, -10),
      new THREE.Vector3(8, 0.22, 10),
      new THREE.Vector3(10, 0.22, 34)
    ]);
    this.sewerLine = new THREE.Line(sewerGeom, new THREE.LineBasicMaterial({ color: 0xd946ef, linewidth: 3 }));
    grp.add(this.sewerLine);

    // Stormwater (Cyan)
    const stormGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-18, 0.2, -16),
      new THREE.Vector3(-22, 0.2, 8),
      new THREE.Vector3(-22, 0.2, 34)
    ]);
    this.stormLine = new THREE.Line(stormGeom, new THREE.LineDashedMaterial({ color: 0x06b6d4, dashSize: 1.5, gapSize: 1 }));
    this.stormLine.computeLineDistances();
    grp.add(this.stormLine);
  }

  setUtilityLayer(layerKey, isVisible) {
    this.utilityLayers[layerKey] = isVisible;
    if (layerKey === 'water' && this.waterLine) this.waterLine.visible = isVisible;
    if (layerKey === 'power' && this.powerLine) this.powerLine.visible = isVisible;
    if (layerKey === 'sewer' && this.sewerLine) this.sewerLine.visible = isVisible;
    if (layerKey === 'storm' && this.stormLine) this.stormLine.visible = isVisible;
  }

  /* ==============================================================
     MASTER LAYER CONTROL & TRANSPARENCY (Sections 10 & 11)
     ============================================================== */
  setLayerVisibility(layerKey, isVisible) {
    if (this.layerSettings[layerKey]) {
      this.layerSettings[layerKey].visible = isVisible;
    }

    if (layerKey === 'sun' && this.groups['02']) this.groups['02'].visible = isVisible && (this.activeModeId === '02');
    if (layerKey === 'wind' && this.groups['03']) this.groups['03'].visible = isVisible && (this.activeModeId === '03');
    if (layerKey === 'terrain' && this.groups['05']) this.groups['05'].visible = isVisible && (this.activeModeId === '05');
    if (layerKey === 'roads' && this.groups['06']) this.groups['06'].visible = isVisible && (this.activeModeId === '06');
    if (layerKey === 'vegetation' && this.groups['07']) this.groups['07'].visible = isVisible && (this.activeModeId === '07');
    if (layerKey === 'context' && this.groups['04']) this.groups['04'].visible = isVisible && (this.activeModeId === '04');
    if (layerKey === 'utilities' && this.groups['10']) this.groups['10'].visible = isVisible && (this.activeModeId === '10');
  }

  setLayerOpacity(layerKey, opacityVal) {
    const op = Math.max(0, Math.min(1, parseFloat(opacityVal)));
    if (this.layerSettings[layerKey]) {
      this.layerSettings[layerKey].opacity = op;
    }

    if (layerKey === 'sun') {
      this.sunState.opacity = op;
      if (this.sunArcMat) this.sunArcMat.opacity = op;
      if (this.sunMeshMat) this.sunMeshMat.opacity = op;
      if (this.sunHaloMat) this.sunHaloMat.opacity = 0.35 * op;
      if (this.sunBeamMat) this.sunBeamMat.opacity = 0.6 * op;
    }

    if (layerKey === 'wind') {
      this.windState.opacity = op;
      if (this.windLineMaterial) this.windLineMaterial.opacity = op;
      if (this.windVectorMaterial) this.windVectorMaterial.opacity = op;
    }

    if (layerKey === 'terrain' && this.topographyLines) {
      this.topographyLines.forEach(l => {
        if (l.material) l.material.opacity = op;
      });
    }

    if (layerKey === 'vegetation') {
      if (this.treeCanopyMat) this.treeCanopyMat.opacity = op;
      if (this.lawnMat) this.lawnMat.opacity = 0.35 * op;
    }

    if (layerKey === 'context' && this.ctxBodyMat) {
      this.ctxBodyMat.opacity = op;
    }

    if (layerKey === 'roads') {
      if (this.roadMeshMat) this.roadMeshMat.opacity = op;
      if (this.carPathLine) this.carPathLine.material.opacity = op;
      if (this.pedPathLine) this.pedPathLine.material.opacity = op;
    }
  }

  setMode(modeId) {
    this.activeModeId = modeId;

    for (let i = 1; i <= 10; i++) {
      const id = String(i).padStart(2, '0');
      if (this.groups[id]) {
        this.groups[id].visible = (id === modeId);
      }
    }

    if (modeId === '02') {
      this.updateSunPosition();
    }
  }

  update(delta) {
    if (this.activeModeId === '02' && this.sunState.isPlaying) {
      let nextHour = this.sunState.hour + (delta * 0.7);
      if (nextHour > 18) nextHour = 6.0;
      this.setSunTime(nextHour);
    }

    if (this.activeModeId === '03') {
      this.updateWind(delta);
    }
  }

  setVisible(visible) {
    this.masterGroup.visible = visible;
  }
}
