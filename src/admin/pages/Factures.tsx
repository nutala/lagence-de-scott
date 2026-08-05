import React, { useState, FormEvent } from 'react';
import { Plus, Trash2, Pencil, Printer } from 'lucide-react';
import { useAdminData } from '../AdminDataContext';
import { Modal, EmptyState } from '../components';
import { formatEUR, formatDate, clientName, FACTURE_STATUTS } from '../types';
import type { Facture } from '../types';
import { printInvoice } from '../pdf';

export default function FacturesPage() {
  const { clients, factures, settings, saveFacture, updateFactureStatut, deleteFacture, notify, logActivite } = useAdminData();
  const [modal, setModal] = useState<'new' | Facture | null>(null);

  const encaisse = factures.filter((f) => f.statut === 'Payée').reduce((s, f) => s + Number(f.montant), 0);
  const enAttente = factures.filter((f) => f.statut === 'Envoyée' || f.statut === 'Brouillon' || f.statut === 'Relancée').reduce((s, f) => s + Number(f.montant), 0);
  const enRetard = factures.filter((f) => f.statut === 'En retard').reduce((s, f) => s + Number(f.montant), 0);

  return (
    <div className="page-enter">
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-label">Encaissé</div>
          <div className="kpi-value" style={{ color: 'var(--success)' }}>{formatEUR(encaisse)}</div>
          <div className="kpi-change up">{factures.filter((f) => f.statut === 'Payée').length} facture(s) payée(s)</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">En attente</div>
          <div className="kpi-value">{formatEUR(enAttente)}</div>
          <div className="kpi-change up">À encaisser</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">En retard</div>
          <div className="kpi-value" style={{ color: enRetard ? 'var(--danger)' : 'var(--muted)' }}>{formatEUR(enRetard)}</div>
          <div className="kpi-change down">{enRetard ? 'Relance nécessaire' : 'Aucun retard'}</div>
        </div>
      </div>

      <div className="filter-bar">
        <button className="btn btn-primary" onClick={() => setModal('new')}><Plus /> Nouvelle facture</button>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {factures.length ? (
            <table>
              <thead><tr><th>N°</th><th>Client</th><th>Montant</th><th>Statut</th><th>Date</th><th>Échéance</th><th style={{ width: 130 }}>Actions</th></tr></thead>
              <tbody>
                {factures.map((f) => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 500, fontFamily: 'var(--font-display)' }}>{f.numero}</td>
                    <td>{clientName(clients, f.client_id)}</td>
                    <td style={{ fontWeight: 600 }}>{formatEUR(f.montant)}</td>
                    <td>
                      <select
                        value={f.statut}
                        onChange={(e) => {
                          updateFactureStatut(f.id, e.target.value);
                          notify(`Facture ${f.numero} → ${e.target.value}`);
                          logActivite(`Facture ${f.numero} marquée « ${e.target.value} »`);
                        }}
                        style={{ fontSize: 13, padding: '6px 10px', minWidth: 120 }}
                        aria-label="Changer le statut"
                      >
                        {FACTURE_STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: 13 }}>{formatDate(f.date)}</td>
                    <td style={{ color: f.statut === 'En retard' ? 'var(--danger)' : 'var(--muted)', fontSize: 13, fontWeight: f.statut === 'En retard' ? 600 : 400 }}>{formatDate(f.echeance)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-sm btn-primary" onClick={() => {
                          const tvaVal = Number(settings?.tva_default ?? 0);
                          const ht = f.montant / (1 + tvaVal / 100);
                          printInvoice({
                            type: 'facture',
                            numero: f.numero,
                            titre: null,
                            date: f.date,
                            statut: f.statut,
                            date2Label: 'Échéance',
                            date2Text: f.echeance ? formatDate(f.echeance) : null,
                            client: clients.find((c) => c.id === f.client_id) ?? null,
                            rows: [{ description: 'Prestation', quantite: 1, prix_unitaire: ht }],
                            tva: tvaVal,
                            notes: null,
                            settings,
                          });
                        }} aria-label="Exporter en PDF"><Printer /></button>
                        <button className="btn btn-sm btn-ghost" onClick={() => setModal(f)} aria-label="Modifier"><Pencil /></button>
                        <button
                          className="btn btn-sm btn-ghost"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => {
                            if (window.confirm(`Supprimer la facture ${f.numero} ?`)) {
                              deleteFacture(f.id);
                              notify('Facture supprimée');
                              logActivite(`Facture ${f.numero} supprimée`);
                            }
                          }}
                          aria-label="Supprimer"
                        >
                          <Trash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState title="Aucune facture" description="Créez votre première facture pour suivre vos encaissements." />
          )}
        </div>
      </div>

      {modal && (
        <FactureForm
          facture={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={async (fields, id) => {
            await saveFacture(fields, id ?? undefined);
            notify(id ? 'Facture mise à jour' : 'Facture créée');
            logActivite(id ? 'Facture modifiée' : `Nouvelle facture pour ${clientName(clients, fields.client_id)}`);
            setModal(null);
          }}
        />
      )}
    </div>
  );
}

function FactureForm({
  facture,
  onClose,
  onSave,
}: {
  facture: Facture | null;
  onClose: () => void;
  onSave: (fields: Omit<Facture, 'id' | 'created_at' | 'numero'>, id?: string) => Promise<void>;
}) {
  const { clients } = useAdminData();
  const [clientId, setClientId] = useState(facture?.client_id ?? '');
  const [montant, setMontant] = useState(facture ? String(facture.montant) : '');
  const [statut, setStatut] = useState(facture?.statut ?? 'Brouillon');
  const [date, setDate] = useState(facture?.date ?? new Date().toISOString().slice(0, 10));
  const [echeance, setEcheance] = useState(facture?.echeance ?? '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      window.alert('Veuillez sélectionner un client.');
      return;
    }
    onSave({ client_id: clientId, montant: Number(montant) || 0, statut, date, echeance: echeance || null }, facture?.id);
  };

  return (
    <Modal title={facture ? `Modifier la facture ${facture.numero}` : 'Nouvelle facture'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Client *</label>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
            <option value="">Sélectionner un client</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Montant (€ TTC)</label><input type="number" min="0" step="0.01" value={montant} onChange={(e) => setMontant(e.target.value)} required /></div>
          <div className="form-group"><label>Statut</label><select value={statut} onChange={(e) => setStatut(e.target.value)}>{FACTURE_STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="form-group"><label>Échéance</label><input type="date" value={echeance} onChange={(e) => setEcheance(e.target.value)} /></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn btn-primary">Enregistrer</button>
        </div>
      </form>
    </Modal>
  );
}
