/**
 * GM ARCH TOOLS — 3D Analysis Mode Overlays Engine
 * Author: Guru Murthy (GM)
 * Manages 10 interactive analytical overlays in one shared Three.js scene:
 *   01 Climate, 02 Sun Path, 03 Wind, 04 Orientation, 05 Topography,
 *   06 Access, 07 Vegetation, 08 Views, 09 Noise, 10 Utilities.
 */

export class ModeOverlays {
  constructor(scene, massingController) {
    this.scene = scene;
    this.massing = massingController;

    // Master Group for All Overlays
    this.masterGroup = new THREE.Group();
    this.masterGroup.name = 'AnalysisOverlaysMasterGroup';
    this.scene.add(this.masterGroup);

    // Subgroups for each mode
    this.groups = {};
    for (let i = 1; i <= 10; i++) {
      const id = String(i).padStart(2, '0');
      const grp = new THREE.Group();
      grp.name = `OverlayMode_${id}`;
      grp.visible = false;
      this.masterGroup.add(grp);
      this.groups[id] = grp;
    }

    // State for Dynamic Modes
    this.activeModeId = '02'; // Default: Sun Path

    // Sun Path State
    this.sunState = {
      hour: 12.0, // 06:00 to 18:00
      isPlaying: false,
      season: 'EQUINOX', // 'SUMMER' | 'EQUINOX' | 'WINTER'
      sunSphere: null,
      sunLight: null,
      sunBeam: null,
      azimuthDeg: 180,
      altitudeDeg: 65,
      arcRadius: 36
    };

    // Wind State
    this.windState = {
      direction: 'SW', // N, NE, E, SE, S, SW, W, NW
      speed: 1.0,
      isPlaying: true,
      particles: [],
      maxParticles: 140,
      flowBoxSize: 60
    };

    // Access State
    this.accessState = {
      carParticles: [],
      pedParticles: [],
      speed: 1.0
    };

    // Utilities State
    this.utilityLayers = {
      water: true,
      power: true,
      sewer: true,
      storm: true
    };

    this.initAllModes();
  }

  initAllModes() {
    this.init01Climate();
    this.init02SunPath();
    this.init03Wind();
    this.init04Orientation();
    this.init05Topography();
    this.init06Access();
    this.init07Vegetation();
    this.init08Views();
    this.init09Noise();
    this.init10Utilities();

    // Activate initial mode
    this.setMode(this.activeModeId);
  }

  /* ==============================================================
     01 — CLIMATE ANALYSIS OVERLAY
     ============================================================== */
  init01Climate() {
    const grp = this.groups['01'];

    // Sky Dome Grid
    const skyGeom = new THREE.SphereGeometry(45, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.1
    });
    const skyDome = new THREE.Mesh(skyGeom, skyMat);
    grp.add(skyDome);

