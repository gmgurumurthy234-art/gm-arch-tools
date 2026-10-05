/**
 * GM ARCH TOOLS — THE DESIGNER: Parametric Massing & Architectural Geometry
 * Author: Guru Murthy (GM)
 *
 * Provides:
 *   - Mathematical calculations: Footprint area, Gross Floor Area, Ground Coverage %,
 *     FSI/FAR utilization, Total building height, and design constraint checks.
 *   - 3D Geometry generators for architectural masses (Rectangle, Polyline, Circle, Polygon).
 *   - Visual floor division lines and slab indicators for conceptual massing.
 *   - Conceptual Divide / Cut operation.
 *   - Dynamic site boundary & setback geometry.
 */

/**
 * Calculates 2D polygon area using the Shoelace formula
 * @param {Array<{x: number, z: number}>} points
 * @returns {number} area in square meters
 */
export function calculateShoelaceArea(points) {
  if (!points || points.length < 3) return 0;
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].z;
    area -= points[j].x * points[i].z;
  }
  return Math.abs(area) / 2;
}

/**
 * Calculates footprint area of any mass object
 * @param {Object} mass
 * @returns {number} area in square meters
 */
export function calculateMassFootprintArea(mass) {
  if (!mass) return 0;

  switch (mass.type) {
    case 'RECTANGLE':
      return (mass.width || 0) * (mass.length || 0);

    case 'CIRCLE': {
      const r = mass.radius || 0;
      return Math.PI * r * r;
    }

    case 'POLYGON': {
      // Regular polygon with n sides
      const n = mass.sides || 6;
      const r = mass.radius || 10;
      return (n * r * r * Math.sin((2 * Math.PI) / n)) / 2;
    }

    case 'POLYLINE':
      if (mass.points && mass.points.length >= 3) {
        return calculateShoelaceArea(mass.points);
      }
      return 0;

    default:
      return (mass.width || 0) * (mass.length || 0);
  }
}

/**
 * Computes all design telemetry for an entire design option
 * @param {DesignerOption} option
 * @returns {Object} computed metrics
 */
export function calculateOptionMetrics(option) {
  if (!option) {
    return {
      massCount: 0,
      footprintArea: 0,
      totalBuiltUpArea: 0,
      totalHeight: 0,
      maxFloors: 0,
      groundCoveragePct: 0,
      currentFSI: 0,
      currentFAR: 0,
      permissibleFSIArea: 0,
      fsiUtilizationPct: 0,
      isCoverageExceeded: false,
      coverageWarningText: ''
    };
  }

  const masses = option.masses || [];
  const params = option.parameters || {};
  const siteArea = params.siteArea || 2000;
  const inputFSI = params.fsi || 2.0;
  const inputFAR = params.far || 2.0;
  const maxCoverage = params.maxCoverage || 45;

  let totalFootprint = 0;
  let totalBuiltUpArea = 0;
  let maxHeight = 0;
  let maxFloors = 0;

  masses.forEach(mass => {
    const fp = calculateMassFootprintArea(mass);
    const floors = Math.max(1, mass.floors || 1);
    const floorH = Math.max(2.4, mass.floorHeight || 3.2);
    const height = floors * floorH;

    totalFootprint += fp;
    totalBuiltUpArea += fp * floors;

    if (height > maxHeight) maxHeight = height;
    if (floors > maxFloors) maxFloors = floors;
  });

  // Coverage calculation
  const groundCoveragePct = siteArea > 0 ? (totalFootprint / siteArea) * 100 : 0;
  const isCoverageExceeded = groundCoveragePct > maxCoverage;
  const coverageWarningText = isCoverageExceeded
    ? `Current ground coverage (${groundCoveragePct.toFixed(1)}%) exceeds input constraint (${maxCoverage}%).`
    : '';

  // FSI calculations (where site area is known)
  const currentFSI = siteArea > 0 ? totalBuiltUpArea / siteArea : 0;
  const currentFAR = currentFSI;
  const permissibleFSIArea = siteArea * inputFSI;
  const fsiUtilizationPct = inputFSI > 0 ? (currentFSI / inputFSI) * 100 : 0;

  return {
    massCount: masses.length,
    footprintArea: Math.round(totalFootprint * 10) / 10,
    totalBuiltUpArea: Math.round(totalBuiltUpArea * 10) / 10,
    totalHeight: Math.round(maxHeight * 10) / 10,
    maxFloors,
    groundCoveragePct: Math.round(groundCoveragePct * 10) / 10,
    currentFSI: Math.round(currentFSI * 100) / 100,
    currentFAR: Math.round(currentFAR * 100) / 100,
    permissibleFSIArea: Math.round(permissibleFSIArea * 10) / 10,
    fsiUtilizationPct: Math.round(fsiUtilizationPct * 10) / 10,
    isCoverageExceeded,
    coverageWarningText
  };
}

