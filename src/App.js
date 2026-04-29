import React, { useState, useEffect, useRef } from 'react';

// ── WARM DARK PALETTE ────────────────────────────────────────────────────────
const C = {
  bg:       '#0d0a07',
  panel:    'rgba(255,245,225,0.05)',
  panelHov: 'rgba(255,245,225,0.08)',
  border:   'rgba(255,245,225,0.09)',
  borderM:  'rgba(255,245,225,0.16)',
  gold:     '#e0a03a',
  goldDim:  'rgba(224,160,58,0.15)',
  goldLine: 'rgba(224,160,58,0.4)',
  text:     '#f0e8dc',
  sub:      '#9a8a76',
  muted:    '#56504a',
  ok:       '#4ec27a',
  okDim:    'rgba(78,194,122,0.12)',
  err:      '#e87272',
  errDim:   'rgba(232,114,114,0.12)',
};

const BRANCH_PIN = '1234';

const BRANCHES = [
  { name: 'Obchodná', url: 'https://script.google.com/macros/s/AKfycbxy-PDCqL9LDecVwWJFKY0JwjvXi38Y1vSImcyXVY3y-rmF14_3Q0kE8nGVf7rfEsah/exec' },
  { name: 'Nivy',     url: 'https://script.google.com/macros/s/AKfycbwXWxgtsrJFEb6s9cEP_sPZujYLYjicaiL881vrroLxlf335Rll9nHkwW1bqWFa_sM4/exec' },
  { name: 'Cubicon',  url: 'URL_POBOCKA_3' },
  { name: 'Levice',   url: 'URL_POBOCKA_4' },
  { name: 'Martin',   url: 'URL_POBOCKA_5' },
  { name: 'Žilina',   url: 'URL_POBOCKA_6' },
  { name: 'Poprad',   url: 'URL_POBOCKA_7' },
  { name: 'Prešov',   url: 'URL_POBOCKA_8' },
  { name: 'Košice',   url: 'URL_POBOCKA_9' },
];

const MONTHS = ['Január','Február','Marec','Apríl','Máj','Jún','Júl','August','September','Október','November','December'];

const INIT_TASKS = {
  denné: [
    { id: 101, text: 'Sanitácia dýz kávovaru',      done: false, time: null, issue: null },
    { id: 102, text: 'Čistenie mlynčekov',           done: false, time: null, issue: null },
    { id: 103, text: 'Vyliatie misky pod kávovarom', done: false, time: null, issue: null },
  ],
  víkendové: [{ id: 201, text: 'Odvápnenie kanvice',     done: false, time: null, issue: null }],
  mesačné:   [{ id: 301, text: 'Sanitácia mrazničky',    done: false, time: null, issue: null }],
};

const INIT_INV = [
  { category: 'Káva',   items: [{ id: 'i1', name: 'Zrnková káva (Foxford Blend)', unit: 'kg' }, { id: 'i2', name: 'Decaf zrnková káva', unit: 'kg' }] },
  { category: 'Mlieko', items: [{ id: 'i3', name: 'Plnotučné mlieko 3.5%',        unit: 'ks (1L)' }, { id: 'i4', name: 'Ovsené mlieko (Oatly)', unit: 'ks (1L)' }] },
  { category: 'Sirupy', items: [{ id: 'i5', name: 'Vanilkový sirup',               unit: 'ks' }, { id: 'i6', name: 'Karamelový sirup', unit: 'ks' }] },
];

const INIT_TEMP_FIELDS = [
  { key: 'vitrina',    label: 'Vitrína',    max: '≤ 8 °C' },
  { key: 'chladnicka', label: 'Chladnička', max: '≤ 5 °C' },
  { key: 'sklad',      label: 'Sklad',      max: '≤ 25 °C' },
];

