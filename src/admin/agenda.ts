import { supabase } from './supabaseClient';

/**
 * Pont « Agenda Google » — côté dashboard.
 *
 * Le dashboard ne parle jamais directement à Google : il appelle le script
 * Apps Script déployé dans le compte Google de l'agence (voir
 * `scripts/agenda_google_webapp.gs` et `docs/integrations/agenda-google.md`).
 * Google Agenda reste la source de vérité : ici on ne fait que lire et écrire
 * dedans.
 *
 * L'URL /exec et le code secret vivent dans la table Supabase `integrations`,
 * lisible uniquement par un utilisateur connecté — jamais dans le bundle, qui
 * est public.
 */

export interface AgendaConfig {
  url: string;
  code: string;
}

export interface AgendaEvent {
  id: string;
  title: string;
  /** « AAAA-MM-JJ » (journée entière) ou « AAAA-MM-JJTHH:MM » (horaire). */
  start: string;
  end: string;
  allDay: boolean;
  location: string;
  notes: string;
  recurring: boolean;
}

export interface AgendaFields {
  title: string;
  start: string;
  end?: string;
  location?: string;
  notes?: string;
}

const CLE_URL = 'agenda_google_url';
const CLE_CODE = 'agenda_google_code';

/** Erreur du pont, avec un code machine et un message affichable. */
export class AgendaError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'AgendaError';
    this.code = code;
  }
}

const MESSAGES: Record<string, string> = {
  code_invalide: 'Le code secret est refusé par le script Google.',
  action_inconnue: 'Le script Google ne connaît pas cette action : le déploiement est trop ancien.',
  title_manquant: "Il manque l'intitulé de l'événement.",
  id_manquant: "Identifiant d'événement manquant.",
  evenement_introuvable: "Cet événement n'existe plus dans Google Agenda (supprimé ailleurs ?).",
  plage_invalide: 'Plage de dates invalide.',
  date_invalide: 'Date invalide envoyée au script Google.',
  url_manquante: "L'URL du script Google n'est pas configurée.",
  reseau:
    "Impossible de joindre le script Google (le déploiement est-il réglé sur « Qui a accès : Tout le monde » ?).",
  reponse_non_json:
    "Réponse illisible du script Google. Vérifier que le déploiement est bien réglé sur « Tout le monde » et que l'URL finit par /exec.",
  propriete_AGENDA_BRIDGE_CODE_absente:
    "Le script Google n'a pas la propriété AGENDA_BRIDGE_CODE (Apps Script → Paramètres du projet → Propriétés du script).",
};

/** Texte lisible d'une page HTML de Google (titre + corps, sans balises). */
function texteDePage(html: string): string {
  const corps = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
  if (corps) return corps.slice(0, 200);
  const titre = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return titre ? titre[1].trim().slice(0, 200) : '';
}

/** Piste de correction quand Google renvoie une page au lieu du JSON. */
function pisteDePage(page: string): string {
  if (/doGet/i.test(page) && /introuvable|not found/i.test(page)) {
    return " Le déploiement ne contient pas le script à jour : Apps Script → Gérer les déploiements → crayon → Version : « Nouvelle version » → Déployer.";
  }
  if (/connexion|sign in|choisir un compte|choose an account/i.test(page)) {
    return " Le déploiement exige une connexion Google : Apps Script → Gérer les déploiements → crayon → « Qui a accès » : Tout le monde.";
  }
  return '';
}

export function messageAgenda(code: string, repli?: string): string {
  return MESSAGES[code] || repli || `Erreur du pont Google (${code}).`;
}

/** Vrai si l'erreur vient de la table `integrations` absente (migration non passée). */
export function tableIntegrationsAbsente(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null;
  if (!e) return false;
  if (e.code === '42P01' || e.code === 'PGRST205') return true;
  return /does not exist|schema cache|relation .*introuvable/i.test(e.message || '');
}

// ---------------------------------------------------------------------------
// Appel du pont
// ---------------------------------------------------------------------------

