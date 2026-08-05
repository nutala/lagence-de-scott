import React, { useState } from 'react';
import {
  LayoutDashboard, Users, FolderKanban, ListTodo, FileText, Receipt, CalendarDays,
  Settings as SettingsIcon, Search, Bell, Plus, ChevronRight, LogOut, X, Menu, CheckCircle2,
  FileText as FileIcon, Receipt as ReceiptIcon, FolderKanban as FolderIcon, Users as UsersIcon,
} from 'lucide-react';
import { useAdminData } from './AdminDataContext';
import { supabase } from './supabaseClient';
import { PAGE_TITLES } from './types';
import type { PageKey } from './types';
import DashboardPage from './pages/Dashboard';
import ClientsPage from './pages/Clients';
import ProjetsPage from './pages/Projets';
import TachesPage from './pages/Taches';
import DevisPage from './pages/Devis';
import FacturesPage from './pages/Factures';
import PlanningPage from './pages/Planning';
import SettingsPage from './pages/Settings';
import logo from '../assets/images/logo_transparent.png';

export default function AdminShell({ userEmail }: { userEmail: string }) {
  const { clients, projets, devis, factures, activites, toast } = useAdminData();
  const [page, setPage] = useState<PageKey>('dashboard');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [query, setQuery] = useState('');

  const navigate = (p: PageKey, id?: string) => {
    setDetailId(id ?? null);
    setPage(p);
    setMobileOpen(false);
    setShowNotif(false);
    setQuery('');
  };

  const devisPending = devis.filter((d) => d.statut === 'En attente' || d.statut === 'Envoyé').length;
  const facturesRetard = factures.filter((f) => f.statut === 'En retard').length;

  const nav = [
    {
      section: 'Principal',
      items: [
        { id: 'dashboard' as PageKey, label: "Vue d'ensemble", icon: <LayoutDashboard /> },
        { id: 'clients' as PageKey, label: 'Clients', icon: <Users /> },
        { id: 'projets' as PageKey, label: 'Projets', icon: <FolderKanban /> },
        { id: 'taches' as PageKey, label: 'Tâches', icon: <ListTodo /> },
      ],
    },
    {
      section: 'Finance',
      items: [
        { id: 'devis' as PageKey, label: 'Devis', icon: <FileText />, badge: devisPending || undefined },
        { id: 'factures' as PageKey, label: 'Factures', icon: <Receipt />, badge: facturesRetard || undefined },
      ],
    },
    {
      section: 'Outils',
      items: [
        { id: 'planning' as PageKey, label: 'Planning', icon: <CalendarDays /> },
        { id: 'settings' as PageKey, label: 'Paramètres', icon: <SettingsIcon /> },
      ],
    },
  ];

  const q = query.trim().toLowerCase();
  const results = q
    ? {
        clients: clients.filter((c) => c.nom.toLowerCase().includes(q) || (c.entreprise || '').toLowerCase().includes(q)).slice(0, 4),
        projets: projets.filter((p) => p.titre.toLowerCase().includes(q)).slice(0, 4),
        devis: devis.filter((d) => d.numero.toLowerCase().includes(q) || (d.titre || '').toLowerCase().includes(q)).slice(0, 4),
        factures: factures.filter((f) => f.numero.toLowerCase().includes(q)).slice(0, 4),
      }
    : null;

  const totalResults = results
    ? results.clients.length + results.projets.length + results.devis.length + results.factures.length
    : 0;

  const initials = userEmail
    .split('@')[0]
    .split(/[._-]/)
    .map((s) => s[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="layout">
      {mobileOpen && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar${mobileOpen ? ' open' : ''}`}>
        <div className="sidebar-header">
          <img src={logo} alt="L'Agence de Scott" className="sidebar-logo" />
          <div className="sidebar-brand">L'Agence de Scott<small>Tableau de bord</small></div>
          <button className="sidebar-close btn-ghost btn-icon" onClick={() => setMobileOpen(false)} aria-label="Fermer le menu"><X /></button>
        </div>
        <nav className="sidebar-nav" aria-label="Navigation principale">
          {nav.map((s) => (
            <React.Fragment key={s.section}>
              <div className="nav-section">{s.section}</div>
              {s.items.map((item) => (
                <div
                  key={item.id}
                  className={`nav-item${page === item.id ? ' active' : ''}`}
                  onClick={() => navigate(item.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(item.id); } }}
                  role="button"
                  tabIndex={0}
                  aria-current={page === item.id ? 'page' : undefined}
                >
                  {item.icon}{item.label}
                  {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
                </div>
              ))}
            </React.Fragment>
          ))}
        </nav>
      </aside>

      <div className="main" role="main">
        <header className="header">
          <button className="hamburger" onClick={() => setMobileOpen(true)} aria-label="Ouvrir le menu"><Menu /></button>
          <div className="header-title">{PAGE_TITLES[page]}</div>

          <div className="header-search">
            <Search />
            <input
              type="text"
              placeholder="Rechercher..."
              aria-label="Rechercher"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {results && (
              <div className="search-dropdown">
                {totalResults === 0 && <div style={{ padding: 16, color: 'var(--muted)', fontSize: 13 }}>Aucun résultat pour « {query} ».</div>}
                {results.clients.length > 0 && (
                  <>
                    <div className="search-group">Clients</div>
                    {results.clients.map((c) => (
                      <div key={c.id} className="search-item" onClick={() => navigate('clients', c.id)}><UsersIcon /> {c.nom}</div>
                    ))}
                  </>
                )}
                {results.projets.length > 0 && (
                  <>
                    <div className="search-group">Projets</div>
                    {results.projets.map((p) => (
                      <div key={p.id} className="search-item" onClick={() => navigate('projets', p.id)}><FolderIcon /> {p.titre}</div>
                    ))}
                  </>
                )}
                {results.devis.length > 0 && (
                  <>
                    <div className="search-group">Devis</div>
                    {results.devis.map((d) => (
                      <div key={d.id} className="search-item" onClick={() => navigate('devis', d.id)}><FileIcon /> {d.numero} — {d.titre || 'Sans titre'}</div>
                    ))}
                  </>
                )}
                {results.factures.length > 0 && (
                  <>
                    <div className="search-group">Factures</div>
                    {results.factures.map((f) => (
                      <div key={f.id} className="search-item" onClick={() => navigate('factures')}><ReceiptIcon /> {f.numero}</div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="header-actions">
            <button className="header-btn" onClick={() => setShowNotif((v) => !v)} aria-label="Notifications">
              <Bell />
              {activites.length > 0 && <span className="dot" />}
            </button>
            <div className="header-avatar" title={userEmail}>{initials}</div>
            <button className="header-btn" onClick={() => supabase?.auth.signOut()} aria-label="Se déconnecter" title="Se déconnecter">
              <LogOut />
            </button>
          </div>
        </header>

        {showNotif && (
          <div className="notif-panel">
            <div className="card-header" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="card-title">Activité récente</span>
              <button className="btn btn-sm btn-ghost" onClick={() => setShowNotif(false)}><X /></button>
            </div>
            {activites.length ? (
              activites.slice(0, 10).map((a) => (
                <div key={a.id} className="notif-item">
                  {a.message}
                  <div className="time">{new Date(a.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              ))
            ) : (
              <div style={{ padding: 20, color: 'var(--muted)', fontSize: 13 }}>Aucune activité pour le moment.</div>
            )}
          </div>
        )}

        <div className="content">
          {page === 'dashboard' && <DashboardPage setPage={navigate} />}
          {page === 'clients' && <ClientsPage initialDetailId={detailId} setPage={navigate} />}
          {page === 'projets' && <ProjetsPage initialDetailId={detailId} setPage={navigate} />}
          {page === 'taches' && <TachesPage />}
          {page === 'devis' && <DevisPage initialDetailId={detailId} setPage={navigate} />}
          {page === 'factures' && <FacturesPage />}
          {page === 'planning' && <PlanningPage />}
          {page === 'settings' && <SettingsPage />}
        </div>
      </div>

      {toast && (
        <div className="toast">
          <CheckCircle2 />
          {toast}
        </div>
      )}
    </div>
  );
}
