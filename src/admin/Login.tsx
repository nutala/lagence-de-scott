import React, { useState, FormEvent } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { supabase } from './supabaseClient';
import AuthLayout from './AuthLayout';
import logo from '../assets/images/logo_transparent.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [voirMotDePasse, setVoirMotDePasse] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setError(null);
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (authError) {
      setError('Identifiants incorrects. Vérifiez votre email et votre mot de passe.');
    }
    setLoading(false);
  };

  return (
    <AuthLayout
      titre="Bon retour."
      texte="Vos clients, vos devis, votre planning : tout est resté en place."
      puces={['Clients', 'Devis & factures', 'Planning', 'Projets']}
    >
      <form onSubmit={handleSubmit}>
        <span className="auth-badge">
          <img src={logo} alt="" aria-hidden="true" />
        </span>
        <h1 className="auth-titre">Connexion</h1>
        <p className="auth-sous">Accédez à votre tableau de bord.</p>

        {error && <div className="login-error" role="alert">{error}</div>}

        <div className="auth-champ">
          <label htmlFor="login-email">Adresse email</label>
          <div className="auth-input">
            <Mail className="auth-ico" size={18} aria-hidden="true" />
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              placeholder="vous@lagencedescott.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
        </div>

        <div className="auth-champ">
          <label htmlFor="login-password">Mot de passe</label>
          <div className="auth-input">
            <Lock className="auth-ico" size={18} aria-hidden="true" />
            <input
              id="login-password"
              type={voirMotDePasse ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="auth-oeil"
              onClick={() => setVoirMotDePasse((v) => !v)}
              aria-label={voirMotDePasse ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              aria-pressed={voirMotDePasse}
            >
              {voirMotDePasse ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button type="submit" className="auth-envoi" disabled={loading}>
          <span>{loading ? 'Connexion…' : 'Se connecter'}</span>
          <ArrowRight size={18} aria-hidden="true" />
        </button>

        <p className="auth-oublie">Mot de passe oublié ? Contactez l'administrateur.</p>
      </form>
    </AuthLayout>
  );
}
