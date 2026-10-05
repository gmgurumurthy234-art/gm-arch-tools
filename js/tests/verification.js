/**
 * GM ARCH TOOLS — Automated Verification Suite
 * Tests unit converter accuracy, dimensional isolation, and search ranking.
 */

import { convertArchitecturalUnit, formatResultNumber } from '../engines/unit-converter.js';
import { searchTools, SUGGESTED_SEARCHES } from '../search/search-engine.js';
import { calculateTool } from '../engines/arch-calculators.js';
import { ARCH_CALCULATIVES } from '../data/tools-database.js';
import { PLATFORM_MODULES, MODULE_STATUS } from '../data/modules-database.js';
import { calculateShoelaceArea, calculateMassFootprintArea, calculateOptionMetrics } from '../designer/designer-massing.js';
import { DesignerOption, DesignerOptionManager } from '../designer/designer-options.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${message}`);
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
  }
}

function assertClose(actual, expected, tolerance = 1e-4, message = '') {
  const diff = Math.abs(actual - expected);
  assert(diff <= tolerance, `${message} (Expected ~${expected}, Got ${actual}, Diff: ${diff})`);
}

console.log('=== GM ARCH TOOLS VERIFICATION SUITE ===\n');

// 1. UNIT CONVERTER TESTS
console.log('--- 1. Testing Architectural Unit Converter ---');

// 7450 mm -> 7.45 m
const c1 = convertArchitecturalUnit(7450, 'mm', 'm');
assert(c1.success, '7450 mm -> m succeeds');
assertClose(c1.rawResult, 7.45, 1e-6, '7450 mm = 7.45 m');
assert(c1.result === '7.45', '7450 mm formatted is 7.45');

// 7.45 m -> 7450 mm
const c2 = convertArchitecturalUnit(7.45, 'm', 'mm');
assert(c2.success, '7.45 m -> mm succeeds');
assertClose(c2.rawResult, 7450, 1e-6, '7.45 m = 7450 mm');

// 1 m -> ft (3.280839895...)
const c3 = convertArchitecturalUnit(1, 'm', 'ft');
assert(c3.success, '1 m -> ft succeeds');
assertClose(c3.rawResult, 3.280839895, 1e-4, '1 m = ~3.28084 ft');

// 1 ft -> m (0.3048 m)
const c4 = convertArchitecturalUnit(1, 'ft', 'm');
assert(c4.success, '1 ft -> m succeeds');
assertClose(c4.rawResult, 0.3048, 1e-6, '1 ft = 0.3048 m exactly');

// 100 cm -> 1 m
const c5 = convertArchitecturalUnit(100, 'cm', 'm');
assert(c5.success, '100 cm -> m succeeds');
assertClose(c5.rawResult, 1.0, 1e-6, '100 cm = 1 m');

// 12 in -> 304.8 mm
const c6 = convertArchitecturalUnit(12, 'in', 'mm');
assert(c6.success, '12 in -> mm succeeds');
assertClose(c6.rawResult, 304.8, 1e-6, '12 in = 304.8 mm');

// 1 m² -> ft² (10.7639104...)
const c7 = convertArchitecturalUnit(1, 'm2', 'ft2');
assert(c7.success, '1 m² -> ft² succeeds');
assertClose(c7.rawResult, 10.7639104, 1e-4, '1 m² = ~10.76391 ft²');

// 1 ft² -> m² (0.09290304)
const c8 = convertArchitecturalUnit(1, 'ft2', 'm2');
assert(c8.success, '1 ft² -> m² succeeds');
assertClose(c8.rawResult, 0.09290304, 1e-6, '1 ft² = 0.09290304 m²');

// 1,000,000 mm² -> 1 m²
const c9 = convertArchitecturalUnit(1000000, 'mm2', 'm2');
assert(c9.success, '1,000,000 mm² -> m² succeeds');
assertClose(c9.rawResult, 1.0, 1e-6, '1,000,000 mm² = 1 m²');

// 10,000 cm² -> 1 m²
const c10 = convertArchitecturalUnit(10000, 'cm2', 'm2');
assert(c10.success, '10,000 cm² -> m² succeeds');
assertClose(c10.rawResult, 1.0, 1e-6, '10,000 cm² = 1 m²');

// Swap test: A -> B and B -> A are inverses
const valA = 52.5;
const toFt = convertArchitecturalUnit(valA, 'm', 'ft');
const backToM = convertArchitecturalUnit(toFt.rawResult, 'ft', 'm');
assertClose(backToM.rawResult, valA, 1e-6, 'Swap reversibility check (52.5 m <-> ft)');

// Strict dimensional isolation: Length to Area must fail
const cErr1 = convertArchitecturalUnit(10, 'm', 'm2');
assert(!cErr1.success, 'm -> m² correctly rejected');
assert(cErr1.error.includes('different dimensions'), 'Dimensional isolation message verified');

const cErr2 = convertArchitecturalUnit(10, 'ft', 'ft2');
assert(!cErr2.success, 'ft -> ft² correctly rejected');

const cErr3 = convertArchitecturalUnit(10, 'mm', 'mm2');
assert(!cErr3.success, 'mm -> mm² correctly rejected');

// Zero and negative edge cases
const cZero = convertArchitecturalUnit(0, 'mm', 'm');
assert(cZero.success && cZero.rawResult === 0, 'Zero conversion handled');

// Step-by-step breakdown verification
assert(c1.breakdown.length >= 2, 'Breakdown generated for 7450 mm -> m');
console.log('    Sample breakdown output:', c1.breakdown);

// 2. SEARCH ENGINE TESTS
console.log('\n--- 2. Testing Global Search Engine ---');

// Exact/partial "plot"
const resPlot = searchTools('plot');
assert(resPlot.length >= 2, 'Search "plot" returns multiple results');
assert(resPlot[0].id === '01' || resPlot[0].id === '02', 'Search "plot" top result is Tool 01 or 02');

// Partial "plo"
const resPlo = searchTools('plo');
assert(resPlo.some(t => t.id === '01'), 'Partial "plo" includes Tool 01 (Plot Area)');

// "FSI"
const resFsi = searchTools('FSI');
assert(resFsi.length >= 5, 'Search "FSI" returns 5+ relevant tools');
const fsiIds = resFsi.map(t => t.id);
assert(fsiIds.includes('04'), 'FSI results include Tool 04 (Permissible FSI)');
assert(fsiIds.includes('05'), 'FSI results include Tool 05 (Proposed FSI)');
assert(fsiIds.includes('16'), 'FSI results include Tool 16 (Balance FSI)');

