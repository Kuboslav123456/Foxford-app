-- ═══════════════════════════════════════════════════════════════════════════
-- MANAŽÉRSKE PREHĽADY — prístup per pobočka (fáza 4)
-- Spusti v Supabase SQL Editore. Bezpečné spustiť aj opakovane.
--
-- Model: manažér sa prihlási (Supabase Auth), appka #prehlady číta jeho
-- priradenia z manager_pobocky. RLS vynucuje, že cez prihlásený účet vidno
-- len riadky vlastných pobočiek ('*' = všetky = admin). Verejný anon kľúč
-- ostáva insert-only (žiadne select policy pre anon).
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.manager_pobocky (
  email  text not null,
  branch text not null,   -- názov pobočky ako v appke, alebo '*' pre všetky
  primary key (email, branch)
);
alter table public.manager_pobocky enable row level security;

-- Prihlásený si prečíta len vlastné priradenia
do $$ begin
  create policy mp_self_select on public.manager_pobocky
    for select to authenticated using (email = (auth.jwt() ->> 'email'));
exception when duplicate_object then null; end $$;

-- Smie prihlásený manažér vidieť danú pobočku?
create or replace function public.manazer_smie(b text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from manager_pobocky
    where email = (auth.jwt() ->> 'email') and (branch = b or branch = '*')
  );
$$;

-- Čítanie prevádzkových dát pre prihlásených manažérov — len ich pobočky
do $$ begin
  create policy mgr_select_tasks     on public.tasks_log     for select to authenticated using (public.manazer_smie(branch));
  create policy mgr_select_haccp     on public.haccp_log     for select to authenticated using (public.manazer_smie(branch));
  create policy mgr_select_inventory on public.inventory_log for select to authenticated using (public.manazer_smie(branch));
  create policy mgr_select_odpisy    on public.odpisy_log    for select to authenticated using (public.manazer_smie(branch));
  create policy mgr_select_alkohol   on public.alkohol_log   for select to authenticated using (public.manazer_smie(branch));
  create policy mgr_select_uzavierky on public.uzavierky_log for select to authenticated using (public.manazer_smie(branch));
  create policy mgr_select_bugs      on public.bug_reports   for select to authenticated using (public.manazer_smie(branch));
  create policy mgr_select_branches  on public.branches      for select to authenticated using (true);
exception when duplicate_object then null; end $$;

-- ── Príklady správy (spúšťaj podľa potreby) ─────────────────────────────────
-- Admin (všetky pobočky):
--   insert into manager_pobocky (email, branch) values ('jakub.hrebenar@foxford.sk', '*') on conflict do nothing;
-- Manažér jednej pobočky:
--   insert into manager_pobocky (email, branch) values ('peter@foxford.sk', 'Levice') on conflict do nothing;
-- Preloženie: update manager_pobocky set branch='Poprad' where email='peter@foxford.sk';
-- Odobratie: delete from manager_pobocky where email='peter@foxford.sk';
