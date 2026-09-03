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
// ═══════════════════════════════════════════════════════════════════════════
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Chart, LineController, LineElement, PointElement, BarController, BarElement,
  DoughnutController, ArcElement, CategoryScale, LinearScale,
  Tooltip, Legend, Filler,
} from 'chart.js';

Chart.register(LineController, LineElement, PointElement, BarController, BarElement,
  DoughnutController, ArcElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

// Farby zámerne kopírujú paletu C z App.js (bez importu — nech manažérsky modul
// nespúšťa modulový kód prevádzkovej appky)
const C = {
  bg: '#e8e0d0', panel: 'rgba(255,255,255,0.80)', panelFull: '#ffffff',
  border: 'rgba(150,120,80,0.18)', borderM: 'rgba(150,120,80,0.35)',
  gold: '#b87020', goldDim: 'rgba(184,112,32,0.12)', goldLine: 'rgba(184,112,32,0.45)',
  text: '#1e1608', sub: '#6b5d4f', muted: '#a09080',
  ok: '#2a9a55', okDim: 'rgba(42,154,85,0.10)', err: '#d03030', errDim: 'rgba(208,48,48,0.10)',
  fialova: '#7c5cc4', jantar: '#d9a03f',
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

// ── Normalizácia uzávierky — zjednotenie dialektu appky (A..M) a OBRATOV ─────
function normUzav(d) {
  if (!d) return null;
  const n = (v) => { const x = parseFloat(String(v ?? '').replace(',', '.')); return isNaN(x) ? 0 : x; };
  const ma = (v) => v !== undefined && v !== null && v !== '';
  if (ma(d.obrat) || d.zdroj === 'obraty-import') {
    // dialekt OBRATOVEJ TABUĽKY (importovaná história) + demo dáta
    return { obrat: n(d.obrat), karta: n(d.karta), qerko: n(d.qerko), qerkoTr: n(d.qerko_tringelty),
             gastro: n(d.gastro_listky), zaokruhly: n(d.zaokruhly), odvod: n(d.odvod),
             nakupy: n(d.nakupy), kasa: ma(d.excel_drawer) ? n(d.excel_drawer) : (ma(d.kasaStav) ? n(d.kasaStav) : null) };
  }
  // dialekt appky: B Tržba · C Karta · D Qerko · E Tringelt · F Gastro lístky ·
  // G Nákup · K Odvod · L Zaokrúhlenie · M Nový zostatok (kasa večer)
  return { obrat: n(d.B), karta: n(d.C), qerko: n(d.D), qerkoTr: n(d.E), gastro: n(d.F),
           zaokruhly: n(d.L), odvod: n(d.K), nakupy: n(d.G), kasa: ma(d.M) ? n(d.M) : null };
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
          tasks.push({ day, branch: b, category: cat, task, done, issue, done_by: kdo });
        }));
        items.forEach(([item, unit]) => { if (Math.random() < 0.5) odpisy.push({ day, branch: b, item, qty: +(0.2 + Math.random() * 2.8).toFixed(1), unit, reason: 'Spotreba' }); });
        zar.forEach(([dev, maxn, base]) => {
          const val = +(base + Math.random() * 3.4 - 0.8).toFixed(1);
          haccp.push({ day, branch: b, device: dev, value: val, max_limit: `≤ ${maxn} °C`, exceeded: val > maxn });
        });
      }
    });
  });
  function i0(d) { return Math.round((Date.now() - d.getTime()) / 86400000); }
  _demoCache = { uzavierky, odpisy, tasks, haccp };
  return _demoCache;
}

// ── Spoločné UI kúsky ────────────────────────────────────────────────────────
function Karta({ title, children, style }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 18,
                  padding: '16px 18px', boxShadow: '0 2px 14px rgba(90,70,45,0.07)',
                  backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', ...style }}>
      {title && <div style={{ fontSize: 12, fontWeight: 800, color: C.sub, letterSpacing: .8,
                              textTransform: 'uppercase', marginBottom: 12 }}>{title}</div>}
      {children}
    </div>
  );
}

