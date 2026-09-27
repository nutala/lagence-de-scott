-- ---------------------------------------------------------------------------
--  Exiger la double authentification (aal2) au niveau de la BASE
-- ---------------------------------------------------------------------------
--  Contexte : aujourd'hui chaque table porte la politique « allow_authenticated »
--  (`for all to authenticated using (true) with check (true)`). Autrement dit, toute
--  session obtenue avec le seul mot de passe — y compris depuis un script, une clé
--  anon publique et un mot de passe volé — lit et écrit l'intégralité du CRM.
--  La 2FA ajoutée dans l'interface ne suffit pas : un attaquant passe par l'API.
--
--  Ce script remplace la politique par une exigence aal2 : sans avoir relevé un défi
--  TOTP, la session ne voit plus rien.
--
--  ⚠️  À NE PAS APPLIQUER AVANT D'AVOIR ACTIVÉ LA 2FA sur TOUS les comptes qui
--      écrivent dans la base (admin → Réglages → Sécurité), sinon l'accès est
--      verrouillé pour tout le monde, connecteur compris.
--  ⚠️  Le connecteur (scripts/crm_agent.py) devra lui aussi relever un défi TOTP :
--      option A — il calcule ses propres codes à partir d'un secret stocké dans
--      ~/.hermes/.env ; option B — le compte machine est exempté (voir plus bas).
--
--  Les migrations ne sont pas appliquées automatiquement au déploiement : ce fichier
--  doit être collé dans l'éditeur SQL de Supabase.
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  for t in
    select tablename from pg_tables where schemaname = 'public'
  loop
    -- on retire l'ancienne politique permissive
    execute format('drop policy if exists "allow_authenticated" on public.%I;', t);
    execute format('drop policy if exists "aal2_only" on public.%I;', t);

    -- nouvelle politique : aal2 exigé en lecture comme en écriture
    execute format(
      'create policy "aal2_only" on public.%I for all to authenticated '
      || 'using (coalesce(auth.jwt() ->> ''aal'', ''aal1'') = ''aal2'') '
      || 'with check (coalesce(auth.jwt() ->> ''aal'', ''aal1'') = ''aal2'');',
      t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
--  Variante « compte machine exempté » (option B)
--  À utiliser seulement si le connecteur ne peut pas faire de TOTP. Remplacer le
--  bloc de création ci-dessus par celui-ci, en gardant l'adresse réelle du compte
--  machine : l'exemption laisse alors un mot de passe seul ouvrir toute la base.
-- ---------------------------------------------------------------------------
--    execute format(
--      'create policy "aal2_only" on public.%I for all to authenticated '
--      || 'using (auth.jwt() ->> ''aal'' = ''aal2'' '
--      ||   'or auth.jwt() ->> ''email'' = ''agent@lagencedescott.fr'') '
--      || 'with check (auth.jwt() ->> ''aal'' = ''aal2'' '
--      ||   'or auth.jwt() ->> ''email'' = ''agent@lagencedescott.fr'');',
--      t);

-- ---------------------------------------------------------------------------
--  Mise en service (dans cet ordre)
--  1. Fermer les inscriptions : Supabase → Authentication → Sign In / Providers →
--     « Allow new users to sign up » = OFF. Sans cela, n'importe qui peut se créer
--     un compte et, avec la clé anon publique, accéder à tout : la 2FA n'y change rien.
--  2. Vérifier la liste des utilisateurs (Authentication → Users) : supprimer tout
--     compte inconnu.
--  3. Activer la 2FA sur chaque compte (admin → Réglages → Sécurité, QR code à scanner
--     avec 2FAS).
--  4. Le connecteur (voir option A ou B ci-dessus), puis exécuter ce script.
-- ---------------------------------------------------------------------------
