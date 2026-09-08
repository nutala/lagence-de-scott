export interface Client {
  id: string;
  nom: string;
  entreprise: string | null;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  notes: string | null;
  created_at: string;
}

export interface Projet {
  id: string;
  titre: string;
  client_id: string | null;
  statut: string;
  debut: string | null;
  deadline: string | null;
  budget: number;
  progression: number;
  description: string | null;
  created_at: string;
}

export interface Tache {
  id: string;
  titre: string;
  description: string | null;
  projet_id: string | null;
  statut: string;
  priorite: string;
  echeance: string | null;
  created_at: string;
}

export interface Devis {
  id: string;
  numero: string;
  client_id: string | null;
  titre: string | null;
  date: string;
  validite: string;
  statut: string;
  tva: number;
  notes: string | null;
  bon_pour_accord?: boolean;
  accord_date?: string | null;
  created_at: string;
}

export interface DevisLigne {
  id?: string;
  devis_id?: string | null;
  description: string;
  quantite: number;
  prix_unitaire: number;
  inclus?: boolean;
  details?: string | null;
  position?: number;
}

export interface FactureLigne {
  id?: string;
  facture_id?: string | null;
  description: string;
  quantite: number;
  prix_unitaire: number;
  inclus?: boolean;
  details?: string | null;
  position?: number;
}

export function splitDetails(details: string | null | undefined): string[] {
  return (details ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function escapeRich(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Mini-markdown : **mot** -> <strong>mot</strong>. Le texte est échappé
// d'abord, donc aucun HTML brut ne peut être injecté.
export function formatRichText(text: string | null | undefined): string {
  return escapeRich(text ?? '')
    .split('\n')
    .map((line) => line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'))
    .join('<br>');
}

export interface Facture {
  id: string;
  numero: string;
  client_id: string | null;
  devis_id: string | null;
  titre: string | null;
  montant: number;
  tva: number;
  notes: string | null;
  statut: string;
  date: string;
  echeance: string | null;
  created_at: string;
}

export interface PlanningEvent {
  id: string;
  date: string;
  type: string;
  label: string;
  created_at: string;
}

export interface Settings {
  id: number;
  agence_nom: string;
  responsable: string;
  email: string;
  telephone: string;
  adresse: string;
  siret: string;
  tva_default: number;
  devise: string;
  iban: string;
  bic: string;
}

export interface Activite {
  id: string;
  message: string;
  created_at: string;
}

export type PageKey =
  | 'dashboard'
  | 'clients'
  | 'projets'
  | 'taches'
  | 'devis'
  | 'factures'
  | 'planning'
  | 'settings';

export const PAGE_TITLES: Record<PageKey, string> = {
  dashboard: "Vue d'ensemble",
  clients: 'Clients',
  projets: 'Projets',
  taches: 'Tâches',
  devis: 'Devis',
  factures: 'Factures',
  planning: 'Planning',
  settings: 'Paramètres',
};

export const PROJET_STATUTS = ['En attente', 'En cours', 'En revue', 'Livré', 'Clôturé'];
export const TACHE_STATUTS = ['À faire', 'En cours', 'En revue', 'Terminée'];
export const TACHE_PRIORITES = ['urgente', 'haute', 'moyenne', 'basse'];
export const DEVIS_STATUTS = ['Brouillon', 'Envoyé', 'Accepté', 'Refusé', 'Payé'];
export const FACTURE_STATUTS = ['Brouillon', 'Envoyée', 'Payée', 'En retard', 'Relancée'];
export const EVENT_TYPES = [
  { value: 'task', label: 'Tâche' },
  { value: 'meeting', label: 'Rendez-vous' },
  { value: 'project', label: 'Échéance projet' },
];

export const STATUT_COLORS: Record<string, string> = {
  'En cours': 'badge-accent',
  'En attente': 'badge-warning',
  'En revue': 'badge-info',
  'Livré': 'badge-success',
  'Clôturé': 'badge-muted',
  'Accepté': 'badge-success',
  'Envoyé': 'badge-accent',
  'Payé': 'badge-success',
  'Payée': 'badge-success',
  'Brouillon': 'badge-muted',
  'En retard': 'badge-danger',
  'Refusé': 'badge-danger',
  'Relancée': 'badge-warning',
  'À faire': 'badge-muted',
  'Terminée': 'badge-success',
};

export const PRIORITE_COLORS: Record<string, string> = {
  urgente: 'priority-urgent',
  haute: 'priority-high',
  moyenne: 'priority-medium',
  basse: 'priority-low',
};

export const PRIORITE_LABELS: Record<string, string> = {
  urgente: 'Urgente',
  haute: 'Haute',
  moyenne: 'Moyenne',
  basse: 'Basse',
};

export function formatEUR(n: number | string): string {
  return `${Number(n).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} €`;
}

export function formatDate(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateShort(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function clientName(clients: Client[], id: string | null): string {
  const c = clients.find((x) => x.id === id);
  return c ? c.nom : 'Client supprimé';
}

export function projetTitle(projets: Projet[], id: string | null): string {
  const p = projets.find((x) => x.id === id);
  return p ? p.titre : 'Projet supprimé';
}

export function devisTotal(lignes: DevisLigne[], devisId: string | null): number {
  return lignes
    .filter((l) => l.devis_id === devisId)
    .reduce((s, l) => s + (l.inclus ? 0 : Number(l.quantite) * Number(l.prix_unitaire)), 0);
}

export function facturesTotal(lignes: FactureLigne[], factureId: string | null): number {
  return lignes
    .filter((l) => l.facture_id === factureId)
    .reduce((s, l) => s + (l.inclus ? 0 : Number(l.quantite) * Number(l.prix_unitaire)), 0);
}

export function nextNumero(prefix: string, year: number, existing: string[]): string {
  const p = `${prefix}${year}-`;
  const maxSeq = existing
    .filter((n) => n.startsWith(p))
    .map((n) => parseInt(n.slice(p.length), 10))
    .filter((n) => !isNaN(n))
    .reduce((a, b) => Math.max(a, b), 0);
  return `${p}${String(maxSeq + 1).padStart(3, '0')}`;
}
