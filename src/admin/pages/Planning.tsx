import React, { useCallback, useEffect, useMemo, useState, FormEvent } from 'react';
import { AlertTriangle, ExternalLink, Plug, Plus, RefreshCw, Trash2, Unplug } from 'lucide-react';
import { useAdminData } from '../AdminDataContext';
import { EmptyState, Modal } from '../components';
import { EVENT_TYPES } from '../types';
import type { PlanningEvent } from '../types';
import {
  AgendaError,
  agendaCreate,
  agendaDelete,
  agendaList,
  agendaPing,
  agendaUpdate,
  clearAgendaConfig,
  loadAgendaConfig,
  saveAgendaConfig,
  tableIntegrationsAbsente,
  type AgendaConfig,
  type AgendaEvent,
} from '../agenda';

/**
 * Planning = l'agenda Google de l'agence, affiché et piloté depuis le dashboard
 * (voir src/admin/agenda.ts). Les jalons internes (échéances projet, échéance
 * de facture) restent dans Supabase : Google ne les connaît pas.
 */

const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const MOIS_MIN = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const JOURS_LONG = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const jourDe = (s: string) => s.slice(0, 10);
const heureDe = (s: string) => (s.includes('T') ? s.slice(11, 16) : '');

function dateLongue(d: string) {
  const [a, m, j] = d.split('-').map(Number);
  return `${JOURS_LONG[new Date(a, m - 1, j).getDay()]} ${j} ${MOIS_MIN[m - 1]} ${a}`;
}

type Cell = { date: string; day: number; other: boolean };

type ModalState =
  | { kind: 'day'; date: string }
  | { kind: 'event'; event: AgendaEvent | null; date: string }
  | { kind: 'jalon'; event: PlanningEvent | null; date: string }
  | { kind: 'config' };

