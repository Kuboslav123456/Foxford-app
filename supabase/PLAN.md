# Foxford → Supabase: migračný plán

Rozhodnutie 2026-09-02: primárnou databázou bude **Supabase (Postgres, EÚ región)**.
Google Sheets ostávajú počas prechodu zdrojom pravdy a dlhodobo minimálne pre
účtovníctvo/OBRATY (uzávierky). Appka bude prechodne zapisovať do OBOCH (dual-write).

## Fázy

**Fáza 0 — projekt (Jakub, ~5 min)**
1. supabase.com → prihlásiť sa (GitHub alebo firemný e-mail)
2. New project → názov `foxford` → Database password: vygenerovať a ULOŽIŤ do firemných hesiel
   → Region: **Central EU (Frankfurt)** → Create project (Free plan)
3. SQL Editor → vložiť celý `supabase/schema.sql` → Run
4. Project Settings → API → poslať Claudovi **Project URL** + **anon public** kľúč
   ⚠️ `service_role` kľúč NIKDY neposielať ani nevkladať do appky — je to master kľúč,
   patrí len do server-side nástrojov (reporting, migrácie).

**Fáza 1 — pilot: odpisy (dual-write)**
- App: `@supabase/supabase-js` + tenký adaptér (`saveOdpis(...)` → insert do `odpisy_log`
  POPRI doterajšom `sendOrQueue` do GAS). Feature flag, offline fronta zdieľaná s GAS sendom.
- Dátumy do DB v ISO (`localDayKey`), množstvá normalizované na number (`,` → `.`).
- Validácia ~1 týždeň na Obchodnej: riadky v Supabase == riadky v Sheets.

**Fáza 2 — zvyšné eventy**
- tasks_summary, haccp, inventory, alkohol_daily, uzavierka_daily, bug_report → rovnaký vzor.
- Sheets dual-write ostáva (účtovníctvo, OBRATY číta Uzávierky zo Sheets).

**Fáza 3 — prihlásenie tabletov + zálohy**
- Supabase Auth: účet per pobočka (custom claim `branch`), tablet sa prihlási raz pri nastavení.
- RLS prepnúť z anon-insert na per-branch policies (naznačené v schema.sql).
- Tabuľka `backups` + presun ☁ zálohy/obnovy z GAS do Supabase (zálohy obsahujú citlivé
  dáta → výhradne za prihlásením, nikdy cez anon).

**Fáza 4 — reporting**
- Looker Studio / Metabase priamo na Postgres (read-only DB user) — dashboardy bez programovania.
- Neskôr manažérska appka (rola `manager` = select nad všetkými pobočkami).

## Bezpečnostný model (pilot)
- `anon` kľúč je verejný zámerne (bude v bundle ako dnes GAS token) — smie IBA vkladať riadky.
- Čítanie cez anon je úplne zakázané (žiadne select policies) → nič sa nedá stiahnuť.
- Najhorší scenár zneužitia = smetné riadky (rovnaké riziko ako dnešný GAS token), riešiteľné
  neskôr fázou 3 (per-branch auth) — potom sa anon insert vypne úplne.

## Poznámky
- Free tier: 500 MB DB (roky dát pri tomto objeme), projekt sa pauzne po 7 dňoch bez requestov
  — pri dennej prevádzke nehrozí; pri dlhšej celofiremnej odstávke treba raz za týždeň otvoriť appku.
- `ean` vždy text (nie číslo) — inak sa stratia úvodné nuly.
- Uzávierky: append-only, „posledná platná" = max(created_at) pre (branch, day, kasa).