/**
 * Builds a 3D Three.js Object3D representing an architectural mass with floor lines
 * @param {Object} mass
 * @param {boolean} isSelected
 * @returns {THREE.Group}
 */
export function createMass3DObject(mass, isSelected = false) {
  if (typeof THREE === 'undefined') return null;

  const group = new THREE.Group();
  group.name = `mass-group-${mass.id}`;
  group.userData = { massId: mass.id, type: mass.type };

  const floors = Math.max(1, mass.floors || 1);
  const floorHeight = Math.max(2.0, mass.floorHeight || 3.2);
  const totalHeight = floors * floorHeight;

  // Material: Clean architectural semi-translucent styling
  const baseColor = isSelected ? 0x00f2fe : (mass.color ? new THREE.Color(mass.color) : 0x38bdf8);
  const massMaterial = new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: 0.25,
    metalness: 0.15,
    transparent: true,
    opacity: isSelected ? 0.90 : 0.80,
    side: THREE.DoubleSide
  });

  let mesh = null;
  let edgesGeo = null;

  // 1. Geometry based on mass type
  if (mass.type === 'RECTANGLE') {
    const w = mass.width || 20;
    const l = mass.length || 30;
    const boxGeo = new THREE.BoxGeometry(w, totalHeight, l);
    // Position so bottom sits at y = 0
    boxGeo.translate(0, totalHeight / 2, 0);
    mesh = new THREE.Mesh(boxGeo, massMaterial);
    edgesGeo = new THREE.EdgesGeometry(boxGeo);

    // Floor division lines at each level
    const floorLinesGroup = new THREE.Group();
    const floorLineMat = new THREE.LineBasicMaterial({
      color: isSelected ? 0xffffff : 0x7dd3fc,
      transparent: true,
      opacity: 0.75
    });

    for (let f = 1; f < floors; f++) {
      const y = f * floorHeight;
      const pts = [
        new THREE.Vector3(-w / 2, y, -l / 2),
        new THREE.Vector3(w / 2, y, -l / 2),
        new THREE.Vector3(w / 2, y, l / 2),
        new THREE.Vector3(-w / 2, y, l / 2),
        new THREE.Vector3(-w / 2, y, -l / 2)
      ];
      const floorGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(floorGeo, floorLineMat);
      floorLinesGroup.add(line);
    }
    group.add(floorLinesGroup);

  } else if (mass.type === 'CIRCLE') {
    const r = mass.radius || 15;
    const cylGeo = new THREE.CylinderGeometry(r, r, totalHeight, 32);
    cylGeo.translate(0, totalHeight / 2, 0);
    mesh = new THREE.Mesh(cylGeo, massMaterial);
    edgesGeo = new THREE.EdgesGeometry(cylGeo, 15);

    // Circular floor rings
    const floorLinesGroup = new THREE.Group();
    const ringMat = new THREE.LineBasicMaterial({
      color: isSelected ? 0xffffff : 0x7dd3fc,
      transparent: true,
      opacity: 0.75
    });
    for (let f = 1; f < floors; f++) {
      const y = f * floorHeight;
      const ringPts = [];
      const segments = 32;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        ringPts.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r));
      }
      const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPts);
      floorLinesGroup.add(new THREE.Line(ringGeo, ringMat));
    }
    group.add(floorLinesGroup);

  } else if (mass.type === 'POLYGON') {
    const r = mass.radius || 15;
    const sides = mass.sides || 6;
    const cylGeo = new THREE.CylinderGeometry(r, r, totalHeight, sides);
    cylGeo.translate(0, totalHeight / 2, 0);
    mesh = new THREE.Mesh(cylGeo, massMaterial);
    edgesGeo = new THREE.EdgesGeometry(cylGeo);

    // Floor lines for regular polygon
    const floorLinesGroup = new THREE.Group();
    const floorLineMat = new THREE.LineBasicMaterial({
      color: isSelected ? 0xffffff : 0x7dd3fc,
      transparent: true,
      opacity: 0.75
    });
    for (let f = 1; f < floors; f++) {
      const y = f * floorHeight;
      const polyPts = [];
      for (let i = 0; i <= sides; i++) {
        const theta = (i / sides) * Math.PI * 2;
        polyPts.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r));
      }
      const pGeo = new THREE.BufferGeometry().setFromPoints(polyPts);
      floorLinesGroup.add(new THREE.Line(pGeo, floorLineMat));
    }
    group.add(floorLinesGroup);

  } else if (mass.type === 'POLYLINE') {
    // Custom closed 2D polygon extrusion
    const pts = mass.points || [];
    if (pts.length >= 3) {
      const shape = new THREE.Shape();
      shape.moveTo(pts[0].x, pts[0].z);
      for (let i = 1; i < pts.length; i++) {
        shape.lineTo(pts[i].x, pts[i].z);
      }
      shape.closePath();

      const extrudeSettings = {
        depth: totalHeight,
        bevelEnabled: false
      };
      const shapeGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      // Three.js ExtrudeGeometry extrudes along +Z; rotate so it stands upright along +Y
      shapeGeo.rotateX(Math.PI / 2);
      shapeGeo.scale(1, 1, -1); // Maintain orientation
      mesh = new THREE.Mesh(shapeGeo, massMaterial);
      edgesGeo = new THREE.EdgesGeometry(shapeGeo);

      // Slicing lines at each floor
      const floorLinesGroup = new THREE.Group();
      const floorLineMat = new THREE.LineBasicMaterial({
        color: isSelected ? 0xffffff : 0x7dd3fc,
        transparent: true,
        opacity: 0.75
      });
      for (let f = 1; f < floors; f++) {
        const y = f * floorHeight;
        const linePts = pts.map(p => new THREE.Vector3(p.x, y, p.z));
        linePts.push(new THREE.Vector3(pts[0].x, y, pts[0].z));
        const flGeo = new THREE.BufferGeometry().setFromPoints(linePts);
        floorLinesGroup.add(new THREE.Line(flGeo, floorLineMat));
      }
      group.add(floorLinesGroup);
    }
  }

  if (mesh) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Crisp architectural edge linework
    if (edgesGeo) {
      const edgeColor = isSelected ? 0x00f2fe : 0x0284c7;
      const edgeMat = new THREE.LineBasicMaterial({
        color: edgeColor,
        linewidth: isSelected ? 2 : 1
      });
      const wireframe = new THREE.LineSegments(edgesGeo, edgeMat);
      group.add(wireframe);
    }
  }

  // Position and rotation
  if (mass.position) {
    group.position.set(mass.position.x || 0, mass.position.y || 0, mass.position.z || 0);
  }
  if (typeof mass.rotation === 'number') {
    group.rotation.y = (mass.rotation * Math.PI) / 180;
  }

  // Selection bounding box / handles
  if (isSelected) {
    const box = new THREE.BoxHelper(group, 0x00f2fe);
    group.add(box);
  }

  return group;
}