async function appel<T>(cfg: AgendaConfig, params: Record<string, string | undefined>): Promise<T> {
  if (!cfg.url) throw new AgendaError('url_manquante', messageAgenda('url_manquante'));

  const url = new URL(cfg.url);
  url.searchParams.set('code', cfg.code);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });

  let res: Response;
  try {
    // GET uniquement, et suivi de la redirection vers script.googleusercontent.com :
    // c'est le seul mode que le CORS du navigateur autorise vers Apps Script.
    res = await fetch(url.toString(), { method: 'GET', redirect: 'follow' });
  } catch {
    throw new AgendaError('reseau', messageAgenda('reseau'));
  }
  if (!res.ok) {
    throw new AgendaError(`http_${res.status}`, `Le script Google a répondu ${res.status}.`);
  }

  const texte = await res.text();
  let data: { ok?: boolean; error?: string } & Record<string, unknown>;
  try {
    data = JSON.parse(texte);
  } catch {
    // Google renvoie une page HTML quand le déploiement est mal réglé : on
    // remonte son texte, c'est le diagnostic le plus utile.
    const page = texteDePage(texte);
    if (page) {
      throw new AgendaError(
        'reponse_non_json',
        `Le script Google a répondu une page au lieu de données : « ${page} ».${pisteDePage(page)}`,
      );
    }
    throw new AgendaError('reponse_non_json', messageAgenda('reponse_non_json'));
  }
  if (!data.ok) {
    const code = data.error || 'inconnu';
    throw new AgendaError(code, messageAgenda(code));
  }
  return data as T;
}

export async function agendaPing(cfg: AgendaConfig) {
  return appel<{ ok: true; agenda: string; fuseau: string }>(cfg, { action: 'ping' });
}

export async function agendaList(cfg: AgendaConfig, start: string, end: string): Promise<AgendaEvent[]> {
  const r = await appel<{ ok: true; events: AgendaEvent[] }>(cfg, { action: 'list', start, end });
  return r.events || [];
}

export async function agendaCreate(cfg: AgendaConfig, champs: AgendaFields): Promise<AgendaEvent> {
  const r = await appel<{ ok: true; event: AgendaEvent }>(cfg, { action: 'create', ...champs });
  return r.event;
}

export async function agendaUpdate(cfg: AgendaConfig, id: string, champs: AgendaFields): Promise<AgendaEvent> {
  const r = await appel<{ ok: true; event: AgendaEvent }>(cfg, { action: 'update', id, ...champs });
  return r.event;
}

export async function agendaDelete(cfg: AgendaConfig, id: string): Promise<string> {
  const r = await appel<{ ok: true; deleted: string }>(cfg, { action: 'delete', id });
  return r.deleted;
}

// ---------------------------------------------------------------------------
// Configuration (Supabase, table `integrations`)
// ---------------------------------------------------------------------------

export async function loadAgendaConfig(): Promise<AgendaConfig | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('integrations')
    .select('cle, valeur')
    .in('cle', [CLE_URL, CLE_CODE]);
  if (error) throw new AgendaError(error.code || 'config_illisible', error.message);

  const parCle = new Map((data || []).map((r: { cle: string; valeur: string }) => [r.cle, r.valeur]));
  const url = (parCle.get(CLE_URL) || '').trim();
  const code = (parCle.get(CLE_CODE) || '').trim();
  return url ? { url, code } : null;
}

export async function saveAgendaConfig(cfg: AgendaConfig): Promise<void> {
  if (!supabase) throw new AgendaError('supabase_absent', 'Supabase n’est pas configuré.');
  const { error } = await supabase.from('integrations').upsert([
    { cle: CLE_URL, valeur: cfg.url.trim(), updated_at: new Date().toISOString() },
    { cle: CLE_CODE, valeur: cfg.code.trim(), updated_at: new Date().toISOString() },
  ]);
  if (error) throw new AgendaError(error.code || 'config_illisible', error.message);
}

export async function clearAgendaConfig(): Promise<void> {
  if (!supabase) return;
  await supabase.from('integrations').delete().in('cle', [CLE_URL, CLE_CODE]);
}