const strip = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// ── LOGO ─────────────────────────────────────────────────────────────────────
const Logo = ({ size = 40 }) => (
  <div style={{
    width: size, height: size, borderRadius: Math.round(size * 0.26),
    background: 'linear-gradient(145deg, #1a1208, #2e1f0e)',
    border: `1.5px solid ${C.goldLine}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    boxShadow: `0 0 20px rgba(224,160,58,0.15), 0 4px 12px rgba(0,0,0,0.5)`,
  }}>
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <path d="M30 3L57 18.5V41.5L30 57L3 41.5V18.5Z" fill={C.gold} opacity="0.95" />
      <path d="M30 15L46 24.5V40.5L30 50L14 40.5V24.5Z" fill="rgba(0,0,0,0.5)" />
      <text x="30" y="37" textAnchor="middle" fill="white" fontSize="20" fontWeight="800" fontFamily="-apple-system,sans-serif">F</text>
    </svg>
  </div>
);

// ── GLASS CARD ────────────────────────────────────────────────────────────────
const Glass = ({ children, style, accent }) => (
  <div style={{
    background: C.panel,
    border: `1px solid ${accent ? C.borderM : C.border}`,
    borderRadius: 20,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    marginBottom: 10,
    overflow: 'hidden',
    ...style,
  }}>{children}</div>
);

// ── PILL LABEL ────────────────────────────────────────────────────────────────
const Tag = ({ text }) => (
  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.2, color: C.sub, textTransform: 'uppercase' }}>{text}</span>
);

// ── INPUT ─────────────────────────────────────────────────────────────────────
const Inp = React.forwardRef(({ style, shake, ...props }, ref) => (
  <input ref={ref} {...props} className={shake ? 'shake' : ''} style={{
    width: '100%', padding: '12px 14px', borderRadius: 12,
    border: `1px solid ${C.border}`, fontSize: 15, outline: 'none',
    boxSizing: 'border-box', background: 'rgba(255,245,225,0.04)',
    color: C.text, fontFamily: 'inherit',
    transition: 'border-color 0.2s',
    ...style,
  }} />
));

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [loading, setLoading]   = useState(true);
  const [online, setOnline]     = useState(navigator.onLine);
  const [tab, setTab]           = useState('tasks');
  const [subTab, setSubTab]     = useState('denné');
  const [expCat, setExpCat]     = useState(null);
  const [quickTask, setQuickTask] = useState(null);
  const [confirmUndo, setConfirmUndo] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [lastHaccpDate, setLastHaccpDate] = useState(localStorage.getItem('foxford-haccp-date') || '');
  const [invSearch, setInvSearch] = useState('');

  const timerRef = useRef(null);
  const longPress  = useRef(false);
  const inspRef  = useRef(null);
  const nameRef  = useRef(null);
  const touchX   = useRef(null);
  const [swipeId,  setSwipeId]  = useState(null);
  const [swipeOff, setSwipeOff] = useState(0);

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('foxford-tasks');
    const last  = localStorage.getItem('foxford-last-reset-date');
    const today = new Date().toDateString();
    if (!saved) return INIT_TASKS;
    const parsed = JSON.parse(saved);
    if (last !== today) {
      localStorage.setItem('foxford-last-reset-date', today);
      localStorage.setItem('foxford-batch', '');
      return { ...parsed, denné: INIT_TASKS.denné };
    }
    return parsed;
  });

  const [inspectors, setInspectors] = useState(() => JSON.parse(localStorage.getItem('foxford-inspectors')) || { denné: '', víkendové: '', mesačné: '' });
  const [batchTime, setBatchTime]   = useState(localStorage.getItem('foxford-batch') || null);
  const [newTask, setNewTask]       = useState('');
  const [tempFields, setTempFields] = useState(() => JSON.parse(localStorage.getItem('foxford-temp-fields')) || INIT_TEMP_FIELDS);
  const [temps, setTemps]           = useState(() => {
    const fields = JSON.parse(localStorage.getItem('foxford-temp-fields')) || INIT_TEMP_FIELDS;
    return fields.reduce((a, f) => ({ ...a, [f.key]: '' }), {});
  });
  const [newTempLabel, setNewTempLabel] = useState('');
  const [newTempMax,   setNewTempMax]   = useState('');
  const [confirmRemoveTemp, setConfirmRemoveTemp] = useState(null);
  const [showAddTemp, setShowAddTemp] = useState(false);
  const [confirmAddTemp, setConfirmAddTemp] = useState(false);
  const [controllerName, setControllerName] = useState('');
  const [selectedMonth, setSelectedMonth]   = useState(MONTHS[new Date().getMonth()]);
  const [invData, setInvData]   = useState(() => JSON.parse(localStorage.getItem('foxford-inventory-data')) || INIT_INV);
  const [invQty, setInvQty]     = useState(() => JSON.parse(localStorage.getItem('foxford-inventory'))       || {});
  const [invNotes, setInvNotes] = useState(() => JSON.parse(localStorage.getItem('foxford-inventory-notes')) || {});
  const [newCat, setNewCat]     = useState('');
  const [addingTo, setAddingTo] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');
  const [newItemCode, setNewItemCode] = useState('');
  const [notes, setNotes]   = useState(() => JSON.parse(localStorage.getItem('foxford-notes')) || []);
  const [newNote, setNewNote] = useState('');
  const [noteAuthor, setNoteAuthor] = useState('');
  const [celebrate, setCelebrate] = useState(false);
  const [celebrateHaccp, setCelebrateHaccp] = useState(false);
  const [confirmResetHaccp, setConfirmResetHaccp] = useState(false);
  const [sending, setSending]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [missingWarning, setMissingWarning] = useState([]);
  const [savedAt, setSavedAt] = useState(null);
  const [branch, setBranch] = useState(() => localStorage.getItem('foxford-branch') || null);
  const [showBranchSelect, setShowBranchSelect] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinStep, setPinStep] = useState(false);
  const [shakeName, setShakeName] = useState(false);
  const [shakeInsp, setShakeInsp] = useState(false);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 500); return () => clearTimeout(t); }, []);
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // ── MIDNIGHT AUTO-RESET for denné ──────────────────────────────────────────
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(); midnight.setHours(24, 0, 0, 0);
    const ms = midnight - now;
    const timer = setTimeout(() => {
      setTasks(prev => ({ ...prev, denné: prev.denné.map(t => ({ ...t, done: false, time: null, issue: null })) }));
      setInspectors(prev => ({ ...prev, denné: '' }));
      setBatchTime(null);
      setLastHaccpDate('');
      setTemps(prev => Object.keys(prev).reduce((a, k) => ({ ...a, [k]: '' }), {}));
      localStorage.setItem('foxford-last-reset-date', new Date().toDateString());
      localStorage.setItem('foxford-haccp-date', '');
    }, ms);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    localStorage.setItem('foxford-tasks',           JSON.stringify(tasks));
    localStorage.setItem('foxford-batch',           batchTime || '');
    localStorage.setItem('foxford-last-reset-date', new Date().toDateString());
    localStorage.setItem('foxford-inspectors',      JSON.stringify(inspectors));
    localStorage.setItem('foxford-temp-fields',     JSON.stringify(tempFields));
    localStorage.setItem('foxford-inventory-data',  JSON.stringify(invData));
    localStorage.setItem('foxford-inventory',       JSON.stringify(invQty));
    localStorage.setItem('foxford-inventory-notes', JSON.stringify(invNotes));
    localStorage.setItem('foxford-notes',           JSON.stringify(notes));
    setSavedAt(new Date().toLocaleTimeString('sk-SK', { hour:'2-digit', minute:'2-digit' }));
  }, [tasks, batchTime, inspectors, tempFields, invData, invQty, invNotes, notes]);

  const scriptUrl = BRANCHES.find(b => b.name === branch)?.url || BRANCHES[0].url;

  const sendToSheets = (type, payload) => {
    if (!navigator.onLine) return;
    fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, ...payload }),
    }).catch(console.error);
  };

  const exportPortos = () => {
    const lines = [];
    invData.forEach(group => {
      group.items.forEach(item => {
        const code = (item.portosCode || '').trim();
        const qty  = (invQty[item.id] || '').toString().trim();
        if (code && qty) lines.push(`${code};${qty}`);
      });
    });
    if (lines.length === 0) { alert('Žiadne položky s PORTOS kódom a vyplneným množstvom.'); return; }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `inventura_${new Date().toLocaleDateString('sk-SK').replace(/\./g, '-')}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const doShake = (setter, ref) => {
    setter(true);
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    ref.current?.focus();
    setTimeout(() => setter(false), 500);
  };

  const needName = () => { if (!controllerName.trim()) { doShake(setShakeName, nameRef); return false; } return true; };
  const needInsp = () => { if (!inspectors[subTab].trim()) { doShake(setShakeInsp, inspRef); return false; } return true; };

  const pct = () => {
    const t = tasks[subTab] || [];
    return t.length === 0 ? 0 : Math.round(t.filter(x => x.done).length / t.length * 100);
  };

  const onTouchStart = (e, id) => { touchX.current = e.targetTouches[0].clientX; setSwipeId(id); };
  const onTouchMove  = (e) => {
    if (touchX.current === null) return;
    const d = touchX.current - e.targetTouches[0].clientX;
    if (Math.abs(d) > 10 && timerRef.current) clearTimeout(timerRef.current);
    if (d > 0) setSwipeOff(d);
  };
  const onTouchEnd = (t) => {
    if (swipeOff > 70) setTasks({ ...tasks, [subTab]: tasks[subTab].filter(x => x.id !== t.id) });
    touchX.current = null; setSwipeOff(0); setSwipeId(null);
  };

  const uncheckedTask = (t) => {
    setTasks({ ...tasks, [subTab]: tasks[subTab].map(x => x.id === t.id ? { ...x, done: false, time: null, issue: null } : x) });
    setConfirmUndo(null);
  };

  // všetky úlohy sú buď splnené alebo majú zaznamenaný problém
  const allResolved = (list) => list.length > 0 && list.every(t => t.done || t.issue);

  const autoSend = (updatedList) => {
    if (subTab === 'denné') return;
    if (!allResolved(updatedList)) return;
    if (!inspectors[subTab].trim()) return;
    sendToSheets('tasks_summary', {
      date: new Date().toLocaleDateString('sk-SK'),
      category: subTab,
      inspector: inspectors[subTab],
      tasks: updatedList.map(t => ({
        text: t.text,
        done: t.done,
        time: t.time || null,
        date: t.date || null,
        issue: t.issue || null,
      })),
    });
  };

  const onTaskClick = (t) => {
    if (longPress.current || swipeOff > 10) { longPress.current = false; return; }
    if (!needInsp()) return;
    if (t.done) { setConfirmUndo(t); return; }
    const now = new Date();
    const time = now.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString('sk-SK', { day: 'numeric', month: 'numeric' });
    const updated = tasks[subTab].map(x => x.id === t.id ? { ...x, done: true, time, date, issue: null } : x);
    setTasks({ ...tasks, [subTab]: updated });
    autoSend(updated);
    if (allResolved(updated)) setTimeout(() => setCelebrate(true), 300);
  };

  const longStart = (t) => {
    longPress.current = false;
    timerRef.current = setTimeout(() => { if (swipeOff < 10) { longPress.current = true; setQuickTask(t); } }, 600);
  };
  const longEnd = () => { if (timerRef.current) clearTimeout(timerRef.current); };

  const reportIssue = (reason, e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!needInsp()) { setQuickTask(null); return; }
    const updated = tasks[subTab].map(x => x.id === quickTask.id ? { ...x, done: false, time: null, issue: reason } : x);
    setTasks({ ...tasks, [subTab]: updated });
    autoSend(updated);
    if (allResolved(updated)) setTimeout(() => setCelebrate(true), 300);
    setQuickTask(null);
  };

  const resetList = () => setConfirmReset(true);

  const doReset = () => {
    if (!inspectors[subTab].trim()) { doShake(setShakeInsp, inspRef); setConfirmReset(false); return; }
    const taskList = tasks[subTab] || [];
    if (taskList.length > 0) {
      sendToSheets('tasks_summary', {
        date: new Date().toLocaleDateString('sk-SK'),
        category: subTab,
        inspector: inspectors[subTab],
        tasks: taskList.map(t => ({ text: t.text, done: t.done, time: t.time || null, date: t.date || null, issue: t.issue || null })),
      });
    }
    setTasks({ ...tasks, [subTab]: tasks[subTab].map(t => ({ ...t, done: false, time: null, issue: null })) });
    setInspectors(prev => ({ ...prev, [subTab]: '' }));
    if (subTab === 'denné') setBatchTime(null);
    setConfirmReset(false);
  };

  const tempColor = (field, val) => {
    const n = parseFloat((val || '').replace(',', '.'));
    if (isNaN(n) || val === '') return null;
    const maxNum = parseFloat((field.max || '').replace(/[^\d.]/g, ''));
    if (isNaN(maxNum)) return 'ok';
    return n > maxNum ? 'err' : 'ok';
  };

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ background: C.bg, height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system,sans-serif', position: 'relative', overflow: 'hidden' }}>
        <style>{`
          @keyframes spin   { to { transform: rotate(360deg); } }
          @keyframes glow   { 0%,100% { opacity:.4; transform:scale(1); } 50% { opacity:.9; transform:scale(1.06); } }
          @keyframes rise   { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
          @keyframes shake  { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
          .shake { animation: shake .4s ease-in-out; border-color: ${C.err} !important; }
        `}</style>
        {/* ambient glow */}
        <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:`radial-gradient(circle, rgba(224,160,58,.12) 0%, transparent 70%)`, pointerEvents:'none' }} />
        <div style={{ animation:'glow 2.4s ease-in-out infinite' }}><Logo size={80} /></div>
        <div style={{ marginTop:22, fontSize:24, fontWeight:900, letterSpacing:5, color:C.text, animation:'rise .6s .2s both' }}>FOXFORD</div>
        <div style={{ marginTop:4, fontSize:9, color:C.gold, letterSpacing:3, fontWeight:700, textTransform:'uppercase', opacity:.8, animation:'rise .6s .35s both' }}>Akadémia kontrológie</div>
        <div style={{ marginTop:40, width:26, height:26, border:`2.5px solid rgba(255,245,225,.1)`, borderTopColor:C.gold, borderRadius:'50%', animation:'spin .7s linear infinite' }} />
      </div>
    );
  }

  // ── BRANCH SELECTION ──────────────────────────────────────────────────────
  if (!branch) {
    return (
      <div style={{ maxWidth:500, margin:'0 auto', minHeight:'100vh', fontFamily:'-apple-system,sans-serif', color:C.text, background:C.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 24px' }}>
        <Logo size={64} />
        <div style={{ marginTop:20, fontSize:22, fontWeight:900, letterSpacing:3 }}>FOXFORD</div>
        <div style={{ fontSize:9, color:C.gold, letterSpacing:2.5, fontWeight:700, textTransform:'uppercase', marginTop:2, marginBottom:32, opacity:.75 }}>Vyber prevádzku</div>
        {BRANCHES.map(b => (
          <button key={b.name} onClick={() => { localStorage.setItem('foxford-branch', b.name); setBranch(b.name); }}
            style={{ width:'100%', padding:'16px', marginBottom:10, borderRadius:14, border:`1px solid ${C.border}`, background:C.panel, color:C.text, fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
            🏪 {b.name}
          </button>
        ))}
      </div>
    );
  }

  // ── MAIN ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth:500, margin:'0 auto', minHeight:'100vh', fontFamily:'-apple-system,sans-serif', color:C.text, paddingBottom:110, overflowX:'hidden', background:`radial-gradient(ellipse at 15% 0%, rgba(224,160,58,.07) 0%, transparent 55%), radial-gradient(ellipse at 85% 90%, rgba(26,60,94,.15) 0%, transparent 55%), ${C.bg}` }}>
      <style>{`.shake{animation:shake .4s ease-in-out;border-color:${C.err}!important;} @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}`}</style>

      {/* HEADER */}
      <header style={{ padding:'20px 20px 14px', display:'flex', alignItems:'center', gap:14 }}>
        <Logo size={48} />
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:900, fontSize:20, letterSpacing:3, color:C.text }}>FOXFORD</div>
          <div style={{ fontSize:9, color:C.gold, letterSpacing:2.5, fontWeight:700, textTransform:'uppercase', marginTop:1, opacity:.75 }}>Akadémia kontrológie</div>
        </div>
        {!online && (
          <div style={{ fontSize:9, fontWeight:800, color:C.err, border:`1px solid ${C.err}`, padding:'3px 9px', borderRadius:20, letterSpacing:.5 }}>OFFLINE</div>
        )}
        <div onClick={() => { setPinInput(''); setPinError(false); setPinStep(true); }}
          style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', cursor:'pointer', opacity:.6 }}>
          <span style={{ fontSize:16 }}>🏪</span>
          <span style={{ fontSize:8, color:C.gold, fontWeight:700, letterSpacing:.5, maxWidth:80, textAlign:'right', lineHeight:1.2, marginTop:1 }}>{branch}</span>
        </div>
      </header>

      {/* thin gold rule */}
      <div style={{ height:1, background:`linear-gradient(to right, transparent, ${C.goldLine}, transparent)`, margin:'0 20px 12px' }} />

      {/* ── GLOBAL BATCH BANNER ─────────────────────────────────────────────── */}
      <div style={{ margin:'0 14px 14px', padding:'11px 16px', borderRadius:16, background:C.panel, border:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:18 }}>☕</span>
          <div>
            <div style={{ fontSize:9, fontWeight:800, letterSpacing:1.2, color:C.muted, textTransform:'uppercase' }}>Aktuálny batch</div>
            <div style={{ fontSize:16, fontWeight:800, color: batchTime ? C.gold : C.muted, letterSpacing:.5, marginTop:1 }}>{batchTime || '—'}</div>
          </div>
        </div>
        <button onClick={() => setBatchTime(new Date().toLocaleTimeString('sk-SK',{hour:'2-digit',minute:'2-digit'}))}
          style={{ background:C.goldDim, border:`1px solid ${C.goldLine}`, color:C.gold, padding:'7px 14px', borderRadius:10, fontWeight:800, fontSize:10, letterSpacing:.8, cursor:'pointer', fontFamily:'inherit' }}>
          NOVÝ
        </button>
      </div>

      <div style={{ padding:'0 14px' }}>

        {/* ── TASKS ────────────────────────────────────────────────────────── */}
        {tab === 'tasks' && (
          <>
            {/* Inspector */}
            <Glass accent style={{ padding:'14px 16px' }}>
              <Tag text={`Kontroluje — ${subTab}`} />
              <Inp ref={inspRef} type="text" placeholder="Tvoje meno…"
                value={inspectors[subTab]}
                onChange={e => { const v = e.target.value; setInspectors(prev => ({ ...prev, [subTab]: v })); }}
                shake={shakeInsp}
                style={{ marginTop:7, borderColor: inspectors[subTab] ? C.ok : C.err + '88' }} />
            </Glass>

            {/* Sub-tab switcher */}
            <div style={{ display:'flex', gap:6, marginBottom:10 }}>
              {['denné','víkendové','mesačné'].map(id => (
                <button key={id} onClick={() => setSubTab(id)} style={{
                  flex:1, padding:'9px 4px', borderRadius:12, border:`1px solid ${subTab===id ? C.goldLine : C.border}`,
                  background: subTab===id ? C.goldDim : 'transparent',
                  color: subTab===id ? C.gold : C.sub,
                  fontWeight:700, fontSize:9, letterSpacing:.8, textTransform:'uppercase',
                  cursor:'pointer', fontFamily:'inherit',
                }}>{id}</button>
              ))}
            </div>

            {/* Progress */}
            <Glass style={{ padding:'14px 16px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <Tag text="Postup" />
                <span style={{ fontSize:13, fontWeight:800, color: pct()===100 ? C.ok : C.gold }}>
                  {(tasks[subTab]||[]).filter(t=>t.done).length} / {(tasks[subTab]||[]).length}
                </span>
              </div>
              <div style={{ height:4, background:C.muted, borderRadius:4, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${pct()}%`, background: pct()===100 ? C.ok : C.gold, borderRadius:4, transition:'width .35s ease', boxShadow: pct()>0 ? `0 0 8px ${pct()===100 ? C.ok : C.gold}` : 'none' }} />
              </div>
            </Glass>


            {/* Task list */}
            <Glass style={{ padding:'10px 10px' }}>
              {/* Add */}
              <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                <Inp value={newTask} onChange={e => setNewTask(e.target.value)}
                  onKeyDown={e => { if(e.key==='Enter'&&newTask.trim()){setTasks({...tasks,[subTab]:[...(tasks[subTab]||[]),{id:Date.now(),text:newTask,done:false,time:null,issue:null}]});setNewTask('');} }}
                  placeholder="Pridať úlohu…"
                  style={{ flex:1, fontSize:14, padding:'10px 12px' }} />
                <button onClick={() => { if(newTask.trim()){setTasks({...tasks,[subTab]:[...(tasks[subTab]||[]),{id:Date.now(),text:newTask,done:false,time:null,issue:null}]});setNewTask('');} }}
                  style={{ width:42, borderRadius:12, border:`1px solid ${C.border}`, background:C.panelHov, color:C.gold, fontSize:22, fontWeight:300, cursor:'pointer' }}>+</button>
              </div>

              {/* Tasks — urgent first, then pending, then done */}
              {[...(tasks[subTab]||[])].sort((a,b) => {
                if (a.done !== b.done) return a.done ? 1 : -1;
                if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
                return 0;
              }).map(t => (
                <div key={t.id} style={{ position:'relative', overflow:'hidden', borderRadius:12, marginBottom:5, background: swipeId===t.id ? C.err+'33' : 'transparent' }}>
                  {swipeId===t.id && <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'flex-end', paddingRight:14, color:C.err, fontWeight:800, fontSize:11 }}>ZMAZAŤ ✕</div>}
                  <div
                    onMouseDown={() => longStart(t)} onMouseUp={longEnd}
                    onTouchStart={e => { longStart(t); onTouchStart(e,t.id); }}
                    onTouchMove={onTouchMove}
                    onTouchEnd={() => { longEnd(); onTouchEnd(t); }}
                    onClick={() => onTaskClick(t)}
                    style={{
                      position:'relative', zIndex:2,
                      transform: swipeId===t.id ? `translateX(-${swipeOff}px)` : 'none',
                      display:'flex', alignItems:'center', gap:12, padding:'13px 12px',
                      background: t.done ? C.okDim : t.issue ? C.errDim : t.urgent ? 'rgba(232,114,114,0.07)' : C.panelHov,
                      borderRadius:12,
                      border:`1px solid ${t.done ? C.ok+'44' : t.issue ? C.err+'44' : t.urgent ? C.err+'55' : C.border}`,
                      cursor:'pointer', userSelect:'none',
                    }}>
                    {/* Circle checkbox */}
                    <div style={{
                      width:22, height:22, borderRadius:'50%', flexShrink:0,
                      border:`2px solid ${t.done ? C.ok : t.issue ? C.err : C.muted}`,
                      background: t.done ? C.ok : 'transparent',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      boxShadow: t.done ? `0 0 8px ${C.ok}66` : 'none',
                    }}>
                      {t.done && <span style={{ color:'#0d0a07', fontSize:12, fontWeight:900, lineHeight:1 }}>✓</span>}
                      {!t.done && t.issue && <span style={{ color:C.err, fontSize:12, fontWeight:900, lineHeight:1 }}>!</span>}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom: t.issue ? 2 : 0 }}>
                        {t.urgent && !t.done && <span style={{ fontSize:9, fontWeight:800, color:C.err, border:`1px solid ${C.err}55`, padding:'1px 5px', borderRadius:5, letterSpacing:.5, flexShrink:0 }}>URGENTNÉ</span>}
                        <div style={{ fontSize:14, fontWeight:500, color: t.done ? C.sub : C.text, textDecoration: t.done ? 'line-through' : 'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.text}</div>
                      </div>
                      {t.issue && <div style={{ fontSize:11, color:C.err, fontWeight:600 }}>⚠ {t.issue}</div>}
                    </div>
                    {t.done && <span style={{ fontSize:11, fontWeight:700, color:C.ok, flexShrink:0, textAlign:'right', lineHeight:1.4 }}>{t.time}<br/><span style={{ fontSize:10, fontWeight:600, color:C.ok+'99' }}>{t.date}</span></span>}
                  </div>
                </div>
              ))}
              {(tasks[subTab]||[]).length === 0 && (
                <div style={{ textAlign:'center', color:C.muted, fontSize:13, padding:'24px 0' }}>Žiadne úlohy</div>
              )}
            </Glass>

            <button onClick={resetList} style={{ display:'block', width:'100%', padding:'10px', background:'none', border:'none', color:C.err+'99', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              Resetovať zoznam
            </button>
          </>
        )}

        {/* ── TEMPS ────────────────────────────────────────────────────────── */}
        {tab === 'temps' && (
          <>
            <Glass accent style={{ padding:'14px 16px' }}>
              <Tag text="Tvoje meno" />
              <Inp ref={nameRef} type="text" placeholder="Zadaj meno…" value={controllerName}
                onChange={e => setControllerName(e.target.value)} shake={shakeName}
                style={{ marginTop:7, borderColor: controllerName ? C.ok : C.border }} />
            </Glass>

            <Glass style={{ padding:'14px 16px 16px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <span style={{ fontSize:12, fontWeight:700, letterSpacing:1, color:C.sub, textTransform:'uppercase' }}>HACCP — Teplotná kontrola</span>
                <div onClick={() => { if (showAddTemp) { setShowAddTemp(false); setNewTempLabel(''); setNewTempMax(''); } else { setConfirmAddTemp(true); } }}
                  style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
                  {showAddTemp && <span style={{ fontSize:11, fontWeight:600, color:C.muted }}>Zrušiť</span>}
                  <span style={{ width:22, height:22, borderRadius:6, border:`1px solid ${showAddTemp ? C.goldLine : C.border}`, background: showAddTemp ? C.goldDim : 'transparent', color: showAddTemp ? C.gold : C.muted, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:300, lineHeight:1 }}>
                    {showAddTemp ? '✕' : '+'}
                  </span>
                </div>
              </div>

              {/* Pridať zariadenie */}
              {showAddTemp && <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                <Inp placeholder="Názov zariadenia…" value={newTempLabel} onChange={e => setNewTempLabel(e.target.value)}
                  style={{ flex:2, padding:'9px 12px', fontSize:13 }} />
                <Inp placeholder="Max (napr. ≤ 5 °C)" value={newTempMax} onChange={e => setNewTempMax(e.target.value)}
                  style={{ flex:1, padding:'9px 12px', fontSize:13 }} />
                <button onClick={() => {
                  if (!newTempLabel.trim()) return;
                  const key = 'temp_' + Date.now();
                  const rawMax = newTempMax.trim();
                  const formattedMax = rawMax
                    ? /^[\d.,]+$/.test(rawMax) ? `≤ ${rawMax} °C` : rawMax
                    : '';
                  setTempFields(prev => [{ key, label: newTempLabel.trim(), max: formattedMax }, ...prev]);
                  setTemps(prev => ({ ...prev, [key]: '' }));
                  setNewTempLabel(''); setNewTempMax(''); setShowAddTemp(false);
                }} style={{ padding:'9px 16px', borderRadius:12, border:`1px solid ${C.goldLine}`, background:C.goldDim, color:C.gold, fontWeight:700, fontSize:13, cursor:'pointer', flexShrink:0, letterSpacing:.5 }}>Pridať</button>
              </div>}

              {tempFields.map((field) => {
                const val = temps[field.key] || '';
                const status = tempColor(field, val);
                const accentColor = status === 'ok' ? C.ok : status === 'err' ? C.err : C.border;
                return (
                  <div key={field.key} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                        <span style={{ fontSize:11, fontWeight:700, letterSpacing:.5, color: status ? accentColor : C.sub, textTransform:'uppercase' }}>{field.label}</span>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          {field.max && <span style={{ fontSize:10, color:C.muted }}>{field.max}</span>}
                          <span onClick={() => setConfirmRemoveTemp(field)} style={{ color:C.muted, fontSize:12, cursor:'pointer', lineHeight:1 }}>✕</span>
                        </div>
                      </div>
                      <div style={{ position:'relative' }}>
                        <input type="text" placeholder="0.0" value={val}
                          onChange={e => { if (lastHaccpDate === new Date().toDateString()) return; setTemps(prev => ({ ...prev, [field.key]: e.target.value })); }}
                          readOnly={lastHaccpDate === new Date().toDateString()}
                          style={{
                            width:'100%', padding:'10px 14px', borderRadius:12,
                            border:`1.5px solid ${accentColor}`,
                            background: status === 'ok' ? C.okDim : status === 'err' ? C.errDim : C.panel,
                            color: status ? accentColor : C.text,
                            fontSize:18, fontWeight:800, textAlign:'center', letterSpacing:1,
                            outline:'none', boxSizing:'border-box', fontFamily:'inherit',
                            boxShadow: status ? `0 0 10px ${accentColor}22` : 'none',
                            cursor: lastHaccpDate === new Date().toDateString() ? 'default' : 'text',
                          }} />
                        {status && (
                          <div style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', fontSize:14 }}>
                            {status === 'ok' ? '✓' : '⚠'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {lastHaccpDate === new Date().toDateString() ? (
                <div style={{ textAlign:'center', padding:'12px 0 4px', color:C.ok, fontSize:13, fontWeight:600 }}>
                  ✓ Na dnes je všetko zaznamenané
                  <div style={{ fontSize:11, color:C.muted, marginTop:4, fontWeight:400 }}>🌙 Polia sa odomknú automaticky o polnoci</div>
                  <button onClick={() => setConfirmResetHaccp(true)} style={{ marginTop:12, background:'none', border:'none', color:C.muted, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', textDecoration:'underline' }}>
                    Resetovať teraz
                  </button>
                </div>
              ) : (
                <button disabled={sending} onClick={() => {
                  if (!needName()) return;
                  setSending(true);
                  sendToSheets('haccp', {
                    date: new Date().toLocaleDateString('sk-SK'),
                    podpis: controllerName || 'Anonym',
                    readings: tempFields.map(f => ({ label: f.label, value: temps[f.key] || '', max: f.max })),
                  });
                  setTimeout(() => {
                    setSending(false);
                    const today = new Date().toDateString();
                    setLastHaccpDate(today);
                    localStorage.setItem('foxford-haccp-date', today);
                    setCelebrateHaccp(true);
                  }, 900);
                }} style={{
                  width:'100%', padding:'13px', marginTop:2,
                  background: C.goldDim, border:`1px solid ${C.goldLine}`,
                  color:C.gold, borderRadius:14, fontWeight:800, fontSize:14,
                  letterSpacing:.8, cursor:'pointer', fontFamily:'inherit',
                  opacity: sending ? .7 : 1,
                }}>
                  {sending ? 'Odosielam…' : 'Odoslať kontrolu'}
                </button>
              )}
            </Glass>
          </>
        )}

        {/* ── INVENTORY ────────────────────────────────────────────────────── */}
        {tab === 'inventory' && (
          <>
            <Glass accent style={{ padding:'14px 16px' }}>
              <Tag text="Tvoje meno" />
              <Inp ref={nameRef} type="text" placeholder="Zadaj meno…" value={controllerName}
                onChange={e => setControllerName(e.target.value)} shake={shakeName}
                style={{ marginTop:7, marginBottom:14, borderColor: controllerName ? C.ok : C.border }} />
              <Tag text="Mesiac inventúry" />
              <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                style={{ width:'100%', marginTop:7, padding:'12px 14px', borderRadius:12, border:`1px solid ${C.border}`, background:'rgba(255,245,225,.04)', color:C.text, fontSize:15, outline:'none', fontFamily:'inherit', cursor:'pointer' }}>
                {MONTHS.map(m => <option key={m} style={{ background:'#1a1510' }}>{m}</option>)}
              </select>
            </Glass>

            {savedAt && (
              <div style={{ textAlign:'right', fontSize:10, color:C.muted, marginBottom:4 }}>
                💾 Automaticky uložené o {savedAt}
              </div>
            )}

            {/* Search */}
            <Glass style={{ padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ color:C.muted, fontSize:14 }}>⌕</span>
              <Inp placeholder="Hľadať položku…" value={invSearch} onChange={e => setInvSearch(e.target.value)}
                style={{ border:'none', padding:'4px 0', background:'transparent', fontSize:14 }} />
              {invSearch && <span onClick={() => setInvSearch('')} style={{ color:C.muted, fontSize:14, cursor:'pointer' }}>✕</span>}
            </Glass>

            {/* Categories */}
            {invData.map(group => {
              const s = strip(invSearch);
              const catMatch = strip(group.category).includes(s);
              const items = s ? (catMatch ? group.items : group.items.filter(i => strip(i.name).includes(s))) : group.items;
              if (s && !catMatch && items.length === 0) return null;
              const open = expCat === group.category || !!invSearch;
              return (
                <Glass key={group.category} style={{ overflow:'hidden', marginBottom:8 }}>
                  <div onClick={() => setExpCat(open && !invSearch ? null : group.category)}
                    style={{ padding:'13px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', borderBottom: open ? `1px solid ${C.border}` : 'none' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:3, height:16, borderRadius:2, background:C.gold }} />
                      <span style={{ fontWeight:700, fontSize:13, color:C.text, letterSpacing:.3 }}>{group.category}</span>
                      <span style={{ fontSize:10, color:C.muted }}>({group.items.length})</span>
                    </div>
                    <div style={{ display:'flex', gap:14, alignItems:'center' }}>
                      <span onClick={e => { e.stopPropagation(); setAddingTo(group.category); }} style={{ color:C.gold, fontSize:20, lineHeight:1, fontWeight:300 }}>+</span>
                      <span onClick={e => { e.stopPropagation(); if(window.confirm(`Zmazať "${group.category}"?`)) setInvData(invData.filter(g=>g.category!==group.category)); }}
                        style={{ color:C.muted, fontSize:12, cursor:'pointer' }}>✕</span>
                      <span style={{ color:C.muted, fontSize:10 }}>{open ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {open && (
                    <div style={{ padding:'10px 12px' }}>
                      {items.map((item, idx) => (
                        <div key={item.id} style={{ paddingBottom:10, marginBottom:10, borderBottom: idx<items.length-1 ? `1px solid ${C.border}` : 'none' }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                            <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{item.name}</span>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <span style={{ fontSize:10, color:C.gold, fontWeight:700, padding:'2px 7px', border:`1px solid ${C.goldLine}`, borderRadius:8 }}>{item.unit}</span>
                              <span onClick={() => { if(window.confirm(`Zmazať "${item.name}"?`)) setInvData(invData.map(g => g.category===group.category ? {...g, items: g.items.filter(i=>i.id!==item.id)} : g)); }}
                                style={{ color:C.muted, fontSize:12, cursor:'pointer', lineHeight:1 }}>✕</span>
                            </div>
                          </div>
                          <div style={{ display:'flex', gap:7, alignItems:'flex-start' }}>
                            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                              <Inp type="text" placeholder="Kód" value={item.portosCode||''}
                                readOnly={!!item.portosCode}
                                onChange={e => !item.portosCode && setInvData(invData.map(g => g.category===group.category ? {...g, items: g.items.map(i => i.id===item.id ? {...i, portosCode: e.target.value} : i)} : g))}
                                style={{ width:60, padding:'9px 6px', textAlign:'center', fontSize:12, color:C.sub, borderColor: item.portosCode ? C.goldLine : C.border, cursor: item.portosCode ? 'not-allowed' : 'text', opacity: item.portosCode ? 0.7 : 1 }} />
                              <span style={{ fontSize:9, color:C.muted, whiteSpace:'nowrap' }}>portos kód</span>
                            </div>
                            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                              <Inp type="text" placeholder={item.unit||'qty'} value={invQty[item.id]||''}
                                onChange={e => setInvQty({...invQty,[item.id]:e.target.value})}
                                style={{ width:60, padding:'9px 8px', textAlign:'center', fontWeight:700, fontSize:12 }} />
                              <span style={{ fontSize:9, color:C.muted, whiteSpace:'nowrap' }}>množstvo</span>
                            </div>
                            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2, flex:1 }}>
                              <Inp type="text" placeholder="Poznámka…" value={invNotes[item.id]||''}
                                onChange={e => setInvNotes({...invNotes,[item.id]:e.target.value})}
                                style={{ width:'100%', padding:'9px 10px', fontSize:12, borderStyle:'dashed' }} />
                              <span style={{ fontSize:9, color:C.muted, whiteSpace:'nowrap' }}>&nbsp;</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {items.length===0 && <div style={{ color:C.muted, fontSize:12, padding:'6px 0', textAlign:'center' }}>Žiadne položky</div>}
                    </div>
                  )}
                </Glass>
              );
            })}

            <button onClick={() => {
              if (!needName()) return;
              const missing = invData.flatMap(g => g.items).filter(item => !invQty[item.id]);
              if (missing.length > 0) { setMissingWarning(missing); return; }
              const allItems = invData.flatMap(g => g.items).filter(item => invQty[item.id]);
              sendToSheets('inventory', {
                date: new Date().toLocaleDateString('sk-SK'),
                month: `${selectedMonth} ${new Date().getFullYear()}`,
                inspector: controllerName || 'Anonym',
                items: allItems.map(item => ({
                  name: item.name,
                  unit: item.unit,
                  qty: invQty[item.id],
                  note: invNotes[item.id] || '',
                })),
              });
              setSuccess(true);
            }} style={{
              width:'100%', padding:'16px', marginBottom:8, borderRadius:14,
              background:C.goldDim, border:`1px solid ${C.goldLine}`,
              color:C.gold, fontWeight:800, fontSize:14, letterSpacing:.8,
              cursor:'pointer', fontFamily:'inherit',
            }}>
              Odoslať inventúru
            </button>

            <button onClick={exportPortos} style={{
              width:'100%', padding:'14px', marginBottom:8, borderRadius:14,
              background:'transparent', border:`1px solid ${C.border}`,
              color:C.sub, fontWeight:700, fontSize:13, letterSpacing:.5,
              cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            }}>
              <span style={{ fontSize:15 }}>⬇</span> Exportovať pre PORTOS
            </button>

            <button onClick={() => {
              if(window.confirm('Naozaj chceš začať novú inventúru? Vymažú sa množstvá, poznámky a meno.')) {
                setInvQty({});
                setInvNotes({});
                setControllerName('');
              }
            }} style={{
              width:'100%', padding:'14px', marginBottom:8, borderRadius:14,
              background:'transparent', border:`1px solid rgba(220,60,60,0.4)`,
              color:'rgba(220,100,100,0.9)', fontWeight:700, fontSize:13, letterSpacing:.5,
              cursor:'pointer', fontFamily:'inherit',
            }}>
              ↺ Nová inventúra
            </button>

            {/* Add category */}
            <Glass style={{ padding:'14px 16px', border:`1px dashed ${C.goldLine}` }}>
              <Inp placeholder="Nová kategória…" value={newCat} onChange={e => setNewCat(e.target.value)} style={{ marginBottom:9 }} />
              <button onClick={() => { if(newCat.trim()){setInvData([...invData,{category:newCat,items:[]}]);setNewCat('');} }}
                style={{ width:'100%', padding:'11px', background:C.panel, border:`1px solid ${C.border}`, color:C.text, borderRadius:12, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                + Pridať kategóriu
              </button>
            </Glass>
          </>
        )}

        {/* ── NOTES ────────────────────────────────────────────────────────── */}
        {tab === 'notes' && (
          <>
            <Glass style={{ padding:'14px 14px' }}>
              <Tag text="Nová správa" />
              <Inp
                value={noteAuthor}
                onChange={e => setNoteAuthor(e.target.value)}
                placeholder="Tvoje meno…"
                style={{ marginTop:8, marginBottom:8 }}
              />
              <div style={{ display:'flex', gap:8 }}>
                <Inp value={newNote} onChange={e => setNewNote(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newNote.trim()) {
                      setNotes([{ id: Date.now(), text: newNote, author: noteAuthor.trim() || 'Anonym', time: new Date().toLocaleString('sk-SK', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) }, ...notes]);
                      setNewNote('');
                    }
                  }}
                  placeholder="Napíš oznam…" style={{ flex:1 }} />
                <button onClick={() => {
                  if (newNote.trim()) {
                    setNotes([{ id: Date.now(), text: newNote, author: noteAuthor.trim() || 'Anonym', time: new Date().toLocaleString('sk-SK', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) }, ...notes]);
                    setNewNote('');
                  }
                }} style={{ padding:'0 16px', background:C.goldDim, border:`1px solid ${C.goldLine}`, color:C.gold, borderRadius:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap', fontSize:13 }}>
                  Odoslať
                </button>
              </div>
            </Glass>

            {notes.length === 0 && (
              <div style={{ textAlign:'center', color:C.muted, fontSize:13, paddingTop:50 }}>Žiadne správy</div>
            )}

            {notes.map(n => (
              <Glass key={n.id} style={{ padding:'14px 16px', borderLeft:`2px solid ${C.goldLine}`, marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                  <div style={{ fontSize:14, color:C.text, lineHeight:1.6, flex:1 }}>{n.text}</div>
                  <button onClick={() => setNotes(notes.filter(x => x.id !== n.id))}
                    style={{ background:'none', border:'none', color:C.muted, fontSize:16, cursor:'pointer', padding:'0 2px', lineHeight:1, flexShrink:0 }}>×</button>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:C.gold, opacity:.8 }}>{n.author || 'Anonym'}</span>
                  <span style={{ fontSize:10, color:C.muted }}>{n.time}</span>
                </div>
              </Glass>
            ))}
          </>
        )}
      </div>

      {/* ── FLOATING NAV ──────────────────────────────────────────────────────── */}
      <nav style={{
        position:'fixed', bottom:18, left:'50%', transform:'translateX(-50%)',
        width:'88%', maxWidth:390,
        background:'rgba(16,12,8,.92)',
        backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
        border:`1px solid ${C.border}`,
        borderRadius:50, height:62,
        display:'flex', alignItems:'center',
        boxShadow:'0 8px 32px rgba(0,0,0,.5), 0 0 0 1px rgba(255,245,225,.04)',
        zIndex:100,
      }}>
        {[
          { id:'tasks',     emoji:'☑',  label:'Úlohy' },
          { id:'temps',     emoji:'⊛',  label:'Teploty' },
          { id:'inventory', emoji:'▦',  label:'Sklad' },
          { id:'notes',     emoji:'✉',  label:'Správy' },
        ].map(({ id, emoji, label }) => {
          const hasAlert = id === 'temps' && lastHaccpDate !== new Date().toDateString();
          return (
            <div key={id} onClick={() => setTab(id)} style={{
              flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              cursor:'pointer', gap:3, position:'relative',
            }}>
              {tab === id && (
                <div style={{ position:'absolute', top:-1, left:'50%', transform:'translateX(-50%)', width:24, height:2, background:C.gold, borderRadius:2, boxShadow:`0 0 8px ${C.gold}` }} />
              )}
              <div style={{ position:'relative', fontSize:17, opacity: tab===id ? 1 : .3, transition:'opacity .15s' }}>
                {emoji}
                {hasAlert && <div style={{ position:'absolute', top:-2, right:-4, width:7, height:7, borderRadius:'50%', background:C.err, boxShadow:`0 0 6px ${C.err}` }} />}
              </div>
              <div style={{ fontSize:8.5, fontWeight:700, letterSpacing:.8, textTransform:'uppercase', color: tab===id ? C.gold : C.muted, transition:'color .15s' }}>{label}</div>
            </div>
          );
        })}
      </nav>

      {/* ── CELEBRATION HACCP ────────────────────────────────────────────────── */}
      {celebrateHaccp && (
        <div onClick={() => setCelebrateHaccp(false)} style={{ position:'fixed', inset:0, background:'rgba(6,4,2,.96)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:3000, cursor:'pointer', padding:32 }}>
          <style>{`
            @keyframes pop  { 0%{transform:scale(.4);opacity:0} 70%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
            @keyframes fall { 0%{transform:translateY(-20px);opacity:0} 100%{transform:translateY(0);opacity:1} }
            .conf-ring { animation: pop .5s cubic-bezier(.17,.67,.38,1.4) both; }
            .conf-text { animation: fall .4s .35s ease both; }
          `}</style>
          <div className="conf-ring" style={{ width:110, height:110, borderRadius:'50%', border:`3px solid ${C.ok}`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 40px ${C.ok}55, 0 0 80px ${C.ok}22`, marginBottom:28 }}>
            <span style={{ fontSize:52 }}>🌡️</span>
          </div>
          <div className="conf-text" style={{ fontSize:26, fontWeight:900, color:C.text, letterSpacing:2, marginBottom:8 }}>Hotovo!</div>
          <div className="conf-text" style={{ fontSize:14, color:C.ok, fontWeight:600, marginBottom:16 }}>Na dnes je všetko zaznamenané</div>
          <div className="conf-text" style={{ fontSize:13, color:C.sub, textAlign:'center', lineHeight:1.7, background:'rgba(255,245,225,0.05)', borderRadius:14, padding:'12px 18px', border:`1px solid ${C.border}` }}>
            🌙 Polia zostanú uzamknuté do polnoci.<br />
            <span style={{ fontSize:11, color:C.muted }}>O polnoci sa automaticky odomknú pre nový záznam.</span>
          </div>
          <div className="conf-text" style={{ fontSize:11, color:C.muted, marginTop:20 }}>Klepni kdekoľvek pre pokračovanie</div>
        </div>
      )}

      {/* ── CELEBRATION ──────────────────────────────────────────────────────── */}
      {celebrate && (
        <div onClick={() => setCelebrate(false)} style={{ position:'fixed', inset:0, background:'rgba(6,4,2,.96)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:3000, cursor:'pointer', padding:32 }}>
          <style>{`
            @keyframes pop  { 0%{transform:scale(.4);opacity:0} 70%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
            @keyframes fall { 0%{transform:translateY(-20px);opacity:0} 100%{transform:translateY(0);opacity:1} }
            .conf-ring { animation: pop .5s cubic-bezier(.17,.67,.38,1.4) both; }
            .conf-text { animation: fall .4s .35s ease both; }
          `}</style>
          <div className="conf-ring" style={{ width:110, height:110, borderRadius:'50%', border:`3px solid ${C.ok}`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 40px ${C.ok}55, 0 0 80px ${C.ok}22`, marginBottom:28 }}>
            <span style={{ fontSize:52 }}>🎉</span>
          </div>
          <div className="conf-text" style={{ fontSize:26, fontWeight:900, color:C.text, letterSpacing:2, marginBottom:8 }}>Hotovo!</div>
          <div className="conf-text" style={{ fontSize:14, color:C.ok, fontWeight:600, marginBottom:16 }}>Všetky úlohy sú splnené</div>
          {subTab === 'denné' ? (
            <div className="conf-text" style={{ fontSize:13, color:C.sub, textAlign:'center', lineHeight:1.7, background:'rgba(255,245,225,0.05)', borderRadius:14, padding:'12px 18px', border:`1px solid ${C.border}` }}>
              🌙 Denný zoznam sa automaticky resetuje<br />
              <span style={{ color:C.gold, fontWeight:700 }}>o polnoci</span> — nie je potrebný manuálny reset.<br />
              <span style={{ fontSize:11, color:C.muted }}>Ak chcete odoslať súhrn skôr, použite Resetovať zoznam.</span>
            </div>
          ) : (
            <div className="conf-text" style={{ fontSize:13, color:C.sub, textAlign:'center', lineHeight:1.7, background:'rgba(255,245,225,0.05)', borderRadius:14, padding:'12px 18px', border:`1px solid ${C.border}` }}>
              ♻️ Pre začatie nového cyklu<br />
              kliknite na <span style={{ color:C.gold, fontWeight:700 }}>Resetovať zoznam</span> nižšie.<br />
              <span style={{ fontSize:11, color:C.muted }}>Úlohy ostanú viditeľné ako splnené.</span>
            </div>
          )}
          <div className="conf-text" style={{ fontSize:11, color:C.muted, marginTop:20 }}>Klepni kdekoľvek pre pokračovanie</div>
        </div>
      )}

      {/* ── CONFIRM UNDO ─────────────────────────────────────────────────────── */}
      {confirmUndo && (
        <div onMouseDown={() => setConfirmUndo(null)} style={{ position:'fixed', inset:0, background:'rgba(6,4,2,.85)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:24 }}>
          <div onMouseDown={e => e.stopPropagation()} style={{ background:'#1a1510', border:`1px solid ${C.borderM}`, width:'100%', borderRadius:24, padding:'28px 22px 24px', boxShadow:'0 8px 40px rgba(0,0,0,.6)' }}>
            <div style={{ fontSize:32, textAlign:'center', marginBottom:14 }}>↩️</div>
            <div style={{ fontSize:16, fontWeight:800, color:C.text, textAlign:'center', marginBottom:8 }}>Zrušiť splnenie?</div>
            <div style={{ fontSize:13, color:C.sub, textAlign:'center', marginBottom:24, lineHeight:1.5 }}>
              Úloha <span style={{ color:C.gold, fontWeight:600 }}>„{confirmUndo.text}"</span> bude označená ako nesplnená.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onMouseDown={() => setConfirmUndo(null)} style={{ flex:1, padding:'13px', borderRadius:14, border:`1px solid ${C.border}`, background:'transparent', color:C.sub, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                Ponechať
              </button>
              <button onMouseDown={() => uncheckedTask(confirmUndo)} style={{ flex:1, padding:'13px', borderRadius:14, border:`1px solid ${C.err}44`, background:C.errDim, color:C.err, fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                Zrušiť splnenie
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM RESET HACCP ──────────────────────────────────────────────── */}
      {confirmResetHaccp && (
        <div onMouseDown={() => setConfirmResetHaccp(false)} style={{ position:'fixed', inset:0, background:'rgba(6,4,2,.85)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:24 }}>
          <div onMouseDown={e => e.stopPropagation()} style={{ background:'#1a1510', border:`1px solid ${C.borderM}`, width:'100%', borderRadius:24, padding:'28px 22px 24px', boxShadow:'0 8px 40px rgba(0,0,0,.6)' }}>
            <div style={{ fontSize:32, textAlign:'center', marginBottom:14 }}>🌙</div>
            <div style={{ fontSize:16, fontWeight:800, color:C.text, textAlign:'center', marginBottom:10 }}>Resetovať teplotný záznam?</div>
            <div style={{ fontSize:13, color:C.sub, textAlign:'center', marginBottom:24, lineHeight:1.7 }}>
              Upozornenie: záznam sa resetuje <span style={{ color:C.gold, fontWeight:700 }}>automaticky každú polnoc</span>.<br />
              Manuálny reset použite len ak bol záznam zadaný omylom.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onMouseDown={() => setConfirmResetHaccp(false)} style={{ flex:1, padding:'13px', borderRadius:14, border:`1px solid ${C.border}`, background:'transparent', color:C.sub, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Zrušiť</button>
              <button onMouseDown={() => {
                setLastHaccpDate('');
                setTemps(tempFields.reduce((a, f) => ({ ...a, [f.key]: '' }), {}));
                localStorage.setItem('foxford-haccp-date', '');
                setConfirmResetHaccp(false);
              }} style={{ flex:1, padding:'13px', borderRadius:14, border:`1px solid ${C.err}44`, background:C.errDim, color:C.err, fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Áno, resetovať</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM ADD TEMP DEVICE ──────────────────────────────────────────── */}
      {confirmAddTemp && (
        <div onMouseDown={() => setConfirmAddTemp(false)} style={{ position:'fixed', inset:0, background:'rgba(6,4,2,.85)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:24 }}>
          <div onMouseDown={e => e.stopPropagation()} style={{ background:'#1a1510', border:`1px solid ${C.borderM}`, width:'100%', borderRadius:24, padding:'28px 22px 24px', boxShadow:'0 8px 40px rgba(0,0,0,.6)' }}>
            <div style={{ fontSize:32, textAlign:'center', marginBottom:14 }}>🌡️</div>
            <div style={{ fontSize:16, fontWeight:800, color:C.text, textAlign:'center', marginBottom:10 }}>Pridať nové zariadenie?</div>
            <div style={{ fontSize:13, color:C.sub, textAlign:'center', marginBottom:24, lineHeight:1.6 }}>
              Chcete pridať nové zariadenie do teplotnej kontroly?
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onMouseDown={() => setConfirmAddTemp(false)} style={{ flex:1, padding:'13px', borderRadius:14, border:`1px solid ${C.border}`, background:'transparent', color:C.sub, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Zrušiť</button>
              <button onMouseDown={() => { setConfirmAddTemp(false); setShowAddTemp(true); }} style={{ flex:1, padding:'13px', borderRadius:14, border:`1px solid ${C.goldLine}`, background:C.goldDim, color:C.gold, fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Áno, pridať</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM REMOVE TEMP DEVICE ───────────────────────────────────────── */}
      {confirmRemoveTemp && (
        <div onMouseDown={() => setConfirmRemoveTemp(null)} style={{ position:'fixed', inset:0, background:'rgba(6,4,2,.85)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:24 }}>
          <div onMouseDown={e => e.stopPropagation()} style={{ background:'#1a1510', border:`1px solid ${C.borderM}`, width:'100%', borderRadius:24, padding:'28px 22px 24px', boxShadow:'0 8px 40px rgba(0,0,0,.6)' }}>
            <div style={{ fontSize:32, textAlign:'center', marginBottom:14 }}>🗑️</div>
            <div style={{ fontSize:16, fontWeight:800, color:C.text, textAlign:'center', marginBottom:10 }}>Odstrániť zariadenie?</div>
            <div style={{ fontSize:13, color:C.sub, textAlign:'center', marginBottom:24, lineHeight:1.6 }}>
              Zariadenie <span style={{ color:C.gold, fontWeight:700 }}>„{confirmRemoveTemp.label}"</span> bude odstránené zo zoznamu.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onMouseDown={() => setConfirmRemoveTemp(null)} style={{ flex:1, padding:'13px', borderRadius:14, border:`1px solid ${C.border}`, background:'transparent', color:C.sub, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Zrušiť</button>
              <button onMouseDown={() => {
                setTempFields(prev => prev.filter(f => f.key !== confirmRemoveTemp.key));
                setTemps(prev => { const n = { ...prev }; delete n[confirmRemoveTemp.key]; return n; });
                setConfirmRemoveTemp(null);
              }} style={{ flex:1, padding:'13px', borderRadius:14, border:`1px solid ${C.err}44`, background:C.errDim, color:C.err, fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Áno, odstrániť</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM RESET ────────────────────────────────────────────────────── */}
      {confirmReset && (
        <div onMouseDown={() => setConfirmReset(false)} style={{ position:'fixed', inset:0, background:'rgba(6,4,2,.85)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:24 }}>
          <div onMouseDown={e => e.stopPropagation()} style={{ background:'#1a1510', border:`1px solid ${C.borderM}`, width:'100%', borderRadius:24, padding:'28px 22px 24px', boxShadow:'0 8px 40px rgba(0,0,0,.6)' }}>
            <div style={{ fontSize:32, textAlign:'center', marginBottom:14 }}>⚠️</div>
            <div style={{ fontSize:16, fontWeight:800, color:C.text, textAlign:'center', marginBottom:10 }}>Resetovať zoznam?</div>
            <div style={{ fontSize:13, color:C.sub, textAlign:'center', lineHeight:1.65, marginBottom:24, padding:'0 4px' }}>
              Reset zoznamu sa robí <span style={{ color:C.gold, fontWeight:700 }}>iba na konci pracovného dňa</span>. Všetky splnené úlohy budú vymazané. Si si istý/á?
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onMouseDown={() => setConfirmReset(false)} style={{ flex:1, padding:'13px', borderRadius:14, border:`1px solid ${C.border}`, background:'transparent', color:C.sub, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                Zrušiť
              </button>
              <button onMouseDown={doReset} style={{ flex:1, padding:'13px', borderRadius:14, border:`1px solid ${C.err}44`, background:C.errDim, color:C.err, fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                Áno, resetovať
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ISSUE SHEET ───────────────────────────────────────────────────────── */}
      {quickTask && (
        <div onMouseDown={() => setQuickTask(null)} style={{ position:'fixed', inset:0, background:'rgba(6,4,2,.85)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', display:'flex', alignItems:'flex-end', zIndex:2000 }}>
          <div onMouseDown={e => e.stopPropagation()} style={{ background:'#1a1510', border:`1px solid ${C.borderM}`, width:'100%', borderTopLeftRadius:28, borderTopRightRadius:28, padding:'22px 18px 38px', boxShadow:'0 -8px 40px rgba(0,0,0,.6)' }}>
            <div style={{ width:32, height:3, background:C.muted, borderRadius:2, margin:'0 auto 20px' }} />
            <div style={{ fontSize:14, fontWeight:800, color:C.text, marginBottom:3 }}>Akcie pre úlohu</div>
            <div style={{ fontSize:12, color:C.sub, marginBottom:16, lineHeight:1.4 }}>{quickTask.text}</div>

            {/* Urgent toggle */}
            <button onMouseDown={e => {
              e.stopPropagation();
              setTasks({...tasks, [subTab]: tasks[subTab].map(x => x.id === quickTask.id ? {...x, urgent: !x.urgent} : x)});
              setQuickTask(null);
            }} style={{
              display:'block', width:'100%', padding:'14px 16px', marginBottom:7,
              borderRadius:14, border:`1px solid ${quickTask.urgent ? C.err+'55' : C.border}`,
              background: quickTask.urgent ? C.errDim : C.panel,
              textAlign:'left', fontSize:14, fontWeight:600,
              color: quickTask.urgent ? C.err : C.text,
              cursor:'pointer', fontFamily:'inherit',
            }}>{quickTask.urgent ? '✕ Zrušiť urgentnosť' : '⚡ Označiť ako urgentná'}</button>

            {/* Divider */}
            <div style={{ height:1, background:C.border, margin:'4px 0 10px' }} />
            <div style={{ fontSize:10, fontWeight:700, color:C.muted, letterSpacing:1, textTransform:'uppercase', marginBottom:8 }}>Nahlásiť problém</div>

            {['Chýba tovar / pomôcky','Pokazené zariadenie','Nedostatok času'].map(r => (
              <button key={r} onMouseDown={e => reportIssue(r,e)} style={{
                display:'block', width:'100%', padding:'13px 16px', marginBottom:6,
                borderRadius:14, border:`1px solid ${C.border}`, background:C.panel,
                textAlign:'left', fontSize:14, fontWeight:500, color:C.text,
                cursor:'pointer', fontFamily:'inherit',
              }}>{r}</button>
            ))}
            <div onMouseDown={e => e.stopPropagation()} style={{ marginBottom:6 }}>
              <Inp
                placeholder="Iný dôvod — napíš popis…"
                style={{ fontSize:13, marginBottom:6 }}
                onKeyDown={e => { if(e.key==='Enter' && e.target.value.trim()) reportIssue(e.target.value.trim()); }}
              />
              <button onMouseDown={e => {
                const inp = e.currentTarget.previousSibling;
                if(inp && inp.value.trim()) reportIssue(inp.value.trim(), e);
              }} style={{
                width:'100%', padding:'11px', borderRadius:12, border:`1px solid ${C.border}`,
                background:C.panel, textAlign:'left', fontSize:13, fontWeight:600,
                color:C.sub, cursor:'pointer', fontFamily:'inherit',
              }}>Potvrdiť vlastný dôvod</button>
            </div>

            {/* Delete */}
            <button onMouseDown={e => {
              e.stopPropagation();
              setTasks({...tasks, [subTab]: tasks[subTab].filter(x => x.id !== quickTask.id)});
              setQuickTask(null);
            }} style={{ display:'block', width:'100%', padding:'13px 16px', marginBottom:6, borderRadius:14, border:`1px solid ${C.err}33`, background:C.errDim, textAlign:'left', fontSize:14, fontWeight:700, color:C.err, cursor:'pointer', fontFamily:'inherit' }}>
              🗑 Zmazať úlohu
            </button>

            <button onMouseDown={() => setQuickTask(null)} style={{ display:'block', width:'100%', padding:'12px', marginTop:2, background:'none', border:'none', color:C.muted, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>Zrušiť</button>
          </div>
        </div>
      )}

      {/* ── ADD ITEM MODAL ────────────────────────────────────────────────────── */}
      {addingTo && (
        <div onMouseDown={() => setAddingTo(null)} style={{ position:'fixed', inset:0, background:'rgba(6,4,2,.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:20 }}>
          <div onMouseDown={e => e.stopPropagation()} style={{ background:'#1a1510', border:`1px solid ${C.borderM}`, width:'100%', borderRadius:24, padding:'24px 20px' }}>
            <div style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:18 }}>
              Pridať do: <span style={{ color:C.gold }}>{addingTo}</span>
            </div>
            <Inp placeholder="Názov položky…" value={newItemName} onChange={e => setNewItemName(e.target.value)} style={{ marginBottom:10 }} />
            <Inp placeholder="Jednotka (ks, kg, bal…)" value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)} style={{ marginBottom:10 }} />
            <Inp placeholder="PORTOS kód (napr. 7)" value={newItemCode} onChange={e => setNewItemCode(e.target.value)} style={{ marginBottom:20, fontSize:13 }} />
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <button onClick={() => setAddingTo(null)} style={{ flex:1, padding:'13px', borderRadius:12, border:`1px solid ${C.border}`, background:'transparent', color:C.sub, fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>Zrušiť</button>
              <button onClick={() => {
                if(newItemName.trim()){
                  setInvData(invData.map(g=>g.category===addingTo?{...g,items:[...g.items,{id:`c-${Date.now()}`,name:newItemName,unit:newItemUnit||'ks',portosCode:newItemCode.trim()}]}:g));
                  setNewItemName(''); setNewItemUnit(''); setNewItemCode('');
                }
              }} style={{ flex:1, padding:'13px', borderRadius:12, background:'transparent', border:`1px solid ${C.goldLine}`, color:C.gold, fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>
                + Ďalšia
              </button>
              <button onClick={() => {
                if(newItemName.trim()){
                  setInvData(invData.map(g=>g.category===addingTo?{...g,items:[...g.items,{id:`c-${Date.now()}`,name:newItemName,unit:newItemUnit||'ks',portosCode:newItemCode.trim()}]}:g));
                  setNewItemName(''); setNewItemUnit(''); setNewItemCode('');
                }
                setAddingTo(null);
              }} style={{ flex:2, padding:'13px', borderRadius:12, background:C.goldDim, border:`1px solid ${C.goldLine}`, color:C.gold, fontWeight:800, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>
                Pridať položku
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PIN MODAL ─────────────────────────────────────────────────────────── */}
      {pinStep && (
        <div style={{ position:'fixed', inset:0, background:'rgba(6,4,2,.92)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:4000, padding:24 }}>
          <div style={{ background:'#1a1510', border:`1px solid ${C.borderM}`, width:'100%', borderRadius:24, padding:'28px 20px', textAlign:'center' }}>
            <div style={{ fontSize:20, marginBottom:8 }}>🔒</div>
            <div style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:4 }}>Zadaj PIN</div>
            <div style={{ fontSize:12, color:C.sub, marginBottom:20 }}>Pre zmenu prevádzky je potrebný manažérsky PIN.</div>
            <input type="password" inputMode="numeric" maxLength={4} value={pinInput}
              onChange={e => { setPinInput(e.target.value); setPinError(false); }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  if (pinInput === BRANCH_PIN) { setPinStep(false); setShowBranchSelect(true); setPinInput(''); }
                  else { setPinError(true); setPinInput(''); }
                }
              }}
              autoFocus
              style={{ width:'100%', padding:'14px', borderRadius:12, border:`1px solid ${pinError ? C.err : C.border}`, background:'rgba(255,245,225,.04)', color:C.text, fontSize:22, outline:'none', fontFamily:'inherit', textAlign:'center', letterSpacing:8, boxSizing:'border-box' }}
              placeholder="••••" />
            {pinError && <div style={{ fontSize:12, color:C.err, marginTop:8 }}>Nesprávny PIN</div>}
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button onClick={() => { setPinStep(false); setPinInput(''); }} style={{ flex:1, padding:'13px', borderRadius:12, border:`1px solid ${C.border}`, background:'transparent', color:C.sub, fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>Zrušiť</button>
              <button onClick={() => {
                if (pinInput === BRANCH_PIN) { setPinStep(false); setShowBranchSelect(true); setPinInput(''); }
                else { setPinError(true); setPinInput(''); }
              }} style={{ flex:2, padding:'13px', borderRadius:12, background:C.goldDim, border:`1px solid ${C.goldLine}`, color:C.gold, fontWeight:800, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>Potvrdiť</button>
            </div>
          </div>
        </div>
      )}

      {/* ── BRANCH SELECT MODAL ───────────────────────────────────────────────── */}
      {showBranchSelect && (
        <div style={{ position:'fixed', inset:0, background:'rgba(6,4,2,.95)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:4000, padding:24 }}>
          <div style={{ width:'100%', maxWidth:460 }}>
            <div style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:4, textAlign:'center' }}>Vyber prevádzku</div>
            <div style={{ fontSize:12, color:C.sub, marginBottom:20, textAlign:'center' }}>Aktuálna: <span style={{ color:C.gold }}>{branch}</span></div>
            {BRANCHES.map(b => (
              <button key={b.name} onClick={() => { localStorage.setItem('foxford-branch', b.name); setBranch(b.name); setShowBranchSelect(false); }}
                style={{ width:'100%', padding:'15px 16px', marginBottom:8, borderRadius:14, border:`1px solid ${b.name === branch ? C.goldLine : C.border}`, background: b.name === branch ? C.goldDim : C.panel, color: b.name === branch ? C.gold : C.text, fontSize:14, fontWeight: b.name === branch ? 700 : 500, cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
                🏪 {b.name}
              </button>
            ))}
            <button onClick={() => setShowBranchSelect(false)} style={{ width:'100%', padding:'13px', marginTop:4, borderRadius:12, border:`1px solid ${C.border}`, background:'transparent', color:C.sub, fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>Zrušiť</button>
          </div>
        </div>
      )}

      {/* ── MISSING QTY WARNING ───────────────────────────────────────────────── */}
      {missingWarning.length > 0 && (
        <div style={{ position:'fixed', inset:0, background:'rgba(6,4,2,.92)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2500, padding:20 }}>
          <div style={{ background:'#1a1510', border:`1px solid ${C.errDim}`, width:'100%', borderRadius:24, padding:'24px 20px' }}>
            <div style={{ fontSize:18, marginBottom:8 }}>⚠️</div>
            <div style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:6 }}>Chýbajú množstvá</div>
            <div style={{ fontSize:12, color:C.sub, marginBottom:14 }}>Tieto položky nemajú vyplnené množstvo:</div>
            <div style={{ marginBottom:18, maxHeight:160, overflowY:'auto' }}>
              {missingWarning.map(item => (
                <div key={item.id} style={{ fontSize:12, color:C.err, padding:'4px 0', borderBottom:`1px solid ${C.border}` }}>• {item.name}</div>
              ))}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setMissingWarning([])} style={{ flex:1, padding:'13px', borderRadius:12, border:`1px solid ${C.border}`, background:'transparent', color:C.sub, fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>Späť</button>
              <button onClick={() => {
                setMissingWarning([]);
                const allItems = invData.flatMap(g => g.items).filter(item => invQty[item.id]);
                sendToSheets('inventory', {
                  date: new Date().toLocaleDateString('sk-SK'),
                  month: `${selectedMonth} ${new Date().getFullYear()}`,
                  inspector: controllerName || 'Anonym',
                  items: allItems.map(item => ({ name: item.name, unit: item.unit, qty: invQty[item.id], note: invNotes[item.id] || '' })),
                });
                setSuccess(true);
              }} style={{ flex:2, padding:'13px', borderRadius:12, background:C.goldDim, border:`1px solid ${C.goldLine}`, color:C.gold, fontWeight:800, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>
                Odoslať aj tak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SUCCESS ───────────────────────────────────────────────────────────── */}
      {success && (
        <div onClick={() => setSuccess(false)} style={{ position:'fixed', inset:0, background:'rgba(6,4,2,.97)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:3000, cursor:'pointer', overflow:'hidden' }}>
          {/* confetti particles */}
          {Array.from({length:30}).map((_,i) => (
            <div key={i} style={{
              position:'absolute',
              left: `${Math.random()*100}%`,
              top: '-20px',
              width: 8, height: 8,
              borderRadius: i%3===0 ? '50%' : 2,
              background: ['#e0a03a','#4caf50','#2196f3','#e91e63','#ff9800'][i%5],
              animation: `confettiFall ${1.5+Math.random()*2}s ${Math.random()*1}s ease-in forwards`,
              transform: `rotate(${Math.random()*360}deg)`,
            }} />
          ))}
          <style>{`
            @keyframes confettiFall {
              0%   { transform: translateY(0) rotate(0deg); opacity:1; }
              100% { transform: translateY(110vh) rotate(720deg); opacity:0; }
            }
            @keyframes popIn {
              0%   { transform: scale(0.3); opacity:0; }
              70%  { transform: scale(1.15); }
              100% { transform: scale(1); opacity:1; }
            }
          `}</style>
          <div style={{ animation:'popIn 0.5s ease forwards', display:'flex', flexDirection:'column', alignItems:'center' }}>
            <div style={{ fontSize:60, marginBottom:10 }}>🎉</div>
            <div style={{ width:80, height:80, borderRadius:'50%', background:C.okDim, border:`2px solid ${C.ok}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, marginBottom:20, boxShadow:`0 0 30px ${C.ok}55` }}>✓</div>
            <div style={{ fontSize:22, fontWeight:900, color:C.text, letterSpacing:3 }}>INVENTÚRA ODOSLANÁ!</div>
            <div style={{ marginTop:12, color:C.sub, fontSize:13, textAlign:'center', maxWidth:260, lineHeight:1.6 }}>
              Údaje zostávajú zapísané až do začatia novej inventúry.
            </div>
            <div style={{ marginTop:24, color:C.muted, fontSize:11 }}>klikni kdekoľvek pre zatvorenie</div>
          </div>
        </div>
      )}
    </div>
  );
}
