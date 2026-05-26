import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  onClose: () => void;
}

export default function MentionsLegales({ onClose }: Props) {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-navy-900 text-slate-300 py-12 px-6 sm:px-12 md:px-24 overflow-y-auto"
    >
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sun-500 hover:text-white mb-12 transition-colors font-bold uppercase tracking-wider text-sm"
        >
          <X className="w-5 h-5" /> Retour au site
        </button>

        <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-16">Mentions Légales</h1>

        <div className="space-y-12 text-lg leading-relaxed">
          <section>
            <h2 className="text-2xl font-display font-bold text-white mb-4">1. Éditeur du site</h2>
            <p>
              Le site <strong>L'Agence de Scott</strong> est édité par :<br />
              <strong>Jordan Schmidt</strong><br />
              Résidant à : Saint-Amarin<br />
              Statut : Entreprise en cours de création.<br />
              Téléphone : 06 64 82 18 35<br />
              Email : <a href="mailto:contact@lagencedescott.fr" className="text-sun-500 hover:underline">contact@lagencedescott.fr</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-white mb-4">2. Hébergement</h2>
            <p>
              Le site est hébergé par :<br />
              <strong>GitHub, Inc.</strong><br />
              88 Colin P Kelly Jr St,<br />
              San Francisco, CA 94107,<br />
              États-Unis.
            </p>
            <p className="mt-2 text-sm text-slate-400">
              *Hébergé via le service GitHub Pages.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-white mb-4">3. Propriété intellectuelle</h2>
            <p>
              L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-white mb-4">4. Données personnelles</h2>
            <p>
              Les informations recueillies via le formulaire de contact (nom, email, message) sont destinées uniquement à <strong>Jordan Schmidt</strong> dans le but exclusif de pouvoir répondre à vos demandes de contact ou de devis.<br />
              Conformément à la loi « Informatique et Libertés », vous disposez d'un droit d'accès, de rectification et d'opposition aux données vous concernant en nous contactant à l'adresse email : <a href="mailto:contact@lagencedescott.fr" className="text-sun-500 hover:underline">contact@lagencedescott.fr</a>.
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