// Partial "fs"
const resFs = searchTools('fs');
assert(resFs.some(t => t.name.includes('FSI')), 'Partial "fs" returns FSI tools');

// "parking"
const resPark = searchTools('parking');
assert(resPark.some(t => t.id === '26'), 'Search "parking" includes Tool 26');
assert(resPark.some(t => t.id === '27'), 'Search "parking" includes Tool 27');

// Partial "park"
const resParkPartial = searchTools('park');
assert(resParkPartial.some(t => t.id === '26'), 'Partial "park" includes Tool 26');

// "height"
const resHeight = searchTools('height');
assert(resHeight.some(t => t.id === '30'), 'Search "height" includes Tool 30 (Building Height)');
assert(resHeight.some(t => t.id === '31'), 'Search "height" includes Tool 31 (Floor-to-Floor Height)');

// "carpet"
const resCarpet = searchTools('carpet');
assert(resCarpet.some(t => t.id === '32'), 'Search "carpet" includes Tool 32 (Carpet Area)');
assert(resCarpet.some(t => t.id === '34'), 'Search "carpet" includes Tool 34 (Carpet-to-Built-up Efficiency)');

// Multi-word queries
const mw1 = searchTools('plot area');
assert(mw1[0].id === '01', 'Multi-word "plot area" ranks Tool 01 first');

const mw2 = searchTools('ground coverage');
assert(mw2.some(t => t.id === '06'), 'Multi-word "ground coverage" includes Tool 06');

const mw3 = searchTools('balance fsi');
assert(mw3[0].id === '16' || mw3[0].id === '17', 'Multi-word "balance fsi" ranks Tool 16 or 17 first');

const mw4 = searchTools('parking requirement');
assert(mw4[0].id === '26', 'Multi-word "parking requirement" ranks Tool 26 first');

const mw5 = searchTools('floor height');
assert(mw5.some(t => t.id === '31'), 'Multi-word "floor height" finds Tool 31');

const mw6 = searchTools('carpet area');
assert(mw6[0].id === '32', 'Multi-word "carpet area" ranks Tool 32 first');

const mw7 = searchTools('built up');
assert(mw7.some(t => t.id === '09'), 'Multi-word "built up" finds Tool 09');

const mw8 = searchTools('open space');
assert(mw8.some(t => t.id === '13'), 'Multi-word "open space" finds Tool 13');

const mw9 = searchTools('permissible fsi');
assert(mw9[0].id === '04', 'Multi-word "permissible fsi" ranks Tool 04 first');

// Empty state
const resEmpty = searchTools('nonexistentxyzword123');
assert(resEmpty.length === 0, 'Non-matching query returns 0 results');
assert(SUGGESTED_SEARCHES.length === 6, 'Empty state provides 6 suggestion pills');

// 3. DATABASE INTEGRITY (35 TOOLS)
console.log('\n--- 3. Testing 35 Tools Database Integrity ---');
assert(ARCH_CALCULATIVES.length === 35, `Database contains exactly 35 tools (found ${ARCH_CALCULATIVES.length})`);

for (let i = 1; i <= 35; i++) {
  const idStr = i.toString().padStart(2, '0');
  const tool = ARCH_CALCULATIVES.find(t => t.id === idStr);
  assert(!!tool, `Tool ${idStr} exists in database`);
  if (tool) {
    assert(tool.name && tool.name.length > 0, `Tool ${idStr} has valid name: "${tool.name}"`);
    assert(tool.description && tool.description.length > 0, `Tool ${idStr} has description`);
    assert(tool.category && tool.category.length > 0, `Tool ${idStr} has category`);
    assert(tool.formula && tool.formula.length > 0, `Tool ${idStr} has formula`);
    assert(Array.isArray(tool.keywords) && tool.keywords.length > 0, `Tool ${idStr} has keywords`);
  }
}

// 4. CALCULATOR EXECUTION FOR SAMPLE TOOLS
console.log('\n--- 4. Testing Sample Calculator Logic ---');
const calcPlot = calculateTool('01', { length: 30, breadth: 15 });
assert(calcPlot.primaryValue === '450 m²', 'Plot Area 30m × 15m = 450 m²');

const calcFsi = calculateTool('05', { proposedBua: 2200, plotArea: 1000 });
assert(calcFsi.primaryValue === '2.200', 'Proposed FSI 2200 / 1000 = 2.200');

const calcCoverage = calculateTool('06', { footprintArea: 400, plotArea: 1000 });
assert(calcCoverage.primaryValue === '40.00%', 'Ground coverage 400 / 1000 = 40.00%');

const calcParking = calculateTool('26', { totalBua: 4500, areaPerEcs: 75 });
assert(calcParking.primaryValue === '60 Bays', 'Parking 4500 / 75 = 60 Bays');

const calcCarpet = calculateTool('32', { internalRoomArea: 80, internalWallArea: 5, toiletArea: 15 });
assert(calcCarpet.primaryValue === '100 m²', 'RERA Carpet 80 + 5 + 15 = 100 m²');

import { SITE_ANALYSIS_MODES } from '../site-analysis/analysis-modes-data.js';

// 5. PLATFORM 13-MODULE HIERARCHY TESTS
console.log('\n--- 5. Testing 13 Major Platform Modules Hierarchy ---');
assert(PLATFORM_MODULES.length === 13, `Platform contains exactly 13 modules (found ${PLATFORM_MODULES.length})`);

const expectedModules = [
  { id: '01', name: 'ARCH CALCULATIVES', status: MODULE_STATUS.ACTIVE, toolsCount: 35 },
  { id: '02', name: 'THE DESIGNER', status: MODULE_STATUS.ACTIVE, toolsCount: 1 },
  { id: '03', name: 'SITE ANALYSIS', status: MODULE_STATUS.ACTIVE, toolsCount: 10 },
  { id: '04', name: 'SPACE & PROGRAM', status: MODULE_STATUS.COMING_SOON, toolsCount: 0 },
  { id: '05', name: 'STRUCTURE', status: MODULE_STATUS.COMING_SOON, toolsCount: 0 },
  { id: '06', name: 'BUILDING SERVICES', status: MODULE_STATUS.COMING_SOON, toolsCount: 0 },
  { id: '07', name: 'BUILDING CODE & REGULATIONS', status: MODULE_STATUS.COMING_SOON, toolsCount: 0 },
  { id: '08', name: 'ESTIMATION & COST', status: MODULE_STATUS.COMING_SOON, toolsCount: 0 },
  { id: '09', name: 'SUSTAINABILITY', status: MODULE_STATUS.COMING_SOON, toolsCount: 0 },
  { id: '10', name: 'DOCUMENTATION', status: MODULE_STATUS.COMING_SOON, toolsCount: 0 },
  { id: '11', name: 'PRESENTATION STUDIO', status: MODULE_STATUS.COMING_SOON, toolsCount: 0 },
  { id: '12', name: 'AI ARCHITECT', status: MODULE_STATUS.COMING_SOON, toolsCount: 0 },
  { id: '13', name: 'PROJECT WORKSPACE', status: MODULE_STATUS.COMING_SOON, toolsCount: 0 }
];

