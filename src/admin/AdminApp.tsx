import React, { useEffect, useState } from 'react';
import './admin.css';
import { isSupabaseConfigured, supabase, type Session } from './supabaseClient';
import { AdminDataProvider } from './AdminDataContext';
import AdminShell from './AdminShell';
import Login from './Login';
import { Loading } from './components';

export default function AdminApp() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <div className="admin-root">
        <SetupScreen />
      </div>
    );
  }
  if (session === undefined) {
    return (
      <div className="admin-root">
        <Loading label="Connexion en cours…" />
      </div>
    );
  }
  if (!session) {
    return (
      <div className="admin-root">
        <Login />
      </div>
    );
  }

  return (
    <div className="admin-root">
      <AdminDataProvider>
        <AdminShell userEmail={session.user.email ?? ''} />
      </AdminDataProvider>
    </div>
  );
}

function SetupScreen() {
  return (
    <div className="setup-page">
      <div className="setup-card">
        <h2>Configuration requise</h2>
        <p>
          Le tableau de bord utilise <strong>Supabase</strong> pour la connexion et le stockage des données.
          Il n'est pas encore configuré. Suivez ces étapes :
        </p>
        <ol style={{ margin: '0 0 16px 18px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.8 }}>
          <li>Créez un projet gratuit sur <strong>supabase.com</strong> (plan Free).</li>
          <li>Dans Supabase, ouvrez <strong>SQL Editor</strong> et exécutez le contenu du fichier <code>supabase/schema.sql</code> du projet.</li>
          <li>Dans <strong>Authentication → Users</strong>, créez le compte administrateur (votre email + mot de passe).</li>
          <li>Récupérez l'URL du projet et la clé publique <strong>anon</strong> (Settings → API).</li>
          <li>Créez un fichier <code>.env.local</code> à la racine avec :</li>
        </ol>
        <code>{`VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon`}</code>
        <p>
          Puis relancez <code>npm run dev</code> et rechargez cette page. Vous pourrez vous connecter avec le compte administrateur.
        </p>
      </div>
    </div>
  );
}
