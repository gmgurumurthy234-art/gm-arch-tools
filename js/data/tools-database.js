/**
 * GM ARCH TOOLS — Centralized Arch Calculatives Database
 * Creator: Guru Murthy (GM)
 * Contains all 35 architectural calculation tools with complete metadata,
 * formulas, keywords, tags, and calculation specifications.
 */

export const ARCH_CALCULATIVES = [
  {
    id: "01",
    name: "Plot Area",
    category: "Site & Plot Planning",
    description: "Calculate rectangular plot area using length and breadth with perimeter and diagonal metrics.",
    purpose: "Establish baseline site dimensions for land deeds, zoning compliance, and municipal approvals.",
    keywords: ["plot", "plot area", "site area", "land area", "length", "breadth", "rectangle", "area", "boundary", "perimeter"],
    tags: ["site", "zoning", "plot", "foundational"],
    formula: "Area = Length × Breadth",
    requirements: ["Plot length measured in linear metres or feet", "Plot breadth measured perpendicular to length", "Uniform rectangular site boundary"],
    calculationExplanation: "Computes total surface area within site boundaries by multiplying frontage width by perpendicular plot depth.",
    sourceReference: "National Building Code of India (NBC 2016) Part 3 - Development Control Rules & General Building Requirements.",
    route: "tool-01",
    inputs: [
      { key: "length", label: "Plot Length", unit: "m", defaultValue: 30, min: 0.1, step: 0.1 },
      { key: "breadth", label: "Plot Breadth", unit: "m", defaultValue: 15, min: 0.1, step: 0.1 }
    ]
  },
  {
    id: "02",
    name: "Irregular Plot Area",
    category: "Site & Plot Planning",
    description: "Calculate area for irregular 4-sided plots using Heron's triangulation formula across a dividing diagonal.",
    purpose: "Accurately compute quadrilateral site areas with non-90° angles without survey errors.",
    keywords: ["irregular plot", "irregular plot area", "quadrilateral", "triangulation", "heron formula", "survey", "land boundaries"],
    tags: ["site", "survey", "irregular"],
    formula: "Area = Area(Δ1) + Area(Δ2) using Heron's Formula √[s(s-a)(s-b)(s-c)]",
    requirements: ["All 4 side lengths (A, B, C, D)", "One diagonal tie length (E) splitting the plot into two triangles"],
    calculationExplanation: "Deconstructs an irregular four-sided plot into two distinct triangles. Computes the semi-perimeter and applies Heron's formula for each triangle.",
    sourceReference: "Survey of India Handbook; NBC 2016 Part 3 Clause 4.1.",
    route: "tool-02",
    inputs: [
      { key: "sideA", label: "Side A", unit: "m", defaultValue: 20, min: 0.1, step: 0.1 },
      { key: "sideB", label: "Side B", unit: "m", defaultValue: 15, min: 0.1, step: 0.1 },
      { key: "sideC", label: "Side C", unit: "m", defaultValue: 22, min: 0.1, step: 0.1 },
      { key: "sideD", label: "Side D", unit: "m", defaultValue: 18, min: 0.1, step: 0.1 },
      { key: "diagonal", label: "Diagonal (A-C)", unit: "m", defaultValue: 25, min: 0.1, step: 0.1 }
    ]
  },
  {
    id: "03",
    name: "Unit Conversion",
    category: "Architectural Mathematics",
    description: "Convert architectural units across independent Length and Area dimensions with full mathematical precision.",
    purpose: "Seamlessly translate between metric drawing measurements and imperial site/zoning standards without dimensional errors.",
    keywords: ["unit conversion", "convert", "converter", "length", "area", "mm", "cm", "m", "ft", "in", "m2", "ft2", "dimensions", "imperial", "metric"],
    tags: ["units", "conversion", "length", "area", "precision"],
    formula: "Standard conversion factor via SI base unit (Metre / Square Metre)",
    requirements: ["Compatible dimension selection (Length to Length OR Area to Area)", "Valid non-negative numerical input"],
    calculationExplanation: "Projects the source value into SI base units (metres or square metres) with double precision, then normalizes into the target unit with complete breakdown.",
    sourceReference: "ISO 80000-3 Quantities and units — Space and time; Bureau of Indian Standards (BIS).",
    route: "tool-03",
    inputs: [
      { key: "mode", label: "Conversion Mode", type: "toggle", options: ["LENGTH", "AREA"], defaultValue: "LENGTH" },
      { key: "fromValue", label: "From Value", unit: "unit", defaultValue: 7450, min: 0, step: "any" },
      { key: "fromUnit", label: "From Unit", type: "select", defaultValue: "mm" },
      { key: "toUnit", label: "To Unit", type: "select", defaultValue: "m" }
    ]
  },
  {
    id: "04",
    name: "Permissible FSI / FAR Area",
    category: "FSI & Density Regulations",
    description: "Calculate maximum allowable Gross Floor Area (BUA) permitted on a plot based on sanctioned FSI/FAR.",
    purpose: "Determine the maximum gross buildable envelope authorized by local municipal bye-laws.",
    keywords: ["fsi", "far", "permissible fsi", "floor space index", "floor area ratio", "permissible area", "allowable bua", "gross floor area"],
    tags: ["fsi", "far", "zoning", "byelaws"],
    formula: "Permissible BUA = Plot Area × Permissible FSI",
    requirements: ["Sanctioned Net Plot Area", "Zoning master plan sanctioned FSI / FAR ratio"],
    calculationExplanation: "Multiplies plot area by the sanctioned FSI coefficient to determine the total legal built envelope across all floors.",
    sourceReference: "Model Building Bye-Laws 2016, Ministry of Housing and Urban Affairs (MoHUA), India.",
    route: "tool-04",
    inputs: [
      { key: "plotArea", label: "Net Plot Area", unit: "m²", defaultValue: 1000, min: 1, step: 1 },
      { key: "permissibleFsi", label: "Permissible FSI / FAR", unit: "ratio", defaultValue: 2.5, min: 0.1, step: 0.05 }
    ]
  },
  {
    id: "05",
    name: "Proposed FSI",
    category: "FSI & Density Regulations",
    description: "Determine achieved Floor Space Index / Floor Area Ratio based on total proposed built-up area and site area.",
    purpose: "Verify architectural design compliance against maximum statutory FAR limits prior to submission.",
    keywords: ["proposed fsi", "achieved fsi", "far", "floor space index", "floor area ratio", "proposed bua", "density index"],
    tags: ["fsi", "far", "compliance"],
    formula: "Proposed FSI = Total Proposed BUA / Plot Area",
    requirements: ["Total proposed built-up area countable under FSI", "Net sanctioned plot area"],
    calculationExplanation: "Divides the cumulative proposed FSI floor area by net plot area to calculate the achieved density coefficient.",
    sourceReference: "NBC 2016 Part 3 Clause 2.29; Local Municipal Master Plans (GHMC / BBMP / MCGM / DDA).",
    route: "tool-05",
    inputs: [
      { key: "proposedBua", label: "Proposed FSI BUA", unit: "m²", defaultValue: 2200, min: 1, step: 1 },
      { key: "plotArea", label: "Net Plot Area", unit: "m²", defaultValue: 1000, min: 1, step: 1 }
    ]
  },
  {
    id: "06",
    name: "Ground Coverage Percentage",
    category: "Site & Footprint Analysis",
    description: "Calculate ground footprint coverage percentage against total site area.",
    purpose: "Prevent over-densification of land at ground level and protect required unbuilt open ground.",
    keywords: ["ground coverage", "coverage", "building footprint", "coverage percentage", "site coverage", "plinth area"],
    tags: ["coverage", "footprint", "site"],
    formula: "Ground Coverage (%) = (Ground Footprint Area / Plot Area) × 100",
    requirements: ["Ground floor building plinth footprint area", "Total site plot area"],
    calculationExplanation: "Calculates the ratio of building ground footprint area to total plot area as a percentage.",
    sourceReference: "NBC 2016 Part 3 Clause 2.37 (Coverage); Model Building Bye-Laws 2016.",
    route: "tool-06",
    inputs: [
      { key: "footprintArea", label: "Ground Footprint (Plinth)", unit: "m²", defaultValue: 380, min: 1, step: 1 },
      { key: "plotArea", label: "Net Plot Area", unit: "m²", defaultValue: 1000, min: 1, step: 1 }
    ]
  },
  {
    id: "07",
    name: "Permissible Ground Coverage Area",
    category: "Site & Footprint Analysis",
    description: "Calculate maximum allowable ground floor plinth footprint area based on statutory coverage limits.",
    purpose: "Establish the maximum footprint boundary for building massing at ground level.",
    keywords: ["permissible coverage", "max ground coverage", "permissible footprint", "allowable coverage", "plinth limit"],
    tags: ["coverage", "zoning", "massing"],
    formula: "Permissible Footprint = Plot Area × (Permissible Coverage % / 100)",
    requirements: ["Net plot area", "Statutory permissible coverage percentage (typically 30% - 50%)"],
    calculationExplanation: "Applies the maximum allowable coverage percentage to the plot area to produce the maximum ground floor footprint in m².",
    sourceReference: "Model Building Bye-Laws 2016 Section 4.2; NBC 2016 Table 1.",
    route: "tool-07",
    inputs: [
      { key: "plotArea", label: "Net Plot Area", unit: "m²", defaultValue: 1200, min: 1, step: 1 },
      { key: "permissibleCoveragePct", label: "Permissible Coverage", unit: "%", defaultValue: 40, min: 1, max: 100, step: 1 }
    ]
  },
  {
    id: "08",
    name: "Balance Ground Coverage",
    category: "Site & Footprint Analysis",
    description: "Calculate unutilized permissible ground footprint area available for building footprint expansion.",
    purpose: "Evaluate expansion capacity or green space buffer at the ground level.",
    keywords: ["balance ground coverage", "balance coverage", "remaining footprint", "unutilized coverage", "ground buffer"],
    tags: ["coverage", "buffer", "footprint"],
    formula: "Balance Coverage = Permissible Footprint Area - Proposed Footprint Area",
    requirements: ["Calculated permissible ground footprint area", "Proposed building ground footprint"],
    calculationExplanation: "Subtracts actual proposed ground plinth area from maximum permissible ground coverage area.",
    sourceReference: "Local Development Control Regulations (DCR).",
    route: "tool-08",
    inputs: [
      { key: "permissibleFootprint", label: "Permissible Footprint Area", unit: "m²", defaultValue: 480, min: 1, step: 1 },
      { key: "proposedFootprint", label: "Proposed Footprint Area", unit: "m²", defaultValue: 390, min: 1, step: 1 }
    ]
  },
  {
    id: "09",
    name: "Total Built-up Area",
    category: "Area & Space Accounting",
    description: "Calculate cumulative Gross Built-up Area across all floors including basements, stilts, and podiums.",
    purpose: "Establish total gross floor space for fire safety classification, costing estimates, and service loads.",
    keywords: ["total built up area", "bua", "gross built up area", "gbua", "cumulative area", "total floor area", "super built up"],
    tags: ["bua", "gross area", "costing"],
    formula: "Total BUA = (Typical Floor Area × Number of Floors) + Non-Typical Floor Areas",
    requirements: ["Typical floor plate area", "Number of typical floors", "Special floor areas (Basement, Ground/Stilt, Terrace)"],
    calculationExplanation: "Aggregates all covered floor spaces across every vertical level of the structure.",
    sourceReference: "IS 3861:2002 Method of Measurement of Plinth, Carpet and Built-up Areas of Buildings.",
    route: "tool-09",
    inputs: [
      { key: "typicalArea", label: "Typical Floor Area", unit: "m²", defaultValue: 450, min: 1, step: 1 },
      { key: "numFloors", label: "Number of Typical Floors", unit: "nos", defaultValue: 6, min: 1, step: 1 },
      { key: "otherArea", label: "Ground / Stilt / Basement Area", unit: "m²", defaultValue: 600, min: 0, step: 1 }
    ]
  },
  {
    id: "10",
    name: "Floor-wise Built-up Area",
    category: "Area & Space Accounting",
    description: "Compute detailed floor-wise gross built-up area including core, circulation, and usable zones.",
    purpose: "Provide floor-by-floor area schedules for structural framing, HVAC load distribution, and tenancy.",
    keywords: ["floor wise built up", "floor schedule", "level bua", "floor plate area", "floor area distribution", "level summary"],
    tags: ["bua", "floor schedule", "circulation"],
    formula: "Floor BUA = Usable Tenancy Area + Core & Circulation + Wall Thickness Area",
    requirements: ["Internal carpet/usable area", "Vertical core (lifts/stairs) and corridors", "External/Internal wall envelope area"],
    calculationExplanation: "Sums the internal usable area, vertical circulation core, and structural wall footprint for a single floor.",
    sourceReference: "NBC 2016 Part 3 Clause 2.13; RERA Area Guidelines.",
    route: "tool-10",
    inputs: [
      { key: "usableArea", label: "Internal Usable Area", unit: "m²", defaultValue: 320, min: 1, step: 1 },
      { key: "coreArea", label: "Core & Circulation Area", unit: "m²", defaultValue: 80, min: 0, step: 1 },
      { key: "wallArea", label: "Wall Thickness Footprint", unit: "m²", defaultValue: 45, min: 0, step: 1 }
    ]
  },
  {
    id: "11",
    name: "Net Plot Area",
    category: "Site & Plot Planning",
    description: "Calculate effective Net Plot Area after statutory deductions for road widening and master plan reservations.",
    purpose: "Establish the exact net land basis upon which FSI/FAR and ground coverage are legally calculated.",
    keywords: ["net plot area", "effective plot area", "plot deductions", "gross vs net plot", "sanctioned site area", "deductions"],
    tags: ["plot", "site", "zoning", "deductions"],
    formula: "Net Plot Area = Gross Plot Area - Road Widening Area - Reservation / Amenity Area",
    requirements: ["Gross plot area from title deed", "Road widening surrender strip area", "Public utility / green reservation areas"],
    calculationExplanation: "Deducts municipal road-widening strips and mandatory public open space reserves from gross plot area.",
    sourceReference: "Model Building Bye-Laws 2016 Section 3.3; Municipal Town Planning Schemes.",
    route: "tool-11",
    inputs: [
      { key: "grossArea", label: "Gross Plot Area", unit: "m²", defaultValue: 2500, min: 1, step: 1 },
      { key: "roadWidening", label: "Road Widening Area", unit: "m²", defaultValue: 180, min: 0, step: 1 },
      { key: "reservations", label: "Statutory Reservation / Green Strip", unit: "m²", defaultValue: 250, min: 0, step: 1 }
    ]
  },
  {
    id: "12",
    name: "Road Widening Deduction",
    category: "Site & Plot Planning",
    description: "Calculate exact land area to be surrendered to the municipal corporation for street widening schemes.",
    purpose: "Determine land loss along the street frontage and identify eligibility for Transferable Development Rights (TDR).",
    keywords: ["road widening", "road setback", "widening deduction", "street surrender", "frontage setback", "tdr credit"],
    tags: ["site", "infrastructure", "tdr"],
    formula: "Widening Area = Frontage Length × Required Widening Depth",
    requirements: ["Site frontage length along affected street", "Required road widening setback depth prescribed in master plan"],
    calculationExplanation: "Multiplies plot frontage along the abutting street by the statutory setback widening depth required by town planning.",
    sourceReference: "State Town and Country Planning Acts; Right of Way (RoW) Standards.",
    route: "tool-12",
    inputs: [
      { key: "frontageLength", label: "Plot Frontage Along Road", unit: "m", defaultValue: 45, min: 1, step: 0.5 },
      { key: "wideningDepth", label: "Statutory Widening Depth", unit: "m", defaultValue: 3.5, min: 0, step: 0.1 }
    ]
  },
  {
    id: "13",
    name: "Open Space / Amenity Deduction",
    category: "Site & Plot Planning",
    description: "Calculate mandatory open space reservation (typically 10%) required for layout sanctions and township approvals.",
    purpose: "Ensure statutory community open space / park reservation compliance for large site development.",
    keywords: ["open space deduction", "amenity area", "park reservation", "mandatory open space", "layout approval", "10 percent open space"],
    tags: ["site", "landscape", "regulations"],
    formula: "Open Space Area = Net Site Area × (Mandatory Reservation % / 100)",
    requirements: ["Net site area prior to layout planning", "Mandatory statutory percentage (commonly 10% for plots > 2000 m²)"],
    calculationExplanation: "Calculates the mandatory public amenity space that must be carved out and handed over or preserved on site.",
    sourceReference: "NBC 2016 Part 3 Clause 4.5; Urban Development Plans Formulation and Implementation (URDPFI) Guidelines.",
    route: "tool-13",
    inputs: [
      { key: "siteArea", label: "Site Area", unit: "m²", defaultValue: 4000, min: 100, step: 10 },
      { key: "reservationPct", label: "Mandatory Reservation %", unit: "%", defaultValue: 10, min: 0, max: 50, step: 0.5 }
    ]
  },
  {
    id: "14",
    name: "Maximum Permissible Height",
    category: "Height & Vertical Regulations",
    description: "Calculate maximum allowable building height governed by abutting road width and front setback rules.",
    purpose: "Prevent vertical overcrowding and guarantee adequate solar angles, daylight, and fire engine access.",
    keywords: ["height", "maximum permissible height", "building height limit", "road width height", "permissible height", "vertical zoning"],
    tags: ["height", "zoning", "fire safety"],
    formula: "Max Height = (Road Width × Multiplier) + Front Setback Factor",
    requirements: ["Abutting street Right-of-Way (RoW) width", "Front setback provided", "Zoning height multiplier (typically 1.5× road width)"],
    calculationExplanation: "Applies the light plane angle projected from the opposite edge of the abutting street to compute maximum vertical roof line.",
    sourceReference: "NBC 2016 Part 3 Clause 4.9 & Table 2; Model Building Bye-Laws 2016.",
    route: "tool-14",
    inputs: [
      { key: "roadWidth", label: "Abutting Road Width (RoW)", unit: "m", defaultValue: 18, min: 3, step: 0.5 },
      { key: "frontSetback", label: "Front Setback Provided", unit: "m", defaultValue: 6, min: 0, step: 0.5 },
      { key: "multiplier", label: "Zoning Multiplier", unit: "factor", defaultValue: 1.5, min: 1.0, step: 0.1 }
    ]
  },
  {
    id: "15",
    name: "Setback Front",
    category: "Setbacks & Open Spaces",
    description: "Calculate mandatory front open space / front setback based on proposed building height and road width.",
    purpose: "Provide statutory vehicular drop-off, fire tender circulation, and daylight privacy buffer in front of the building.",
    keywords: ["front setback", "setback front", "front open space", "road setback", "front buffer", "fire tender setback"],
    tags: ["setbacks", "zoning", "fire safety"],
    formula: "Front Setback = Base Setback + [(Building Height - 12) / 3] × 0.5m",
    requirements: ["Proposed total building height", "Abutting road width category"],
    calculationExplanation: "Evaluates road width baselines and height-based buffer rules to determine mandatory clear front open space.",
    sourceReference: "NBC 2016 Part 4 Fire and Life Safety & Part 3 Clause 4.8; Model Building Bye-Laws.",
    route: "tool-15",
    inputs: [
      { key: "buildingHeight", label: "Proposed Building Height", unit: "m", defaultValue: 24, min: 3, step: 0.5 },
      { key: "roadWidth", label: "Abutting Road Width", unit: "m", defaultValue: 12, min: 3, step: 0.5 }
    ]
  },
  {
    id: "16",
    name: "Balance FSI",
    category: "FSI & Density Regulations",
    description: "Calculate unused / balance FSI ratio remaining on a site development project.",
    purpose: "Identify headroom for vertical extensions, future floor additions, or unused zoning rights.",
    keywords: ["balance fsi", "remaining fsi", "unused fsi", "fsi headroom", "unbuilt far", "fsi balance", "far balance"],
    tags: ["fsi", "far", "expansion"],
    formula: "Balance FSI = Permissible FSI - Proposed FSI",
    requirements: ["Statutory sanctioned permissible FSI", "Achieved / proposed design FSI"],
    calculationExplanation: "Subtracts the proposed/consumed FSI index from the maximum permissible FSI index.",
    sourceReference: "Local Municipal Corporation Development Regulations.",
    route: "tool-16",
    inputs: [
      { key: "permissibleFsi", label: "Permissible FSI", unit: "ratio", defaultValue: 2.75, min: 0.1, step: 0.05 },
      { key: "proposedFsi", label: "Proposed FSI", unit: "ratio", defaultValue: 2.15, min: 0.1, step: 0.05 }
    ]
  },
  {
    id: "17",
    name: "Balance FSI Area",
    category: "FSI & Density Regulations",
    description: "Calculate residual unutilized permissible built-up floor area available for construction in m².",
    purpose: "Quantify exact rentable or constructible floor area remaining under the zoning ceiling.",
    keywords: ["balance fsi area", "remaining bua", "unbuilt floor area", "balance far area", "fsi area balance", "residual bua"],
    tags: ["fsi", "far", "area", "rentable"],
    formula: "Balance FSI Area = (Permissible FSI × Plot Area) - Proposed FSI BUA",
    requirements: ["Permissible FSI coefficient", "Plot Area", "Currently proposed FSI BUA"],
    calculationExplanation: "Multiplies plot area by balance FSI to determine the exact remaining square metres that can still be built legally.",
    sourceReference: "NBC 2016 Part 3; Local Building Rules.",
    route: "tool-17",
    inputs: [
      { key: "plotArea", label: "Net Plot Area", unit: "m²", defaultValue: 1200, min: 1, step: 1 },
      { key: "permissibleFsi", label: "Permissible FSI", unit: "ratio", defaultValue: 2.5, min: 0.1, step: 0.05 },
      { key: "proposedBua", label: "Proposed FSI BUA", unit: "m²", defaultValue: 2400, min: 1, step: 1 }
    ]
  },
  {
    id: "18",
    name: "FSI Utilization",
    category: "FSI & Density Regulations",
    description: "Compute the percentage efficiency of sanctioned FSI consumed by the architectural design proposal.",
    purpose: "Assess commercial site optimization and ensure no permissible development potential is wasted.",
    keywords: ["fsi utilization", "far efficiency", "utilization percentage", "fsi consumed", "density utilization", "commercial efficiency"],
    tags: ["fsi", "far", "efficiency", "feasibility"],
    formula: "FSI Utilization (%) = (Proposed FSI / Permissible FSI) × 100",
    requirements: ["Proposed FSI achieved in architectural scheme", "Permissible FSI sanctioned by authority"],
    calculationExplanation: "Divides proposed FSI by permissible FSI and expresses the result as an architectural yield percentage.",
    sourceReference: "Architectural Practice Standards & Commercial Real Estate Feasibility Handbooks.",
    route: "tool-18",
    inputs: [
      { key: "proposedFsi", label: "Proposed FSI", unit: "ratio", defaultValue: 2.3, min: 0.1, step: 0.05 },
      { key: "permissibleFsi", label: "Permissible FSI", unit: "ratio", defaultValue: 2.5, min: 0.1, step: 0.05 }
    ]
  },
  {
    id: "19",
    name: "Premium / TDR FSI Calculation",
    category: "FSI & Density Regulations",
    description: "Calculate purchasable Premium FSI and Transferable Development Rights (TDR) entitlement and fees.",
    purpose: "Evaluate additional buildable area gained through government premium payments or development rights certificates.",
    keywords: ["tdr", "premium fsi", "transferable development rights", "tdr fsi", "incentive far", "purchased fsi", "additional bua"],
    tags: ["fsi", "tdr", "real estate", "zoning"],
    formula: "Purchased FSI BUA = Plot Area × (TDR FSI Ratio + Premium FSI Ratio)",
    requirements: ["Plot area", "Statutory allowable TDR loading cap", "Government premium FSI cap"],
    calculationExplanation: "Computes total additional buildable area generated by loading certified TDR and purchasing premium municipal FSI.",
    sourceReference: "State TDR Guidelines & Municipal Premium FSI Schedules.",
    route: "tool-19",
    inputs: [
      { key: "plotArea", label: "Net Plot Area", unit: "m²", defaultValue: 1500, min: 1, step: 1 },
      { key: "tdrFsi", label: "TDR FSI Loading", unit: "ratio", defaultValue: 0.5, min: 0, step: 0.05 },
      { key: "premiumFsi", label: "Premium FSI Purchased", unit: "ratio", defaultValue: 0.3, min: 0, step: 0.05 }
    ]
  },
  {
    id: "20",
    name: "Total Consumable FSI",
    category: "FSI & Density Regulations",
    description: "Calculate overall maximum consumable FSI combining Base FSI, Premium FSI, and TDR allowances.",
    purpose: "Establish the final absolute development envelope combining all regulatory mechanisms.",
    keywords: ["total consumable fsi", "maximum fsi", "combined far", "gross permissible fsi", "total allowable far", "effective fsi"],
    tags: ["fsi", "far", "master planning"],
    formula: "Total Consumable FSI = Base FSI + TDR FSI + Premium FSI + Bonus FSI",
    requirements: ["Base zoning FSI", "Applicable TDR FSI", "Premium FSI", "Transit-Oriented Development (TOD) / Green Building bonus"],
    calculationExplanation: "Aggregates all statutory and incentive FSI components into a single cumulative density multiplier.",
    sourceReference: "National Building Code 2016 Part 3; State Unified DCRs.",
    route: "tool-20",
    inputs: [
      { key: "baseFsi", label: "Base Permissible FSI", unit: "ratio", defaultValue: 1.75, min: 0.5, step: 0.05 },
      { key: "tdrFsi", label: "TDR FSI", unit: "ratio", defaultValue: 0.5, min: 0, step: 0.05 },
      { key: "premiumFsi", label: "Premium FSI", unit: "ratio", defaultValue: 0.25, min: 0, step: 0.05 },
      { key: "incentiveFsi", label: "TOD / Green Building Bonus", unit: "ratio", defaultValue: 0.1, min: 0, step: 0.05 }
    ]
  },
  {
    id: "21",
    name: "Non-FSI Built-up Area",
    category: "Area & Space Accounting",
    description: "Calculate total floor area exempted from statutory FSI accounting (stairs, lifts, ducts, stilts, MEP plant rooms).",
    purpose: "Properly balance architectural service allocations against legal FSI restrictions.",
    keywords: ["non fsi area", "fsi exemptions", "free of fsi", "exempted bua", "staircase area", "lift shaft area", "service floor", "mep area"],
    tags: ["bua", "exemptions", "services"],
    formula: "Non-FSI Area = Egress Shafts + Stilt Parking + MEP Rooms",
    requirements: ["Total vertical circulation core area", "Stilt / open parking area", "Refuge floor & mechanical equipment spaces"],
    calculationExplanation: "Tallies all building program elements that municipal bye-laws permit to be constructed free of FSI computations.",
    sourceReference: "Model Building Bye-Laws 2016 Clause 4.4 Exemption from FAR; NBC 2016.",
    route: "tool-21",
    inputs: [
      { key: "circulationArea", label: "Vertical Core & Egress Area", unit: "m²", defaultValue: 280, min: 0, step: 1 },
      { key: "parkingArea", label: "Covered Stilt / Podiums", unit: "m²", defaultValue: 650, min: 0, step: 1 },
      { key: "serviceArea", label: "MEP, Pump & Electrical Rooms", unit: "m²", defaultValue: 120, min: 0, step: 1 }
    ]
  },
  {
    id: "22",
    name: "Floor-wise FSI",
    category: "FSI & Density Regulations",
    description: "Calculate the exact FSI contribution generated by an individual floor plate relative to site area.",
    purpose: "Track floor-by-floor density allocation across mixed-use and multi-tier developments.",
    keywords: ["floor wise fsi", "floor fsi", "level far", "floor density contribution", "vertical fsi breakdown", "level by level fsi"],
    tags: ["fsi", "floor plate", "density"],
    formula: "Floor FSI = Individual Floor FSI BUA / Net Plot Area",
    requirements: ["Individual floor's countable FSI area", "Total net plot area"],
    calculationExplanation: "Divides an individual floor plate's countable area by total site plot area to compute that specific level's FSI share.",
    sourceReference: "Municipal Architecture Submission Guidelines.",
    route: "tool-22",
    inputs: [
      { key: "floorBua", label: "Floor FSI BUA", unit: "m²", defaultValue: 350, min: 1, step: 1 },
      { key: "plotArea", label: "Net Plot Area", unit: "m²", defaultValue: 1400, min: 1, step: 1 }
    ]
  },
  {
    id: "23",
    name: "Total FSI from Floor Areas",
    category: "FSI & Density Regulations",
    description: "Calculate overall project FSI by aggregating individual floor-wise built-up areas.",
    purpose: "Verify the cumulative sum of all floor levels against sanctioned maximum permissible FAR.",
    keywords: ["total fsi from floor areas", "aggregate fsi", "sum of floor areas", "total far", "cumulative fsi calculation"],
    tags: ["fsi", "cumulative", "floors"],
    formula: "Total FSI = (Σ All Floor FSI BUAs) / Plot Area",
    requirements: ["Array/sum of individual floor FSI areas", "Net plot area"],
    calculationExplanation: "Sums all individual floor countable areas and divides the aggregate total by net site area.",
    sourceReference: "NBC 2016 Part 3 Clause 2.29; Council of Architecture Standards.",
    route: "tool-23",
    inputs: [
      { key: "podiumBua", label: "Podium / Lower Floors Sum", unit: "m²", defaultValue: 900, min: 0, step: 10 },
      { key: "towerBua", label: "Tower Floors Sum", unit: "m²", defaultValue: 2100, min: 0, step: 10 },
      { key: "plotArea", label: "Net Plot Area", unit: "m²", defaultValue: 1200, min: 1, step: 1 }
    ]
  },
  {
    id: "24",
    name: "Setback Rear & Sides",
    category: "Setbacks & Open Spaces",
    description: "Calculate mandatory rear and side open spaces required around the building perimeter based on height.",
    purpose: "Ensure light and ventilation plane compliance, emergency fire tender passage, and privacy between adjoining plots.",
    keywords: ["rear setback", "side setback", "setback rear and sides", "perimeter open space", "side yard", "rear yard", "fire access"],
    tags: ["setbacks", "fire safety", "zoning"],
    formula: "Side / Rear Setback = Base Setback + [(Building Height - 10m) / 3] × 0.5m (Min 6m for High Rise)",
    requirements: ["Total building height", "Plot width and depth boundaries"],
    calculationExplanation: "Computes mandatory side and rear yards by adding height-based increments to baseline zoning requirements.",
    sourceReference: "NBC 2016 Part 3 Clause 4.8.1; Part 4 Section 4.5 Fire Fighting Access.",
    route: "tool-24",
    inputs: [
      { key: "buildingHeight", label: "Building Height", unit: "m", defaultValue: 28, min: 3, step: 0.5 },
      { key: "baseSetback", label: "Base Open Space (up to 10m)", unit: "m", defaultValue: 3, min: 1, step: 0.5 }
    ]
  },
  {
    id: "25",
    name: "Landscape / Green Area Requirement",
    category: "Site & Plot Planning",
    description: "Calculate mandatory softscape/landscape and rainwater pervious area required on site.",
    purpose: "Satisfy environmental clearance (MoEFCC), green building rating systems (IGBC / GRIHA), and stormwater infiltration bye-laws.",
    keywords: ["landscape requirement", "green area", "pervious area", "softscape", "rainwater harvesting ground", "igbc landscape", "environmental clearance"],
    tags: ["landscape", "sustainability", "pervious"],
    formula: "Required Green Area = Plot Area × (Mandatory Landscape % / 100)",
    requirements: ["Total site plot area", "Statutory green cover percentage (typically 15% - 25% of site area)"],
    calculationExplanation: "Multiplies plot area by the mandatory green cover percentage to determine non-paved permeable ground requirement.",
    sourceReference: "Ministry of Environment, Forest and Climate Change (MoEFCC) Guidelines; IGBC Green Building Norms.",
    route: "tool-25",
    inputs: [
      { key: "plotArea", label: "Total Plot Area", unit: "m²", defaultValue: 2000, min: 10, step: 10 },
      { key: "landscapePct", label: "Mandatory Landscape %", unit: "%", defaultValue: 20, min: 5, max: 60, step: 1 }
    ]
  },
  {
    id: "26",
    name: "Parking Requirement",
    category: "Parking & Circulation",
    description: "Calculate mandatory Equivalent Car Spaces (ECS) required based on building occupancy and gross built-up area.",
    purpose: "Ensure statutory vehicular parking provision according to municipal development control regulations.",
    keywords: ["parking", "parking requirement", "car parking", "parking ratio", "ecs", "equivalent car space", "visitor parking", "two wheeler parking"],
    tags: ["parking", "ecs", "transportation"],
    formula: "Required ECS = Math.ceil(Total Built-up Area / Area Norm per ECS)",
    requirements: ["Total built-up or carpet area", "Municipal parking norm (e.g. 1 ECS per 50 m² commercial or 100 m² residential)"],
    calculationExplanation: "Divides total countable area by the statutory area factor per parking unit to determine minimum required ECS bays.",
    sourceReference: "NBC 2016 Part 3 Clause 4.11 Parking Spaces; Model Building Bye-Laws 2016 Table 4.1.",
    route: "tool-26",
    inputs: [
      { key: "totalBua", label: "Total Built-up Area", unit: "m²", defaultValue: 4500, min: 10, step: 10 },
      { key: "areaPerEcs", label: "Area Norm per ECS", unit: "m²", defaultValue: 75, min: 25, max: 200, step: 5 }
    ]
  },
  {
    id: "27",
    name: "Parking Provided",
    category: "Parking & Circulation",
    description: "Calculate total parking bays provided across basements, stilts, and surface bays, and identify surplus/deficit.",
    purpose: "Audit physical layout drawings against municipal statutory parking mandates.",
    keywords: ["parking provided", "parking deficit", "parking surplus", "basement parking", "stilt parking", "surface parking", "parking audit"],
    tags: ["parking", "audit", "compliance"],
    formula: "Total Provided = Basement Bays + Stilt Bays + Open Bays; Balance = Total Provided - Required ECS",
    requirements: ["Required ECS count", "Number of bays provided in Basements, Stilts, and Open Surface lots"],
    calculationExplanation: "Aggregates all provided car bays and subtracts statutory requirement to highlight parking surplus or deficit.",
    sourceReference: "NBC 2016 Part 3 Clause 4.11.",
    route: "tool-27",
    inputs: [
      { key: "requiredEcs", label: "Statutory Required ECS", unit: "bays", defaultValue: 60, min: 1, step: 1 },
      { key: "basementBays", label: "Basement Parking Bays", unit: "bays", defaultValue: 42, min: 0, step: 1 },
      { key: "stiltBays", label: "Stilt / Podium Bays", unit: "bays", defaultValue: 14, min: 0, step: 1 },
      { key: "surfaceBays", label: "Open Surface Bays", unit: "bays", defaultValue: 8, min: 0, step: 1 }
    ]
  },
  {
    id: "28",
    name: "Driveway & Turning Radius Clearance",
    category: "Parking & Circulation",
    description: "Calculate minimum internal driveway widths and vehicular turning sweep envelopes for two-way traffic.",
    purpose: "Prevent vehicular bottlenecks and ensure fire engines and garbage trucks can negotiate internal site turns.",
    keywords: ["driveway clearance", "turning radius", "two way driveway", "turning sweep", "swept path", "fire tender turning", "driveway width"],
    tags: ["circulation", "driveway", "fire safety"],
    formula: "Inner Radius = Outer Radius - Vehicle Clearance Width (Min Driveway = 6.0m)",
    requirements: ["Type of vehicle (Standard Car vs Fire Tender / Heavy Coach)", "Turning angle (90° or 180° hairpin)"],
    calculationExplanation: "Computes inner and outer swept radius clearance boundaries to verify roadway layout width compliance.",
    sourceReference: "IRC:SP:41 Guidelines for the Design of At-Grade Intersections; NBC 2016 Part 4 Section 4.5.",
    route: "tool-28",
    inputs: [
      { key: "outerRadius", label: "Outer Turning Radius", unit: "m", defaultValue: 9.0, min: 5, step: 0.5 },
      { key: "vehicleWidth", label: "Vehicle Width + Buffer", unit: "m", defaultValue: 2.8, min: 1.8, step: 0.1 }
    ]
  },
  {
    id: "29",
    name: "Ramp Slope & Length",
    category: "Parking & Circulation",
    description: "Calculate ramp horizontal run length and gradient percentage based on vertical level change.",
    purpose: "Design compliant vehicular basement ramps and barrier-free universal accessibility ramps.",
    keywords: ["ramp slope", "ramp length", "ramp gradient", "basement ramp", "vehicular ramp", "accessibility ramp", "1 in 8 ramp", "1 in 10 ramp"],
    tags: ["ramp", "slope", "circulation", "accessibility"],
    formula: "Ramp Length = Vertical Rise × Slope Gradient Ratio; Gradient (%) = (1 / Slope Ratio) × 100",
    requirements: ["Vertical floor-to-floor drop / rise", "Maximum permissible slope gradient (1:8 for vehicular, 1:12 for universal access)"],
    calculationExplanation: "Multiplies vertical height difference by the ramp gradient denominator to compute the exact horizontal run required.",
    sourceReference: "NBC 2016 Part 3 Clause 4.11.3 Ramps; Harmonised Guidelines for Universal Accessibility in India 2021.",
    route: "tool-29",
    inputs: [
      { key: "verticalRise", label: "Vertical Level Change (Rise)", unit: "m", defaultValue: 3.2, min: 0.2, step: 0.1 },
      { key: "slopeRatio", label: "Slope Ratio Denominator (1:X)", unit: "ratio", defaultValue: 8, min: 4, max: 20, step: 0.5 }
    ]
  },
  {
    id: "30",
    name: "Building Height",
    category: "Height & Vertical Regulations",
    description: "Calculate total physical building height above average surrounding ground level to top of finished roof slab.",
    purpose: "Classify high-rise building thresholds (> 15m in NBC) and determine fire safety requirements.",
    keywords: ["height", "building height", "total height", "vertical height", "high rise threshold", "roof level", "parapet height"],
    tags: ["height", "vertical", "high rise"],
    formula: "Total Height = Plinth Height + (Typical Floor Height × Number of Floors) + Parapet Cap",
    requirements: ["Ground plinth level above datum", "Floor-to-floor typical height", "Total number of vertical storeys"],
    calculationExplanation: "Calculates total architectural elevation from average ground level to the finished terrace roof level.",
    sourceReference: "NBC 2016 Part 3 Clause 2.11 (Building Height Definition); Part 4 Clause 2.18.",
    route: "tool-30",
    inputs: [
      { key: "plinthHeight", label: "Plinth Height Above Ground", unit: "m", defaultValue: 0.9, min: 0.3, step: 0.1 },
      { key: "floorHeight", label: "Typical Floor-to-Floor Height", unit: "m", defaultValue: 3.15, min: 2.75, step: 0.05 },
      { key: "numStoreys", label: "Number of Storeys (G+N)", unit: "floors", defaultValue: 8, min: 1, step: 1 },
      { key: "parapetHeight", label: "Parapet / Machine Room Cap", unit: "m", defaultValue: 1.2, min: 1.0, step: 0.1 }
    ]
  },
  {
    id: "31",
    name: "Floor-to-Floor Height",
    category: "Height & Vertical Regulations",
    description: "Calculate optimal number of storeys achievable within a capped statutory total building height limit.",
    purpose: "Maximize vertical floor yield while maintaining code-compliant clear ceiling heights for occupants.",
    keywords: ["floor to floor height", "floor height", "number of floors", "storeys", "floor count", "vertical optimization", "clear ceiling height"],
    tags: ["height", "storeys", "vertical"],
    formula: "Number of Floors = Math.floor((Max Height - Overhead) / Floor-to-Floor Height)",
    requirements: ["Maximum permissible total height", "Minimum required floor-to-floor clearance"],
    calculationExplanation: "Deducts plinth and terrace overheads from permissible height and calculates the maximum integer number of storeys.",
    sourceReference: "NBC 2016 Part 3 Clause 4.9; Model Building Bye-Laws 2016.",
    route: "tool-31",
    inputs: [
      { key: "maxAllowedHeight", label: "Max Permissible Height Limit", unit: "m", defaultValue: 24, min: 5, step: 0.5 },
      { key: "desiredFloorHeight", label: "Floor-to-Floor Height", unit: "m", defaultValue: 3.2, min: 2.75, step: 0.05 },
      { key: "nonHabitableOverhead", label: "Plinth + Parapet Overhead", unit: "m", defaultValue: 2.1, min: 1.0, step: 0.1 }
    ]
  },
  {
    id: "32",
    name: "Carpet Area",
    category: "Area & Space Accounting",
    description: "Calculate statutory Real Estate Regulatory Authority (RERA) compliant net usable carpet area.",
    purpose: "Deliver accurate legal carpet area statements for buyer agreements, sale deeds, and RERA registration.",
    keywords: ["carpet", "carpet area", "rera carpet", "usable area", "internal floor area", "rera compliance", "net usable area"],
    tags: ["carpet", "rera", "legal", "sales"],
    formula: "RERA Carpet Area = Internal Rooms Area + Internal Walls Area + Internal Toilets Area",
    requirements: ["Internal enclosed dimensions of living spaces, bedrooms, kitchen, and toilets", "Internal partition wall thicknesses"],
    calculationExplanation: "Computes net usable floor area of an apartment excluding external walls, service shafts, and exclusive balconies (as legally mandated by RERA).",
    sourceReference: "The Real Estate (Regulation and Development) Act 2016 (RERA) Section 2(k); IS 3861:2002.",
    route: "tool-32",
    inputs: [
      { key: "internalRoomArea", label: "Internal Rooms Net Area", unit: "m²", defaultValue: 82, min: 10, step: 1 },
      { key: "internalWallArea", label: "Internal Partition Walls Area", unit: "m²", defaultValue: 4.8, min: 0, step: 0.2 },
      { key: "toiletArea", label: "Internal Toilet / Utility Area", unit: "m²", defaultValue: 11.2, min: 0, step: 0.2 }
    ]
  },
  {
    id: "33",
    name: "Built-up to Carpet Ratio",
    category: "Area & Space Accounting",
    description: "Calculate the multiplier ratio between Gross Built-up Area and Net Usable Carpet Area.",
    purpose: "Evaluate structural wall and service overhead density in architectural floor planning.",
    keywords: ["built up to carpet ratio", "built up", "carpet ratio", "bua carpet multiplier", "loading ratio", "space overhead"],
    tags: ["efficiency", "carpet", "bua"],
    formula: "Built-up to Carpet Ratio = Built-up Area / Carpet Area",
    requirements: ["Gross built-up area of unit", "Net RERA carpet area"],
    calculationExplanation: "Divides gross built-up area by net carpet area to derive the architectural envelope factor.",
    sourceReference: "Council of Architecture Standards of Professional Practice.",
    route: "tool-33",
    inputs: [
      { key: "builtUpArea", label: "Gross Built-up Area (BUA)", unit: "m²", defaultValue: 125, min: 10, step: 1 },
      { key: "carpetArea", label: "Net Carpet Area", unit: "m²", defaultValue: 98, min: 10, step: 1 }
    ]
  },
  {
    id: "34",
    name: "Carpet-to-Built-up Efficiency",
    category: "Area & Space Accounting",
    description: "Calculate overall spatial planning efficiency percentage of an architectural floor plan.",
    purpose: "Maximize revenue-generating or usable carpet area while minimizing wasted structural or circulation bulk.",
    keywords: ["carpet", "carpet to built up efficiency", "efficiency", "plan efficiency", "carpet percentage", "efficiency index", "space utilization"],
    tags: ["efficiency", "carpet", "commercial"],
    formula: "Efficiency (%) = (Carpet Area / Built-up Area) × 100",
    requirements: ["Net usable carpet area", "Gross built-up area of typical floor plate"],
    calculationExplanation: "Expresses carpet area as a direct percentage of total built-up area. Architectural industry target is typically 75% to 85%.",
    sourceReference: "National Building Code 2016 Part 3; Commercial Real Estate Metrics Handbook.",
    route: "tool-34",
    inputs: [
      { key: "carpetArea", label: "Carpet Area", unit: "m²", defaultValue: 340, min: 10, step: 5 },
      { key: "builtUpArea", label: "Built-up Area (BUA)", unit: "m²", defaultValue: 410, min: 10, step: 5 }
    ]
  },
  {
    id: "35",
    name: "Occupant Load & Fire Exit Width",
    category: "Fire & Life Safety",
    description: "Calculate total occupant design population and mandatory fire exit staircase doorway egress widths.",
    purpose: "Guarantee safe emergency evacuation capacity in compliance with national fire and life safety codes.",
    keywords: ["occupant load", "fire exit width", "egress width", "fire safety", "staircase width", "exit door capacity", "evacuation", "life safety"],
    tags: ["fire safety", "egress", "life safety", "compliance"],
    formula: "Occupants = Math.ceil(Floor Area / Load Factor); Total Exit Width = Occupants × Unit Egress Factor",
    requirements: ["Total usable floor area", "Occupancy classification factor (e.g. 10 m²/person for Business, 4 m²/person for Assembly)"],
    calculationExplanation: "Calculates the maximum expected occupant population and applies the statutory unit exit width to size exit stairways and fire doors.",
    sourceReference: "NBC 2016 Part 4 Fire and Life Safety Table 3 & Clause 4.4; NFPA 101 Life Safety Code.",
    route: "tool-35",
    inputs: [
      { key: "floorArea", label: "Floor Area", unit: "m²", defaultValue: 800, min: 20, step: 10 },
      { key: "loadFactor", label: "Occupant Factor (m²/person)", unit: "m²/person", defaultValue: 10, min: 1.5, max: 30, step: 0.5 },
      { key: "unitExitWidth", label: "Unit Egress Factor", unit: "mm/person", defaultValue: 10, min: 5, max: 20, step: 1 }
    ]
  }
];

export const TOOL_CATEGORIES = [
  { id: "Site & Plot Planning", name: "Site & Plot" },
  { id: "Architectural Mathematics", name: "Math & Geometry" },
  { id: "FSI & Density Regulations", name: "FSI & Density" },
  { id: "Site & Footprint Analysis", name: "Footprint" },
  { id: "Area & Space Accounting", name: "Area & Carpet" },
  { id: "Height & Vertical Regulations", name: "Height & Envelopes" },
  { id: "Setbacks & Open Spaces", name: "Setbacks" },
  { id: "Parking & Circulation", name: "Parking & Access" },
  { id: "Fire & Life Safety", name: "Fire & Life Safety" }
];
