import React, { useState, FormEvent } from 'react';
import { LogIn } from 'lucide-react';
import { supabase } from './supabaseClient';
import logo from '../assets/images/logo_transparent.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <img src={logo} alt="L'Agence de Scott" className="login-logo" />
        <h1 className="login-title">Espace administrateur</h1>
        <p className="login-sub">Connectez-vous pour accéder au tableau de bord.</p>
        {error && <div className="login-error" role="alert">{error}</div>}
        <div className="form-group">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            autoComplete="username"
            placeholder="vous@lagencedescott.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="login-password">Mot de passe</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
          <LogIn /> {loading ? 'Connexion…' : 'Se connecter'}
        </button>
        <p className="login-hint">
          Accès réservé à L'Agence de Scott.
          <br />
          Mot de passe oublié ? Contactez l'administrateur.
        </p>
      </form>
    </div>
  );
}
