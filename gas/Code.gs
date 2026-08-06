// ═══════════════════════════════════════════════════════════════════════════
// FOXFORD — Google Apps Script (kompletný, per pobočka)
//
// NASADENIE:
//   1. V Apps Script editore zmaž celý starý obsah a vlož tento súbor.
//   2. TOKEN: prepíš 'SEM_VLOZ_SVOJ_TOKEN' hodnotou zo svojho DOTERAJŠIEHO
//      scriptu (riadok `const TOKEN = '...'`) — musí sedieť s tokenom appky
//      (.env.local → REACT_APP_GAS_TOKEN), inak GAS odmietne všetky zápisy.
//   3. Nasadiť → Spravovať nasadenia → ceruzka → Nová verzia → Nasadiť.
//      URL webhooku zostane rovnaká, v appke netreba nič meniť.
//
// HANDLERY (doPost): haccp, tasks_summary, inventory, odpis_daily,
//   alkohol_daily, uzavierka_daily, bug_report, backup (NOVÉ — záloha dát appky)
// doGet: číta hárok Uzávierky pre OBRATY tabuľku — NEMAZAŤ.
//   Navyše ?backup=latest vráti poslednú zálohu appky ako JSON.
//
// ŽIADNE NOVÉ POVOLENIA: zálohy idú do skrytého hárku „Zálohy“ v tejto tabuľke,
//   nie na Google Drive (naň Workspace účet pobočky nedostane povolenie na zápis).
//
// ODPISY: odteraz jeden hárok „Odpisy“ (riadok = záznam), NIE per-dňové taby.
//   Staré taby „Odpisy 31. 7. 2026“ zmigruješ jednorazovo: v editore hore vyber
//   funkciu `migrateOdpisyTabs` → Spustiť (presunie záznamy a taby zmaže).
// ═══════════════════════════════════════════════════════════════════════════