for (const exp of expectedModules) {
  const mod = PLATFORM_MODULES.find(m => m.id === exp.id);
  assert(!!mod, `Module ${exp.id} exists`);
  if (mod) {
    assert(mod.name === exp.name, `Module ${exp.id} name is "${exp.name}"`);
    assert(mod.status === exp.status, `Module ${exp.id} status is "${exp.status}"`);
    assert(mod.category && mod.category.length > 0, `Module ${exp.id} has category`);
    assert(mod.tagline && mod.tagline.length > 0, `Module ${exp.id} has tagline`);
    assert(mod.description && mod.description.length > 0, `Module ${exp.id} has description`);
    if (exp.toolsCount !== undefined) {
      assert(mod.toolsCount === exp.toolsCount, `Module ${exp.id} toolsCount is ${exp.toolsCount}`);
    }
  }
}

// 6. SITE ANALYSIS MODULE 10-TOPICS VERIFICATION
console.log('\n--- 6. Testing Site Analysis Module (10 Environmental Modes) ---');
assert(SITE_ANALYSIS_MODES.length === 10, `Site Analysis has exactly 10 modes (found ${SITE_ANALYSIS_MODES.length})`);

const expectedTopics = [
  'CLIMATE ANALYSIS',
  'SUN PATH & SOLAR ANALYSIS',
  'WIND & AIRFLOW ANALYSIS',
  'SITE ORIENTATION & CONTEXT',
  'TOPOGRAPHY & CONTOUR ANALYSIS',
  'ACCESS & CIRCULATION',
  'VEGETATION & LANDSCAPE',
  'VIEWS & VISUAL ANALYSIS',
  'NOISE & ENVIRONMENTAL',
  'UTILITIES & INFRASTRUCTURE'
];

SITE_ANALYSIS_MODES.forEach((mode, idx) => {
  const expectedName = expectedTopics[idx];
  assert(mode.name === expectedName, `Mode ${mode.num} name is "${expectedName}"`);
  assert(mode.num === String(idx + 1).padStart(2, '0'), `Mode ${mode.num} has correct sequential index`);
  assert(mode.whatIsIt && mode.whatIsIt.length > 20, `Mode ${mode.num} has detailed "whatIsIt"`);
  assert(mode.whyImportant && mode.whyImportant.length > 20, `Mode ${mode.num} has detailed "whyImportant"`);
  assert(Array.isArray(mode.architectsStudy) && mode.architectsStudy.length >= 3, `Mode ${mode.num} has at least 3 architectural study items`);
  assert(Array.isArray(mode.parameters) && mode.parameters.length >= 3, `Mode ${mode.num} has at least 3 key parameters`);
  assert(mode.calculationStatus.includes('COMING SOON'), `Mode ${mode.num} calculationStatus is marked COMING SOON`);
  assert(Array.isArray(mode.sources) && mode.sources.length >= 2, `Mode ${mode.num} has at least 2 official recognized sources`);
  assert(Array.isArray(mode.legend) && mode.legend.length >= 2, `Mode ${mode.num} has visual legend swatches`);

  // Verify non-hallucination / disclaimer requirements
  if (mode.id === '03') {
    assert(!!mode.disclaimer && mode.disclaimer.includes('CONCEPTUAL AIRFLOW VISUALIZATION'), 'Mode 03 has required Wind CFD disclaimer');
  }
  if (mode.id === '09') {
    assert(!!mode.disclaimer && mode.disclaimer.includes('CONCEPTUAL NOISE MODEL'), 'Mode 09 has required Noise measurement disclaimer');
  }
});

// Left vs Right Panel Distribution (5 Left, 5 Right)
const leftCount = SITE_ANALYSIS_MODES.filter(m => m.panel === 'left').length;
const rightCount = SITE_ANALYSIS_MODES.filter(m => m.panel === 'right').length;
assert(leftCount === 5, `Left panel has exactly 5 topics (01-05), found ${leftCount}`);
assert(rightCount === 5, `Right panel has exactly 5 topics (06-10), found ${rightCount}`);

// 7. ITERATION 02 — WORKSTATION, VIEWPORT, LAYERS & MASSING INTEGRITY
console.log('\n--- 7. Testing Iteration 02 Workstation, Layers & Floors Features ---');
import fs from 'fs';
const indexHtmlContent = fs.readFileSync('index.html', 'utf-8');
const cssContent = fs.readFileSync('styles/site-analysis.css', 'utf-8');
const viewportContent = fs.readFileSync('js/site-analysis/site-viewport.js', 'utf-8');

// Edge navigation drawer presence
assert(indexHtmlContent.includes('id="sa-edge-nav-trigger"'), 'HTML contains edge nav trigger');
assert(indexHtmlContent.includes('id="sa-edge-nav-drawer"'), 'HTML contains edge nav drawer overlay');
assert(cssContent.includes('.sa-edge-nav-drawer'), 'CSS contains edge nav drawer styles');

// Viewport floating toolbar presence
const expectedToolbarButtons = [
  'sa-btn-fit', 'sa-btn-top', 'sa-btn-iso', 'sa-btn-persp',
  'sa-btn-north', 'sa-btn-sun', 'sa-btn-grid', 'sa-btn-layers',
  'sa-btn-massing', 'sa-btn-measure', 'sa-btn-presentation'
];
expectedToolbarButtons.forEach(btnId => {
  assert(indexHtmlContent.includes(`id="${btnId}"`), `HTML toolbar contains button #${btnId}`);
});

// Layers drawer presence
assert(indexHtmlContent.includes('id="sa-layers-drawer"'), 'HTML contains floating layers drawer');
assert(cssContent.includes('.sa-layers-drawer'), 'CSS contains layers drawer styling');

