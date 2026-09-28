/**
 * GM ARCH TOOLS — 13 Major Platform Modules Database
 * Creator: Guru Murthy (GM)
 * Defines the complete architecture workflow hierarchy.
 */

import { ARCH_CALCULATIVES } from './tools-database.js';

export const MODULE_STATUS = {
  ACTIVE: 'ACTIVE',
  COMING_SOON: 'COMING SOON'
};

export const PLATFORM_MODULES = [
  {
    id: "01",
    name: "ARCH CALCULATIVES",
    shortName: "Calculatives",
    tagline: "35 Architecture Tools",
    category: "Computational Mathematics & Bye-Laws",
    status: MODULE_STATUS.ACTIVE,
    description: "Complete architectural calculation suite covering site analysis, FSI/FAR compliance, ground coverage, parking ratios, building height envelopes, and RERA carpet standards.",
    icon: "📐",
    route: "arch-calculatives",
    toolsCount: ARCH_CALCULATIVES.length,
    tools: ARCH_CALCULATIVES
  },
  {
    id: "02",
    name: "THE DESIGNER",
    shortName: "Designer",
    tagline: "Form, Geometry & Synthesis",
    category: "Architectural Design Tools",
    status: MODULE_STATUS.COMING_SOON,
    description: "Future design suite for parametric massing, proportion systems (Golden Ratio, Le Corbusier Modulor), column grid layouts, and spatial composition tools.",
    icon: "✏️",
    route: "the-designer",
    toolsCount: 0,
    tools: []
  },
  {
    id: "03",
    name: "SITE ANALYSIS",
    shortName: "Site Analysis",
    tagline: "10 Interactive 3D Analytical Modes",
    category: "Site & Environmental Planning",
    status: MODULE_STATUS.ACTIVE,
    description: "Interactive 3D environmental site analysis workspace featuring 10 architectural study modes: Climate, Sun Path, Wind, Orientation, Topography, Access, Vegetation, Views, Noise, and Utilities.",
    icon: "🧭",
    route: "site-analysis",
    toolsCount: 10,
    tools: []
  },
  {
    id: "04",
    name: "SPACE & PROGRAM",
    shortName: "Space & Program",
    tagline: "Area Schedules & Adjacencies",
    category: "Architectural Programming",
    status: MODULE_STATUS.COMING_SOON,
    description: "Future module for room data sheets, bubble diagram adjacency matrix engines, occupant capacity estimators, and architectural brief builders.",
    icon: "📋",
    route: "space-program",
    toolsCount: 0,
    tools: []
  },
  {
    id: "05",
    name: "STRUCTURE",
    shortName: "Structure",
    tagline: "Preliminary Sizing & Grids",
    category: "Structural Engineering & Framing",
    status: MODULE_STATUS.COMING_SOON,
    description: "Future preliminary structural tools for beam depth thumb-rules, column sizing approximations, slab thickness checks, and cantilever ratios.",
    icon: "🏗️",
    route: "structure",
    toolsCount: 0,
    tools: []
  },
  {
    id: "06",
    name: "BUILDING SERVICES",
    shortName: "Services",
    tagline: "MEP, Drainage & HVAC",
    category: "Building Mechanical & Utilities",
    status: MODULE_STATUS.COMING_SOON,
    description: "Future calculators for water storage tank sizing (domestic + fire UG/OH tanks), HVAC tonnage approximations, electrical transformer sizing, and plumbing drainage slopes.",
    icon: "⚡",
    route: "building-services",
    toolsCount: 0,
    tools: []
  },
  {
    id: "07",
    name: "BUILDING CODE & REGULATIONS",
    shortName: "Codes & Regulations",
    tagline: "NBC, URDPFI & Local DCRs",
    category: "Regulatory & Statutory Compliance",
    status: MODULE_STATUS.COMING_SOON,
    description: "Future statutory reference tools with searchable clauses from National Building Code (NBC 2016), Model Building Bye-Laws, and municipal development guidelines.",
    icon: "📜",
    route: "codes-regulations",
    toolsCount: 0,
    tools: []
  },
  {
    id: "08",
    name: "ESTIMATION & COST",
    shortName: "Estimation & Cost",
    tagline: "BOQ, Plinth Cost & Material Yield",
    category: "Quantity Surveying & Estimation",
    status: MODULE_STATUS.COMING_SOON,
    description: "Future preliminary cost estimating engines, plinth area rate models, cement-steel-aggregate thumb rules, and Bill of Quantities (BOQ) builders.",
    icon: "🪙",
    route: "estimation-cost",
    toolsCount: 0,
    tools: []
  },
  {
    id: "09",
    name: "SUSTAINABILITY",
    shortName: "Sustainability",
    tagline: "Green Building, Solar & Rainwater",
    category: "Ecological & Sustainable Design",
    status: MODULE_STATUS.COMING_SOON,
    description: "Future environmental computation tools: Rainwater harvesting (RWH) catchment volume, rooftop solar PV capacity, daylight factor (DF), and thermal U-value calculators.",
    icon: "🌱",
    route: "sustainability",
    toolsCount: 0,
    tools: []
  },
  {
    id: "10",
    name: "DOCUMENTATION",
    shortName: "Documentation",
    tagline: "Schedules, Reports & Submissions",
    category: "Professional Practice",
    status: MODULE_STATUS.COMING_SOON,
    description: "Future documentation engines: Door-window schedules, municipal submission check-lists, finishes schedules, and architectural report generators.",
    icon: "📑",
    route: "documentation",
    toolsCount: 0,
    tools: []
  },
  {
    id: "11",
    name: "PRESENTATION STUDIO",
    shortName: "Presentation Studio",
    tagline: "Sheets, Layouts & Portfolios",
    category: "Architectural Graphics & Media",
    status: MODULE_STATUS.COMING_SOON,
    description: "Future graphic utilities: Architectural drawing sheet scale calculators (1:100, 1:50, 1:200 to A0/A1), sheet margin standards, and palette harmonizers.",
    icon: "🎨",
    route: "presentation-studio",
    toolsCount: 0,
    tools: []
  },
  {
    id: "12",
    name: "AI ARCHITECT",
    shortName: "AI Architect",
    tagline: "Generative & Intelligent Assistants",
    category: "AI & Computational Architecture",
    status: MODULE_STATUS.COMING_SOON,
    description: "Future AI architectural assistant: Natural language code lookup, zoning regulation queries, layout optimization suggestions, and design concept drafting.",
    icon: "🤖",
    route: "ai-architect",
    toolsCount: 0,
    tools: []
  },
  {
    id: "13",
    name: "PROJECT WORKSPACE",
    shortName: "Project Workspace",
    tagline: "Unified Multi-Module Projects",
    category: "Project Data Management",
    status: MODULE_STATUS.COMING_SOON,
    description: "Future integrated workspace: Save complete projects, connect site data to calculations, export client dossiers, and coordinate multi-tool workflows.",
    icon: "📁",
    route: "project-workspace",
    toolsCount: 0,
    tools: []
  }
];
