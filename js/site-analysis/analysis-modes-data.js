/**
 * GM ARCH TOOLS — 10 Site Analysis Topics Database
 * Author: Guru Murthy (GM)
 * Strict Adherence:
 *   - No hallucinated data or fake measurements.
 *   - Unconnected calculations marked "CALCULATION & ANALYSIS — COMING SOON".
 *   - Authoritative official standards cited for all architectural concepts.
 */

export const SITE_ANALYSIS_MODES = [
  {
    id: '01',
    num: '01',
    name: 'CLIMATE ANALYSIS',
    shortName: 'Climate',
    icon: '⛅',
    panel: 'left',
    tagline: 'Macro & Microclimatic Characterization',
    whatIsIt: 'The comprehensive study of geographic atmospheric patterns, solar radiation envelopes, diurnal temperature shifts, relative humidity, and precipitation characteristics governing the site boundary.',
    whyImportant: 'Establishes the fundamental thermodynamic boundary conditions for passive building design, determining necessary thermal mass, envelope insulation levels, natural ventilation feasibility, and solar shading strategies before massing commences.',
    architectsStudy: [
      'Climatic zone categorization (Hot-Dry, Warm-Humid, Composite, Temperate, Cold per NBC 2016).',
      'Heating and Cooling Degree Days (HDD / CDD) baseline thresholds.',
      'Diurnal dry-bulb temperature variance and psychrometric comfort zones (Givoni Bioclimatic Chart).',
      'Seasonal relative humidity swings and monsoon precipitation intensity.'
    ],
    parameters: [
      { key: 'Classification', val: 'Composite Zone (NBC 2016 / SP 41)' },
      { key: 'Mean Diurnal Swing', val: 'Requires Local Station Data' },
      { key: 'Comfort Zone Threshold', val: '21°C – 26°C @ 30–70% RH' },
      { key: 'Status', val: 'COMING SOON — SOURCE REQUIRED' }
    ],
    calculationStatus: 'CLIMATE CALCULATION & ANALYSIS — COMING SOON',
    calculationNote: 'Detailed microclimate simulation, solar insolation metrics (kWh/m²), and psychrometric bioclimatic mapping are pending integration with verified regional meteorological datasets.',
    sources: [
      { name: 'National Building Code of India (NBC 2016)', ref: 'Part 8: Building Services, Section 1 (Lighting & Natural Ventilation — Climatic Zones of India)' },
      { name: 'Bureau of Indian Standards (SP 41)', ref: 'Handbook on Functional Requirements of Buildings (Other than Industrial)' },
      { name: 'India Meteorological Department (IMD)', ref: 'Climatological Normals & Long-Period Meteorological Observations' },
      { name: 'ASHRAE Handbook of Fundamentals', ref: 'Chapter 14: Climatic Design Information' }
    ],
    legend: [
      { label: 'Ambient Sky Envelope', color: '#38bdf8' },
      { label: 'Thermal Radiation Zone', color: '#f59e0b' },
      { label: 'Site Boundary Plane', color: '#10b981' }
    ]
  },
  {
    id: '02',
    num: '02',
    name: 'SUN PATH & SOLAR ANALYSIS',
    shortName: 'Sun Path',
    icon: '☀️',
    panel: 'left',
    tagline: 'Celestial Orbit, Solar Angles & Shadow Envelopes',
    whatIsIt: 'Geometric mapping of the sun apparent diurnal and seasonal trajectory across the sky vault, calculating precise solar altitude and azimuth angles relative to the site and building mass.',
    whyImportant: 'Dictates natural daylight availability inside occupied spaces, regulates direct passive solar heat gain (cooling loads), guides horizontal/vertical shading device depths (chhajjas/louvers), and identifies optimal roof zones for photovoltaic (PV) yield.',
    architectsStudy: [
      'Solar Altitude angle (vertical angle above horizon) and Azimuth angle (bearing from True North).',
      'Extreme seasonal trajectories: Summer Solstice (high sun), Winter Solstice (deep low-angle penetration), and Equinoxes.',
      'Diurnal shadow cast envelopes on adjacent plots and courtyards (solar access rights).',
      'Optimum window-to-wall ratios (WWR) and overhang sizing for north/south/east/west facades.'
    ],
    parameters: [
      { key: 'Azimuth Readout', val: 'Dynamic 3D Angle (°)' },
      { key: 'Altitude Readout', val: 'Dynamic 3D Angle (°)' },
      { key: 'Solar Noon Zenith', val: 'Simulated 12:00 Apex' },
      { key: 'Shadow Projection', val: 'Real-time 3D Dynamic' }
    ],
    calculationStatus: 'SOLAR CALCULATION & SHADOW ENVELOPE ANALYSIS — COMING SOON',
    calculationNote: 'Exact solar irradiance (W/m²), Solar Heat Gain Coefficient (SHGC) impact, and Daylight Factor percentages will be computed upon linking the astronomical algorithm to verified latitude/longitude coordinates.',
    sources: [
      { name: 'Bureau of Indian Standards (IS 2440:1986)', ref: 'Guide for Daylighting of Buildings' },
      { name: 'National Building Code of India (NBC 2016)', ref: 'Part 8, Section 1: Clause 5 (Daylight Factors & Fenestration Design)' },
      { name: 'NOAA Earth System Research Laboratories', ref: 'Solar Position Algorithm (SPA) for Solar Radiation Applications' },
      { name: 'Energy Conservation Building Code (ECBC 2017)', ref: 'Section 4: Building Envelope & Shading Devices' }
    ],
    legend: [
      { label: '3D Solar Path Arc', color: '#f59e0b' },
      { label: 'Live Sun Sphere', color: '#fbbf24' },
      { label: 'Incident Solar Rays', color: '#fef08a' },
      { label: 'Dynamic Cast Shadow', color: '#0f172a' }
    ]
  },
  {
    id: '03',
    num: '03',
    name: 'WIND & AIRFLOW ANALYSIS',
    shortName: 'Wind & Airflow',
    icon: '💨',
    panel: 'left',
    tagline: 'Prevailing Breeze Vectors & Aerodynamic Form Interaction',
    whatIsIt: 'Three-dimensional conceptual visualization of prevailing wind currents, ambient streamline trajectories, and pressure differentials as airflow encounters and navigates around the conceptual building mass.',
    whyImportant: 'Enables architects to harness natural cross-ventilation, optimize fenestration orientation for summer breezes, mitigate wind turbulence at pedestrian plaza levels, and prevent unwanted leeward stagnancy or odor entrapment.',
    architectsStudy: [
      'Positive pressure zones on the windward building face and negative suction zones on the leeward face.',
      'Funnel effect (venturi acceleration) created between closely spaced building blocks.',
      'Courtyard and lightwell air exchange through wind-induced pressure differences.',
      'Pedestrian-level wind comfort and aerodynamic building corner chamfering/filleting.'
    ],
    parameters: [
      { key: 'Prevailing Vectors', val: '8 Cardinal & Intercardinal (N to NW)' },
      { key: 'Flow Type', val: 'Laminar Streamlines & Deflection Particles' },
      { key: 'Massing Interaction', val: 'Windward Split & Leeward Wake' },
      { key: 'Status', val: 'CONCEPTUAL PRELIMINARY VISUALIZATION' }
    ],
    disclaimer: '⚠️ CONCEPTUAL AIRFLOW VISUALIZATION: This interface displays preliminary architectural streamline guidance. It is not an engineering-grade Computational Fluid Dynamics (CFD) simulation and must not be used for structural wind load calculations.',
    calculationStatus: 'CFD CALCULATION & AERODYNAMIC ANALYSIS — COMING SOON',
    calculationNote: 'Quantitative velocity fields (m/s), surface pressure coefficients (Cp), and Navier-Stokes numerical fluid simulations will be integrated in future phases.',
    sources: [
      { name: 'National Building Code of India (NBC 2016)', ref: 'Part 8, Section 1: Clause 6 (Natural Ventilation & Wind Action)' },
      { name: 'Bureau of Indian Standards (IS 875: Part 3)', ref: 'Design Loads for Buildings and Structures — Wind Loads' },
      { name: 'ASHRAE Fundamentals Handbook', ref: 'Chapter 24: Airflow Around Buildings' },
      { name: 'Aynsley, R. M. (Architectural Aerodynamics)', ref: 'Applied Science Publishers: Airflow in and around buildings' }
    ],
    legend: [
      { label: 'Windward Inflow Vector', color: '#00f2fe' },
      { label: 'Streamline Particles', color: '#38bdf8' },
      { label: 'Deflection Boundary', color: '#818cf8' },
      { label: 'Leeward Eddy Wake', color: '#6366f1' }
    ]
  },
  {
    id: '04',
    num: '04',
    name: 'SITE ORIENTATION & CONTEXT',
    shortName: 'Orientation',
    icon: '🧭',
    panel: 'left',
    tagline: 'Cardinal Axes, Context Envelopes & Long-Axis Alignment',
    whatIsIt: 'Spatial analysis of the building footprint geometry and principal facade axes relative to True North, primary road frontages, municipal setback boundaries, and surrounding built volumes.',
    whyImportant: 'Proper orientation in tropical and temperate latitudes (elongating the building along the East-West axis with primary glass facing North-South) minimizes intense low-angle solar heat gain by up to 35% without adding mechanical equipment.',
    architectsStudy: [
      'Solar orientation: elongation of building mass along the East-West axis for minimum solar heat gain.',
      'Urban street alignment vs solar optimum compromise.',
      'Surrounding context massing shadows and sightline interferences.',
      'Mandatory municipal front, rear, and side setbacks per local zoning bye-laws.'
    ],
    parameters: [
      { key: 'Building Azimuth Axis', val: 'Dynamic Rotation (°)' },
      { key: 'Primary Solar Facades', val: 'North & South Envelopes' },
      { key: 'Side Clearances', val: 'Boundary Setback Envelope' },
      { key: 'Status', val: 'GEOMETRIC INTERACTIVE SIMULATION' }
    ],
    calculationStatus: 'ORIENTATION EFFICIENCY & SOLAR GAIN SCORING — COMING SOON',
    calculationNote: 'Quantitative thermal performance ratios and orientation scoring algorithms will be incorporated in future updates with site GPS coordinates.',
    sources: [
      { name: 'National Building Code of India (NBC 2016)', ref: 'Part 8, Section 1: Clause 4.2 (Orientation of Buildings for Climate)' },
      { name: 'Energy Conservation Building Code (ECBC 2017)', ref: 'Chapter 4: Building Envelope Orientation Rules' },
      { name: 'GRIHA (Green Rating for Integrated Habitat Assessment)', ref: 'Criterion 1: Site Selection and Architectural Optimization' }
    ],
    legend: [
      { label: 'True North Axis', color: '#ef4444' },
      { label: 'Site Boundary Line', color: '#00f2fe' },
      { label: 'Context Built Masses', color: '#64748b' },
      { label: 'Building Major Axis', color: '#f59e0b' }
    ]
  },
  {
    id: '05',
    num: '05',
    name: 'TOPOGRAPHY & CONTOUR ANALYSIS',
    shortName: 'Topography',
    icon: '⛰️',
    panel: 'left',
    tagline: 'Landform Relief, Elevation Steps & Slope Drainage',
    whatIsIt: 'Three-dimensional evaluation of the natural ground terrain, contour elevation intervals, natural drainage gullies, slope gradients, and the finished plinth level of the building mass.',
    whyImportant: 'Dictates foundation engineering, natural stormwater runoff channels, universal access ramp lengths, retaining wall construction costs, and cut-and-fill soil mass balancing.',
    architectsStudy: [
      'Slope gradient categorization: Flat (<3%), Moderate (3–8%), Steep (8–15%), Rugged (>15%).',
      'Natural overland surface runoff trajectories and low-point catchment retention zones.',
      'Minimization of imported fill soil through cut-and-fill volumetric parity.',
      'Stepped building terracing to conform to natural contours without massive excavation.'
    ],
    parameters: [
      { key: 'Contour Interval', val: '1.00m Step Intervals' },
      { key: 'Elevation Gradient', val: 'Dynamic Terrain Surface' },
      { key: 'Drainage Vector', val: 'Highland to Lowland Fall' },
      { key: 'Status', val: 'PARAMETRIC CONTOUR VISUALIZER' }
    ],
    calculationStatus: 'CONTOUR GRADING & CUT/FILL CALCULATION — COMING SOON',
    calculationNote: 'Volumetric earthwork calculations (m³ of cut vs m³ of fill) and slope stability indexes will be activated when site contour DXF/CSV survey data is connected.',
    sources: [
      { name: 'National Building Code of India (NBC 2016)', ref: 'Part 3: Development Control Rules & General Building Requirements' },
      { name: 'URDPFI Guidelines (MoHUA, 2015)', ref: 'Urban and Regional Development Plans Formulation & Implementation' },
      { name: 'Bureau of Indian Standards (IS 1498)', ref: 'Classification and Identification of Soils for General Engineering Purposes' }
    ],
    legend: [
      { label: 'Contour Lines (+0.0m to +4.0m)', color: '#38bdf8' },
      { label: 'Terrain Relief Mesh', color: '#059669' },
      { label: 'Slope Drainage Vector', color: '#0ea5e9' }
    ]
  },
  {
    id: '06',
    num: '06',
    name: 'ACCESS & CIRCULATION',
    shortName: 'Access',
    icon: '🚗',
    panel: 'right',
    tagline: 'Multimodal Movement, Ingress/Egress & Fire Safety',
    whatIsIt: 'Investigation of vehicular roadways, pedestrian walkways, barrier-free access paths, parking ingress/egress ramps, service docks, and mandatory emergency fire tender driveways.',
    whyImportant: 'Eliminates hazardous pedestrian-vehicle intersection conflicts, guarantees smooth peak-hour traffic dissipation onto public road networks, and satisfies statutory municipal emergency life safety bye-laws.',
    architectsStudy: [
      'Clear vehicular turning radii (minimum 9.0m inside radius for fire tenders per NBC 2016).',
      'Universal accessibility gradients (1:12 maximum slope for accessible pedestrian ramps).',
      'Sight triangle clearance at vehicular entry and exit gate intersections.',
      'Separation of commercial service deliveries from residential or office pedestrian lobbies.'
    ],
    parameters: [
      { key: 'Primary Road ROW', val: 'Municipal Urban Arterial' },
      { key: 'Fire Tender Way', val: '6.0m Clear Width Encircling Mass' },
      { key: 'Turning Radius', val: '9.0m Inside / 15.0m Outside' },
      { key: 'Status', val: 'CIRCULATION PATH MAPPING' }
    ],
    calculationStatus: 'TRAFFIC IMPACT & CIRCULATION SIZING ENGINE — COMING SOON',
    calculationNote: 'Peak hour trip generation (PCU calculations) and queuing reservoir lane lengths will be enabled in upcoming releases.',
    sources: [
      { name: 'National Building Code of India (NBC 2016)', ref: 'Part 4: Fire and Life Safety (Clause 4.5: Fire Tender Access and Roadways)' },
      { name: 'Harmonized Guidelines & Space Standards (MoHUA, 2021)', ref: 'Barrier-Free Built Environment for Persons with Disabilities' },
      { name: 'Indian Roads Congress (IRC: 106-1990)', ref: 'Guidelines for Capacity of Urban Roads in Plain Areas' }
    ],
    legend: [
      { label: 'Vehicular Flow Loop', color: '#f59e0b' },
      { label: 'Pedestrian Walkway', color: '#00f2fe' },
      { label: 'Fire Tender Pathway', color: '#ef4444' }
    ]
  },
  {
    id: '07',
    num: '07',
    name: 'VEGETATION & LANDSCAPE',
    shortName: 'Vegetation',
    icon: '🌳',
    panel: 'right',
    tagline: 'Microclimatic Ecology, Shading Canopies & Permeability',
    whatIsIt: 'Spatial arrangement of tree canopies, vegetative boundary buffers, permeable grass surfaces, bioswales, and softscape planting zones across the unbuilt site area.',
    whyImportant: 'Counteracts the Urban Heat Island (UHI) effect, filters particulate matter from adjacent roads, provides natural seasonal solar shading on western facades, and promotes groundwater aquifer recharge.',
    architectsStudy: [
      'Deciduous vs Evergreen placement: deciduous trees on South/West block intense summer heat while permitting winter daylight.',
      'Canopy shadow envelopes across windows and courtyards.',
      'Root protection zones (RPZ) and safe offset distances from structural foundations and underground pipes.',
      'Permeable softscape percentage to satisfy statutory rainwater percolation mandates (typically 10–15% of plot area).'
    ],
    parameters: [
      { key: 'Tree Elements', val: 'Canopy Spheres & Trunks' },
      { key: 'Softscape Ratio', val: 'Permeable Landscape Zone' },
      { key: 'Shading Benefit', val: 'Lowers Exterior Surface Temp 5–8°C' },
      { key: 'Status', val: 'CONCEPTUAL 3D LANDSCAPE' }
    ],
    calculationStatus: 'LANDSCAPE ECOLOGICAL & CANOPY SHADOW CALCULATION — COMING SOON',
    calculationNote: 'Carbon sequestration estimates, specific native botanical water demand (ET rates), and exact volumetric shade simulation will be integrated with regional forestry databases.',
    sources: [
      { name: 'National Building Code of India (NBC 2016)', ref: 'Part 10: Landscape Planning, Landscaping and Outdoor Works' },
      { name: 'Model Building Bye-Laws (MBBL 2016)', ref: 'Chapter 7: Green Buildings and Rainwater Harvesting Provisions' },
      { name: 'Central Public Works Department (CPWD)', ref: 'Landscape Architecture Guidelines for Sustainable Built Environments' }
    ],
    legend: [
      { label: 'Deciduous Tree Canopy', color: '#10b981' },
      { label: 'Dense Buffer Planting', color: '#059669' },
      { label: 'Permeable Lawn Mesh', color: '#14532d' }
    ]
  },
  {
    id: '08',
    num: '08',
    name: 'VIEWS & VISUAL ANALYSIS',
    shortName: 'Views',
    icon: '👁️',
    panel: 'right',
    tagline: 'Visual Axes, Sightline Cones & Privacy Envelopes',
    whatIsIt: 'Visual sightline vectors and three-dimensional field-of-view cones projected outward from building windows, balconies, and public observation decks toward external urban anchor points.',
    whyImportant: 'Captures and frames high-value external vistas (green parks, water bodies, monuments, skyline panoramas), preserves residential visual privacy from opposing windows, and screens service eyesores.',
    architectsStudy: [
      'Human foveal visual cone (60° clear focal cone, 120° peripheral binocular horizon).',
      'Visual axis alignment with municipal street terminating vistas.',
      'Privacy distance thresholds between facing habitable windows (minimum 12.0m to 18.0m setback).',
      'Visual screening buffers for mechanical chillers, transformers, and waste collection yards.'
    ],
    parameters: [
      { key: 'Foveal View Cone', val: '60° Translucent Projection' },
      { key: 'View Targets', val: 'Scenic Vista vs Blight Screening' },
      { key: 'Sightline Geometry', val: 'Interactive 3D Ray Tracing' },
      { key: 'Status', val: 'ISOVIST & SIGHTLINE MODEL' }
    ],
    calculationStatus: 'ISOVIST GEOMETRY & SIGHTLINE OCCLUSION ENGINE — COMING SOON',
    calculationNote: 'Exact quantitative isovist polygon area (m²), visual openness metrics, and 3D occlusion percentages will be powered by algorithmic ray tracing in the next phase.',
    sources: [
      { name: 'Benedikt, M. L. (Environment & Planning B, 1979)', ref: 'To Take Hold of Space: Isovists and Isovist Fields' },
      { name: 'Architectural Graphic Standards (AIA)', ref: 'Human Vision Field Dimensions and Architectural Sightlines' },
      { name: 'National Building Code of India (NBC 2016)', ref: 'Part 3: Clause 4.6 (Rear and Side Open Spaces for Light, Air & Privacy)' }
    ],
    legend: [
      { label: 'Scenic View Target (Desirable)', color: '#10b981' },
      { label: 'Street Axis Vector (Neutral)', color: '#f59e0b' },
      { label: 'Visual Blight Vector (Screened)', color: '#ef4444' },
      { label: 'Translucent View Cone', color: '#38bdf8' }
    ]
  },
  {
    id: '09',
    num: '09',
    name: 'NOISE & ENVIRONMENTAL',
    shortName: 'Noise',
    icon: '🔊',
    panel: 'right',
    tagline: 'Acoustic Sound Pressure, Setbacks & Buffer Mitigation',
    whatIsIt: 'Three-dimensional spatial mapping of airborne ambient noise emissions radiating from adjacent vehicular highways, transit lines, and mechanical plants toward building facades.',
    whyImportant: 'Guarantees statutory acoustic comfort levels (dBA) for occupants, preventing sleep disruption and productivity loss through architectural massing setbacks, boundary wall diffraction, and buffer landscaping.',
    architectsStudy: [
      'Inverse-square law distance attenuation (~6 dBA reduction per doubling of distance in free field).',
      'Acoustic shadow zone created behind the building mass and solid compound walls.',
      'Zoning layout: placing noise-tolerant functions (lobbies, parking, stairs) facing the road and quiet functions (bedrooms) facing the rear.',
      'Acoustic facade insulation and sound transmission loss (STC) ratings.'
    ],
    parameters: [
      { key: 'Sound Source', val: 'High-Volume Municipal Roadway' },
      { key: 'Propagation Geometry', val: 'Radiating Concentric Iso-Curves' },
      { key: 'Shielding Action', val: 'Acoustic Buffer Wall & Landscape' },
      { key: 'Status', val: 'CONCEPTUAL SOUND FIELD MODEL' }
    ],
    disclaimer: '⚠️ CONCEPTUAL NOISE MODEL: Demonstrates geometric inverse-square sound decay principles and acoustic barrier shadows. It does not provide certified sound pressure levels (SPL dBA) and must not replace certified acoustic field measurements.',
    calculationStatus: 'ACOUSTIC FIELD & DECIBEL ATTENUATION ENGINE — COMING SOON',
    calculationNote: 'Point-source and line-source decibel calculation formulas, ground absorption coefficients, and octave-band spectrum attenuation will be integrated once ambient sound level survey data is provided.',
    sources: [
      { name: 'National Building Code of India (NBC 2016)', ref: 'Part 8: Section 4 (Acoustics, Sound Insulation and Noise Control)' },
      { name: 'Bureau of Indian Standards (IS 4954:1968)', ref: 'Recommendations for Noise Abatement in Town Planning' },
      { name: 'Central Pollution Control Board (CPCB)', ref: 'Ambient Air Quality Standards in Respect of Noise (Noise Rules 2000)' }
    ],
    legend: [
      { label: 'Primary Acoustic Source', color: '#ef4444' },
      { label: 'High Sound Pressure Wave', color: '#f59e0b' },
      { label: 'Attenuated Sound Wave', color: '#38bdf8' },
      { label: 'Acoustic Shadow Quiet Zone', color: '#10b981' }
    ]
  },
  {
    id: '10',
    num: '10',
    name: 'UTILITIES & INFRASTRUCTURE',
    shortName: 'Utilities',
    icon: '⚡',
    panel: 'right',
    tagline: 'Subsurface Civil Conduits, MEP Mains & Site Connections',
    whatIsIt: 'Three-dimensional routing and interface coordination of municipal utility mains (potable water, power lines, gravity sewers, storm drainage) connecting into site distribution chambers.',
    whyImportant: 'Prevents catastrophic cross-contamination between fresh water supply lines and underground sewage conduits, ensures proper gravity fall for storm and foul drainage, and reserves statutory utility easement corridors.',
    architectsStudy: [
      'Municipal connection point (tap-in) locations along the public right-of-way.',
      'Hydraulic slope gradients (minimum 1:60 to 1:100 fall for gravity sanitary sewers).',
      'Safety clearance: keeping electrical high-voltage transformers and cables separated from water bodies and wet services.',
      'Rainwater harvesting (RWH) recharge pit alignment with surface stormwater swales.'
    ],
    parameters: [
      { key: 'Potable Water Line', val: 'Blue Conduits (Pressurized Supply)' },
      { key: 'Electrical Power', val: 'Yellow Line (Transformer Node)' },
      { key: 'Sanitary Sewer', val: 'Magenta Line (Inspection Chambers)' },
      { key: 'Stormwater Drain', val: 'Cyan Dashed (Gravity Catchment)' }
    ],
    calculationStatus: 'UTILITY CAPACITY SIZING & HYDRAULIC GRADIENT ENGINE — COMING SOON',
    calculationNote: 'Exact pipe diameter sizing (Hazen-Williams equation for water supply, Manning formula for gravity sewer) and electrical transformer kVA ratings will be introduced with site occupancy load inputs.',
    sources: [
      { name: 'National Building Code of India (NBC 2016)', ref: 'Part 9: Plumbing Services (Section 1: Water Supply; Section 2: Drainage & Sanitation)' },
      { name: 'National Building Code of India (NBC 2016)', ref: 'Part 8, Section 2: Electrical and Allied Installations' },
      { name: 'CPHEEO (Ministry of Housing and Urban Affairs)', ref: 'Manual on Sewerage and Sewage Treatment Systems' }
    ],
    legend: [
      { label: 'Potable Water Main', color: '#2563eb' },
      { label: 'Electrical Power Line', color: '#eab308' },
      { label: 'Sanitary Waste Sewer', color: '#d946ef' },
      { label: 'Stormwater Drain', color: '#06b6d4' }
    ]
  }
];
