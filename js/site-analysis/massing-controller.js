/**
 * GM ARCH TOOLS — Conceptual Building Massing Controller
 * Author: Guru Murthy (GM)
 * Provides basic conceptual 3D mass creation & editing for Site Analysis:
 *   - Rectangle (Length, Width, Height)
 *   - Circle / Cylinder (Radius/Diameter, Height)
 *   - Triangle / Prism (Base, Depth, Height)
 *   - Position (X, Z), Height (Y), and Rotation (0-360°)
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
      length: 24,  // X size (m)
      width: 16,   // Z size (m)
      height: 12,  // Y size (m)
      radius: 9,   // For cylinder (m)
      posX: 0,
      posZ: 0,
      rotation: 0  // Degrees
    };

    this.mesh = null;
    this.edgeLines = null;
    this.floorPlates = [];

    // Materials (Clean Architectural Glass & Dark Ceramic)
    this.bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.25,
      metalness: 0.15,
      transparent: true,
      opacity: 0.88,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });

    this.roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.4,
      metalness: 0.2
    });

    this.lineMaterial = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 1.5,
      transparent: true,
      opacity: 0.95
    });

    this.buildMassing();
  }

  buildMassing() {
    // Clean up existing
    while (this.massGroup.children.length > 0) {
      const obj = this.massGroup.children[0];
      this.massGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
    }
    this.floorPlates = [];

    let geom;
    const { length, width, height, radius } = this.params;

    if (this.shapeType === 'CIRCLE') {
      geom = new THREE.CylinderGeometry(radius, radius, height, 32);
    } else if (this.shapeType === 'TRIANGLE') {
      // Prism with triangular base
      const shape = new THREE.Shape();
      const halfL = length / 2;
      const halfW = width / 2;
      shape.moveTo(-halfL, -halfW);
      shape.lineTo(halfL, -halfW);
      shape.lineTo(0, halfW);
      shape.closePath();

      const extrudeSettings = {
        depth: height,
        bevelEnabled: false
      };
      geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geom.center();
      // Rotate so extrusion is along vertical Y axis
      geom.rotateX(Math.PI / 2);
    } else {
      // Default: RECTANGLE (Box)
      geom = new THREE.BoxGeometry(length, height, width);
    }

    this.mesh = new THREE.Mesh(geom, this.bodyMaterial);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.position.y = height / 2; // Sit firmly on ground plane

    // Architectural Edge Linework
    const edges = new THREE.EdgesGeometry(geom, 25);
    this.edgeLines = new THREE.LineSegments(edges, this.lineMaterial);
    this.mesh.add(this.edgeLines);

    // Add conceptual floor levels (every ~3.5m)
    const floorHeight = 3.5;
    const numFloors = Math.floor(height / floorHeight);
    for (let i = 1; i <= numFloors; i++) {
      const floorY = (i * floorHeight) - (height / 2);
      let floorGeom;
      if (this.shapeType === 'CIRCLE') {
        floorGeom = new THREE.RingGeometry(0.1, radius * 0.99, 32);
        floorGeom.rotateX(Math.PI / 2);
      } else if (this.shapeType === 'TRIANGLE') {
        floorGeom = new THREE.PlaneGeometry(length * 0.9, width * 0.9);
        floorGeom.rotateX(Math.PI / 2);
      } else {
        floorGeom = new THREE.PlaneGeometry(length * 0.99, width * 0.99);
        floorGeom.rotateX(Math.PI / 2);
      }

      const floorMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide
      });
      const floorMesh = new THREE.Mesh(floorGeom, floorMat);
      floorMesh.position.y = floorY;
      this.mesh.add(floorMesh);
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

  updateParam(key, value) {
    if (this.params[key] !== undefined) {
      this.params[key] = parseFloat(value);
      if (key === 'posX' || key === 'posZ' || key === 'rotation') {
        this.applyTransform();
      } else {
        this.buildMassing();
      }
    }
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
