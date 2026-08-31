alter table public.devis_lignes add column if not exists inclus boolean not null default false;
alter table public.factures_lignes add column if not exists inclus boolean not null default false;
