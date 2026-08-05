import React, { useState, FormEvent, useEffect } from 'react';
import { Plus, ArrowLeft, Trash2, Pencil, LayoutGrid, Rows3 } from 'lucide-react';
import { useAdminData } from '../AdminDataContext';
import { Modal, Badge, EmptyState } from '../components';
import { formatEUR, formatDate, clientName, PRIORITE_COLORS, PROJET_STATUTS } from '../types';
import type { Projet, PageKey } from '../types';

export default function ProjetsPage({
  initialDetailId = null,
  setPage,
}: {
  initialDetailId?: string | null;
  setPage: (p: PageKey) => void;
}) {
  const { clients, projets, taches, saveProjet, deleteProjet, notify, logActivite } = useAdminData();
  const [filter, setFilter] = useState('Tous');
  const [view, setView] = useState<'liste' | 'grille'>('liste');
  const [selected, setSelected] = useState<string | null>(initialDetailId);
  const [modal, setModal] = useState<'new' | Projet | null>(null);

  useEffect(() => {
    if (initialDetailId) setSelected(initialDetailId);
  }, [initialDetailId]);

  const filtered = filter === 'Tous' ? projets : projets.filter((p) => p.statut === filter);

  if (selected) {
    const p = projets.find((x) => x.id === selected);
    if (!p) return <EmptyState title="Projet introuvable" description="Ce projet n'existe plus ou a été supprimé." />;
    const projetTaches = taches.filter((t) => t.projet_id === p.id);
    return (
      <div className="page-enter">
        <div className="detail-header">
          <button className="btn btn-ghost btn-icon" onClick={() => setSelected(null)} aria-label="Retour à la liste"><ArrowLeft /></button>
          <h1>{p.titre}</h1>
          <Badge statut={p.statut} />
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn btn-sm btn-secondary" onClick={() => setModal(p)}><Pencil /> Modifier</button>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => {
                if (window.confirm(`Supprimer définitivement le projet « ${p.titre} » (et ses tâches) ?`)) {
                  deleteProjet(p.id);
                  notify('Projet supprimé');
                  logActivite(`Projet supprimé : ${p.titre}`);
                  setSelected(null);
                }
              }}
            >
              <Trash2 /> Supprimer
            </button>
          </div>
        </div>
        <div className="grid-2">
          <div className="card">
            <div className="card-header"><span className="card-title">Informations</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Client</span>
                <div style={{ fontSize: 14 }}>{clientName(clients, p.client_id)}</div>
              </div>
              <div className="form-row">
                <div><span style={{ fontSize: 12, color: 'var(--muted)' }}>Début</span><div style={{ fontSize: 14 }}>{formatDate(p.debut)}</div></div>
                <div><span style={{ fontSize: 12, color: 'var(--muted)' }}>Deadline</span><div style={{ fontSize: 14 }}>{formatDate(p.deadline)}</div></div>
              </div>
              <div>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Budget estimé</span>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>{formatEUR(p.budget)}</div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
                  <span>Progression</span><span style={{ fontWeight: 600 }}>{p.progression}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${p.progression}%`, background: p.progression >= 80 ? 'var(--success)' : 'var(--accent)' }} />
                </div>
              </div>
              {p.description && (
                <div><span style={{ fontSize: 12, color: 'var(--muted)' }}>Description</span><div style={{ fontSize: 14, lineHeight: 1.6 }}>{p.description}</div></div>
              )}
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Tâches ({projetTaches.length})</span>
              <button className="btn btn-sm btn-secondary" onClick={() => setPage('taches')}>Gérer <ArrowLeft style={{ transform: 'rotate(180deg)' }} /></button>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {projetTaches.length ? (
                <table>
                  <thead><tr><th>Tâche</th><th>Priorité</th><th>Statut</th></tr></thead>
                  <tbody>
                    {projetTaches.map((t) => (
                      <tr key={t.id}>
                        <td style={{ fontWeight: 500 }}>{t.titre}</td>
                        <td><span className={`kanban-card-priority ${PRIORITE_COLORS[t.priorite]}`} style={{ display: 'inline-block', marginRight: 6 }} />{t.priorite}</td>
                        <td><Badge statut={t.statut} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: 30, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>Aucune tâche liée à ce projet.</div>
              )}
            </div>
          </div>
        </div>
        {modal && (
          <ProjetForm
            projet={modal === 'new' ? null : modal}
            onClose={() => setModal(null)}
            onSave={async (fields, id) => {
              await saveProjet(fields, id ?? undefined);
              notify(id ? 'Projet mis à jour' : 'Projet créé');
              logActivite(id ? `Projet modifié : ${fields.titre}` : `Nouveau projet : ${fields.titre}`);
              setModal(null);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="page-enter">
      <div className="filter-bar">
        {['Tous', ...PROJET_STATUTS].map((s) => (
          <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(s)}>{s}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button className={`btn btn-sm btn-ghost`} onClick={() => setView('liste')} style={{ opacity: view === 'liste' ? 1 : 0.5 }} aria-label="Vue liste"><Rows3 /></button>
          <button className={`btn btn-sm btn-ghost`} onClick={() => setView('grille')} style={{ opacity: view === 'grille' ? 1 : 0.5 }} aria-label="Vue grille"><LayoutGrid /></button>
          <button className="btn btn-sm btn-primary" onClick={() => setModal('new')}><Plus /> Nouveau projet</button>
        </div>
      </div>

      {view === 'liste' ? (
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            {filtered.length ? (
              <table>
                <thead><tr><th>Projet</th><th>Client</th><th>Statut</th><th>Budget</th><th>Progression</th><th>Deadline</th></tr></thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(p.id)}>
                      <td style={{ fontWeight: 500 }}>{p.titre}</td>
                      <td style={{ color: 'var(--muted)' }}>{clientName(clients, p.client_id)}</td>
                      <td><Badge statut={p.statut} /></td>
                      <td>{formatEUR(p.budget)}</td>
                      <td style={{ width: 120 }}>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${p.progression}%`, background: p.progression >= 80 ? 'var(--success)' : 'var(--accent)' }} />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, display: 'block' }}>{p.progression}%</span>
                      </td>
                      <td style={{ color: 'var(--muted)', fontSize: 13 }}>{formatDate(p.deadline)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState title="Aucun projet" description={filter === 'Tous' ? 'Créez votre premier projet pour commencer.' : `Aucun projet au statut « ${filter} ».`} />
            )}
          </div>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map((p) => (
            <div className="card" key={p.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(p.id)}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{p.titre}</div>
                  <Badge statut={p.statut} />
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>{clientName(clients, p.client_id)}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: 'var(--muted)' }}>{formatEUR(p.budget)}</span>
                  <span style={{ fontWeight: 600 }}>{p.progression}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${p.progression}%`, background: p.progression >= 80 ? 'var(--success)' : 'var(--accent)' }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>Échéance : {formatDate(p.deadline)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ProjetForm
          projet={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={async (fields, id) => {
            await saveProjet(fields, id ?? undefined);
            notify(id ? 'Projet mis à jour' : 'Projet créé');
            logActivite(id ? `Projet modifié : ${fields.titre}` : `Nouveau projet : ${fields.titre}`);
            setModal(null);
          }}
        />
      )}
    </div>
  );
}

function ProjetForm({
  projet,
  onClose,
  onSave,
}: {
  projet: Projet | null;
  onClose: () => void;
  onSave: (fields: Omit<Projet, 'id' | 'created_at'>, id?: string) => Promise<void>;
}) {
  const { clients } = useAdminData();
  const [titre, setTitre] = useState(projet?.titre ?? '');
  const [clientId, setClientId] = useState(projet?.client_id ?? '');
  const [statut, setStatut] = useState(projet?.statut ?? 'En attente');
  const [debut, setDebut] = useState(projet?.debut ?? '');
  const [deadline, setDeadline] = useState(projet?.deadline ?? '');
  const [budget, setBudget] = useState(projet ? String(projet.budget) : '');
  const [progression, setProgression] = useState(projet ? String(projet.progression) : '0');
  const [description, setDescription] = useState(projet?.description ?? '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!titre.trim()) return;
    onSave(
      {
        titre: titre.trim(),
        client_id: clientId || null,
        statut,
        debut: debut || null,
        deadline: deadline || null,
        budget: Number(budget) || 0,
        progression: Math.min(Math.max(Number(progression) || 0, 0), 100),
        description,
      },
      projet?.id,
    );
  };

  return (
    <Modal title={projet ? 'Modifier le projet' : 'Nouveau projet'} onClose={onClose} wide>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Titre *</label>
          <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex : Site vitrine boulangerie" required autoFocus />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Client</label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">Aucun client</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Statut</label>
            <select value={statut} onChange={(e) => setStatut(e.target.value)}>
              {PROJET_STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Date de début</label><input type="date" value={debut} onChange={(e) => setDebut(e.target.value)} /></div>
          <div className="form-group"><label>Deadline</label><input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Budget estimé (€)</label><input type="number" min="0" step="0.01" value={budget} onChange={(e) => setBudget(e.target.value)} /></div>
          <div className="form-group"><label>Progression (%)</label><input type="number" min="0" max="100" value={progression} onChange={(e) => setProgression(e.target.value)} /></div>
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Périmètre, livrables…" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn btn-primary" disabled={!titre.trim()}>Enregistrer</button>
        </div>
      </form>
    </Modal>
  );
}
