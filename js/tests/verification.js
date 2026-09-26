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

// 5. PLATFORM 13-MODULE HIERARCHY TESTS
console.log('\n--- 5. Testing 13 Major Platform Modules Hierarchy ---');
assert(PLATFORM_MODULES.length === 13, `Platform contains exactly 13 modules (found ${PLATFORM_MODULES.length})`);

const expectedModules = [
  { id: '01', name: 'ARCH CALCULATIVES', status: MODULE_STATUS.ACTIVE, toolsCount: 35 },
  { id: '02', name: 'THE DESIGNER', status: MODULE_STATUS.COMING_SOON },
  { id: '03', name: 'SITE ANALYSIS', status: MODULE_STATUS.COMING_SOON },
  { id: '04', name: 'SPACE & PROGRAM', status: MODULE_STATUS.COMING_SOON },
  { id: '05', name: 'STRUCTURE', status: MODULE_STATUS.COMING_SOON },
  { id: '06', name: 'BUILDING SERVICES', status: MODULE_STATUS.COMING_SOON },
  { id: '07', name: 'BUILDING CODE & REGULATIONS', status: MODULE_STATUS.COMING_SOON },
  { id: '08', name: 'ESTIMATION & COST', status: MODULE_STATUS.COMING_SOON },
  { id: '09', name: 'SUSTAINABILITY', status: MODULE_STATUS.COMING_SOON },
  { id: '10', name: 'DOCUMENTATION', status: MODULE_STATUS.COMING_SOON },
  { id: '11', name: 'PRESENTATION STUDIO', status: MODULE_STATUS.COMING_SOON },
  { id: '12', name: 'AI ARCHITECT', status: MODULE_STATUS.COMING_SOON },
  { id: '13', name: 'PROJECT WORKSPACE', status: MODULE_STATUS.COMING_SOON }
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

console.log(`\n========================================`);
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