/**
 * Creates 3D visual lines and translucent zone for site boundary and setbacks
 * @param {Object} parameters
 * @returns {THREE.Group}
 */
export function createSetbackVisualizer3D(parameters) {
  if (typeof THREE === 'undefined') return null;

  const group = new THREE.Group();
  group.name = 'setback-visualizer-group';

  const w = parameters.siteWidth || 50;
  const l = parameters.siteLength || 40;
  const setbacks = parameters.setbacks || { front: 6.0, rear: 3.0, left: 3.0, right: 3.0 };

  const front = Math.max(0, setbacks.front || 0);
  const rear = Math.max(0, setbacks.rear || 0);
  const left = Math.max(0, setbacks.left || 0);
  const right = Math.max(0, setbacks.right || 0);

  // 1. Site Outer Boundary (Crisp White/Cyan line)
  const halfW = w / 2;
  const halfL = l / 2;
  const outerPts = [
    new THREE.Vector3(-halfW, 0.05, -halfL),
    new THREE.Vector3(halfW, 0.05, -halfL),
    new THREE.Vector3(halfW, 0.05, halfL),
    new THREE.Vector3(-halfW, 0.05, halfL),
    new THREE.Vector3(-halfW, 0.05, -halfL)
  ];
  const outerGeo = new THREE.BufferGeometry().setFromPoints(outerPts);
  const outerMat = new THREE.LineBasicMaterial({ color: 0x94a3b8, linewidth: 2 });
  const outerLine = new THREE.Line(outerGeo, outerMat);
  group.add(outerLine);

  // 2. Setback Inner Buildable Boundary (Dashed Cyan line)
  const innerLeft = -halfW + left;
  const innerRight = halfW - right;
  const innerFront = halfL - front; // Front is +Z in standard architectural orientation
  const innerRear = -halfL + rear;

  if (innerRight > innerLeft && innerFront > innerRear) {
    const innerPts = [
      new THREE.Vector3(innerLeft, 0.1, innerRear),
      new THREE.Vector3(innerRight, 0.1, innerRear),
      new THREE.Vector3(innerRight, 0.1, innerFront),
      new THREE.Vector3(innerLeft, 0.1, innerFront),
      new THREE.Vector3(innerLeft, 0.1, innerRear)
    ];
    const innerGeo = new THREE.BufferGeometry().setFromPoints(innerPts);
    const innerMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 1.5,
      gapSize: 1.0,
      linewidth: 2
    });
    const innerLine = new THREE.Line(innerGeo, innerMat);
    innerLine.computeLineDistances();
    group.add(innerLine);

    // 3. Translucent Setback Buffer Zone (amber/cyan tint)
    const shape = new THREE.Shape();
    // Outer boundary
    shape.moveTo(-halfW, -halfL);
    shape.lineTo(halfW, -halfL);
    shape.lineTo(halfW, halfL);
    shape.lineTo(-halfW, halfL);
    shape.closePath();

    // Inner buildable hole
    const hole = new THREE.Path();
    hole.moveTo(innerLeft, innerRear);
    hole.lineTo(innerRight, innerRear);
    hole.lineTo(innerRight, innerFront);
    hole.lineTo(innerLeft, innerFront);
    hole.closePath();
    shape.holes.push(hole);

    const zoneGeo = new THREE.ShapeGeometry(shape);
    zoneGeo.rotateX(Math.PI / 2);
    zoneGeo.scale(1, 1, -1);
    zoneGeo.translate(0, 0.04, 0);

    const zoneMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide
    });
    const zoneMesh = new THREE.Mesh(zoneGeo, zoneMat);
    group.add(zoneMesh);
  }

  return group;
}