export default function PlanningPage() {
  const { events, saveEvent, deleteEvent, notify, logActivite } = useAdminData();
  const now = new Date();
  const [y, setY] = useState(now.getFullYear());
  const [m, setM] = useState(now.getMonth());
  const [modal, setModal] = useState<ModalState | null>(null);

  const [cfg, setCfg] = useState<AgendaConfig | null>(null);
  const [cfgEtat, setCfgEtat] = useState<'chargement' | 'sans-config' | 'sans-table' | 'pret'>('chargement');
  const [cfgErreur, setCfgErreur] = useState<string | null>(null);
  const [agendaNom, setAgendaNom] = useState<string | null>(null);

  const [gEvents, setGEvents] = useState<AgendaEvent[]>([]);
  const [chargement, setChargement] = useState(false);
  const [agendaErreur, setAgendaErreur] = useState<string | null>(null);
  const [voirJalons, setVoirJalons] = useState(true);

  // Grille : semaines complètes ; les cases hors mois portent leur vraie date
  // (on peut donc créer un rendez-vous sur un jour voisin).
  const cells: Cell[] = useMemo(() => {
    const premier = new Date(y, m, 1);
    let decalage = premier.getDay() - 1;
    if (decalage < 0) decalage = 6;
    const debut = new Date(y, m, 1 - decalage);
    const joursMois = new Date(y, m + 1, 0).getDate();
    const total = Math.ceil((decalage + joursMois) / 7) * 7;
    const out: Cell[] = [];
    for (let i = 0; i < total; i++) {
      const d = new Date(debut.getFullYear(), debut.getMonth(), debut.getDate() + i);
      out.push({ date: iso(d), day: d.getDate(), other: d.getMonth() !== m });
    }
    return out;
  }, [y, m]);

  const aujourdhui = iso(now);
  const debutPlage = cells[0].date;
  const dernierJour = cells[cells.length - 1].date;
  const finPlage = iso(new Date(new Date(`${dernierJour}T12:00:00`).getTime() + 86400000));

  // --- Configuration du pont -------------------------------------------------

  const lireConfig = useCallback(async () => {
    try {
      const c = await loadAgendaConfig();
      setCfg(c);
      setCfgErreur(null);
      setCfgEtat(c ? 'pret' : 'sans-config');
      return c;
    } catch (e) {
      if (tableIntegrationsAbsente(e)) {
        setCfgEtat('sans-table');
        setCfgErreur(
          "La table Supabase « integrations » n'existe pas encore : exécuter la migration 20260923120000_add_integrations.sql dans l'éditeur SQL de Supabase.",
        );
      } else {
        setCfgEtat('sans-config');
        setCfgErreur(e instanceof Error ? e.message : String(e));
      }
      return null;
    }
  }, []);

  const chargerEvenements = useCallback(async (config: AgendaConfig | null, start: string, end: string) => {
    if (!config) {
      setGEvents([]);
      return;
    }
    setChargement(true);
    setAgendaErreur(null);
    try {
      setGEvents(await agendaList(config, start, end));
    } catch (e) {
      setAgendaErreur(e instanceof AgendaError ? e.message : String(e));
      setGEvents([]);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    let vivant = true;
    (async () => {
      const c = await lireConfig();
      if (!vivant || !c) return;
      try {
        const info = await agendaPing(c);
        if (vivant) setAgendaNom(info.agenda);
      } catch (e) {
        if (vivant) setAgendaErreur(e instanceof AgendaError ? e.message : String(e));
      }
    })();
    return () => {
      vivant = false;
    };
  }, [lireConfig]);

  useEffect(() => {
    chargerEvenements(cfg, debutPlage, finPlage);
  }, [cfg, debutPlage, finPlage, chargerEvenements]);

  const rafraichir = () => {
    chargerEvenements(cfg, debutPlage, finPlage);
    if (cfg) agendaPing(cfg).then((i) => setAgendaNom(i.agenda)).catch(() => undefined);
  };

  const nav = (delta: number) => {
    let ny = y;
    let nm = m + delta;
    if (nm < 0) { nm = 11; ny -= 1; }
    if (nm > 11) { nm = 0; ny += 1; }
    setY(ny);
    setM(nm);
  };

  const evenementsDuJour = (date: string) => gEvents.filter((e) => jourDe(e.start) === date);
  const jalonsDuJour = (date: string) => (voirJalons ? events.filter((e) => e.date === date) : []);

  return (
    <div className="page-enter">
      <div className="agenda-bar">
        <button className="btn btn-ghost" onClick={() => nav(-1)} aria-label="Mois précédent">←</button>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18 }}>{MOIS[m]} {y}</span>
        <button className="btn btn-ghost" onClick={() => nav(1)} aria-label="Mois suivant">→</button>
        <button className="btn btn-sm btn-secondary" onClick={() => { setY(now.getFullYear()); setM(now.getMonth()); }}>Aujourd'hui</button>
        <button className="btn btn-sm btn-ghost" onClick={rafraichir} disabled={!cfg || chargement}>
          <RefreshCw /> {chargement ? 'Chargement…' : 'Rafraîchir'}
        </button>
        <button className="btn btn-sm btn-ghost" onClick={() => setModal({ kind: 'config' })}>
          <Plug /> Agenda Google
        </button>
      </div>

      <div className="agenda-bar" style={{ marginTop: -6 }}>
        <span className={`agenda-status${cfgEtat === 'pret' && !agendaErreur ? '' : ' warn'}`}>
          <span className="dot" />
          {cfgEtat === 'chargement' && 'Vérification du pont Google…'}
          {cfgEtat === 'sans-table' && 'Table « integrations » absente dans Supabase'}
          {cfgEtat === 'sans-config' && 'Agenda Google non connecté'}
          {cfgEtat === 'pret' && (agendaErreur ? 'Agenda Google injoignable' : `Agenda Google connecté${agendaNom ? ` — ${agendaNom}` : ''}`)}
        </span>
        <label className="switch">
          <input type="checkbox" checked={voirJalons} onChange={(e) => setVoirJalons(e.target.checked)} />
          Afficher les jalons internes
        </label>
      </div>

      {cfgEtat === 'sans-table' && cfgErreur && (
        <div className="alert alert-warning" style={{ marginBottom: 16 }}>
          <AlertTriangle /> <span>{cfgErreur}</span>
        </div>
      )}
      {agendaErreur && cfgEtat !== 'sans-table' && (
        <div className="alert alert-warning" style={{ marginBottom: 16 }}>
          <AlertTriangle /> <span>{agendaErreur}</span>
        </div>
      )}

      {cfgEtat === 'sans-config' ? (
        <EmptyState
          title="Connecter l'agenda Google de l'agence"
          description="Le planning lit et écrit directement dans Google Agenda : rendez-vous, invités, rappels et récurrences restent gérés par Google, sur le téléphone comme ici."
          action={
            <button className="btn btn-primary" onClick={() => setModal({ kind: 'config' })}>
              <Plug /> Connecter mon agenda
            </button>
          }
        />
      ) : (
        <>
          <div className="calendar-wrap">
            <div className="calendar">
              {JOURS.map((d) => <div className="cal-head" key={d}>{d}</div>)}
              {cells.map((c) => {
                const evts = evenementsDuJour(c.date);
                const jalons = jalonsDuJour(c.date);
                return (
                  <div
                    key={c.date}
                    className={`cal-day${c.other ? ' other' : ''}${c.date === aujourdhui ? ' today' : ''}`}
                    onClick={() => setModal({ kind: 'day', date: c.date })}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') setModal({ kind: 'day', date: c.date }); }}
                  >
                    <div className="cal-day-num">{c.day}</div>
                    {evts.slice(0, 3).map((e) => (
                      <div
                        key={e.id}
                        className="cal-event gcal"
                        title={`${e.allDay ? 'Journée entière' : heureDe(e.start)} — ${e.title}`}
                        onClick={(ev) => { ev.stopPropagation(); setModal({ kind: 'event', event: e, date: jourDe(e.start) }); }}
                      >
                        {!e.allDay && <b>{heureDe(e.start)}</b>} {e.title}
                      </div>
                    ))}
                    {evts.length > 3 && <div className="cal-more">+{evts.length - 3}</div>}
                    {jalons.map((e) => (
                      <div
                        key={e.id}
                        className={`cal-event jalon ${e.type}`}
                        title={`Jalon interne — ${e.label}`}
                        onClick={(ev) => { ev.stopPropagation(); setModal({ kind: 'jalon', event: e, date: e.date }); }}
                      >
                        ◆ {e.label}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="agenda-legend">
            <span><i style={{ background: 'var(--accent)' }} /> Rendez-vous Google Agenda</span>
            <span><i style={{ background: 'var(--info)' }} /> Jalons internes (Supabase)</span>
          </div>
        </>
      )}

      {modal?.kind === 'day' && (
        <DayModal
          date={modal.date}
          evenements={evenementsDuJour(modal.date)}
          jalons={events.filter((e) => e.date === modal.date)}
          connecte={cfgEtat === 'pret'}
          onClose={() => setModal(null)}
          onNouvelEvent={() => setModal({ kind: 'event', event: null, date: modal.date })}
          onEditerEvent={(e) => setModal({ kind: 'event', event: e, date: jourDe(e.start) })}
          onNouveauJalon={() => setModal({ kind: 'jalon', event: null, date: modal.date })}
          onEditerJalon={(e) => setModal({ kind: 'jalon', event: e, date: e.date })}
        />
      )}

      {modal?.kind === 'event' && cfg && (
        <Modal
          title={modal.event ? 'Modifier le rendez-vous' : `Nouveau rendez-vous — ${dateLongue(modal.date)}`}
          onClose={() => setModal(null)}
        >
          <EventForm
            date={modal.date}
            event={modal.event}
            onCancel={() => setModal(null)}
            onSave={async (champs) => {
              try {
                if (modal.event) {
                  await agendaUpdate(cfg, modal.event.id, champs);
                  notify('Rendez-vous mis à jour dans Google Agenda');
                  logActivite(`Rendez-vous modifié (Google Agenda) : ${champs.title}`);
                } else {
                  await agendaCreate(cfg, champs);
                  notify('Rendez-vous créé dans Google Agenda');
                  logActivite(`Rendez-vous créé (Google Agenda) : ${champs.title}`);
                }
                setModal(null);
                chargerEvenements(cfg, debutPlage, finPlage);
              } catch (e) {
                notify(e instanceof AgendaError ? e.message : 'Erreur du pont Google');
              }
            }}
            onDelete={
              modal.event
                ? async () => {
                    const ev = modal.event;
                    if (!ev || !window.confirm(`Supprimer « ${ev.title} » de Google Agenda ?`)) return;
                    try {
                      await agendaDelete(cfg, ev.id);
                      notify('Rendez-vous supprimé de Google Agenda');
                      logActivite(`Rendez-vous supprimé (Google Agenda) : ${ev.title}`);
                      setModal(null);
                      chargerEvenements(cfg, debutPlage, finPlage);
                    } catch (e) {
                      notify(e instanceof AgendaError ? e.message : 'Erreur du pont Google');
                    }
                  }
                : undefined
            }
          />
        </Modal>
      )}

      {modal?.kind === 'jalon' && (
        <Modal title={modal.event ? 'Modifier le jalon interne' : `Nouveau jalon interne — ${dateLongue(modal.date)}`} onClose={() => setModal(null)}>
          <JalonForm
            date={modal.date}
            jalon={modal.event}
            onCancel={() => setModal(null)}
            onSave={async (champs) => {
              await saveEvent(champs, modal.event?.id);
              notify(modal.event ? 'Jalon mis à jour' : 'Jalon créé');
              logActivite(modal.event ? `Jalon interne modifié : ${champs.label}` : `Nouveau jalon interne : ${champs.label}`);
              setModal(null);
            }}
            onDelete={
              modal.event
                ? async () => {
                    const j = modal.event;
                    if (!j || !window.confirm(`Supprimer le jalon « ${j.label} » ?`)) return;
                    await deleteEvent(j.id);
                    notify('Jalon supprimé');
                    setModal(null);
                  }
                : undefined
            }
          />
        </Modal>
      )}

      {modal?.kind === 'config' && (
        <ConfigModal
          cfg={cfg}
          onClose={() => setModal(null)}
          onConfigured={async (c) => {
            setCfg(c);
            setCfgEtat('pret');
            setCfgErreur(null);
            setAgendaErreur(null);
            try {
              const info = await agendaPing(c);
              setAgendaNom(info.agenda);
            } catch {
              setAgendaNom(null);
            }
            chargerEvenements(c, debutPlage, finPlage);
          }}
          onCleared={async () => {
            await clearAgendaConfig();
            setCfg(null);
            setCfgEtat('sans-config');
            setAgendaNom(null);
            setGEvents([]);
            notify('Agenda Google déconnecté');
            setModal(null);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Jour
// ---------------------------------------------------------------------------

function DayModal({
  date,
  evenements,
  jalons,
  connecte,
  onClose,
  onNouvelEvent,
  onEditerEvent,
  onNouveauJalon,
  onEditerJalon,
}: {
  date: string;
  evenements: AgendaEvent[];
  jalons: PlanningEvent[];
  connecte: boolean;
  onClose: () => void;
  onNouvelEvent: () => void;
  onEditerEvent: (e: AgendaEvent) => void;
  onNouveauJalon: () => void;
  onEditerJalon: (e: PlanningEvent) => void;
}) {
  return (
    <Modal title={dateLongue(date)} onClose={onClose}>
      <div className="form-group">
        <label>Agenda Google</label>
        <div className="day-list">
          {evenements.length === 0 && <p className="agenda-note">Aucun rendez-vous ce jour-là.</p>}
          {evenements.map((e) => (
            <button key={e.id} type="button" className="day-row" onClick={() => onEditerEvent(e)}>
              <span className="h">{e.allDay ? 'Journée' : heureDe(e.start)}</span>
              <span className="t">
                {e.title}
                {e.location && <span className="l"> — {e.location}</span>}
              </span>
              <ExternalLink style={{ width: 14, height: 14, opacity: 0.5 }} />
            </button>
          ))}
        </div>
        {connecte ? (
          <button type="button" className="btn btn-sm btn-primary" style={{ marginTop: 10 }} onClick={onNouvelEvent}>
            <Plus /> Nouveau rendez-vous
          </button>
        ) : (
          <p className="agenda-note" style={{ marginTop: 10 }}>
            Agenda Google non connecté — voir « Agenda Google » en haut de page.
          </p>
        )}
      </div>

      <div className="form-group" style={{ marginTop: 18 }}>
        <label>Jalons internes (non visibles dans Google Agenda)</label>
        <div className="day-list">
          {jalons.length === 0 && <p className="agenda-note">Aucun jalon interne ce jour-là.</p>}
          {jalons.map((e) => (
            <button key={e.id} type="button" className="day-row" onClick={() => onEditerJalon(e)}>
              <span className="h">◆</span>
              <span className="t">
                {e.label}
                <span className="l"> — {EVENT_TYPES.find((t) => t.value === e.type)?.label || e.type}</span>
              </span>
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-sm btn-secondary" style={{ marginTop: 10 }} onClick={onNouveauJalon}>
          <Plus /> Nouveau jalon interne
        </button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Formulaire rendez-vous (Google Agenda)
// ---------------------------------------------------------------------------

function EventForm({
  date,
  event,
  onCancel,
  onSave,
  onDelete,
}: {
  date: string;
  event: AgendaEvent | null;
  onCancel: () => void;
  onSave: (champs: { title: string; start: string; end?: string; location?: string; notes?: string }) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [titre, setTitre] = useState(event?.title ?? '');
  const [journee, setJournee] = useState(event?.allDay ?? false);
  const [d, setD] = useState(event ? jourDe(event.start) : date);
  const [debut, setDebut] = useState(event && !event.allDay ? heureDe(event.start) : '09:00');
  const [fin, setFin] = useState(event && !event.allDay ? heureDe(event.end) : '10:00');
  const [lieu, setLieu] = useState(event?.location ?? '');
  const [notes, setNotes] = useState(event?.notes ?? '');
  const [envoi, setEnvoi] = useState(false);

  const [a, mo, j] = d.split('-').map(Number);
  const lienGoogle = `https://calendar.google.com/calendar/u/0/r/day/${a}/${mo}/${j}`;

  const invalide = !titre.trim() || (!journee && fin <= debut);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (invalide || envoi) return;
    setEnvoi(true);
    try {
      await onSave({
        title: titre.trim(),
        start: journee ? d : `${d}T${debut}`,
        end: journee ? undefined : `${d}T${fin}`,
        location: lieu.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="form-group">
        <label>Intitulé *</label>
        <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex : Rendez-vous client" required autoFocus />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Date</label>
          <input type="date" value={d} onChange={(e) => setD(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Durée</label>
          <label className="switch" style={{ paddingTop: 12 }}>
            <input type="checkbox" checked={journee} onChange={(e) => setJournee(e.target.checked)} />
            Journée entière
          </label>
        </div>
      </div>

      {!journee && (
        <div className="form-row">
          <div className="form-group">
            <label>Début</label>
            <input type="time" value={debut} onChange={(e) => setDebut(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Fin</label>
            <input type="time" value={fin} onChange={(e) => setFin(e.target.value)} />
          </div>
        </div>
      )}

      <div className="form-group">
        <label>Lieu</label>
        <input value={lieu} onChange={(e) => setLieu(e.target.value)} placeholder="Ex : 12 rue Jacques Leonhart, Saint-Amarin" />
      </div>

      <div className="form-group">
        <label>Notes</label>
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Contexte, ordre du jour…" />
      </div>

      <p className="agenda-note">
        L'événement est écrit dans <b>Google Agenda</b> : rappels, invités et récurrences se règlent ensuite depuis
        Google (téléphone ou web).{' '}
        <a href={lienGoogle} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
          Ouvrir ce jour dans Google Agenda
        </a>
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 20 }}>
        {onDelete ? (
          <button type="button" className="btn btn-danger" onClick={onDelete}><Trash2 /> Supprimer</button>
        ) : <span />}
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Annuler</button>
          <button type="submit" className="btn btn-primary" disabled={invalide || envoi}>
            {envoi ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Formulaire jalon interne (Supabase)
// ---------------------------------------------------------------------------

function JalonForm({
  date,
  jalon,
  onCancel,
  onSave,
  onDelete,
}: {
  date: string;
  jalon: PlanningEvent | null;
  onCancel: () => void;
  onSave: (champs: Omit<PlanningEvent, 'id' | 'created_at'>) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [label, setLabel] = useState(jalon?.label ?? '');
  const [type, setType] = useState(jalon?.type ?? 'task');
  const [d, setD] = useState(jalon?.date ?? date);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    onSave({ label: label.trim(), type, date: d });
  };

  return (
    <form onSubmit={submit}>
      <div className="form-group">
        <label>Intitulé *</label>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex : Échéance facture F-2026-001" required autoFocus />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Date</label>
          <input type="date" value={d} onChange={(e) => setD(e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 20 }}>
        {onDelete ? (
          <button type="button" className="btn btn-danger" onClick={onDelete}><Trash2 /> Supprimer</button>
        ) : <span />}
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Annuler</button>
          <button type="submit" className="btn btn-primary" disabled={!label.trim()}>Enregistrer</button>
        </div>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Connexion du pont Google
// ---------------------------------------------------------------------------

function ConfigModal({
  cfg,
  onClose,
  onConfigured,
  onCleared,
}: {
  cfg: AgendaConfig | null;
  onClose: () => void;
  onConfigured: (c: AgendaConfig) => Promise<void>;
  onCleared: () => Promise<void>;
}) {
  const [url, setUrl] = useState(cfg?.url ?? '');
  const [code, setCode] = useState(cfg?.code ?? '');
  const [essai, setEssai] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enregistre, setEnregistre] = useState(false);
  const [occupe, setOccupe] = useState(false);

  /** Contrôle de forme avant tout appel : l'URL doit être celle du déploiement, rien après. */
  const verifierFormat = (): AgendaConfig | null => {
    setErreur(null);
    setEssai(null);
    const c = { url: url.trim(), code: code.trim() };
    if (!c.url || !c.code) {
      setErreur("L'URL /exec et le code secret sont tous les deux nécessaires.");
      return null;
    }
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(c.url)) {
      setErreur(
        "L'URL doit être exactement celle du déploiement et se terminer par /exec — rien après (ni espace, ni /exec>, ni /dev).",
      );
      return null;
    }
    return c;
  };

  const tester = async (c: AgendaConfig): Promise<boolean> => {
    try {
      const info = await agendaPing(c);
      setEssai(`Connexion réussie — agenda « ${info.agenda} » (${info.fuseau}).`);
      return true;
    } catch (e) {
      setErreur(e instanceof AgendaError ? e.message : String(e));
      return false;
    }
  };

  const testerSeul = async () => {
    const c = verifierFormat();
    if (!c) return;
    setOccupe(true);
    await tester(c);
    setOccupe(false);
  };

  const enregistrer = async (e: FormEvent) => {
    e.preventDefault();
    const c = verifierFormat();
    if (!c) return;
    setOccupe(true);
    try {
      // On enregistre AVANT de tester : la configuration reste en place même si
      // le pont ne répond pas encore, sinon il n'y a rien à diagnostiquer.
      await saveAgendaConfig(c);
      setEnregistre(true);
      await onConfigured(c);
      await tester(c);
    } catch (err) {
      if (tableIntegrationsAbsente(err)) {
        setErreur("Table « integrations » absente : exécuter la migration 20260923120000_add_integrations.sql dans Supabase.");
      } else {
        setErreur(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setOccupe(false);
    }
  };

  return (
    <Modal title="Agenda Google" onClose={onClose}>
      <form onSubmit={enregistrer}>
        <div className="form-group">
          <label>URL du déploiement Apps Script (/exec)</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/…/exec"
            spellCheck={false}
          />
        </div>
        <div className="form-group">
          <label>Code secret (propriété AGENDA_BRIDGE_CODE)</label>
          <input type="password" value={code} onChange={(e) => setCode(e.target.value)} placeholder="••••••••" spellCheck={false} />
        </div>

        {enregistre && (
          <div className="alert alert-success" style={{ marginTop: 6 }}>
            Configuration enregistrée dans Supabase.
          </div>
        )}
        {essai && <div className="alert alert-success" style={{ marginTop: 6 }}>{essai}</div>}
        {erreur && <div className="alert alert-warning" style={{ marginTop: 6 }}><AlertTriangle /> <span>{erreur}</span></div>}

        <p className="agenda-note" style={{ marginTop: 14 }}>
          Ces deux valeurs donnent accès à l'agenda : elles sont enregistrées dans Supabase (table <b>integrations</b>),
          lisible seulement par un compte connecté au dashboard. Le code du site est public, elles n'y figurent jamais.
          Révoquer l'accès = supprimer le déploiement dans Apps Script, ou changer la propriété AGENDA_BRIDGE_CODE.
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 20 }}>
          {cfg ? (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => { if (window.confirm("Déconnecter l'agenda Google du dashboard ?")) onCleared(); }}
            >
              <Unplug /> Déconnecter
            </button>
          ) : <span />}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={testerSeul} disabled={occupe}>Tester</button>
            <button type="submit" className="btn btn-primary" disabled={occupe}>
              {occupe ? 'Vérification…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
