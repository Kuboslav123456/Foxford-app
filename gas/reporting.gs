// ═══════════════════════════════════════════════════════════════════════════
// FOXFORD — E-MAILOVÝ REPORTING zo Supabase databázy
//
// Posiela týždenný (pondelok) a mesačný (1. v mesiaci) súhrn za všetky pobočky:
// tržby + porovnanie, splnenosť a problémové úlohy, HACCP prekročenia, odpisy,
// upozornenia. E-mail chodí z Gmailu účtu, pod ktorým skript beží (MailApp).
//
// ── NASADENIE ──────────────────────────────────────────────────────────────
// 1. script.google.com → New project → vlož celý tento súbor.
// 2. Projekt → ⚙ Project Settings → Script Properties → Add:
//      SUPABASE_URL          = https://igkqszltknalqtzhhhhi.supabase.co
//      SUPABASE_SERVICE_KEY  = <service_role kľúč z Supabase → Settings → API>
//      PRIJEMCOVIA           = jakub@…, veduci@…   (adresy oddelené čiarkou)
//    ⚠ service_role kľúč je tajný — TU je bezpečný (beží na serveri Googlu,
//      nikdy sa nedostane do prehliadača). Do appky ani do repa NEPATRÍ.
// 3. Hore vyber funkciu `testReport` → Spustiť. Prvý raz odsúhlas oprávnenia
//    (Gmail + externé pripojenie). Príde ti testovací report za posledných 7 dní.
// 4. Keď report sedí: vyber `nastavTriggery` → Spustiť. Tým sa zapnú
//    automatické odoslania (pondelok 7:00 týždenný, 1. v mesiaci 7:00 mesačný).
// ═══════════════════════════════════════════════════════════════════════════

var TZ = 'Europe/Bratislava';
function cfg(k) { var v = PropertiesService.getScriptProperties().getProperty(k); if (!v) throw new Error('Chýba Script Property: ' + k); return v; }

// ── Načítanie zo Supabase (service_role obchádza RLS, stránkované cez Range) ──
function sbGetAll(table, params) {
  var base = cfg('SUPABASE_URL').replace(/\/$/, '') + '/rest/v1/' + table + '?' + params;
  var key = cfg('SUPABASE_SERVICE_KEY');
  var out = [], from = 0;
  while (from < 200000) {
    var res = UrlFetchApp.fetch(base, {
      headers: { apikey: key, Authorization: 'Bearer ' + key, Range: from + '-' + (from + 999) },
      muteHttpExceptions: true,
    });
    var txt = res.getContentText();
    var arr; try { arr = JSON.parse(txt); } catch (e) { throw new Error('Supabase ' + res.getResponseCode() + ': ' + txt.slice(0, 200)); }
    if (!Array.isArray(arr)) throw new Error('Supabase ' + res.getResponseCode() + ': ' + txt.slice(0, 200));
    out = out.concat(arr);
    if (arr.length < 1000) break;
    from += 1000;
  }
  return out;
}

function nacitajObdobie(od, doD) {
  var f = 'day=gte.' + od + '&day=lte.' + doD;
  return {
    uzavierky: sbGetAll('uzavierky_log', 'select=day,branch,kasa,meno,created_at,data&' + f),
    tasks:     sbGetAll('tasks_log', 'select=day,branch,category,done,task,issue,done_by&' + f),
    haccp:     sbGetAll('haccp_log', 'select=day,branch,device,value,max_limit,exceeded&' + f),
    odpisy:    sbGetAll('odpisy_log', 'select=day,branch,item,qty,unit,reason&' + f),
  };
}

