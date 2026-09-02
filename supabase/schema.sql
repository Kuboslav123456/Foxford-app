-- ═══════════════════════════════════════════════════════════════════════════
-- FOXFORD — Supabase schéma v1 (pilot)
--
-- POUŽITIE: Supabase → SQL Editor → vlož celý súbor → Run.
-- Bezpečné spustiť aj opakovane (if not exists / on conflict do nothing).
--
-- Model pilotu: appka (tablety) smie cez verejný anon kľúč IBA VKLADAŤ riadky
-- (append-only, ako dnes Sheets). Čítať sa cez anon kľúč nedá NIČ — dáta vidno
-- len v Supabase dashboarde / cez service_role (reporting, Looker Studio).
-- Fáza 2 (per-pobočkové prihlásenie tabletov) je naznačená v komentároch dole.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Pobočky (referenčná tabuľka; názvy presne ako v appke — pole BRANCHES) ──
create table if not exists public.branches (
  name text primary key
);

insert into public.branches (name) values
  ('Obchodná'), ('Nivy'), ('Cubicon'), ('Levice'), ('Martin'),
  ('Žilina'), ('Poprad'), ('Prešov'), ('Košice')
on conflict (name) do nothing;

-- ── Úlohy (tasks_summary) — 1 riadok = 1 úloha v odoslanom súhrne ───────────
create table if not exists public.tasks_log (
  id         bigint generated always as identity primary key,
  branch     text not null references public.branches(name),
  day        date not null,
  category   text not null,                 -- ranné / večerné / víkendové / mesačné
  inspector  text not null default '',
  task       text not null,
  done       boolean not null default false,
  done_time  text,                          -- "HH:MM" (ako zadané v appke)
  done_date  text,                          -- "d. M."
  issue      text,                          -- dôvod problému, ak nahlásený
  done_by    text,                          -- kto úlohu splnil / problém nahlásil
  created_at timestamptz not null default now()
);
create index if not exists tasks_log_branch_day on public.tasks_log (branch, day);

-- ── HACCP teploty — 1 riadok = 1 meranie zariadenia ─────────────────────────
create table if not exists public.haccp_log (
  id         bigint generated always as identity primary key,
  branch     text not null references public.branches(name),
  day        date not null,
  shift      text,                          -- ranné / večerné
  inspector  text not null default '',
  device     text not null,                 -- názov zariadenia (label)
  value_raw  text not null,                 -- ako zadané ("4,5")
  value      numeric,                       -- normalizované číslo
  max_limit  text,                          -- "≤ 5 °C"
  exceeded   boolean,                       -- true = prekročený limit
  created_at timestamptz not null default now()
);
create index if not exists haccp_log_branch_day on public.haccp_log (branch, day);

-- ── Inventúra — 1 riadok = 1 položka s množstvom ────────────────────────────
create table if not exists public.inventory_log (
  id          bigint generated always as identity primary key,
  branch      text not null references public.branches(name),
  day         date not null,
  month_label text,                         -- "September 2026" (názov tabu v Sheets)
  inspector   text not null default '',
  item        text not null,
  qty         numeric not null,
  unit        text,
  breakdown   text,                         -- rozpis pri multi-riadkovom počítaní
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists inventory_log_branch_day on public.inventory_log (branch, day);

-- ── Odpisy — 1 riadok = 1 odpísaná položka ──────────────────────────────────
create table if not exists public.odpisy_log (
  id         bigint generated always as identity primary key,
  branch     text not null references public.branches(name),
  day        date not null,
  author     text not null default '',
  item       text not null,
  qty        numeric not null,
  unit       text,
  reason     text not null default 'Spotreba',
  day_note   text,                          -- poznámka celého dňa
  created_at timestamptz not null default now()
);
create index if not exists odpisy_log_branch_day on public.odpisy_log (branch, day);

-- ── Alkohol — denná evidencia otvorených fliaš ──────────────────────────────
create table if not exists public.alkohol_log (
  id         bigint generated always as identity primary key,
  branch     text not null references public.branches(name),
  day        date not null,
  licencia   text,
  author     text,
  name       text not null,
  type       text,
  ean        text,                          -- držať ako text (nie číslo!)
  open_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists alkohol_log_branch_day on public.alkohol_log (branch, day);

-- ── Uzávierky kasy — kľúčové stĺpce + celý payload v jsonb (lossless) ───────
-- Append-only ako Sheets: opakované odoslanie po úprave = nový riadok;
-- "posledná platná" sa v reportoch berie ako max(created_at) pre (branch, day, kasa).
create table if not exists public.uzavierky_log (
  id         bigint generated always as identity primary key,
  branch     text not null references public.branches(name),
  day        date not null,
  kasa       text,
  meno       text,
  data       jsonb not null,                -- kompletná uzávierka (polia A..L, prepočty)
  created_at timestamptz not null default now()
);
create index if not exists uzavierky_log_branch_day on public.uzavierky_log (branch, day);

-- ── Hlásenia chýb z appky ───────────────────────────────────────────────────
create table if not exists public.bug_reports (
  id          bigint generated always as identity primary key,
  branch      text references public.branches(name),
  day         date,
  author      text,
  description text not null,
  user_agent  text,
  created_at  timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS — Row Level Security (pilot: anon = INSERT-only, čítanie zakázané)
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.branches      enable row level security;
alter table public.tasks_log     enable row level security;
alter table public.haccp_log     enable row level security;
alter table public.inventory_log enable row level security;
alter table public.odpisy_log    enable row level security;
alter table public.alkohol_log   enable row level security;
alter table public.uzavierky_log enable row level security;
alter table public.bug_reports   enable row level security;

-- Žiadna select policy = cez anon/authenticated kľúč sa NEDÁ čítať nič.
-- (Supabase dashboard a service_role RLS obchádzajú — reporting funguje.)
do $$ begin
  create policy anon_insert_tasks     on public.tasks_log     for insert to anon with check (true);
  create policy anon_insert_haccp     on public.haccp_log     for insert to anon with check (true);
  create policy anon_insert_inventory on public.inventory_log for insert to anon with check (true);
  create policy anon_insert_odpisy    on public.odpisy_log    for insert to anon with check (true);
  create policy anon_insert_alkohol   on public.alkohol_log   for insert to anon with check (true);
  create policy anon_insert_uzavierky on public.uzavierky_log for insert to anon with check (true);
  create policy anon_insert_bugs      on public.bug_reports   for insert to anon with check (true);
exception when duplicate_object then null;
end $$;

-- ── FÁZA 2 (po zavedení prihlásenia tabletov per pobočka) — NESPÚŠŤAŤ TERAZ ─
-- Každý tablet dostane Supabase účet svojej pobočky s custom claimom "branch".
-- Potom sa anon insert policies zrušia a nahradia napr.:
--   create policy branch_insert on public.odpisy_log for insert to authenticated
--     with check (branch = (auth.jwt() -> 'app_metadata' ->> 'branch'));
--   create policy manager_select on public.odpisy_log for select to authenticated
--     using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'manager');
-- + tabuľka backups (zálohy zariadení) — až vo fáze s prihlásením, nikdy cez anon.