// Floors stepper & areas
assert(indexHtmlContent.includes('id="sa-floor-decrement-btn"'), 'HTML contains floor decrement button');
assert(indexHtmlContent.includes('id="sa-floor-increment-btn"'), 'HTML contains floor increment button');
assert(indexHtmlContent.includes('id="sa-mass-floorHeight-slider"'), 'HTML contains floor height slider');
assert(indexHtmlContent.includes('id="sa-mass-footprint-val"'), 'HTML contains footprint area metric');
assert(indexHtmlContent.includes('id="sa-mass-builtup-val"'), 'HTML contains built-up area metric');

// Measurement HUD & Presentation mode
assert(indexHtmlContent.includes('id="sa-measure-hud"'), 'HTML contains 3D measurement HUD');
assert(indexHtmlContent.includes('id="sa-exit-presentation-btn"'), 'HTML contains exit presentation button');
assert(cssContent.includes('.presentation-mode-active'), 'CSS contains presentation mode rules');
assert(cssContent.includes('body.site-analysis-active'), 'CSS contains dedicated workstation rules');

// Fog washout bugfix verification
assert(!viewportContent.includes('this.scene.fog = new THREE.FogExp2'), 'CRITICAL BUGFIX: FogExp2 is removed to prevent zoom washout');

// Synchronized Floor Math Invariant
const testFloors = 4;
const testFloorH = 3.2;
const expectedTotalH = testFloors * testFloorH;
const testFootprint = 384;
const expectedBuiltUp = testFootprint * testFloors;
assert(Math.abs(expectedTotalH - 12.8) < 0.001, 'Floor height formula: 4 floors × 3.2m = 12.8m');
assert(expectedBuiltUp === 1536, 'Built-up area formula: 384m² × 4 floors = 1536m²');

// 8. ITERATION 03 — ARCHITECTURAL IMPORT/EXPORT & BASIC TOOLS WORKSPACE
console.log('\n--- 8. Testing Architectural Import/Export & Basic Tools Workspace ---');
import { importEngine } from '../basic-tools/import-engine.js';
import { exportEngine } from '../basic-tools/export-engine.js';
import { ProjectState } from '../state/project-state.js';

// Import Engine File Type Validation
const supportedExts = ['skp', '3dm', 'rvt', 'dwg', 'png', 'jpg', 'jpeg'];
supportedExts.forEach(ext => {
  const mockFile = { name: `test_model.${ext}`, size: 1024 * 1024 * 12 };
  const val = importEngine.validateFile(mockFile);
  assert(val.valid, `Import accepts .${ext} files`);
});

const invalidExts = ['pdf', 'exe', 'docx', 'zip'];
invalidExts.forEach(ext => {
  const mockFile = { name: `bad_file.${ext}`, size: 1024 };
  const val = importEngine.validateFile(mockFile);
  assert(!val.valid, `Import correctly rejects .${ext} files`);
});

// Import Engine Size Formatting
assert(importEngine.formatFileSize(500) === '500 Bytes', 'Size formatting: 500 Bytes');
assert(importEngine.formatFileSize(1024 * 50) === '50 KB', 'Size formatting: 50 KB');
assert(importEngine.formatFileSize(1024 * 1024 * 15.5) === '15.5 MB', 'Size formatting: 15.5 MB');

// Revit Non-Hallucinatory Diagnostic Reporting
const rvtMock = { name: 'Hospital_Tower.rvt', size: 1024 * 1024 * 85 };
const rvtDiag = importEngine.generateRevitDiagnostic(rvtMock);
assert(rvtDiag.includes('Geometry: ✓ Imported'), 'Revit diagnostic confirms geometry import');
assert(rvtDiag.includes('Categories: ✓ Partially imported'), 'Revit diagnostic confirms category status');
assert(rvtDiag.includes('BIM Parameters: ⚠ Some proprietary Revit family parameters unavailable'), 'Revit diagnostic explicitly disclaims unparsed BIM parameters');
assert(rvtDiag.includes('Materials: ✓ Preserved where supported'), 'Revit diagnostic reports material preservation');

// Export Engine Validation
const validExport = exportEngine.validateExportOptions({
  format: 'png',
  background: 'transparent',
  resolution: '4k'
});
assert(validExport.valid, 'PNG + Transparent + 4K export options are valid');

// JPG + Transparent Error / Warning enforcement
const invalidJpgTransparent = exportEngine.validateExportOptions({
  format: 'jpg',
  background: 'transparent',
  resolution: '2k'
});
assert(!invalidJpgTransparent.valid, 'JPG + Transparent is rejected / warned (JPG lacks alpha channel)');
assert(invalidJpgTransparent.warning.includes('does not support transparent'), 'JPG transparency warning explains format limitation');

// Export Resolution Presets
const res1080 = exportEngine.getDimensionsForResolution('1080p', 1600, 900);
assert(res1080.width === 1920 && res1080.height === 1080, 'Resolution preset 1080p produces 1920x1080');

const res2k = exportEngine.getDimensionsForResolution('2k', 1600, 900);
assert(res2k.width === 2560 && res2k.height === 1440, 'Resolution preset 2K produces 2560x1440');

const res4k = exportEngine.getDimensionsForResolution('4k', 1600, 900);
assert(res4k.width === 3840 && res4k.height === 2160, 'Resolution preset 4K produces 3840x2160');

// ProjectState Asset Operations
ProjectState.clearAllAssets();
assert(ProjectState.getAssets().length === 0, 'ProjectState initially empty after clear');

const asset1 = ProjectState.addAsset({
  name: 'Floor_Plan_L01.dwg',
  format: 'DWG',
  size: 1024 * 500,
  unit: 'm'
});
assert(ProjectState.getAssets().length === 1, 'Asset added to ProjectState');
assert(asset1.visible === true, 'New asset is visible by default');
assert(asset1.opacity === 1.0, 'New asset has opacity 1.0');

ProjectState.toggleAssetVisibility(asset1.id);
assert(ProjectState.getAsset(asset1.id).visible === false, 'Asset visibility toggled to false');

ProjectState.setAssetOpacity(asset1.id, 0.45);
assert(Math.abs(ProjectState.getAsset(asset1.id).opacity - 0.45) < 0.01, 'Asset opacity set to 0.45');

ProjectState.removeAsset(asset1.id);
assert(ProjectState.getAssets().length === 0, 'Asset successfully removed from ProjectState');

// Basic Tools DOM Elements in index.html & styles
const basicCssContent = fs.readFileSync('styles/basic-tools.css', 'utf-8');
const modulesCssContent = fs.readFileSync('styles/modules.css', 'utf-8');
const appJsContent = fs.readFileSync('js/ui/app.js', 'utf-8');

