// ═══════════════════════════════════════════════════════════════════════════
// PREHĽADY — manažérsky režim Foxford appky (otvára sa cez #prehlady)
//
// Samostatná vetva appky: index.js pri hashi #prehlady renderuje TENTO modul
// namiesto prevádzkovej App — na tabletoch sa teda nič nemení a nebeží tu
// žiadna prevádzková mašinéria (polnočné uzávierky, zálohy, pripomienky).
//
// Prihlásenie: Supabase Auth (účty zakladá admin v dashboarde). Ktoré pobočky
// manažér vidí, určuje tabuľka manager_pobocky (branch '*' = všetky) — vynucuje
// to RLS priamo v databáze, appka len zobrazuje, čo jej databáza vydá.
//
// Tržbová časť (filter Deň/Týždeň/Mesiac/Rok, podiely platieb, stav kasy,
// upozornenia, História) je prenesená z appky OBRATOVÁ TABUĽKA — vrátane
// vzorca hotovosti a reťazeného stavu kasy. Uzávierky čítame v dvoch
// dialektoch: appka posiela polia A..M, importovaná história OBRATOV má
// pomenované polia (obrat, karta, …) — viď normUzav().
//
// VIZUÁL: redizajn podľa design handoffu „Prehlady Redesign" (dark sidebar,
// Space Grotesk, count-up čísla, kreslené SVG grafy + donut, CSS bary,
// ambient pozadie). Grafy sú vlastné SVG/CSS — Chart.js sa tu už nepoužíva.
// ═══════════════════════════════════════════════════════════════════════════
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Font redizajnu (Space Grotesk sa doťahuje cez @import v PrStyle)
const FONT = "'Space Grotesk', system-ui, -apple-system, 'Segoe UI', sans-serif";
// Rešpekt k „prefers-reduced-motion" — vypne JS count-up (CSS animácie tlmí @media)
const REDUCE = typeof window !== 'undefined' && window.matchMedia
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Paleta redizajnu (tokeny z handoffu). Ponechané aj staršie kľúče, ktoré
// používajú login/modal, aby sa nič nerozbilo.
const C = {
  bg: '#ece5d3', panel: 'rgba(255,255,255,0.82)', panelFull: '#ffffff',
  border: 'rgba(150,120,80,0.16)', borderM: 'rgba(150,120,80,0.30)',
  gold: '#b87020', goldLight: '#d9a03f', goldDim: 'rgba(184,112,32,0.12)', goldLine: 'rgba(184,112,32,0.35)',
  text: '#221809', sub: '#6b5d4f', muted: '#a09080',
  ok: '#2a9a55', okLight: '#48b370', okDim: 'rgba(42,154,85,0.10)',
  err: '#d03030', errLight: '#e06a50', errDim: 'rgba(208,48,48,0.09)',
  fialova: '#7c5cc4', jantar: '#d9a03f',
  dark1: '#261b0c', dark2: '#1c1307', cream: '#ece5d3',
  creamText: 'rgba(236,229,211,0.7)', creamMuted: 'rgba(236,229,211,0.45)', creamLine: 'rgba(236,229,211,0.09)',
};

const SB_URL  = (process.env.REACT_APP_SUPABASE_URL || '').replace(/\/$/, '');
const SB_ANON = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const sb = SB_URL && SB_ANON ? createClient(SB_URL, SB_ANON) : null;