const TOKEN = 'SEM_VLOZ_SVOJ_TOKEN';

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // ?backup=latest (alebo ?backup=2026-08-06) → vráti uloženú zálohu appky.
    // Bez parametra sa správa ako predtým — dáta Uzávierok pre OBRATY tabuľku.
    var wanted = (e && e.parameter && e.parameter.backup) ? String(e.parameter.backup) : '';
    if (wanted) return backupResponse(ss, wanted);

    var sheet = ss.getSheetByName('Uzávierky');
    if (!sheet) return jsonResponse({ error: 'Hárok "Uzávierky" nebol nájdený.' });

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return jsonResponse({});

    var data = sheet.getRange(2, 1, lastRow - 1, 23).getValues();
    var result = {};

    data.forEach(function(row) {
      var dateVal = row[0];
      if (!dateVal) return;
      var dateStr = parseDate(dateVal);
      if (!dateStr) return;
      result[dateStr] = {
        date: dateStr,
        day_name: getSlovakDay(dateStr),
        fxf: {
          obrat:            num(row[9]),
          zaokruhly:        num(row[21]),
          karta:            num(row[10]),
          dar_karta_up:     num(row[13]),
          qerko:            num(row[11]),
          qerko_tringelty:  num(row[12]),
          gastro_listky:    num(row[14]),
          odvod:            num(row[20]),
          nakupy:           num(row[15]),
          prevod_mala_kasa: 0,
          vklad:            0,
          vklad_popis:      '',
          vklad_banka:      0,
          excel_drawer:     num(row[18])
        }
      };
    });

    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data._token !== TOKEN) {
      return ContentService.createTextOutput('Unauthorized');
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const type = data.type;

    // ── HACCP ────────────────────────────────────────────────────────────────
    if (type === 'haccp') {
      let sheet = ss.getSheetByName('HACCP');
      if (!sheet) {
        sheet = ss.insertSheet('HACCP');
        sheet.appendRow(['Dátum', 'Kontrolór', 'Zmena', 'Zariadenie', 'Hodnota', 'Max', 'Status']);
        sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#f3e8d0');
      }
      const readings = data.readings || [];
      readings.forEach(r => {
        const maxNum = parseFloat((r.max || '').replace(/[^\d.-]/g, ''));
        const val = parseFloat((r.value || '').replace(',', '.'));
        const status = isNaN(val) ? '—' : (!isNaN(maxNum) && val > maxNum ? '⚠ PREKROČENÉ' : '✓ OK');
        sheet.appendRow([data.date, data.podpis, data.shift || '—', r.label, r.value, r.max || '—', status]);
      });
    }

    // ── TASKS SUMMARY ────────────────────────────────────────────────────────
    else if (type === 'tasks_summary') {
      let sheet = ss.getSheetByName('Úlohy');
      if (!sheet) {
        sheet = ss.insertSheet('Úlohy');
        sheet.appendRow(['Dátum', 'Kategória', 'Kontrolór', 'Úloha', 'Splnená', 'Čas', 'Problém']);
        sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#f3e8d0');
      }
      const tasks = data.tasks || [];
      tasks.forEach(t => {
        sheet.appendRow([
          data.date,
          data.category,
          data.inspector,
          t.text,
          t.done ? '✓' : (t.issue ? '⚠' : '✗'),
          t.time || '—',
          t.issue || '—',
        ]);
      });
    }

    // ── INVENTORY ────────────────────────────────────────────────────────────
    else if (type === 'inventory') {
      const tabName = data.month || data.date;
      let sheet = ss.getSheetByName(tabName);
      if (!sheet) {
        sheet = ss.insertSheet(tabName, ss.getSheets().length);
        sheet.appendRow(['Dátum', 'Kontrolór', 'Položka', 'Množstvo', 'Jednotka', 'Rozdelenie', 'Poznámka']);
        sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#f3e8d0');
        sheet.setColumnWidth(3, 250);
        sheet.setColumnWidth(6, 200);
        sheet.setColumnWidth(7, 200);
      }
      const items = data.items || [];
      items.forEach(item => {
        sheet.appendRow([
          data.date,
          data.inspector,
          item.name,
          item.qty,
          item.unit,
          item.breakdown || '—',
          item.note || '—',
        ]);
      });
    }

    // ── ODPISY — všetky dni v jednom hárku „Odpisy“ ──────────────────────────
    else if (type === 'odpis_daily') {
      let sheet = ss.getSheetByName('Odpisy');
      if (!sheet) {
        sheet = ss.insertSheet('Odpisy');
        sheet.appendRow(['Dátum', 'Zodpovedný', 'Produkt', 'Množstvo', 'Jednotka', 'Dôvod', 'Odkaz kolegovi']);
        sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#e8f0e8');
        sheet.setFrozenRows(1);
        sheet.setColumnWidth(3, 250);
        sheet.setColumnWidth(6, 140);
        sheet.setColumnWidth(7, 260);
      }
      const entries = data.entries || [];
      entries.forEach(en => {
        sheet.appendRow([
          data.date,
          data.author || '—',
          en.name,
          en.qty,
          en.unit,
          en.reason || 'Spotreba',
          data.note || '—',
        ]);
      });
    }

    // ── ALKOHOL — DENNÁ EVIDENCIA OTVORENÝCH FLIAŠ ───────────────────────────
    else if (type === 'alkohol_daily') {
      let sheet = ss.getSheetByName('Alkohol');
      if (!sheet) {
        sheet = ss.insertSheet('Alkohol');
        sheet.appendRow(['Dátum', 'Licencia dodávateľa', 'Produkt', 'Typ', 'EAN', 'Otvorené fľaše', 'Zodpovedný']);
        sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#f3e8d0');
        sheet.setColumnWidth(2, 220);
        sheet.setColumnWidth(3, 200);
        sheet.setColumnWidth(5, 150);
      }
      const entries = data.entries || [];
      entries.forEach(en => {
        sheet.appendRow([
          data.date,
          data.licencia || '—',
          en.name,
          en.type || '—',
          "'" + (en.ean || ''),
          en.open || 0,
          data.author || '—',
        ]);
      });
    }

    // ── UZÁVIERKA — DENNÁ UZÁVIERKA KASY ─────────────────────────────────────
    else if (type === 'uzavierka_daily') {
      let sheet = ss.getSheetByName('Uzávierky');
      if (!sheet) {
        sheet = ss.insertSheet('Uzávierky');
        sheet.appendRow([
          'Dátum', 'Kasa', 'Vykonal',
          'A · Zostatok predch. (reálne)', 'Malo zostať (z minulého dňa)', 'Rozdiel A',
          'Prvotné prerátanie A', 'Prvotný rozdiel', 'Nesedelo prvotne?',
          'B · Tržba', 'C · Platby kartou', 'D · Qerko', 'E · Qerko tringelt',
          'Stravná karta (info)', 'F · Stravné lístky', 'G · Nákup', 'Nákup – obsah',
          'H · Mám mať v kase', 'I · Reálne v kase', 'J · Tringelt/Manko',
          'K · Odvod tržby', 'L · Zaokrúhlenie', 'M · Nový zostatok'
        ]);
        sheet.getRange(1, 1, 1, 23).setFontWeight('bold').setBackground('#e8eef5');
        sheet.setColumnWidth(3, 120);
        sheet.setColumnWidth(5, 170);
        sheet.setColumnWidth(17, 220);
        sheet.setFrozenRows(1);
      }
      const num2 = (x) => {
        if (x === undefined || x === null || x === '') return '';
        const n = parseFloat(String(x).replace(',', '.'));
        return isNaN(n) ? '' : n;
      };
      sheet.appendRow([
        data.date,
        data.kasa || '—',
        data.author || '—',
        num2(data.A), num2(data.maloByt), num2(data.rozdielA),
        num2(data.firstA), num2(data.firstRozdiel), data.nesedeloPrvotne || 'NIE',
        num2(data.B), num2(data.C), num2(data.D), num2(data.E),
        num2(data.stravnaKarta), num2(data.F), num2(data.G), data.gNote || '',
        num2(data.H), num2(data.I), num2(data.J), num2(data.K), num2(data.L), num2(data.M),
      ]);
    }

    // ── BUG REPORT ───────────────────────────────────────────────────────────
    else if (type === 'bug_report') {
      let sheet = ss.getSheetByName('Chyby');
      if (!sheet) {
        sheet = ss.insertSheet('Chyby');
        sheet.appendRow(['Dátum', 'Meno', 'Pobočka', 'Popis problému', 'Zariadenie (user agent)']);
        sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#fde8e8');
        sheet.setColumnWidth(4, 400);
        sheet.setColumnWidth(5, 300);
      }
      sheet.appendRow([
        data.date,
        data.author || 'Anonym',
        data.branch || '—',
        data.description,
        data.userAgent || '—',
      ]);
    }

    // ── BACKUP — automatická záloha dát appky do skrytého hárku „Zálohy“ ─────
    // Appka posiela celý snapshot localStorage (rovnaký formát ako ručná záloha).
    // ZÁMERNE bez Google Drive: DriveApp vyžaduje povolenie na zápis, ktoré
    // Workspace účtu pobočky Google neudelí. Hárok tejto tabuľky žiadne nové
    // povolenie nepotrebuje. Jeden riadok = jeden deň a pobočka (prepisuje sa),
    // drží sa posledných 60. Bunka má limit 50 000 znakov, preto sa JSON delí
    // na časti do stĺpcov D, E, F…
    // Stiahnutie zálohy: otvor URL webovej aplikácie s ?backup=latest
    // (alebo ?backup=2026-08-06) → JSON ulož ako .json → appka Sklad → 📥 Obnoviť zálohu.
    else if (type === 'backup') {
      const CHUNK = 45000;
      let sheet = ss.getSheetByName('Zálohy');
      if (!sheet) {
        sheet = ss.insertSheet('Zálohy');
        sheet.appendRow(['Deň', 'Pobočka', 'Uložené', 'Dáta (JSON, delené na časti)']);
        sheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#e8eef5');
        sheet.setFrozenRows(1);
        sheet.hideSheet();
      }
      const json = JSON.stringify(data.snapshot || {});
      const chunks = [];
      for (let i = 0; i < json.length; i += CHUNK) chunks.push(json.substring(i, i + CHUNK));
      const row = [String(data.day || ''), String(data.branch || ''), new Date()].concat(chunks);

      if (row.length > sheet.getMaxColumns()) {
        sheet.insertColumnsAfter(sheet.getMaxColumns(), row.length - sheet.getMaxColumns());
      }

      // riadok pre ten istý deň + pobočku prepíš, inak pridaj nový
      let target = 0;
      const last = sheet.getLastRow();
      if (last > 1) {
        const keys = sheet.getRange(2, 1, last - 1, 2).getValues();
        for (let i = 0; i < keys.length; i++) {
          if (String(keys[i][0]) === row[0] && String(keys[i][1]) === row[1]) { target = i + 2; break; }
        }
      }
      if (!target) target = last + 1;
      // vyčisti celý riadok — predošlá záloha mohla mať viac častí ako táto
      sheet.getRange(target, 1, 1, sheet.getMaxColumns()).clearContent();
      sheet.getRange(target, 1, 1, row.length).setValues([row]);

      // retencia: ponechaj posledných 60 záloh
      const count = sheet.getLastRow() - 1;
      if (count > 60) sheet.deleteRows(2, count - 60);
    }

    return ContentService.createTextOutput('OK');

  } catch (err) {
    return ContentService.createTextOutput('Error: ' + err.message);
  }
}

