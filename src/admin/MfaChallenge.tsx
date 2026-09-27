import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { supabase } from './supabaseClient';
import { getMfaState, verifyTotp, messageMfa } from './mfa';

/**
 * Écran de défi TOTP : affiché quand la session n'est qu'en `aal1` alors qu'un
 * facteur vérifié existe (après la saisie du mot de passe, ou au rechargement
 * d'une session qui n'a pas encore relevé son défi).
 */
export default function MfaChallenge({ onVerified }: { onVerified: () => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);

  useEffect(() => {
    getMfaState().then((s) => setFactorId(s.factors[0]?.id ?? null));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) {
      setError('Aucun facteur trouvé. Reconnectez-vous.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await verifyTotp(factorId, code);
      setCode('');
      onVerified();
    } catch (err) {
      setError(messageMfa(err instanceof Error ? err.message : 'Code refusé.'));
    }
    setLoading(false);
  };

  const deconnexion = async () => {
    await supabase?.auth.signOut();
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <ShieldCheck size={34} strokeWidth={1.4} style={{ color: 'var(--accent)' }} />
        <h1 className="login-title">Double authentification</h1>
        <p className="login-sub">
          Saisissez le code à 6 chiffres affiché par votre application d’authentification (2FAS,
          Google Authenticator…).
        </p>
        {error && <div className="login-error" role="alert">{error}</div>}
        <div className="form-group">
          <label htmlFor="mfa-code">Code de vérification</label>
          <input
            id="mfa-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            autoFocus
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          disabled={loading || code.length !== 6}
        >
          <ShieldCheck /> {loading ? 'Vérification…' : 'Valider'}
        </button>
        <p className="login-hint">
          Accès refusé ? <a href="#" onClick={(e) => { e.preventDefault(); deconnexion(); }}>Se déconnecter</a>
        </p>
      </form>
    </div>
  );
}