/**
 * Splits an existing mass into two conceptual blocks
 * @param {Object} mass
 * @returns {Array<Object>} two new mass definitions
 */
export function divideMass(mass) {
  if (!mass) return null;

  if (mass.type === 'RECTANGLE') {
    const w = mass.width || 20;
    const l = mass.length || 30;

    // Split along longer dimension
    if (l >= w) {
      const halfL = l / 2;
      const massA = {
        ...mass,
        id: `mass-${Date.now()}-A`,
        name: `${mass.name} (Part A)`,
        length: halfL,
        position: {
          x: mass.position.x,
          y: mass.position.y,
          z: mass.position.z - halfL / 2
        }
      };
      const massB = {
        ...mass,
        id: `mass-${Date.now()}-B`,
        name: `${mass.name} (Part B)`,
        length: halfL,
        position: {
          x: mass.position.x,
          y: mass.position.y,
          z: mass.position.z + halfL / 2
        }
      };
      return [massA, massB];
    } else {
      const halfW = w / 2;
      const massA = {
        ...mass,
        id: `mass-${Date.now()}-A`,
        name: `${mass.name} (Part A)`,
        width: halfW,
        position: {
          x: mass.position.x - halfW / 2,
          y: mass.position.y,
          z: mass.position.z
        }
      };
      const massB = {
        ...mass,
        id: `mass-${Date.now()}-B`,
        name: `${mass.name} (Part B)`,
        width: halfW,
        position: {
          x: mass.position.x + halfW / 2,
          y: mass.position.y,
          z: mass.position.z
        }
      };
      return [massA, massB];
    }
  }

  return null;
}