// ── JEDNORAZOVÁ MIGRÁCIA — staré per-dňové taby „Odpisy X. Y. ZZZZ“ → flat hárok ──
// Spusti RUČNE v editore: hore vyber funkciu `migrateOdpisyTabs` → Spustiť.
// Každý starý tab prečíta (položky + zodpovedný/dátum/odkaz z pätičky), riadky
// pridá do hárku „Odpisy“ a tab zmaže. Bezpečné spustiť aj viackrát.
function migrateOdpisyTabs() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var flat = ss.getSheetByName('Odpisy');
  if (!flat) {
    flat = ss.insertSheet('Odpisy');
    flat.appendRow(['Dátum', 'Zodpovedný', 'Produkt', 'Množstvo', 'Jednotka', 'Dôvod', 'Odkaz kolegovi']);
    flat.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#e8f0e8');
    flat.setFrozenRows(1);
    flat.setColumnWidth(3, 250);
    flat.setColumnWidth(6, 140);
    flat.setColumnWidth(7, 260);
  }

  var moved = 0, tabs = 0;
  ss.getSheets().forEach(function(sheet) {
    var name = sheet.getName();
    if (!/^Odpisy \d/.test(name)) return;   // len taby „Odpisy 31. 7. 2026“ a pod.

    var rows = sheet.getDataRange().getValues();
    var entries = [];
    var author = '—', note = '—';
    var date = name.replace(/^Odpisy /, '');   // fallback — dátum z názvu tabu

    rows.forEach(function(r) {
      var a = String(r[0] || '').trim();
      if (!a || a === 'Produkt') return;                       // prázdny riadok / hlavička
      if (a === 'Zodpovedný:') {                               // pätička: Zodpovedný | meno | Dátum: | dátum
        if (r[1]) author = String(r[1]);
        if (String(r[2] || '').trim() === 'Dátum:' && r[3]) date = formatDMY(r[3]);
        return;
      }
      if (a === 'Odkaz kolegovi:') { if (r[1]) note = String(r[1]); return; }
      entries.push(r);                                          // položka: Produkt | Množstvo | Jednotka | Dôvod
    });

    entries.forEach(function(r) {
      flat.appendRow([date, author, r[0], r[1], r[2], r[3] || 'Spotreba', note]);
      moved++;
    });

    ss.deleteSheet(sheet);
    tabs++;
  });

  Logger.log('Hotovo: ' + moved + ' záznamov z ' + tabs + ' tabov presunutých do hárku Odpisy.');
}

