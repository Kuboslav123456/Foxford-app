// ═══════════════════════════════════════════════════════════════════════════
// Jednorazový import histórie z OBRATOVEJ TABUĽKY (database.json) do Supabase
// uzavierky_log — pobočka Obchodná, roky 2023–2026.
//
// Spustenie:  node supabase/import-obraty.mjs "C:/cesta/k/database.json"
// Kľúče číta z .env.local (REACT_APP_SUPABASE_URL / _ANON_KEY) — anon smie
// podľa RLS iba vkladať, presne to import potrebuje.
//
// Riadky sú označené meno='import OBRATY' a data.zdroj='obraty-import',
// aby sa dali kedykoľvek rozoznať alebo zmazať:
//   delete from uzavierky_log where meno = 'import OBRATY';
// ═══════════════════════════════════════════════════════════════════════════
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const tu = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(join(tu, '..', '.env.local'), 'utf8');
const cfg = Object.fromEntries(env.split(/\r?\n/).filter(l => l.includes('=') && !l.startsWith('#')).map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const URL_ = (cfg.REACT_APP_SUPABASE_URL || '').replace(/\/$/, '');
const KEY = cfg.REACT_APP_SUPABASE_ANON_KEY || '';
if (!URL_ || !KEY) { console.error('Chýbajú kľúče v .env.local'); process.exit(1); }

// Živý zdroj: Apps Script hárku "Uzávierky" Obchodnej (má aj najnovšie dni).
// Pri prekrytí má PREDNOSŤ živý Sheet (database.json je len historická záloha).
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbwjU6Tls4O2eESssvusbbpU5Lhivj7GfoGWmBZrD-zAwy8RTXHpJTa4hOYsygIy6i7h/exec';

const dbPath = process.argv[2];
if (!dbPath) { console.error('Použitie: node import-obraty.mjs <cesta k database.json> [--no-sheet]'); process.exit(1); }
const db = JSON.parse(readFileSync(dbPath, 'utf8'));

// Spojenie: historická záloha + živý Sheet (Sheet prepisuje rovnaké dni)
const merged = {};
Object.keys(db).forEach(day => { merged[day] = { ...db[day].fxf }; });
let sheetDni = 0;
if (!process.argv.includes('--no-sheet')) {
  const res = await fetch(SHEET_URL, { redirect: 'follow' });
  const gs = JSON.parse(await res.text());
  if (gs.error) { console.error('Sheet chyba:', gs.error); process.exit(1); }
  Object.keys(gs).forEach(day => { merged[day] = { ...gs[day].fxf }; sheetDni++; });
  console.log(`Zo živého Sheetu: ${sheetDni} dní (prekrývajúce prepísané novšou verziou)`);
}

const rows = Object.keys(merged).sort().map(day => ({
  branch: 'Obchodná',
  day,
  kasa: 'FXF',
  meno: 'import OBRATY',
  data: { ...merged[day], zdroj: 'obraty-import' },
}));
console.log(`Pripravených ${rows.length} dní (${rows[0]?.day} → ${rows[rows.length - 1]?.day})`);

const BATCH = 400;
let ok = 0;
for (let i = 0; i < rows.length; i += BATCH) {
  const batch = rows.slice(i, i + BATCH);
  const res = await fetch(`${URL_}/rest/v1/uzavierky_log`, {
    method: 'POST',
    headers: { apikey: KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(batch),
  });
  if (!res.ok) {
    console.error(`Dávka ${i / BATCH + 1} zlyhala (${res.status}):`, (await res.text()).slice(0, 300));
    process.exit(1);
  }
  ok += batch.length;
  console.log(`  ✓ ${ok}/${rows.length}`);
}
console.log('Import hotový.');
