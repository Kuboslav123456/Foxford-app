# Foxford App — CLAUDE.md

## Čo je tento projekt
Interná prevádzková aplikácia pre kaviarne **Foxford**. React (Create React App) PWA bez backendu — všetky dáta sa ukladajú do `localStorage`. Odosielanie správ na server prebieha cez Google Apps Script URL.

## Technológie
- React 19, plain CSS-in-JS (inline štýly)
- jsPDF + jspdf-autotable — export PDF
- gh-pages — nasadenie na GitHub Pages

## Nasadenie
- **Live URL:** https://kuboslav123456.github.io/Foxford-app
- **Deploy:** `npm run deploy` (pushne `build/` do vetvy `gh-pages`)
- **Dev server:** `npm start` → http://localhost:3000/Foxford-app

## Štruktúra
Celá aplikácia je v jedinom súbore `src/App.js` (~1286 riadkov).

### Záložky (tab)
| tab | Obsah |
|-----|-------|
| `tasks` | Úlohy (denné / víkendové / mesačné) + HACCP záznamy |
| `temps` | Meranie teplôt (vitrína, chladnička, sklad) |
| `inventory` | Inventúra zásob s množstvami a poznámkami |
| `notes` | Poznámky / odovzdávka smeny |

### Pobočky
Aplikácia podporuje viacero pobočiek (výber na úvodnej obrazovke, PIN ochrana `1234`):
- **Obchodná** — má funkčnú Apps Script URL
- **Nivy** — má funkčnú Apps Script URL
- Cubicon, Levice, Martin, Žilina, Poprad, Prešov, Košice — URL zatiaľ placeholder (`URL_POBOCKA_X`)

### Kľúčové localStorage kľúče
- `foxford-tasks` — stav úloh
- `foxford-last-reset-date` — dátum posledného resetu úloh
- `foxford-temp-fields` / `foxford-temps` — teplotné záznamy
- `foxford-inventory` / `foxford-inventory-data` / `foxford-inventory-notes`
- `foxford-notes` — poznámky smeny
- `foxford-inspectors` — mená kontrolórov
- `foxford-haccp-date` — dátum HACCP záznamu

## Git
- **Hlavná vetva:** `main`
- **Pracovná vetva:** `claude/clone-github-project-NNImc`
- **GitHub Pages vetva:** `gh-pages` (auto-generovaná)

## Doterajšia história
- Implementovaná podpora viacerých pobočiek s PIN ochranou
- Opravená Apps Script URL pre pobočku Nivy
- Pridaný `gh-pages` deploy script
