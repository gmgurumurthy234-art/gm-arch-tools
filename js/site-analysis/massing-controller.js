/**
 * GM ARCH TOOLS — Conceptual Building Massing Controller (Iteration 02)
 * Author: Guru Murthy (GM)
 * Features:
 *   - Synchronized Floor System: Floors (n) × Floor Height (h) = Total Building Height
 *   - 3D Floor Slabs, Edge Linework, and Ribbon Dividers
 *   - Shape Types: Rectangle, Cylinder (Circle), Prism (Triangle)
 *   - Independent Building Layer Transparency (0% - 100%)
 *   - Real-time Footprint Area and Total Built-up Area Metrics
 */

export class MassingController {
  constructor(scene) {
    this.scene = scene;
    this.massGroup = new THREE.Group();
    this.massGroup.name = 'ConceptualBuildingMassGroup';
    this.scene.add(this.massGroup);

    // Current State
    this.shapeType = 'RECTANGLE'; // 'RECTANGLE' | 'CIRCLE' | 'TRIANGLE'
    this.params = {
      length: 24,       // X dimension (m)
      width: 16,        // Z dimension (m)
      radius: 9,        // For cylinder (m)
      floors: 3,        // Number of floors
      floorHeight: 3.2, // Floor-to-floor height (m)
      height: 9.6,      // Total height = floors * floorHeight (m)
      posX: 0,
      posZ: 0,
      rotation: 0,      // Degrees
      opacity: 0.85
    };

    this.mesh = null;
    this.edgeLines = null;
    this.floorPlateMeshes = [];

    // Architectural Glass & Dark Composite Materials
    this.bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.2,
      metalness: 0.15,
      transparent: true,
      opacity: this.params.opacity,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });

    this.lineMaterial = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 1.5,
      transparent: true,
      opacity: 0.95
    });

    this.floorLineMaterial = new THREE.LineDashedMaterial({
      color: 0x00f2fe,
      dashSize: 1.2,
      gapSize: 0.8,
      transparent: true,
      opacity: 0.6
    });

    this.buildMassing();
  }

  buildMassing() {
    // Clean up existing children
    while (this.massGroup.children.length > 0) {
      const obj = this.massGroup.children[0];
      this.massGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
    }
    this.floorPlateMeshes = [];

    // Ensure synchronized height: floors * floorHeight
    const { length, width, radius, floors, floorHeight } = this.params;
    const totalHeight = floors * floorHeight;
    this.params.height = totalHeight;

    let geom;
    if (this.shapeType === 'CIRCLE') {
      geom = new THREE.CylinderGeometry(radius, radius, totalHeight, 36);
    } else if (this.shapeType === 'TRIANGLE') {
      const shape = new THREE.Shape();
      const halfL = length / 2;
      const halfW = width / 2;
      shape.moveTo(-halfL, -halfW);
      shape.lineTo(halfL, -halfW);
      shape.lineTo(0, halfW);
      shape.closePath();

      const extrudeSettings = { depth: totalHeight, bevelEnabled: false };
      geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geom.center();
      geom.rotateX(Math.PI / 2);
    } else {
      // Default: RECTANGLE
      geom = new THREE.BoxGeometry(length, totalHeight, width);
    }

    this.mesh = new THREE.Mesh(geom, this.bodyMaterial);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.position.y = totalHeight / 2; // Sits exactly on ground datum

    // 1. Crisp Perimeter Edge Linework
    const edges = new THREE.EdgesGeometry(geom, 25);
    this.edgeLines = new THREE.LineSegments(edges, this.lineMaterial);
    this.mesh.add(this.edgeLines);

    // 2. Individual Architectural Floor Plates & Horizontal Slab Lines
    for (let f = 1; f < floors; f++) {
      const floorY = (f * floorHeight) - (totalHeight / 2);

      let floorGeom;
      if (this.shapeType === 'CIRCLE') {
        floorGeom = new THREE.RingGeometry(0.1, radius * 0.99, 36);
        floorGeom.rotateX(Math.PI / 2);
      } else if (this.shapeType === 'TRIANGLE') {
        floorGeom = new THREE.PlaneGeometry(length * 0.98, width * 0.98);
        floorGeom.rotateX(Math.PI / 2);
      } else {
        floorGeom = new THREE.PlaneGeometry(length * 0.99, width * 0.99);
        floorGeom.rotateX(Math.PI / 2);
      }

      const floorMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: Math.min(0.2, this.params.opacity * 0.3),
        side: THREE.DoubleSide
      });
      const floorMesh = new THREE.Mesh(floorGeom, floorMat);
      floorMesh.position.y = floorY;
      this.mesh.add(floorMesh);
      this.floorPlateMeshes.push(floorMesh);

      // Horizontal Floor Divider Line around Perimeter
      let divLineGeom;
      if (this.shapeType === 'CIRCLE') {
        divLineGeom = new THREE.BufferGeometry().setFromPoints(
          new THREE.Path().absarc(0, 0, radius * 1.002, 0, Math.PI * 2, true).getPoints(48)
        );
        divLineGeom.rotateX(Math.PI / 2);
      } else if (this.shapeType === 'TRIANGLE') {
        divLineGeom = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-length / 2, 0, -width / 2),
          new THREE.Vector3(length / 2, 0, -width / 2),
          new THREE.Vector3(0, 0, width / 2),
          new THREE.Vector3(-length / 2, 0, -width / 2)
        ]);
      } else {
        const hL = length / 2;
        const hW = width / 2;
        divLineGeom = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-hL, 0, -hW),
          new THREE.Vector3(hL, 0, -hW),
          new THREE.Vector3(hL, 0, hW),
          new THREE.Vector3(-hL, 0, hW),
          new THREE.Vector3(-hL, 0, -hW)
        ]);
      }

      const divLine = new THREE.Line(divLineGeom, this.floorLineMaterial);
      divLine.computeLineDistances();
      divLine.position.y = floorY;
      this.mesh.add(divLine);
    }

    this.massGroup.add(this.mesh);
    this.applyTransform();
  }

  applyTransform() {
    this.massGroup.position.x = this.params.posX;
    this.massGroup.position.z = this.params.posZ;
    this.massGroup.rotation.y = (this.params.rotation * Math.PI) / 180;
  }

  setShapeType(shape) {
    if (['RECTANGLE', 'CIRCLE', 'TRIANGLE'].includes(shape)) {
      this.shapeType = shape;
      this.buildMassing();
    }
  }

  // Floors Manipulation (Section 12)
  setFloors(n) {
    const floorCount = Math.max(1, Math.min(25, parseInt(n, 10)));
    this.params.floors = floorCount;
    this.params.height = floorCount * this.params.floorHeight;
    this.buildMassing();
  }

  setFloorHeight(h) {
    const fHeight = Math.max(2.4, Math.min(6.0, parseFloat(h)));
    this.params.floorHeight = fHeight;
    this.params.height = this.params.floors * fHeight;
    this.buildMassing();
  }

  setTotalHeight(h) {
    const total = Math.max(2.4, Math.min(80.0, parseFloat(h)));
    this.params.height = total;
    this.params.floors = Math.max(1, Math.round(total / this.params.floorHeight));
    this.buildMassing();
  }

  setOpacity(val) {
    const op = Math.max(0, Math.min(1, parseFloat(val)));
    this.params.opacity = op;
    this.bodyMaterial.opacity = op;
    this.lineMaterial.opacity = Math.max(0.2, op);
    this.floorPlateMeshes.forEach(f => {
      f.material.opacity = Math.min(0.2, op * 0.3);
    });
  }

  updateParam(key, value) {
    if (key === 'floors') {
      this.setFloors(value);
      return;
    }
    if (key === 'floorHeight') {
      this.setFloorHeight(value);
      return;
    }
    if (key === 'height') {
      this.setTotalHeight(value);
      return;
    }
    if (key === 'opacity') {
      this.setOpacity(value);
      return;
    }

    if (this.params[key] !== undefined) {
      this.params[key] = parseFloat(value);
      if (key === 'posX' || key === 'posZ' || key === 'rotation') {
        this.applyTransform();
      } else {
        this.buildMassing();
      }
    }
  }

  getMetrics() {
    let footprint = 0;
    const { length, width, radius, floors, height } = this.params;

    if (this.shapeType === 'CIRCLE') {
      footprint = Math.PI * radius * radius;
    } else if (this.shapeType === 'TRIANGLE') {
      footprint = 0.5 * length * width;
    } else {
      footprint = length * width;
    }

    const totalBuiltUp = footprint * floors;
    return {
      shape: this.shapeType,
      floors,
      floorHeight: this.params.floorHeight,
      totalHeight: height,
      footprint: Math.round(footprint),
      builtUp: Math.round(totalBuiltUp)
    };
  }

  getBounds() {
    const box = new THREE.Box3().setFromObject(this.massGroup);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    return {
      box,
      size,
      center,
      height: this.params.height,
      radius: this.shapeType === 'CIRCLE' ? this.params.radius : Math.max(this.params.length, this.params.width) / 2
    };
  }

  setVisible(visible) {
    this.massGroup.visible = visible;
  }
}
