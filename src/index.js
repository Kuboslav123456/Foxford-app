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
const APP_VERSION = 31;

window.addEventListener('load', () => {
  // Oneskorenie 2s aby sa app stihla vyrenderovať pred prípadným reload-om
  setTimeout(() => {
    // timestamp v URL = unikátny kľúč → SW nikdy nemá v cache → vždy ide na sieť
    fetch(`${process.env.PUBLIC_URL}/version.json?t=${Date.now()}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (typeof data.v === 'number' && data.v > APP_VERSION) {
          // Nová verzia na serveri — vyčisti SW + caches a reload
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
            window.location.reload(true);
          })();
        }
      })
      .catch(() => {});
  }, 2000);
});