// Dátum z bunky (Date objekt alebo text) → „31. 7. 2026“ (formát ako posiela appka)
function formatDMY(val) {
  if (val instanceof Date) return val.getDate() + '. ' + (val.getMonth() + 1) + '. ' + val.getFullYear();
  return String(val).trim();
}

// Vráti uloženú zálohu z hárku „Zálohy“ — 'latest' = posledná zapísaná,
// inak riadok s daným dňom (formát 2026-08-06). Časti JSON zo stĺpcov D+ sa spoja.
function backupResponse(ss, wanted) {
  var sheet = ss.getSheetByName('Zálohy');
  if (!sheet || sheet.getLastRow() < 2) return jsonResponse({ error: 'Zatiaľ tu nie je žiadna záloha.' });
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var pick = null;
  for (var i = 0; i < rows.length; i++) {
    if (wanted === 'latest' || String(rows[i][0]) === wanted) pick = rows[i];
  }
  if (!pick) return jsonResponse({ error: 'Záloha pre „' + wanted + '“ sa nenašla.' });
  return ContentService
    .createTextOutput(pick.slice(3).join(''))
    .setMimeType(ContentService.MimeType.JSON);
}

function parseDate(val) {
  if (val instanceof Date) {
    var y = val.getFullYear();
    var mo = String(val.getMonth() + 1).padStart(2, '0');
    var d = String(val.getDate()).padStart(2, '0');
    return y + '-' + mo + '-' + d;
  }
  var s = String(val).trim();
  var m = s.match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})$/);
  if (m) return m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0');
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return null;
}

var SK_DAYS = ['nedeľa', 'pondelok', 'utorok', 'streda', 'štvrtok', 'piatok', 'sobota'];
function getSlovakDay(dateStr) {
  return SK_DAYS[new Date(dateStr + 'T12:00:00').getDay()];
}

function num(v) {
  if (v === null || v === undefined || v === '') return 0;
  var n = parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
