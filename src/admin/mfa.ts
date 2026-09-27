import { supabase } from './supabaseClient';

/**
 * Double authentification (TOTP — 2FAS, Google Authenticator, Authy…).
 *
 * Principe Supabase : un compte portant un facteur TOTP *vérifié* ne reçoit qu'une
 * session `aal1` après le mot de passe. Il faut ensuite relever un défi TOTP pour
 * passer en `aal2`. Tant que ce n'est pas fait, l'appli ne doit rien afficher.
 */

export type MfaFactor = {
  id: string;
  friendlyName: string | null;
  createdAt: string;
};

export type MfaState = {
  /** Facteurs TOTP confirmés sur le compte (un seul attendu). */
  factors: MfaFactor[];
  /** Session en aal1 alors qu'un facteur confirmé exige aal2 → demander le code. */
  needsChallenge: boolean;
  currentLevel: string | null;
  nextLevel: string | null;
};

const ERREUR_GENERIQUE = 'Opération impossible pour le moment. Réessayez.';

export async function getMfaState(): Promise<MfaState> {
  if (!supabase) {
    return { factors: [], needsChallenge: false, currentLevel: null, nextLevel: null };
  }
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const { data: list } = await supabase.auth.mfa.listFactors();
  const factors = (list?.totp ?? [])
    .filter((f) => f.status === 'verified')
    .map((f) => ({
      id: f.id,
      friendlyName: f.friendly_name ?? null,
      createdAt: f.created_at ?? '',
    }));
  return {
    factors,
    needsChallenge: factors.length > 0 && aal?.currentLevel === 'aal1' && aal?.nextLevel === 'aal2',
    currentLevel: aal?.currentLevel ?? null,
    nextLevel: aal?.nextLevel ?? null,
  };
}

/** Crée un facteur TOTP. Il reste « unverified » jusqu'à verifyTotp(). */
export async function enrollTotp(friendlyName = 'Admin L’Agence de Scott'): Promise<{
  factorId: string;
  qrCode: string;
  secret: string;
}> {
  if (!supabase) throw new Error(ERREUR_GENERIQUE);
  // Un enrôlement interrompu laisse un facteur « unverified » qui porte le même nom
  // et ferait échouer toute nouvelle tentative : on nettoie ces restes d'abord.
  const { data: existants } = await supabase.auth.mfa.listFactors();
  for (const f of existants?.all ?? []) {
    if (f.status !== 'verified') await supabase.auth.mfa.unenroll({ factorId: f.id });
  }
  let data;
  let error;
  ({ data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName }));
  if (error && /already exists/i.test(error.message)) {
    // Cas limite : le nettoyage n'a pas suffi (facteur créé entre-temps).
    const { data: reliste } = await supabase.auth.mfa.listFactors();
    const ancien = (reliste?.totp ?? []).find((f) => f.status !== 'verified');
    if (!ancien) throw new Error(error.message);
    await supabase.auth.mfa.unenroll({ factorId: ancien.id });
    ({ data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName }));
  }
  if (error) throw new Error(error.message || ERREUR_GENERIQUE);
  if (!data?.totp) throw new Error('Le QR code n’a pas pu être généré.');
  return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
}

/** Relève le défi puis vérifie le code à 6 chiffres (active ou confirme le facteur). */
export async function verifyTotp(factorId: string, code: string): Promise<void> {
  if (!supabase) throw new Error(ERREUR_GENERIQUE);
  const propre = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(propre)) throw new Error('Le code doit contenir 6 chiffres.');
  const { data: defi, error: e1 } = await supabase.auth.mfa.challenge({ factorId });
  if (e1 || !defi) throw new Error(e1?.message || 'Défi refusé.');
  const { error: e2 } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: defi.id,
    code: propre,
  });
  if (e2) throw new Error(e2.message || 'Code incorrect.');
}

/** Retire un facteur (désactive la double authentification pour ce compte). */
export async function unenrollTotp(factorId: string): Promise<void> {
  if (!supabase) throw new Error(ERREUR_GENERIQUE);
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw new Error(error.message || ERREUR_GENERIQUE);
}

/** Message lisible pour les erreurs TOTP les plus fréquentes. */
export function messageMfa(brut: string): string {
  const m = brut.toLowerCase();
  if (m.includes('invalid') && m.includes('code')) return 'Code refusé. Vérifiez le code affiché dans l’application.';
  if (m.includes('expired')) return 'Ce code a expiré, saisissez le suivant.';
  if (m.includes('already')) return 'Un facteur existe déjà sur ce compte.';
  return brut;
}
