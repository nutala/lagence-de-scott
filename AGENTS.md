# AGENTS.md — lagence-de-scott

> Site public de L'Agence de Scott **et** son dashboard admin. Contexte pour tout agent :
> à lire avant d'agir.

## En bref

| | |
|---|---|
| Rôle | Site vitrine public + dashboard admin interne (`/admin`) |
| Dépôt | `git@github.com:nutala/lagence-de-scott.git`, branche **main** |
| Production | GitHub Pages → **lagencedescott.fr** (route `/admin` gérée côté client) |
| Données | Supabase (projet `aumqxymqrusmuimaqpip`) |
| Stack | React 19 + Vite 6 + TypeScript, Tailwind, `@supabase/supabase-js` |

L'app est **une seule application** : la racine sert le site public, `/admin` sert le dashboard
(routage côté client, `src/App.tsx` bascule sur `window.location.pathname`). En production,
`/admin/` appelé directement renvoie 404 (comportement GitHub Pages + `404.html`), c'est normal.

## Commandes

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build de prod (dist/)
npm run lint
```

## Structure

| Chemin | Rôle |
|---|---|
| `src/App.tsx` | site public (pages + contenu) |
| `src/admin/` | dashboard : `AdminApp`, `AdminDataContext`, pages Clients / Devis / Factures / Projets / Taches / Planning / Settings |
| `src/admin/pdf.ts` | `buildInvoiceHtml()` — le HTML de devis/facture, imprimé par le navigateur |
| `src/admin/types.ts` | types + `nextNumero()` (numérotation des documents) |
| `src/admin/agenda.ts` | client du pont « Agenda Google » (liste / création / modification / suppression) |
| `supabase/schema.sql` | schéma complet (10 tables) + policies RLS |
| `scripts/crm_agent.py` | connecteur agent : auth Supabase, CRUD, numérotation, journal |
| `scripts/agenda_google_webapp.gs` | pont Apps Script (dans le compte Google de Jordan) — procédure en tête de fichier |
| `scripts/print_devis.ts` | rendu HTML du devis hors navigateur (esbuild + Chromium → PDF) |
| `dashboard/` | prototype HTML du dashboard (`plan.md` = intent, tokens de marque) — **non déployé** |
| `docs/annexes/` | notes d'idées de revenus — non publiées |

## Base de données

Tables : `clients`, `projets`, `taches`, `devis`, `devis_lignes`, `factures`,
`factures_lignes`, `planning_events`, `settings`, `activites`, `integrations`.

- **RLS** : une seule policy `allow_authenticated` sur chaque table — tout utilisateur connecté
  lit et écrit tout. La clé *anon* seule ne suffit pas, il faut une session.
- **Numérotation** : `<préfixe><année>-NNN`, séquence max + 1, padding 3 → `D-2026-003`,
  `F-2026-001`. Reproduire `nextNumero()` de `src/admin/types.ts`, jamais inventer un numéro.
- **TVA = 0** : franchise en base. La mention « TVA non applicable, art. 293 B du CGI » est
  dans le template PDF. Ne pas remettre 20 %.
- **Journal** : toute action d'agent écrit une ligne dans `activites`.

Le connecteur agent, le rendu PDF et les règles métier sont détaillés dans la skill
`lagence-de-scott-crm`.

## Règles

1. **Ne pas modifier `src/admin/pdf.ts` pour arranger l'agent** : le PDF doit rester identique
   à celui du bouton « PDF » de l'admin. Le script `print_devis.ts` le réutilise tel quel.
2. **Ne pas committer `dist/`** (ignoré) : le déploiement se fait par GitHub Actions.
3. Un push sur `main` **déclenche un déploiement Pages** : ne pas pousser sans accord explicite.
4. Ne pas modifier un devis déjà émis (montant, statut « Envoyé ») — proposer à Jordan.
5. Les clés du build vivent dans les secrets GitHub Actions, pas en local : un `npm run build`
   local produit un site sans Supabase configuré.
6. Fichiers parasites à ignorer : `*.artifact.json`.
7. **Agenda** : le planning du dashboard est un pont vers **Google Agenda** (`src/admin/agenda.ts`
   + `scripts/agenda_google_webapp.gs`). L'URL `/exec` et son code secret vivent **uniquement**
   dans la table Supabase `integrations` : jamais dans le dépôt (public), jamais dans un brief ni
   dans le chat. `planning_events` ne sert plus qu'aux jalons internes (échéances projet/facture).

## Pièges connus

- `buildInvoiceHtml` importe le logo en PNG : hors navigateur il faut
  `--loader:.png=dataurl` (esbuild), sinon le bundle échoue.
- `window` n'existe pas sous Node : c'est ce qui force le data-URI du logo.
