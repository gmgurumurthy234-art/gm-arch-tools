# GM ARCH TOOLS — Architecture Calculation Portal

**Created by Guru Murthy (GM)**  
*Professional Architecture & Computational Tool Suite*

---

## Overview

**GM ARCH TOOLS** is a dedicated architectural computation portal housing **ARCH CALCULATIVES** — a library of 35 verified architectural calculators conforming to the **National Building Code of India (NBC 2016)**, **Model Building Bye-Laws**, and standard municipal Development Control Regulations (DCR).

---

## Project Structure

```
GM ARCH TOOLS
├── index.html                  # Main portal entry & semantic layout
├── server.js                   # Zero-dependency local Node.js static server
├── run-server.ps1              # One-click PowerShell server launcher
├── package.json                # Project manifest (ES module enabled)
├── styles/
│   ├── main.css                # Dark architectural theme, grid, typography & layout
│   ├── intro.css               # GURU MURTHY -> GM -> GM ARCH TOOLS opening sequence
│   ├── search.css              # Global search modal dialog & keyboard navigation
│   ├── tools.css               # 8-part architectural tool card & modal architecture
│   └── unit-converter.css      # Specialized dual-mode architectural unit converter
└── js/
    ├── intro.js                # Interactive scroll-scrub & click-skip intro controller
    ├── data/
    │   └── tools-database.js   # Centralized metadata for all 35 Arch Calculatives
    ├── search/
    │   └── search-engine.js    # Deterministic ranked search engine (Zero AI Latency)
    ├── engines/
    │   ├── unit-converter.js   # High-precision mathematical conversion engine
    │   └── arch-calculators.js # Pure calculation logic for all 35 tools
    ├── ui/
    │   ├── modal-controller.js # 8-part card lifecycle & Tool 03 reactive controller
    │   └── app.js              # Application orchestrator, categories & Ctrl+K bindings
    └── tests/
        └── verification.js     # 270 automated verification unit tests
```

---

## The 8-Part Architecture Tool Concept

Each of the 35 tools strictly follows the uniform architectural concept:
1. **TOOL CARD**: Grid overview card with category badge, formula preview, and tags.
2. **TOOL INFORMATION**: Core purpose and municipal zoning role.
3. **CALCULATION EXPLANATION**: Detailed breakdown of how the metric is derived.
4. **REQUIREMENTS**: Mandatory site data and statutory inputs needed.
5. **FORMULA**: Mathematical and legal formula representation.
6. **CALCULATOR**: Reactive input fields with real-time recalculation.
7. **RESULT**: Prominent primary metric, auxiliary units, and copy button.
8. **CALCULATION BREAKDOWN**: Step-by-step mathematical proof for students & architects.
9. **SOURCE / REFERENCE**: Statutory citation (NBC 2016 / Model Building Bye-Laws / RERA).

---

## The 3 Key Highlights

### 1. Tool 03: Architectural Unit Converter
- **Conversion Type Modes**: Switch seamlessly between `[ LENGTH ]` and `[ AREA ]`.
- **Length Units**: Millimetre (`mm`), Centimetre (`cm`), Metre (`m`), Feet (`ft`), Inch (`in`).
- **Area Units**: Square Millimetre (`mm²`), Square Centimetre (`cm²`), Square Metre (`m²`), Square Feet (`ft²`), Square Inch (`in²`).
- **Dimensional Isolation**: Prevents cross-dimensional mixing (e.g. `m` to `m²`), displaying:  
  `"Length and area are different dimensions. Select compatible units."`
- **Architectural Quick Units**: Clickable chips for instant source/destination unit selection.
- **`⇄` Swap Button**: Instantly flips from/to units and updates the result live.
- **Mathematical Precision**: Double-precision SI base engine, zero AI latency, rounding only for display.
- **Educational Breakdown**: Shows direct factors, intermediate base steps, and final conversion.

### 2. High-Performance Global Search
- **Instant Local Search**: Zero external API calls, zero latency.
- **Weighted Ranking Engine**:
  1. Exact Tool Name (100)
  2. Partial Tool Name (75)
  3. Keyword Match (50)
  4. Description Match (25)
  5. Category Match (10)
- **Partial & Multi-Word Queries**:
  - `plo` $\rightarrow$ Plot Area
  - `fs` $\rightarrow$ FSI tools
  - `park` $\rightarrow$ Parking tools
  - `carpet area`, `ground coverage`, `balance fsi`, `permissible fsi`
- **Keyboard Navigation**:
  - `Ctrl + K` / `Cmd + K` to open/focus search
  - `↑` / `↓` Arrow keys to navigate results
  - `Enter` to select and immediately open the tool
  - `Esc` to close search dialog
- **Empty State Suggestions**: Clickable suggestion chips (`Plot`, `FSI`, `Parking`, `Area`, `Coverage`, `Height`).

### 3. Website Intro Experience
- **Brand Journey**: `GURU MURTHY` $\rightarrow$ `GM` $\rightarrow$ `GM ARCH TOOLS` $\rightarrow$ `MAIN WEBSITE`.
- **Interactive Dual Control**:
  - **Scroll Progress**: Scrubbing/scrolling smoothly transitions through the sequence. Once 100% is reached, normal website scrolling is unlocked.
  - **Click-to-Skip**: Clicking anywhere immediately executes a graceful transition straight into the website without forcing scroll.
  - Fully responsive across Desktop, Laptop, Tablet, and Mobile.

---

## How to Run Locally

You can launch the local server using Node:
```powershell
& "C:\Program Files\Adobe\Adobe Creative Cloud Experience\libs\node.exe" server.js
```
Or simply run:
```powershell
.\run-server.ps1
```
Then open: **`http://localhost:3000`** in your browser.

---

## How to Add New Tools in the Future

The application is engineered to be 100% modular. To add a new calculator:
1. Open `js/data/tools-database.js`.
2. Add a new tool object with `id`, `name`, `category`, `description`, `purpose`, `keywords`, `formula`, `inputs`, etc.
3. Open `js/engines/arch-calculators.js` and add a `case '<new_id>':` block with your mathematical calculation and step-by-step breakdown.
4. The search engine, category filter bar, and tool card grid will **automatically** index and display the new calculator without modifying any HTML!
