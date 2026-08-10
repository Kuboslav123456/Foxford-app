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
  // Poslúchaj správy od SW (napr. po aktivácii novej verzie)
  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data && e.data.type === 'SW_UPDATED') {
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
const APP_VERSION = 53;

window.addEventListener('load', () => {
  // Oneskorenie 2s aby sa app stihla vyrenderovať pred prípadným reload-om
  setTimeout(() => {
    // timestamp v URL = unikátny kľúč → SW nikdy nemá v cache → vždy ide na sieť
    fetch(`${process.env.PUBLIC_URL}/version.json?t=${Date.now()}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (typeof data.v === 'number' && data.v > APP_VERSION) {
          // Poistka proti nekonečnému reloadu: keby sa `version.json` a APP_VERSION
          // v builde rozišli (bump len na jednom mieste), appka by sa reloadovala
          // dokola a v nainštalovanej PWA by to vyzeralo ako nefunkčná appka.
          // sessionStorage → v rámci behu skúsime raz, po novom spustení znova.
          try {
            if (sessionStorage.getItem('foxford-update-reload') === String(data.v)) return;
            sessionStorage.setItem('foxford-update-reload', String(data.v));
          } catch (_) {}

          // Nová verzia na serveri — NEmažeme cache ani neodregistrujeme SW.
          // Navigácia je v SW network-first, takže reload stiahne nový index.html
          // a s ním aj nové hashované súbory. Predtým sa tu mazalo úplne všetko;
          // appka potom nabiehala s prázdnou cache a keď v tej chvíli zakolísala
          // sieť (typicky tablet po prebudení), nemala sa z čoho načítať —
          // v nainštalovanej PWA to vyzeralo ako nenávratná porucha.
          (async () => {
            try {
              if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.getRegistration();
                if (reg) await reg.update();
              }
            } catch (_) {}
            window.location.reload();
          })();
        }
      })
      .catch(() => {});
  }, 2000);
});
