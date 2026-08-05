import React, { useState, FormEvent } from 'react';
import { useAdminData } from '../AdminDataContext';
import { supabase } from '../supabaseClient';
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
    </div>
  );
}