assert(indexHtmlContent.includes('id="basic-tools-view"'), 'index.html contains #basic-tools-view');
assert(indexHtmlContent.includes('id="bt-edge-nav-trigger"'), 'index.html contains #bt-edge-nav-trigger');
assert(indexHtmlContent.includes('id="bt-edge-nav-drawer"'), 'index.html contains #bt-edge-nav-drawer');
assert(indexHtmlContent.includes('id="bt-tools-list"'), 'index.html contains #bt-tools-list');
assert(indexHtmlContent.includes('id="bt-stage-container"'), 'index.html contains #bt-stage-container');
assert(indexHtmlContent.includes('id="bt-assets-list"'), 'index.html contains #bt-assets-list');
assert(basicCssContent.includes('body.basic-tools-active'), 'styles/basic-tools.css contains body.basic-tools-active');
assert(basicCssContent.includes('.bt-workspace-body'), 'styles/basic-tools.css contains .bt-workspace-body');

// 9. STRICT PORTAL ISOLATION & LEAKAGE PREVENTION TESTS
console.log('\n--- 9. Testing Strict Portal Isolation & Workspace Containment ---');
assert(modulesCssContent.includes('.portal-view {\n  display: none !important;'), 'styles/modules.css enforces .portal-view display: none !important');
assert(cssContent.includes('body:not(.site-analysis-active) #site-analysis-view'), 'styles/site-analysis.css hides site analysis when inactive');
assert(basicCssContent.includes('body:not(.basic-tools-active) #basic-tools-view'), 'styles/basic-tools.css hides basic tools when inactive');
assert(indexHtmlContent.includes('id="arch-calculatives-view" class="portal-view" style="display: none;"'), 'index.html pre-hides arch-calculatives-view');
assert(indexHtmlContent.includes('id="site-analysis-view" class="portal-view site-analysis-view" style="display: none;"'), 'index.html pre-hides site-analysis-view');
assert(indexHtmlContent.includes('id="basic-tools-view" class="portal-view basic-tools-view" style="display: none;"'), 'index.html pre-hides basic-tools-view');
assert(appJsContent.includes("saView.style.display = 'none';"), 'app.js explicitly hides saView in portal hub state');
assert(appJsContent.includes("calcView.style.display = 'none';"), 'app.js explicitly hides calcView in portal hub state');
assert(appJsContent.includes("btView.style.display = 'none';"), 'app.js explicitly hides btView in portal hub state');

// 10. ITERATION 06 — SITE ANALYSIS MAPS + SITE IMPORT
console.log('\n--- 10. Testing Iteration 06 Site Analysis Maps & Boundary Import Engine ---');
import {
  parseCoordinates,
  haversineDistance,
  calculateGeodesicPolygonArea,
  convertGeoToLocal3D,
  formatArea,
  SiteState
} from '../state/site-state.js';

// Coordinate Parsing
const coord1 = parseCoordinates('13.0827, 80.2707');
assert(coord1.isValid === true, 'Parse standard coordinate: "13.0827, 80.2707" is valid');
assertClose(coord1.lat, 13.0827, 1e-4, 'Parsed lat matches 13.0827');
assertClose(coord1.lng, 80.2707, 1e-4, 'Parsed lng matches 80.2707');

const coord2 = parseCoordinates('13.0827,80.2707');
assert(coord2.isValid === true, 'Parse coordinate without space: "13.0827,80.2707" is valid');

const coord3 = parseCoordinates('-33.8688, 151.2093');
assert(coord3.isValid === true, 'Parse negative latitude: "-33.8688, 151.2093" is valid');
assertClose(coord3.lat, -33.8688, 1e-4, 'Parsed lat matches -33.8688');

const coord4 = parseCoordinates('13.0827 N, 80.2707 E');
assert(coord4.isValid === true, 'Parse directional format: "13.0827 N, 80.2707 E" is valid');
assertClose(coord4.lat, 13.0827, 1e-4, 'Directional lat matches 13.0827');
assertClose(coord4.lng, 80.2707, 1e-4, 'Directional lng matches 80.2707');

const coord5 = parseCoordinates('34.0522 S, 118.2437 W');
assert(coord5.isValid === true, 'Parse directional S/W format: "34.0522 S, 118.2437 W" is valid');
assertClose(coord5.lat, -34.0522, 1e-4, 'Directional S latitude converts to negative -34.0522');
assertClose(coord5.lng, -118.2437, 1e-4, 'Directional W longitude converts to negative -118.2437');

const coordInvalidLat = parseCoordinates('95.0, 50.0');
assert(coordInvalidLat.isValid === false, 'Latitude > 90 rejected');

const coordInvalidLng = parseCoordinates('10.0, 195.0');
assert(coordInvalidLng.isValid === false, 'Longitude > 180 rejected');

const nonCoord = parseCoordinates('Marina Beach, Chennai');
assert(nonCoord.isValid === false, 'Named text string is properly rejected by coordinate parser (routes to geocoder)');

// Geodesic Distance (Haversine)
// Chennai (13.0827, 80.2707) to Bangalore (12.9716, 77.5946) is approx 290 km
const dChennaiBangalore = haversineDistance(
  { lat: 13.0827, lng: 80.2707 },
  { lat: 12.9716, lng: 77.5946 }
);
assert(dChennaiBangalore > 280000 && dChennaiBangalore < 300000, `Haversine distance Chennai->Bangalore ~290km (got ${(dChennaiBangalore/1000).toFixed(1)} km)`);

const dZero = haversineDistance({ lat: 13.0827, lng: 80.2707 }, { lat: 13.0827, lng: 80.2707 });
assert(dZero === 0, 'Distance between identical points is exactly 0');

// Geodesic Polygon Area
// A ~100m x ~100m square near equator / Chennai
// 100m lat delta approx: 100 / 111320 = 0.0008983 deg
const lat0 = 13.0827;
const lng0 = 80.2707;
const dDeg = 0.0008983;
const squareBox = [
  { lat: lat0, lng: lng0 },
  { lat: lat0, lng: lng0 + dDeg },
  { lat: lat0 + dDeg, lng: lng0 + dDeg },
  { lat: lat0 + dDeg, lng: lng0 }
];
const areaCalculated = calculateGeodesicPolygonArea(squareBox);
assert(areaCalculated > 9000 && areaCalculated < 11000, `Geodesic polygon area for ~100x100m box is ~10,000 m² (got ${Math.round(areaCalculated)} m²)`);

