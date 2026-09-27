import React from 'react';
import { ShieldCheck } from 'lucide-react';
import logo from '../assets/images/logo_transparent.png';

/**
 * Coque commune des écrans d'authentification (connexion, double authentification) :
 * volet marque à gauche, carte de formulaire à droite.
 * Les deux écrans partagent ainsi exactement la même mise en page et la même charte.
 */
export default function AuthLayout({
  titre,
  texte,
  puces,
  note = "Accès réservé à L'Agence de Scott · connexion sécurisée",
  children,
}: {
  titre: string;
  texte: string;
  puces: string[];
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="auth-page">
      <aside className="auth-visual">
        <img src={logo} alt="" aria-hidden="true" className="auth-mark" />

        <div className="auth-brand">
          <img src={logo} alt="L'Agence de Scott" />
          <span className="auth-brand-nom">
            L'Agence de Scott
            <small>Artisan du Digital · Saint-Amarin</small>
          </span>
        </div>

        <div className="auth-accueil">
          <p className="auth-accueil-titre">{titre}</p>
          <p className="auth-accueil-texte">{texte}</p>
          <ul className="auth-modules">
            {puces.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>

        <p className="auth-copie">© {new Date().getFullYear()} L'Agence de Scott · Saint-Amarin</p>
      </aside>

      <main className="auth-form">
        <div className="auth-col">
          <div className="auth-card">{children}</div>
          <p className="auth-note">
            <ShieldCheck size={14} aria-hidden="true" />
            {note}
          </p>
        </div>
      </main>
    </div>
  );
}
