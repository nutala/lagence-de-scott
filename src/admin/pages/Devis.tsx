import React, { useState, FormEvent, useEffect } from 'react';
import { Plus, ArrowLeft, Trash2, Pencil, Printer, X } from 'lucide-react';
import { useAdminData } from '../AdminDataContext';
import { Modal, Badge, EmptyState } from '../components';
import { formatEUR, formatDate, clientName, devisTotal, DEVIS_STATUTS } from '../types';
import type { Devis, DevisLigne, Settings } from '../types';

export default function DevisPage({ initialDetailId = null }: { initialDetailId?: string | null }) {
  const {
    clients, devis, devisLignes, saveDevis, updateDevisStatut, deleteDevis,
    settings, notify, logActivite,
  } = useAdminData();
  const [selected, setSelected] = useState<string | null>(initialDetailId);
  const [modal, setModal] = useState<'new' | Devis | null>(null);
  const [statutFilter, setStatutFilter] = useState('Tous');

  useEffect(() => {
    if (initialDetailId) setSelected(initialDetailId);
  }, [initialDetailId]);

  const filtered = statutFilter === 'Tous' ? devis : devis.filter((d) => d.statut === statutFilter);

  if (selected) {
    const d = devis.find((x) => x.id === selected);
    if (!d) return <EmptyState title="Devis introuvable" description="Ce devis n'existe plus ou a été supprimé." />;
    const lines = devisLignes.filter((l) => l.devis_id === d.id);
    const ht = devisTotal(devisLignes, d.id);
    const ttc = ht * (1 + Number(d.tva || 0) / 100);
    return (
      <div className="page-enter">
        <div className="detail-header">
          <button className="btn btn-ghost btn-icon" onClick={() => setSelected(null)} aria-label="Retour à la liste"><ArrowLeft /></button>
          <h1>{d.numero}</h1>
          <Badge statut={d.statut} />
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select
              value={d.statut}
              onChange={(e) => {
                updateDevisStatut(d.id, e.target.value);
                notify(`Devis ${d.numero} → ${e.target.value}`);
                logActivite(`Devis ${d.numero} marqué « ${e.target.value} »`);
              }}
              style={{ fontSize: 13, padding: '6px 10px' }}
              aria-label="Changer le statut"
            >
              {DEVIS_STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn btn-sm btn-primary" onClick={() => printDevis(d, lines, clientName(clients, d.client_id), settings)}><Printer /> PDF</button>
            <button className="btn btn-sm btn-secondary" onClick={() => setModal(d)}><Pencil /> Modifier</button>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => {
                if (window.confirm(`Supprimer le devis ${d.numero} ?`)) {
                  deleteDevis(d.id);
                  notify('Devis supprimé');
                  logActivite(`Devis ${d.numero} supprimé`);
                  setSelected(null);
                }
              }}
            >
              <Trash2 /> Supprimer
            </button>
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: 20 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Informations</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><span style={{ fontSize: 12, color: 'var(--muted)' }}>Client</span><div style={{ fontSize: 14 }}>{clientName(clients, d.client_id)}</div></div>
              <div><span style={{ fontSize: 12, color: 'var(--muted)' }}>Titre</span><div style={{ fontSize: 14 }}>{d.titre || '—'}</div></div>
              <div className="form-row">
                <div><span style={{ fontSize: 12, color: 'var(--muted)' }}>Date</span><div style={{ fontSize: 14 }}>{formatDate(d.date)}</div></div>
                <div><span style={{ fontSize: 12, color: 'var(--muted)' }}>Validité</span><div style={{ fontSize: 14 }}>{d.validite}</div></div>
              </div>
              {d.notes && <div><span style={{ fontSize: 12, color: 'var(--muted)' }}>Notes</span><div style={{ fontSize: 14, lineHeight: 1.5 }}>{d.notes}</div></div>}
            </div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Total</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span style={{ color: 'var(--muted)' }}>Total HT</span><span>{formatEUR(ht)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span style={{ color: 'var(--muted)' }}>TVA ({d.tva}%)</span><span>{formatEUR(ht * Number(d.tva || 0) / 100)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 700, color: 'var(--accent)', borderTop: '1px solid var(--border)', paddingTop: 10 }}><span>Total TTC</span><span>{formatEUR(ttc)}</span></div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Prestations</span></div>
          <div className="card-body" style={{ padding: 0 }}>
            {lines.length ? (
              <table>
                <thead><tr><th>Description</th><th style={{ width: 80, textAlign: 'right' }}>Qté</th><th style={{ width: 140, textAlign: 'right' }}>Prix unitaire</th><th style={{ width: 140, textAlign: 'right' }}>Total</th></tr></thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.id}>
                      <td>{l.description}</td>
                      <td style={{ textAlign: 'right' }}>{l.quantite}</td>
                      <td style={{ textAlign: 'right' }}>{formatEUR(l.prix_unitaire)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatEUR(Number(l.quantite) * Number(l.prix_unitaire))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>Aucune prestation. Cliquez sur « Modifier » pour ajouter des lignes.</div>
            )}
          </div>
        </div>

        {modal && (
          <DevisForm
            devis={modal === 'new' ? null : modal}
            initialLines={modal === 'new' ? [{ description: '', quantite: 1, prix_unitaire: 0 }] : devisLignes.filter((l) => l.devis_id === (modal as Devis).id)}
            onClose={() => setModal(null)}
            onSave={async (fields, lignes, id) => {
              await saveDevis(fields, lignes, id ?? undefined);
              notify(id ? 'Devis mis à jour' : 'Devis créé');
              logActivite(id ? `Devis ${fields.titre || ''} modifié` : `Nouveau devis créé pour ${clientName(clients, fields.client_id)}`);
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
        <div className="tabs" style={{ marginBottom: 0 }}>
          {['Tous', ...DEVIS_STATUTS].map((s) => (
            <button key={s} className={`tab${statutFilter === s ? ' active' : ''}`} onClick={() => setStatutFilter(s)}>{s}</button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-primary" onClick={() => setModal('new')}><Plus /> Nouveau devis</button>
        </div>
      </div>
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {filtered.length ? (
            <table>
              <thead><tr><th>N°</th><th>Client</th><th>Titre</th><th>Total TTC</th><th>Statut</th><th>Date</th></tr></thead>
              <tbody>
                {filtered.map((d) => {
                  const ht = devisTotal(devisLignes, d.id);
                  const ttc = ht * (1 + Number(d.tva || 0) / 100);
                  return (
                    <tr key={d.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(d.id)}>
                      <td style={{ fontWeight: 500, fontFamily: 'var(--font-display)' }}>{d.numero}</td>
                      <td>{clientName(clients, d.client_id)}</td>
                      <td style={{ color: 'var(--muted)' }}>{d.titre || '—'}</td>
                      <td style={{ fontWeight: 600 }}>{formatEUR(ttc)}</td>
                      <td><Badge statut={d.statut} /></td>
                      <td style={{ color: 'var(--muted)', fontSize: 13 }}>{formatDate(d.date)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <EmptyState title="Aucun devis" description="Créez un devis pour commencer à suivre vos propositions commerciales." />
          )}
        </div>
      </div>

      {modal && (
        <DevisForm
          devis={modal === 'new' ? null : modal}
          initialLines={modal === 'new' ? [{ description: '', quantite: 1, prix_unitaire: 0 }] : devisLignes.filter((l) => l.devis_id === (modal as Devis).id)}
          onClose={() => setModal(null)}
          onSave={async (fields, lignes, id) => {
            await saveDevis(fields, lignes, id ?? undefined);
            notify(id ? 'Devis mis à jour' : 'Devis créé');
            logActivite(id ? 'Devis modifié' : `Nouveau devis créé pour ${clientName(clients, fields.client_id)}`);
            setModal(null);
          }}
        />
      )}
    </div>
  );
}

function DevisForm({
  devis,
  initialLines,
  onClose,
  onSave,
}: {
  devis: Devis | null;
  initialLines: DevisLigne[];
  onClose: () => void;
  onSave: (fields: Omit<Devis, 'id' | 'created_at' | 'numero'>, lignes: DevisLigne[], id?: string) => Promise<void>;
}) {
  const { clients, settings } = useAdminData();
  const [clientId, setClientId] = useState(devis?.client_id ?? '');
  const [titre, setTitre] = useState(devis?.titre ?? '');
  const [date, setDate] = useState(devis?.date ?? new Date().toISOString().slice(0, 10));
  const [validite, setValidite] = useState(devis?.validite ?? '30 jours');
  const [statut, setStatut] = useState(devis?.statut ?? 'Brouillon');
  const [tva, setTva] = useState(devis ? String(devis.tva) : String(settings?.tva_default ?? 20));
  const [notes, setNotes] = useState(devis?.notes ?? '');
  const [lignes, setLignes] = useState<DevisLigne[]>(initialLines.length ? initialLines : [{ description: '', quantite: 1, prix_unitaire: 0 }]);

  const ht = lignes.reduce((s, l) => s + (Number(l.quantite) || 0) * (Number(l.prix_unitaire) || 0), 0);
  const tvaVal = Number(tva) || 0;
  const ttc = ht * (1 + tvaVal / 100);

  const updateLigne = (i: number, patch: Partial<DevisLigne>) => {
    setLignes((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      window.alert('Veuillez sélectionner un client.');
      return;
    }
    onSave(
      { client_id: clientId, titre, date, validite, statut, tva: tvaVal, notes },
      lignes.filter((l) => l.description.trim()),
      devis?.id,
    );
  };

  return (
    <Modal title={devis ? `Modifier le devis ${devis.numero}` : 'Nouveau devis'} onClose={onClose} wide>
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
            <label>Titre du devis</label>
            <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex : Refonte site vitrine" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="form-group"><label>Validité</label><input value={validite} onChange={(e) => setValidite(e.target.value)} placeholder="30 jours" /></div>
        </div>

        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Prestations</span>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setLignes((prev) => [...prev, { description: '', quantite: 1, prix_unitaire: 0 }])}>
              <Plus /> Ajouter une ligne
            </button>
          </div>
          {lignes.map((l, i) => (
            <div key={i} className="form-row" style={{ marginBottom: 8, gridTemplateColumns: '1fr 70px 130px 34px' }}>
              <input placeholder="Description de la prestation" value={l.description} onChange={(e) => updateLigne(i, { description: e.target.value })} />
              <input type="number" min="0" step="any" placeholder="Qté" value={String(l.quantite)} onChange={(e) => updateLigne(i, { quantite: Number(e.target.value) })} />
              <input type="number" min="0" step="0.01" placeholder="Prix unitaire" value={String(l.prix_unitaire)} onChange={(e) => updateLigne(i, { prix_unitaire: Number(e.target.value) })} />
              <button type="button" className="btn btn-ghost btn-icon" style={{ color: 'var(--danger)' }} onClick={() => setLignes((prev) => prev.filter((_, idx) => idx !== i))} aria-label="Supprimer la ligne"><X /></button>
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
              {DEVIS_STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Notes / Conditions</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Conditions de paiement, délais…" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn btn-primary">Enregistrer le devis</button>
        </div>
      </form>
    </Modal>
  );
}

export function printDevis(d: Devis, lines: DevisLigne[], clientNom: string, settings: Settings | null) {
  const ht = devisTotal(lines, d.id);
  const tvaVal = Number(d.tva || 0);
  const ttc = ht * (1 + tvaVal / 100);
  const agence = settings?.agence_nom || "L'Agence de Scott";
  const rows = lines
    .map(
      (l) => `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb">${l.description}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right">${l.quantite}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right">${formatEUR(l.prix_unitaire)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right"><strong>${formatEUR(Number(l.quantite) * Number(l.prix_unitaire))}</strong></td>
      </tr>`,
    )
    .join('');

  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Devis ${d.numero}</title>
  <style>
    *{box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;color:#111827;margin:0;padding:48px}
    .head{display:flex;justify-content:space-between;border-bottom:2px solid #ca6e0d;padding-bottom:24px;margin-bottom:32px}
    h1{font-size:26px;margin:0 0 4px}.muted{color:#6b7280;font-size:13px;margin:2px 0}
    .box{font-size:13px;margin-bottom:24px}h3{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;margin:0 0 8px}
    table{width:100%;border-collapse:collapse;margin-top:8px}th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;padding:8px 12px;border-bottom:2px solid #e5e7eb}
    .totals{margin-left:auto;width:280px;margin-top:24px}.totals div{display:flex;justify-content:space-between;padding:6px 0;font-size:14px}
    .totals .grand{font-weight:700;font-size:18px;border-top:2px solid #ca6e0d;margin-top:6px;padding-top:10px;color:#ca6e0d}
    .notes{margin-top:24px;font-size:13px;color:#6b7280}.foot{margin-top:48px;border-top:1px solid #e5e7eb;padding-top:16px;font-size:12px;color:#9ca3af}
    @media print{body{padding:24px}}
  </style></head><body>
    <div class="head">
      <div><h1>DEVIS ${d.numero}</h1><div class="muted">${agence}</div>
        ${settings ? `<div class="muted">${settings.adresse}</div><div class="muted">${settings.email} · ${settings.telephone}</div><div class="muted">SIRET : ${settings.siret}</div>` : ''}
      </div>
      <div style="text-align:right"><div class="muted">Date : ${formatDate(d.date)}</div><div class="muted">Validité : ${d.validite}</div><div class="muted">Statut : ${d.statut}</div></div>
    </div>
    <div style="display:flex;gap:48px">
      <div class="box"><h3>Émis pour</h3><div style="font-size:14px;font-weight:600">${clientNom}</div></div>
      ${d.titre ? `<div class="box"><h3>Objet</h3><div style="font-size:14px">${d.titre}</div></div>` : ''}
    </div>
    <table><thead><tr><th>Description</th><th style="text-align:right">Qté</th><th style="text-align:right">Prix unitaire</th><th style="text-align:right">Total</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="totals">
      <div><span>Total HT</span><span>${formatEUR(ht)}</span></div>
      <div><span>TVA (${tvaVal}%)</span><span>${formatEUR(ht * tvaVal / 100)}</span></div>
      <div class="grand"><span>Total TTC</span><span>${formatEUR(ttc)}</span></div>
    </div>
    ${d.notes ? `<div class="notes"><strong>Notes :</strong><br>${d.notes}</div>` : ''}
    <div class="foot">${agence} — Document généré le ${new Date().toLocaleDateString('fr-FR')}.</div>
  </body></html>`;

  const win = window.open('', '_blank', 'width=900,height=1000');
  if (!win) {
    window.alert('Veuillez autoriser les fenêtres pop-up pour exporter le PDF.');
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}
