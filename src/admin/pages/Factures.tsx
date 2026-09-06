import React, { useState, FormEvent } from 'react';
import { Plus, Trash2, Pencil, Printer, X } from 'lucide-react';
import { useAdminData } from '../AdminDataContext';
import { Modal, EmptyState } from '../components';
import { formatEUR, formatDate, clientName, facturesTotal, FACTURE_STATUTS } from '../types';
import type { Facture, FactureLigne } from '../types';
import { printInvoice } from '../pdf';

export default function FacturesPage() {
  const { clients, devis, factures, facturesLignes, settings, saveFacture, updateFactureStatut, deleteFacture, notify, logActivite } = useAdminData();
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
              <thead><tr><th>N°</th><th>Client</th><th>Origine</th><th>Titre</th><th>Total TTC</th><th>Statut</th><th>Date</th><th>Échéance</th><th style={{ width: 130 }}>Actions</th></tr></thead>
              <tbody>
                {factures.map((f) => {
                  const lignes = facturesLignes.filter((l) => l.facture_id === f.id);
                  const tvaVal = Number(f.tva ?? 0);
                  const ttc = lignes.length ? facturesTotal(facturesLignes, f.id) * (1 + tvaVal / 100) : Number(f.montant);
                  const dv = f.devis_id ? devis.find((x) => x.id === f.devis_id) : null;
                  return (
                    <tr key={f.id}>
                      <td style={{ fontWeight: 500, fontFamily: 'var(--font-display)' }}>{f.numero}</td>
                      <td>{clientName(clients, f.client_id)}</td>
                      <td style={{ color: 'var(--muted)', fontSize: 13 }}>{dv ? `Devis ${dv.numero}` : '—'}</td>
                      <td style={{ color: 'var(--muted)' }}>{f.titre || '—'}</td>
                      <td style={{ fontWeight: 600 }}>{formatEUR(ttc)}</td>
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
                            printInvoice({
                              type: 'facture',
                              numero: f.numero,
                              titre: f.titre,
                              date: f.date,
                              statut: f.statut,
                              date2Label: 'Échéance',
                              date2Text: f.echeance ? formatDate(f.echeance) : null,
                              client: clients.find((c) => c.id === f.client_id) ?? null,
                              rows: lignes.length ? lignes : [{ description: 'Prestation', quantite: 1, prix_unitaire: Number(f.montant) / (1 + tvaVal / 100) }],
                              tva: tvaVal,
                              notes: f.notes,
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
                  );
                })}
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
          onSave={async (fields, lignes, id) => {
            await saveFacture(fields, lignes, id ?? undefined);
            notify(id ? 'Facture mise à jour' : 'Facture créée');
            logActivite(id ? `Facture ${fields.titre || ''} modifiée` : `Nouvelle facture pour ${clientName(clients, fields.client_id)}`);
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
  onSave: (fields: Omit<Facture, 'id' | 'created_at' | 'numero' | 'montant'>, lignes: FactureLigne[], id?: string) => Promise<void>;
}) {
  const { clients, settings, facturesLignes } = useAdminData();
  const [clientId, setClientId] = useState(facture?.client_id ?? '');
  const [titre, setTitre] = useState(facture?.titre ?? '');
  const [date, setDate] = useState(facture?.date ?? new Date().toISOString().slice(0, 10));
  const [echeance, setEcheance] = useState(facture?.echeance ?? '');
  const [statut, setStatut] = useState(facture?.statut ?? 'Brouillon');
  const [tva, setTva] = useState(facture ? String(facture.tva) : String(settings?.tva_default ?? 20));
  const [notes, setNotes] = useState(facture?.notes ?? '');
  const [lignes, setLignes] = useState<FactureLigne[]>(
    facture ? (facturesLignes.filter((l) => l.facture_id === facture.id).length ? facturesLignes.filter((l) => l.facture_id === facture.id) : [{ description: '', quantite: 1, prix_unitaire: 0 }]) : [{ description: '', quantite: 1, prix_unitaire: 0 }],
  );

  const ht = lignes.reduce((s, l) => s + (l.inclus ? 0 : (Number(l.quantite) || 0) * (Number(l.prix_unitaire) || 0)), 0);
  const tvaVal = Number(tva) || 0;
  const ttc = ht * (1 + tvaVal / 100);

  const updateLigne = (i: number, patch: Partial<FactureLigne>) => {
    setLignes((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      window.alert('Veuillez sélectionner un client.');
      return;
    }
    onSave(
      { client_id: clientId, titre, date, statut, tva: tvaVal, notes, echeance: echeance || null, devis_id: facture?.devis_id ?? null },
      lignes.filter((l) => l.description.trim()),
      facture?.id,
    );
  };

  return (
    <Modal title={facture ? `Modifier la facture ${facture.numero}` : 'Nouvelle facture'} onClose={onClose} wide>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Client *</label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
              <option value="">Sélectionner un client</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Titre de la facture</label>
            <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex : Refonte site vitrine" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="form-group"><label>Échéance</label><input type="date" value={echeance} onChange={(e) => setEcheance(e.target.value)} /></div>
        </div>

        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Prestations</span>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setLignes((prev) => [...prev, { description: '', quantite: 1, prix_unitaire: 0 }])}>
              <Plus /> Ajouter une ligne
            </button>
          </div>
          {lignes.map((l, i) => (
            <div key={i} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 10 }}>
              <div className="form-row line-row" style={{ alignItems: 'center', marginBottom: 8 }}>
                <input placeholder="Description de la prestation" value={l.description} onChange={(e) => updateLigne(i, { description: e.target.value })} />
                <input type="number" min="0" step="any" placeholder="Qté" value={String(l.quantite)} onChange={(e) => updateLigne(i, { quantite: Number(e.target.value) })} />
                <input type="number" min="0" step="0.01" placeholder="Prix unitaire" value={String(l.prix_unitaire)} onChange={(e) => updateLigne(i, { prix_unitaire: Number(e.target.value) })} disabled={!!l.inclus} style={l.inclus ? { opacity: 0.5 } : undefined} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, whiteSpace: 'nowrap', cursor: 'pointer' }}><input type="checkbox" checked={!!l.inclus} onChange={(e) => updateLigne(i, { inclus: e.target.checked })} /> Inclus</label>
                <button type="button" className="btn btn-ghost btn-icon" style={{ color: 'var(--danger)' }} onClick={() => setLignes((prev) => prev.filter((_, idx) => idx !== i))} aria-label="Supprimer la ligne"><X /></button>
              </div>
              <textarea
                rows={3}
                value={l.details ?? ''}
                onChange={(e) => updateLigne(i, { details: e.target.value })}
                placeholder="Éléments compris dans cette prestation (1 par ligne)&#10;Ex : Le Pack Signature comprend :&#10;Conception graphique sur mesure&#10;Mise en ligne"
                style={{ width: '100%', fontSize: 13 }}
                aria-label="Éléments compris dans la prestation"
              />
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 12, borderTop: '1px solid var(--border)', marginTop: 12, fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--muted)' }}>Total HT</span><span style={{ fontWeight: 600 }}>{formatEUR(ht)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--muted)' }}>TVA</span><span style={{ fontWeight: 600 }}>{formatEUR(ht * tvaVal / 100)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18 }}><span>Total TTC</span><span style={{ fontWeight: 700, color: 'var(--accent)' }}>{formatEUR(ttc)}</span></div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>TVA (%)</label>
            <input type="number" min="0" max="100" step="0.1" value={tva} onChange={(e) => setTva(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Statut</label>
            <select value={statut} onChange={(e) => setStatut(e.target.value)}>
              {FACTURE_STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Notes / Conditions</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Conditions de paiement, délais…" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn btn-primary">Enregistrer la facture</button>
        </div>
      </form>
    </Modal>
  );
}
