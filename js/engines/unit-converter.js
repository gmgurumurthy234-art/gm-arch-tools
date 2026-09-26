/**
 * GM ARCH TOOLS — Deterministic Architectural Unit Conversion Engine
 * High precision, zero-AI, dimensional isolation, and step-by-step breakdown.
 */

export const DIMENSIONS = {
  LENGTH: 'LENGTH',
  AREA: 'AREA'
};

// Official architectural & SI conversion factors relative to base unit (m or m²)
export const LENGTH_UNITS = {
  mm: {
    id: 'mm',
    name: 'Millimetre',
    symbol: 'mm',
    dimension: DIMENSIONS.LENGTH,
    // Value in base unit (metre)
    toBase: 1 / 1000, // 0.001 m
    fromBase: 1000,
    quickLabel: 'mm'
  },
  cm: {
    id: 'cm',
    name: 'Centimetre',
    symbol: 'cm',
    dimension: DIMENSIONS.LENGTH,
    toBase: 1 / 100, // 0.01 m
    fromBase: 100,
    quickLabel: 'cm'
  },
  m: {
    id: 'm',
    name: 'Metre',
    symbol: 'm',
    dimension: DIMENSIONS.LENGTH,
    toBase: 1,
    fromBase: 1,
    quickLabel: 'm'
  },
  ft: {
    id: 'ft',
    name: 'Feet',
    symbol: 'ft',
    dimension: DIMENSIONS.LENGTH,
    toBase: 0.3048, // 1 ft = 0.3048 m exactly
    fromBase: 1 / 0.3048, // 3.280839895013123...
    quickLabel: 'ft'
  },
  in: {
    id: 'in',
    name: 'Inch',
    symbol: 'in',
    dimension: DIMENSIONS.LENGTH,
    toBase: 0.0254, // 1 in = 0.0254 m exactly
    fromBase: 1 / 0.0254, // 39.37007874015748...
    quickLabel: 'in'
  }
};

export const AREA_UNITS = {
  mm2: {
    id: 'mm2',
    name: 'Square Millimetre',
    symbol: 'mm²',
    dimension: DIMENSIONS.AREA,
    toBase: 1 / 1000000, // 1 m² = 1,000,000 mm²
    fromBase: 1000000,
    quickLabel: 'mm²'
  },
  cm2: {
    id: 'cm2',
    name: 'Square Centimetre',
    symbol: 'cm²',
    dimension: DIMENSIONS.AREA,
    toBase: 1 / 10000, // 1 m² = 10,000 cm²
    fromBase: 10000,
    quickLabel: 'cm²'
  },
  m2: {
    id: 'm2',
    name: 'Square Metre',
    symbol: 'm²',
    dimension: DIMENSIONS.AREA,
    toBase: 1,
    fromBase: 1,
    quickLabel: 'm²'
  },
  ft2: {
    id: 'ft2',
    name: 'Square Feet',
    symbol: 'ft²',
    dimension: DIMENSIONS.AREA,
    toBase: 0.3048 * 0.3048, // 0.09290304 m² exactly
    fromBase: 1 / (0.3048 * 0.3048), // 10.763910416709722...
    quickLabel: 'ft²'
  },
  in2: {
    id: 'in2',
    name: 'Square Inch',
    symbol: 'in²',
    dimension: DIMENSIONS.AREA,
    toBase: 0.0254 * 0.0254, // 0.00064516 m² exactly
    fromBase: 1 / (0.0254 * 0.0254), // 1550.0031000062...
    quickLabel: 'in²'
  }
};

export const ALL_UNITS = {
  ...LENGTH_UNITS,
  ...AREA_UNITS
};

/**
 * Standardize unit key (e.g. handle 'mm²' -> 'mm2')
 */
export function normalizeUnitKey(key) {
  if (!key) return null;
  const map = {
    'mm': 'mm',
    'cm': 'cm',
    'm': 'm',
    'ft': 'ft',
    'in': 'in',
    'mm2': 'mm2',
    'mm²': 'mm2',
    'cm2': 'cm2',
    'cm²': 'cm2',
    'm2': 'm2',
    'm²': 'm2',
    'ft2': 'ft2',
    'ft²': 'ft2',
    'in2': 'in2',
    'in²': 'in2'
  };
  return map[key.trim()] || key.trim();
}

