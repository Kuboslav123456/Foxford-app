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

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz8hPYERqRh-sUw-fHkwYlJAqlBal9_d97JNn9XLApsRBh5K4dp-1Hl5SBSPgh43Jcm/exec';
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

const TEMP_FIELDS = [
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
  const [temps, setTemps]           = useState({ vitrina: '', chladnicka: '', sklad: '' });
  const [controllerName, setControllerName] = useState('');
  const [selectedMonth, setSelectedMonth]   = useState(MONTHS[new Date().getMonth()]);
  const [invData, setInvData]   = useState(() => JSON.parse(localStorage.getItem('foxford-inventory-data')) || INIT_INV);
  const [invQty, setInvQty]     = useState(() => JSON.parse(localStorage.getItem('foxford-inventory'))       || {});
  const [invNotes, setInvNotes] = useState(() => JSON.parse(localStorage.getItem('foxford-inventory-notes')) || {});
  const [newCat, setNewCat]     = useState('');
  const [addingTo, setAddingTo] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');
  const [notes, setNotes]   = useState(() => JSON.parse(localStorage.getItem('foxford-notes')) || []);
  const [newNote, setNewNote] = useState('');
  const [noteAuthor, setNoteAuthor] = useState('');
  const [celebrate, setCelebrate] = useState(false);
  const [sending, setSending]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [shakeName, setShakeName] = useState(false);
  const [shakeInsp, setShakeInsp] = useState(false);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 500); return () => clearTimeout(t); }, []);
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  useEffect(() => {
    localStorage.setItem('foxford-tasks',           JSON.stringify(tasks));
    localStorage.setItem('foxford-batch',           batchTime || '');
    localStorage.setItem('foxford-last-reset-date', new Date().toDateString());
    localStorage.setItem('foxford-inspectors',      JSON.stringify(inspectors));
    localStorage.setItem('foxford-inventory-data',  JSON.stringify(invData));
    localStorage.setItem('foxford-inventory',       JSON.stringify(invQty));
    localStorage.setItem('foxford-inventory-notes', JSON.stringify(invNotes));
    localStorage.setItem('foxford-notes',           JSON.stringify(notes));
  }, [tasks, batchTime, inspectors, invData, invQty, invNotes, notes]);

  const sendToSheets = (type, payload) => {
    if (!navigator.onLine) return;
    fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, ...payload }),
    }).catch(console.error);
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

  const onTaskClick = (t) => {
    if (longPress.current || swipeOff > 10) { longPress.current = false; return; }
    if (!needInsp()) return;
    if (t.done) { setConfirmUndo(t); return; }
    const time = new Date().toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
    const updated = tasks[subTab].map(x => x.id === t.id ? { ...x, done: true, time, issue: null } : x);
    setTasks({ ...tasks, [subTab]: updated });
    if (updated.every(x => x.done)) setTimeout(() => setCelebrate(true), 300);
  };

  const longStart = (t) => {
    longPress.current = false;
    timerRef.current = setTimeout(() => { if (swipeOff < 10) { longPress.current = true; setQuickTask(t); } }, 600);
  };
  const longEnd = () => { if (timerRef.current) clearTimeout(timerRef.current); };

  const reportIssue = (reason, e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!needInsp()) { setQuickTask(null); return; }
    setTasks({ ...tasks, [subTab]: tasks[subTab].map(x => x.id === quickTask.id ? { ...x, done: false, time: null, issue: reason } : x) });
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
        tasks: taskList.map(t => ({ text: t.text, done: t.done })),
      });
    }
    setTasks({ ...tasks, [subTab]: tasks[subTab].map(t => ({ ...t, done: false, time: null, issue: null })) });
    if (subTab === 'denné') setBatchTime(null);
    setConfirmReset(false);
  };

  const tempColor = (key, val) => {
    const n = parseFloat((val || '').replace(',', '.'));
    if (isNaN(n) || val === '') return null;
    return (key === 'vitrina' && n > 8) || (key === 'chladnicka' && n > 5) || (key === 'sklad' && n > 25) ? 'err' : 'ok';
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
              <Inp ref={inspRef} type="text" placeholder="Meno baristu…"
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
                    {t.done && <span style={{ fontSize:11, fontWeight:700, color:C.ok, flexShrink:0 }}>{t.time}</span>}
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
              <Tag text="Meno baristu" />
              <Inp ref={nameRef} type="text" placeholder="Zadaj meno…" value={controllerName}
                onChange={e => setControllerName(e.target.value)} shake={shakeName}
                style={{ marginTop:7, borderColor: controllerName ? C.ok : C.border }} />
            </Glass>

            <Glass style={{ padding:'18px 16px 20px' }}>
              <div style={{ fontSize:12, fontWeight:700, letterSpacing:1, color:C.sub, textTransform:'uppercase', marginBottom:20 }}>HACCP — Teplotná kontrola</div>

              {TEMP_FIELDS.map(({ key, label, max }) => {
                const val = temps[key];
                const status = tempColor(key, val);
                const accentColor = status === 'ok' ? C.ok : status === 'err' ? C.err : C.border;
                return (
                  <div key={key} style={{ marginBottom:16 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
                      <span style={{ fontSize:12, fontWeight:700, letterSpacing:.5, color: status ? accentColor : C.sub, textTransform:'uppercase' }}>{label}</span>
                      <span style={{ fontSize:10, color:C.muted }}>{max}</span>
                    </div>
                    <div style={{ position:'relative' }}>
                      <input type="text" placeholder="0.0" value={val}
                        onChange={e => setTemps({ ...temps, [key]: e.target.value })}
                        style={{
                          width:'100%', padding:'16px', borderRadius:14,
                          border:`1.5px solid ${accentColor}`,
                          background: status === 'ok' ? C.okDim : status === 'err' ? C.errDim : C.panel,
                          color: status ? accentColor : C.text,
                          fontSize:26, fontWeight:800, textAlign:'center', letterSpacing:2,
                          outline:'none', boxSizing:'border-box', fontFamily:'inherit',
                          boxShadow: status ? `0 0 16px ${accentColor}33` : 'none',
                        }} />
                      {status && (
                        <div style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', fontSize:16 }}>
                          {status === 'ok' ? '✓' : '⚠'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              <button disabled={sending} onClick={() => {
                if (!needName()) return;
                setSending(true);
                sendToSheets('haccp', {
                  date: new Date().toLocaleDateString('sk-SK'),
                  vitrina: temps.vitrina,
                  chladnicka: temps.chladnicka,
                  sklad: temps.sklad,
                  podpis: controllerName || 'Anonym',
                });
                setTimeout(() => {
                  setSending(false); setSuccess(true); setTemps({ vitrina:'', chladnicka:'', sklad:'' });
                  const today = new Date().toDateString();
                  setLastHaccpDate(today);
                  localStorage.setItem('foxford-haccp-date', today);
                }, 900);
              }} style={{
                width:'100%', padding:'15px', marginTop:4,
                background: C.goldDim, border:`1px solid ${C.goldLine}`,
                color:C.gold, borderRadius:14, fontWeight:800, fontSize:14,
                letterSpacing:.8, cursor:'pointer', fontFamily:'inherit',
                opacity: sending ? .7 : 1,
              }}>
                {sending ? 'Odosielam…' : 'Odoslať kontrolu'}
              </button>
            </Glass>
          </>
        )}

        {/* ── INVENTORY ────────────────────────────────────────────────────── */}
        {tab === 'inventory' && (
          <>
            <Glass accent style={{ padding:'14px 16px' }}>
              <Tag text="Meno baristu" />
              <Inp ref={nameRef} type="text" placeholder="Zadaj meno…" value={controllerName}
                onChange={e => setControllerName(e.target.value)} shake={shakeName}
                style={{ marginTop:7, marginBottom:14, borderColor: controllerName ? C.ok : C.border }} />
              <Tag text="Mesiac inventúry" />
              <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                style={{ width:'100%', marginTop:7, padding:'12px 14px', borderRadius:12, border:`1px solid ${C.border}`, background:'rgba(255,245,225,.04)', color:C.text, fontSize:15, outline:'none', fontFamily:'inherit', cursor:'pointer' }}>
                {MONTHS.map(m => <option key={m} style={{ background:'#1a1510' }}>{m}</option>)}
              </select>
            </Glass>

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
                          <div style={{ display:'flex', gap:7 }}>
                            <Inp type="text" placeholder={item.unit||'qty'} value={invQty[item.id]||''}
                              onChange={e => setInvQty({...invQty,[item.id]:e.target.value})}
                              style={{ flex:'0 0 70px', padding:'9px 8px', textAlign:'center', fontWeight:700, fontSize:14 }} />
                            <Inp type="text" placeholder="Poznámka…" value={invNotes[item.id]||''}
                              onChange={e => setInvNotes({...invNotes,[item.id]:e.target.value})}
                              style={{ flex:1, padding:'9px 10px', fontSize:12, borderStyle:'dashed' }} />
                          </div>
                        </div>
                      ))}
                      {items.length===0 && <div style={{ color:C.muted, fontSize:12, padding:'6px 0', textAlign:'center' }}>Žiadne položky</div>}
                    </div>
                  )}
                </Glass>
              );
            })}

            {/* Add category */}
            <Glass style={{ padding:'14px 16px', border:`1px dashed ${C.goldLine}` }}>
              <Inp placeholder="Nová kategória…" value={newCat} onChange={e => setNewCat(e.target.value)} style={{ marginBottom:9 }} />
              <button onClick={() => { if(newCat.trim()){setInvData([...invData,{category:newCat,items:[]}]);setNewCat('');} }}
                style={{ width:'100%', padding:'11px', background:C.panel, border:`1px solid ${C.border}`, color:C.text, borderRadius:12, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                + Pridať kategóriu
              </button>
            </Glass>

            <button onClick={() => {
              if (!needName()) return;
              const allItems = invData.flatMap(g => g.items).filter(item => invQty[item.id]);
              sendToSheets('inventory', {
                date: new Date().toLocaleDateString('sk-SK'),
                month: selectedMonth,
                inspector: controllerName || 'Anonym',
                items: allItems.map(item => ({
                  name: item.name,
                  unit: item.unit,
                  qty: invQty[item.id],
                  note: invNotes[item.id] || '',
                })),
              });
              setInvQty({});
              setInvNotes({});
              setSuccess(true);
            }} style={{
              width:'100%', padding:'16px', marginBottom:8, borderRadius:14,
              background:C.goldDim, border:`1px solid ${C.goldLine}`,
              color:C.gold, fontWeight:800, fontSize:14, letterSpacing:.8,
              cursor:'pointer', fontFamily:'inherit',
            }}>
              Odoslať inventúru
            </button>
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

      {/* ── CELEBRATION ──────────────────────────────────────────────────────── */}
      {celebrate && (
        <div onClick={() => setCelebrate(false)} style={{ position:'fixed', inset:0, background:'rgba(6,4,2,.96)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:3000, cursor:'pointer' }}>
          <style>{`
            @keyframes pop  { 0%{transform:scale(.4);opacity:0} 70%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
            @keyframes fall { 0%{transform:translateY(-20px);opacity:0} 100%{transform:translateY(0);opacity:1} }
            @keyframes spin2 { to{transform:rotate(360deg)} }
            .conf-ring { animation: pop .5s cubic-bezier(.17,.67,.38,1.4) both; }
            .conf-text { animation: fall .4s .35s ease both; }
          `}</style>
          <div className="conf-ring" style={{ width:110, height:110, borderRadius:'50%', border:`3px solid ${C.ok}`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 40px ${C.ok}55, 0 0 80px ${C.ok}22`, marginBottom:28 }}>
            <span style={{ fontSize:52 }}>🎉</span>
          </div>
          <div className="conf-text" style={{ fontSize:26, fontWeight:900, color:C.text, letterSpacing:2, marginBottom:8 }}>Hotovo!</div>
          <div className="conf-text" style={{ fontSize:14, color:C.ok, fontWeight:600, marginBottom:6 }}>Všetky úlohy sú splnené</div>
          <div className="conf-text" style={{ fontSize:12, color:C.muted, marginTop:4 }}>Klepni kdekoľvek pre pokračovanie</div>
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

            {['Chýba tovar / pomôcky','Pokazené zariadenie','Nedostatok času','Iný dôvod'].map(r => (
              <button key={r} onMouseDown={e => reportIssue(r,e)} style={{
                display:'block', width:'100%', padding:'13px 16px', marginBottom:6,
                borderRadius:14, border:`1px solid ${C.border}`, background:C.panel,
                textAlign:'left', fontSize:14, fontWeight:500, color:C.text,
                cursor:'pointer', fontFamily:'inherit',
              }}>{r}</button>
            ))}

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
            <Inp placeholder="Jednotka (ks, kg, bal…)" value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)} style={{ marginBottom:20 }} />
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setAddingTo(null)} style={{ flex:1, padding:'13px', borderRadius:12, border:`1px solid ${C.border}`, background:'transparent', color:C.sub, fontWeight:700, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>Zrušiť</button>
              <button onClick={() => {
                if(newItemName.trim()){
                  setInvData(invData.map(g=>g.category===addingTo?{...g,items:[...g.items,{id:`c-${Date.now()}`,name:newItemName,unit:newItemUnit||'ks'}]}:g));
                  setNewItemName(''); setNewItemUnit(''); setAddingTo(null);
                }
              }} style={{ flex:2, padding:'13px', borderRadius:12, background:C.goldDim, border:`1px solid ${C.goldLine}`, color:C.gold, fontWeight:800, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>
                Pridať položku
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SUCCESS ───────────────────────────────────────────────────────────── */}
      {success && (
        <div onClick={() => setSuccess(false)} style={{ position:'fixed', inset:0, background:'rgba(6,4,2,.97)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:3000, cursor:'pointer' }}>
          <div style={{ width:80, height:80, borderRadius:'50%', background:C.okDim, border:`2px solid ${C.ok}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, marginBottom:20, boxShadow:`0 0 30px ${C.ok}55` }}>✓</div>
          <div style={{ fontSize:20, fontWeight:900, color:C.text, letterSpacing:3 }}>ODOSLANÉ</div>
          <div style={{ marginTop:8, color:C.muted, fontSize:12 }}>Dáta boli uložené.</div>
        </div>
      )}
    </div>
  );
}