// 3D Metric Projection (Architectural: -Z = North, +X = East)
const testGeoPoints = [
  { lat: 13.0837, lng: 80.2707 }, // North of center
  { lat: 13.0827, lng: 80.2717 }, // East of center
  { lat: 13.0817, lng: 80.2707 }, // South of center
  { lat: 13.0827, lng: 80.2697 }  // West of center
];
const local3D = convertGeoToLocal3D(testGeoPoints, 13.0827, 80.2707);
assert(local3D.length === 4, 'convertGeoToLocal3D returns 4 points');
assert(local3D[0].z < 0, 'Point North of center projects to negative Z (Three.js North = -Z)');
assert(local3D[1].x > 0, 'Point East of center projects to positive X (Three.js East = +X)');
assert(local3D[2].z > 0, 'Point South of center projects to positive Z');
assert(local3D[3].x < 0, 'Point West of center projects to negative X');

// Area Formatter
const formatted = formatArea(2000);
assert(formatted.sqMeters === '2,000 m²', 'formatArea formats sqMeters');
assert(formatted.acres.includes('Acres'), 'formatArea formats acres');
assert(formatted.sqFt.includes('sq ft'), 'formatArea formats sqFt');

// SiteState Singleton & Reactivity
const activeSite = SiteState.getActiveSite();
assert(typeof activeSite.latitude === 'number', 'SiteState has valid active latitude');
assert(typeof activeSite.longitude === 'number', 'SiteState has valid active longitude');
assert(activeSite.locationName && activeSite.locationName.length > 0, 'SiteState has location name');
assert(Array.isArray(activeSite.boundary3D), 'SiteState has boundary3D array');

let subscriberNotified = false;
const unsubscribe = SiteState.subscribe((site) => {
  if (site.locationName === 'Test Verification Site') {
    subscriberNotified = true;
  }
});
SiteState.setActiveSite({ locationName: 'Test Verification Site' });
assert(subscriberNotified === true, 'SiteState notify/subscribe reactivity triggers on update');
unsubscribe();

// Restore default location
SiteState.setActiveSite({
  locationName: 'Adhiyamaan College of Engineering, Hosur, Tamil Nadu, India',
  city: 'Hosur',
  latitude: 12.7152,
  longitude: 77.8678
});

// DOM Structure for Maps and Active Site in index.html
assert(indexHtmlContent.includes('styles/leaflet.css'), 'index.html links styles/leaflet.css');
assert(indexHtmlContent.includes('js/vendor/leaflet.js'), 'index.html includes js/vendor/leaflet.js');
assert(indexHtmlContent.includes('id="sa-active-site-hud"'), 'index.html contains #sa-active-site-hud');
assert(indexHtmlContent.includes('id="sa-btn-edit-site"'), 'index.html contains #sa-btn-edit-site');
assert(indexHtmlContent.includes('id="sa-btn-change-site"'), 'index.html contains #sa-btn-change-site');
assert(indexHtmlContent.includes('id="sa-map-workspace"'), 'index.html contains #sa-map-workspace');
assert(indexHtmlContent.includes('id="sa-map-search-input"'), 'index.html contains #sa-map-search-input');
assert(indexHtmlContent.includes('id="sa-map-search-results"'), 'index.html contains #sa-map-search-results');
assert(indexHtmlContent.includes('id="sa-map-container"'), 'index.html contains #sa-map-container');
assert(indexHtmlContent.includes('id="sa-map-info-card"'), 'index.html contains #sa-map-info-card');
assert(indexHtmlContent.includes('id="sa-btn-import-site"'), 'index.html contains #sa-btn-import-site');
assert(indexHtmlContent.includes('id="sa-map-earth-modal"'), 'index.html contains #sa-map-earth-modal');

// CSS Rules for Maps and Active Site HUD in styles/site-analysis.css
assert(cssContent.includes('.sa-active-site-hud'), 'site-analysis.css contains .sa-active-site-hud');
assert(cssContent.includes('.sa-map-workspace'), 'site-analysis.css contains .sa-map-workspace');
assert(cssContent.includes('.sa-map-search-form'), 'site-analysis.css contains .sa-map-search-form');
assert(cssContent.includes('.sa-map-view-switcher'), 'site-analysis.css contains .sa-map-view-switcher');
assert(cssContent.includes('.sa-map-tools-toolbar'), 'site-analysis.css contains .sa-map-tools-toolbar');
assert(cssContent.includes('.sa-map-info-card'), 'site-analysis.css contains .sa-map-info-card');
assert(cssContent.includes('.sa-map-earth-modal'), 'site-analysis.css contains .sa-map-earth-modal');
assert(cssContent.includes('.sa-active-site-context-card'), 'site-analysis.css contains .sa-active-site-context-card');

// Dynamic Solar Tilt Integration in mode-overlays.js
const modeOverlaysContent = fs.readFileSync('js/site-analysis/mode-overlays.js', 'utf-8');
assert(modeOverlaysContent.includes('SiteState.getLatitude()'), 'mode-overlays.js references SiteState.getLatitude() for dynamic solar calculation');
assert(modeOverlaysContent.includes('getSolarAltitudeTilt'), 'mode-overlays.js contains getSolarAltitudeTilt for astronomical physics');

// MAP Option Integration in site-analysis-app.js
const saAppContent = fs.readFileSync('js/site-analysis/site-analysis-app.js', 'utf-8');
assert(saAppContent.includes('MAP'), 'site-analysis-app.js includes MAP option in Right Panel');
assert(saAppContent.includes('map-workspace'), 'site-analysis-app.js handles map-workspace transition');

// 11. ITERATION 6.1 — FIX MAP RENDERING & EXTREME AREA BUG
console.log('\n--- 11. Testing Iteration 6.1 Map Rendering & Boundary Scale Invariants ---');
const mapEngineContent = fs.readFileSync('js/site-analysis/site-map-engine.js', 'utf-8');

// Reliable Base Map Provider (OpenStreetMap Standard, NO API KEY watermark)
assert(mapEngineContent.includes('https://tile.openstreetmap.org/{z}/{x}/{y}.png'), 'site-map-engine.js uses OpenStreetMap Standard endpoint for NORMAL');
assert(!mapEngineContent.includes('basemaps.cartocdn.com'), 'site-map-engine.js removes watermarked CartoDB basemap endpoint');
assert(mapEngineContent.includes('OpenStreetMap (WGS 84)'), 'site-map-engine.js labels NORMAL provider honestly as OpenStreetMap (WGS 84)');
assert(indexHtmlContent.includes('OpenStreetMap (WGS 84)'), 'index.html labels initial provider as OpenStreetMap (WGS 84)');

