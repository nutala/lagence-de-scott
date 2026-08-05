import React, { useState, FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { useAdminData } from '../AdminDataContext';
import { Modal } from '../components';
import { EVENT_TYPES } from '../types';
import type { PlanningEvent } from '../types';

interface Cell {
  day: number;
  other: boolean;
  date: string | null;
}

export default function PlanningPage() {
  const { events, saveEvent, deleteEvent, notify, logActivite } = useAdminData();
  const now = new Date();
  const [y, setY] = useState(now.getFullYear());
  const [m, setM] = useState(now.getMonth());
  const [modal, setModal] = useState<{ date: string } | { event: PlanningEvent } | null>(null);

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

  const today = now.toISOString().slice(0, 10);

  const nav = (delta: number) => {
    let ny = y;
    let nm = m + delta;
    if (nm < 0) { nm = 11; ny -= 1; }
    if (nm > 11) { nm = 0; ny += 1; }
    setY(ny);
    setM(nm);
  };

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
              </div>
            );
          })}
        </div>
      </div>

      {modal && (
        'event' in modal ? (
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
  const [d, setD] = useState(event?.date ?? date ?? new Date().toISOString().slice(0, 10));

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
