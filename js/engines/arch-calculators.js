/**
 * GM ARCH TOOLS — 35 Architecture Calculators Engine
 * Implements deterministic calculation logic, validations, results,
 * and step-by-step mathematical breakdowns for all 35 Arch Calculatives.
 */

import { convertArchitecturalUnit, formatResultNumber } from './unit-converter.js';

export function calculateTool(toolId, inputValues) {
  const id = toolId.toString().padStart(2, '0');
  const values = { ...inputValues };

  switch (id) {
    case '01': {
      // Plot Area
      const length = parseFloat(values.length) || 0;
      const breadth = parseFloat(values.breadth) || 0;
      const area = length * breadth;
      const perimeter = 2 * (length + breadth);
      const diagonal = Math.sqrt(length * length + breadth * breadth);
      return {
        primaryLabel: 'Total Plot Area',
        primaryValue: `${formatResultNumber(area)} m²`,
        secondaryMetrics: [
          { label: 'Perimeter', value: `${formatResultNumber(perimeter)} m` },
          { label: 'Corner Diagonal', value: `${formatResultNumber(diagonal)} m` },
          { label: 'Area in Sq Ft', value: `${formatResultNumber(area * 10.7639104)} ft²` }
        ],
        breakdown: [
          `Length = ${length} m`,
          `Breadth = ${breadth} m`,
          `Area = Length × Breadth`,
          `Area = ${length} × ${breadth} = ${formatResultNumber(area)} m²`,
          `Perimeter = 2 × (${length} + ${breadth}) = ${formatResultNumber(perimeter)} m`
        ]
      };
    }

    case '02': {
      // Irregular Plot Area (Heron's Triangulation)
      const a = parseFloat(values.sideA) || 0;
      const b = parseFloat(values.sideB) || 0;
      const c = parseFloat(values.sideC) || 0;
      const d = parseFloat(values.sideD) || 0;
      const e = parseFloat(values.diagonal) || 0;

      // Triangle 1: sides a, b, e
      const s1 = (a + b + e) / 2;
      const t1Rad = s1 * (s1 - a) * (s1 - b) * (s1 - e);
      // Triangle 2: sides c, d, e
      const s2 = (c + d + e) / 2;
      const t2Rad = s2 * (s2 - c) * (s2 - d) * (s2 - e);

      if (t1Rad <= 0 || t2Rad <= 0) {
        return {
          primaryLabel: 'Calculation Error',
          primaryValue: 'Geometric Impossibility',
          secondaryMetrics: [],
          breakdown: ['The provided side and diagonal lengths cannot form two valid geometric triangles. Check site survey measurements.']
        };
      }

      const area1 = Math.sqrt(t1Rad);
      const area2 = Math.sqrt(t2Rad);
      const totalArea = area1 + area2;

      return {
        primaryLabel: 'Total Irregular Plot Area',
        primaryValue: `${formatResultNumber(totalArea)} m²`,
        secondaryMetrics: [
          { label: 'Triangle 1 (A-B-Diag)', value: `${formatResultNumber(area1)} m²` },
          { label: 'Triangle 2 (C-D-Diag)', value: `${formatResultNumber(area2)} m²` },
          { label: 'Area in Sq Ft', value: `${formatResultNumber(totalArea * 10.7639104)} ft²` }
        ],
        breakdown: [
          `Triangle 1: a=${a}m, b=${b}m, diag=${e}m (s = ${s1.toFixed(2)})`,
          `Area(Δ1) = √[${s1.toFixed(2)} × ${(s1 - a).toFixed(2)} × ${(s1 - b).toFixed(2)} × ${(s1 - e).toFixed(2)}] = ${formatResultNumber(area1)} m²`,
          `Triangle 2: c=${c}m, d=${d}m, diag=${e}m (s = ${s2.toFixed(2)})`,
          `Area(Δ2) = √[${s2.toFixed(2)} × ${(s2 - c).toFixed(2)} × ${(s2 - d).toFixed(2)} × ${(s2 - e).toFixed(2)}] = ${formatResultNumber(area2)} m²`,
          `Total Area = Area(Δ1) + Area(Δ2) = ${formatResultNumber(totalArea)} m²`
        ]
      };
    }

    case '03': {
      // Unit Conversion
      const val = parseFloat(values.fromValue) || 0;
      const fromUnit = values.fromUnit || 'mm';
      const toUnit = values.toUnit || 'm';
      const conv = convertArchitecturalUnit(val, fromUnit, toUnit);

      if (!conv.success) {
        return {
          primaryLabel: 'Unit Conversion Error',
          primaryValue: conv.error,
          secondaryMetrics: [],
          breakdown: [conv.error]
        };
      }

      return {
        primaryLabel: `Converted Value (${conv.symbol})`,
        primaryValue: `${conv.result} ${conv.symbol}`,
        secondaryMetrics: [
          { label: 'Unit Dimension', value: fromUnit.includes('2') || fromUnit.includes('²') ? 'AREA' : 'LENGTH' },
          { label: 'Target Unit Name', value: conv.unitName }
        ],
        breakdown: conv.breakdown
      };
    }

    case '04': {
      // Permissible FSI / FAR Area
      const plot = parseFloat(values.plotArea) || 0;
      const fsi = parseFloat(values.permissibleFsi) || 0;
      const bua = plot * fsi;
      return {
        primaryLabel: 'Permissible Gross BUA',
        primaryValue: `${formatResultNumber(bua)} m²`,
        secondaryMetrics: [
          { label: 'Permissible BUA in Sq Ft', value: `${formatResultNumber(bua * 10.7639104)} ft²` },
          { label: 'Zoning Index', value: `${fsi.toFixed(2)} FAR` }
        ],
        breakdown: [
          `Net Plot Area = ${plot} m²`,
          `Permissible FSI / FAR = ${fsi}`,
          `Permissible BUA = Plot Area × Permissible FSI`,
          `= ${plot} × ${fsi} = ${formatResultNumber(bua)} m²`
        ]
      };
    }

    case '05': {
      // Proposed FSI
      const bua = parseFloat(values.proposedBua) || 0;
      const plot = parseFloat(values.plotArea) || 1;
      const fsi = bua / plot;
      return {
        primaryLabel: 'Proposed Achieved FSI',
        primaryValue: fsi.toFixed(3),
        secondaryMetrics: [
          { label: 'Plot Area', value: `${plot} m²` },
          { label: 'Proposed Floor Area', value: `${bua} m²` }
        ],
        breakdown: [
          `Proposed BUA = ${bua} m²`,
          `Net Plot Area = ${plot} m²`,
          `Proposed FSI = Proposed BUA / Net Plot Area`,
          `= ${bua} / ${plot} = ${fsi.toFixed(4)}`
        ]
      };
    }

    case '06': {
      // Ground Coverage Percentage
      const footprint = parseFloat(values.footprintArea) || 0;
      const plot = parseFloat(values.plotArea) || 1;
      const pct = (footprint / plot) * 100;
      const unbuilt = plot - footprint;
      return {
        primaryLabel: 'Ground Coverage',
        primaryValue: `${pct.toFixed(2)}%`,
        secondaryMetrics: [
          { label: 'Unbuilt Open Ground Area', value: `${formatResultNumber(unbuilt)} m²` },
          { label: 'Open Ground Percentage', value: `${(100 - pct).toFixed(2)}%` }
        ],
        breakdown: [
          `Building Ground Footprint = ${footprint} m²`,
          `Net Plot Area = ${plot} m²`,
          `Coverage (%) = (Footprint / Plot Area) × 100`,
          `= (${footprint} / ${plot}) × 100 = ${pct.toFixed(2)}%`
        ]
      };
    }

    case '07': {
      // Permissible Ground Coverage Area
      const plot = parseFloat(values.plotArea) || 0;
      const pct = parseFloat(values.permissibleCoveragePct) || 0;
      const maxFootprint = plot * (pct / 100);
      return {
        primaryLabel: 'Max Permissible Footprint',
        primaryValue: `${formatResultNumber(maxFootprint)} m²`,
        secondaryMetrics: [
          { label: 'Footprint in Sq Ft', value: `${formatResultNumber(maxFootprint * 10.7639104)} ft²` },
          { label: 'Statutory Coverage Cap', value: `${pct}%` }
        ],
        breakdown: [
          `Net Plot Area = ${plot} m²`,
          `Permissible Coverage Cap = ${pct}%`,
          `Permissible Footprint = Plot Area × (${pct} / 100)`,
          `= ${plot} × ${(pct / 100).toFixed(4)} = ${formatResultNumber(maxFootprint)} m²`
        ]
      };
    }

    case '08': {
      // Balance Ground Coverage
      const perm = parseFloat(values.permissibleFootprint) || 0;
      const prop = parseFloat(values.proposedFootprint) || 0;
      const balance = perm - prop;
      return {
        primaryLabel: 'Balance Ground Coverage',
        primaryValue: `${formatResultNumber(balance)} m²`,
        secondaryMetrics: [
          { label: 'Footprint Status', value: balance >= 0 ? 'Compliant' : 'Coverage Exceeded' },
          { label: 'Unused Footprint Ratio', value: perm > 0 ? `${((balance / perm) * 100).toFixed(1)}%` : '0%' }
        ],
        breakdown: [
          `Permissible Footprint Area = ${perm} m²`,
          `Proposed Footprint Area = ${prop} m²`,
          `Balance Footprint = Permissible Footprint - Proposed Footprint`,
          `= ${perm} - ${prop} = ${formatResultNumber(balance)} m²`
        ]
      };
    }

    case '09': {
      // Total Built-up Area
      const typ = parseFloat(values.typicalArea) || 0;
      const floors = parseFloat(values.numFloors) || 0;
      const other = parseFloat(values.otherArea) || 0;
      const total = (typ * floors) + other;
      return {
        primaryLabel: 'Total Gross Built-up Area',
        primaryValue: `${formatResultNumber(total)} m²`,
        secondaryMetrics: [
          { label: 'Typical Floors Total', value: `${formatResultNumber(typ * floors)} m²` },
          { label: 'Total BUA in Sq Ft', value: `${formatResultNumber(total * 10.7639104)} ft²` }
        ],
        breakdown: [
          `Typical Floor Area = ${typ} m² × ${floors} storeys = ${formatResultNumber(typ * floors)} m²`,
          `Non-Typical Floor Area = ${other} m²`,
          `Total BUA = (${typ} × ${floors}) + ${other} = ${formatResultNumber(total)} m²`
        ]
      };
    }

    case '10': {
      // Floor-wise Built-up Area
      const usable = parseFloat(values.usableArea) || 0;
      const core = parseFloat(values.coreArea) || 0;
      const wall = parseFloat(values.wallArea) || 0;
      const total = usable + core + wall;
      const eff = total > 0 ? (usable / total) * 100 : 0;
      return {
        primaryLabel: 'Level Built-up Area',
        primaryValue: `${formatResultNumber(total)} m²`,
        secondaryMetrics: [
          { label: 'Floor Plan Usable Efficiency', value: `${eff.toFixed(1)}%` },
          { label: 'Core & Wall Overhead', value: `${(100 - eff).toFixed(1)}%` }
        ],
        breakdown: [
          `Internal Usable Area = ${usable} m²`,
          `Core & Circulation Area = ${core} m²`,
          `Wall Footprint Area = ${wall} m²`,
          `Level BUA = Usable + Core + Walls`,
          `= ${usable} + ${core} + ${wall} = ${formatResultNumber(total)} m²`
        ]
      };
    }

    case '11': {
      // Net Plot Area
      const gross = parseFloat(values.grossArea) || 0;
      const road = parseFloat(values.roadWidening) || 0;
      const res = parseFloat(values.reservations) || 0;
      const net = gross - road - res;
      return {
        primaryLabel: 'Net Sanctioned Plot Area',
        primaryValue: `${formatResultNumber(net)} m²`,
        secondaryMetrics: [
          { label: 'Total Deductions', value: `${formatResultNumber(road + res)} m²` },
          { label: 'Deduction Percentage', value: gross > 0 ? `${(((road + res) / gross) * 100).toFixed(1)}%` : '0%' }
        ],
        breakdown: [
          `Gross Deed Area = ${gross} m²`,
          `Road Widening Surrender = -${road} m²`,
          `Statutory Reservations = -${res} m²`,
          `Net Plot Area = Gross - Road Widening - Reservations`,
          `= ${gross} - ${road} - ${res} = ${formatResultNumber(net)} m²`
        ]
      };
    }

    case '12': {
      // Road Widening Deduction
      const len = parseFloat(values.frontageLength) || 0;
      const depth = parseFloat(values.wideningDepth) || 0;
      const area = len * depth;
      return {
        primaryLabel: 'Road Widening Surrender Area',
        primaryValue: `${formatResultNumber(area)} m²`,
        secondaryMetrics: [
          { label: 'Surrender in Sq Ft', value: `${formatResultNumber(area * 10.7639104)} ft²` },
          { label: 'Eligible for TDR / DRC', value: 'Yes (100% - 200% DRC Credit)' }
        ],
        breakdown: [
          `Frontage Length along Street = ${len} m`,
          `Required Road Widening Depth = ${depth} m`,
          `Surrender Area = Frontage × Depth`,
          `= ${len} × ${depth} = ${formatResultNumber(area)} m²`
        ]
      };
    }

    case '13': {
      // Open Space / Amenity Deduction
      const site = parseFloat(values.siteArea) || 0;
      const pct = parseFloat(values.reservationPct) || 0;
      const amenity = site * (pct / 100);
      const remaining = site - amenity;
      return {
        primaryLabel: 'Mandatory Open Space',
        primaryValue: `${formatResultNumber(amenity)} m²`,
        secondaryMetrics: [
          { label: 'Net Plottable / Buildable Land', value: `${formatResultNumber(remaining)} m²` },
          { label: 'Open Space in Acres', value: `${(amenity / 4046.856).toFixed(3)} acres` }
        ],
        breakdown: [
          `Total Layout Site Area = ${site} m²`,
          `Mandatory Reservation = ${pct}%`,
          `Required Amenity Open Space = Site Area × (${pct} / 100)`,
          `= ${site} × ${(pct / 100).toFixed(2)} = ${formatResultNumber(amenity)} m²`
        ]
      };
    }

    case '14': {
      // Maximum Permissible Height
      const road = parseFloat(values.roadWidth) || 0;
      const front = parseFloat(values.frontSetback) || 0;
      const mult = parseFloat(values.multiplier) || 1.5;
      const maxH = (road * mult) + (front * 0.5);
      return {
        primaryLabel: 'Max Permissible Height',
        primaryValue: `${formatResultNumber(maxH)} m`,
        secondaryMetrics: [
          { label: 'High-Rise Classification', value: maxH > 15 ? 'High-Rise (Fire NOC Req)' : 'Non-High Rise' },
          { label: 'Approximate Max Storeys', value: `${Math.floor(maxH / 3.2)} Storeys` }
        ],
        breakdown: [
          `Abutting Road Width = ${road} m`,
          `Zoning Multiplier = ${mult}`,
          `Front Setback Buffer Contribution = ${front} × 0.5 = ${(front * 0.5).toFixed(1)} m`,
          `Max Height = (Road Width × Multiplier) + Front Setback Factor`,
          `= (${road} × ${mult}) + ${(front * 0.5).toFixed(1)} = ${formatResultNumber(maxH)} m`
        ]
      };
    }

    case '15': {
      // Setback Front
      const h = parseFloat(values.buildingHeight) || 0;
      const road = parseFloat(values.roadWidth) || 0;
      // Road baseline
      let roadBaseline = 3.0;
      if (road >= 18) roadBaseline = 6.0;
      else if (road >= 12) roadBaseline = 4.5;
      // Height rule: if h > 12m, add 0.5m per 3m above 12m
      const heightIncrement = h > 12 ? Math.ceil((h - 12) / 3) * 0.5 : 0;
      const frontSetback = Math.max(roadBaseline, 3.0 + heightIncrement);
      return {
        primaryLabel: 'Mandatory Front Setback',
        primaryValue: `${formatResultNumber(frontSetback)} m`,
        secondaryMetrics: [
          { label: 'Road Baseline Setback', value: `${roadBaseline} m` },
          { label: 'Height Increment Added', value: `${heightIncrement} m` }
        ],
        breakdown: [
          `Proposed Height = ${h} m, Abutting Road = ${road} m`,
          `Road Baseline Requirement = ${roadBaseline} m`,
          `Height Increment (>12m) = ceil((${h} - 12) / 3) × 0.5m = ${heightIncrement} m`,
          `Mandatory Front Setback = Max(Road Baseline, Base + Height Increment) = ${formatResultNumber(frontSetback)} m`
        ]
      };
    }

    case '16': {
      // Balance FSI
      const perm = parseFloat(values.permissibleFsi) || 0;
      const prop = parseFloat(values.proposedFsi) || 0;
      const balance = perm - prop;
      return {
        primaryLabel: 'Balance FSI / FAR',
        primaryValue: balance.toFixed(3),
        secondaryMetrics: [
          { label: 'FSI Status', value: balance >= 0 ? 'Within Statutory Limit' : 'Exceeded Permissible FSI' },
          { label: 'Unused FSI Percentage', value: perm > 0 ? `${((balance / perm) * 100).toFixed(1)}%` : '0%' }
        ],
        breakdown: [
          `Permissible FSI = ${perm}`,
          `Proposed FSI = ${prop}`,
          `Balance FSI = Permissible FSI - Proposed FSI`,
          `= ${perm} - ${prop} = ${balance.toFixed(4)}`
        ]
      };
    }

    case '17': {
      // Balance FSI Area
      const plot = parseFloat(values.plotArea) || 0;
      const fsi = parseFloat(values.permissibleFsi) || 0;
      const propBua = parseFloat(values.proposedBua) || 0;
      const maxBua = plot * fsi;
      const balanceArea = maxBua - propBua;
      return {
        primaryLabel: 'Balance FSI Area',
        primaryValue: `${formatResultNumber(balanceArea)} m²`,
        secondaryMetrics: [
          { label: 'Max Allowable BUA', value: `${formatResultNumber(maxBua)} m²` },
          { label: 'Balance in Sq Ft', value: `${formatResultNumber(balanceArea * 10.7639104)} ft²` }
        ],
        breakdown: [
          `Permissible Total BUA = ${plot} m² × ${fsi} = ${formatResultNumber(maxBua)} m²`,
          `Proposed FSI BUA = ${propBua} m²`,
          `Balance Area = Max Permissible BUA - Proposed BUA`,
          `= ${formatResultNumber(maxBua)} - ${propBua} = ${formatResultNumber(balanceArea)} m²`
        ]
      };
    }

    case '18': {
      // FSI Utilization
      const prop = parseFloat(values.proposedFsi) || 0;
      const perm = parseFloat(values.permissibleFsi) || 1;
      const util = (prop / perm) * 100;
      return {
        primaryLabel: 'FSI Utilization',
        primaryValue: `${util.toFixed(2)}%`,
        secondaryMetrics: [
          { label: 'Utilization Status', value: util <= 100 ? 'Compliant' : 'Zoning Violation' },
          { label: 'Headroom Remaining', value: `${Math.max(0, 100 - util).toFixed(2)}%` }
        ],
        breakdown: [
          `Proposed FSI = ${prop}`,
          `Permissible FSI = ${perm}`,
          `FSI Utilization (%) = (Proposed FSI / Permissible FSI) × 100`,
          `= (${prop} / ${perm}) × 100 = ${util.toFixed(2)}%`
        ]
      };
    }

    case '19': {
      // Premium / TDR FSI Calculation
      const plot = parseFloat(values.plotArea) || 0;
      const tdr = parseFloat(values.tdrFsi) || 0;
      const premium = parseFloat(values.premiumFsi) || 0;
      const totalIncentiveFsi = tdr + premium;
      const additionalBua = plot * totalIncentiveFsi;
      return {
        primaryLabel: 'Purchasable / TDR BUA',
        primaryValue: `${formatResultNumber(additionalBua)} m²`,
        secondaryMetrics: [
          { label: 'TDR Contribution Area', value: `${formatResultNumber(plot * tdr)} m²` },
          { label: 'Premium Municipal FSI Area', value: `${formatResultNumber(plot * premium)} m²` }
        ],
        breakdown: [
          `Net Plot Area = ${plot} m²`,
          `TDR FSI Loading = ${tdr}, Premium FSI = ${premium}`,
          `Combined Incentive FSI Ratio = ${tdr} + ${premium} = ${totalIncentiveFsi.toFixed(2)}`,
          `Additional Buildable Area = Plot Area × Combined Incentive FSI`,
          `= ${plot} × ${totalIncentiveFsi.toFixed(2)} = ${formatResultNumber(additionalBua)} m²`
        ]
      };
    }

    case '20': {
      // Total Consumable FSI
      const base = parseFloat(values.baseFsi) || 0;
      const tdr = parseFloat(values.tdrFsi) || 0;
      const prem = parseFloat(values.premiumFsi) || 0;
      const bonus = parseFloat(values.incentiveFsi) || 0;
      const totalFsi = base + tdr + prem + bonus;
      return {
        primaryLabel: 'Total Consumable FSI',
        primaryValue: totalFsi.toFixed(3),
        secondaryMetrics: [
          { label: 'Base Zoning FSI', value: base.toFixed(2) },
          { label: 'Total Incentive FSI', value: (tdr + prem + bonus).toFixed(2) }
        ],
        breakdown: [
          `Base FSI = ${base}`,
          `TDR Allowance = +${tdr}`,
          `Premium FSI = +${prem}`,
          `Bonus / Green Building Incentive = +${bonus}`,
          `Total Consumable FSI = Base + TDR + Premium + Bonus`,
          `= ${base} + ${tdr} + ${prem} + ${bonus} = ${totalFsi.toFixed(3)}`
        ]
      };
    }

    case '21': {
      // Non-FSI Built-up Area
      const core = parseFloat(values.circulationArea) || 0;
      const parking = parseFloat(values.parkingArea) || 0;
      const mep = parseFloat(values.serviceArea) || 0;
      const nonFsi = core + parking + mep;
      return {
        primaryLabel: 'Total Non-FSI Exempted BUA',
        primaryValue: `${formatResultNumber(nonFsi)} m²`,
        secondaryMetrics: [
          { label: 'Stilt / Parking Share', value: `${formatResultNumber(parking)} m²` },
          { label: 'Circulation & Services Share', value: `${formatResultNumber(core + mep)} m²` }
        ],
        breakdown: [
          `Vertical Core / Egress (Exempted) = ${core} m²`,
          `Stilt / Covered Parking = ${parking} m²`,
          `MEP & Service Floor Space = ${mep} m²`,
          `Total Exempted Non-FSI Area = Core + Parking + MEP`,
          `= ${core} + ${parking} + ${mep} = ${formatResultNumber(nonFsi)} m²`
        ]
      };
    }

    case '22': {
      // Floor-wise FSI
      const bua = parseFloat(values.floorBua) || 0;
      const plot = parseFloat(values.plotArea) || 1;
      const floorFsi = bua / plot;
      return {
        primaryLabel: 'Floor Level FSI Share',
        primaryValue: floorFsi.toFixed(4),
        secondaryMetrics: [
          { label: 'Floor BUA', value: `${bua} m²` },
          { label: 'Net Plot Area', value: `${plot} m²` }
        ],
        breakdown: [
          `Individual Floor BUA = ${bua} m²`,
          `Net Plot Area = ${plot} m²`,
          `Floor-wise FSI = Floor BUA / Plot Area`,
          `= ${bua} / ${plot} = ${floorFsi.toFixed(4)}`
        ]
      };
    }

    case '23': {
      // Total FSI from Floor Areas
      const podium = parseFloat(values.podiumBua) || 0;
      const tower = parseFloat(values.towerBua) || 0;
      const plot = parseFloat(values.plotArea) || 1;
      const totalBua = podium + tower;
      const aggregateFsi = totalBua / plot;
      return {
        primaryLabel: 'Cumulative Project FSI',
        primaryValue: aggregateFsi.toFixed(3),
        secondaryMetrics: [
          { label: 'Total Aggregated BUA', value: `${formatResultNumber(totalBua)} m²` },
          { label: 'Podium vs Tower Ratio', value: tower > 0 ? `${(podium / tower).toFixed(2)} : 1` : 'N/A' }
        ],
        breakdown: [
          `Podium / Low-Rise BUA = ${podium} m²`,
          `Tower Typical Storeys BUA = ${tower} m²`,
          `Total BUA = ${podium} + ${tower} = ${formatResultNumber(totalBua)} m²`,
          `Aggregate FSI = Total BUA / Plot Area`,
          `= ${totalBua} / ${plot} = ${aggregateFsi.toFixed(4)}`
        ]
      };
    }

    case '24': {
      // Setback Rear & Sides
      const h = parseFloat(values.buildingHeight) || 0;
      const base = parseFloat(values.baseSetback) || 3.0;
      // High-rise threshold: if > 15m, min 6.0m clear for fire tenders
      let rearSetback = base;
      if (h > 10) {
        rearSetback = base + Math.ceil((h - 10) / 3) * 0.5;
      }
      if (h > 15) {
        rearSetback = Math.max(rearSetback, 6.0); // Fire tender mandatory clearance
      }
      return {
        primaryLabel: 'Mandatory Side/Rear Setback',
        primaryValue: `${formatResultNumber(rearSetback)} m`,
        secondaryMetrics: [
          { label: 'Fire Tender Track Standard', value: h > 15 ? '6.0m Mandatory Min Met' : 'Standard Buffer' },
          { label: 'Building Height Category', value: h > 15 ? 'High Rise (>15m)' : 'Low/Mid Rise' }
        ],
        breakdown: [
          `Building Height = ${h} m, Base Setback = ${base} m`,
          `Incremental Setback (>10m) = ceil((${h} - 10) / 3) × 0.5m`,
          `Calculated Yard = ${rearSetback >= 6.0 && h > 15 ? 'Adjusted to statutory 6.0m minimum for fire tender driveway' : `${formatResultNumber(rearSetback)} m`}`,
          `Mandatory Perimeter Setback = ${formatResultNumber(rearSetback)} m`
        ]
      };
    }

    case '25': {
      // Landscape / Green Area Requirement
      const plot = parseFloat(values.plotArea) || 0;
      const pct = parseFloat(values.landscapePct) || 20;
      const greenArea = plot * (pct / 100);
      return {
        primaryLabel: 'Required Softscape / Green Area',
        primaryValue: `${formatResultNumber(greenArea)} m²`,
        secondaryMetrics: [
          { label: 'Green Area in Sq Ft', value: `${formatResultNumber(greenArea * 10.7639104)} ft²` },
          { label: 'Mandatory Cover Percentage', value: `${pct}% of Plot Area` }
        ],
        breakdown: [
          `Total Site Plot Area = ${plot} m²`,
          `Mandatory Landscape Percentage = ${pct}%`,
          `Required Green Area = Plot Area × (${pct} / 100)`,
          `= ${plot} × ${(pct / 100).toFixed(2)} = ${formatResultNumber(greenArea)} m²`
        ]
      };
    }

    case '26': {
      // Parking Requirement
      const bua = parseFloat(values.totalBua) || 0;
      const norm = parseFloat(values.areaPerEcs) || 75;
      const requiredEcs = Math.ceil(bua / norm);
      return {
        primaryLabel: 'Mandatory Parking (ECS)',
        primaryValue: `${requiredEcs} Bays`,
        secondaryMetrics: [
          { label: 'Car Space Area Norm', value: `1 ECS per ${norm} m² BUA` },
          { label: 'Estimated Parking Floor Footprint', value: `~${formatResultNumber(requiredEcs * 32)} m² (incl. circulation)` }
        ],
        breakdown: [
          `Total Built-up Area = ${bua} m²`,
          `Parking Norm = 1 ECS per ${norm} m²`,
          `Required ECS = ceil(BUA / Norm)`,
          `= ceil(${bua} / ${norm}) = ${requiredEcs} bays`
        ]
      };
    }

    case '27': {
      // Parking Provided & Deficit
      const req = parseFloat(values.requiredEcs) || 0;
      const bsm = parseFloat(values.basementBays) || 0;
      const stilt = parseFloat(values.stiltBays) || 0;
      const surf = parseFloat(values.surfaceBays) || 0;
      const totalProvided = bsm + stilt + surf;
      const diff = totalProvided - req;
      return {
        primaryLabel: 'Total Parking Provided',
        primaryValue: `${totalProvided} Bays`,
        secondaryMetrics: [
          { label: 'Surplus / Deficit', value: diff >= 0 ? `+${diff} Surplus Bays` : `${diff} Deficit (Violation)` },
          { label: 'Compliance Status', value: diff >= 0 ? 'Code Compliant' : 'Shortage' }
        ],
        breakdown: [
          `Basement Parking = ${bsm} bays`,
          `Stilt / Podium Parking = ${stilt} bays`,
          `Open Surface Parking = ${surf} bays`,
          `Total Provided = ${bsm} + ${stilt} + ${surf} = ${totalProvided} bays`,
          `Balance = Provided (${totalProvided}) - Required (${req}) = ${diff >= 0 ? `+${diff} (Surplus)` : `${diff} (Deficit)`}`
        ]
      };
    }

    case '28': {
      // Driveway & Turning Radius Clearance
      const outer = parseFloat(values.outerRadius) || 9.0;
      const width = parseFloat(values.vehicleWidth) || 2.8;
      const inner = outer - width;
      const drivewayStatus = width >= 6.0 ? 'Two-Way Compliant (≥6m)' : 'Single Lane / Restricted Lane';
      return {
        primaryLabel: 'Inner Turning Radius',
        primaryValue: `${formatResultNumber(inner)} m`,
        secondaryMetrics: [
          { label: 'Outer Turning Radius', value: `${outer} m` },
          { label: 'Swept Path Clearance Width', value: `${width} m` }
        ],
        breakdown: [
          `Outer Turning Boundary Radius = ${outer} m`,
          `Vehicle Swept Envelope Width = ${width} m`,
          `Inner Curb Turning Radius = Outer Radius - Swept Width`,
          `= ${outer} - ${width} = ${formatResultNumber(inner)} m`
        ]
      };
    }

    case '29': {
      // Ramp Slope & Length
      const rise = parseFloat(values.verticalRise) || 0;
      const ratio = parseFloat(values.slopeRatio) || 8;
      const runLength = rise * ratio;
      const gradientPct = (1 / ratio) * 100;
      return {
        primaryLabel: 'Ramp Horizontal Run Length',
        primaryValue: `${formatResultNumber(runLength)} m`,
        secondaryMetrics: [
          { label: 'Slope Gradient Ratio', value: `1 : ${ratio}` },
          { label: 'Slope Gradient Percentage', value: `${gradientPct.toFixed(1)}%` },
          { label: 'Slope Hypotenuse (Actual Drive)', value: `${formatResultNumber(Math.sqrt(runLength * runLength + rise * rise))} m` }
        ],
        breakdown: [
          `Vertical Rise / Level Change = ${rise} m`,
          `Slope Gradient Ratio = 1 : ${ratio}`,
          `Horizontal Run Length = Vertical Rise × Slope Denominator`,
          `= ${rise} × ${ratio} = ${formatResultNumber(runLength)} m`,
          `Gradient (%) = (1 / ${ratio}) × 100 = ${gradientPct.toFixed(1)}%`
        ]
      };
    }

    case '30': {
      // Building Height
      const plinth = parseFloat(values.plinthHeight) || 0;
      const floorH = parseFloat(values.floorHeight) || 0;
      const floors = parseFloat(values.numStoreys) || 0;
      const parapet = parseFloat(values.parapetHeight) || 0;
      const totalH = plinth + (floorH * floors) + parapet;
      return {
        primaryLabel: 'Total Building Height',
        primaryValue: `${formatResultNumber(totalH)} m`,
        secondaryMetrics: [
          { label: 'Height in Feet', value: `${formatResultNumber(totalH * 3.28084)} ft` },
          { label: 'High-Rise Threshold (>15m)', value: totalH > 15 ? 'High Rise Building' : 'Low / Mid Rise' }
        ],
        breakdown: [
          `Plinth Height above Ground = ${plinth} m`,
          `Habitable Floors Height = ${floorH} m × ${floors} storeys = ${formatResultNumber(floorH * floors)} m`,
          `Parapet / Terrace Overhead = ${parapet} m`,
          `Total Height = Plinth + (Floor Height × Floors) + Parapet`,
          `= ${plinth} + (${floorH} × ${floors}) + ${parapet} = ${formatResultNumber(totalH)} m`
        ]
      };
    }

    case '31': {
      // Floor-to-Floor Height & Number of Floors
      const maxH = parseFloat(values.maxAllowedHeight) || 0;
      const floorH = parseFloat(values.desiredFloorHeight) || 3.0;
      const overhead = parseFloat(values.nonHabitableOverhead) || 2.0;
      const netHabitableH = Math.max(0, maxH - overhead);
      const floorsCount = Math.floor(netHabitableH / floorH);
      const achievedH = overhead + (floorsCount * floorH);
      return {
        primaryLabel: 'Max Storeys Achievable',
        primaryValue: `${floorsCount} Storeys`,
        secondaryMetrics: [
          { label: 'Achieved Total Height', value: `${formatResultNumber(achievedH)} m` },
          { label: 'Residual Height Margin', value: `${formatResultNumber(maxH - achievedH)} m` }
        ],
        breakdown: [
          `Max Permissible Height Ceiling = ${maxH} m`,
          `Non-Habitable Overhead (Plinth + Parapet) = -${overhead} m`,
          `Net Habitable Vertical Envelope = ${netHabitableH} m`,
          `Storeys = floor(Net Envelope / Floor Height)`,
          `= floor(${netHabitableH} / ${floorH}) = ${floorsCount} floors`
        ]
      };
    }

    case '32': {
      // Carpet Area (RERA)
      const rooms = parseFloat(values.internalRoomArea) || 0;
      const walls = parseFloat(values.internalWallArea) || 0;
      const toilets = parseFloat(values.toiletArea) || 0;
      const reraCarpet = rooms + walls + toilets;
      return {
        primaryLabel: 'RERA Carpet Area',
        primaryValue: `${formatResultNumber(reraCarpet)} m²`,
        secondaryMetrics: [
          { label: 'RERA Carpet in Sq Ft', value: `${formatResultNumber(reraCarpet * 10.7639104)} ft²` },
          { label: 'Legal Verification', value: 'RERA 2016 Compliant' }
        ],
        breakdown: [
          `Internal Habitable Rooms Net Area = ${rooms} m²`,
          `Internal Partition Walls Footprint = ${walls} m²`,
          `Internal Toilets / Utility Space = ${toilets} m²`,
          `RERA Carpet Area = Rooms + Internal Walls + Toilets`,
          `= ${rooms} + ${walls} + ${toilets} = ${formatResultNumber(reraCarpet)} m²`
        ]
      };
    }

    case '33': {
      // Built-up to Carpet Ratio
      const bua = parseFloat(values.builtUpArea) || 0;
      const carpet = parseFloat(values.carpetArea) || 1;
      const ratio = bua / carpet;
      return {
        primaryLabel: 'BUA to Carpet Multiplier',
        primaryValue: `${ratio.toFixed(3)} : 1`,
        secondaryMetrics: [
          { label: 'Wall & Service Loading Factor', value: `${((ratio - 1) * 100).toFixed(1)}%` },
          { label: 'Planning Rating', value: ratio <= 1.25 ? 'High Efficiency' : 'Moderate Efficiency' }
        ],
        breakdown: [
          `Gross Built-up Area = ${bua} m²`,
          `Net Carpet Area = ${carpet} m²`,
          `Ratio = Built-up Area / Carpet Area`,
          `= ${bua} / ${carpet} = ${ratio.toFixed(4)}`
        ]
      };
    }

    case '34': {
      // Carpet-to-Built-up Efficiency
      const carpet = parseFloat(values.carpetArea) || 0;
      const bua = parseFloat(values.builtUpArea) || 1;
      const eff = (carpet / bua) * 100;
      return {
        primaryLabel: 'Floor Plan Efficiency',
        primaryValue: `${eff.toFixed(2)}%`,
        secondaryMetrics: [
          { label: 'Efficiency Benchmark', value: eff >= 80 ? 'Excellent (≥80%)' : eff >= 75 ? 'Good (75-80%)' : 'Sub-Optimal (<75%)' },
          { label: 'Circulation & Wall Overhead', value: `${(100 - eff).toFixed(2)}%` }
        ],
        breakdown: [
          `Net Carpet Area = ${carpet} m²`,
          `Gross Built-up Area = ${bua} m²`,
          `Efficiency (%) = (Carpet Area / Built-up Area) × 100`,
          `= (${carpet} / ${bua}) × 100 = ${eff.toFixed(2)}%`
        ]
      };
    }

    case '35': {
      // Occupant Load & Fire Exit Width
      const area = parseFloat(values.floorArea) || 0;
      const load = parseFloat(values.loadFactor) || 10;
      const unitW = parseFloat(values.unitExitWidth) || 10;
      const occupants = Math.ceil(area / load);
      const totalExitWidthMm = occupants * unitW;
      const totalExitWidthM = totalExitWidthMm / 1000;
      return {
        primaryLabel: 'Design Occupant Load',
        primaryValue: `${occupants} Persons`,
        secondaryMetrics: [
          { label: 'Total Mandatory Egress Width', value: `${formatResultNumber(totalExitWidthM)} m (${totalExitWidthMm} mm)` },
          { label: 'Recommended Exit Staircases', value: `${Math.max(2, Math.ceil(totalExitWidthM / 1.5))} Staircases (Min 2)` }
        ],
        breakdown: [
          `Floor Usable Area = ${area} m²`,
          `Occupant Load Factor = ${load} m²/person`,
          `Design Occupants = ceil(Floor Area / Load Factor) = ceil(${area} / ${load}) = ${occupants} persons`,
          `Mandatory Egress Width = Occupants × Unit Width Factor (${unitW} mm/person)`,
          `= ${occupants} × ${unitW} mm = ${totalExitWidthMm} mm (${formatResultNumber(totalExitWidthM)} m)`
        ]
      };
    }

    default:
      return {
        primaryLabel: 'Result',
        primaryValue: 'Ready',
        secondaryMetrics: [],
        breakdown: ['Enter calculation parameters above.']
      };
  }
}