function Cislo({ label, value, note, tone }) {
  const col = tone === 'ok' ? C.ok : tone === 'err' ? C.err : C.gold;
  return (
    <Karta>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, letterSpacing: .6, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 27, fontWeight: 900, color: col, marginTop: 6, lineHeight: 1.1, whiteSpace: 'nowrap' }}>{value}</div>
      {note && <div style={{ fontSize: 11.5, color: C.muted, marginTop: 5 }}>{note}</div>}
    </Karta>
  );
}

function Graf({ config, height = 220 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !config) return;
    const chart = new Chart(ref.current, config);
    return () => chart.destroy();
  }, [config]);
  return <div style={{ position: 'relative', height }}><canvas ref={ref} /></div>;
}

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

  if (DEMO) return <Dashboard session={{ user: { email: 'ukážka@foxford.sk' } }} demo />;
  if (!sb) return <Sprava text="Prehľady nie sú nakonfigurované (chýbajú kľúče databázy v builde)." />;
  if (!bootDone) return <Sprava text="Načítavam…" />;
  return session ? <Dashboard session={session} /> : <Login />;
}

function Sprava({ text }) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontFamily: '-apple-system,Segoe UI,sans-serif', color: C.sub }}>
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
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', padding: 24, fontFamily: '-apple-system,Segoe UI,sans-serif' }}>
      <form onSubmit={submit} style={{ width: '100%', maxWidth: 380, background: C.panelFull,
             border: `1px solid ${C.borderM}`, borderRadius: 24, padding: '34px 28px',
             boxShadow: '0 8px 40px rgba(90,70,45,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          <img src={`${process.env.PUBLIC_URL}/foxford-logo.png.png`} alt="Foxford" style={{ height: 44 }} />
        </div>
        <div style={{ textAlign: 'center', fontSize: 19, fontWeight: 900, color: C.text, marginBottom: 2 }}>Prehľady</div>
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
                   background: C.gold, color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer',
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
  const [filterKat, setFilterKat] = useState(null);   // klik na graf úloh → filter detailu podľa kategórie

  const [od, doD] = rozsah(mode, refDate);
  // Ročný pohľad všetkých pobočiek = priveľa surových riadkov úloh/odpisov —
  // vtedy zobrazujeme len tržbovú časť (rovnako to robila OBRATOVÁ TABUĽKA)
  const lenTrzby = mode === 'rok' && vybrana === '*';

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
          lenTrzby ? [] : fetchAll(q('odpisy_log', 'day, branch, item, qty, unit, reason')),
          lenTrzby ? [] : fetchAll(q('tasks_log', 'day, branch, category, done, task, issue, done_by')),
          lenTrzby ? [] : fetchAll(q('haccp_log', 'day, branch, device, value, max_limit, exceeded')),
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
      .map(u => ({ day: u.day, branch: u.branch, ...normUzav(u.data) }))
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

  // ── Grafy ──────────────────────────────────────────────────────────────────
  const gTrzby = useMemo(() => {
    if (!agg) return null;
    let labels, hodnoty;
    if (mode === 'rok') {
      const mes = {};
      Object.entries(agg.poDni).forEach(([d, v]) => { const m = d.slice(0, 7); mes[m] = (mes[m] || 0) + v; });
      const keys = Object.keys(mes).sort();
      labels = keys.map(m => MESIACE[+m.slice(5) - 1]);
      hodnoty = keys.map(m => mes[m]);
    } else {
      const keys = Object.keys(agg.poDni).sort().filter(d => agg.poDni[d] > 0);
      labels = keys.map(dayLabel);
      hodnoty = keys.map(d => agg.poDni[d]);
    }
    return {
      type: mode === 'den' ? 'bar' : 'line',
      data: { labels, datasets: [{ label: 'Tržby (€)', data: hodnoty,
        borderColor: C.gold, backgroundColor: mode === 'den' ? 'rgba(184,112,32,0.55)' : 'rgba(184,112,32,0.14)',
        fill: true, tension: .35, pointRadius: labels.length > 40 ? 0 : 2.5, borderWidth: 2.5, borderRadius: 6 }] },
      options: { maintainAspectRatio: false, plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { callback: v => fmtNum(v) + ' €' } } } },
    };
  }, [agg, mode]);

  const gPodiely = useMemo(() => agg && ({
    type: 'doughnut',
    data: { labels: ['Terminál', 'Qerko', 'Hotovosť', 'Gastro lístky'],
      datasets: [{ data: [agg.karty, agg.qerko, Math.max(agg.hotovost, 0), agg.gastro],
        backgroundColor: [C.gold, C.fialova, C.ok, C.jantar], borderColor: '#fff', borderWidth: 2 }] },
    options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } },
  }), [agg]);

  const gUlohy = useMemo(() => agg && Object.keys(agg.katMap).length > 0 && ({
    type: 'bar',
    data: { labels: Object.keys(agg.katMap),
      datasets: [
        { label: 'Splnené', data: Object.values(agg.katMap).map(k => k.done),
          backgroundColor: 'rgba(42,154,85,0.6)', borderColor: C.ok, borderWidth: 1.5, borderRadius: 6 },
        { label: 'Nesplnené', data: Object.values(agg.katMap).map(k => k.total - k.done),
          backgroundColor: 'rgba(160,144,128,0.45)', borderColor: C.muted, borderWidth: 1.5, borderRadius: 6 },
      ] },
    options: { maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
      onClick: (_e, els) => { if (els && els.length) { const kat = Object.keys(agg.katMap)[els[0].index]; setFilterKat(prev => prev === kat ? null : kat); } } },
  }), [agg]);

  const gOdpisy = useMemo(() => agg && agg.topOdpisy.length > 0 && ({
    type: 'bar',
    data: { labels: agg.topOdpisy.map(o => `${o.item} (${o.unit})`),
      datasets: [{ label: 'Množstvo', data: agg.topOdpisy.map(o => +o.qty.toFixed(1)),
        backgroundColor: 'rgba(208,48,48,0.55)', borderColor: C.err, borderWidth: 1.5, borderRadius: 6 }] },
    options: { indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true } } },
  }), [agg]);

  const chip = (on) => ({ padding: '8px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 800,
    cursor: 'pointer', border: `1px solid ${on ? C.gold : C.border}`, whiteSpace: 'nowrap',
    background: on ? C.gold : 'rgba(255,255,255,0.7)', color: on ? '#fff' : C.sub, fontFamily: 'inherit' });

  const viacPobociek = (pobocky || []).length > 1;
  const kartyPct = agg && agg.trzby > 0 ? Math.round(agg.karty / agg.trzby * 100) : 0;
  const qerkoPct = agg && agg.trzby > 0 ? Math.round(agg.qerko / agg.trzby * 100) : 0;

  // História — stránkovanie
  const HIST_NA_STRANU = 15;
  const histRows = useMemo(() => agg ? [...agg.uzRows].sort((a, b) => a.day < b.day ? 1 : -1) : [], [agg]);
  const histStran = Math.max(1, Math.ceil(histRows.length / HIST_NA_STRANU));
  const histPage = histRows.slice((histStrana - 1) * HIST_NA_STRANU, histStrana * HIST_NA_STRANU);

  const th = { padding: '7px 10px', whiteSpace: 'nowrap', textAlign: 'right' };
  const td = { padding: '7px 10px', whiteSpace: 'nowrap', textAlign: 'right' };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: '-apple-system,Segoe UI,sans-serif', paddingBottom: 40 }}>
      {/* Hlavička */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(232,224,208,0.92)',
                    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <img src={`${process.env.PUBLIC_URL}/foxford-logo.png.png`} alt="" style={{ height: 30 }} />
          <div style={{ fontWeight: 900, fontSize: 17, color: C.text }}>Prehľady</div>
          {demo && <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: 1, color: C.gold, background: C.goldDim,
                                 border: `1px solid ${C.goldLine}`, borderRadius: 8, padding: '3px 8px' }}>UKÁŽKA — vymyslené dáta</div>}
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 12, color: C.muted }}>{email}</div>
          <button onClick={() => setZmenaHesla(true)} style={{ ...chip(false), padding: '7px 12px' }}>Zmeniť heslo</button>
          <button onClick={odhlasit} style={{ ...chip(false), padding: '7px 12px', color: C.err, borderColor: `${C.err}55` }}>Odhlásiť</button>
        </div>
      </div>

      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '18px 20px' }}>
        {/* Pobočky */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
          {viacPobociek && (
            <>
              <button style={chip(vybrana === '*')} onClick={() => setVybrana('*')}>Všetky pobočky</button>
              {(pobocky || []).map(p => (
                <button key={p} style={chip(vybrana === p)} onClick={() => setVybrana(p)}>{p}</button>
              ))}
            </>
          )}
          {!viacPobociek && pobocky && pobocky[0] && (
            <div style={{ fontSize: 14, fontWeight: 800, color: C.gold }}>📍 {pobocky[0]}</div>
          )}
        </div>

        {/* Obdobie: režim + šípky (prenesené z OBRATOVEJ TABUĽKY) */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
          {MODY.map(m => (
            <button key={m.id} style={chip(mode === m.id)} onClick={() => { setMode(m.id); setRefDate(new Date()); }}>{m.label}</button>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8,
                        background: 'rgba(255,255,255,0.7)', border: `1px solid ${C.border}`, borderRadius: 20, padding: '2px 6px' }}>
            <button onClick={() => posun(-1)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: C.gold, padding: '2px 8px', fontFamily: 'inherit' }}>‹</button>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.text, minWidth: 130, textAlign: 'center' }}>{rozsahLabel(mode, refDate)}</div>
            <button onClick={() => posun(1)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: C.gold, padding: '2px 8px', fontFamily: 'inherit' }}>›</button>
          </div>
        </div>

        {pobocky && pobocky.length === 0 && (
          <Karta><div style={{ color: C.sub, fontSize: 14 }}>
            Tvoj účet zatiaľ nemá priradenú žiadnu pobočku — ozvi sa administrátorovi.
          </div></Karta>
        )}
        {chyba && <Karta style={{ marginBottom: 14 }}><div style={{ color: C.err, fontSize: 14 }}>{chyba}</div></Karta>}
        {nacitava && pobocky && pobocky.length > 0 && (
          <div style={{ color: C.muted, fontSize: 14, padding: '30px 0', textAlign: 'center' }}>Načítavam dáta…</div>
        )}

        {!nacitava && agg && (
          <>
            {/* Tržbové čísla */}
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(215px, 1fr))', marginBottom: 14 }}>
              <Cislo label="Tržby" value={fmtEur(agg.trzby)} note={rozsahLabel(mode, refDate)} />
              <Cislo label="Platobné karty" value={fmtEur(agg.karty)} note={`${kartyPct} % z tržieb na termináli`} />
              <Cislo label="Qerko" value={fmtEur(agg.qerko)} note={`${qerkoPct} % z celkového obratu`} />
              <Cislo label="Hotovosť v kase" value={agg.kasaSpolu !== 0 || Object.keys(agg.kasaPos).length ? fmtEur(agg.kasaSpolu, 2) : '—'}
                     note={vybrana === '*' ? 'súčet posledných zostatkov pobočiek' : 'posledný zostatok (M) v období'}
                     tone={agg.upozornenia.some(u => u.typ === 'err') ? 'err' : agg.upozornenia.length ? undefined : 'ok'} />
            </div>

            {/* Upozornenia (stav kasy + opakované problémy + opakované HACCP) */}
            {agg.upozornenia.length > 0 && (
              <Karta title="⚠️ Upozornenia" style={{ marginBottom: 14 }}>
                {agg.upozornenia.map((u, i) => (
                  <div key={i} style={{ padding: '8px 12px', borderRadius: 10, marginBottom: 6, fontSize: 13.5,
                                        background: u.typ === 'err' ? C.errDim : C.goldDim,
                                        border: `1px solid ${u.typ === 'err' ? C.err + '44' : C.goldLine}`,
                                        color: u.typ === 'err' ? C.err : C.text }}>
                    {u.typ === 'err' ? '⛔' : '⚠️'} {u.text}
                  </div>
                ))}
              </Karta>
            )}

            {/* Tržbové grafy */}
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', marginBottom: 14 }}>
              <Karta title={mode === 'rok' ? `Mesačné tržby — ${rozsahLabel(mode, refDate)}` : `Vývoj tržieb — ${rozsahLabel(mode, refDate)}`}
                     style={{ gridColumn: '1 / -1' }}>
                {Object.keys(agg.poDni).length === 0
                  ? <div style={{ color: C.muted, fontSize: 13, padding: '20px 0' }}>V tomto období nie sú žiadne uzávierky.</div>
                  : <Graf config={gTrzby} height={270} />}
              </Karta>
              <Karta title="Podiely platieb">
                {agg.trzby > 0 ? <Graf config={gPodiely} height={240} /> :
                  <div style={{ color: C.muted, fontSize: 13 }}>Bez tržieb v období.</div>}
              </Karta>
              {!lenTrzby && (
                <Karta title="Úlohy podľa kategórie">
                  {gUlohy ? <Graf config={gUlohy} height={240} /> :
                    <div style={{ color: C.muted, fontSize: 13 }}>Žiadne úlohy v období.</div>}
                </Karta>
              )}
              {!lenTrzby && (
                <Karta title="Najodpisovanejšie položky">
                  {gOdpisy ? <Graf config={gOdpisy} height={240} /> :
                    <div style={{ color: C.muted, fontSize: 13 }}>Žiadne odpisy v období.</div>}
                </Karta>
              )}
            </div>

            {/* Prevádzkové čísla */}
            {!lenTrzby && (
              <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(215px, 1fr))', marginBottom: 14 }}>
                <Cislo label="Splnenosť úloh" value={agg.pct === null ? '—' : agg.pct + ' %'}
                       tone={agg.pct === null ? undefined : agg.pct >= 90 ? 'ok' : agg.pct >= 70 ? undefined : 'err'} />
                <Cislo label="Odpisov" value={fmtNum(agg.odpisovSpolu)} />
                <Cislo label="HACCP prekročenia" value={fmtNum(agg.prekrocenia.length)} tone={agg.prekrocenia.length ? 'err' : 'ok'} />
              </div>
            )}
            {lenTrzby && (
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>
                ℹ️ Ročný pohľad všetkých pobočiek zobrazuje len tržby — pre úlohy, odpisy a HACCP vyber pobočku alebo kratšie obdobie.
              </div>
            )}

            {/* Detail: nesplnené a problémové úlohy (klik na graf úloh filtruje podľa kategórie) */}
            {!lenTrzby && (
              <Karta style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: C.sub, letterSpacing: .8, textTransform: 'uppercase' }}>
                    Nesplnené a problémové úlohy
                  </span>
                  {filterKat && (
                    <span onClick={() => setFilterKat(null)} style={{ cursor: 'pointer', fontSize: 11.5, fontWeight: 700, color: C.gold,
                          background: C.goldDim, border: `1px solid ${C.goldLine}`, borderRadius: 20, padding: '3px 10px' }}>
                      filter: {filterKat} ✕
                    </span>
                  )}
                  <span style={{ flex: 1 }} />
                  <span style={{ fontSize: 11, color: C.muted }}>💡 klikni na stĺpec grafu „Úlohy podľa kategórie" pre filter</span>
                </div>
                {(() => {
                  const list = agg.problemove.filter(p => !filterKat || p.category === filterKat);
                  if (list.length === 0) return (
                    <div style={{ color: C.ok, fontSize: 14, fontWeight: 700 }}>✓ Všetky úlohy v období boli splnené bez nahláseného problému.</div>
                  );
                  return (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead><tr style={{ color: C.sub, textAlign: 'left' }}>
                          <th style={{ padding: '6px 10px' }}>Deň</th>
                          {vybrana === '*' && <th style={{ padding: '6px 10px' }}>Pobočka</th>}
                          <th style={{ padding: '6px 10px' }}>Zmena</th>
                          <th style={{ padding: '6px 10px' }}>Úloha</th>
                          <th style={{ padding: '6px 10px' }}>Kto</th>
                          <th style={{ padding: '6px 10px' }}>Stav / problém</th>
                        </tr></thead>
                        <tbody>
                          {list.slice(0, 40).map((p, i) => (
                            <tr key={i} style={{ borderTop: `1px solid ${C.border}`, background: p.issue ? C.errDim : (i % 2 ? 'rgba(150,120,80,0.05)' : 'transparent') }}>
                              <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>{dayLabel(p.day)}</td>
                              {vybrana === '*' && <td style={{ padding: '7px 10px' }}>{p.branch}</td>}
                              <td style={{ padding: '7px 10px', color: C.sub }}>{p.category}</td>
                              <td style={{ padding: '7px 10px' }}>{p.task}</td>
                              <td style={{ padding: '7px 10px', color: C.sub }}>{p.by || '—'}</td>
                              <td style={{ padding: '7px 10px', fontWeight: 700, color: p.issue ? C.err : C.muted }}>
                                {p.issue ? `⚠ ${p.issue}` : '✗ nesplnené'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {list.length > 40 && (
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 8, textAlign: 'right' }}>… a ďalších {fmtNum(list.length - 40)} — zúž obdobie alebo pobočku</div>
                      )}
                    </div>
                  );
                })()}
              </Karta>
            )}

            {/* HACCP prekročenia */}
            {!lenTrzby && agg.prekrocenia.length > 0 && (
              <Karta title="Posledné HACCP prekročenia" style={{ marginBottom: 14 }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead><tr style={{ color: C.sub, textAlign: 'left' }}>
                      <th style={{ padding: '6px 10px' }}>Deň</th>
                      {vybrana === '*' && <th style={{ padding: '6px 10px' }}>Pobočka</th>}
                      <th style={{ padding: '6px 10px' }}>Zariadenie</th>
                      <th style={{ padding: '6px 10px' }}>Hodnota</th>
                      <th style={{ padding: '6px 10px' }}>Limit</th>
                    </tr></thead>
                    <tbody>
                      {agg.prekrocenia.slice(-14).reverse().map((h, i) => (
                        <tr key={i} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 ? 'transparent' : C.errDim }}>
                          <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>{dayLabel(h.day)}</td>
                          {vybrana === '*' && <td style={{ padding: '7px 10px' }}>{h.branch}</td>}
                          <td style={{ padding: '7px 10px' }}>{h.device}</td>
                          <td style={{ padding: '7px 10px', color: C.err, fontWeight: 800 }}>{h.value} °C</td>
                          <td style={{ padding: '7px 10px', color: C.sub }}>{h.max_limit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Karta>
            )}

            {/* História uzávierok (prenesené z OBRATOVEJ TABUĽKY, len na čítanie) */}
            <Karta title="História uzávierok">
              {histRows.length === 0 ? (
                <div style={{ color: C.muted, fontSize: 13 }}>Žiadne uzávierky v období.</div>
              ) : (
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                      <thead><tr style={{ color: C.sub }}>
                        <th style={{ ...th, textAlign: 'left' }}>Dátum</th>
                        <th style={{ ...th, textAlign: 'left' }}>Deň</th>
                        {vybrana === '*' && <th style={{ ...th, textAlign: 'left' }}>Pobočka</th>}
                        <th style={th}>Obrat</th>
                        <th style={th}>Karty</th>
                        <th style={th}>Qerko</th>
                        <th style={th}>Tringelt</th>
                        <th style={th}>Gastro l.</th>
                        <th style={th}>Odvod</th>
                        <th style={th}>Zaokr.</th>
                        <th style={th}>Kasa večer</th>
                      </tr></thead>
                      <tbody>
                        {histPage.map((u, i) => (
                          <tr key={u.branch + u.day + i} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 ? 'rgba(150,120,80,0.05)' : 'transparent' }}>
                            <td style={{ ...td, textAlign: 'left', fontWeight: 700 }}>{dayLabel(u.day)} {u.day.slice(0, 4)}</td>
                            <td style={{ ...td, textAlign: 'left', color: C.sub }}>{dayName(u.day)}</td>
                            {vybrana === '*' && <td style={{ ...td, textAlign: 'left' }}>{u.branch}</td>}
                            <td style={{ ...td, fontWeight: 800, color: C.gold }}>{fmtEur(u.obrat, 2)}</td>
                            <td style={td}>{fmtEur(u.karta, 2)}</td>
                            <td style={td}>{fmtEur(u.qerko, 2)}</td>
                            <td style={td}>{fmtEur(u.qerkoTr, 2)}</td>
                            <td style={td}>{fmtEur(u.gastro, 2)}</td>
                            <td style={td}>{fmtEur(u.odvod, 2)}</td>
                            <td style={td}>{fmtEur(u.zaokruhly, 2)}</td>
                            <td style={{ ...td, fontWeight: 700, color: u.kasa !== null && u.kasa < 0 ? C.err : C.text }}>
                              {u.kasa === null ? '—' : fmtEur(u.kasa, 2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {histStran > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 10, fontSize: 12.5, color: C.sub }}>
                      <span>strana {histStrana} / {histStran} · {fmtNum(histRows.length)} dní</span>
                      <button onClick={() => setHistStrana(s => Math.max(1, s - 1))} style={chip(false)}>‹</button>
                      <button onClick={() => setHistStrana(s => Math.min(histStran, s + 1))} style={chip(false)}>›</button>
                    </div>
                  )}
                </>
              )}
            </Karta>
          </>
        )}
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
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(30,22,8,.55)',
         backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
      <div onMouseDown={e => e.stopPropagation()} style={{ background: '#fff', border: `1px solid ${C.borderM}`,
           width: '100%', maxWidth: 360, borderRadius: 22, padding: '26px 22px' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: C.text, marginBottom: 16, textAlign: 'center' }}>Zmena hesla</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input style={inp} type="password" placeholder="Nové heslo (min. 8 znakov)" value={h1} onChange={e => setH1(e.target.value)} autoComplete="new-password" />
          <input style={inp} type="password" placeholder="Nové heslo znova" value={h2} onChange={e => setH2(e.target.value)} autoComplete="new-password" />
        </div>
        {stav && <div style={{ marginTop: 12, fontSize: 13, textAlign: 'center',
                               color: stav === 'OK' ? C.ok : C.err }}>{stav === 'OK' ? '✓ Heslo zmenené' : stav}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 13, border: `1px solid ${C.border}`,
                   background: 'transparent', color: C.sub, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Zrušiť</button>
          <button onClick={uloz} disabled={busy} style={{ flex: 1, padding: 12, borderRadius: 13, border: 'none',
                   background: C.gold, color: '#fff', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', opacity: busy ? .6 : 1 }}>Uložiť</button>
        </div>
      </div>
    </div>
  );
}
