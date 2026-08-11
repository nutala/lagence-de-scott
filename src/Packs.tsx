import React from 'react';
import { motion } from 'motion/react';
import {
  Monitor, Smartphone, Mail, Globe, Search, Star, MapPin,
  Zap, Users, ShoppingCart, Heart, ShieldCheck, Home, TrendingUp
} from 'lucide-react';

const ArrowIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className={className}>
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

type Pack = {
  name: string;
  desc: string;
  priceLabel?: string;
  price?: string;
  priceTtc?: boolean;
  priceDevis?: boolean;
  features: { icon: React.ElementType; label: string; note?: string }[];
  cta: string;
  variant: "outline" | "primary" | "signature";
};

const PACKS: Pack[] = [
  {
    name: "Essentiel",
    desc: "Pour lancer votre présence en ligne.",
    priceLabel: "À partir de",
    price: "490",
    priceTtc: true,
    features: [
      { icon: Home, label: "Site vitrine 1 page" },
      { icon: Smartphone, label: "Design responsive" },
      { icon: Mail, label: "Formulaire de contact" },
      { icon: Globe, label: "Hébergement & mise en ligne" },
      { icon: Search, label: "SEO de base" },
    ],
    cta: "Choisir l'Essentiel",
    variant: "outline",
  },
  {
    name: "Signature",
    desc: "Le meilleur équilibre entre qualité, visibilité et fonctionnalités.",
    priceLabel: "À partir de",
    price: "790",
    priceTtc: true,
    features: [
      { icon: Monitor, label: "Site vitrine 3 à 5 pages" },
      { icon: Heart, label: "Design sur mesure et moderne" },
      { icon: Search, label: "SEO local optimisé" },
      { icon: MapPin, label: "Fiche Google Business offerte", note: "(Valeur 150 €)" },
      { icon: Mail, label: "Formulaire de contact" },
      { icon: Globe, label: "Hébergement & mise en ligne" },
      { icon: Zap, label: "Évolutif" },
    ],
    cta: "Lancer mon projet",
    variant: "signature",
  },
  {
    name: "Prestige",
    desc: "Une solution entièrement sur mesure pour les projets ambitieux.",
    priceDevis: true,
    features: [
      { icon: Star, label: "Site entièrement sur mesure" },
      { icon: Zap, label: "Fonctionnalités avancées" },
      { icon: TrendingUp, label: "SEO avancé & stratégie digitale" },
      { icon: ShoppingCart, label: "E-commerce, réservation, espace client…" },
      { icon: Heart, label: "Design premium & animations" },
      { icon: Users, label: "Accompagnement personnalisé" },
    ],
    cta: "Parlons de votre projet",
    variant: "outline",
  },
];

const TRUST = [
  { icon: ShieldCheck, label: "100% Transparence", sub: "Devis clair et sans surprise" },
  { icon: MapPin, label: "Proche de chez vous", sub: "Basé à Saint-Amarin" },
  { icon: Zap, label: "Réactif & à l'écoute", sub: "Réponse rapide garantie" },
  { icon: Heart, label: "Passionné & Engagé", sub: "Votre projet, ma priorité" },
];

