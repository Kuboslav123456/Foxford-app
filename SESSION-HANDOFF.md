# Foxford App — Handoff zo session (2026-06-29)

> Lokálny záznam kontextu, aby sa pri vyčistení četu nič nestratilo. Tento súbor nie je
> potrebný v git histórii — pokojne ho presuň/zmaž, alebo si ho nechaj ako referenciu.

## Aktuálny stav
- **Live verzia: v39** (GitHub Pages: `https://kuboslav123456.github.io/Foxford-app`)
- Repo: `https://github.com/Kuboslav123456/Foxford-app` (branch `main`)
- Posledný commit: `2767d5d`

## Architektúra (rýchle pripomenutie)
- Celá appka je v **jednom súbore** `src/App.js` (~3800 riadkov). React PWA, offline-first.
- Verziovanie: bumpni **OBE** `public/version.json` a `src/index.js` (`APP_VERSION`) naraz.
- **Deploy = vždy 2 kroky:** `npm run deploy` (gh-pages build) **+** `git push origin main` (source).
- npm je na `C:\Program Files\nodejs\npm.cmd` (nie v PATH).
- Backend = per-pobočka Google Apps Script (`BRANCHES` v App.js, riadok ~45). Posiela sa cez
  `sendToSheets(type, payload)` / `sendOrQueue` (no-cors POST + offline fronta).
  - Obchodná + Nivy majú reálne URL; ostatné pobočky placeholdery `URL_POBOCKA_*`.
- Dev server: `preview_start` názov `kaviaren-app` (port 3000).
- **Pozn.:** screenshot v preview občas timeoutuje (živé hodiny držia renderer busy) —
  overovať sa dá cez `preview_eval` (čítanie DOM/innerText) a `preview_console_logs`.

## Čo spravila táto session (v30 → v39)

### v30 — OCR z bločka v Uzávierke (Tesseract.js)
- Tlačidlo „Nafotiť bloček" v tabe Uzávierka → `Tesseract.js` (`slk+eng`, dynamic import) rozpozná text.
- `parseUzavOcr()` vypĺňa polia z PORTOS bločka aj z výpisu platobného terminálu:
  - `OBRAT → SPOLU` → **B** (tržba); `Kartou` → **C**; `Qerko` → **D**; `Tringelt` → **E**;
    `Stravné lístky` → **F**; `Zaokrúhlenie` → **L**.
  - Terminál: `CELKOVÉ SÚČTY → CELKOM` → **C**; `DOXX` + `MOVEUPSK` → **sk** (stravné karty).
- Fix `extractNum`: „2254,69" sa už nerozbije na „69" (toleruje čiarku aj medzeru-z-čiarky).
- Fix: `±` (plus/mínus) na numpade len pre pole **L** (predtým omylom menilo K → zlé M).

### v31 — Odpisy: Prehľad po dňoch + DST-safe dátumy
- Nová karta „Prehľad po dňoch" medzi denným a mesačným súhrnom (read-only): ◀/▶ navigácia,
  rýchle skoky Dnes/Včera/Predvčerom, položky s dôvodom + množstvom + odkaz dňa.
- Bugfix: `yesterdayKey` a default prehliadača používajú kalendárovú aritmetiku `setDate()`
  namiesto odčítania 86 400 000 ms (DST-safe, inak ~1h okno po jarnom prechode chybovalo).

### v32 — HACCP gauge karty (Teploty)
- Každé zariadenie ako „gauge" karta: max pill, veľké číslo, status (Nevyplnené/V norme/Nad limitom),
  farebný horizontálny bar + škála. Chladnička škála −10..+15, mraznička −30..0.
- Zachované: zámok smeny (`activeDone`), editMode vetva.
- Fix: `% Alk.` aj tu — toleruje percento aj zlomok.

### v33 — PWA install ikona
- `public/logo192.png` + `logo512.png` = zlatý 3D hexagón na tmavom pozadí (bezpečná zóna ~74 %
  pre Android maskable). Pozn.: už nainštalovanú PWA treba preinštalovať, aby sa ikona zmenila.

### v34 — Čierny symbol na úvodnej obrazovke
- Branch picker: `<Logo>` SVG nahradený `public/foxford-symbol.png` (čierny hexagón). *(neskôr v35 nahradené wordmarkom)*

### v35 — Plný FOXFORD wordmark na úvodnej obrazovke
- `public/foxford-wordmark.png` — vektor z `Foxford_logo_3.pdf` rasterizovaný vo vysokom rozlíšení
  (2268 px) cez pdfjs, biele pozadie odstránené keyovaním → priehľadné. Odstránený text „FOXFORD"
  aj nepoužívaný `foxford-symbol.png`.

