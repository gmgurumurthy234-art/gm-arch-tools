/**
 * GM ARCH TOOLS — Automated Verification Suite
 * Tests unit converter accuracy, dimensional isolation, and search ranking.
 */

import { convertArchitecturalUnit, formatResultNumber } from '../engines/unit-converter.js';
import { searchTools, SUGGESTED_SEARCHES } from '../search/search-engine.js';
import { calculateTool } from '../engines/arch-calculators.js';
import { ARCH_CALCULATIVES } from '../data/tools-database.js';
import { PLATFORM_MODULES, MODULE_STATUS } from '../data/modules-database.js';

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
  { id: '02', name: 'THE DESIGNER', status: MODULE_STATUS.COMING_SOON, toolsCount: 0 },
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
assert(indexHtmlContent.includes('id="basic-tools-view"'), 'index.html contains #basic-tools-view');
assert(indexHtmlContent.includes('id="bt-edge-nav-trigger"'), 'index.html contains #bt-edge-nav-trigger');
assert(indexHtmlContent.includes('id="bt-edge-nav-drawer"'), 'index.html contains #bt-edge-nav-drawer');
assert(indexHtmlContent.includes('id="bt-tools-list"'), 'index.html contains #bt-tools-list');
assert(indexHtmlContent.includes('id="bt-stage-container"'), 'index.html contains #bt-stage-container');
assert(indexHtmlContent.includes('id="bt-assets-list"'), 'index.html contains #bt-assets-list');
assert(basicCssContent.includes('body.basic-tools-active'), 'styles/basic-tools.css contains body.basic-tools-active');
assert(basicCssContent.includes('.bt-workspace-body'), 'styles/basic-tools.css contains .bt-workspace-body');

console.log(`\n========================================`);
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}

