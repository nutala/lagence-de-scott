# Dashboard Admin — L'Agence de Scott

## Intent

Créer un dashboard admin responsive pour L'Agence de Scott (agence web solo, Saint-Amarin), hébergé derrière `lagencedescott.fr/admin`. Le dashboard centralise la gestion de l'activité : devis, clients, projets, tâches, facturation et planification.

---

## Brand Tokens (extraits de lagencedescott.fr)

| Token | Valeur | Usage |
|-------|--------|-------|
| `--bg` | `#040a12` | Fond principal (navy-900) |
| `--surface` | `#08162a` | Cartes, sidebar (navy-800) |
| `--surface-raised` | `#0c2340` | Éléments surélevés (navy-700) |
| `--fg` | `#f1f5f9` | Texte principal (slate-100) |
| `--muted` | `#94a3b8` | Texte secondaire (slate-400) |
| `--border` | `rgba(255,255,255,0.08)` | Bordures subtiles |
| `--accent` | `#ca6e0d` | Accent principal — actions, CTA (sun-500) |
| `--accent-hover` | `#e88318` | Accent hover (sun-400) |
| `--success` | `#5a9c3f` | Statut positif / vert (leaf-500) |
| `--success-light` | `#6baf4d` | Vert hover (leaf-400) |
| **Display** | Space Grotesk | Titres, headings |
| **Body** | Inter | Texte, labels, UI |

---

## Architecture du Dashboard

### Navigation

- **Sidebar** : fixe à gauche (desktop), drawer hamburger (mobile/tablet)
- **Header** : barre supérieure avec recherche, notifications, profil
- **Zone de contenu** : scrollable, grilles responsive

### Pages / Modules

#### 1. Vue d'ensemble (Dashboard Home)
**Objectif** : Aperçu immédiat de l'activité en un coup d'œil.

KPIs en haut :
- Chiffre d'affaires du mois (€)
- Devis en attente (nombre)
- Projets actifs (nombre)
- Clients actifs (nombre)

Widgets :
- **Projets récents** : 3-5 derniers projets avec statut, client, deadline
- **Devis récents** : dernier devis créés, statut (brouillon / envoyé / accepté / refusé)
- **Activité récente** : timeline des dernières actions
- **Graphique CA mensuel** : barres des 6 derniers mois

#### 2. Clients
**Objectif** : CRUD clients, vue liste + fiche détaillée.

- **Liste clients** : tableau avec recherche, filtres, tri (nom, date ajout, nb projets)
- **Fiche client** : coordonnées, historique projets, devis liés, factures
- **Ajout client** : formulaire modal (nom, email, téléphone, entreprise, adresse, notes)
- **Actions** : éditer, supprimer, contacter

#### 3. Projets
**Objectif** : Suivi de tous les projets avec leur cycle de vie.

Statuts : En attente → En cours → En revue → Livré → Clôturé

- **Vue grille/liste** : toggle entre les deux vues
- **Filtres** : par statut, client, date
- **Carte projet** : titre, client, statut (badge couleur), date début, deadline, budget estimé
- **Détail projet** : description, livrables, dates clés, notes, lien devis/facture

#### 4. Tâches
**Objectif** : Planifier et suivre les tâches liées à chaque projet en cours.

- **Filtre par projet** : dropdown ou onglets pour sélectionner le projet concerné
- **Statuts** : À faire → En cours → En revue → Terminée
- **Priorité** : Basse / Moyenne / Haute / Urgente (code couleur)
- **Carte tâche** : titre, description courte, assigné (Jordan par défaut), échéance, priorité, projet parent
- **Vue liste** : tri par deadline, priorité ou statut
- **Création rapide** : formulaire inline ou modal (titre, projet lié, priorité, date)
- **Actions** : glisser-déposer entre colonnes (kanban), éditer, supprimer, marquer terminée
- **Vue Kanban** : colonnes par statut avec drag & drop
- **Lien projet** : chaque tâche rattache explicitement à un projet en cours, avec retour au projet parent

#### 5. Devis (Générateur)
**Objectif** : Créer, envoyer et suivre les devis.

- **Liste devis** : tous les devis avec statut, montant, client, date
- **Création devis** : formulaire multi-sections :
  - En-tête (numéro auto, date, validité)
  - Infos client (sélection ou ajout rapide)
  - Lignes de prestation (description, quantité, prix unitaire, total auto)
  - Notes / conditions générales
  - TVA applicable
- **Actions** : prévisualiser (PDF-like), exporter PDF, marquer envoyé/accepté/refusé
- **Templates** : sauvegarder un devis comme modèle réutilisable

#### 6. Factures
**Objectif** : Suivi de la facturation et des paiements.

- **Liste factures** : montant, client, statut (brouillon / envoyée / payée / en retard)
- **Statistiques** : CA encaissé vs en attente
- **Relances** : marquer comme relancée

#### 7. Planning
**Objectif** : Vue temporelle des échéances.

- **Calendrier** : mois/semaine/jour
- **Événements** : deadlines projets, rendez-vous clients, tâches
- **Ajout rapide** : clic sur une date pour créer

#### 8. Paramètres
**Objectif** : Configuration du profil et des préférences.

- Profil agence (nom, logo, adresse, SIRET)
- Coordonnées bancaires (pour devis/factures)
- Préférences TVA par défaut
- Gestion du mot de passe

---

## Structure responsive

| Breakpoint | Layout |
|------------|--------|
| Mobile (< 768px) | Sidebar → hamburger drawer, colonne unique, cards empilées |
| Tablet (768-1024px) | Sidebar réduite (icônes), grilles 2 colonnes |
| Desktop (> 1024px) | Sidebar complète, grilles 3-4 colonnes |

---

## Design Principles

1. **Fidélité à la charte** : fond navy dark, accents orange/vert, typo Space Grotesk + Inter
2. **Clarté** : hiérarchie info forte, pas de surcharge visuelle
3. **Efficacité** : actions en 1-2 clics, bulk actions sur listes
4. **État vide** : illustrations ou messages contextuels quand pas de données
5. **Interactions** : hover states subtils, transitions fluides, focus rings visibles

---

## Contraintes techniques

- HTML autonome (single file, React inline via CDN)
- Responsive de 360px à 1920px
- Pas de dépendances externes sauf React, Babel, Framer Motion, font Google
- Noms de données et contenus en français
- Données mock réalistes (pas de lorem ipsum)

---

## Open Questions

- [ ] Authentification : prototype visuel complet ou juste la partie UI sans login ?
- [ ] Notifications : popover de notifications ou page dédiée ?
- [ ] Recherche globale : barre de recherche dans le header ou module dédié ?
- [ ] Exports : faut-il des boutons "Exporter CSV" ou "Télécharger PDF" fonctionnels ?

---

## Next Step

Relire ce plan, valider ou ajuster la liste des modules, puis je passe à la construction du dashboard HTML complet.