/**
 * Format a number for architectural presentation
 * Preserves high precision internally; only formats for display.
 */
export function formatResultNumber(val) {
  if (val === null || val === undefined || isNaN(val)) return '0';
  if (val === 0) return '0';
  
  const abs = Math.abs(val);
  if (abs >= 1e12 || (abs < 1e-6 && abs > 0)) {
    return val.toExponential(6);
  }
  
  // Format with up to 8 decimal places and strip trailing zeros
  const rounded = parseFloat(val.toFixed(8));
  // Format with standard grouping for thousands if clean
  const parts = rounded.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

/**
 * Formats a factor number cleanly (e.g. 1000, 1,000,000)
 */
export function formatFactor(num) {
  if (Math.abs(num - Math.round(num)) < 1e-9) {
    return Math.round(num).toLocaleString('en-US');
  }
  return parseFloat(num.toFixed(6)).toString();
}

/**
 * Perform deterministic architectural unit conversion
 * @param {number|string} rawValue 
 * @param {string} fromUnitKey 
 * @param {string} toUnitKey 
 * @returns {object} { success, result, rawResult, breakdown, error }
 */
export function convertArchitecturalUnit(rawValue, fromUnitKey, toUnitKey) {
  const normFrom = normalizeUnitKey(fromUnitKey);
  const normTo = normalizeUnitKey(toUnitKey);

  const fromUnit = ALL_UNITS[normFrom];
  const toUnit = ALL_UNITS[normTo];

  if (!fromUnit || !toUnit) {
    return {
      success: false,
      error: 'Invalid or unknown unit specified.',
      result: null,
      breakdown: []
    };
  }

  // Strict dimensional isolation
  if (fromUnit.dimension !== toUnit.dimension) {
    return {
      success: false,
      isDimensionMismatch: true,
      error: 'Length and area are different dimensions. Select compatible units.',
      result: null,
      breakdown: []
    };
  }

  const num = typeof rawValue === 'number' ? rawValue : parseFloat(rawValue);
  if (isNaN(num)) {
    return {
      success: false,
      error: 'Please enter a valid numeric value.',
      result: null,
      breakdown: []
    };
  }

  // Exact identity conversion
  if (normFrom === normTo) {
    return {
      success: true,
      rawResult: num,
      result: formatResultNumber(num),
      symbol: toUnit.symbol,
      unitName: toUnit.name,
      formattedDisplay: `${formatResultNumber(num)} ${toUnit.symbol}`,
      breakdown: [
        `${formatResultNumber(num)} ${fromUnit.symbol}`,
        `= ${formatResultNumber(num)} ${toUnit.symbol}`
      ]
    };
  }

  // Convert to SI base unit (m or m²)
  const baseValue = num * fromUnit.toBase;
  // Convert from SI base unit to destination unit
  const targetValue = baseValue * toUnit.fromBase;

  // Build clean, human-readable breakdown for students & architects
  const breakdownLines = [];
  const baseSymbol = fromUnit.dimension === DIMENSIONS.LENGTH ? 'm' : 'm²';

  // Direct multiplier / divisor calculation
  const directFactor = fromUnit.toBase * toUnit.fromBase;

  breakdownLines.push(`${formatResultNumber(num)} ${fromUnit.symbol}`);

  if (Math.abs(directFactor - 1) > 1e-12) {
    if (directFactor < 1) {
      const divisor = 1 / directFactor;
      breakdownLines.push(`÷ ${formatFactor(divisor)}`);
    } else {
      breakdownLines.push(`× ${formatFactor(directFactor)}`);
    }
  }

  // If intermediate base step helps clarify imperial-metric transitions
  if (normFrom !== 'm' && normFrom !== 'm2' && normTo !== 'm' && normTo !== 'm2') {
    breakdownLines.push(`[ Via base: ${formatResultNumber(baseValue)} ${baseSymbol} ]`);
  }

  breakdownLines.push(`= ${formatResultNumber(targetValue)} ${toUnit.symbol}`);

  return {
    success: true,
    rawResult: targetValue,
    result: formatResultNumber(targetValue),
    symbol: toUnit.symbol,
    unitName: toUnit.name,
    formattedDisplay: `${formatResultNumber(targetValue)} ${toUnit.symbol}`,
    directFactor,
    baseValue,
    breakdown: breakdownLines
  };
}