// ── Dátumové pomôcky (lokálny čas, žiadne UTC posuny) ────────────────────────
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayLabel = (i) => { const [, m, d] = i.split('-'); return `${+d}.${+m}.`; };
const MESIACE = ['Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 'Júl', 'August', 'September', 'Október', 'November', 'December'];
const DNI_SK = ['nedeľa', 'pondelok', 'utorok', 'streda', 'štvrtok', 'piatok', 'sobota'];
const dayName = (i) => DNI_SK[new Date(i + 'T12:00:00').getDay()];

const fmtEur = (n, dec = 0) => (n ?? 0).toLocaleString('sk-SK', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + ' €';
const fmtNum = (n) => (n ?? 0).toLocaleString('sk-SK');

// ── CSV export (Sheet-ekvivalent, otvoriteľné v Exceli) ──────────────────────
// BOM + oddeľovač ';' + desatinná čiarka (sk) = správne stĺpce aj diakritika v sk Exceli.
const csvCell = (v) => { const t = String(v ?? ''); return /[";\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
const csvNum = (v) => (v == null || v === '') ? '' : String(v).replace('.', ',');   // bez tisícových oddeľovačov
const csvDate = (isoDay) => { const [y, m, d] = isoDay.split('-'); return `${+d}.${+m}.${y}`; };
function downloadCSV(filename, rows) {
  const BOM = String.fromCharCode(0xFEFF);   // Excel rozpozná UTF-8 (diakritika)
  const csv = BOM + rows.map(r => r.map(csvCell).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

// ── Normalizácia uzávierky — zjednotenie dialektu appky (A..M) a OBRATOV ─────
function normUzav(d) {
  if (!d) return null;
  const n = (v) => { const x = parseFloat(String(v ?? '').replace(',', '.')); return isNaN(x) ? 0 : x; };
  const ma = (v) => v !== undefined && v !== null && v !== '';
  const nn = (v) => ma(v) ? n(v) : null;   // null keď pole chýba → v tabuľke „—"
  if (ma(d.obrat) || d.zdroj === 'obraty-import') {
    // dialekt OBRATOVEJ TABUĽKY (importovaná história) + demo dáta.
    // App-natívne polia (A/H/I/J, audit prerátania, gNote) tu neexistujú → null.
    return { obrat: n(d.obrat), karta: n(d.karta), qerko: n(d.qerko), qerkoTr: n(d.qerko_tringelty),
             gastro: n(d.gastro_listky), zaokruhly: n(d.zaokruhly), odvod: n(d.odvod),
             nakupy: n(d.nakupy), kasa: ma(d.excel_drawer) ? n(d.excel_drawer) : (ma(d.kasaStav) ? n(d.kasaStav) : null),
             a: null, hMam: null, iReal: null, jManko: null, stravna: null, gNote: '',
             maloByt: null, rozdielA: null, firstA: null, firstRozdiel: null, nesedelo: null, dialekt: 'obraty' };
  }
  // dialekt appky: A Zostatok predch. · B Tržba · C Karta · D Qerko · E Tringelt ·
  // F Gastro lístky · G Nákup · H Mám mať · I Reálne v kase · J Tringelt/Manko ·
  // K Odvod · L Zaokrúhlenie · M Nový zostatok (kasa večer) + audit prvého prerátania
  return { obrat: n(d.B), karta: n(d.C), qerko: n(d.D), qerkoTr: n(d.E), gastro: n(d.F),
           zaokruhly: n(d.L), odvod: n(d.K), nakupy: n(d.G), kasa: ma(d.M) ? n(d.M) : null,
           a: nn(d.A), hMam: nn(d.H), iReal: nn(d.I), jManko: nn(d.J), stravna: nn(d.stravnaKarta),
           gNote: d.gNote || '', maloByt: nn(d.maloByt), rozdielA: nn(d.rozdielA),
           firstA: nn(d.firstA), firstRozdiel: nn(d.firstRozdiel), nesedelo: d.nesedeloPrvotne || null, dialekt: 'app' };
}
// Hotovosť z tržby — rovnaký vzorec ako v OBRATOVEJ TABUĽKE
const hotovostZ = (u) => u.obrat - u.karta - u.gastro + u.zaokruhly - u.qerko - u.qerkoTr;

// ── UKÁŽKOVÝ REŽIM (#prehlady-demo) — vymyslené dáta, bez prihlásenia ────────
const DEMO = typeof window !== 'undefined' && window.location.hash === '#prehlady-demo';
const DEMO_POBOCKY = ['Obchodná', 'Nivy', 'Cubicon', 'Levice', 'Martin', 'Žilina', 'Poprad', 'Prešov', 'Košice'];
let _demoCache = null;
function demoRows() {
  if (_demoCache) return _demoCache;
  const uzavierky = [], odpisy = [], tasks = [], haccp = [];
  const items = [['Mlieko', 'l'], ['Croissant', 'ks'], ['Káva (goriffee + dvojka)', 'kg'],
                 ['Sirup malina', 'l'], ['Bageta', 'ks'], ['Cheesecake', 'ks']];
  const zar = [['Chladnička bar', 5, 3.2], ['Mraznička', -18, -20.5], ['Vitrína koláče', 7, 5]];
  const dniAsc = [];
  for (let i = 420; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); dniAsc.push(d); }
  const kasa = Object.fromEntries(DEMO_POBOCKY.map(b => [b, 300 + Math.random() * 200]));
  dniAsc.forEach(d => {
    const day = iso(d);
    const vikend = [0, 6].includes(d.getDay());
    DEMO_POBOCKY.forEach(b => {
      const obrat = Math.round((900 + Math.random() * 1600) * (vikend ? 1.45 : 1) * 100) / 100;
      const karta = Math.round(obrat * (0.55 + Math.random() * 0.15) * 100) / 100;
      const qerko = Math.round(obrat * (0.03 + Math.random() * 0.05) * 100) / 100;
      const qerkoTr = Math.round(qerko * 0.12 * 100) / 100;
      const gastro = Math.round(obrat * (0.02 + Math.random() * 0.04) * 100) / 100;
      const hot = obrat - karta - gastro - qerko - qerkoTr;
      let odvod = 0;
      kasa[b] += hot;
      if (kasa[b] > 850) { odvod = Math.round((kasa[b] - 300) * 100) / 100; kasa[b] -= odvod; }
      uzavierky.push({ day, branch: b, data: { obrat, karta, qerko, qerko_tringelty: qerkoTr,
        gastro_listky: gastro, zaokruhly: 0, odvod, nakupy: 0, excel_drawer: Math.round(kasa[b] * 100) / 100, kasa: 'FXF' } });
      if (i0(d) < 92) { // prevádzkové dáta stačia za ~3 mesiace
        const kdo = ['Katka', 'Miro', 'Zuzka', 'Peter'][Math.floor(Math.random() * 4)];
        const ulohy = { ranné: ['Zapnutie umývačky', 'Kontrola čistoty rajóna', 'Doplnenie pások', 'Kontrola vitríny', 'Príprava karáf', 'Vysávanie', 'Kontrola WC', 'Zapnutie hudby'],
                        večerné: ['Umytie stolov', 'Vypnutie svetiel', 'Kontrola kasy', 'Vyloženie umývačky', 'Utretie barov', 'Poriadok pod stolmi', 'Kontrola zásob', 'Zamknutie'] };
        ['ranné', 'večerné'].forEach(cat => ulohy[cat].forEach((task, idx) => {
          // "Doplnenie pások" schválne často problémová → demo opakovaného problému
          const done = idx === 2 ? Math.random() < 0.55 : Math.random() < 0.93;
          const issue = !done && Math.random() < 0.6 ? (idx === 2 ? 'Chýba materiál na sklade' : ['Nestihnuté', 'Pokazené zariadenie', 'Nedostatok času'][Math.floor(Math.random() * 3)]) : null;
          tasks.push({ day, branch: b, category: cat, task, done, issue, done_by: kdo, inspector: kdo, done_time: done ? (cat === 'ranné' ? '08:15' : '21:40') : '' });
        }));
        items.forEach(([item, unit]) => { if (Math.random() < 0.5) odpisy.push({ day, branch: b, item, qty: +(0.2 + Math.random() * 2.8).toFixed(1), unit, reason: 'Spotreba', author: kdo, day_note: '' }); });
        zar.forEach(([dev, maxn, base]) => {
          const val = +(base + Math.random() * 3.4 - 0.8).toFixed(1);
          haccp.push({ day, branch: b, device: dev, value: val, max_limit: `≤ ${maxn} °C`, exceeded: val > maxn, shift: Math.random() < 0.5 ? 'ranná' : 'večerná', inspector: kdo });
        });
      }
    });
  });
  function i0(d) { return Math.round((Date.now() - d.getTime()) / 86400000); }
  _demoCache = { uzavierky, odpisy, tasks, haccp };
  return _demoCache;
}

// ═══ Prezentačné mikro-komponenty (redizajn) ═════════════════════════════════

// Globálny štýl: font, keyframes, hover triedy, layout mriežka. Mountuje sa raz
// v Prehlady() aby platil pre login aj dashboard.
function PrStyle() {
  return (
    <style>{`
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
@keyframes fxUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes fxIn{from{opacity:0}to{opacity:1}}
@keyframes fxDraw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes fxArea{from{opacity:0}to{opacity:.9}}
@keyframes fxSweep{from{transform:rotate(-70deg) scale(.85);opacity:0}to{transform:rotate(0deg) scale(1);opacity:1}}
@keyframes fxGrow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes fxWide{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes fxFloat{0%,100%{transform:translate(0,0)}50%{transform:translate(40px,-30px)}}
@keyframes fxDot{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.5)}}
.fx-kpi{transition:transform .3s,box-shadow .3s}
.fx-kpi:hover{transform:translateY(-4px);box-shadow:0 14px 34px rgba(90,70,45,.14)}
.fx-chip{transition:all .3s}
.fx-chip:hover{transform:translateY(-2px)}
.fx-chip:active{transform:scale(.95)}
.fx-mbtn{transition:background .35s,color .35s,transform .15s}
.fx-mbtn:hover{transform:translateX(3px)}
.fx-mbtn:active{transform:scale(.97)}
.fx-hrow{transition:background .25s}
.fx-hrow:hover{background:rgba(184,112,32,.06)}
.fx-ghost{transition:background .25s}
.fx-ghost:hover{background:rgba(236,229,211,.08)!important}
.fx-nav{transition:transform .2s}
.fx-nav:hover{transform:scale(1.18)}
.fx-katrow{transition:background .2s}
.fx-katrow:hover{background:rgba(184,112,32,.06)}
.pr-layout{display:flex;min-height:100vh;align-items:stretch;position:relative}
.pr-side{width:232px;flex-shrink:0;background:linear-gradient(180deg,${C.dark1},${C.dark2});color:${C.cream};display:flex;flex-direction:column;position:sticky;top:0;height:100vh;z-index:20;box-shadow:8px 0 40px rgba(40,25,5,.18)}
.pr-menu{padding:12px 10px;display:flex;flex-direction:column;gap:4px;flex:1;overflow-y:auto}
.pr-main{flex:1;min-width:0;display:flex;flex-direction:column;position:relative;z-index:1}
.pr-top{position:sticky;top:0;z-index:15;background:rgba(236,229,211,.88);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid rgba(150,120,80,.18);padding:14px 26px;display:flex;flex-direction:column;gap:10px}
.pr-cont{padding:24px 26px 48px;max-width:1180px;width:100%;box-sizing:border-box}
.pr-charts{display:grid;gap:14px;grid-template-columns:1.6fr 1fr;margin-bottom:16px}
@media(max-width:860px){
 .pr-layout{flex-direction:column}
 .pr-side{width:auto;height:auto;position:static;flex-direction:column}
 .pr-menu{flex-direction:row;overflow-x:auto;padding:10px}
 .pr-menu .fx-mbtn{white-space:nowrap;flex-shrink:0;width:auto!important}
 .pr-cont{padding:18px 16px 40px}
 .pr-top{padding:12px 16px}
 .pr-charts{grid-template-columns:1fr}
}
@media(prefers-reduced-motion:reduce){*{animation-duration:.001ms!important;animation-delay:0ms!important;transition-duration:.001ms!important}}
`}</style>
  );
}

// Count-up čísla: tween z aktuálne zobrazenej hodnoty na cieľ (rAF, easing 1-(1-p)^3)
function Num({ value, format, animate = true }) {
  const [disp, setDisp] = useState(animate ? 0 : value);
  const dispRef = useRef(disp);
  dispRef.current = disp;
  useEffect(() => {
    if (!animate) { setDisp(value); return; }
    const from = dispRef.current, t0 = performance.now(), dur = 950;
    let raf;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      setDisp(p >= 1 ? value : from + (value - from) * e);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    // poistka: keby rAF slučka zlyhala, o 1,2 s nastav cieľ natvrdo
    const fb = setTimeout(() => setDisp(value), 1200);
    return () => { cancelAnimationFrame(raf); clearTimeout(fb); };
  }, [value, animate]);
  return <>{format(disp)}</>;
}

// KPI karta s count-up hodnotou a hover zdvihom
function KPI({ label, value, note, color, size = 30, delay = 0, children }) {
  return (
    <div className="fx-kpi" style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 20,
      padding: '18px 20px', boxShadow: '0 2px 16px rgba(90,70,45,.06)', backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)', animation: `fxUp .5s ${delay}s backwards` }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: size, fontWeight: 700, color: color || C.gold, marginTop: 8, lineHeight: 1.05,
        fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{value}</div>
      {note ? <div style={{ fontSize: 11.5, color: C.muted, marginTop: 6 }}>{note}</div> : null}
      {children}
    </div>
  );
}

// Univerzálna panelová karta
function Panel({ title, children, style, delay = 0, dur = '.5s' }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 20, padding: '18px 20px',
      boxShadow: '0 2px 16px rgba(90,70,45,.06)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      animation: `fxUp ${dur} ${delay}s backwards`, ...style }}>
      {title && <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, letterSpacing: 1,
        textTransform: 'uppercase', marginBottom: 12 }}>{title}</div>}
      {children}
    </div>
  );
}

function ProgressBar({ pct, color, delay = '.5s', h = 6, animate }) {
  return (
    <div style={{ height: h, background: 'rgba(150,120,80,.14)', borderRadius: 6, marginTop: 10, overflow: 'hidden' }}>
      <div style={{ height: '100%', borderRadius: 6, background: color, width: pct + '%', transformOrigin: 'left',
        animation: animate ? `fxWide 1s ${delay} cubic-bezier(.2,.8,.2,1) both` : 'none', transition: 'width .8s' }} />
    </div>
  );
}

// Graf tržieb — kreslená SVG čiara (deň = stĺpce podľa pobočky)
function TrzbyChart({ agg, mode, vybrana, pobocky, animate }) {
  if (mode === 'den') {
    const brs = vybrana === '*' ? (pobocky || []) : [vybrana];
    const map = {};
    agg.uzRows.forEach(u => { map[u.branch] = (map[u.branch] || 0) + u.obrat; });
    const vals = brs.map(b => ({ label: b, v: map[b] || 0 })).filter(x => x.v > 0);
    if (vals.length === 0) return <div style={{ color: C.muted, fontSize: 13, padding: '30px 0' }}>V tomto dni nie sú tržby.</div>;
    const max = Math.max(...vals.map(x => x.v), 1);
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 260, paddingTop: 10 }}>
        {vals.map((x, i) => (
          <div key={x.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 6, height: '100%', justifyContent: 'flex-end', minWidth: 0 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: C.sub, fontVariantNumeric: 'tabular-nums' }}>{fmtNum(Math.round(x.v))} €</div>
            <div style={{ width: '100%', maxWidth: 44, borderRadius: '8px 8px 3px 3px',
              background: 'linear-gradient(180deg,#d9a03f,#b87020)', height: (x.v / max * 100).toFixed(1) + '%',
              transformOrigin: 'bottom', animation: animate ? `fxGrow .8s ${(i * 0.06).toFixed(2)}s cubic-bezier(.2,.8,.2,1) both` : 'none',
              transition: 'height .7s cubic-bezier(.2,.8,.2,1)' }} />
            <div style={{ fontSize: 10, color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden',
              textOverflow: 'ellipsis', maxWidth: '100%' }}>{x.label}</div>
          </div>
        ))}
      </div>
    );
  }
  let pts;
  if (mode === 'rok') {
    const mes = {};
    Object.entries(agg.poDni).forEach(([d, v]) => { const m = d.slice(0, 7); mes[m] = (mes[m] || 0) + v; });
    const keys = Object.keys(mes).sort();
    pts = keys.map(m => ({ t: MESIACE[+m.slice(5) - 1].slice(0, 3), v: mes[m] }));
  } else {
    const keys = Object.keys(agg.poDni).sort();
    pts = keys.map(d => ({ t: dayLabel(d), v: agg.poDni[d] }));
  }
  if (pts.length === 0) return <div style={{ color: C.muted, fontSize: 13, padding: '30px 0' }}>V tomto období nie sú žiadne uzávierky.</div>;
  if (pts.length === 1) pts = [pts[0], pts[0]];
  const max = Math.max(...pts.map(p => p.v), 1);
  const W = 640, H = 240, pT = 16, pB = 28;
  const px = (i) => pts.length > 1 ? i / (pts.length - 1) * W : W / 2;
  const py = (v) => pT + (1 - v / max) * (H - pT - pB);
  const linePath = pts.map((p, i) => (i ? 'L' : 'M') + px(i).toFixed(1) + ',' + py(p.v).toFixed(1)).join(' ');
  const areaPath = linePath + ` L${W},${H - pB} L0,${H - pB} Z`;
  const step = Math.max(1, Math.ceil(pts.length / 7));
  const xLabels = pts.filter((_, i) => i % step === 0).map((p) => {
    const idx = pts.indexOf(p);
    return { x: Math.min(Math.max(px(idx), 18), W - 18).toFixed(0), t: p.t };
  });
  const gridY = [0, 0.5, 1].map(f => ({ y: py(max * f).toFixed(1), ty: (py(max * f) - 5).toFixed(1),
    t: f === 0 ? '' : fmtNum(Math.round(max * f / 100) * 100) + ' €' }));
  return (
    <svg viewBox="0 0 640 240" style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="fxg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b87020" stopOpacity=".28" />
          <stop offset="1" stopColor="#b87020" stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridY.map((g, i) => (
        <g key={i}>
          <line x1="0" x2="640" y1={g.y} y2={g.y} stroke="rgba(150,120,80,.15)" strokeDasharray="3 5" />
          <text x="0" y={g.ty} fontSize="10" fill={C.muted}>{g.t}</text>
        </g>
      ))}
      <path d={areaPath} fill="url(#fxg)" style={{ animation: animate ? 'fxArea 1.4s .5s both' : 'none', opacity: animate ? undefined : 0.9 }} />
      <path d={linePath} fill="none" stroke="#b87020" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
        pathLength="1" strokeDasharray="1" style={{ animation: animate ? 'fxDraw 1.6s .2s cubic-bezier(.4,0,.2,1) both' : 'none' }} />
      {xLabels.map((x, i) => (
        <text key={i} x={x.x} y="236" fontSize="10" fill={C.muted} textAnchor="middle">{x.t}</text>
      ))}
    </svg>
  );
}

