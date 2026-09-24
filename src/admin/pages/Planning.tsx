import React, { useState, FormEvent } from 'react';
import { CheckCircle2, RotateCcw, Trash2 } from 'lucide-react';
import { useAdminData } from '../AdminDataContext';
import { Badge, Modal } from '../components';
import {
  EVENT_TYPES, PRIORITE_COLORS, PRIORITE_LABELS, formatDate, formatDateShort, projetTitle,
} from '../types';
import type { PlanningEvent, Tache } from '../types';

interface Cell {
  day: number;
  other: boolean;
  date: string | null;
}

/** Date locale en AAAA-MM-JJ (toISOString donne la date UTC : faux en soirée). */
const isoLocal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Tâches affichées par case avant le « +N ». */
const MAX_TACHES_CASE = 3;

export default function PlanningPage() {
  const { events, taches, projets, saveEvent, deleteEvent, notify, logActivite, updateTacheStatut } = useAdminData();
  const now = new Date();
  const [y, setY] = useState(now.getFullYear());
  const [m, setM] = useState(now.getMonth());
  const [modal, setModal] = useState<{ date: string } | { event: PlanningEvent } | { tache: Tache } | null>(null);

  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const first = new Date(y, m, 1);
  const totalDays = new Date(y, m + 1, 0).getDate();
  let startDay = first.getDay() - 1;
  if (startDay < 0) startDay = 6;
  const prev = new Date(y, m, 0);

  const cells: Cell[] = [];
  for (let i = startDay - 1; i >= 0; i--) cells.push({ day: prev.getDate() - i, other: true, date: null });
  for (let d = 1; d <= totalDays; d++) {
    cells.push({ day: d, other: false, date: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
  }
  let tail = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ day: tail++, other: true, date: null });
  }

  const today = isoLocal(now);

  const nav = (delta: number) => {
    let ny = y;
    let nm = m + delta;
    if (nm < 0) { nm = 11; ny -= 1; }
    if (nm > 11) { nm = 0; ny += 1; }
    setY(ny);
    setM(nm);
  };

  /** Tâches dont l'échéance tombe ce jour-là (les terminées en dernier). */
  const tachesDuJour = (date: string) =>
    taches
      .filter((t) => t.echeance === date)
      .sort((a, b) => (a.statut === 'Terminée' ? 1 : 0) - (b.statut === 'Terminée' ? 1 : 0));

  const tachesSansEcheance = taches.filter((t) => !t.echeance && t.statut !== 'Terminée').length;

  return (
    <div className="page-enter">
      <div className="filter-bar" style={{ justifyContent: 'center', gap: 20 }}>
        <button className="btn btn-ghost" onClick={() => nav(-1)} aria-label="Mois précédent">←</button>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18 }}>{months[m]} {y}</span>
        <button className="btn btn-ghost" onClick={() => nav(1)} aria-label="Mois suivant">→</button>
        <button className="btn btn-sm btn-secondary" onClick={() => { setY(now.getFullYear()); setM(now.getMonth()); }}>Aujourd'hui</button>
      </div>

      <div className="calendar-wrap">
        <div className="calendar">
          {days.map((d) => <div className="cal-head" key={d}>{d}</div>)}
          {cells.map((c, i) => {
            const evts = c.date ? events.filter((e) => e.date === c.date) : [];
            const cellTaches = c.date ? tachesDuJour(c.date) : [];
            return (
              <div
                key={i}
                className={`cal-day${c.other ? ' other' : ''}${c.date === today ? ' today' : ''}`}
                onClick={() => c.date && setModal({ date: c.date })}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' && c.date) setModal({ date: c.date }); }}
              >
                <div className="cal-day-num">{c.day}</div>
                {evts.map((e) => (
                  <div key={e.id} className={`cal-event ${e.type}`} onClick={(ev) => { ev.stopPropagation(); setModal({ event: e }); }}>
                    {e.label}
                  </div>
                ))}
                {cellTaches.slice(0, MAX_TACHES_CASE).map((t) => {
                  const faite = t.statut === 'Terminée';
                  const retard = !faite && !!t.echeance && t.echeance < today;
                  return (
                    <div
                      key={t.id}
                      className={`cal-event tache${faite ? ' tache-faite' : ''}${retard ? ' tache-retard' : ''}`}
                      title={`Tâche « ${t.titre} » — échéance ${formatDateShort(t.echeance)} · ${t.statut}`}
                      onClick={(ev) => { ev.stopPropagation(); setModal({ tache: t }); }}
                    >
                      {retard ? '⚠' : '▸'} {t.titre}
                    </div>
                  );
                })}
                {cellTaches.length > MAX_TACHES_CASE && (
                  <div className="cal-more">+{cellTaches.length - MAX_TACHES_CASE} tâche(s)</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="planning-legende">
        <span><i style={{ background: 'var(--accent)' }} /> Événement du planning</span>
        <span><i style={{ background: 'var(--surface-raised)', border: '1px solid var(--muted)' }} /> Tâche, à sa date d'échéance</span>
        <span><i style={{ background: 'var(--danger)' }} /> Tâche en retard</span>
        {tachesSansEcheance > 0 && <span>— {tachesSansEcheance} tâche(s) sans échéance, non affichée(s)</span>}
      </div>

      {modal && (
        'tache' in modal ? (
          <Modal title="Tâche" onClose={() => setModal(null)}>
            <TacheDetail
              tache={modal.tache}
              projetNom={modal.tache.projet_id ? projetTitle(projets, modal.tache.projet_id) : '—'}
              onClose={() => setModal(null)}
              onBasculer={async () => {
                const nouveau = modal.tache.statut === 'Terminée' ? 'À faire' : 'Terminée';
                await updateTacheStatut(modal.tache.id, nouveau);
                notify(`Tâche « ${modal.tache.titre} » → ${nouveau}`);
                logActivite(`Tâche « ${modal.tache.titre} » déplacée vers ${nouveau} (depuis le planning)`);
                setModal(null);
              }}
            />
          </Modal>
        ) : 'event' in modal ? (
          <Modal title="Modifier l'événement" onClose={() => setModal(null)}>
            <EventForm
              event={modal.event}
              onClose={() => setModal(null)}
              onSave={async (fields) => {
                await saveEvent(fields, modal.event.id);
                notify('Événement mis à jour');
                logActivite(`Événement modifié : ${fields.label}`);
                setModal(null);
              }}
              onDelete={async () => {
                if (window.confirm(`Supprimer l'événement « ${modal.event.label} » ?`)) {
                  await deleteEvent(modal.event.id);
                  notify('Événement supprimé');
                  setModal(null);
                }
              }}
            />
          </Modal>
        ) : (
          <Modal title={`Nouvel événement — ${modal.date}`} onClose={() => setModal(null)}>
            <EventForm
              date={modal.date}
              onClose={() => setModal(null)}
              onSave={async (fields) => {
                await saveEvent(fields);
                notify('Événement créé');
                logActivite(`Nouvel événement : ${fields.label}`);
                setModal(null);
              }}
            />
          </Modal>
        )
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Détail d'une tâche : lecture, et bascule terminée / à faire
// ---------------------------------------------------------------------------

function TacheDetail({
  tache,
  projetNom,
  onClose,
  onBasculer,
}: {
  tache: Tache;
  projetNom: string;
  onClose: () => void;
  onBasculer: () => Promise<void>;
}) {
  const faite = tache.statut === 'Terminée';
  const [envoi, setEnvoi] = useState(false);

  return (
    <div className="tache-detail">
      <div className="tache-detail-titre">{tache.titre}</div>

      <div className="tache-detail-ligne">
        <span className={`kanban-card-priority ${PRIORITE_COLORS[tache.priorite]}`} />
        <span>{PRIORITE_LABELS[tache.priorite] || tache.priorite}</span>
        <Badge statut={tache.statut} />
      </div>

      <dl>
        <dt>Échéance</dt><dd>{formatDate(tache.echeance)}</dd>
        <dt>Projet</dt><dd>{projetNom}</dd>
        <dt>Créée le</dt><dd>{formatDate(tache.created_at)}</dd>
      </dl>

      {tache.description && <p className="tache-detail-notes">{tache.description}</p>}

      <div className="tache-detail-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Fermer</button>
        <button
          type="button"
          className={faite ? 'btn btn-secondary' : 'btn btn-primary'}
          disabled={envoi}
          onClick={async () => { setEnvoi(true); try { await onBasculer(); } finally { setEnvoi(false); } }}
        >
          {faite ? <><RotateCcw /> Rouvrir</> : <><CheckCircle2 /> Marquer comme terminée</>}
        </button>
      </div>

      <p className="tache-detail-aide">
        Pour modifier le titre, la date ou le projet : page <b>Tâches</b>.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formulaire d'événement du planning (Supabase)
// ---------------------------------------------------------------------------

function EventForm({
  event,
  date,
  onClose,
  onSave,
  onDelete,
}: {
  event?: PlanningEvent;
  date?: string;
  onClose: () => void;
  onSave: (fields: Omit<PlanningEvent, 'id' | 'created_at'>) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [label, setLabel] = useState(event?.label ?? '');
  const [type, setType] = useState(event?.type ?? 'task');
  const [d, setD] = useState(event?.date ?? date ?? isoLocal(new Date()));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    onSave({ label: label.trim(), type, date: d });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Intitulé *</label>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex : Rendez-vous client" required autoFocus />
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
          <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn btn-primary" disabled={!label.trim()}>Enregistrer</button>
        </div>
      </div>
    </form>
  );
}