function PackCard({ pack, onCta, index }: { pack: Pack; onCta: () => void; index: number }) {
  const isSignature = pack.variant === "signature";

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.12, duration: 0.6 }}
      className={`relative flex flex-col rounded-[2rem] p-10 md:p-12 transition-transform duration-300 hover:-translate-y-1 ${
        isSignature
          ? "bg-leaf-900 border border-leaf-600 shadow-xl"
          : "bg-navy-800 border border-white/5"
      } md:order-none ${isSignature ? "order-first md:order-none" : ""}`}
    >
      {isSignature && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-sun-500 text-navy-900 text-xs font-bold tracking-widest uppercase px-5 py-1.5 rounded-full flex items-center gap-1.5 z-10 whitespace-nowrap">
          <Star className="w-3.5 h-3.5 fill-current" />
          Le plus populaire
        </div>
      )}

      <div className={`w-16 h-16 rounded-full border flex items-center justify-center mx-auto mb-5 ${
        isSignature ? "border-leaf-500" : "border-white/10"
      }`}>
        <Star className={`w-7 h-7 ${isSignature ? "text-sun-400" : "text-leaf-400"}`} />
      </div>

      <h3 className={`text-center font-display font-bold tracking-[0.15em] uppercase mb-2.5 ${
        isSignature ? "text-sun-400" : "text-white"
      }`}>{pack.name}</h3>
      <p className={`text-center text-sm leading-relaxed mb-8 min-h-[44px] ${
        isSignature ? "text-leaf-100/70" : "text-slate-400"
      }`}>{pack.desc}</p>
      <div className={`h-px mb-6 ${isSignature ? "bg-leaf-600" : "bg-white/10"}`} />

      <div className="text-center mb-8">
        {pack.priceDevis ? (
          <p className={`font-display font-bold ${isSignature ? "text-sun-400" : "text-sun-500"}`} style={{ fontSize: "2rem", letterSpacing: "0.04em" }}>
            Sur devis
          </p>
        ) : (
          <>
            <p className="text-xs font-bold tracking-[0.18em] uppercase text-slate-400 mb-1">
              {pack.priceLabel}
            </p>
            <p className={`font-display font-bold leading-none ${isSignature ? "text-white" : "text-white"}`} style={{ fontSize: "2.8rem" }}>
              {pack.price} <span className="text-base font-medium text-slate-400 ml-1">€ TTC</span>
            </p>
          </>
        )}
      </div>

      <ul className="space-y-3.5 mb-8 flex-1">
        {pack.features.map((f, i) => (
          <li key={i} className={`flex items-start gap-3 text-sm leading-relaxed ${
            isSignature ? "text-leaf-50/90" : "text-slate-300"
          }`}>
            <f.icon className={`w-[18px] h-[18px] shrink-0 mt-0.5 ${isSignature ? "text-sun-400" : "text-leaf-400"}`} />
            <div>
              {f.label}
              {f.note && (
                <span className={`block text-xs font-semibold mt-0.5 ${isSignature ? "text-sun-400" : "text-sun-500"}`}>
                  {f.note}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>

      <button
        onClick={onCta}
        className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-xs font-bold tracking-[0.1em] uppercase transition-all duration-200 border ${
          isSignature
            ? "bg-white text-navy-900 border-white hover:bg-sun-400 hover:border-sun-400 hover:text-navy-900"
            : "bg-transparent text-white border-white/20 hover:bg-white hover:text-navy-900 hover:border-white"
        }`}
      >
        {pack.cta}
        <ArrowIcon className="w-4 h-4" />
      </button>
    </motion.article>
  );
}

export default function PacksSection({ onCta }: { onCta: () => void }) {
  return (
    <section className="relative py-32 overflow-hidden bg-navy-900 border-t border-white/5">
      <div className="max-w-[90rem] mx-auto px-6">
        <header className="text-center mb-14 relative z-10">
          <p className="flex items-center justify-center gap-4 text-xs font-bold tracking-[0.25em] uppercase text-slate-400 mb-4">
            <span className="w-10 h-px bg-white/10" />
            Nos Packs Web
            <span className="w-10 h-px bg-white/10" />
          </p>
          <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-4">
            Des <span className="text-outline">solutions adaptées</span> à votre projet
          </h2>
          <p className="text-lg text-slate-400 max-w-lg mx-auto">
            Sans abonnement. Un seul objectif : votre réussite.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start relative z-10">
          {PACKS.map((pack, i) => (
            <PackCard key={pack.name} pack={pack} index={i} onCta={onCta} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 bg-navy-800 border border-white/5 rounded-2xl p-7"
        >
          {TRUST.map((t, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="text-leaf-400 shrink-0">
                <t.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold tracking-wider uppercase text-white leading-tight">{t.label}</p>
                <p className="text-xs text-slate-400">{t.sub}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
