# SESSION HANDOFF — August 2026

## Aktuálna verzia
**v50** — `src/index.js` APP_VERSION = 50, `public/version.json` v = 50

### v50: Auto-záloha na disk (File System Access API)
- Prepínač **💾 Auto-záloha na disk** v tabe Sklad pod ručnou zálohou — používateľ raz vyberie súbor (Dokumenty/OneDrive/Disk Google), appka doň priebežne zapisuje snapshot všetkých `foxford-*` kľúčov (interval 60 s + visibilitychange, len pri reálnej zmene dát)
- Handle súboru v IndexedDB (`foxford-fs`); stavy: off / on / need-permission (po reštarte Chrome) / error / unsupported
- Badge 💾 v hlavičke keď treba zásah (povolenie/chyba); pripomienka pri štarte ak záloha >7 dní (`foxford-last-backup`, dismiss per deň cez `foxford-backup-prompt-day`)
- **Android Chrome `showSaveFilePicker` nepodporuje** → na tabletoch sa prepínač skrýva, pripomienka ponúka ručný export (download funguje)
- Formát súboru = ručná záloha (`{ _app:'foxford', _exported, _branch, data }`) → obnova cez 📥 Obnoviť zálohu
- `exportBackup`/auto-záloha zdieľajú `backupSnapshotData()` — dynamický sken `foxford-*` kľúčov (bez hardcoded zoznamu)

### Incident 6.8.2026 (poučenie)
Tablet sa nenačítal (zaseknutý service worker po v49 deployi). Pri záchrane dát cez provizórnu `export-data.html` bol hardcoded zoznam kľúčov **bez `foxford-odpisy` a `foxford-alkohol`** → stratené nedoslané odpisy a alkohol za deň. Preto v50 auto-záloha + dynamický sken kľúčov. Pomocné stránky `public/clear-sw.html`, `export-data.html` (opravená, už so všetkými kľúčmi), `import-data.html` ostávajú nasadené pre budúce záchrany.

---

## Čo sme urobili

### GAS: odpis_daily — flat Odpisy hárok
Handler `odpis_daily` v Google Apps Script upravený: namiesto per-dňových tabov (napr. "Streda 9.7") sa všetky záznamy zapisujú do jedného hárku **Odpisy**. Hárok sa vytvorí automaticky ak neexistuje (tučný header, zmrazené riadky, šírky stĺpcov).

Štruktúra riadku: `Dátum | Zodpovedný | Produkt | Množstvo | Jednotka | Dôvod | Odkaz kolegovi`

GAS kód nasadený ručne — nie je v repozitári.

### v47: Auto-odoslanie denných úloh
- Keď sú všetky úlohy vyriešené (done alebo issue) a inšpektor vyplnený → `autoSend()` odošle automaticky
- Dedup cez `localStorage` kľúče `foxford-ranné-autosent` / `foxford-večerné-autosent` (hodnota = SK locale dátum)
- `performDailyClose` (polnočná uzávierka) kontroluje rovnaký kľúč — ak už odoslané, preskočí

### v48: Ranné / Večerné rozdelenie denných úloh
- Tab DENNÉ zostal ako outer tab
- Vnútri pribudol prepínač **RANNÉ / VEČERNÉ** (`denneTab` state)
- `effectiveTab` computed variable: `subTab === 'denné' ? denneTab : subTab` — všetky task operácie používajú `effectiveTab`
- Každý tab má vlastného inšpektora, progress bar, autoSend, polnočné odosielanie
- Migrácia: detekuje starý kľúč `denné` v localStorage a prenesie na `ranné`
- `INIT_TASKS.ranné` = 17 pôvodných ranných úloh (id 101–117)

### v49: Večerné úlohy — 46 položiek v 10 sekciách
`INIT_TASKS.večerné` naplnené (id 500–604):

| Sekcia | IDs | Počet úloh |
|--------|-----|------------|
| Rajóny všeobecne | 500–503 | 3 |
| 300 | 510–513 | 3 |
| 400 | 520–525 | 5 |
| CW | 530–532 | 2 |
| 500 | 540–541 | 1 |
| 600 | 550–551 | 1 |
| Vitrínka | 560–566 | 6 |
| Bar | 570–583 | 13 |
| WC | 590–596 | 6 |
| Vysávanie a umytie podlahy | 598–604 | 6 |

`TASKS_VERSION` bumped `'3'` → `'4'` — migrácia pri prvom načítaní nahradí prázdne `večerné: []` novým zoznamom na všetkých zariadeniach.

---

## Bugy opravené

1. **Večerné sa nezobrazili po nasadení** — `TASKS_VERSION` zostala `'3'`, zariadenie preskočilo migráciu. Navyše `večerné` chýbalo v `mergeDone` bloku. Fix: verzia na `'4'` + pridanie `večerné: mergeDone(INIT_TASKS.večerné, parsed.večerné)`.

2. **React uncontrolled input warning (v48)** — `inspectors[effectiveTab]` mohol byť `undefined`. Fix: `value={inspectors[effectiveTab] || ''}`.

3. **Štyri miesta s `[subTab]` namiesto `[effectiveTab]` (v48)** — `replace_all` nezachytil všetky výskyty v `setTasks(...)`. Fix: ručná oprava.

4. **UTF-8 v PowerShell testoch** — PS 5.1 neposiela UTF-8 automaticky. Fix: `[System.Text.Encoding]::UTF8.GetBytes($body)` + `charset=utf-8`. (Appka cez `fetch()` posiela UTF-8 správne.)

5. **curl 411 Length Required** — curl strácal POST body po GAS redirecte. Fix: `Invoke-RestMethod -MaximumRedirection 5`.

6. **GAS `appendRow()` error** — starý script mal prázdny separator riadok. Fix: nasadiť nový script.

---

## Stav kľúčových súborov

| Súbor | Stav |
|-------|------|
| `src/App.js` | TASKS_VERSION = '4'; INIT_TASKS.večerné = 56 položiek (46 úloh + 10 headerov) |
| `src/index.js` | APP_VERSION = 49 |
| `public/version.json` | { "v": 49 } |
| `.env.local` | REACT_APP_GAS_TOKEN nastavený (nie v gite) |
| GAS script | Nasadený ručne — handlery: haccp, tasks_summary, odpis_daily, alkohol_daily, uzavierka, inventory |

---

## Otvorené úlohy / TODO

- [ ] Placeholder GAS URL pre pobočky Cubicon, Levice, Martin, Žilina, Poprad, Prešov, Košice (`URL_POBOCKA_*`)
- [ ] Mesačné úlohy — zatiaľ bez auto-flushu (1. v mesiaci)
- [ ] Agregácia tržieb / cross-branch dashboard (odložené)
- [ ] Nivy GAS — chýba `alkohol_daily` handler

---

## Nasadenie

**GitHub Pages**: `https://kuboslav123456.github.io/Foxford-app` — tablety pristupujú cez tento URL a samy detekujú novú verziu cez `version.json`.

Deploy = bump verzie v 2 súboroch (`public/version.json` + `src/index.js`) → `npm run deploy` → `git push origin main`. Detail v CLAUDE.md.

Dev server: `npm start` / `preview_start` s názvom `kaviaren-app` (.claude/launch.json).
