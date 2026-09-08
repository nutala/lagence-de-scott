alter table public.devis add column if not exists bon_pour_accord boolean not null default false;
alter table public.devis add column if not exists accord_date date;
