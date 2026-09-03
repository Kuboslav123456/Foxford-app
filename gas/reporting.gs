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
//    ⚠ service_role kľúč je tajný — TU je bezpečný (beží na serveri Googlu,
//      nikdy sa nedostane do prehliadača). Do appky ani do repa NEPATRÍ.
//
//    Príjemcovia — jeden z dvoch spôsobov:
//      A) PRIJEMCOVIA = jakub@…, veduci@…      (jeden spoločný report o VŠETKÝCH
//         pobočkách na tieto adresy — oddelené čiarkou)
//      B) REPORTY     = jakub@…=*; presov@…=Prešov; kosice@…=Košice,Levice
//         (KAŽDÝ dostane report len o SVOJICH pobočkách; „*" = všetky pobočky;
//          jeden príjemca môže mať viac pobočiek oddelených čiarkou; jednotlivé
//          dvojice oddelené bodkočiarkou alebo na samostatných riadkoch)
//    Ak je nastavené REPORTY, má prednosť pred PRIJEMCOVIA.
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
// Table-based layout (e-mail-safe), inline štýly, šírka 720 px. Testované v Gmaile.
function generujHtml(P, od, doD, nadpis) {
  var G = '#b87020', GD = '#8a5015', TX = '#241a0b', SUB = '#7a6c5a', MUT = '#a99a86',
      OK = '#2a9a55', ERR = '#d03030', CARD = '#ffffff', BG = '#ece4d5', LINE = '#ece2cd', SOFT = '#faf6ec';
  var pobky = Object.keys(P).sort(function (a, b) { return P[b].trzby - P[a].trzby; });   // najvyššie tržby hore
  var celkTrzby = 0, celkPrekr = 0, sumPct = 0, poctSplnPobociek = 0, celkUpoz = 0;
  pobky.forEach(function (b) {
    var p = P[b]; celkTrzby += p.trzby; celkPrekr += p.prekrocenia.length;
    if (p.splnenost !== null) { sumPct += p.splnenost; poctSplnPobociek++; }
    celkUpoz += (p.kasa !== null && (p.kasa > 1000 || p.kasa < 0) ? 1 : 0) + p.opakProblemy.length + p.opakHaccp.length;
  });
  var priemSpln = poctSplnPobociek ? Math.round(sumPct / poctSplnPobociek) : null;

  function stat(label, value, farba, sub) {
    return '<td width="25%" valign="top" style="padding:6px">' +
      '<table width="100%" cellpadding="0" cellspacing="0" style="background:' + SOFT + ';border:1px solid ' + LINE + ';border-radius:12px"><tr><td style="padding:12px 14px">' +
      '<div style="font-size:10.5px;font-weight:700;color:' + SUB + ';text-transform:uppercase;letter-spacing:.5px">' + label + '</div>' +
      '<div style="font-size:22px;font-weight:800;color:' + (farba || G) + ';margin-top:4px;line-height:1.15;white-space:nowrap">' + value + '</div>' +
      (sub ? '<div style="font-size:10.5px;color:' + SUB + ';margin-top:3px">' + sub + '</div>' : '') +
      '</td></tr></table></td>';
  }
  function sekcia(t) { return '<div style="font-size:11px;font-weight:700;color:' + SUB + ';text-transform:uppercase;letter-spacing:.5px;margin:16px 0 6px">' + t + '</div>'; }

  var h = '';
  h += '<div style="background:' + BG + ';padding:24px 10px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif">';
  h += '<table align="center" width="720" cellpadding="0" cellspacing="0" style="width:720px;max-width:100%;margin:0 auto">';

  // HLAVIČKA
  h += '<tr><td style="background:' + GD + ';background-image:linear-gradient(135deg,' + G + ',' + GD + ');border-radius:16px 16px 0 0;padding:26px 30px">' +
    '<div style="color:#f4e6d0;font-size:12px;font-weight:700;letter-spacing:4px">F O X F O R D</div>' +
    '<div style="color:#fff;font-size:23px;font-weight:800;margin-top:5px">' + nadpis.charAt(0).toUpperCase() + nadpis.slice(1) + '</div>' +
    '<div style="color:rgba(255,255,255,.82);font-size:13px;margin-top:6px">' + skDate(od) + ' &ndash; ' + skDate(doD) + '</div></td></tr>';

  // SÚHRNNÁ LIŠTA
  h += '<tr><td style="background:' + CARD + ';padding:14px 18px 6px">' +
    '<table width="100%" cellpadding="0" cellspacing="0"><tr>' +
    stat('Celkové tržby', eur0(celkTrzby), G, pobky.length + ' pobočiek') +
    stat('Ø splnenosť úloh', priemSpln === null ? '&mdash;' : priemSpln + ' %', priemSpln === null ? SUB : priemSpln >= 90 ? OK : priemSpln >= 70 ? G : ERR, '') +
    stat('HACCP prekročenia', String(celkPrekr), celkPrekr ? ERR : OK, celkPrekr ? 'skontrolovať' : 'v poriadku') +
    stat('Upozornenia', String(celkUpoz), celkUpoz ? ERR : OK, celkUpoz ? 'vyžadujú pozornosť' : 'žiadne') +
    '</tr></table></td></tr>';

  // POBOČKY
  pobky.forEach(function (b) {
    var p = P[b];
    var pctFarba = p.splnenost === null ? SUB : p.splnenost >= 90 ? OK : p.splnenost >= 70 ? G : ERR;
    var zmenaBadge = p.zmenaPct === null ? '' :
      '<span style="display:inline-block;font-size:12px;font-weight:800;color:' + (p.zmenaPct >= 0 ? OK : ERR) + ';background:' + (p.zmenaPct >= 0 ? 'rgba(42,154,85,.10)' : 'rgba(208,48,48,.10)') + ';border-radius:20px;padding:3px 10px">' +
      (p.zmenaPct >= 0 ? '&#9650; +' : '&#9660; ') + p.zmenaPct + '&#8201;%</span>';

    h += '<tr><td style="background:' + CARD + ';padding:8px 18px">' +
      '<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ' + LINE + ';border-radius:14px"><tr><td style="padding:18px 20px">';

    // hlavička pobočky: názov + veľké tržby + zmena
    h += '<table width="100%" cellpadding="0" cellspacing="0"><tr>' +
      '<td valign="middle"><div style="font-size:17px;font-weight:800;color:' + TX + '">' + esc(b) + '</div>' +
      '<div style="font-size:11px;color:' + MUT + ';margin-top:2px">tržby za obdobie</div></td>' +
      '<td valign="middle" align="right"><div style="font-size:24px;font-weight:800;color:' + G + '">' + eur0(p.trzby) + '</div>' +
      (zmenaBadge ? '<div style="margin-top:4px">' + zmenaBadge + '</div>' : '') + '</td></tr></table>';

    // dlaždice pobočky
    h += '<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px"><tr>' +
      stat('Splnenosť úloh', p.splnenost === null ? '&mdash;' : p.splnenost + ' %', pctFarba, p.ulohTotal ? (p.ulohDone + ' z ' + p.ulohTotal) : 'žiadne úlohy') +
      stat('HACCP prekročenia', String(p.prekrocenia.length), p.prekrocenia.length ? ERR : OK, p.prekrocenia.length ? 'skontrolovať' : 'v poriadku') +
      stat('Karty / Qerko', eur0(p.karty) + ' / ' + eur0(p.qerko), TX, '') +
      stat('Stav kasy', p.kasa === null ? '&mdash;' : eur0(p.kasa), p.kasa !== null && p.kasa < 0 ? ERR : TX, 'večer') +
      '</tr></table>';

    // upozornenia
    var up = [];
    if (p.kasa !== null && p.kasa > 1000) up.push('Vysoký stav hotovosti v kase (' + eur(p.kasa) + ') &mdash; odporúča sa odvod.');
    if (p.kasa !== null && p.kasa < 0) up.push('Záporný stav kasy (' + eur(p.kasa) + ') &mdash; skontrolujte uzávierky!');
    p.opakProblemy.forEach(function (x) { up.push('Opakovaný problém: &bdquo;' + esc(x.task) + '&ldquo; ' + x.count + '&times; &mdash; vyžaduje pozornosť.'); });
    p.opakHaccp.forEach(function (x) { up.push(esc(x.device) + ': prekročený limit ' + x.n + '&times; &mdash; skontrolujte chladenie.'); });
    if (up.length) {
      h += '<div style="margin-top:14px;background:#fdf3e3;border-left:3px solid ' + G + ';border-radius:6px;padding:11px 14px">' +
        '<div style="font-weight:800;color:' + GD + ';font-size:11px;letter-spacing:.5px;margin-bottom:5px">&#9888;&#65039; UPOZORNENIA</div>';
      up.forEach(function (t) { h += '<div style="font-size:12.5px;color:' + TX + ';margin:3px 0;line-height:1.45">&bull; ' + t + '</div>'; });
      h += '</div>';
    }

    // problémové úlohy
    if (p.problemove.length) {
      h += sekcia('Nesplnené a problémové úlohy (' + p.problemove.length + ')');
      h += '<table width="100%" cellpadding="0" cellspacing="0" style="font-size:12.5px">';
      p.problemove.slice(0, 8).forEach(function (t, i) {
        var stav = t.issue ? '<span style="color:' + ERR + ';font-weight:700">&#9888; ' + esc(t.issue) + '</span>' : '<span style="color:' + MUT + '">&#10007; nesplnené</span>';
        h += '<tr style="background:' + (i % 2 ? SOFT : CARD) + '">' +
          '<td style="padding:5px 8px;white-space:nowrap;color:' + SUB + '">' + skDate(t.day) + '</td>' +
          '<td style="padding:5px 8px;color:' + TX + '">' + esc(t.task || '') + '</td>' +
          '<td style="padding:5px 8px;text-align:right">' + stav + '</td></tr>';
      });
      h += '</table>';
      if (p.problemove.length > 8) h += '<div style="font-size:12px;color:' + MUT + ';margin-top:4px">&hellip; a ďalších ' + (p.problemove.length - 8) + '</div>';
    }

    // top odpisy
    if (p.topOdpisy.length) {
      h += sekcia('Najviac odpisované');
      h += '<table width="100%" cellpadding="0" cellspacing="0" style="font-size:12.5px">';
      p.topOdpisy.forEach(function (o, i) {
        h += '<tr style="background:' + (i % 2 ? SOFT : CARD) + '">' +
          '<td style="padding:5px 8px;color:' + TX + '">' + esc(o.item) + '</td>' +
          '<td style="padding:5px 8px;text-align:right;font-weight:800;color:' + G + ';white-space:nowrap">' + (Math.round(o.qty * 10) / 10) + ' ' + esc(o.unit) + '</td></tr>';
      });
      h += '</table>';
    }

    h += '</td></tr></table></td></tr>';
  });

  // PÄTA
  h += '<tr><td style="background:' + CARD + ';border-radius:0 0 16px 16px;padding:16px 20px 22px;text-align:center">' +
    '<div style="font-size:11px;color:' + MUT + '">Automatický report z Foxford databázy &middot; vygenerované ' + skDate(isoDay(new Date())) + '</div></td></tr>';
  h += '</table></div>';
  return h;
}