// Donut podielov platieb + legenda
function DonutPodiely({ agg, animate }) {
  const hot = Math.max(agg.hotovost, 0);
  const seg = [['Terminál', C.gold, agg.karty], ['Hotovosť', C.ok, hot], ['Qerko', C.fialova, agg.qerko], ['Gastro lístky', C.jantar, agg.gastro]];
  const tot = seg.reduce((s, x) => s + x[2], 0) || 1;
  let acc = 0;
  const circles = seg.map(([, color, v]) => {
    const pct = v / tot * 100;
    const vis = Math.max(pct - 0.6, 0);
    const c = { color, dash: `${vis.toFixed(2)} ${(100 - vis).toFixed(2)}`, off: (-acc).toFixed(2) };
    acc += pct; return c;
  });
  const legend = seg.map(([label, color, v]) => ({ label, color, pct: Math.round(v / tot * 100) }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{ position: 'relative', width: 170, height: 170 }}>
        <svg viewBox="0 0 220 220" style={{ width: '100%', height: '100%', transformOrigin: 'center',
          animation: animate ? 'fxSweep 1s .35s cubic-bezier(.2,.8,.2,1) both' : 'none' }}>
          {circles.map((c, i) => (
            <circle key={i} cx="110" cy="110" r="84" fill="none" stroke={c.color} strokeWidth="30"
              pathLength="100" strokeDasharray={c.dash} strokeDashoffset={c.off} transform="rotate(-90 110 110)"
              style={{ transition: 'stroke-dasharray .8s, stroke-dashoffset .8s' }} />
          ))}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', animation: animate ? 'fxIn .8s .8s both' : 'none' }}>
          <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>spolu</div>
          <div style={{ fontSize: 19, fontWeight: 700, color: C.text, fontVariantNumeric: 'tabular-nums' }}>{fmtEur(Math.round(agg.trzby))}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, width: '100%' }}>
        {legend.map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, flexShrink: 0, background: l.color }} />
            <span style={{ color: C.sub, flex: 1 }}>{l.label}</span>
            <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{l.pct} %</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Chip (pobočky, stránkovanie histórie)
const chipStyle = (on) => ({ padding: '7px 15px', borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
  whiteSpace: 'nowrap', fontFamily: 'inherit', border: `1px solid ${on ? C.gold : 'rgba(150,120,80,.22)'}`,
  background: on ? C.gold : 'rgba(255,255,255,.7)', color: on ? '#fff' : C.sub });

// ── Hlavný komponent ─────────────────────────────────────────────────────────
export default function Prehlady() {
  const [session, setSession] = useState(null);
  const [bootDone, setBootDone] = useState(false);

  useEffect(() => {
    if (!sb) { setBootDone(true); return; }
    sb.auth.getSession().then(({ data }) => { setSession(data.session || null); setBootDone(true); });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  let obsah;
  if (DEMO) obsah = <Dashboard session={{ user: { email: 'ukážka@foxford.sk' } }} demo />;
  else if (!sb) obsah = <Sprava text="Prehľady nie sú nakonfigurované (chýbajú kľúče databázy v builde)." />;
  else if (!bootDone) obsah = <Sprava text="Načítavam…" />;
  else obsah = session ? <Dashboard session={session} /> : <Login />;

  return (<>
    <PrStyle />
    {obsah}
  </>);
}

function Sprava({ text }) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontFamily: FONT, color: C.sub }}>
      {text}
    </div>
  );
}

// ── Prihlásenie ──────────────────────────────────────────────────────────────
function Login() {
  const [email, setEmail] = useState('');
  const [heslo, setHeslo] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !heslo) return;
    setBusy(true); setErr('');
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: heslo });
    setBusy(false);
    if (error) setErr('Nesprávny e-mail alebo heslo.');
  };

  const inp = { width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 12,
                border: `1px solid ${C.borderM}`, background: '#fff', fontSize: 15, color: C.text,
                outline: 'none', fontFamily: 'inherit' };

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg,${C.cream},#e4dac2)`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', padding: 24, fontFamily: FONT }}>
      <form onSubmit={submit} style={{ width: '100%', maxWidth: 380, background: C.panelFull,
             border: `1px solid ${C.borderM}`, borderRadius: 24, padding: '34px 28px',
             boxShadow: '0 8px 40px rgba(90,70,45,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          <img src={`${process.env.PUBLIC_URL}/foxford-logo.png.png`} alt="Foxford" style={{ height: 44 }} />
        </div>
        <div style={{ textAlign: 'center', fontSize: 19, fontWeight: 700, color: C.text, marginBottom: 2 }}>Prehľady</div>
        <div style={{ textAlign: 'center', fontSize: 12, color: C.muted, marginBottom: 24 }}>manažérsky prístup</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input style={inp} type="email" placeholder="E-mail" value={email} autoFocus
                 onChange={e => setEmail(e.target.value)} autoComplete="username" />
          <input style={inp} type="password" placeholder="Heslo" value={heslo}
                 onChange={e => setHeslo(e.target.value)} autoComplete="current-password" />
        </div>
        {err && <div style={{ marginTop: 12, fontSize: 13, color: C.err, textAlign: 'center' }}>{err}</div>}
        <button type="submit" disabled={busy}
          style={{ width: '100%', marginTop: 18, padding: 14, borderRadius: 14, border: 'none',
                   background: `linear-gradient(135deg,${C.goldLight},${C.gold})`, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                   fontFamily: 'inherit', opacity: busy ? .6 : 1, boxShadow: '0 4px 18px rgba(184,112,32,0.35)' }}>
          {busy ? 'Prihlasujem…' : 'Prihlásiť sa'}
        </button>
        <div style={{ marginTop: 16, fontSize: 11, color: C.muted, textAlign: 'center', lineHeight: 1.5 }}>
          Prístup zakladá administrátor.<br />Zabudnuté heslo ti obnoví admin.
        </div>
      </form>
    </div>
  );
}

