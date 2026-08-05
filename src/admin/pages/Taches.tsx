import React, { useState, FormEvent, DragEvent } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { useAdminData } from '../AdminDataContext';
import { Modal } from '../components';
import {
  formatDateShort, projetTitle, PRIORITE_COLORS, PRIORITE_LABELS, TACHE_STATUTS, TACHE_PRIORITES,
} from '../types';
import type { Tache } from '../types';

export default function TachesPage() {
  const { projets, taches, saveTache, updateTacheStatut, deleteTache, notify, logActivite } = useAdminData();
  const [selectedProjet, setSelectedProjet] = useState('Tous');
  const [modal, setModal] = useState<'new' | Tache | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  const filtered = selectedProjet === 'Tous' ? taches : taches.filter((t) => t.projet_id === selectedProjet);

  const handleDrop = (col: string) => (e: DragEvent) => {
    e.preventDefault();
    const id = dragId || e.dataTransfer.getData('text/plain');
    if (id) {
      const t = taches.find((x) => x.id === id);
      updateTacheStatut(id, col);
      if (t && t.statut !== col) {
        notify(`Tâche « ${t.titre} » → ${col}`);
        logActivite(`Tâche « ${t.titre} » déplacée vers ${col}`);
      }
    }
    setDragId(null);
    setOverCol(null);
  };

  return (
    <div className="page-enter">
      <div className="filter-bar">
        <select value={selectedProjet} onChange={(e) => setSelectedProjet(e.target.value)}>
          <option value="Tous">Tous les projets</option>
          {projets.map((p) => <option key={p.id} value={p.id}>{p.titre}</option>)}
        </select>
        <button className="btn btn-primary" onClick={() => setModal('new')}><Plus /> Nouvelle tâche</button>
      </div>

      <div className="kanban">
        {TACHE_STATUTS.map((col) => (
          <div
            key={col}
            className={`kanban-col${overCol === col ? ' drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setOverCol(col); }}
            onDragLeave={() => setOverCol((prev) => (prev === col ? null : prev))}
            onDrop={handleDrop(col)}
          >
            <div className="kanban-col-header">
              <span className="kanban-col-title" style={{ color: col === 'Terminée' ? 'var(--success)' : col === 'En cours' ? 'var(--accent)' : 'var(--fg)' }}>{col}</span>
              <span className="kanban-col-count">{filtered.filter((t) => t.statut === col).length}</span>
            </div>
            {filtered.filter((t) => t.statut === col).map((t) => (
              <div
                key={t.id}
                className={`kanban-card${dragId === t.id ? ' dragging' : ''}`}
                draggable
                onDragStart={(e) => { setDragId(t.id); e.dataTransfer.setData('text/plain', t.id); }}
                onDragEnd={() => { setDragId(null); setOverCol(null); }}
              >
                <div className="kanban-card-title">{t.titre}</div>
                <div className="kanban-card-meta">
                  <span className={`kanban-card-priority ${PRIORITE_COLORS[t.priorite]}`} />
                  <span>{projetTitle(projets, t.projet_id)}</span>
                  {t.echeance && <span style={{ marginLeft: 'auto' }}>{formatDateShort(t.echeance)}</span>}
                </div>
                <div className="kanban-card-actions">
                  <button className="btn btn-sm btn-ghost" onClick={() => setModal(t)} aria-label="Modifier"><Pencil /></button>
                  <button
                    className="btn btn-sm btn-ghost"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => {
                      if (window.confirm(`Supprimer la tâche « ${t.titre} » ?`)) {
                        deleteTache(t.id);
                        notify('Tâche supprimée');
                      }
                    }}
                    aria-label="Supprimer"
                  >
                    <Trash2 />
                  </button>
                </div>
              </div>
            ))}
            {!filtered.some((t) => t.statut === col) && (
              <div style={{ fontSize: 12, color: 'var(--muted-dim)', padding: '16px 4px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
                Déposer une tâche ici
              </div>
            )}
          </div>
        ))}
      </div>

      {modal && (
        <TacheForm
          tache={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={async (fields, id) => {
            await saveTache(fields, id ?? undefined);
            notify(id ? 'Tâche mise à jour' : 'Tâche créée');
            logActivite(id ? `Tâche modifiée : ${fields.titre}` : `Nouvelle tâche : ${fields.titre}`);
            setModal(null);
          }}
        />
      )}
    </div>
  );
}

function TacheForm({
  tache,
  onClose,
  onSave,
}: {
  tache: Tache | null;
  onClose: () => void;
  onSave: (fields: Omit<Tache, 'id' | 'created_at'>, id?: string) => Promise<void>;
}) {
  const { projets } = useAdminData();
  const [titre, setTitre] = useState(tache?.titre ?? '');
  const [description, setDescription] = useState(tache?.description ?? '');
  const [projetId, setProjetId] = useState(tache?.projet_id ?? '');
  const [statut, setStatut] = useState(tache?.statut ?? 'À faire');
  const [priorite, setPriorite] = useState(tache?.priorite ?? 'moyenne');
  const [echeance, setEcheance] = useState(tache?.echeance ?? '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!titre.trim()) return;
    onSave(
      { titre: titre.trim(), description, projet_id: projetId || null, statut, priorite, echeance: echeance || null },
      tache?.id,
    );
  };

  return (
    <Modal title={tache ? 'Modifier la tâche' : 'Nouvelle tâche'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Titre *</label>
          <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex : Intégration header" required autoFocus />
        </div>
        <div className="form-group">
          <label>Projet lié</label>
          <select value={projetId} onChange={(e) => setProjetId(e.target.value)}>
            <option value="">Aucun projet</option>
            {projets.map((p) => <option key={p.id} value={p.id}>{p.titre}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Statut</label>
            <select value={statut} onChange={(e) => setStatut(e.target.value)}>
              {TACHE_STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Priorité</label>
            <select value={priorite} onChange={(e) => setPriorite(e.target.value)}>
              {TACHE_PRIORITES.map((p) => <option key={p} value={p}>{PRIORITE_LABELS[p]}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Échéance</label>
          <input type="date" value={echeance} onChange={(e) => setEcheance(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn btn-primary" disabled={!titre.trim()}>Enregistrer</button>
        </div>
      </form>
    </Modal>
  );
}
