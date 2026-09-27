import React, { useEffect, useState } from 'react';
import { KeyRound, ArrowRight } from 'lucide-react';
import { supabase } from './supabaseClient';
import AuthLayout from './AuthLayout';
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
    <AuthLayout
      titre="Vérification."
      texte="Un dernier code et vous retrouvez votre tableau de bord, vos clients et votre planning."
      puces={['Code à 6 chiffres', 'Valable 30 secondes', '2FAS · Google Authenticator']}
      note="Connexion protégée par double authentification"
    >
      <form onSubmit={handleSubmit}>
        <span className="auth-badge auth-badge-icone">
          <KeyRound size={26} strokeWidth={1.6} aria-hidden="true" />
        </span>
        <h1 className="auth-titre">Double authentification</h1>
        <p className="auth-sous">
          Saisissez le code à 6 chiffres affiché par votre application d'authentification.
        </p>

        {error && <div className="login-error" role="alert">{error}</div>}

        <div className="auth-champ">
          <label htmlFor="mfa-code">Code de vérification</label>
          <div className="auth-input auth-code">
            <input
              id="mfa-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              autoFocus
              required
            />
          </div>
        </div>

        <button type="submit" className="auth-envoi" disabled={loading || code.length !== 6}>
          <span>{loading ? 'Vérification…' : 'Valider'}</span>
          <ArrowRight size={18} aria-hidden="true" />
        </button>

        <p className="auth-oublie">
          Ce n'est pas vous ?{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              deconnexion();
            }}
          >
            Se déconnecter
          </a>
        </p>
      </form>
    </AuthLayout>
  );
}
