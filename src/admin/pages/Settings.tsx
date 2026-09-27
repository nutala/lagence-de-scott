import React, { useState, FormEvent } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAdminData } from '../AdminDataContext';
import { supabase } from '../supabaseClient';
import { enrollTotp, verifyTotp, unenrollTotp, getMfaState, messageMfa, type MfaFactor } from '../mfa';
import { Loading } from '../components';

export default function SettingsPage() {
  const { settings, saveSettings, notify } = useAdminData();
  const [agenceNom, setAgenceNom] = useState('');
  const [responsable, setResponsable] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [siret, setSiret] = useState('');
  const [tva, setTva] = useState('');
  const [devise, setDevise] = useState('EUR — Euro');
  const [iban, setIban] = useState('');
  const [bic, setBic] = useState('');

  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // --- Double authentification (TOTP) ---
  const [mfaFactors, setMfaFactors] = useState<MfaFactor[] | null>(null);
  const [enrolement, setEnrolement] = useState<{ factorId: string; qrCode: string; secret: string } | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaMsg, setMfaMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [mfaBusy, setMfaBusy] = useState(false);

  const rafraichirMfa = React.useCallback(async () => {
    const etat = await getMfaState();
    setMfaFactors(etat.factors);
    return etat;
  }, []);

  React.useEffect(() => {
    rafraichirMfa();
  }, [rafraichirMfa]);

  React.useEffect(() => {
    if (settings) {
      setAgenceNom(settings.agence_nom);
      setResponsable(settings.responsable);
      setEmail(settings.email);
      setTelephone(settings.telephone);
      setAdresse(settings.adresse);
      setSiret(settings.siret);
      setTva(String(settings.tva_default));
      setDevise(settings.devise);
      setIban(settings.iban);
      setBic(settings.bic);
    }
  }, [settings]);

  if (!settings) return <Loading label="Chargement des paramètres…" />;

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    await saveSettings({
      id: 1,
      agence_nom: agenceNom,
      responsable,
      email,
      telephone,
      adresse,
      siret,
      tva_default: Number(tva) || 0,
      devise,
      iban,
      bic,
    });
    notify('Paramètres enregistrés');
  };

  const handlePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    if (newPwd.length < 6) {
      setPwdMsg({ ok: false, text: 'Le mot de passe doit contenir au moins 6 caractères.' });
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg({ ok: false, text: 'Les deux mots de passe ne correspondent pas.' });
      return;
    }
    if (!supabase) return;
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    if (error) {
      setPwdMsg({ ok: false, text: error.message });
    } else {
      setPwdMsg({ ok: true, text: 'Mot de passe mis à jour avec succès.' });
      setNewPwd('');
      setConfirmPwd('');
      notify('Mot de passe modifié');
    }
  };

  // --- Double authentification (TOTP) ---

  const activerMfa = async () => {
    setMfaMsg(null);
    setMfaBusy(true);
    try {
      setEnrolement(await enrollTotp());
      setMfaCode('');
    } catch (err) {
      setMfaMsg({ ok: false, text: messageMfa(err instanceof Error ? err.message : 'Activation impossible.') });
    }
    setMfaBusy(false);
  };

  const validerMfa = async (e: FormEvent) => {
    e.preventDefault();
    if (!enrolement) return;
    setMfaMsg(null);
    setMfaBusy(true);
    try {
      await verifyTotp(enrolement.factorId, mfaCode);
      setEnrolement(null);
      setMfaCode('');
      await rafraichirMfa();
      setMfaMsg({ ok: true, text: 'Double authentification activée : un code sera demandé à chaque connexion. Conservez l’accès à votre application d’authentification, sans elle la connexion est impossible.' });
      notify('Double authentification activée');
    } catch (err) {
      setMfaMsg({ ok: false, text: messageMfa(err instanceof Error ? err.message : 'Code refusé.') });
    }
    setMfaBusy(false);
  };

  const annulerEnrolement = async () => {
    if (!enrolement) return;
    setMfaBusy(true);
    try {
      await unenrollTotp(enrolement.factorId);
    } catch {
      /* rien d'actif à retirer : on continue */
    }
    setEnrolement(null);
    setMfaCode('');
    setMfaMsg(null);
    setMfaBusy(false);
    await rafraichirMfa();
  };

  const desactiverMfa = async () => {
    const facteur = mfaFactors && mfaFactors[0];
    if (!facteur) return;
    if (!window.confirm('Désactiver la double authentification ? Le mot de passe seul suffira à se connecter.')) return;
    setMfaMsg(null);
    setMfaBusy(true);
    try {
      await unenrollTotp(facteur.id);
      await rafraichirMfa();
      setMfaMsg({ ok: true, text: 'Double authentification désactivée.' });
      notify('Double authentification désactivée');
    } catch (err) {
      setMfaMsg({ ok: false, text: messageMfa(err instanceof Error ? err.message : 'Désactivation impossible.') });
    }
    setMfaBusy(false);
  };

  return (
    <div className="page-enter" style={{ maxWidth: 640 }}>
      <form onSubmit={handleSave}>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><span className="card-title">Profil agence</span></div>
          <div className="card-body">
            <div className="form-group"><label>Nom de l'agence</label><input value={agenceNom} onChange={(e) => setAgenceNom(e.target.value)} /></div>
            <div className="form-group"><label>Responsable</label><input value={responsable} onChange={(e) => setResponsable(e.target.value)} /></div>
            <div className="form-row">
              <div className="form-group"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="form-group"><label>Téléphone</label><input value={telephone} onChange={(e) => setTelephone(e.target.value)} /></div>
            </div>
            <div className="form-group"><label>Adresse</label><input value={adresse} onChange={(e) => setAdresse(e.target.value)} /></div>
            <div className="form-group"><label>SIRET</label><input value={siret} onChange={(e) => setSiret(e.target.value)} /></div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><span className="card-title">Paramètres financiers</span></div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group"><label>TVA par défaut (%)</label><input type="number" min="0" max="100" step="0.1" value={tva} onChange={(e) => setTva(e.target.value)} /></div>
              <div className="form-group">
                <label>Devise</label>
                <select value={devise} onChange={(e) => setDevise(e.target.value)}>
                  <option>EUR — Euro</option>
                  <option>CHF — Franc suisse</option>
                </select>
              </div>
            </div>
            <div className="form-group"><label>IBAN</label><input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="FR76 ..." /></div>
            <div className="form-group"><label>BIC / SWIFT</label><input value={bic} onChange={(e) => setBic(e.target.value)} placeholder="BNPAFRPP" /></div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8, marginBottom: 28 }}>
          <button type="submit" className="btn btn-primary">Enregistrer les paramètres</button>
        </div>
      </form>

      <div className="card">
        <div className="card-header"><span className="card-title">Sécurité</span></div>
        <form className="card-body" onSubmit={handlePassword}>
          <div className="form-row">
            <div className="form-group"><label>Nouveau mot de passe</label><input type="password" autoComplete="new-password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="••••••••" /></div>
            <div className="form-group"><label>Confirmer</label><input type="password" autoComplete="new-password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} placeholder="••••••••" /></div>
          </div>
          {pwdMsg && (
            <div style={{ color: pwdMsg.ok ? 'var(--success)' : 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{pwdMsg.text}</div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-secondary">Changer le mot de passe</button>
          </div>
        </form>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header"><span className="card-title">Double authentification (2FA)</span></div>
        <div className="card-body">
          {mfaFactors === null && <p className="mfa-note">Vérification de l’état…</p>}

          {mfaFactors !== null && mfaFactors.length > 0 && !enrolement && (
            <>
              <p className="mfa-statut"><ShieldCheck size={15} /> Activée</p>
              <p className="mfa-note">
                Un code à 6 chiffres, généré par votre application d’authentification, est demandé à chaque
                connexion en plus du mot de passe.
                {mfaFactors[0].createdAt && ` (activée le ${new Date(mfaFactors[0].createdAt).toLocaleDateString('fr-FR')})`}
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={desactiverMfa} disabled={mfaBusy}>
                  Désactiver
                </button>
              </div>
            </>
          )}

          {enrolement && (
            <form onSubmit={validerMfa}>
              <p className="mfa-note"><strong>1.</strong> Ouvrez 2FAS (ou Google Authenticator) et scannez ce QR code :</p>
              <div className="mfa-qr">
                <img src={enrolement.qrCode} alt="QR code de configuration de la 2FA" width={186} height={186} />
                <div>
                  <p className="mfa-note" style={{ marginTop: 0 }}>Scan impossible ? Saisissez la clé à la main :</p>
                  <code className="mfa-secret">{enrolement.secret}</code>
                </div>
              </div>
              <p className="mfa-note"><strong>2.</strong> Recopiez le code à 6 chiffres affiché par l’application :</p>
              <div className="form-group" style={{ maxWidth: 200 }}>
                <label htmlFor="mfa-code-settings">Code de vérification</label>
                <input
                  id="mfa-code-settings"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  placeholder="123456"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={annulerEnrolement} disabled={mfaBusy}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={mfaBusy || mfaCode.length !== 6}>
                  Activer
                </button>
              </div>
            </form>
          )}

          {mfaFactors !== null && mfaFactors.length === 0 && !enrolement && (
            <>
              <p className="mfa-statut mfa-statut--off">Désactivée</p>
              <p className="mfa-note">
                Ajoutez un second facteur (application 2FAS, Google Authenticator, Authy…). Même si le mot de
                passe fuite, l’accès à la base clients et devis reste fermé.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-primary" onClick={activerMfa} disabled={mfaBusy}>
                  <ShieldCheck size={16} /> Activer la double authentification
                </button>
              </div>
            </>
          )}

          {mfaMsg && !enrolement && (
            <div style={{ color: mfaMsg.ok ? 'var(--success)' : 'var(--danger)', fontSize: 13, marginTop: 12 }}>
              {mfaMsg.text}
            </div>
          )}
          {mfaMsg && enrolement && (
            <div style={{ color: mfaMsg.ok ? 'var(--success)' : 'var(--danger)', fontSize: 13, marginBottom: 12 }}>
              {mfaMsg.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

