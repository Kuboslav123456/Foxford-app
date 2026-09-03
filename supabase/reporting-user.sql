-- Read-only používateľ pre externý reporting (BI nástroje).
-- POZN.: v repe je zámerne PLACEHOLDER heslo (repo je verejné). Skutočné heslo
-- si zvoľ pri spúšťaní a ulož do firemných hesiel, do repa ho NEDÁVAJ.
-- (V praxi tento účet zatiaľ nepotrebný — manažérske prehľady čítajú cez
--  Supabase Auth v appke #prehlady, nie cez tohto DB usera.)
create user reporting with password 'SEM_VLOZ_SVOJE_HESLO';
grant usage on schema public to reporting;
grant select on all tables in schema public to reporting;
alter default privileges in schema public grant select on tables to reporting;

-- RLS: reporting smie čítať všetky tabuľky (verejný anon kľúč ostáva bez čítania)
do $$ begin
  create policy reporting_select_tasks     on public.tasks_log     for select to reporting using (true);
  create policy reporting_select_haccp     on public.haccp_log     for select to reporting using (true);
  create policy reporting_select_inventory on public.inventory_log for select to reporting using (true);
  create policy reporting_select_odpisy    on public.odpisy_log    for select to reporting using (true);
  create policy reporting_select_alkohol   on public.alkohol_log   for select to reporting using (true);
  create policy reporting_select_uzavierky on public.uzavierky_log for select to reporting using (true);
  create policy reporting_select_bugs      on public.bug_reports   for select to reporting using (true);
  create policy reporting_select_branches  on public.branches      for select to reporting using (true);
exception when duplicate_object then null;
end $$;