// ── Pomôcky (zrkadlia logiku appky Prehľady) ─────────────────────────────────
function num(v) { if (v === undefined || v === null || v === '') return 0; var n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? 0 : n; }
function ma(v) { return v !== undefined && v !== null && v !== ''; }
function normUzav(d) {
  if (!d) return null;
  if (ma(d.obrat) || d.zdroj === 'obraty-import') {
    return { obrat: num(d.obrat), karta: num(d.karta), qerko: num(d.qerko), qerkoTr: num(d.qerko_tringelty),
             gastro: num(d.gastro_listky), zaokruhly: num(d.zaokruhly), odvod: num(d.odvod),
             kasa: ma(d.excel_drawer) ? num(d.excel_drawer) : null };
  }
  return { obrat: num(d.B), karta: num(d.C), qerko: num(d.D), qerkoTr: num(d.E), gastro: num(d.F),
           zaokruhly: num(d.L), odvod: num(d.K), kasa: ma(d.M) ? num(d.M) : null };
}
function hotovostZ(u) { return u.obrat - u.karta - u.gastro + u.zaokruhly - u.qerko - u.qerkoTr; }
function eur(n) { return (Math.round((n || 0) * 100) / 100).toLocaleString('sk-SK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'; }
function eur0(n) { return Math.round(n || 0).toLocaleString('sk-SK') + ' €'; }

// Súčet tržieb pobočiek za obdobie (na porovnanie) — dedup uzávierok
function trzbyPodlaPobocky(uzavierky) {
  var m = {};
  uzavierky.forEach(function (u) {
    var k = u.branch + '|' + u.day + '|' + (u.kasa || (u.data && u.data.kasa) || '');
    if (!m[k] || String(u.created_at || '') >= String(m[k].created_at || '')) m[k] = u;
  });
  var out = {};
  Object.keys(m).map(function (k) { return m[k]; }).forEach(function (u) {
    var n = normUzav(u.data); out[u.branch] = (out[u.branch] || 0) + n.obrat;
  });
  return out;
}

// ── Agregácia per pobočka ────────────────────────────────────────────────────
function agregujPobocky(data, trzbyPrev) {
  // uzávierky: dedup a normalizácia
  var uzMap = {};
  data.uzavierky.forEach(function (u) {
    var k = u.branch + '|' + u.day + '|' + (u.kasa || (u.data && u.data.kasa) || '');
    if (!uzMap[k] || String(u.created_at || '') >= String(uzMap[k].created_at || '')) uzMap[k] = u;
  });
  var P = {};
  function pob(b) { if (!P[b]) P[b] = { branch: b, trzby: 0, karty: 0, qerko: 0, hotovost: 0, kasa: null,
    ulohTotal: 0, ulohDone: 0, problemove: [], issMap: {}, prekrocenia: [], devMap: {}, odpMap: {} }; return P[b]; }

  Object.keys(uzMap).map(function (k) { return uzMap[k]; }).forEach(function (u) {
    var n = normUzav(u.data), p = pob(u.branch);
    p.trzby += n.obrat; p.karty += n.karta; p.qerko += n.qerko + n.qerkoTr; p.hotovost += hotovostZ(n);
    if (n.kasa !== null) p.kasa = n.kasa;
  });
  data.tasks.forEach(function (t) {
    var p = pob(t.branch); p.ulohTotal++; if (t.done) p.ulohDone++;
    if (!t.done || t.issue) p.problemove.push(t);
    if (t.issue) { var k = t.task || '(úloha)'; p.issMap[k] = (p.issMap[k] || 0) + 1; }
  });
  data.haccp.forEach(function (h) {
    if (!h.exceeded) return; var p = pob(h.branch); p.prekrocenia.push(h);
    var k = h.device || '(zariadenie)'; p.devMap[k] = (p.devMap[k] || 0) + 1;
  });
  data.odpisy.forEach(function (o) {
    var p = pob(o.branch), k = (o.item || '') + '|' + (o.unit || '');
    p.odpMap[k] = p.odpMap[k] || { item: o.item, unit: o.unit || '', qty: 0 };
    p.odpMap[k].qty += num(o.qty);
  });

  // finalizácia
  Object.keys(P).forEach(function (b) {
    var p = P[b];
    p.splnenost = p.ulohTotal ? Math.round(p.ulohDone / p.ulohTotal * 100) : null;
    p.trzbyPrev = (trzbyPrev && trzbyPrev[b]) || 0;
    p.zmenaPct = p.trzbyPrev > 0 ? Math.round((p.trzby - p.trzbyPrev) / p.trzbyPrev * 100) : null;
    p.opakProblemy = Object.keys(p.issMap).filter(function (k) { return p.issMap[k] >= 3; })
      .map(function (k) { return { task: k, count: p.issMap[k] }; }).sort(function (a, b2) { return b2.count - a.count; });
    p.opakHaccp = Object.keys(p.devMap).filter(function (k) { return p.devMap[k] >= 3; })
      .map(function (k) { return { device: k, n: p.devMap[k] }; }).sort(function (a, b2) { return b2.n - a.n; });
    p.topOdpisy = Object.keys(p.odpMap).map(function (k) { return p.odpMap[k]; })
      .sort(function (a, b2) { return b2.qty - a.qty; }).slice(0, 6);
  });
  return P;
}

// ── HTML e-mail ──────────────────────────────────────────────────────────────
function generujHtml(P, od, doD, nadpis) {
  var G = '#b87020', TX = '#1e1608', SUB = '#6b5d4f', OK = '#2a9a55', ERR = '#d03030', BORDER = '#e5ddcb';
  var pobky = Object.keys(P).sort();
  var celkTrzby = 0; pobky.forEach(function (b) { celkTrzby += P[b].trzby; });

  var h = '';
  h += '<div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:680px;margin:0 auto;background:#f4efe3;padding:0 0 24px">';
  h += '<div style="background:' + G + ';color:#fff;padding:22px 24px;border-radius:0 0 4px 4px">';
  h += '<div style="font-size:20px;font-weight:800">Foxford — ' + nadpis + '</div>';
  h += '<div style="opacity:.85;font-size:13px;margin-top:3px">' + skDate(od) + ' – ' + skDate(doD) + ' · celkové tržby ' + eur0(celkTrzby) + '</div></div>';

  pobky.forEach(function (b) {
    var p = P[b];
    var zmena = p.zmenaPct === null ? '' :
      '<span style="color:' + (p.zmenaPct >= 0 ? OK : ERR) + ';font-weight:700">' + (p.zmenaPct >= 0 ? '▲ +' : '▼ ') + p.zmenaPct + ' %</span> oproti minulému obdobiu';
    h += '<div style="background:#fff;border:1px solid ' + BORDER + ';border-radius:12px;margin:16px 24px 0;padding:16px 18px">';
    h += '<div style="font-size:16px;font-weight:800;color:' + G + ';margin-bottom:10px">' + esc(b) + '</div>';

    // čísla
    h += '<table style="width:100%;border-collapse:collapse;font-size:13px;color:' + TX + '"><tr>';
    h += tile('Tržby', eur0(p.trzby), zmena);
    h += tile('Splnenosť úloh', p.splnenost === null ? '—' : p.splnenost + ' %', p.splnenost !== null && p.splnenost < 90 ? '<span style="color:' + ERR + '">pod cieľom</span>' : '');
    h += tile('HACCP prekročenia', String(p.prekrocenia.length), p.prekrocenia.length ? '<span style="color:' + ERR + '">skontrolovať</span>' : 'v poriadku');
    h += tile('Karty / Qerko', eur0(p.karty) + ' / ' + eur0(p.qerko), '');
    h += '</tr></table>';

    // upozornenia
    var up = [];
    if (p.kasa !== null && p.kasa > 1000) up.push('Vysoký stav hotovosti v kase (' + eur(p.kasa) + ') — odporúča sa odvod.');
    if (p.kasa !== null && p.kasa < 0) up.push('Záporný stav kasy (' + eur(p.kasa) + ') — skontrolujte uzávierky!');
    p.opakProblemy.forEach(function (x) { up.push('Opakovaný problém: „' + x.task + '" ' + x.count + '× — vyžaduje pozornosť.'); });
    p.opakHaccp.forEach(function (x) { up.push(x.device + ': prekročený limit ' + x.n + '× — skontrolujte chladenie.'); });
    if (up.length) {
      h += '<div style="margin-top:12px;background:#fdf4e6;border:1px solid #ecd9b5;border-radius:8px;padding:10px 12px">';
      h += '<div style="font-weight:700;color:' + G + ';font-size:12px;margin-bottom:4px">⚠️ UPOZORNENIA</div>';
      up.forEach(function (t) { h += '<div style="font-size:12.5px;color:' + TX + ';margin:3px 0">• ' + esc(t) + '</div>'; });
      h += '</div>';
    }

    // problémové úlohy (max 8)
    if (p.problemove.length) {
      h += sekcia('Nesplnené a problémové úlohy (' + p.problemove.length + ')');
      p.problemove.slice(0, 8).forEach(function (t) {
        var stav = t.issue ? '<span style="color:' + ERR + '">⚠ ' + esc(t.issue) + '</span>' : '<span style="color:' + SUB + '">✗ nesplnené</span>';
        h += '<div style="font-size:12.5px;margin:2px 0;color:' + TX + '">' + skDate(t.day) + ' · ' + esc(t.category || '') + ' · ' + esc(t.task || '') + ' — ' + stav + '</div>';
      });
      if (p.problemove.length > 8) h += '<div style="font-size:12px;color:' + SUB + '">… a ďalších ' + (p.problemove.length - 8) + '</div>';
    }

    // top odpisy
    if (p.topOdpisy.length) {
      h += sekcia('Najviac odpisované');
      p.topOdpisy.forEach(function (o) {
        h += '<div style="font-size:12.5px;margin:2px 0;color:' + TX + '">' + esc(o.item) + ' — <b>' + (Math.round(o.qty * 10) / 10) + ' ' + esc(o.unit) + '</b></div>';
      });
    }
    h += '</div>';
  });

  h += '<div style="text-align:center;color:' + SUB + ';font-size:11px;margin-top:20px">Automatický report z Foxford databázy · ' + skDate(isoDay(new Date())) + '</div></div>';
  return h;

  function tile(l, v, note) {
    return '<td style="width:25%;vertical-align:top;padding:4px 6px">' +
      '<div style="font-size:10.5px;color:' + SUB + ';text-transform:uppercase;letter-spacing:.4px">' + l + '</div>' +
      '<div style="font-size:18px;font-weight:800;color:' + G + ';margin:2px 0">' + v + '</div>' +
      (note ? '<div style="font-size:10.5px;color:' + SUB + '">' + note + '</div>' : '') + '</td>';
  }
  function sekcia(t) { return '<div style="font-size:11px;font-weight:700;color:' + SUB + ';text-transform:uppercase;letter-spacing:.4px;margin:12px 0 4px">' + t + '</div>'; }
}

function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function isoDay(d) { return Utilities.formatDate(d, TZ, 'yyyy-MM-dd'); }
function skDate(iso) { var p = String(iso).split('-'); return p.length === 3 ? (parseInt(p[2], 10) + '. ' + parseInt(p[1], 10) + '. ' + p[0]) : iso; }

// ── Odoslanie ────────────────────────────────────────────────────────────────
function posli(subject, html) {
  var prij = cfg('PRIJEMCOVIA').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (!prij.length) throw new Error('PRIJEMCOVIA je prázdne');
  MailApp.sendEmail({ to: prij.join(','), subject: subject, htmlBody: html });
}

function report(od, doD, odPrev, doPrev, nadpis) {
  var data = nacitajObdobie(od, doD);
  var trzbyPrev = trzbyPodlaPobocky(nacitajObdobie(odPrev, doPrev).uzavierky);
  var P = agregujPobocky(data, trzbyPrev);
  var html = generujHtml(P, od, doD, nadpis);
  posli('Foxford — ' + nadpis + ' (' + skDate(od) + ' – ' + skDate(doD) + ')', html);
}

// Pondelok: uplynulý týždeň (Po–Ne) vs. predošlý týždeň
function posliTyzdennyReport() {
  var now = new Date();
  var poThis = new Date(now); poThis.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // tento pondelok
  var doD = new Date(poThis); doD.setDate(poThis.getDate() - 1);                          // minulá nedeľa
  var od = new Date(doD); od.setDate(doD.getDate() - 6);                                  // minulý pondelok
  var doPrev = new Date(od); doPrev.setDate(od.getDate() - 1);
  var odPrev = new Date(doPrev); odPrev.setDate(doPrev.getDate() - 6);
  report(isoDay(od), isoDay(doD), isoDay(odPrev), isoDay(doPrev), 'týždenný report');
}

// 1. v mesiaci: uplynulý mesiac vs. predošlý mesiac
function posliMesacnyReport() {
  var now = new Date();
  var prvyTohto = new Date(now.getFullYear(), now.getMonth(), 1);
  var doD = new Date(prvyTohto); doD.setDate(0);                       // posledný deň min. mesiaca
  var od = new Date(doD.getFullYear(), doD.getMonth(), 1);            // prvý deň min. mesiaca
  var doPrev = new Date(od); doPrev.setDate(0);
  var odPrev = new Date(doPrev.getFullYear(), doPrev.getMonth(), 1);
  report(isoDay(od), isoDay(doD), isoDay(odPrev), isoDay(doPrev), 'mesačný report');
}

// Test: pošle report za posledných 7 dní hneď (na PRIJEMCOVIA)
function testReport() {
  var doD = new Date(); var od = new Date(); od.setDate(od.getDate() - 6);
  var doPrev = new Date(od); doPrev.setDate(od.getDate() - 1);
  var odPrev = new Date(doPrev); odPrev.setDate(doPrev.getDate() - 6);
  report(isoDay(od), isoDay(doD), isoDay(odPrev), isoDay(doPrev), 'TEST report (7 dní)');
}

// Zapne automatické spúšťače (spusti raz ručne)
function nastavTriggery() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('posliTyzdennyReport').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(7).inTimezone(TZ).create();
  ScriptApp.newTrigger('posliMesacnyReport').timeBased().onMonthDay(1).atHour(7).inTimezone(TZ).create();
}
