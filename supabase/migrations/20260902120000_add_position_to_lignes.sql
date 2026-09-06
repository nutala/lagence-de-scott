alter table public.devis_lignes add column if not exists position integer not null default 0;
alter table public.factures_lignes add column if not exists position integer not null default 0;
