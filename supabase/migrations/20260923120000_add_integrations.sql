-- Pont « Agenda Google » : URL /exec + code secret du script Apps Script.
-- Table séparée de `settings` pour que ces valeurs ne se retrouvent jamais dans
-- un document imprimé ou un export de paramètres.
--
-- Lecture réservée aux utilisateurs connectés (policy allow_authenticated, même
-- modèle que le reste du dashboard) : le bundle public du site ne contient donc
-- ni l'URL ni le code.

create table if not exists public.integrations (
  cle text primary key,
  valeur text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.integrations enable row level security;

drop policy if exists "allow_authenticated" on public.integrations;
create policy "allow_authenticated" on public.integrations
  for all to authenticated using (true) with check (true);
