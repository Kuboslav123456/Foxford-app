import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();

// ── Núdzový reset cez ?reset=1 ───────────────────────────────────────────────
if (new URLSearchParams(window.location.search).get('reset') === '1') {
  (async () => {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
    } catch (_) {}
    const url = new URL(window.location.href);
    url.searchParams.delete('reset');
    window.location.replace(url.toString());
  })();
} else if ('serviceWorker' in navigator) {
  // Poslúchaj správy od SW (napr. po aktivácii novej verzie).
  // Reload len v rannom okne — cez deň by to obsluhe spadlo do rozrobenej práce.
  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data && e.data.type === 'SW_UPDATED' && inUpdateWindow()) {
      window.location.reload();
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${process.env.PUBLIC_URL}/service-worker.js`).catch(() => {});
  });
}

// ── Automatická detekcia novej verzie ────────────────────────────────────────
// APP_VERSION musí zodpovedať "v" v public/version.json.
// Keď deployuješ novú verziu: zvýš číslo TU aj v public/version.json.
const APP_VERSION = 59;

// Aktualizácia sa NEaplikuje hocikedy — reload uprostred zmeny by obsluhe zhodil
// rozpísanú inventúru či odpis. Appka novú verziu iba zaznamená a nainštaluje ju
// v tomto rannom okne (hodina 5:00–5:59), keď v prevádzke nikto nepracuje.
// Cez deň sa dá aktualizovať ručne v ozubenom koliesku.
const UPDATE_HOUR = 5;
const CHECK_INTERVAL_MS = 15 * 60 * 1000;

// Pre UI — appka zobrazuje verziu v ozubenom koliesku, nech sa dá overiť,
// či sa zariadenie aktualizovalo (a či ranné okno naozaj funguje).
window.FOXFORD_VERSION = APP_VERSION;
window.FOXFORD_UPDATE_HOUR = UPDATE_HOUR;

function inUpdateWindow() {
  return new Date().getHours() === UPDATE_HOUR;
}

async function applyUpdate() {
  // NEmažeme cache ani neodregistrujeme SW. Navigácia je v SW network-first,
  // takže reload stiahne nový index.html a s ním aj nové hashované súbory.
  // Kedysi sa tu mazalo úplne všetko; appka potom nabiehala s prázdnou cache
  // a keď v tej chvíli zakolísala sieť (typicky tablet po prebudení), nemala
  // sa z čoho načítať — v nainštalovanej PWA to vyzeralo ako nenávratná porucha.
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) await reg.update();
    }
  } catch (_) {}
  window.location.reload();
}

// Ručná aktualizácia z UI (ozubené koliesko) — obchádza ranné okno zámerne.
window.foxfordApplyUpdate = applyUpdate;

function checkVersion() {
  // timestamp v URL = unikátny kľúč → SW nikdy nemá v cache → vždy ide na sieť
  fetch(`${process.env.PUBLIC_URL}/version.json?t=${Date.now()}`, { cache: 'no-store' })
    .then(r => r.json())
    .then(data => {
      if (typeof data.v !== 'number' || data.v <= APP_VERSION) return;

      // Nech o čakajúcej verzii vie UI (bodka na koliesku + tlačidlo v modáli)
      window.FOXFORD_PENDING_UPDATE = data.v;
      window.dispatchEvent(new CustomEvent('foxford-update-pending', { detail: data.v }));

      if (!inUpdateWindow()) return;   // cez deň sa nič nedeje, čaká sa na 5:00

      // Poistka proti nekonečnému reloadu: keby sa `version.json` a APP_VERSION
      // v builde rozišli (bump len na jednom mieste), appka by sa reloadovala
      // dokola a v nainštalovanej PWA by to vyzeralo ako nefunkčná appka.
      // sessionStorage → v rámci behu skúsime raz, po novom spustení znova.
      try {
        if (sessionStorage.getItem('foxford-update-reload') === String(data.v)) return;
        sessionStorage.setItem('foxford-update-reload', String(data.v));
      } catch (_) {}

      applyUpdate();
    })
    .catch(() => {});
}

window.addEventListener('load', () => {
  // Oneskorenie 2s aby sa app stihla vyrenderovať pred prípadným reload-om
  setTimeout(checkVersion, 2000);
  // Opakovane, aby tablet bežiaci nonstop ranné okno vôbec zachytil
  setInterval(checkVersion, CHECK_INTERVAL_MS);
});