function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function isoDay(d) { return Utilities.formatDate(d, TZ, 'yyyy-MM-dd'); }
function skDate(iso) { var p = String(iso).split('-'); return p.length === 3 ? (parseInt(p[2], 10) + '. ' + parseInt(p[1], 10) + '. ' + p[0]) : iso; }

// ── Príjemcovia ──────────────────────────────────────────────────────────────
// REPORTY (voliteľné): "email=Pobočka,Pobočka; email2=*" → per-manažérske reporty.
// Vráti [{email, pobocky:[...]}] alebo null (keď REPORTY nie je nastavené).
function parseReporty() {
  var raw = PropertiesService.getScriptProperties().getProperty('REPORTY');
  if (!raw || !raw.trim()) return null;
  return raw.split(/[;\n]+/).map(function (s) { return s.trim(); }).filter(Boolean).map(function (seg) {
    var i = seg.indexOf('=');
    if (i < 0) i = seg.indexOf(':');
    if (i < 0) return null;
    var email = seg.slice(0, i).trim();
    var pob = seg.slice(i + 1).split(',').map(function (x) { return x.trim(); }).filter(Boolean);
    return (email && pob.length) ? { email: email, pobocky: pob } : null;
  }).filter(Boolean);
}
function filtrujPobocky(P, pobocky) {
  if (pobocky.indexOf('*') >= 0) return P;
  var out = {}; pobocky.forEach(function (b) { if (P[b]) out[b] = P[b]; }); return out;
}

function report(od, doD, odPrev, doPrev, nadpis) {
  var data = nacitajObdobie(od, doD);
  var trzbyPrev = trzbyPodlaPobocky(nacitajObdobie(odPrev, doPrev).uzavierky);
  var P = agregujPobocky(data, trzbyPrev);
  var subject = 'Foxford — ' + nadpis + ' (' + skDate(od) + ' – ' + skDate(doD) + ')';

  var reporty = parseReporty();
  if (reporty && reporty.length) {
    // B) každý dostane report len o svojich pobočkách
    reporty.forEach(function (r) {
      var Pf = filtrujPobocky(P, r.pobocky);
      if (!Object.keys(Pf).length) return;   // pre tohto príjemcu nič v období
      MailApp.sendEmail({ to: r.email, subject: subject, htmlBody: generujHtml(Pf, od, doD, nadpis) });
    });
  } else {
    // A) jeden spoločný report o všetkých pobočkách
    var prij = cfg('PRIJEMCOVIA').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    if (!prij.length) throw new Error('Nastav PRIJEMCOVIA alebo REPORTY v Script Properties');
    MailApp.sendEmail({ to: prij.join(','), subject: subject, htmlBody: generujHtml(P, od, doD, nadpis) });
  }
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