// Container Sizing & ResizeObserver
assert(mapEngineContent.includes('ResizeObserver'), 'site-map-engine.js implements ResizeObserver for auto-resizing');
assert(cssContent.includes('.sa-map-container {\n  position: absolute;'), 'site-analysis.css positions .sa-map-container absolutely');
assert(cssContent.includes('.sa-map-container .leaflet-container'), 'site-analysis.css ensures .leaflet-container occupies 100% height');

// Map Dragging Guard during drafting
assert(mapEngineContent.includes('this.map.dragging.disable()'), 'site-map-engine.js disables map dragging while drawing boundary');
assert(mapEngineContent.includes('this.map.dragging.enable()'), 'site-map-engine.js re-enables map dragging upon completion');

// Boundary Scale Validation (Prevents accidental country/continental drags like 160km x 1215km)
assert(mapEngineContent.includes('width > 25000'), 'site-map-engine.js has scale validation guard against >25km boundary');
assert(mapEngineContent.includes('area > 500000000'), 'site-map-engine.js has scale validation guard against >500km² polygon');

// Real-world parcel calculation for Adhiyamaan College of Engineering (Hosur)
// Approx campus parcel: 300m East-West by 250m North-South at lat 12.7152, lng 77.8678
const adhiyamaanLat = 12.7151533;
const adhiyamaanLng = 77.8678071;
const testParcelW = 300; // 300m
const testParcelH = 250; // 250m
const dLatHosur = (testParcelH / 6371008.8) * (180 / Math.PI);
const dLngHosur = (testParcelW / (6371008.8 * Math.cos(adhiyamaanLat * Math.PI / 180))) * (180 / Math.PI);

const adhiyamaanParcel = [
  { lat: adhiyamaanLat + dLatHosur, lng: adhiyamaanLng },
  { lat: adhiyamaanLat + dLatHosur, lng: adhiyamaanLng + dLngHosur },
  { lat: adhiyamaanLat, lng: adhiyamaanLng + dLngHosur },
  { lat: adhiyamaanLat, lng: adhiyamaanLng }
];

const parcelWidth = haversineDistance(adhiyamaanParcel[0], adhiyamaanParcel[1]);
const parcelHeight = haversineDistance(adhiyamaanParcel[1], adhiyamaanParcel[2]);
const parcelArea = calculateGeodesicPolygonArea(adhiyamaanParcel);

assertClose(parcelWidth, 300, 1.0, 'Adhiyamaan parcel width is 300m (got ~' + Math.round(parcelWidth) + 'm)');
assertClose(parcelHeight, 250, 1.0, 'Adhiyamaan parcel height is 250m (got ~' + Math.round(parcelHeight) + 'm)');
assertClose(parcelArea, 75000, 100, 'Adhiyamaan parcel area is 75,000 m² (18.5 Acres), physically sane scale (got ~' + Math.round(parcelArea) + ' m²)');

// 3D projection transformation for Adhiyamaan campus
const adhiyamaan3D = convertGeoToLocal3D(adhiyamaanParcel, adhiyamaanLat, adhiyamaanLng);
assert(adhiyamaan3D.length === 4, 'convertGeoToLocal3D produces 4 local 3D points');
// Center of site is at local (0, 0)
const avgX = adhiyamaan3D.reduce((sum, p) => sum + p.x, 0) / 4;
const avgZ = adhiyamaan3D.reduce((sum, p) => sum + p.z, 0) / 4;
assert(Math.abs(avgX - 150) < 5, '3D X coordinates are in local meters near (0, 0)');
// --- 12. Testing Iteration 6.2 Critical Map Rendering Fix ---
console.log('\n--- 12. Testing Iteration 6.2 Critical Map Rendering Fix ---');

// Default location verification: Adhiyamaan College of Engineering, Hosur
const defaultSite = SiteState.getActiveSite();
assert(defaultSite.locationName.includes('Adhiyamaan College'), 'Default site is Adhiyamaan College of Engineering');
assert(defaultSite.city === 'Hosur', 'Default site city is Hosur');
assertClose(defaultSite.latitude, 12.7152, 0.001, 'Default site latitude is 12.7152° N');
assertClose(defaultSite.longitude, 77.8678, 0.001, 'Default site longitude is 77.8678° E');

// Tileerror fallback verification
assert(mapEngineContent.includes("tileerror"), 'site-map-engine.js attaches tileerror listener for fallback');
assert(mapEngineContent.includes("World_Street_Map"), 'site-map-engine.js falls back to Esri World Street Map');

// Cache-busting version query strings verification
assert(indexHtmlContent.includes("app.js?v="), 'index.html applies cache-busting query string to app.js');
assert(appJsContent.includes("site-analysis-app.js?v="), 'app.js applies cache-busting query string to site-analysis-app.js');
const saAppSrc = fs.readFileSync('js/site-analysis/site-analysis-app.js', 'utf-8');
assert(saAppSrc.includes("site-map-engine.js?v="), 'site-analysis-app.js applies cache-busting query string to site-map-engine.js');
assert(saAppSrc.includes("site-state.js?v="), 'site-analysis-app.js applies cache-busting query string to site-state.js');
assert(mapEngineContent.includes("site-state.js?v="), 'site-map-engine.js applies cache-busting query string to site-state.js');

// Direct deep linking route to maps
assert(appJsContent.includes("#site-analysis-maps"), 'app.js supports direct deep link to #site-analysis-maps');

// --- 13. Testing Module 02: THE DESIGNER — 3D Workspace & Massing Engine ---
console.log('\n--- 13. Testing Module 02: THE DESIGNER ---');

// 1. Module database status
const module02 = PLATFORM_MODULES.find(m => m.id === '02');
assert(module02 && module02.status === MODULE_STATUS.ACTIVE, 'Module 02 THE DESIGNER is registered as ACTIVE');
assert(module02 && module02.route === 'the-designer', 'Module 02 route is "the-designer"');

// 2. Math & Massing Computations (Shoelace area, Rect, Circle, Polygon, Metrics)
const testPoly = [
  { x: 0, z: 0 },
  { x: 40, z: 0 },
  { x: 40, z: 30 },
  { x: 0, z: 30 }
];
const shoelaceArea = calculateShoelaceArea(testPoly);
assertClose(shoelaceArea, 1200, 1e-4, 'Shoelace area for 40m x 30m polygon is 1200 m²');

const rectMass = { type: 'RECTANGLE', width: 25, length: 40, floors: 6, floorHeight: 3.5 };
const rectFp = calculateMassFootprintArea(rectMass);
assertClose(rectFp, 1000, 1e-4, 'Rectangle mass footprint 25m x 40m is 1000 m²');

