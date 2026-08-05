import React from 'react';
import { TrendingUp, TrendingDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { useAdminData } from '../AdminDataContext';
import { formatEUR, formatDateShort, clientName } from '../types';
import { Badge } from '../components';
import type { PageKey } from '../types';

function monthKey(date: string): string {
  return date.slice(0, 7);
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');
}

export default function DashboardPage({ setPage }: { setPage: (p: PageKey) => void }) {
  const { clients, projets, taches, devis, factures, activites } = useAdminData();
  const now = new Date();
  const curKey = monthKey(now.toISOString());

  const last6: { key: string; label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    last6.push({ key, label: monthLabel(d), value: 0 });
  }
  factures
    .filter((f) => f.statut === 'Payée' && f.date)
    .forEach((f) => {
      const k = monthKey(f.date);
      const item = last6.find((x) => x.key === k);
      if (item) item.value += Number(f.montant);
    });

  const caMois = last6[last6.length - 1].value;
  const caMoisPrec = last6[last6.length - 2]?.value ?? 0;
  const caDelta = caMoisPrec > 0 ? Math.round(((caMois - caMoisPrec) / caMoisPrec) * 100) : null;

  const devisEnAttente = devis.filter((d) => d.statut === 'En attente' || d.statut === 'Envoyé').length;
  const projetsActifs = projets.filter((p) => p.statut !== 'Livré' && p.statut !== 'Clôturé');
  const tachesUrgentes = taches.filter((t) => t.priorite === 'urgente' && t.statut !== 'Terminée').length;
  const maxCA = Math.max(...last6.map((c) => c.value), 1);

  const projetsTries = [...projetsActifs].sort((a, b) =>
    (a.deadline || '9999').localeCompare(b.deadline || '9999'),
  );

  return (
    <div className="page-enter">
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">CA du mois</div>
          <div className="kpi-value" style={{ color: 'var(--accent)' }}>{formatEUR(caMois)}</div>
          <div className={`kpi-change ${caDelta !== null && caDelta < 0 ? 'down' : 'up'}`}>
            {caDelta !== null && caDelta < 0 ? <TrendingDown /> : <TrendingUp />}
            {caDelta === null ? 'Premier mois enregistré' : `${caDelta >= 0 ? '+' : ''}${caDelta}% vs mois dernier`}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Devis en attente</div>
          <div className="kpi-value">{devisEnAttente}</div>
          <div className="kpi-change up">À suivre</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Projets actifs</div>
          <div className="kpi-value">{projetsActifs.length}</div>
          <div className="kpi-change up">En cours</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Tâches urgentes</div>
          <div className="kpi-value" style={{ color: tachesUrgentes ? 'var(--danger)' : 'var(--success)' }}>
            {tachesUrgentes}
          </div>
          <div className="kpi-change down">{tachesUrgentes ? <AlertTriangle /> : null}{tachesUrgentes ? 'À traiter' : 'Tout est sous contrôle'}</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Chiffre d'affaires mensuel</span>
            <span className="badge badge-accent">{now.getFullYear()}</span>
          </div>
          <div className="card-body">
            <div className="chart-bar">
              {last6.map((c) => (
                <div className="chart-col" key={c.key}>
                  <div className="chart-val">{(c.value / 1000).toFixed(1)}k</div>
                  <div className="chart-fill" style={{ height: `${Math.max((c.value / maxCA) * 140, 4)}px` }} />
                  <div className="chart-label">{c.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Activité récente</span></div>
          <div className="card-body">
            {activites.length ? (
              <div className="timeline">
                {activites.slice(0, 6).map((a) => (
                  <div className="timeline-item" key={a.id}>
                    <div className="time">{new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="desc">{a.message}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--muted)', fontSize: 14 }}>Aucune activité pour le moment.</div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Projets actifs</span>
          <button className="btn btn-sm btn-secondary" onClick={() => setPage('projets')}>
            Voir tout <ChevronRight />
          </button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {projetsTries.length ? (
            <table>
              <thead>
                <tr><th>Projet</th><th>Client</th><th>Statut</th><th>Progression</th><th>Deadline</th></tr>
              </thead>
              <tbody>
                {projetsTries.slice(0, 5).map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.titre}</td>
                    <td style={{ color: 'var(--muted)' }}>{clientName(clients, p.client_id)}</td>
                    <td><Badge statut={p.statut} /></td>
                    <td style={{ width: 140 }}>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${p.progression}%`, background: p.progression >= 80 ? 'var(--success)' : 'var(--accent)' }} />
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, display: 'block' }}>{p.progression}%</span>
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: 13 }}>{formatDateShort(p.deadline)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Aucun projet actif. Créez votre premier projet dans l'onglet Projets.</div>
          )}
        </div>
      </div>
    </div>
  );
}
