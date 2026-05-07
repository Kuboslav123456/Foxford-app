# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

npm is located at `C:\Program Files\nodejs\npm.cmd` — it is not in the system PATH, so always use the full path or invoke via PowerShell with `$env:PATH = "C:\Program Files\nodejs;" + $env:PATH`.

```bash
# Dev server (port 3000)
npm start

# Production build
npm run build

# Tests
npm test
npm test -- --testPathPattern=App.test   # single file
npm test -- --watchAll=false             # CI / non-interactive
```

The dev server is configured in `.claude/launch.json` and can be started via the `preview_start` tool using the name `kaviaren-app`.

## Architecture

The entire application lives in a **single file**: `src/App.js` (~1300 lines). There are no separate component files, hooks, or contexts — everything is co-located.

### Structure of App.js

**Top-level constants (lines 1–260)**
- `C` — the design token object (color palette). All colours are defined here; change appearance by editing `C`.
- `BRANCH_PIN` — hardcoded PIN (`1234`) for switching branches.
- `BRANCHES` — array of `{ name, url }` mapping branch names to their Google Apps Script webhook URLs. Branches `Cubicon` through `Košice` still have placeholder URLs (`URL_POBOCKA_*`).
- `INIT_TASKS` — default checklist tasks for `denné / víkendové / mesačné` tabs.
- `INIT_INV` — default inventory catalogue (168 products in 12 categories). Each item has `{ id, name, portosCode, unit }`. The `portosCode` maps to the PORTOS inventory system.
- `INIT_TEMP_FIELDS` — default HACCP temperature measurement fields.

**Shared micro-components (lines ~62–107)**
- `Logo` — SVG hexagon logo rendered inline.
- `Glass` — the universal card wrapper (white panel, border, shadow, blur).
- `Tag` — small section label.
- `Inp` — styled `<input>` with shake animation support.

**Main `App` component (line ~110 to end)**
All state, effects, and render logic live here.

### State & persistence

Every piece of state is persisted to `localStorage` via a single `useEffect` that fires on any change. Keys used:

| Key | Content |
|---|---|
| `foxford-tasks` | Task lists (all three tabs) |
| `foxford-last-reset-date` | Date string for daily auto-reset |
| `foxford-batch` | Current batch time |
| `foxford-inspectors` | Inspector names per tab |
| `foxford-temp-fields` | HACCP field definitions |
| `foxford-inventory-data` | Full inventory catalogue (overrides `INIT_INV`) |
| `foxford-inventory` | Quantity map `{ itemId: value }` |
| `foxford-inventory-notes` | Notes map `{ itemId: note }` |
| `foxford-notes` | Shift messages array |
| `foxford-haccp-date` | Date of last HACCP submission |
| `foxford-branch` | Selected branch name |

**Daily auto-reset**: `denné` tasks, inspector name, batch time, and HACCP readings reset automatically at midnight via a `setTimeout` calculated on mount.

### Four main tabs

| Tab id | Content |
|---|---|
| `tasks` | Checklist with `denné / víkendové / mesačné` sub-tabs, progress bar, swipe-to-delete |
| `temps` | HACCP temperature logging; sends to Google Sheets via `sendToSheets('haccp', ...)` |
| `inventory` | Stock count per product; exports to PORTOS `.csv`; sends to Google Sheets via `sendToSheets('inventory', ...)` |
| `notes` | Shift handover messages |

### External integrations

**Google Sheets** — `sendToSheets(type, payload)` POSTs JSON (mode `no-cors`) to the Google Apps Script URL of the currently selected branch. Two event types are sent: `'haccp'` and `'tasks_summary'` / `'inventory'`.

**PORTOS export** — `exportPortos()` generates a `code;qty` CSV from items that have both a `portosCode` and a filled quantity, then triggers a browser download.

### Branch switching

A PIN modal (`BRANCH_PIN = '1234'`) guards branch selection. The selected branch is stored in `localStorage` under `foxford-branch` and persists across sessions.

## Logo

The Foxford logo image is at `public/foxford-logo.png.png` (double extension — do not rename without updating the `<img>` src in the header). Referenced as `${process.env.PUBLIC_URL}/foxford-logo.png.png`.

## Deployment

Deployed to GitHub Pages at `https://kuboslav123456.github.io/Foxford-app`. Run `npm run build` and push — no separate deploy script is configured yet (`gh-pages` package is not installed).
