import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from './supabaseClient';
import { nextNumero } from './types';
import type {
  Client, Projet, Tache, Devis, DevisLigne, Facture, PlanningEvent, Settings, Activite,
} from './types';

interface AdminData {
  loading: boolean;
  error: string | null;
  clients: Client[];
  projets: Projet[];
  taches: Tache[];
  devis: Devis[];
  devisLignes: DevisLigne[];
  factures: Facture[];
  events: PlanningEvent[];
  settings: Settings | null;
  activites: Activite[];
  refresh: () => Promise<void>;
  logActivite: (message: string) => Promise<void>;
  notify: (msg: string) => void;
  toast: string | null;

  saveClient: (fields: Omit<Client, 'id' | 'created_at'>, id?: string) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  saveProjet: (fields: Omit<Projet, 'id' | 'created_at'>, id?: string) => Promise<void>;
  deleteProjet: (id: string) => Promise<void>;

  saveTache: (fields: Omit<Tache, 'id' | 'created_at'>, id?: string) => Promise<void>;
  updateTacheStatut: (id: string, statut: string) => Promise<void>;
  deleteTache: (id: string) => Promise<void>;

  saveDevis: (fields: Omit<Devis, 'id' | 'created_at' | 'numero'>, lignes: DevisLigne[], id?: string) => Promise<void>;
  updateDevisStatut: (id: string, statut: string) => Promise<void>;
  deleteDevis: (id: string) => Promise<void>;

  saveFacture: (fields: Omit<Facture, 'id' | 'created_at' | 'numero'>, id?: string) => Promise<void>;
  updateFactureStatut: (id: string, statut: string) => Promise<void>;
  deleteFacture: (id: string) => Promise<void>;

  saveEvent: (fields: Omit<PlanningEvent, 'id' | 'created_at'>, id?: string) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  saveSettings: (s: Settings) => Promise<void>;
}

const AdminDataContext = createContext<AdminData | null>(null);

