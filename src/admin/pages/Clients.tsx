import React, { useState, FormEvent, useEffect } from 'react';
import { Plus, ArrowLeft, Trash2, Pencil } from 'lucide-react';
import { useAdminData } from '../AdminDataContext';
import { Modal, Badge, EmptyState } from '../components';
import { formatEUR, formatDate, devisTotal } from '../types';
import type { Client, PageKey } from '../types';

export default function ClientsPage({
  initialDetailId = null,
  setPage,
}: {
  initialDetailId?: string | null;
  setPage: (p: PageKey) => void;
}) {
  const { clients, projets, devis, devisLignes, factures, saveClient, deleteClient, notify, logActivite } = useAdminData();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(initialDetailId);
  const [modal, setModal] = useState<'new' | Client | null>(null);

  useEffect(() => {
    if (initialDetailId) setSelected(initialDetailId);
  }, [initialDetailId]);

  const filtered = clients.filter(
    (c) =>
      c.nom.toLowerCase().includes(search.toLowerCase()) ||
      (c.entreprise || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase()),
  );

  if (selected) {
    const c = clients.find((x) => x.id === selected);
    if (!c) return <EmptyState title="Client introuvable" description="Ce client n'existe plus ou a été supprimé." />;
    const clientProjets = projets.filter((p) => p.client_id === c.id);
    const clientDevis = devis.filter((d) => d.client_id === c.id);
    const clientFactures = factures.filter((f) => f.client_id === c.id);
    const ca = clientFactures.filter((f) => f.statut === 'Payée').reduce((s, f) => s + Number(f.montant), 0);

    return (
      <div className="page-enter">
        <div className="detail-header">
          <button className="btn btn-ghost btn-icon" onClick={() => setSelected(null)} aria-label="Retour à la liste"><ArrowLeft /></button>
          <h1>{c.nom}</h1>
          <span className="badge badge-accent">{clientProjets.length} projet{clientProjets.length > 1 ? 's' : ''}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn btn-sm btn-secondary" onClick={() => setModal(c)}><Pencil /> Modifier</button>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => {
                if (window.confirm(`Supprimer définitivement « ${c.nom} » et toutes ses données liées ?`)) {
                  deleteClient(c.id);
                  notify('Client supprimé');
                  logActivite(`Client supprimé : ${c.nom}`);
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
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><span style={{ fontSize: 12, color: 'var(--muted)' }}>Entreprise</span><div style={{ fontSize: 14 }}>{c.entreprise || '—'}</div></div>
              <div><span style={{ fontSize: 12, color: 'var(--muted)' }}>Email</span><div style={{ fontSize: 14 }}>{c.email || '—'}</div></div>
              <div><span style={{ fontSize: 12, color: 'var(--muted)' }}>Téléphone</span><div style={{ fontSize: 14 }}>{c.telephone || '—'}</div></div>
              <div><span style={{ fontSize: 12, color: 'var(--muted)' }}>Adresse</span><div style={{ fontSize: 14 }}>{c.adresse || '—'}</div></div>
              <div><span style={{ fontSize: 12, color: 'var(--muted)' }}>Ajouté le</span><div style={{ fontSize: 14 }}>{formatDate(c.created_at)}</div></div>
              <div><span style={{ fontSize: 12, color: 'var(--muted)' }}>CA facturé (payé)</span><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>{formatEUR(ca)}</div></div>
              {c.notes && (
                <div><span style={{ fontSize: 12, color: 'var(--muted)' }}>Notes</span><div style={{ fontSize: 14 }}>{c.notes}</div></div>
              )}
            </div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Projets</span></div>
            <div className="card-body">
              {clientProjets.length ? clientProjets.map((p) => (
                <div key={p.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{p.titre}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
                    <Badge statut={p.statut} />
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{formatEUR(p.budget)}</span>
                    <button className="btn btn-sm btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => setPage('projets')}>Voir <ArrowLeft style={{ transform: 'rotate(180deg)' }} /></button>
                  </div>
                </div>
              )) : <div style={{ color: 'var(--muted)', fontSize: 14 }}>Aucun projet</div>}
            </div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Devis</span></div>
            <div className="card-body">
              {clientDevis.length ? clientDevis.map((d) => (
                <div key={d.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 500, fontSize: 14, fontFamily: 'var(--font-display)' }}>{d.numero} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>— {d.titre}</span></div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
                    <Badge statut={d.statut} />
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{formatEUR(devisTotal(devisLignes, d.id))} · {formatDate(d.date)}</span>
                  </div>
                </div>
              )) : <div style={{ color: 'var(--muted)', fontSize: 14 }}>Aucun devis</div>}
            </div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Factures</span></div>
            <div className="card-body">
              {clientFactures.length ? clientFactures.map((f) => (
                <div key={f.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 500, fontSize: 14, fontFamily: 'var(--font-display)' }}>{f.numero}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
                    <Badge statut={f.statut} />
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{formatEUR(f.montant)} · éch. {formatDate(f.echeance)}</span>
                  </div>
                </div>
              )) : <div style={{ color: 'var(--muted)', fontSize: 14 }}>Aucune facture</div>}
            </div>
          </div>
        </div>
        {modal && (
          <ClientForm
            client={modal === 'new' ? null : modal}
            onClose={() => setModal(null)}
            onSave={async (fields, id) => {
              await saveClient(fields, id ?? undefined);
              notify(id ? 'Client mis à jour' : 'Client créé');
              logActivite(id ? `Client modifié : ${fields.nom}` : `Nouveau client ajouté : ${fields.nom}`);
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
        <input
          type="text"
          placeholder="Rechercher un client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <button className="btn btn-primary" onClick={() => setModal('new')}><Plus /> Nouveau client</button>
      </div>
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {filtered.length ? (
            <table>
              <thead>
                <tr><th>Nom</th><th>Entreprise</th><th>Email</th><th>Projets</th><th>CA facturé</th></tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const nb = projets.filter((p) => p.client_id === c.id).length;
                  const ca = factures.filter((f) => f.client_id === c.id && f.statut === 'Payée').reduce((s, f) => s + Number(f.montant), 0);
                  return (
                    <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(c.id)}>
                      <td style={{ fontWeight: 500 }}>{c.nom}</td>
                      <td style={{ color: 'var(--muted)' }}>{c.entreprise || '—'}</td>
                      <td style={{ fontSize: 13, color: 'var(--muted)' }}>{c.email || '—'}</td>
                      <td><span className="badge badge-muted">{nb}</span></td>
                      <td style={{ fontWeight: 600 }}>{formatEUR(ca)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <EmptyState
              title="Aucun client trouvé"
              description={search ? `Aucun résultat pour « ${search} ».` : 'Commencez par ajouter votre premier client.'}
            />
          )}
        </div>
      </div>
      {modal && (
        <ClientForm
          client={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={async (fields, id) => {
            await saveClient(fields, id ?? undefined);
            notify(id ? 'Client mis à jour' : 'Client créé');
            logActivite(id ? `Client modifié : ${fields.nom}` : `Nouveau client ajouté : ${fields.nom}`);
            setModal(null);
          }}
        />
      )}
    </div>
  );
}

function ClientForm({
  client,
  onClose,
  onSave,
}: {
  client: Client | null;
  onClose: () => void;
  onSave: (fields: Omit<Client, 'id' | 'created_at'>, id?: string) => Promise<void>;
}) {
  const [nom, setNom] = useState(client?.nom ?? '');
  const [entreprise, setEntreprise] = useState(client?.entreprise ?? '');
  const [email, setEmail] = useState(client?.email ?? '');
  const [telephone, setTelephone] = useState(client?.telephone ?? '');
  const [adresse, setAdresse] = useState(client?.adresse ?? '');
  const [notes, setNotes] = useState(client?.notes ?? '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) return;
    onSave({ nom: nom.trim(), entreprise, email, telephone, adresse, notes }, client?.id);
  };

  return (
    <Modal title={client ? 'Modifier le client' : 'Nouveau client'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nom *</label>
          <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom du contact" required autoFocus />
        </div>
        <div className="form-group">
          <label>Entreprise</label>
          <input value={entreprise} onChange={(e) => setEntreprise(e.target.value)} placeholder="Nom de l'entreprise" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@entreprise.fr" />
          </div>
          <div className="form-group">
            <label>Téléphone</label>
            <input type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="06 12 34 56 78" />
          </div>
        </div>
        <div className="form-group">
          <label>Adresse</label>
          <input value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="Adresse complète" />
        </div>
        <div className="form-group">
          <label>Notes</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Préférences, contexte…" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn btn-primary" disabled={!nom.trim()}>Enregistrer</button>
        </div>
      </form>
    </Modal>
  );
}