### v36 — Store picker Warm + loading screen + Evidencia liehu (XLSX)
- **Store picker (Warm dizajn):** biele karty, terakota `#C4472B`, pin ikona, chevron, 3px press-bar.
  Štýly v `src/index.css` (`.store-btn`). Použité na úvodnej obrazovke **aj** v prepínači pobočky
  (🏪 modal — predtým mal starý dizajn). Klik → krátky selected stav (220 ms) → vstup.
- **Loading screen:** čierny wordmark + animácie (vstup/plávanie/shine sweep maskou cez písmená/glow/
  progress bar), trvanie 2000 ms. Odstránený starý `Logo` SVG komponent.
- **Evidencia liehu (XLSX):** závislosť **ExcelJS**. Tab Alkohol → per-fľaša stále polia
  (objem, % alk., dodávateľ, číslo oprávnenia) + tlačidlo „Export evidencie liehu (XLSX)".
  Export v oficiálnom formáte (17 stĺpcov A–Q), vzorce: **M** `=H+I*E−K−L*E`, **N** `=P−M`,
  **Q (LAA)** `=P*F`, riadok SPOLU. % sa píše ako zlomok s formátom `0.0%`, toleruje „40" aj „0,4".
  Mesačné pohyby (G–L, O, P) sa dopĺňajú ručne v Exceli.

### v37 — Meniny v statusovom riadku
- V datetime bare pod dátumom „🎂 Meniny má <meno>", auto z dnešného dátumu (prepína sa o polnoci).
- Zabudovaný offline dataset `MENINY` (366 dní, konštanta v App.js), krížovo overený web-researchom.
  Dvojmená, priestupný 29.2 (Radomír), dni bez mena (sviatky) → „Dnes meniny nemá nikto".

### v38 — HACCP automatické „Nahlásené VZ"
- Pri teplote nad limitom (`status === 'err'`) sa pri karte automaticky zobrazí „🔴 Nahlásené VZ"
  popri „Nad limitom!".
- HACCP payload (`readings`) má teraz per položku `status` (OK/NAD LIMITOM) a `poznamka`
  ('Nahlásené VZ' pri prekročení) — doložiteľné pre RÚVZ.

### v39 — Víkendové úlohy: pondelkové upozornenie + nočný/ručný flush
- Víkendové sa už **neresetujú** cez víkend; v pondelok ostávajú otvorené na dorobenie.
- Pri otvorení tabu Úlohy **v pondelok** (ak ostali nedokončené a bola aktivita) → upozornenie:
  počet nesplnených + „Dokončiť úlohy" / „Resetovať zoznam na ďalší víkend".
- Odoslanie do Sheets: **automaticky v noci Po→Ut** (`performDailyClose` flushne víkendové + reset,
  raz za týždeň cez marker `foxford-vikend-week-done`), alebo hneď pri ručnom/popup resete.
- Zrušený okamžitý `autoSend` víkendových pri „všetky hotové" (proti duplicitám).

## Nové localStorage kľúče (tejto session)
- `foxford-zoom` (v29), `foxford-offline-queue`
- `foxford-vikend-week-done` = kľúč pondelka týždňa (dedup víkendového flushu)
- `foxford-vikend-prompt-day` = dateString (pondelkové upozornenie raz za deň)
- Alkohol katalóg položky majú nové polia: `objem, alk, dodavatel, cisloOpravnenia`

## Pridané závislosti
- `tesseract.js` (OCR, v30), `exceljs` (XLSX export, v36).
- Dočasne (—no-save) bol pri v35 použitý `pdf-to-img`/`pdfjs-dist`/`@napi-rs/canvas` na rasterizáciu
  loga — do `package.json` sa nedostali.

## Otvorené nápady (z konkurenčného researchu — NEimplementované)
Priorita (hodnota/námaha): 1) HACCP nápravné akcie (✓ čiastočne spravené vo v38),
2) meno+čas na každej úlohe, 3) kasa: dôvod + PIN pri manku, 4) Sklad: par hladiny + objednávací
zoznam, 5) foto dôkaz pri úlohách, 6) potvrdenie prečítania správ, 7) detekcia nesplnených denných
úloh, 8) otváracie/zatváracie úlohy podľa času. Ďalšie: ceny na odpisoch + € waste report,
EAN skenovanie, príjem tovaru, audit-ready compliance PDF, cross-branch dashboard, alergénová matica.

## TODO / pozn. do budúcna
- Mesačné úlohy: zatiaľ bez automatického flushu (rieši len `autoSend` pri „všetky hotové"). Dá sa
  pridať obdoba víkendového flushu (1. v mesiaci).
- GAS na strane pobočiek: voliteľne pridať stĺpce `status`/`poznamka` (HACCP) a prijímať
  `tasks_summary` kategóriu `víkendové` (už spracúva).
- Placeholder URL pobočiek (Cubicon…Košice) — doplniť reálne Apps Script URL keď budú.
