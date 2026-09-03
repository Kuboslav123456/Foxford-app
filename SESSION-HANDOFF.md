# SESSION HANDOFF — August 2026

## Aktuálna verzia
**v66 — nasadené** (2026-09-03, overené live cez `version.json`). Tablety na v54+ ju aplikujú ráno o 5:00 (ranné okno), alebo hneď cez ⟳ v ozubenom koliesku.

### v66: Prehľady — detail úloh + inteligentné upozornenia
Len manažérske Prehľady (`src/Prehlady.js`), tabletová appka nezmenená.
- **Detail nesplnených/problémových úloh**: nová karta so zoznamom konkrétnych úloh (deň, zmena, úloha, kto, problém/stav). Klik na stĺpec grafu „Úlohy podľa kategórie" filtruje detail podľa kategórie (state `filterKat`, chart onClick).
- **Inteligentné upozornenia**: karta „⚠️ Upozornenia" (predtým len stav kasy) teraz aj: opakovaný nahlásený problém (tá istá úloha s issue ≥3× v období) a opakované HACCP prekročenie (to isté zariadenie ≥3×).
- tasks_log select rozšírený o task, issue, done_by. Demo (#prehlady-demo) generuje aj názvy úloh + problémy.

### v65: Supabase dual-write + manažérske Prehľady (#prehlady)
Veľký krok — appka odteraz popri Google Sheets zapisuje aj do Supabase (Postgres, EÚ) a pribudol **manažérsky režim**. Prevádzková appka na tabletoch je NEDOTKNUTÁ.
- **Dual-write**: `sbMirror(type, payload)` v App.js zavesené na `sendToSheets`/`sendOrQueue` — mapuje 7 typov eventov na Supabase tabuľky, beží nezávisle od GAS. Bez env kľúčov = no-op. Offline fronta `foxford-sb-queue`.
- **Prehľady** (`src/Prehlady.js`, lazy chunk): otvárajú sa cez hash `#prehlady` — `index.js` gate renderuje App (tablety, nezmenené, chunk Prehľadov si ani nestiahnu) alebo Prehľady. Prihlásenie Supabase Auth, prístup per pobočka cez tabuľku `manager_pobocky` + RLS. Tržbová časť prenesená z appky OBRATOVÁ TABUĽKA (filter Deň/Týždeň/Mesiac/Rok, podiely platieb, stav kasy + upozornenia, História). Ukážka bez prihlásenia: `#prehlady-demo`.
- **História Obchodnej 2023–2026** (1277 dní) naimportovaná do `uzavierky_log` (meno='import OBRATY').
- Schéma/prístup v repe: `supabase/schema.sql`, `manager-access.sql`, `reporting-user.sql`, `import-obraty.mjs`, `PLAN.md`.
- Bundle: hlavný chunk +1.3 kB (len index.js gate), Prehľady v samostatnom lazy chunku 366 (~124 kB, tablet nesťahuje). Anon (publishable) kľúč je v bundli zámerne — insert-only cez RLS; service_role kľúč v bundli NIE JE (overené).
- **Správa manažérov** = klikanie v Supabase: Authentication → Add user (odporúčam Auto Confirm) + riadok v `manager_pobocky`. Admin Jakub ('*') už vložený.

### v64: doGet vyžaduje token — zálohy a uzávierky už nie sú čitateľné bez neho
Bezpečnostná diera: `doGet` (`?backup=latest` = celá záloha appky vrátane súm v uzávierkach; holé URL = JSON Uzávierok pre OBRATY) nekontroloval token — stačila znalosť URL, ktorá je vytiahnuteľná z verejného bundle. Zápis (`doPost`) token kontroloval vždy.
- `gas/Code.gs`: doGet hneď na začiatku overí `?token=` proti TOKEN, inak `{error:'Unauthorized'}`
- App.js `restoreFromCloud`: posiela `&token=` (REACT_APP_GAS_TOKEN) — staré GAS nasadenia param ignorujú, takže funguje s oboma verziami skriptu
- **AKTIVUJE SA až po nasadení novej verzie Code.gs na pobočke** (Obchodná: vložiť + Nová verzia; Nivy: dostane s novou tabuľkou). Ručné stiahnutie zálohy odteraz: `?backup=latest&token=TVOJ_TOKEN`
- Staré Obchodná nasadenie (AKfycbz…, používa ho OBRATY tabuľka na čítanie Uzávierok) ostáva bez tokenu — jeho URL nie je v bundle appky, len v skripte OBRATY tabuľky. Ak sa OBRATY niekedy prepne na novú URL, musí pridať `&token=`
- Zostatkové riziko (inherentné client-only architektúre): token je zapečený v bundle — kto ho vytiahne, vie zapisovať riadky a stiahnuť zálohu SVOJEJ pobočky. Riešenia na diskusiu: rotácia tokenu pri prechode na firemný git, per-pobočkové tokeny, backend proxy

### v63: Odpisy všade s aktuálnou jednotkou z katalógu
Nadväzuje na v62 (zmena jednotky položky). Odpisové záznamy si pri pridaní ukladajú snapshot jednotky — po zmene jednotky v Sklade tak polnočné `odpis_daily` do GS, mesačný súhrn/PDF a prehliadač starších dní ukazovali starú. Teraz všetky tri miesta preferujú aktuálnu jednotku z katalógu (`unitById[e.itemId]`), snapshot `e.unit` je fallback pre položky zmazané z katalógu. Denný zoznam odpisov to tak robil už predtým (`catalogUnit`). PORTOS export jednotky neobsahuje (`kód;množstvo`) — bez vplyvu, ale číslo musí sedieť s jednotkou nastavenou v PORTOSe.

### v62: Zmena jednotky položky skladu (edit mód)
Požiadavka: „pri víne máme ks, ale potrebujeme L — tlačidlo zlá jednotka? upraviť“.
- V edit móde skladu je chip jednotky klikateľný (zlatý dashed rámik + ✎); mimo edit módu je statický ako doteraz
- Klik otvorí modal **Jednotka položky**: 6 predvolieb (ks/l/kg/g/ml/bal, aktuálna zvýraznená) + vstup na vlastnú jednotku (napr. „fľaša“, Enter alebo OK)
- Ukladá sa do `invData` → `foxford-inventory-data`; numpad aj GS export automaticky preberajú novú jednotku (PORTOS export jednotku neobsahuje — bez vplyvu)
- **Migrácia pri budúcom bumpe `INV_DATA_VERSION`**: lokálne zmenené jednotky sa teraz prenášajú (predtým by bump vrátil jednotky na základ; vlastné položky sa prenášali už predtým). Lokálna jednotka má prednosť pred novým základom.
- Nové stavy: `unitPicker` { category, item }, `unitCustom`

### v61: Splnené úlohy klesajú dole aj v zoznamoch so sekciami
Zoznamy so sekciami (víkendové, večerné, mesačné) sa doteraz vôbec netriedili — splnená úloha ostala na mieste, kým pri ranných (bez sekcií) klesla dole (nahlásené používateľom: „víkendové ostávajú na mieste“). Render sort v tabe Úlohy teraz triedi **v rámci každej sekcie**: splnené na koniec svojej sekcie, urgentné na začiatok, poradie sekcií a nadpisov sa nemení, úloha nikdy nepreskočí pod cudzí nadpis. Bez sekcií správanie nezmenené. Triedi sa len zobrazovacia kópia — uložené poradie v `foxford-tasks` (a teda aj poradie vo flushoch do GS) ostáva pôvodné. Overené v prehliadači (2 sekcie × 2 úlohy: splnená klesla pod nesplnenú vo svojej sekcii, druhá sekcia nedotknutá).

### v60: Víkendové (a všetky) úlohy sa autoodosielajú hneď po dokončení
Používateľ nahlásil, že víkendové úlohy neprichádzajú do tabuľky — `autoSend` ich zámerne preskakoval (čakalo sa na pondelkový nočný flush, čiže riadky prišli až v utorok s pondelkovým dátumom). Prekopané odosielanie `tasks_summary`, aby sa nič nestrácalo ani neduplikovalo:

- **`autoSend` posiela VŠETKY taby** hneď po dokončení celého zoznamu (inšpektor vyplnený). Dedup marker `foxford-{tab}-autosent` = obdobie zoznamu: denné → dnešný dátum (sk-SK), víkendové → kľúč najbližšieho pondelka (`d + (8−getDay())%7` → `weekMondayKey`), mesačné → `YYYY-MM`. Mesačné tým dostali dedup (audit nález 🟠 z 2026-08-25 — dovtedy duplicity pri odškrtnutí/dokončení a s koncomesačným flushom).
- **Flushy v `performDailyClose`** preskočia odoslanie len ak marker sedí **a zoznam je celý splnený/vyriešený** — ak po autoodoslaní niečo pribudlo alebo sa odškrtlo, flush pošle aktuálny stav (radšej riadok navyše než stratené dáta). Reset zoznamu + week/month markery bežia vždy ako doteraz.
- **Denný flush filtruje hlavičky sekcií** — večerné hlavičky („Rajóny všeobecne“…) doteraz chodili do hárku Úlohy ako falošné ✗ riadky.
- **Manuálny reset** (`doReset`, pondelkový `flushVikendNow`) zmaže autosent marker daného tabu = nový cyklus, ďalšie dokončenie v tom istom období sa znova autoodošle.

Overené v prehliadači na pobočke s placeholder URL (Cubicon — vidno `skipped` warn, žiadny reálny GAS traffic): okamžité odoslanie po dokončení víkendových ✓, marker `2026-08-31` ✓, pondelkový flush cez catch-up bez markera pošle ✓, s markerom nepošle ale resetne + zapíše week-done ✓. GAS `tasks_summary` handler kategóriu len zapisuje do stĺpca — na strane tabuľky netreba nič meniť. Pozn.: minihra sa odteraz odomkne aj po dokončení víkendových/mesačných rovnako ako predtým (celebrate logika nezmenená).

### v59: Minihra Latte art timing (odmena po dokončení úloh)
- Komponent `LatteArtGame` (module-level, props `C`/`playerName`/`onClose`): kmitajúca čiara (rAF + ref, nie setState per frame), ťuk kdekoľvek na overlay v zelenej zóne = nálev; 5 nálevov postupne dokreslí latte art (SVG vrstvy); každý nálev `speed += 0.009`, zóna `24 − r·3.5 %`; body `max(10, 100 − dist·(100/polovica zóny))`; hodnosti 430/330/200 → Latte art šampión/Hlavný barista/Barista/Junior barista
- Otvára sa **výhradne** tlačidlom „🎁 Odmena — zahraj si (30 s)“ v celebrate overlayi (všetky úlohy splnené/vyriešené)
- **1 hra na dokončený zoznam** (deň+tab): `foxford-game-played` = `{day, tabs[]}` — zapisuje sa **pri spustení** (`startGame`), žiadne „hrať znova“; ďalšia hra až po ďalšom dokončenom zozname
- Skóre: `foxford-game-scores` = Top 10 `{name, score, date}` (meno z inšpektora tabu, fallback Anonym); zobrazuje sa po konci hry so zvýraznením aktuálneho záznamu; kľúče foxford-* → automaticky v zálohách
- X vpravo hore = okamžitý návrat kedykoľvek (pokus prepadne — marker už je zapísaný)
- Overené naostro cez víkendové úlohy (autoSend ich preskakuje → žiadny GAS traffic pri teste): celý flow + blokovanie druhej hry + návrat

### v58: Fix pádu appky — notifikácie čítali zaniknutý kľúč `denné`
Kľúč `denné` zanikol pri rozdelení na ranné/večerné (v48), ale tri notifikačné miesta ho ďalej čítali:
1. **Kontrola pri otvorení appky** volala `tasks.denné.filter` na `undefined` → TypeError v useEffect → **biela obrazovka**. Trigger: zapnutá pripomienka denných úloh + granted + čas po pripomienke. Pravdepodobná príčina časti historických „tablet sa nenačíta“.
2. Denná pripomienka počas dňa videla prázdny zoznam → nikdy nevystrelila.
3. Víkendová pripomienka rátala hlavičky sekcií ako úlohy → zlé čísla, pripomínala aj po dokončení.

Fix: modulový helper `reminderCounts(...lists)` — denné = ranné + večerné, hlavičky sa nepočítajú, notifikácia len keď `total > 0`. Overené na živých dátach (starý výraz padá, nový ráta 63 denných / 32 víkendových).

### Audit 2026-08-25 — otvorené nálezy (zatiaľ neopravené)
- ✅ ~~mesačné autoSend bez dedup markera~~ — **opravené vo v60** (dedup markery pre všetky taby, viď vyššie)
- 🟠 zmazanie hlavičky sekcie nechá jej úlohy „prilepené“ k predošlej sekcii; ak bola vybraná v Nová úloha, výber ukazuje „—“ a úloha padne na koniec
- 🟠 **Nivy stále beží na starom GAS** (per-day odpisy taby, žiadny backup) — nasadiť gas/Code.gs s TOKENom Nivy
- 🟡 v hárku Zálohy (Obchodná) sú TEST riadky z 6.–7.8. diagnostiky — zmazať
- 🟡 retencia: odpisy/uzávierky/alkohol/notes rastú donekonečna (návrh: pri polnočnej uzávierke držať ~13 mesiacov)
- ℹ️ PIN 1234 + GAS token vytiahnuteľné z verejného bundle (nízke riziko, vedieť o tom)
- ✅ minihra Latte art timing — **IMPLEMENTOVANÁ vo v59** (detail vyššie). Zostávajúce nápady k nej (neimplementovať bez pokynu): GAS event `game_score` → hárok Skóre → rebríček medzi pobočkami; druhá hra „Chytaj zrnká“ (prototyp `chytaj_zrnka_demo` v chate 2026-08-25, akčná — šálka ťahaná prstom, červený črep = koniec) — prípadné striedanie hier.

### v57: Pridávanie úlohy do vybranej sekcie
`+` pridával úlohu vždy na koniec CELÉHO zoznamu — pri víkendových (majú sekcie Rajón/Bar/Zázemie a sklad) pristála mimo obrazovky pod poslednou sekciou, takže to vyzeralo, že + nefunguje (nahlásené používateľom).

- V editácii je hore zvýraznený box **Nová úloha** (dashed zlatý rámik, `Tag`): pri zoznamoch so sekciami chipy na výber sekcie (default prvá), hint pod vstupom hovorí, kam sa úloha vloží
- `addTask()`: vloženie na koniec VYBRANEJ sekcie (pred ďalší header); bez sekcií na koniec zoznamu; Enter aj + zdieľajú tú istú funkciu
- Po pridaní `scrollIntoView` na novú úlohu + 2,4 s flash (`.task-flash`, keyframes `taskFlash` v globálnom `<style>`); riadky úloh majú `id="task-<id>"`
- Stavy: `newTaskSection` (resetuje sa pri zmene `effectiveTab`), `justAddedId`

**Pozor (PowerShell):** commit message s dvojitými úvodzovkami sa v PS 5.1 rozbije pri odovzdaní gitu (argument sa rozsekne) — v messagi ich nepoužívať. A nikdy nerobiť bump verzie cez `Get-Content -Raw | Set-Content` — rozbije UTF-8 diakritiku (stalo sa, súbor bolo treba vrátiť z gitu); na úpravy používať Edit tool.

### v56: Mesačný flush úloh
Mesačné úlohy sa doteraz nikdy neodosielali ani neresetovali. Teraz zrkadlia víkendový vzor v `performDailyClose`: posledný deň mesiaca (real-time polnoc) alebo 1. v mesiaci (catch-up) → `tasks_summary` kategórie `mesačné` → reset úloh (headery zostanú) + vymazanie inšpektora. Dedup cez `foxford-mesacne-month-done` (kľúč `YYYY-MM` končiaceho mesiaca). Hraničné prípady (prelom roka, priestupný február) overené.

### v55: Zobrazenie verzie
Modal zálohovania (ozubené koliesko) dole ukazuje `Verzia v tomto zariadení: vNN · najnovšia` alebo `· čaká vMM na 5:00`. `window.FOXFORD_VERSION` + `window.FOXFORD_UPDATE_HOUR` nastavuje `src/index.js`.

### v54: Aktualizácia sa aplikuje až ráno o 5:00
Reload uprostred zmeny zhadzoval obsluhe rozpísanú inventúru/odpis. Nová verzia sa teraz iba zaznamená (`window.FOXFORD_PENDING_UPDATE` + event `foxford-update-pending`) a reload sa spustí len keď `new Date().getHours() === UPDATE_HOUR` (=5). Kontrola beží každých 15 min, aby ju tablet bežiaci nonstop zachytil. `SW_UPDATED` reload je gatovaný rovnako.

Cez deň svieti na ozubenom koliesku zelená bodka a v modáli je tlačidlo **⟳ Aktualizovať teraz** (`window.foxfordApplyUpdate`). Hodina = konštanta `UPDATE_HOUR` v `src/index.js`.

### v53: Oprava nenačítania nainštalovanej PWA po update
Dve chyby, obe bili hlavne do PWA (v Chrome sa dali obísť):
1. `service-worker.js` mal precache cesty od koreňa domény (`/index.html`) namiesto od scope SW (`/Foxford-app/`). Všetky štyri vracali 404, `addAll()` je atomické → **precache ostávala vždy prázdna** a offline fallback ukazoval na neexistujúce `/`. Teraz sa cesty odvodzujú z `self.registration.scope`, cachujú sa po jednom (`c.add().catch()`) a navigačný fallback padá na scope + `index.html`. Cache bumpnutá na `foxford-v7`.
2. Detekcia novej verzie mazala **všetky** cache a odregistrovala SW, až potom reloadla. V tom okne appka nabiehala s prázdnymi rukami a pri zakolísaní siete (tablet po prebudení) nemala z čoho nabehnúť. Navigácia je pritom network-first, takže stačí `reload()`. Pridaná poistka proti nekonečnému reloadu cez `sessionStorage`.

**Cache/SW ≠ dáta.** `caches.delete()` + `unregister()` localStorage NEmažú (overené empiricky na živej appke). Dáta zmaže len „Vymazať údaje/úložisko“ v Androide alebo „cookies a údaje stránok“ v Chrome.

### v52: Zlyhané odoslanie končí vo fronte, nie v koši
`sendOrQueue` aj `doFetch` pri chybe siete položku zaradia do `foxford-offline-queue`. Predtým `.catch(() => {})` chybu zahodil — a keďže odpisy/úlohy/alkohol sa posielajú **iba raz** (polnočná uzávierka, bez markera o odoslaní), dáta sa stratili navždy. `navigator.onLine` býva true aj keď je tablet uspatý alebo vypadne wifi, takže offline vetva to nezachytila.

Fronta sa navyše skúša odoslať **každých 5 minút** (`flushQueue` v `useCallback` + interval), nielen pri štarte a zmene konektivity — inak by položka z polnoci čakala do ďalšieho otvorenia appky. Záloha (`type: 'backup'`) sa do fronty **nezaraďuje** (`doFetch(..., false)`) — opakuje sa sama každé 4 h a snapshot je veľký.

**Incident 7.8.2026:** odpis za 6.8. (káva 0,02 kg) sa nedostal do tabuľky presne z tohto dôvodu. Diagnostikované cez `?backup=latest` — snapshot ukázal, že odpis v localStorage je, `foxford-last-reset-date` = 7.8. (uzávierka prebehla) a offline fronta je prázdna → odoslanie zlyhalo a bolo zahodené. Odpis doposlaný ručne cez POST na GAS.

### v51: Zálohovanie presunuté do ozubeného kolieska
- Nový gear button v hlavičke (vľavo od zoomu) otvára modal **Zálohovanie dát**
- Modal: sekcia *Automaticky* (stav zálohy do tabuľky + prepínač zálohy do súboru) a *Obnova a ručná záloha* (☁ obnova z tabuľky, stiahnuť, obnoviť zo súboru)
- Bodka na koliesku keď auto-záloha potrebuje zásah alebo je záloha stará
- Tab Sklad vyčistený od záloh; 7-dňová pripomienka otvára modal; samostatný 💾 badge odstránený

## Deploy — na čo si dať pozor
**„Published“ z `gh-pages` NEZNAMENÁ, že je to živé.** GitHub potom ešte púšťa workflow *pages build and deployment*. 6.8.2026 tri behy po sebe zlyhali na **„Timeout reached, aborting!“** — deployment stál vo fronte 9+ min, kým krok `actions/deploy-pages@v5` má limit 10 min (`timeout: 600000`). 7.8. už prešlo bez zásahu, čiže išlo o prechodné spomalenie na strane GitHubu.

**Po každom deployi overiť:**
1. Beh: `api.github.com/repos/Kuboslav123456/Foxford-app/actions/runs?per_page=3` (bez tokenu, nízky rate limit — nepolluj v cykle)
2. Živú verziu: `version.json?x=<random>` — **bare URL vracia cache** (Fastly `max-age=600`), query param ju obíde

**Retrigger bez zmeny obsahu** (gh-pages nič nepushne, keď je build identický) — prázdny commit:
`$t=git rev-parse 'origin/gh-pages^{tree}'; $p=git rev-parse origin/gh-pages; $n=git commit-tree $t -p $p -m retry; git push origin "$($n):gh-pages"`

**Ak by padalo opakovane:** vlastný `.github/workflows/deploy.yml` s `actions/deploy-pages` a `timeout: 1800000` + používateľ prepne Settings → Pages → Source na „GitHub Actions“ (odpadol by aj `npm run deploy`). Zatiaľ neurobené — nebolo treba.

### v50: Auto-záloha na disk (File System Access API)
- Prepínač **💾 Auto-záloha na disk** v tabe Sklad pod ručnou zálohou — používateľ raz vyberie súbor (Dokumenty/OneDrive/Disk Google), appka doň priebežne zapisuje snapshot všetkých `foxford-*` kľúčov (interval 60 s + visibilitychange, len pri reálnej zmene dát)
- Handle súboru v IndexedDB (`foxford-fs`); stavy: off / on / need-permission (po reštarte Chrome) / error / unsupported
- Badge 💾 v hlavičke keď treba zásah (povolenie/chyba); pripomienka pri štarte ak záloha >7 dní (`foxford-last-backup`, dismiss per deň cez `foxford-backup-prompt-day`)
- Dostupnosť cez feature-detect `window.showSaveFilePicker`; kde chýba, prepínač sa skryje a pripomienka ponúkne ručný export. **Overené 6.8.2026: funguje aj na prevádzkovom tablete** — staršie tvrdenie „Android to nevie“ neplatí, netreba to obchádzať
- Formát súboru = ručná záloha (`{ _app:'foxford', _exported, _branch, data }`) → obnova cez 📥 Obnoviť zálohu
- `exportBackup`/auto-záloha zdieľajú `backupSnapshotData()` — dynamický sken `foxford-*` kľúčov (bez hardcoded zoznamu)

### v50: Cloud záloha cez GAS (pre tablety)
- `maybeGasBackup()` — pošle celý snapshot ako event `backup` na GAS pobočky; GAS ho uloží do **skrytého hárku „Zálohy“** v tabuľke pobočky (1 riadok/deň/pobočka, JSON delený po 45k znakov do stĺpcov D+, retencia 60)
- **Drive sa NEPOUŽÍVA**: `DriveApp.createFolder` hádže Unauthorized — Workspace účet pobočky (obchodna@foxford.sk) dostane len `drive.readonly`, zápis Google neudelí ani cez opakovanú autorizáciu. Hárok tabuľky žiadne nové povolenie nepotrebuje.
- Stiahnutie zálohy: URL webhooku s `?backup=latest` (alebo `?backup=YYYY-MM-DD`) → JSON → uložiť ako .json → Sklad → 📥 Obnoviť zálohu
- **Obchodná má novú webhook URL** `AKfycby5DTfik…` (nasadenie pod obchodna@foxford.sk). Staré `AKfycbzlcPT4…` ostalo na staršej verzii kódu — appka naň už neposiela, ale OBRATY tabuľka ho stále používa pre `doGet`.
- Trigger: 10 s po otvorení appky + visibilitychange hidden; throttle 4 h (`foxford-gas-backup-ts`); len online, offline sa nequeue-uje
- Optimisticky nastavuje `foxford-last-backup` (no-cors → doručenie sa nedá overiť) → utíši 7-dňovú pripomienku
- Obnova: stiahnuť JSON z Drive → Sklad → 📥 Obnoviť zálohu
- **Kompletný GAS skript je teraz v repo: `gas/Code.gs`** (zrekonštruovaný z transcriptu session 22.6. + júlový flat Odpisy + nový backup handler; TOKEN placeholder — doplniť z doterajšieho scriptu). `doGet` číta Uzávierky pre OBRATY tabuľku — nemazať. Nasadiť treba na každú pobočku s reálnou URL (Obchodná, Nivy).

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
- [x] Mesačné úlohy — auto-flush na prelome mesiaca (v56)
- [ ] Agregácia tržieb / cross-branch dashboard (odložené)
- [ ] Nivy GAS — beží na starom kóde: chýba `alkohol_daily`, `backup`, flat Odpisy. Fix = vložiť `gas/Code.gs` (s tokenom Nivy) do jej skriptu a nasadiť novú verziu — rovnaký postup ako Obchodná 6.-7.8. Pozor na účet: nasadzovať prihlásený ako účet pobočky (nivy@foxford.sk?), ideálne v samostatnom Chrome profile.

---

## Nasadenie

**GitHub Pages**: `https://kuboslav123456.github.io/Foxford-app` — tablety pristupujú cez tento URL a samy detekujú novú verziu cez `version.json`.

Deploy = bump verzie v 2 súboroch (`public/version.json` + `src/index.js`) → `npm run deploy` → `git push origin main`. Detail v CLAUDE.md.

Dev server: `npm start` / `preview_start` s názvom `kaviaren-app` (.claude/launch.json).