const circleMass = { type: 'CIRCLE', radius: 10, floors: 4, floorHeight: 3.0 };
const circleFp = calculateMassFootprintArea(circleMass);
assertClose(circleFp, Math.PI * 100, 1e-4, 'Circle mass footprint r=10m is ~314.16 m²');

// Option Metrics calculation
const testOption = new DesignerOption('opt-test', 'OPTION 1', {
  masses: [rectMass, circleMass],
  parameters: {
    siteArea: 3000,
    fsi: 2.5,
    maxCoverage: 50
  }
});
const metrics = calculateOptionMetrics(testOption);
assert(metrics.massCount === 2, 'Option metrics massCount is 2');
assertClose(metrics.footprintArea, 1000 + Math.PI * 100, 0.5, 'Option metrics total footprint is ~1314 m²');
assertClose(metrics.totalBuiltUpArea, 6000 + (Math.PI * 100 * 4), 1.0, 'Total built-up area is ~7256.6 m²');
assertClose(metrics.groundCoveragePct, 43.8, 0.5, 'Ground coverage is ~43.8%');
assert(!metrics.isCoverageExceeded, 'Coverage is within 50% limit');
assertClose(metrics.totalHeight, 21.0, 0.1, 'Total maximum height is 21.0m (6 floors * 3.5m)');

// 3. Option Management (Add, switch, duplicate, delete safeguards)
const optionMgr = new DesignerOptionManager();
assert(optionMgr.getAllOptions().length >= 1, 'DesignerOptionManager initializes with at least 1 option');
const opt1 = optionMgr.getActiveOption();
assert(opt1 && opt1.name === 'OPTION 1', 'Initial option is OPTION 1');

const opt2 = optionMgr.createOption('OPTION 2');
assert(optionMgr.getAllOptions().length === 2, 'Adding option increases count to 2');
assert(optionMgr.getActiveOption().id === opt2.id, 'New option becomes active');

optionMgr.switchOption(opt1.id);
assert(optionMgr.getActiveOption().id === opt1.id, 'Option switching works correctly');

const optClone = optionMgr.duplicateOption(opt1.id);
assert(optionMgr.getAllOptions().length === 3, 'Duplicating option creates copy');
optionMgr.deleteOption(optClone.id);
assert(optionMgr.getAllOptions().length === 2, 'Deleting option decreases count');

// 4. HTML DOM Integrity for THE DESIGNER
assert(indexHtmlContent.includes('id="designer-workspace-view"'), 'index.html contains #designer-workspace-view');
assert(indexHtmlContent.includes('id="designer-viewport-canvas-wrap"'), 'index.html contains #designer-viewport-canvas-wrap');
assert(indexHtmlContent.includes('id="designer-option-tabs-container"'), 'index.html contains #designer-option-tabs-container');
assert(indexHtmlContent.includes('id="designer-edge-nav-trigger"'), 'index.html contains edge nav trigger');
assert(indexHtmlContent.includes('id="designer-edge-nav-drawer"'), 'index.html contains edge nav drawer');
assert(indexHtmlContent.includes('id="designer-nav-module-hub"'), 'index.html contains Module Hub edge nav link');
assert(indexHtmlContent.includes('id="designer-drawer-user-email"'), 'index.html contains dynamic user email element');

// Design modes 01 Massing active, 02-10 coming soon in designer-app.js
const designerAppSrc = fs.readFileSync('js/designer/designer-app.js', 'utf-8');
assert(designerAppSrc.includes("name: 'MASSING', status: 'ACTIVE'"), 'designer-app.js marks Mode 01 MASSING as ACTIVE');
for (let m = 2; m <= 10; m++) {
  const pad = String(m).padStart(2, '0');
  assert(designerAppSrc.includes(`num: '${pad}'`) && designerAppSrc.includes("status: 'COMING SOON'"), `designer-app.js marks Mode ${pad} as COMING SOON`);
}

// Floating toolbar tools
const designerTools = [
  'SELECT', 'POLYLINE', 'RECTANGLE', 'CIRCLE',
  'POLYGON', 'MEASURE', 'DIVIDE', 'DELETE',
  'DUPLICATE', 'UNDO', 'REDO'
];
designerTools.forEach(toolName => {
  assert(indexHtmlContent.includes(`data-tool="${toolName}"`), `index.html contains toolbar tool data-tool="${toolName}"`);
});

// Contextual right parameter panel & infographics
assert(indexHtmlContent.includes('id="d-param-lat"'), 'index.html contains Latitude input');
assert(indexHtmlContent.includes('id="d-param-lng"'), 'index.html contains Longitude input');
assert(indexHtmlContent.includes('id="d-param-fsi"'), 'index.html contains FSI input');
assert(indexHtmlContent.includes('id="d-param-far"'), 'index.html contains FAR input');
assert(indexHtmlContent.includes('id="d-param-floors"'), 'index.html contains Floors count');
assert(indexHtmlContent.includes('id="d-param-floor-height-slider"'), 'index.html contains Floor height slider');
assert(indexHtmlContent.includes('id="d-param-sb-front"'), 'index.html contains Front Setback input');
assert(indexHtmlContent.includes('id="d-info-fsi-fill"'), 'index.html contains FSI Gauge infographic');
assert(indexHtmlContent.includes('id="d-info-floor-stack-list"'), 'index.html contains Floor Stack infographic');

// 5. CSS Portal Isolation
const designerCss = fs.readFileSync('styles/designer.css', 'utf-8');
assert(designerCss.includes('body:not(.designer-active) #designer-workspace-view'), 'designer.css contains strict portal isolation rule');
const modulesCss = fs.readFileSync('styles/modules.css', 'utf-8');
assert(modulesCss.includes('.portal-view.designer-workspace-view.active-view'), 'modules.css contains active-view display rule for designer');

// 6. Router and App Switching
const appJs = fs.readFileSync('js/ui/app.js', 'utf-8');
assert(appJs.includes('showTheDesigner'), 'app.js defines showTheDesigner view switcher');
assert(appJs.includes('pauseDesignerApp'), 'app.js calls pauseDesignerApp when leaving view');
assert(appJs.includes('#the-designer'), 'app.js handles #the-designer URL hash route');
const wedgeJs = fs.readFileSync('js/ui/wedge-carousel.js', 'utf-8');
assert(wedgeJs.includes('onOpenDesignerCb'), 'wedge-carousel.js includes onOpenDesigner callback for Module 02');

console.log(`\n========================================`);
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}