export function useAdminData(): AdminData {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error('useAdminData must be used within AdminDataProvider');
  return ctx;
}

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [taches, setTaches] = useState<Tache[]>([]);
  const [devis, setDevis] = useState<Devis[]>([]);
  const [devisLignes, setDevisLignes] = useState<DevisLigne[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [events, setEvents] = useState<PlanningEvent[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [activites, setActivites] = useState<Activite[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    setError(null);
    try {
      const [
        rClients, rProjets, rTaches, rDevis, rLignes,
        rFactures, rEvents, rSettings, rActivites,
      ] = await Promise.all([
        supabase.from('clients').select('*').order('created_at', { ascending: true }),
        supabase.from('projets').select('*').order('created_at', { ascending: true }),
        supabase.from('taches').select('*').order('created_at', { ascending: true }),
        supabase.from('devis').select('*').order('date', { ascending: false }),
        supabase.from('devis_lignes').select('*'),
        supabase.from('factures').select('*').order('date', { ascending: false }),
        supabase.from('planning_events').select('*').order('date', { ascending: true }),
        supabase.from('settings').select('*').limit(1).maybeSingle(),
        supabase.from('activites').select('*').order('created_at', { ascending: false }).limit(50),
      ]);
      setClients(rClients.error ? [] : (rClients.data as Client[]));
      setProjets(rProjets.error ? [] : (rProjets.data as Projet[]));
      setTaches(rTaches.error ? [] : (rTaches.data as Tache[]));
      setDevis(rDevis.error ? [] : (rDevis.data as Devis[]));
      setDevisLignes(rLignes.error ? [] : (rLignes.data as DevisLigne[]));
      setFactures(rFactures.error ? [] : (rFactures.data as Facture[]));
      setEvents(rEvents.error ? [] : (rEvents.data as PlanningEvent[]));
      setSettings(rSettings.error || !rSettings.data ? null : (rSettings.data as Settings));
      setActivites(rActivites.error ? [] : (rActivites.data as Activite[]));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement des données');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logActivite = useCallback(async (message: string) => {
    if (!supabase) return;
    await supabase.from('activites').insert({ message });
    refresh();
  }, [refresh]);

  const saveClient = useCallback(async (fields: Omit<Client, 'id' | 'created_at'>, id?: string) => {
    if (!supabase) return;
    if (id) {
      await supabase.from('clients').update(fields).eq('id', id);
    } else {
      await supabase.from('clients').insert(fields);
    }
    await refresh();
  }, [refresh]);

  const deleteClient = useCallback(async (id: string) => {
    if (!supabase) return;
    await supabase.from('clients').delete().eq('id', id);
    await refresh();
  }, [refresh]);

  const saveProjet = useCallback(async (fields: Omit<Projet, 'id' | 'created_at'>, id?: string) => {
    if (!supabase) return;
    if (id) {
      await supabase.from('projets').update(fields).eq('id', id);
    } else {
      await supabase.from('projets').insert(fields);
    }
    await refresh();
  }, [refresh]);

  const deleteProjet = useCallback(async (id: string) => {
    if (!supabase) return;
    await supabase.from('projets').delete().eq('id', id);
    await refresh();
  }, [refresh]);

  const saveTache = useCallback(async (fields: Omit<Tache, 'id' | 'created_at'>, id?: string) => {
    if (!supabase) return;
    if (id) {
      await supabase.from('taches').update(fields).eq('id', id);
    } else {
      await supabase.from('taches').insert(fields);
    }
    await refresh();
  }, [refresh]);

  const updateTacheStatut = useCallback(async (id: string, statut: string) => {
    if (!supabase) return;
    await supabase.from('taches').update({ statut }).eq('id', id);
    await refresh();
  }, [refresh]);

  const deleteTache = useCallback(async (id: string) => {
    if (!supabase) return;
    await supabase.from('taches').delete().eq('id', id);
    await refresh();
  }, [refresh]);

  const saveDevis = useCallback(async (fields: Omit<Devis, 'id' | 'created_at' | 'numero'>, lignes: DevisLigne[], id?: string) => {
    if (!supabase) return;
    const cleanLignes = lignes.filter((l) => l.description.trim() && Number(l.quantite) > 0);
    if (id) {
      await supabase.from('devis').update(fields).eq('id', id);
      await supabase.from('devis_lignes').delete().eq('devis_id', id);
      if (cleanLignes.length) {
        await supabase.from('devis_lignes').insert(cleanLignes.map((l) => ({ ...l, devis_id: id })));
      }
    } else {
      const year = new Date().getFullYear();
      const numero = nextNumero('D-', year, devis.map((d) => d.numero));
      const { data } = await supabase.from('devis').insert({ ...fields, numero }).select().single();
      if (data && cleanLignes.length) {
        await supabase.from('devis_lignes').insert(cleanLignes.map((l) => ({ ...l, devis_id: data.id })));
      }
    }
    await refresh();
  }, [refresh, devis]);

  const updateDevisStatut = useCallback(async (id: string, statut: string) => {
    if (!supabase) return;
    await supabase.from('devis').update({ statut }).eq('id', id);
    await refresh();
  }, [refresh]);

  const deleteDevis = useCallback(async (id: string) => {
    if (!supabase) return;
    await supabase.from('devis').delete().eq('id', id);
    await refresh();
  }, [refresh]);

  const saveFacture = useCallback(async (fields: Omit<Facture, 'id' | 'created_at' | 'numero'>, id?: string) => {
    if (!supabase) return;
    if (id) {
      await supabase.from('factures').update(fields).eq('id', id);
    } else {
      const year = new Date().getFullYear();
      const numero = nextNumero('F-', year, factures.map((f) => f.numero));
      await supabase.from('factures').insert({ ...fields, numero });
    }
    await refresh();
  }, [refresh, factures]);

  const updateFactureStatut = useCallback(async (id: string, statut: string) => {
    if (!supabase) return;
    await supabase.from('factures').update({ statut }).eq('id', id);
    await refresh();
  }, [refresh]);

  const deleteFacture = useCallback(async (id: string) => {
    if (!supabase) return;
    await supabase.from('factures').delete().eq('id', id);
    await refresh();
  }, [refresh]);

  const saveEvent = useCallback(async (fields: Omit<PlanningEvent, 'id' | 'created_at'>, id?: string) => {
    if (!supabase) return;
    if (id) {
      await supabase.from('planning_events').update(fields).eq('id', id);
    } else {
      await supabase.from('planning_events').insert(fields);
    }
    await refresh();
  }, [refresh]);

  const deleteEvent = useCallback(async (id: string) => {
    if (!supabase) return;
    await supabase.from('planning_events').delete().eq('id', id);
    await refresh();
  }, [refresh]);

  const saveSettings = useCallback(async (s: Settings) => {
    if (!supabase) return;
    await supabase.from('settings').upsert({ ...s, id: 1 });
    await refresh();
  }, [refresh]);

  const value: AdminData = {
    loading, error, clients, projets, taches, devis, devisLignes, factures,
    events, settings, activites, refresh, logActivite, notify, toast,
    saveClient, deleteClient, saveProjet, deleteProjet, saveTache,
    updateTacheStatut, deleteTache, saveDevis, updateDevisStatut, deleteDevis,
    saveFacture, updateFactureStatut, deleteFacture, saveEvent, deleteEvent, saveSettings,
  };

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}
