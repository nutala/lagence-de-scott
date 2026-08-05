-- ============================================================
--  L'Agence de Scott — Dashboard Admin
--  Script à exécuter une seule fois dans le SQL Editor Supabase
--  (Database > SQL Editor > New query > Run)
-- ============================================================

-- ---------- Tables ----------

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  entreprise text,
  email text,
  telephone text,
  adresse text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.projets (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  client_id uuid references public.clients(id) on delete cascade,
  statut text not null default 'En attente',
  debut date,
  deadline date,
  budget numeric not null default 0,
  progression integer not null default 0,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.taches (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  description text,
  projet_id uuid references public.projets(id) on delete cascade,
  statut text not null default 'À faire',
  priorite text not null default 'moyenne',
  echeance date,
  created_at timestamptz not null default now()
);

create table if not exists public.devis (
  id uuid primary key default gen_random_uuid(),
  numero text unique not null,
  client_id uuid references public.clients(id) on delete cascade,
  titre text,
  date date not null default current_date,
  validite text not null default '30 jours',
  statut text not null default 'Brouillon',
  tva numeric not null default 20,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.devis_lignes (
  id uuid primary key default gen_random_uuid(),
  devis_id uuid references public.devis(id) on delete cascade not null,
  description text not null,
  quantite numeric not null default 1,
  prix_unitaire numeric not null default 0
);

create table if not exists public.factures (
  id uuid primary key default gen_random_uuid(),
  numero text unique not null,
  client_id uuid references public.clients(id) on delete cascade,
  devis_id uuid references public.devis(id) on delete set null,
  titre text,
  montant numeric not null default 0,
  tva numeric not null default 20,
  notes text,
  statut text not null default 'Brouillon',
  date date not null default current_date,
  echeance date,
  created_at timestamptz not null default now()
);

create table if not exists public.factures_lignes (
  id uuid primary key default gen_random_uuid(),
  facture_id uuid references public.factures(id) on delete cascade not null,
  description text not null,
  quantite numeric not null default 1,
  prix_unitaire numeric not null default 0
);

create table if not exists public.planning_events (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  type text not null default 'task',
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  id integer primary key default 1 check (id = 1),
  agence_nom text not null default 'L''Agence de Scott',
  responsable text not null default 'Jordan Schmidt',
  email text not null default 'contact@lagencedescott.fr',
  telephone text not null default '06 64 82 18 35',
  adresse text not null default '12 rue Jacques Leonhart, 68550 Saint-Amarin',
  siret text not null default '10568624000018',
  tva_default numeric not null default 20,
  devise text not null default 'EUR — Euro',
  iban text not null default '',
  bic text not null default ''
);

create table if not exists public.activites (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  created_at timestamptz not null default now()
);

-- ---------- Sécurité (RLS) ----------
-- Seul un utilisateur connecté peut lire/écrire les données.
-- Le compte admin est créé dans Authentication > Users.

alter table public.clients enable row level security;
alter table public.projets enable row level security;
alter table public.taches enable row level security;
alter table public.devis enable row level security;
alter table public.devis_lignes enable row level security;
alter table public.factures enable row level security;
alter table public.factures_lignes enable row level security;
alter table public.planning_events enable row level security;
alter table public.settings enable row level security;
alter table public.activites enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'clients','projets','taches','devis','devis_lignes','factures','factures_lignes',
    'planning_events','settings','activites'
  ] loop
    execute format('create policy "allow_authenticated" on public.%I for all to authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- ---------- Données de démonstration (1 exemple) ----------
-- Supprimable depuis le dashboard.

insert into public.clients (id, nom, entreprise, email, telephone, adresse, notes)
values (
  '00000000-0000-0000-0000-000000000001',
  'Émilie Martin',
  'Le Fournil d''Émilie',
  'contact@fournilemilie.fr',
  '06 12 34 56 78',
  '5 rue de la Thur, 68550 Saint-Amarin',
  'Boulangerie artisanale — client de démonstration, à supprimer librement.'
)
on conflict (id) do nothing;

insert into public.projets (id, titre, client_id, statut, debut, deadline, budget, progression, description)
values (
  '00000000-0000-0000-0000-000000000002',
  'Site vitrine boulangerie',
  '00000000-0000-0000-0000-000000000001',
  'En cours',
  '2026-06-15',
  '2026-08-30',
  2800,
  35,
  'Site vitrine responsive avec galerie produits, horaires et formulaire de contact.'
)
on conflict (id) do nothing;

insert into public.taches (id, titre, description, projet_id, statut, priorite, echeance)
values
  ('00000000-0000-0000-0000-000000000003', 'Maquettes homepage', 'Maquettes desktop et mobile de la page d''accueil.', '00000000-0000-0000-0000-000000000002', 'En cours', 'haute', '2026-07-18'),
  ('00000000-0000-0000-0000-000000000004', 'Intégration header/footer', null, '00000000-0000-0000-0000-000000000002', 'À faire', 'haute', '2026-07-25'),
  ('00000000-0000-0000-0000-000000000005', 'SEO on-page', 'Méta descriptions, balises, sitemap.', '00000000-0000-0000-0000-000000000002', 'À faire', 'moyenne', '2026-08-05')
on conflict (id) do nothing;

insert into public.devis (id, numero, client_id, titre, date, validite, statut, tva, notes)
values (
  '00000000-0000-0000-0000-000000000006',
  'D-2026-001',
  '00000000-0000-0000-0000-000000000001',
  'Site vitrine boulangerie',
  '2026-06-10',
  '30 jours',
  'Envoyé',
  20,
  'Paiement 50% à la commande, solde à la livraison.'
)
on conflict (id) do nothing;

insert into public.devis_lignes (id, devis_id, description, quantite, prix_unitaire)
values
  ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000006', 'Création du site vitrine (5 pages)', 1, 2000),
  ('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000006', 'Référencement local (SEO)', 1, 500),
  ('00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000006', 'Formation à la mise à jour du site', 1, 300)
on conflict (id) do nothing;

insert into public.factures (id, numero, client_id, montant, statut, date, echeance)
values (
  '00000000-0000-0000-0000-000000000010',
  'F-2026-001',
  '00000000-0000-0000-0000-000000000001',
  1680,
  'Envoyée',
  '2026-07-01',
  '2026-08-01'
)
on conflict (id) do nothing;

insert into public.planning_events (id, date, type, label)
values
  ('00000000-0000-0000-0000-000000000011', '2026-07-18', 'task', 'Maquettes homepage'),
  ('00000000-0000-0000-0000-000000000012', '2026-07-20', 'meeting', 'Point projet Fournil d''Émilie'),
  ('00000000-0000-0000-0000-000000000013', '2026-07-25', 'task', 'Intégration header/footer'),
  ('00000000-0000-0000-0000-000000000014', '2026-08-01', 'project', 'Échéance facture F-2026-001')
on conflict (id) do nothing;

insert into public.settings (id)
values (1)
on conflict (id) do nothing;

insert into public.activites (id, message)
values
  ('00000000-0000-0000-0000-000000000015', 'Bienvenue dans votre tableau de bord !')
on conflict (id) do nothing;