    // Diurnal Comfort Zone Ring
    const ringGeom = new THREE.RingGeometry(26, 27, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.2;
    grp.add(ringMesh);

    // Microclimate Zone Labels (3D Sprites / Rings)
    const zones = [
      { name: 'Warm-Humid Buffer', r: 35, c: 0x38bdf8 },
      { name: 'Composite Plateau', r: 24, c: 0xf59e0b },
      { name: 'Courtyard Micro-Sink', r: 12, c: 0x10b981 }
    ];

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
      circleLine.position.y = 0.3;
      grp.add(circleLine);
    });
  }

  /* ==============================================================
     02 — SUN PATH & SOLAR ANALYSIS OVERLAY
     ============================================================== */
  init02SunPath() {
    const grp = this.groups['02'];
    const R = this.sunState.arcRadius;

    // 1. Sun Path Arc (Half-Torus / Arc from East to West)
    const curvePoints = [];
    for (let a = 0; a <= Math.PI; a += Math.PI / 64) {
      // East (-X) -> South (+Z) -> West (+X) arc tilted at site latitude angle
      const x = -R * Math.cos(a);
      const y = R * Math.sin(a) * Math.sin(Math.PI / 3);
      const z = -R * Math.sin(a) * Math.cos(Math.PI / 3);
      curvePoints.push(new THREE.Vector3(x, y, z));
    }
    const arcGeom = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const arcMat = new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      linewidth: 2,
      transparent: true,
      opacity: 0.85
    });
    this.sunArcLine = new THREE.Line(arcGeom, arcMat);
    grp.add(this.sunArcLine);

    // 2. Horizon Compass Circle
    const horizonGeom = new THREE.BufferGeometry().setFromPoints(
      new THREE.Path().absarc(0, 0, R, 0, Math.PI * 2, true).getPoints(64)
    );
    const horizonMat = new THREE.LineBasicMaterial({
      color: 0x64748b,
      transparent: true,
      opacity: 0.5
    });
    const horizonCircle = new THREE.Line(horizonGeom, horizonMat);
    horizonCircle.rotation.x = Math.PI / 2;
    horizonCircle.position.y = 0.1;
    grp.add(horizonCircle);

    // 3. Sun Sphere (Glowing Golden Mesh)
    const sunMeshGeom = new THREE.SphereGeometry(1.6, 24, 24);
    const sunMeshMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    this.sunSphere = new THREE.Mesh(sunMeshGeom, sunMeshMat);
    grp.add(this.sunSphere);

    // 4. Sun Glow Halo
    const haloGeom = new THREE.SphereGeometry(2.4, 16, 16);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.35
    });
    const sunHalo = new THREE.Mesh(haloGeom, haloMat);
    this.sunSphere.add(sunHalo);

    // 5. Directional Light for Dynamic Cast Shadows
    this.sunLight = new THREE.DirectionalLight(0xfffbeb, 1.4);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 120;
    this.sunLight.shadow.camera.left = -40;
    this.sunLight.shadow.camera.right = 40;
    this.sunLight.shadow.camera.top = 40;
    this.sunLight.shadow.camera.bottom = -40;
    this.sunLight.shadow.bias = -0.0008;
    grp.add(this.sunLight);

    // 6. Volumetric Beam Line from Sun to Building Center
    const beamGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0)
    ]);
    const beamMat = new THREE.LineDashedMaterial({
      color: 0xfef08a,
      dashSize: 1.5,
      gapSize: 1,
      transparent: true,
      opacity: 0.6
    });
    this.sunBeam = new THREE.Line(beamGeom, beamMat);
    grp.add(this.sunBeam);

    // Update position at default 12:00 noon
    this.updateSunPosition();
  }

  setSunTime(hour) {
    this.sunState.hour = Math.max(6, Math.min(18, hour));
    this.updateSunPosition();
  }

  setSunSeason(season) {
    this.sunState.season = season;
    this.updateSunPosition();
  }

  updateSunPosition() {
    if (!this.sunSphere || !this.sunLight) return;

    const { hour, arcRadius, season } = this.sunState;
    // Map hour 6.0 (sunrise, -X) to 18.0 (sunset, +X) -> fraction 0 to 1
    const t = (hour - 6) / 12; // 0 at 6:00, 0.5 at 12:00, 1 at 18:00
    const angle = t * Math.PI; // 0 to PI

    // Seasonal Zenith Angle Adjustment
    let latTilt = Math.PI / 3; // ~60° default zenith at Equinox
    if (season === 'SUMMER') latTilt = Math.PI / 2.3; // Higher sun
    if (season === 'WINTER') latTilt = Math.PI / 4;   // Lower sun

    const x = -arcRadius * Math.cos(angle);
    const y = Math.max(0.5, arcRadius * Math.sin(angle) * Math.sin(latTilt));
    const z = -arcRadius * Math.sin(angle) * Math.cos(latTilt);

    this.sunSphere.position.set(x, y, z);
    this.sunLight.position.set(x, y, z);

    // Target Building Mass Center
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

    // Color Shift based on time of day
    if (hour <= 7 || hour >= 17) {
      // Golden Hour (Warm Amber/Red)
      this.sunLight.color.setHex(0xf97316);
      this.sunLight.intensity = 1.0;
    } else if (hour <= 9 || hour >= 15) {
      // Morning / Afternoon (Warm Golden)
      this.sunLight.color.setHex(0xfbbf24);
      this.sunLight.intensity = 1.3;
    } else {
      // Noon (Crisp Bright)
      this.sunLight.color.setHex(0xfffbeb);
      this.sunLight.intensity = 1.6;
    }

    // Calculate Readouts
    const groundDist = Math.hypot(x, z);
    const altRad = Math.atan2(y, groundDist);
    this.sunState.altitudeDeg = Math.round((altRad * 180) / Math.PI);

    let azRad = Math.atan2(x, -z);
    if (azRad < 0) azRad += Math.PI * 2;
    this.sunState.azimuthDeg = Math.round((azRad * 180) / Math.PI);
  }

  /* ==============================================================
     03 — WIND & AIRFLOW ANALYSIS OVERLAY
     ============================================================== */
  init03Wind() {
    const grp = this.groups['03'];
    const { maxParticles } = this.windState;

    // Streamline particles
    const particleGeom = new THREE.ConeGeometry(0.35, 1.4, 6);
    particleGeom.rotateX(Math.PI / 2); // Point along +Z by default
    const particleMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.8
    });

    this.windState.particles = [];
    for (let i = 0; i < maxParticles; i++) {
      const mesh = new THREE.Mesh(particleGeom, particleMat);
      grp.add(mesh);
      this.resetWindParticle(mesh, true);
      this.windState.particles.push(mesh);
    }

    // Directional Inflow Vector Arrow (Large CAD Vector)
    const arrowGeom = new THREE.CylinderGeometry(0.15, 0.15, 18, 12);
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
    this.windInflowVector = new THREE.Mesh(arrowGeom, arrowMat);
    this.windInflowVector.position.y = 8;
    grp.add(this.windInflowVector);

    this.setWindDirection(this.windState.direction);
  }

  setWindDirection(dirCode) {
    this.windState.direction = dirCode;
    const angles = {
      'N': 0,
      'NE': 45,
      'E': 90,
      'SE': 135,
      'S': 180,
      'SW': 225,
      'W': 270,
      'NW': 315
    };
    const deg = angles[dirCode] !== undefined ? angles[dirCode] : 225;
    const rad = (deg * Math.PI) / 180;

    // Flow Vector: enters from `deg`, moves towards opposite
    this.windFlowRad = rad;
    this.windVelocityX = -Math.sin(rad);
    this.windVelocityZ = -Math.cos(rad);

    // Update in-flight particles immediately
    this.windState.particles.forEach(p => {
      this.resetWindParticle(p, true);
    });
  }

  resetWindParticle(p, randomSpan = false) {
    const size = this.windState.flowBoxSize;
    const vx = this.windVelocityX || -0.707;
    const vz = this.windVelocityZ || -0.707;

    // Spawn on the upstream face of the bounding box
    const perpX = -vz;
    const perpZ = vx;

    const lateralOffset = (Math.random() - 0.5) * size;
    const verticalOffset = 1.0 + Math.random() * 18;
    const distanceBack = randomSpan ? (Math.random() * size) : (size * 0.55);

    p.position.x = (-vx * distanceBack) + (perpX * lateralOffset);
    p.position.y = verticalOffset;
    p.position.z = (-vz * distanceBack) + (perpZ * lateralOffset);

    // Orient particle along wind vector
    p.rotation.y = Math.atan2(vx, vz);
    p.userData = {
      speed: (0.35 + Math.random() * 0.3) * this.windState.speed,
      lifetime: Math.random() * 100
    };
  }

  updateWind(delta) {
    if (!this.groups['03'].visible || !this.windState.isPlaying) return;

    const bounds = this.massing.getBounds();
    const vx = this.windVelocityX || -0.707;
    const vz = this.windVelocityZ || -0.707;
    const center = bounds.center;
    const bRadius = bounds.radius * 1.2;
    const bHeight = bounds.height;

    this.windState.particles.forEach(p => {
      // Step forward along wind vector
      const speed = p.userData.speed * delta * 45;
      let nextX = p.position.x + vx * speed;
      let nextY = p.position.y;
      let nextZ = p.position.z + vz * speed;

      // Deflection around building mass
      const dx = nextX - center.x;
      const dz = nextZ - center.z;
      const dist = Math.hypot(dx, dz);

      if (dist < bRadius && nextY < bHeight + 2) {
        // Push particle outward tangentially (aerodynamic deflection)
        const normalX = dx / (dist || 1);
        const normalZ = dz / (dist || 1);
        nextX += normalX * speed * 1.5;
        nextZ += normalZ * speed * 1.5;
        // Subtle vertical lift over roof
        if (nextY > bHeight * 0.6) {
          nextY += speed * 0.3;
        }
      }

      p.position.set(nextX, nextY, nextZ);

      // Re-orient slightly to movement
      p.rotation.y = Math.atan2(vx, vz);

      // Check boundary limits
      if (Math.hypot(p.position.x, p.position.z) > this.windState.flowBoxSize * 0.65) {
        this.resetWindParticle(p, false);
      }
    });
  }

  /* ==============================================================
     04 — SITE ORIENTATION & CONTEXT OVERLAY
     ============================================================== */
  init04Orientation() {
    const grp = this.groups['04'];

    // 1. Compass Rose on Ground Plane
    const compassGeom = new THREE.RingGeometry(18, 19, 48);
    const compassMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    const compassMesh = new THREE.Mesh(compassGeom, compassMat);
    compassMesh.rotation.x = Math.PI / 2;
    compassMesh.position.y = 0.15;
    grp.add(compassMesh);

    // 2. High-Contrast North Vector (Ruby Red Arrow)
    const northArrowPoints = [
      new THREE.Vector3(0, 0.25, 0),
      new THREE.Vector3(0, 0.25, -28) // North is -Z
    ];
    const northLineGeom = new THREE.BufferGeometry().setFromPoints(northArrowPoints);
    const northLineMat = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 3 });
    const northLine = new THREE.Line(northLineGeom, northLineMat);
    grp.add(northLine);

    // North Cone Pointer
    const coneGeom = new THREE.ConeGeometry(1.2, 3.5, 12);
    coneGeom.rotateX(-Math.PI / 2);
    const coneMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const coneMesh = new THREE.Mesh(coneGeom, coneMat);
    coneMesh.position.set(0, 0.25, -28);
    grp.add(coneMesh);

    // 3. East-West Optimal Solar Axis (Amber Line)
    const ewPoints = [
      new THREE.Vector3(-24, 0.2, 0),
      new THREE.Vector3(24, 0.2, 0)
    ];
    const ewGeom = new THREE.BufferGeometry().setFromPoints(ewPoints);
    const ewMat = new THREE.LineDashedMaterial({
      color: 0xf59e0b,
      dashSize: 2,
      gapSize: 1,
      transparent: true,
      opacity: 0.7
    });
    const ewLine = new THREE.Line(ewGeom, ewMat);
    ewLine.computeLineDistances();
    grp.add(ewLine);

    // 4. Surrounding Context Masses (Translucent Blocks)
    this.createContextBlocks(grp);
  }

  createContextBlocks(grp) {
    const contextBuildings = [
      { x: -32, z: -10, w: 16, d: 20, h: 14 },
      { x: 34, z: -8, w: 18, d: 18, h: 18 },
      { x: 0, z: -35, w: 26, d: 14, h: 12 },
      { x: -28, z: 28, w: 14, d: 16, h: 9 },
      { x: 28, z: 28, w: 16, d: 14, h: 10 }
    ];

    const ctxMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.7,
      transparent: true,
      opacity: 0.35
    });

    const ctxLineMat = new THREE.LineBasicMaterial({
      color: 0x64748b,
      transparent: true,
      opacity: 0.5
    });

    contextBuildings.forEach(cb => {
      const bGeom = new THREE.BoxGeometry(cb.w, cb.h, cb.d);
      const bMesh = new THREE.Mesh(bGeom, ctxMat);
      bMesh.position.set(cb.x, cb.h / 2, cb.z);

      const bEdges = new THREE.LineSegments(new THREE.EdgesGeometry(bGeom), ctxLineMat);
      bMesh.add(bEdges);
      grp.add(bMesh);
    });
  }

  /* ==============================================================
     05 — TOPOGRAPHY & CONTOUR ANALYSIS OVERLAY
     ============================================================== */
  init05Topography() {
    const grp = this.groups['05'];

    // 1. Stepped Contour Terrain Slices (+0m to +4m elevation)
    const levels = [
      { y: 0.1, r: 38, label: '+0.00m Datum' },
      { y: 1.0, r: 32, label: '+1.00m' },
      { y: 2.0, r: 26, label: '+2.00m' },
      { y: 3.0, r: 20, label: '+3.00m' },
      { y: 4.0, r: 14, label: '+4.00m Ridge' }
    ];

    levels.forEach((lvl, idx) => {
      const contourPoints = [];
      const segments = 64;
      for (let s = 0; s <= segments; s++) {
        const theta = (s / segments) * Math.PI * 2;
        // Undulating contour perturbation
        const perturb = 1 + 0.18 * Math.sin(theta * 3) + 0.12 * Math.cos(theta * 2);
        const radius = lvl.r * perturb;
        const x = radius * Math.cos(theta) - 4;
        const z = radius * Math.sin(theta) - 4;
        contourPoints.push(new THREE.Vector3(x, lvl.y, z));
      }

      const cGeom = new THREE.BufferGeometry().setFromPoints(contourPoints);
      const cMat = new THREE.LineBasicMaterial({
        color: idx >= 3 ? 0xf59e0b : (idx >= 1 ? 0x38bdf8 : 0x059669),
        linewidth: 2
      });
      const cLine = new THREE.Line(cGeom, cMat);
      grp.add(cLine);
    });

    // 2. Slope Gradient Drainage Arrows (Highland to Lowland)
    const slopeArrows = [
      { from: new THREE.Vector3(-6, 3.5, -6), to: new THREE.Vector3(-18, 0.5, -18) },
      { from: new THREE.Vector3(6, 3.5, 6), to: new THREE.Vector3(20, 0.5, 20) },
      { from: new THREE.Vector3(-4, 3.5, 6), to: new THREE.Vector3(-16, 0.5, 18) }
    ];

    slopeArrows.forEach(sa => {
      const dir = new THREE.Vector3().subVectors(sa.to, sa.from);
      const len = dir.length();
      dir.normalize();
      const arrowHelper = new THREE.ArrowHelper(dir, sa.from, len, 0x0ea5e9, 2.0, 1.2);
      grp.add(arrowHelper);
    });
  }

  /* ==============================================================
     06 — ACCESS & CIRCULATION OVERLAY
     ============================================================== */
  init06Access() {
    const grp = this.groups['06'];

    // 1. Public Roadway along South Frontage (+Z)
    const roadGeom = new THREE.PlaneGeometry(80, 12);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8
    });
    const roadMesh = new THREE.Mesh(roadGeom, roadMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.set(0, 0.05, 34);
    grp.add(roadMesh);

    // Road Centerline
    const lineGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-38, 0.1, 34),
      new THREE.Vector3(38, 0.1, 34)
    ]);
    const lineMat = new THREE.LineDashedMaterial({
      color: 0xf59e0b,
      dashSize: 2,
      gapSize: 2
    });
    const roadCenterLine = new THREE.Line(lineGeom, lineMat);
    roadCenterLine.computeLineDistances();
    grp.add(roadCenterLine);

    // 2. Vehicular Circulation Loop Pathway (Amber)
    const carPath = new THREE.CurvePath();
    const c1 = new THREE.LineCurve3(new THREE.Vector3(-16, 0.15, 34), new THREE.Vector3(-16, 0.15, 14));
    const c2 = new THREE.LineCurve3(new THREE.Vector3(-16, 0.15, 14), new THREE.Vector3(0, 0.15, 10)); // Drop-off
    const c3 = new THREE.LineCurve3(new THREE.Vector3(0, 0.15, 10), new THREE.Vector3(16, 0.15, 14));
    const c4 = new THREE.LineCurve3(new THREE.Vector3(16, 0.15, 14), new THREE.Vector3(16, 0.15, 34)); // Egress
    carPath.add(c1);
    carPath.add(c2);
    carPath.add(c3);
    carPath.add(c4);

    const carPoints = carPath.getPoints(50);
    const carLoopGeom = new THREE.BufferGeometry().setFromPoints(carPoints);
    const carLoopMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 3 });
    const carLoop = new THREE.Line(carLoopGeom, carLoopMat);
    grp.add(carLoop);

    // 3. Pedestrian Walkway (Cyan)
    const pedGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-6, 0.18, 34),
      new THREE.Vector3(-6, 0.18, 12),
      new THREE.Vector3(-2, 0.18, 8)
    ]);
    const pedMat = new THREE.LineBasicMaterial({ color: 0x00f2fe, linewidth: 2.5 });
    const pedLine = new THREE.Line(pedGeom, pedMat);
    grp.add(pedLine);

    // 4. Fire Tender 6.0m Turning Way Around Mass (Red Outline)
    const firePoints = [
      new THREE.Vector3(-22, 0.12, -18),
      new THREE.Vector3(22, 0.12, -18),
      new THREE.Vector3(22, 0.12, 22),
      new THREE.Vector3(-22, 0.12, 22),
      new THREE.Vector3(-22, 0.12, -18)
    ];
    const fireGeom = new THREE.BufferGeometry().setFromPoints(firePoints);
    const fireMat = new THREE.LineDashedMaterial({
      color: 0xef4444,
      dashSize: 2,
      gapSize: 1.5
    });
    const fireLine = new THREE.Line(fireGeom, fireMat);
    fireLine.computeLineDistances();
    grp.add(fireLine);
  }

  /* ==============================================================
     07 — VEGETATION & LANDSCAPE OVERLAY
     ============================================================== */
  init07Vegetation() {
    const grp = this.groups['07'];

    // 1. Permeable Green Lawn Mesh
    const lawnGeom = new THREE.PlaneGeometry(48, 40);
    const lawnMat = new THREE.MeshBasicMaterial({
      color: 0x064e3b,
      transparent: true,
      opacity: 0.35
    });
    const lawnMesh = new THREE.Mesh(lawnGeom, lawnMat);
    lawnMesh.rotation.x = -Math.PI / 2;
    lawnMesh.position.set(0, 0.08, 0);
    grp.add(lawnMesh);

    // 2. Stylized 3D Architectural Geometric Trees
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

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.4,
      metalness: 0.1,
      flatShading: true
    });

    treePositions.forEach(tp => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(tp.x, 0, tp.z);

      // Trunk
      const trunkGeom = new THREE.CylinderGeometry(0.3, 0.45, tp.h * 0.45, 8);
      const trunk = new THREE.Mesh(trunkGeom, trunkMat);
      trunk.position.y = (tp.h * 0.45) / 2;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      // Canopy (Faceted Polyhedron)
      const canopyGeom = new THREE.IcosahedronGeometry(tp.r, 1);
      const canopy = new THREE.Mesh(canopyGeom, canopyMat);
      canopy.position.y = tp.h * 0.65;
      canopy.castShadow = true;
      treeGroup.add(canopy);

      grp.add(treeGroup);
    });
  }

  /* ==============================================================
     08 — VIEWS & VISUAL ANALYSIS OVERLAY
     ============================================================== */
  init08Views() {
    const grp = this.groups['08'];

    // 1. Primary Scenic View Cone (Towards Park / Water on North-East)
    const coneGeom = new THREE.ConeGeometry(14, 32, 16, 1, true);
    // Rotate cone to point horizontally towards NE
    coneGeom.rotateX(Math.PI / 2);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide
    });
    const viewCone = new THREE.Mesh(coneGeom, coneMat);
    viewCone.position.set(0, 10, 0);
    viewCone.rotation.y = Math.PI / 4; // Face NE
    grp.add(viewCone);

    // Ray to Scenic Anchor
    const ray1Geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 10, 0),
      new THREE.Vector3(26, 10, -26)
    ]);
    const ray1 = new THREE.Line(ray1Geom, new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 2.5 }));
    grp.add(ray1);

    // 2. Street View Ray (South)
    const ray2Geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 10, 0),
      new THREE.Vector3(0, 4, 34)
    ]);
    const ray2 = new THREE.Line(ray2Geom, new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2 }));
    grp.add(ray2);

    // 3. Visual Blight / Screened Yard Ray (North-West)
    const ray3Geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 10, 0),
      new THREE.Vector3(-28, 4, -28)
    ]);
    const ray3Mat = new THREE.LineDashedMaterial({
      color: 0xef4444,
      dashSize: 1.5,
      gapSize: 1
    });
    const ray3 = new THREE.Line(ray3Geom, ray3Mat);
    ray3.computeLineDistances();
    grp.add(ray3);
  }

  /* ==============================================================
     09 — NOISE & ENVIRONMENTAL OVERLAY
     ============================================================== */
  init09Noise() {
    const grp = this.groups['09'];

    // 1. Noise Source Line at Road (+Z)
    const noiseLineGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-36, 0.4, 34),
      new THREE.Vector3(36, 0.4, 34)
    ]);
    const noiseLineMat = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 4 });
    const noiseLine = new THREE.Line(noiseLineGeom, noiseLineMat);
    grp.add(noiseLine);

    // 2. Concentric Radiating Sound Iso-Curves Decaying Toward Building
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
      const arcGeom = new THREE.BufferGeometry().setFromPoints(arcPoints);
      const arcMat = new THREE.LineBasicMaterial({
        color: w.c,
        transparent: true,
        opacity: w.op,
        linewidth: 2
      });
      const arcLine = new THREE.Line(arcGeom, arcMat);
      grp.add(arcLine);
    });

    // 3. Acoustic Buffer Zone (Compound Wall & Tree Shield)
    const wallGeom = new THREE.BoxGeometry(32, 2.8, 0.6);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      transparent: true,
      opacity: 0.7
    });
    const wallMesh = new THREE.Mesh(wallGeom, wallMat);
    wallMesh.position.set(0, 1.4, 25);
    grp.add(wallMesh);
  }

  /* ==============================================================
     10 — UTILITIES & INFRASTRUCTURE OVERLAY
     ============================================================== */
  init10Utilities() {
    const grp = this.groups['10'];

    // 1. Potable Water Supply (Blue)
    const waterGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-24, 0.25, 34), // Road Main
      new THREE.Vector3(-24, 0.25, 20),
      new THREE.Vector3(-14, 0.25, 12),
      new THREE.Vector3(-10, 0.25, 2)   // Building Entry
    ]);
    this.waterLine = new THREE.Line(waterGeom, new THREE.LineBasicMaterial({ color: 0x2563eb, linewidth: 3 }));
    grp.add(this.waterLine);

    // 2. Electrical Power Supply (Yellow)
    const powerGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(22, 0.25, 34),  // Municipal Feeder
      new THREE.Vector3(22, 0.25, 18),  // Transformer Yard
      new THREE.Vector3(12, 0.25, 4)    // Electrical Substation
    ]);
    this.powerLine = new THREE.Line(powerGeom, new THREE.LineBasicMaterial({ color: 0xeab308, linewidth: 3 }));
    grp.add(this.powerLine);

    // Transformer Box
    const transGeom = new THREE.BoxGeometry(2.4, 1.8, 2.4);
    const transMat = new THREE.MeshStandardMaterial({ color: 0xca8a04 });
    const transMesh = new THREE.Mesh(transGeom, transMat);
    transMesh.position.set(22, 0.9, 18);
    grp.add(transMesh);

    // 3. Sanitary Sewer Line (Magenta)
    const sewerGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(4, 0.22, -10),  // Rear Core
      new THREE.Vector3(8, 0.22, 10),   // Inspection Chamber 1
      new THREE.Vector3(10, 0.22, 34)   // Municipal Sewer Main
    ]);
    this.sewerLine = new THREE.Line(sewerGeom, new THREE.LineBasicMaterial({ color: 0xd946ef, linewidth: 3 }));
    grp.add(this.sewerLine);

    // Inspection Manholes (Small Cylinders)
    const mhGeom = new THREE.CylinderGeometry(0.7, 0.7, 0.3, 16);
    const mhMat = new THREE.MeshBasicMaterial({ color: 0xd946ef });
    const mh1 = new THREE.Mesh(mhGeom, mhMat);
    mh1.position.set(8, 0.15, 10);
    grp.add(mh1);

    // 4. Stormwater Drain (Cyan Dashed)
    const stormGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-18, 0.2, -16),
      new THREE.Vector3(-22, 0.2, 8),
      new THREE.Vector3(-22, 0.2, 34)
    ]);
    const stormMat = new THREE.LineDashedMaterial({
      color: 0x06b6d4,
      dashSize: 1.5,
      gapSize: 1
    });
    this.stormLine = new THREE.Line(stormGeom, stormMat);
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
     MODE TRANSITIONS (Section 11)
     Smoothly switch overlays without reloading or destroying scene
     ============================================================== */
  setMode(modeId) {
    this.activeModeId = modeId;

    for (let i = 1; i <= 10; i++) {
      const id = String(i).padStart(2, '0');
      if (this.groups[id]) {
        this.groups[id].visible = (id === modeId);
      }
    }

    // Special handlers when activating specific modes
    if (modeId === '02') {
      this.updateSunPosition();
    }
  }

  // Animation Update Loop (called every frame from Three.js render loop)
  update(delta) {
    if (this.activeModeId === '02' && this.sunState.isPlaying) {
      // Advance sun time smoothly: full cycle in ~20 seconds
      let nextHour = this.sunState.hour + (delta * 0.6);
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