// ── Načítanie všetkých stránok (PostgREST vracia max ~1000 riadkov naraz) ────
async function fetchAll(build) {
  const out = [];
  for (let page = 0; page < 40; page++) {
    const { data, error } = await build().range(page * 1000, page * 1000 + 999);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

// ── Rozsah obdobia podľa filtra ──────────────────────────────────────────────
function rozsah(mode, date) {
  const d = new Date(date);
  if (mode === 'den') return [iso(d), iso(d)];
  if (mode === 'tyzden') {
    const a = new Date(d); a.setDate(a.getDate() - ((a.getDay() + 6) % 7));
    const b = new Date(a); b.setDate(a.getDate() + 6);
    return [iso(a), iso(b)];
  }
  if (mode === 'mesiac') return [iso(new Date(d.getFullYear(), d.getMonth(), 1)), iso(new Date(d.getFullYear(), d.getMonth() + 1, 0))];
  return [`${d.getFullYear()}-01-01`, `${d.getFullYear()}-12-31`];
}
function rozsahLabel(mode, date) {
  const d = new Date(date);
  if (mode === 'den') return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()} (${DNI_SK[d.getDay()]})`;
  if (mode === 'tyzden') { const [a, b] = rozsah(mode, date); return `${dayLabel(a)} – ${dayLabel(b)} ${b.slice(0, 4)}`; }
  if (mode === 'mesiac') return `${MESIACE[d.getMonth()]} ${d.getFullYear()}`;
  return String(d.getFullYear());
}

// ── Dashboard ────────────────────────────────────────────────────────────────
const MODY = [{ id: 'den', label: 'Deň' }, { id: 'tyzden', label: 'Týždeň' }, { id: 'mesiac', label: 'Mesiac' }, { id: 'rok', label: 'Rok' }];
const SEKCIE = [
  { id: 'prehlad', ikona: '🏠', label: 'Prehľad' },
  { id: 'uzavierky', ikona: '💰', label: 'Uzávierky' },
  { id: 'ulohy', ikona: '✅', label: 'Úlohy' },
  { id: 'odpisy', ikona: '📉', label: 'Odpisy' },
  { id: 'teploty', ikona: '🌡️', label: 'Teploty' },
];

function Dashboard({ session, demo }) {
  const email = session.user?.email || '';
  const [pobocky, setPobocky] = useState(null);
  const [vybrana, setVybrana] = useState('*');
  const [mode, setMode] = useState('mesiac');
  const [refDate, setRefDate] = useState(() => new Date());
  const [data, setData] = useState(null);
  const [chyba, setChyba] = useState('');
  const [nacitava, setNacitava] = useState(true);
  const [zmenaHesla, setZmenaHesla] = useState(false);
  const [histStrana, setHistStrana] = useState(1);
  const [filterKat, setFilterKat] = useState(null);   // klik na zmenu → filter detailu podľa kategórie
  const [sekcia, setSekcia] = useState('prehlad');    // ľavé menu: prehlad | uzavierky | ulohy | odpisy | teploty

  const [od, doD] = rozsah(mode, refDate);
  // Ročný pohľad všetkých pobočiek = priveľa surových riadkov úloh/odpisov —
  // vtedy zobrazujeme len tržbovú časť (rovnako to robila OBRATOVÁ TABUĽKA)
  const lenTrzby = mode === 'rok' && vybrana === '*';
  const animate = !REDUCE;

  // 1) Ktoré pobočky mi patria?
  useEffect(() => {
    if (demo) { setPobocky(DEMO_POBOCKY); setVybrana('*'); return; }
    (async () => {
      const { data: rows, error } = await sb.from('manager_pobocky').select('branch');
      if (error) { setChyba('Nepodarilo sa načítať oprávnenia.'); setPobocky([]); return; }
      let list = (rows || []).map(r => r.branch);
      if (list.includes('*')) {
        const { data: all } = await sb.from('branches').select('name').order('name');
        list = (all || []).map(b => b.name);
        setPobocky(list); setVybrana('*');
      } else {
        setPobocky(list); setVybrana(list.length === 1 ? list[0] : '*');
      }
    })();
  }, [demo]);

  // 2) Dáta za zvolené obdobie a pobočku
  useEffect(() => {
    if (!pobocky) return;
    if (pobocky.length === 0) { setNacitava(false); return; }
    let zij = true;
    (async () => {
      setNacitava(true); setChyba(''); setHistStrana(1); setFilterKat(null);
      if (demo) {
        const all = demoRows();
        const f = rows => rows.filter(r => r.day >= od && r.day <= doD && (vybrana === '*' || r.branch === vybrana));
        setData({ uzavierky: f(all.uzavierky), odpisy: lenTrzby ? [] : f(all.odpisy),
                  tasks: lenTrzby ? [] : f(all.tasks), haccp: lenTrzby ? [] : f(all.haccp) });
        setNacitava(false);
        return;
      }
      try {
        const q = (tab, sel) => () => {
          let x = sb.from(tab).select(sel).gte('day', od).lte('day', doD).order('day');
          if (vybrana !== '*') x = x.eq('branch', vybrana);
          return x;
        };
        const [uz, od_, ta, ha] = await Promise.all([
          fetchAll(q('uzavierky_log', 'day, branch, kasa, meno, created_at, data')),
          lenTrzby ? [] : fetchAll(q('odpisy_log', 'day, branch, item, qty, unit, reason, author, day_note')),
          lenTrzby ? [] : fetchAll(q('tasks_log', 'day, branch, category, done, task, issue, done_by, inspector, done_time')),
          lenTrzby ? [] : fetchAll(q('haccp_log', 'day, branch, device, value, max_limit, exceeded, inspector, shift')),
        ]);
        if (!zij) return;
        setData({ uzavierky: uz, odpisy: od_, tasks: ta, haccp: ha });
      } catch (e) {
        if (zij) setChyba('Načítanie dát zlyhalo: ' + (e.message || e));
      }
      if (zij) setNacitava(false);
    })();
    return () => { zij = false; };
  }, [pobocky, vybrana, mode, refDate, demo]);        // eslint-disable-line react-hooks/exhaustive-deps

  const posun = (dir) => {
    const d = new Date(refDate);
    if (mode === 'den') d.setDate(d.getDate() + dir);
    if (mode === 'tyzden') d.setDate(d.getDate() + dir * 7);
    if (mode === 'mesiac') d.setMonth(d.getMonth() + dir);
    if (mode === 'rok') d.setFullYear(d.getFullYear() + dir);
    setRefDate(d);
  };

  const odhlasit = () => { if (demo) { window.location.hash = '#prehlady'; window.location.reload(); return; } sb.auth.signOut(); };

  // ── Agregácie ──────────────────────────────────────────────────────────────
  const agg = useMemo(() => {
    if (!data) return null;
    // Uzávierky: posledný záznam pre (branch, day, kasa) vyhráva (opravné odoslania)
    const uzMap = {};
    data.uzavierky.forEach(u => {
      const k = `${u.branch}|${u.day}|${u.kasa || u.data?.kasa || ''}`;
      if (!uzMap[k] || String(u.created_at || '') >= String(uzMap[k].created_at || '')) uzMap[k] = u;
    });
    const uzRows = Object.values(uzMap)
      .map(u => ({ day: u.day, branch: u.branch, author: u.data?.author || u.meno || '', kasaTyp: u.kasa || u.data?.kasa || '', ...normUzav(u.data) }))
      .sort((a, b) => a.day < b.day ? -1 : 1);

    let trzby = 0, karty = 0, qerko = 0, gastro = 0, hotovost = 0;
    const poDni = {};
    uzRows.forEach(u => {
      trzby += u.obrat; karty += u.karta; qerko += u.qerko + u.qerkoTr; gastro += u.gastro;
      hotovost += hotovostZ(u);
      poDni[u.day] = (poDni[u.day] || 0) + u.obrat;
    });
    // Stav kasy = posledný známy zostatok každej pobočky v období
    const kasaPos = {};
    uzRows.forEach(u => { if (u.kasa !== null) kasaPos[u.branch] = { den: u.day, kasa: u.kasa }; });
    const kasaSpolu = Object.values(kasaPos).reduce((s, x) => s + x.kasa, 0);
    // Upozornenia na kasu (prahy prevzaté z OBRATOVEJ TABUĽKY)
    const upozornenia = [];
    Object.entries(kasaPos).forEach(([b, x]) => {
      if (x.kasa > 1000) upozornenia.push({ typ: 'warn', text: `${b}: vysoký stav hotovosti v kase (${fmtEur(x.kasa, 2)}) — odporúča sa odvod.` });
      else if (x.kasa < 0) upozornenia.push({ typ: 'err', text: `${b}: záporný stav kasy (${fmtEur(x.kasa, 2)}) — skontrolujte uzávierky!` });
    });

    // Úlohy / odpisy / HACCP
    const total = data.tasks.length;
    const done = data.tasks.filter(t => t.done).length;
    const pct = total ? Math.round(done / total * 100) : null;
    const katMap = {};
    data.tasks.forEach(t => {
      katMap[t.category] = katMap[t.category] || { done: 0, total: 0 };
      katMap[t.category].total++; if (t.done) katMap[t.category].done++;
    });
    const odpMap = {};
    data.odpisy.forEach(o => {
      const k = `${o.item}|${o.unit || ''}`;
      odpMap[k] = odpMap[k] || { item: o.item, unit: o.unit || '', qty: 0 };
      odpMap[k].qty += parseFloat(o.qty) || 0;
    });
    const topOdpisy = Object.values(odpMap).sort((a, b) => b.qty - a.qty).slice(0, 7);
    const prekrocenia = data.haccp.filter(h => h.exceeded);

    // Detail: konkrétne nesplnené / problémové úlohy (najnovšie hore)
    const problemove = data.tasks.filter(t => !t.done || t.issue)
      .map(t => ({ day: t.day, branch: t.branch, category: t.category, task: t.task || '(bez názvu)', issue: t.issue || null, by: t.done_by || null }))
      .sort((a, b) => a.day < b.day ? 1 : -1);
    // Opakovaný nahlásený problém: tá istá úloha s problémom viackrát v období
    const issMap = {};
    data.tasks.filter(t => t.issue).forEach(t => {
      const k = t.task || '(bez názvu)';
      issMap[k] = issMap[k] || { task: k, count: 0, dni: [] };
      issMap[k].count++; issMap[k].dni.push(t.day);
    });
    const opakProblemy = Object.values(issMap).filter(x => x.count >= 3).sort((a, b) => b.count - a.count);
    // Opakované HACCP prekročenie: to isté zariadenie prekročilo limit viackrát
    const devMap = {};
    prekrocenia.forEach(h => { const k = h.device || '(zariadenie)'; devMap[k] = (devMap[k] || 0) + 1; });
    const opakHaccp = Object.entries(devMap).filter(([, n]) => n >= 3).map(([device, n]) => ({ device, n })).sort((a, b) => b.n - a.n);
    // Doplň inteligentné upozornenia (nad rámec stavu kasy)
    opakProblemy.slice(0, 5).forEach(p => upozornenia.push({ typ: 'warn', text: `Opakovaný problém: „${p.task}" nahlásené ${p.count}× v období — vyžaduje pozornosť.` }));
    opakHaccp.slice(0, 5).forEach(h => upozornenia.push({ typ: 'err', text: `${h.device}: prekročený teplotný limit ${h.n}× — skontrolujte chladenie/zariadenie.` }));

    return { uzRows, trzby, karty, qerko, gastro, hotovost, poDni, kasaPos, kasaSpolu, upozornenia,
             total, done, pct, katMap, topOdpisy, odpisovSpolu: data.odpisy.length, prekrocenia,
             problemove, opakProblemy, opakHaccp };
  }, [data]);

  const viacPobociek = (pobocky || []).length > 1;
  const kartyPct = agg && agg.trzby > 0 ? Math.round(agg.karty / agg.trzby * 100) : 0;
  const qerkoPct = agg && agg.trzby > 0 ? Math.round(agg.qerko / agg.trzby * 100) : 0;
  const hasErr = !!agg && agg.upozornenia.some(u => u.typ === 'err');
  const hasKasa = !!agg && (agg.kasaSpolu !== 0 || Object.keys(agg.kasaPos).length > 0);
  const pctCol = (!agg || agg.pct == null) ? C.gold : agg.pct >= 90 ? C.ok : agg.pct >= 70 ? C.gold : C.err;

  // História — stránkovanie
  const HIST_NA_STRANU = 15;
  const histRows = useMemo(() => agg ? [...agg.uzRows].sort((a, b) => a.day < b.day ? 1 : -1) : [], [agg]);
  const histStran = Math.max(1, Math.ceil(histRows.length / HIST_NA_STRANU));
  const histPage = histRows.slice((histStrana - 1) * HIST_NA_STRANU, histStrana * HIST_NA_STRANU);

  const del = (i) => (0.05 + i * 0.045).toFixed(2) + 's';
  const gridKPI = { display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', marginBottom: 16 };
  const thC = { padding: '10px', fontWeight: 700, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: .8, color: C.muted, whiteSpace: 'nowrap' };
  const tdC = { padding: '9px 10px', whiteSpace: 'nowrap' };

  // ── CSV exporty (Sheet-ekvivalent tabuľky — pre hygienu a pod.) ────────────
  // Exportuje VŠETKY riadky za zvolené obdobie/pobočku (nie len stránku).
  const csvName = (typ) => {
    const b = vybrana === '*' ? 'vsetky' : vybrana.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '_');
    return `${typ}_${b}_${od}_${doD}.csv`;
  };
  const exportUzavierky = () => {
    const H = ['Dátum', 'Pobočka', 'Kasa', 'Vykonal',
      'A · Zostatok predch.', 'Malo zostať', 'Rozdiel A', 'Prvotné prerátanie A', 'Prvotný rozdiel', 'Nesedelo prvotne?',
      'B · Tržba', 'C · Karty', 'D · Qerko', 'E · Qerko tringelt', 'Stravná karta', 'F · Gastro lístky', 'G · Nákup', 'Nákup – obsah',
      'H · Mám mať v kase', 'I · Reálne v kase', 'J · Tringelt/Manko', 'K · Odvod', 'L · Zaokrúhlenie', 'M · Kasa večer'];
    const rows = agg.uzRows.map(u => [
      csvDate(u.day), u.branch, u.kasaTyp || '', u.author || '',
      csvNum(u.a), csvNum(u.maloByt), csvNum(u.rozdielA), csvNum(u.firstA), csvNum(u.firstRozdiel), u.nesedelo || '',
      csvNum(u.obrat), csvNum(u.karta), csvNum(u.qerko), csvNum(u.qerkoTr), csvNum(u.stravna), csvNum(u.gastro), csvNum(u.nakupy), u.gNote || '',
      csvNum(u.hMam), csvNum(u.iReal), csvNum(u.jManko), csvNum(u.odvod), csvNum(u.zaokruhly), csvNum(u.kasa),
    ]);
    downloadCSV(csvName('uzavierky'), [H, ...rows]);
  };
  const exportTeploty = () => {
    const H = ['Dátum', 'Pobočka', 'Kontrolór', 'Zmena', 'Zariadenie', 'Hodnota (°C)', 'Max limit', 'Status'];
    const rows = [...data.haccp].sort((a, b) => a.day < b.day ? -1 : 1).map(h => [
      csvDate(h.day), h.branch, h.inspector || '', h.shift || '', h.device || '',
      csvNum(h.value), h.max_limit || '', h.exceeded ? 'PREKROČENÉ' : 'OK',
    ]);
    downloadCSV(csvName('teploty_haccp'), [H, ...rows]);
  };
  const exportOdpisy = () => {
    const H = ['Dátum', 'Pobočka', 'Zodpovedný', 'Produkt', 'Množstvo', 'Jednotka', 'Dôvod', 'Odkaz kolegovi'];
    const rows = [...data.odpisy].sort((a, b) => a.day < b.day ? -1 : 1).map(o => [
      csvDate(o.day), o.branch, o.author || '', o.item || '', csvNum(o.qty), o.unit || '', o.reason || '', o.day_note || '',
    ]);
    downloadCSV(csvName('odpisy'), [H, ...rows]);
  };
  const exportUlohy = () => {
    const H = ['Dátum', 'Pobočka', 'Kategória', 'Kontrolór', 'Úloha', 'Splnená', 'Čas', 'Problém'];
    const rows = [...data.tasks].sort((a, b) => a.day < b.day ? -1 : 1).map(t => [
      csvDate(t.day), t.branch, t.category || '', t.inspector || '', t.task || '',
      t.done ? 'ÁNO' : 'NIE', t.done_time || '', t.issue || '',
    ]);
    downloadCSV(csvName('ulohy'), [H, ...rows]);
  };
  const csvBtn = (onClick, label = 'CSV') => (
    <button className="fx-chip" onClick={onClick}
      style={{ ...chipStyle(false), display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>⬇ {label}</button>
  );

  // ── znovupoužiteľné bloky (volajú sa iba keď agg existuje) ────────────────
  const upoz = () => agg.upozornenia.length ? (
    <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8, animation: animate ? 'fxUp .5s .15s backwards' : 'none' }}>
      {agg.upozornenia.map((u, i) => {
        const err = u.typ === 'err';
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14,
            fontSize: 13.5, fontWeight: 500, background: err ? 'rgba(208,48,48,.09)' : 'rgba(184,112,32,.1)',
            border: `1px solid ${err ? 'rgba(208,48,48,.3)' : 'rgba(184,112,32,.35)'}`, color: err ? '#a02020' : '#7a4a12' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, background: err ? C.err : C.goldLight,
              animation: animate ? 'fxDot 2s infinite' : 'none' }} />{u.text}
          </div>
        );
      })}
    </div>
  ) : null;

  const grafTrzieb = (delay = 0.18) => (
    <Panel delay={delay} dur=".55s" title={mode === 'rok' ? `Mesačné tržby — ${rozsahLabel(mode, refDate)}` : `Vývoj tržieb — ${rozsahLabel(mode, refDate)}`} style={{ minWidth: 0 }}>
      {Object.keys(agg.poDni).length === 0
        ? <div style={{ color: C.muted, fontSize: 13, padding: '30px 0' }}>V tomto období nie sú žiadne uzávierky.</div>
        : <TrzbyChart agg={agg} mode={mode} vybrana={vybrana} pobocky={pobocky} animate={animate} />}
    </Panel>
  );

  const donutKarta = (delay = 0.25) => (
    <Panel delay={delay} dur=".55s" title="Podiely platieb" style={{ minWidth: 0 }}>
      {agg.trzby > 0 ? <DonutPodiely agg={agg} animate={animate} /> : <div style={{ color: C.muted, fontSize: 13 }}>Bez tržieb v období.</div>}
    </Panel>
  );

  const ulohyBary = () => (
    <Panel delay={0.18} style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.sub, letterSpacing: 1, textTransform: 'uppercase' }}>Úlohy podľa zmeny</span>
        <span style={{ flex: 1 }} />
        {data.tasks.length > 0 && csvBtn(exportUlohy, 'CSV (všetky úlohy)')}
      </div>
      {Object.keys(agg.katMap).length === 0
        ? <div style={{ color: C.muted, fontSize: 13 }}>Žiadne úlohy v období.</div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {Object.entries(agg.katMap).map(([kat, v], i) => {
              const w = v.total ? Math.round(v.done / v.total * 100) : 0;
              const on = filterKat === kat;
              return (
                <div key={kat} className="fx-katrow" onClick={() => setFilterKat(on ? null : kat)}
                  style={{ cursor: 'pointer', padding: '5px 7px', margin: '-5px -7px', borderRadius: 10,
                    background: on ? 'rgba(184,112,32,.07)' : 'transparent' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, color: C.sub, textTransform: 'capitalize' }}>{kat}{on ? '  ·  filter ✕' : ''}</span>
                    <span style={{ color: C.muted, fontVariantNumeric: 'tabular-nums' }}>{fmtNum(v.done)} / {fmtNum(v.total)} splnených</span>
                  </div>
                  <div style={{ height: 10, background: 'rgba(150,120,80,.14)', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 6, background: 'linear-gradient(90deg,#2a9a55,#48b370)',
                      width: w + '%', transformOrigin: 'left', animation: animate ? `fxWide 1s ${(0.2 + i * 0.15).toFixed(2)}s cubic-bezier(.2,.8,.2,1) both` : 'none', transition: 'width .8s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      <div style={{ fontSize: 11, color: C.muted, marginTop: 12 }}>💡 klikni na zmenu pre filter detailu nižšie</div>
    </Panel>
  );

  const detailUloh = () => {
    const list = agg.problemove.filter(p => !filterKat || p.category === filterKat);
    return (
      <Panel delay={0.26}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.sub, letterSpacing: 1, textTransform: 'uppercase' }}>Nesplnené a problémové úlohy</span>
          {filterKat && (
            <span onClick={() => setFilterKat(null)} style={{ cursor: 'pointer', fontSize: 11.5, fontWeight: 700, color: C.gold,
              background: C.goldDim, border: `1px solid ${C.goldLine}`, borderRadius: 20, padding: '3px 10px' }}>filter: {filterKat} ✕</span>
          )}
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: C.muted }}>{fmtNum(list.length)} položiek</span>
        </div>
        {list.length === 0 ? (
          <div style={{ color: C.ok, fontSize: 14, fontWeight: 700 }}>✓ Všetky úlohy v období boli splnené bez nahláseného problému.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr>
                <th style={{ ...thC, textAlign: 'left' }}>Deň</th>
                {vybrana === '*' && <th style={{ ...thC, textAlign: 'left' }}>Pobočka</th>}
                <th style={{ ...thC, textAlign: 'left' }}>Zmena</th>
                <th style={{ ...thC, textAlign: 'left' }}>Úloha</th>
                <th style={{ ...thC, textAlign: 'left' }}>Kto</th>
                <th style={{ ...thC, textAlign: 'left' }}>Stav / problém</th>
              </tr></thead>
              <tbody>
                {list.slice(0, 60).map((p, i) => (
                  <tr key={i} className="fx-hrow" style={{ borderTop: '1px solid rgba(150,120,80,.12)', animation: animate ? `fxUp .4s ${del(i)} backwards` : 'none' }}>
                    <td style={{ ...tdC, fontVariantNumeric: 'tabular-nums' }}>{dayLabel(p.day)}</td>
                    {vybrana === '*' && <td style={{ ...tdC, color: C.sub }}>{p.branch}</td>}
                    <td style={{ ...tdC, color: C.muted, textTransform: 'capitalize' }}>{p.category}</td>
                    <td style={{ padding: '9px 10px', fontWeight: 600 }}>{p.task}</td>
                    <td style={{ ...tdC, color: C.sub }}>{p.by || '—'}</td>
                    <td style={{ padding: '9px 10px', fontWeight: 600, color: p.issue ? C.err : C.muted }}>{p.issue ? `⚠ ${p.issue}` : '✗ nesplnené'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.length > 60 && <div style={{ fontSize: 12, color: C.muted, marginTop: 8, textAlign: 'right' }}>… a ďalších {fmtNum(list.length - 60)} — zúž obdobie alebo pobočku</div>}
          </div>
        )}
      </Panel>
    );
  };

  const historiaKarta = () => {
    const eur = (v) => v == null ? '—' : fmtEur(v, 2);
    return (
    <Panel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.sub, letterSpacing: 1, textTransform: 'uppercase' }}>História uzávierok — {rozsahLabel(mode, refDate)}</span>
        <span style={{ flex: 1 }} />
        {histRows.length > 0 && csvBtn(exportUzavierky)}
      </div>
      {histRows.length === 0 ? (
        <div style={{ color: C.muted, fontSize: 13 }}>Žiadne uzávierky v období.</div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
              <thead><tr>
                <th style={{ ...thC, textAlign: 'left' }}>Dátum</th>
                <th style={{ ...thC, textAlign: 'left' }}>Deň</th>
                {vybrana === '*' && <th style={{ ...thC, textAlign: 'left' }}>Pobočka</th>}
                <th style={{ ...thC, textAlign: 'right' }}>A · Zost.</th>
                <th style={{ ...thC, textAlign: 'right' }}>B · Tržba</th>
                <th style={{ ...thC, textAlign: 'right' }}>C · Karty</th>
                <th style={{ ...thC, textAlign: 'right' }}>D · Qerko</th>
                <th style={{ ...thC, textAlign: 'right' }}>E · Tringelt</th>
                <th style={{ ...thC, textAlign: 'right' }}>F · Gastro</th>
                <th style={{ ...thC, textAlign: 'right' }}>G · Nákup</th>
                <th style={{ ...thC, textAlign: 'right' }}>H · Mám mať</th>
                <th style={{ ...thC, textAlign: 'right' }}>I · Reálne</th>
                <th style={{ ...thC, textAlign: 'right' }}>J · Tr./Manko</th>
                <th style={{ ...thC, textAlign: 'right' }}>K · Odvod</th>
                <th style={{ ...thC, textAlign: 'right' }}>L · Zaokr.</th>
                <th style={{ ...thC, textAlign: 'right' }}>M · Kasa večer</th>
              </tr></thead>
              <tbody>
                {histPage.map((u, i) => {
                  const kasaBad = u.kasa !== null && (u.kasa < 0 || u.kasa > 1000);
                  const jCol = u.jManko == null ? C.text : u.jManko < 0 ? C.err : C.ok;
                  return (
                    <tr key={u.branch + u.day + i} className="fx-hrow" style={{ borderTop: '1px solid rgba(150,120,80,.12)', animation: animate ? `fxUp .4s ${del(i)} backwards` : 'none' }}>
                      <td style={{ ...tdC, fontWeight: 700 }}>{dayLabel(u.day)} <span style={{ color: C.muted, fontWeight: 400 }}>{u.day.slice(0, 4)}</span></td>
                      <td style={{ ...tdC, color: C.sub }}>{dayName(u.day)}</td>
                      {vybrana === '*' && <td style={{ ...tdC, color: C.sub }}>{u.branch}</td>}
                      <td style={{ ...tdC, textAlign: 'right', color: C.muted }}>{eur(u.a)}</td>
                      <td style={{ ...tdC, textAlign: 'right', fontWeight: 700, color: C.gold }}>{fmtEur(u.obrat, 2)}</td>
                      <td style={{ ...tdC, textAlign: 'right' }}>{fmtEur(u.karta, 2)}</td>
                      <td style={{ ...tdC, textAlign: 'right' }}>{fmtEur(u.qerko, 2)}</td>
                      <td style={{ ...tdC, textAlign: 'right' }}>{fmtEur(u.qerkoTr, 2)}</td>
                      <td style={{ ...tdC, textAlign: 'right' }}>{fmtEur(u.gastro, 2)}</td>
                      <td style={{ ...tdC, textAlign: 'right', color: C.sub }}>{fmtEur(u.nakupy, 2)}</td>
                      <td style={{ ...tdC, textAlign: 'right', color: C.muted }}>{eur(u.hMam)}</td>
                      <td style={{ ...tdC, textAlign: 'right', color: C.muted }}>{eur(u.iReal)}</td>
                      <td style={{ ...tdC, textAlign: 'right', fontWeight: 700, color: jCol }}>{eur(u.jManko)}</td>
                      <td style={{ ...tdC, textAlign: 'right' }}>{fmtEur(u.odvod, 2)}</td>
                      <td style={{ ...tdC, textAlign: 'right' }}>{fmtEur(u.zaokruhly, 2)}</td>
                      <td style={{ ...tdC, textAlign: 'right', fontWeight: 700, color: kasaBad ? C.err : C.text }}>{u.kasa === null ? '—' : fmtEur(u.kasa, 2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: C.muted, maxWidth: 620 }}>A · H · I · J sú detail z appky (živé dni od prechodu na Supabase); staršie dni z importu ich nemajú („—"). CSV export obsahuje všetkých 23 stĺpcov ako hárok.</span>
            {histStran > 1 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: C.sub }}>
                <span>strana {histStrana} / {histStran} · {fmtNum(histRows.length)} dní</span>
                <button className="fx-chip" onClick={() => setHistStrana(s => Math.max(1, s - 1))} style={chipStyle(false)}>‹</button>
                <button className="fx-chip" onClick={() => setHistStrana(s => Math.min(histStran, s + 1))} style={chipStyle(false)}>›</button>
              </div>
            ) : (
              <span style={{ fontSize: 11.5, color: C.muted }}>{fmtNum(histRows.length)} uzávierok v období</span>
            )}
          </div>
        </>
      )}
    </Panel>
    );
  };

  const odpisyKarta = () => {
    const maxOdp = Math.max(...agg.topOdpisy.map(o => o.qty), 1);
    return (
      <Panel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.sub, letterSpacing: 1, textTransform: 'uppercase' }}>Najodpisovanejšie položky — {rozsahLabel(mode, refDate)}</span>
          <span style={{ flex: 1 }} />
          {data.odpisy.length > 0 && csvBtn(exportOdpisy)}
        </div>
        {agg.topOdpisy.length === 0 ? (
          <div style={{ color: C.muted, fontSize: 13 }}>Žiadne odpisy v období.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {agg.topOdpisy.map((o, i) => {
              const w = Math.round(o.qty / maxOdp * 100);
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px,190px) 1fr 78px', alignItems: 'center', gap: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.item}</div>
                  <div style={{ height: 14, background: 'rgba(150,120,80,.12)', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 8, background: 'linear-gradient(90deg,#d03030,#e06a50)',
                      width: w + '%', transformOrigin: 'left', animation: animate ? `fxWide .9s ${del(i)} cubic-bezier(.2,.8,.2,1) both` : 'none', transition: 'width .8s' }} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.err, textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{(Math.round(o.qty * 10) / 10).toLocaleString('sk-SK')} {o.unit}</div>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ fontSize: 11.5, color: C.muted, marginTop: 16 }}>{fmtNum(agg.odpisovSpolu)} záznamov odpisov v období</div>
      </Panel>
    );
  };

  const haccpKarta = () => (
    <Panel delay={0.12}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.sub, letterSpacing: 1, textTransform: 'uppercase' }}>HACCP teploty</span>
        {data.haccp.length > 0 && <span style={{ fontSize: 11, color: C.muted }}>{fmtNum(data.haccp.length)} meraní · {fmtNum(agg.prekrocenia.length)} prekročení</span>}
        <span style={{ flex: 1 }} />
        {data.haccp.length > 0 && csvBtn(exportTeploty, 'CSV (všetky merania)')}
      </div>
      {agg.prekrocenia.length === 0 ? (
        <div style={{ color: C.ok, fontSize: 14, fontWeight: 700, padding: '8px 0' }}>✓ Žiadne prekročenia teplotných limitov v období.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>
              <th style={{ ...thC, textAlign: 'left' }}>Deň</th>
              {vybrana === '*' && <th style={{ ...thC, textAlign: 'left' }}>Pobočka</th>}
              <th style={{ ...thC, textAlign: 'left' }}>Zariadenie</th>
              <th style={{ ...thC, textAlign: 'left' }}>Hodnota</th>
              <th style={{ ...thC, textAlign: 'left' }}>Limit</th>
            </tr></thead>
            <tbody>
              {agg.prekrocenia.slice(-40).reverse().map((h, i) => (
                <tr key={i} className="fx-hrow" style={{ borderTop: '1px solid rgba(150,120,80,.12)', animation: animate ? `fxUp .4s ${del(i)} backwards` : 'none' }}>
                  <td style={{ ...tdC, fontVariantNumeric: 'tabular-nums' }}>{dayLabel(h.day)}</td>
                  {vybrana === '*' && <td style={{ ...tdC, color: C.sub }}>{h.branch}</td>}
                  <td style={{ padding: '9px 10px', fontWeight: 600 }}>{h.device}</td>
                  <td style={{ ...tdC, color: C.err, fontWeight: 700 }}>{h.value} °C</td>
                  <td style={{ ...tdC, color: C.muted }}>{h.max_limit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );

  const infoLenTrzby = () => (
    <Panel><div style={{ fontSize: 13, color: C.muted }}>
      ℹ️ Ročný pohľad všetkých pobočiek zobrazuje len tržby. Pre túto sekciu vyber konkrétnu pobočku alebo kratšie obdobie (mesiac/týždeň).
    </div></Panel>
  );

  const PUBLIC = process.env.PUBLIC_URL;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: FONT, color: C.text }}>
      <div className="pr-layout">
        {/* ── Ambient pozadie (klipované do viewportu, mimo toku) ── */}
        <div aria-hidden style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: -180, right: -120, width: 560, height: 560, borderRadius: '50%',
            background: 'radial-gradient(circle,rgba(184,112,32,.14),transparent 65%)', animation: animate ? 'fxFloat 14s ease-in-out infinite' : 'none' }} />
          <div style={{ position: 'absolute', bottom: -220, left: 200, width: 640, height: 640, borderRadius: '50%',
            background: 'radial-gradient(circle,rgba(124,92,196,.08),transparent 65%)', animation: animate ? 'fxFloat 19s ease-in-out infinite reverse' : 'none' }} />
        </div>

        {/* ── SIDEBAR ── */}
        <aside className="pr-side">
          <div style={{ padding: '20px 16px 16px', borderBottom: `1px solid ${C.creamLine}` }}>
            <div style={{ background: C.cream, borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'center' }}>
              <img src={`${PUBLIC}/foxford-logo.png.png`} alt="Foxford" style={{ width: '100%', maxWidth: 150, display: 'block' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, padding: '0 4px' }}>
              <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: .2 }}>Prehľady</div>
              {demo && <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.2, color: C.dark2, background: C.goldLight, borderRadius: 20, padding: '3px 8px' }}>UKÁŽKA</div>}
            </div>
            <div style={{ fontSize: 11, color: C.creamMuted, padding: '2px 4px 0' }}>manažérsky prístup</div>
          </div>
          <nav className="pr-menu">
            {SEKCIE.map(s => {
              const on = sekcia === s.id;
              return (
                <button key={s.id} className="fx-mbtn" onClick={() => setSekcia(s.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: 'none', borderRadius: 12,
                    fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', width: '100%',
                    background: on ? 'linear-gradient(135deg,#d9a03f,#b87020)' : 'transparent', color: on ? C.dark2 : C.creamText,
                    boxShadow: on ? '0 6px 18px rgba(184,112,32,.35)' : 'none' }}>
                  <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{s.ikona}</span>{s.label}
                </button>
              );
            })}
          </nav>
          <div style={{ padding: 14, borderTop: `1px solid ${C.creamLine}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, color: C.creamMuted, padding: '0 4px', wordBreak: 'break-all' }}>{email}</div>
            <button className="fx-ghost" onClick={() => setZmenaHesla(true)}
              style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(236,229,211,.18)', background: 'transparent',
                color: 'rgba(236,229,211,.75)', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Zmeniť heslo</button>
            <button className="fx-ghost" onClick={odhlasit}
              style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(240,110,90,.35)', background: 'transparent',
                color: '#f0876e', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Odhlásiť</button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="pr-main">
          {/* Top bar: pobočka + obdobie */}
          <div className="pr-top">
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
              {viacPobociek ? (
                <>
                  <button className="fx-chip" style={chipStyle(vybrana === '*')} onClick={() => setVybrana('*')}>Všetky</button>
                  {(pobocky || []).map(p => (
                    <button key={p} className="fx-chip" style={chipStyle(vybrana === p)} onClick={() => setVybrana(p)}>{p}</button>
                  ))}
                </>
              ) : (pobocky && pobocky[0] && (
                <div style={{ fontSize: 13, fontWeight: 700, color: C.gold, padding: '4px 2px' }}>📍 {pobocky[0]}</div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,.7)', border: '1px solid rgba(150,120,80,.2)', borderRadius: 22, padding: 3, gap: 2 }}>
                {MODY.map(m => {
                  const on = mode === m.id;
                  return (
                    <button key={m.id} className="fx-chip" onClick={() => { setMode(m.id); setRefDate(new Date()); }}
                      style={{ padding: '7px 16px', borderRadius: 18, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                        border: 'none', fontFamily: 'inherit', background: on ? C.text : 'transparent', color: on ? C.cream : C.sub }}>{m.label}</button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,.7)', border: '1px solid rgba(150,120,80,.2)', borderRadius: 22, padding: '3px 8px' }}>
                <button className="fx-nav" onClick={() => posun(-1)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: C.gold, padding: '2px 10px', fontFamily: 'inherit' }}>‹</button>
                <div style={{ fontSize: 13, fontWeight: 700, minWidth: 150, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{rozsahLabel(mode, refDate)}</div>
                <button className="fx-nav" onClick={() => posun(1)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: C.gold, padding: '2px 10px', fontFamily: 'inherit' }}>›</button>
              </div>
            </div>
          </div>

          <div className="pr-cont">
            {pobocky && pobocky.length === 0 && (
              <Panel><div style={{ color: C.sub, fontSize: 14 }}>Tvoj účet zatiaľ nemá priradenú žiadnu pobočku — ozvi sa administrátorovi.</div></Panel>
            )}
            {chyba && <Panel style={{ marginBottom: 14 }}><div style={{ color: C.err, fontSize: 14 }}>{chyba}</div></Panel>}
            {nacitava && pobocky && pobocky.length > 0 && (
              <div style={{ color: C.muted, fontSize: 14, padding: '50px 0', textAlign: 'center' }}>Načítavam dáta…</div>
            )}

            {!nacitava && agg && (
              <>
                {/* ═══ PREHĽAD (overview) ═══ */}
                {sekcia === 'prehlad' && (
                  <>
                    <div style={gridKPI}>
                      <KPI label="Tržby" color={C.gold} delay={0} note={rozsahLabel(mode, refDate)}
                        value={<Num value={agg.trzby} animate={animate} format={n => fmtEur(Math.round(n))} />} />
                      <KPI label="Platobné karty" color={C.gold} delay={0.07} note={`${kartyPct} % z tržieb`}
                        value={<Num value={agg.karty} animate={animate} format={n => fmtEur(Math.round(n))} />} />
                      <KPI label="Qerko" color={C.fialova} delay={0.14} note={`${qerkoPct} % z obratu`}
                        value={<Num value={agg.qerko} animate={animate} format={n => fmtEur(Math.round(n))} />} />
                      <KPI label="Hotovosť v kase" color={hasErr ? C.err : C.text} delay={0.21} note={vybrana === '*' ? 'súčet pobočiek' : 'zostatok večer'}
                        value={hasKasa ? <Num value={agg.kasaSpolu} animate={animate} format={n => fmtEur(n, 2)} /> : '—'} />
                    </div>
                    {upoz()}
                    <div className="pr-charts">
                      {grafTrzieb()}
                      {donutKarta()}
                    </div>
                    {!lenTrzby ? (
                      <div style={gridKPI}>
                        <KPI size={27} label="Splnenosť úloh" color={pctCol} delay={0.30}
                          value={agg.pct === null ? '—' : <Num value={agg.pct} animate={animate} format={n => Math.round(n) + ' %'} />}>
                          {agg.pct !== null && <ProgressBar pct={agg.pct} color={pctCol} delay=".5s" animate={animate} />}
                        </KPI>
                        <KPI size={27} label="Odpisov" color={C.gold} delay={0.37} note="záznamov v období"
                          value={<Num value={agg.odpisovSpolu} animate={animate} format={n => fmtNum(Math.round(n))} />} />
                        <KPI size={27} label="HACCP prekročenia" color={agg.prekrocenia.length ? C.err : C.ok} delay={0.44} note="teplotných limitov"
                          value={<Num value={agg.prekrocenia.length} animate={animate} format={n => fmtNum(Math.round(n))} />} />
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: C.muted }}>ℹ️ Ročný pohľad všetkých pobočiek zobrazuje len tržby — pre úlohy/odpisy/teploty vyber pobočku alebo kratšie obdobie.</div>
                    )}
                  </>
                )}

                {/* ═══ UZÁVIERKY ═══ */}
                {sekcia === 'uzavierky' && historiaKarta()}

                {/* ═══ ÚLOHY ═══ */}
                {sekcia === 'ulohy' && (lenTrzby ? infoLenTrzby() : (
                  <>
                    <div style={gridKPI}>
                      <KPI label="Splnenosť úloh" color={pctCol} delay={0} note={agg.total ? `${agg.done} z ${agg.total}` : ''}
                        value={agg.pct === null ? '—' : <Num value={agg.pct} animate={animate} format={n => Math.round(n) + ' %'} />} />
                      <KPI label="Úloh spolu" color={C.gold} delay={0.07}
                        value={<Num value={agg.total} animate={animate} format={n => fmtNum(Math.round(n))} />} />
                      <KPI label="Problémových" color={agg.problemove.length ? C.err : C.ok} delay={0.14}
                        value={<Num value={agg.problemove.length} animate={animate} format={n => fmtNum(Math.round(n))} />} />
                    </div>
                    {upoz()}
                    {ulohyBary()}
                    {detailUloh()}
                  </>
                ))}

                {/* ═══ ODPISY ═══ */}
                {sekcia === 'odpisy' && (lenTrzby ? infoLenTrzby() : (
                  <>
                    <div style={gridKPI}>
                      <KPI label="Odpisov spolu" color={C.gold} delay={0} note={rozsahLabel(mode, refDate)}
                        value={<Num value={agg.odpisovSpolu} animate={animate} format={n => fmtNum(Math.round(n))} />} />
                      <KPI label="Rôznych položiek" color={C.gold} delay={0.07}
                        value={<Num value={new Set(data.odpisy.map(o => o.item)).size} animate={animate} format={n => fmtNum(Math.round(n))} />} />
                    </div>
                    {odpisyKarta()}
                  </>
                ))}

                {/* ═══ TEPLOTY (HACCP) ═══ */}
                {sekcia === 'teploty' && (lenTrzby ? infoLenTrzby() : (
                  <>
                    <div style={gridKPI}>
                      <KPI label="Prekročení limitu" color={agg.prekrocenia.length ? C.err : C.ok} delay={0} note={rozsahLabel(mode, refDate)}
                        value={<Num value={agg.prekrocenia.length} animate={animate} format={n => fmtNum(Math.round(n))} />} />
                      <KPI label="Meraní spolu" color={C.gold} delay={0.07}
                        value={<Num value={data.haccp.length} animate={animate} format={n => fmtNum(Math.round(n))} />} />
                    </div>
                    {upoz()}
                    {haccpKarta()}
                  </>
                ))}
              </>
            )}
          </div>
        </main>
      </div>

      {zmenaHesla && <ZmenaHesla onClose={() => setZmenaHesla(false)} />}
    </div>
  );
}

// ── Zmena hesla ──────────────────────────────────────────────────────────────
function ZmenaHesla({ onClose }) {
  const [h1, setH1] = useState('');
  const [h2, setH2] = useState('');
  const [stav, setStav] = useState('');
  const [busy, setBusy] = useState(false);

  const uloz = async () => {
    if (h1.length < 8) { setStav('Heslo musí mať aspoň 8 znakov.'); return; }
    if (h1 !== h2) { setStav('Heslá sa nezhodujú.'); return; }
    setBusy(true);
    const { error } = await sb.auth.updateUser({ password: h1 });
    setBusy(false);
    if (error) { setStav('Zmena zlyhala: ' + error.message); return; }
    setStav('OK');
    setTimeout(onClose, 1200);
  };

  const inp = { width: '100%', boxSizing: 'border-box', padding: '12px 13px', borderRadius: 12,
                border: `1px solid ${C.borderM}`, fontSize: 14, outline: 'none', fontFamily: 'inherit' };
  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(30,22,8,.55)', fontFamily: FONT,
         backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
      <div onMouseDown={e => e.stopPropagation()} style={{ background: '#fff', border: `1px solid ${C.borderM}`,
           width: '100%', maxWidth: 360, borderRadius: 22, padding: '26px 22px' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16, textAlign: 'center' }}>Zmena hesla</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input style={inp} type="password" placeholder="Nové heslo (min. 8 znakov)" value={h1} onChange={e => setH1(e.target.value)} autoComplete="new-password" />
          <input style={inp} type="password" placeholder="Nové heslo znova" value={h2} onChange={e => setH2(e.target.value)} autoComplete="new-password" />
        </div>
        {stav && <div style={{ marginTop: 12, fontSize: 13, textAlign: 'center',
                               color: stav === 'OK' ? C.ok : C.err }}>{stav === 'OK' ? '✓ Heslo zmenené' : stav}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 13, border: `1px solid ${C.border}`,
                   background: 'transparent', color: C.sub, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Zrušiť</button>
          <button onClick={uloz} disabled={busy} style={{ flex: 1, padding: 12, borderRadius: 13, border: 'none',
                   background: C.gold, color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: busy ? .6 : 1 }}>Uložiť</button>
        </div>
      </div>
    </div>
  );
}
