import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { X, FileText, MapPin, Phone, Mail, Building2, CalendarDays, ArrowUp, CheckCircle2, Link2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  onClose: () => void;
}

const ARTICLES = [
  { id: 'objet', num: '01', title: 'Objet' },
  { id: 'devis', num: '02', title: 'Devis et commande' },
  { id: 'tarifs', num: '03', title: 'Tarifs' },
  { id: 'paiement', num: '04', title: 'Modalités de paiement' },
  { id: 'retard', num: '05', title: 'Retard de paiement' },
  { id: 'delais', num: '06', title: 'Délais de réalisation' },
  { id: 'contenus', num: '07', title: 'Contenus fournis par le client' },
  { id: 'validation', num: '08', title: 'Validation et modifications' },
  { id: 'livraison', num: '09', title: 'Livraison et mise en ligne' },
  { id: 'propriete', num: '10', title: 'Propriété intellectuelle' },
  { id: 'references', num: '11', title: 'Références et portfolio' },
  { id: 'maintenance', num: '12', title: 'Maintenance et hébergement' },
  { id: 'responsabilite', num: '13', title: 'Responsabilité' },
  { id: 'resiliation', num: '14', title: 'Résiliation' },
  { id: 'force-majeure', num: '15', title: 'Force majeure' },
  { id: 'litiges', num: '16', title: 'Droit applicable et litiges' },
  { id: 'acceptation', num: '17', title: 'Acceptation' },
];

/** Offset sous la barre de navigation fixe de la modale (76px + marge). */
const SCROLL_OFFSET = 100;
/** Seuil du scroll-spy par rapport au haut du conteneur visible. */
const SPY_THRESHOLD = 320;

function useCgvNav() {
  const [activeId, setActiveId] = useState(ARTICLES[0].id);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const container = document.getElementById('cgv-scroll');
    if (!container) return;

    const onScroll = () => {
      setShowBackToTop(container.scrollTop > 600);
      // Scroll-spy basé sur les positions réelles (getBoundingClientRect),
      // pas sur offsetTop qui est relatif à l'offsetParent.
      const containerTop = container.getBoundingClientRect().top;
      let current = ARTICLES[0].id;
      for (const a of ARTICLES) {
        const el = document.getElementById(`cgv-${a.id}`);
        if (el && el.getBoundingClientRect().top - containerTop < SPY_THRESHOLD) {
          current = a.id;
        }
      }
      setActiveId(current);
    };

    onScroll();
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToArticle = (id: string) => {
    const container = document.getElementById('cgv-scroll');
    const el = document.getElementById(`cgv-${id}`);
    if (!container || !el) return;
    // Scrolle le conteneur interne (le body est en overflow:hidden),
    // pas le document via scrollIntoView.
    const top =
      container.scrollTop +
      (el.getBoundingClientRect().top - container.getBoundingClientRect().top) -
      SCROLL_OFFSET;
    container.scrollTo({ top, behavior: 'smooth' });
  };

  const scrollToTop = () => {
    document.getElementById('cgv-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return { activeId, showBackToTop, scrollToArticle, scrollToTop };
}

export default function CGV({ onClose }: Props) {
  const { activeId, showBackToTop, scrollToArticle, scrollToTop } = useCgvNav();
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Focus initial + restauration du focus + fermeture via Escape.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus({ preventScroll: true });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ type: 'spring', damping: 28, stiffness: 220 }}
      className="fixed inset-0 z-50 bg-navy-900 text-slate-300"
      role="dialog"
      aria-modal="true"
      aria-label="Conditions Générales de Vente"
    >
      <div className="bg-noise"></div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-navy-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-[90rem] mx-auto px-6 py-4 flex items-center justify-between">
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="flex items-center gap-2 text-sun-400 hover:text-white transition-colors font-bold uppercase tracking-wider text-sm group"
          >
            <span className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center group-hover:bg-sun-500 group-hover:text-navy-900 group-hover:border-sun-500 transition-all">
              <X className="w-5 h-5" />
            </span>
            Retour au site
          </button>
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
            <FileText className="w-4 h-4 text-sun-500" /> Document contractuel
          </div>
        </div>
      </div>

      <div id="cgv-scroll" className="h-full overflow-y-auto pt-[76px] scroll-smooth">
        {/* Hero */}
        <header className="relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-sun-500/15 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center relative">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block py-2 px-5 rounded-full border border-sun-500/30 bg-sun-500/10 text-sun-400 text-xs font-bold uppercase tracking-[0.2em] mb-8"
            >
              L'Agence de Scott • Saint-Amarin
            </motion.span>
            <h1 className="font-display text-5xl md:text-7xl font-black tracking-tight text-white leading-[0.95]">
              CONDITIONS<br />
              <span className="text-outline">GÉNÉRALES</span><br />
              DE VENTE.
            </h1>
            <p className="mt-8 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
              Les règles claires et transparentes qui encadrent nos collaborations :
              création de sites internet, applications, design et assistance informatique.
            </p>

            {/* Identity card */}
            <div className="mt-12 grid sm:grid-cols-2 gap-4 text-left">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-sun-500 text-navy-900 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h2 className="font-display font-bold text-white text-lg">Éditeur</h2>
                </div>
                <ul className="space-y-1.5 text-[15px] leading-relaxed">
                  <li><strong className="text-white">L'Agence de Scott</strong></li>
                  <li>Jordan Schmidt — Entrepreneur individuel</li>
                  <li className="text-slate-400">Micro-entrepreneur</li>
                  <li className="text-slate-400">SIRET : <strong className="text-slate-200">105 686 240 00018</strong></li>
                </ul>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-leaf-500 text-navy-900 flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                  <h2 className="font-display font-bold text-white text-lg">Contact</h2>
                </div>
                <ul className="space-y-2 text-[15px]">
                  <li className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-1 text-sun-400 shrink-0" />
                    <span>12 rue Jacques Leonhart,<br />68550 Saint-Amarin, France</span>
                  </li>
                  <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-sun-400 shrink-0" /><a href="tel:+33664821835" className="hover:text-white">06 64 82 18 35</a></li>
                  <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-sun-400 shrink-0" /><a href="mailto:contact@lagencedescott.fr" className="text-sun-400 hover:text-white font-semibold">contact@lagencedescott.fr</a></li>
                </ul>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-400">
                <CalendarDays className="w-4 h-4 text-leaf-400" /> Dernière mise à jour : 11 septembre 2026
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-sun-400" /> Acceptées à la signature du devis
              </span>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="max-w-6xl mx-auto px-6 pb-32 grid lg:grid-cols-[260px_1fr] gap-10">
          {/* TOC */}
          <aside className="hidden lg:block">
            <nav aria-label="Sommaire des CGV" className="sticky top-8 bg-white/[0.03] border border-white/10 rounded-3xl p-4 max-h-[calc(100vh-120px)] overflow-y-auto">
              <p className="px-3 pt-2 pb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Sommaire</p>
              <ul className="space-y-1">
                {ARTICLES.map((a) => (
                  <li key={a.id}>
                    <button
                      onClick={() => scrollToArticle(a.id)}
                      aria-current={activeId === a.id ? 'true' : undefined}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-3 transition-all ${
                        activeId === a.id
                          ? 'bg-sun-500 text-navy-900'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className={`font-display text-xs font-black ${activeId === a.id ? 'text-navy-900/70' : 'text-sun-500/70'}`}>{a.num}</span>
                      {a.title}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Articles */}
          <div className="space-y-6 min-w-0">
            {/* Mobile TOC */}
            <nav aria-label="Sommaire des CGV" className="lg:hidden flex gap-2 overflow-x-auto pb-2 -mx-6 px-6">
              {ARTICLES.map((a) => (
                <button
                  key={a.id}
                  onClick={() => scrollToArticle(a.id)}
                  aria-current={activeId === a.id ? 'true' : undefined}
                  className="shrink-0 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs font-bold uppercase tracking-wider text-slate-300 hover:border-sun-500 hover:text-white transition-colors"
                >
                  {a.num} • {a.title}
                </button>
              ))}
            </nav>

            <ArticleCard id="objet" num="01" title="Objet">
              <p>
                Les présentes Conditions Générales de Vente (CGV) définissent les conditions dans lesquelles{' '}
                <strong className="text-white">L'Agence de Scott</strong> fournit à ses clients des prestations de
                création et de refonte de sites internet, création d'applications, design et identité graphique,
                ainsi que des prestations d'assistance informatique.
              </p>
              <p>Toute commande passée auprès de L'Agence de Scott implique l'acceptation pleine et entière des présentes CGV.</p>
              <p>Les conditions particulières figurant sur le devis accepté par le client prévalent sur les présentes CGV en cas de contradiction.</p>
            </ArticleCard>

            <ArticleCard id="devis" num="02" title="Devis et commande">
              <p>Toute prestation fait l'objet d'un devis précisant notamment la nature des prestations, leur prix et, lorsque cela est applicable, le délai prévisionnel de réalisation.</p>
              <p>Le devis est valable pendant la durée indiquée sur celui-ci.</p>
              <p>La commande est considérée comme ferme et définitive après :</p>
              <ul>
                <li>acceptation et signature du devis par le client ;</li>
                <li>versement de l'acompte prévu au devis ;</li>
                <li>transmission par le client des éléments nécessaires au démarrage de la prestation.</li>
              </ul>
              <p>La signature du devis vaut acceptation des présentes CGV.</p>
              <p>Toute prestation supplémentaire non prévue initialement dans le devis pourra faire l'objet d'un devis complémentaire ou d'une facturation supplémentaire après accord du client.</p>
            </ArticleCard>

            <ArticleCard id="tarifs" num="03" title="Tarifs" highlight>
              <p>Les prix des prestations sont indiqués sur le devis.</p>
              <p>
                En tant que micro-entrepreneur, L'Agence de Scott applique le régime de la franchise en base de TVA
                (article 293 B du CGI) : <strong className="text-white">TVA non applicable, les prix sont exprimés en euros nets.</strong>
              </p>
              <p>Les prestations non prévues au devis initial ne sont pas incluses dans le prix convenu.</p>
              <p>Les éventuels frais supplémentaires liés à des services tiers, licences, abonnements, noms de domaine, solutions externes ou prestations particulières sont précisés au client avant engagement lorsque ceux-ci ne sont pas inclus dans le devis.</p>
            </ArticleCard>

            <ArticleCard id="paiement" num="04" title="Modalités de paiement">
              <p>Sauf indication contraire sur le devis, les modalités de règlement sont les suivantes :</p>
              <div className="grid sm:grid-cols-2 gap-3 not-italic my-2">
                <div className="rounded-2xl bg-sun-500/10 border border-sun-500/30 p-5 text-center">
                  <p className="font-display text-4xl font-black text-sun-400">50%</p>
                  <p className="text-sm font-bold text-white mt-1 uppercase tracking-wider">Acompte à la commande</p>
                  <p className="text-sm text-slate-400 mt-1">Démarrage de la prestation</p>
                </div>
                <div className="rounded-2xl bg-leaf-500/10 border border-leaf-500/30 p-5 text-center">
                  <p className="font-display text-4xl font-black text-leaf-400">50%</p>
                  <p className="text-sm font-bold text-white mt-1 uppercase tracking-wider">Solde à la livraison</p>
                  <p className="text-sm text-slate-400 mt-1">À la mise en ligne du projet</p>
                </div>
              </div>
              <p>Les paiements sont effectués par les moyens indiqués sur le devis ou la facture (virement bancaire notamment).</p>
              <p>L'acompte versé constitue un engagement ferme des deux parties.</p>
            </ArticleCard>

            <ArticleCard id="retard" num="05" title="Retard de paiement">
              <p>Toute somme non réglée à son échéance entraîne, de plein droit et sans rappel préalable, l'application de pénalités de retard à compter du jour suivant la date d'échéance indiquée sur la facture.</p>
              <p>Pour les clients professionnels, le taux des pénalités de retard applicable est celui prévu par la réglementation en vigueur et ne peut être inférieur au minimum légal (taux d'intérêt appliqué par la BCE majoré de 10 points).</p>
              <p>Une indemnité forfaitaire de <strong className="text-white">40 € pour frais de recouvrement</strong> est également due pour tout retard de paiement par un client professionnel, conformément aux articles L.441-10 et D.441-5 du Code de commerce.</p>
              <p>Lorsque les frais de recouvrement réellement engagés sont supérieurs à cette indemnité forfaitaire, une indemnisation complémentaire pourra être demandée sur justificatifs.</p>
              <p>En cas de retard ou de défaut de paiement, L'Agence de Scott se réserve le droit de suspendre temporairement les prestations en cours, notamment la livraison, la mise en ligne, la maintenance ou les interventions, jusqu'à régularisation de la situation.</p>
            </ArticleCard>

            <ArticleCard id="delais" num="06" title="Délais de réalisation">
              <p>Les délais de réalisation sont indiqués à titre prévisionnel sur le devis.</p>
              <p>Pour les projets de création ou de refonte de site internet, le délai est généralement compris entre <strong className="text-white">3 et 4 semaines</strong>, sauf indication contraire sur le devis.</p>
              <p>Le délai commence à courir à compter de la validation du devis, du versement de l'acompte et de la réception de l'ensemble des éléments nécessaires à la réalisation du projet.</p>
              <p>Tout retard dans la transmission des contenus, images, informations, accès ou validations nécessaires de la part du client peut entraîner un report du délai de livraison.</p>
              <p>Les délais peuvent également être adaptés en cas de demande de modification importante ou d'ajout de prestations non prévues initialement.</p>
            </ArticleCard>

            <ArticleCard id="contenus" num="07" title="Contenus fournis par le client">
              <p>Le client s'engage à fournir les textes, photographies, logos, informations et autres éléments nécessaires à la réalisation de la prestation.</p>
              <p>Le client garantit disposer des droits nécessaires à l'utilisation des éléments qu'il transmet à L'Agence de Scott.</p>
              <p>Le client reste responsable du contenu publié sur son site ou son application, notamment de son exactitude et de sa conformité aux lois et réglementations applicables.</p>
              <p>L'Agence de Scott ne pourra être tenue responsable d'un retard résultant de la transmission tardive ou incomplète des éléments nécessaires au projet.</p>
            </ArticleCard>

            <ArticleCard id="validation" num="08" title="Validation et modifications">
              <p>Le client bénéficie des corrections et ajustements prévus dans le devis.</p>
              <p>Toute demande supplémentaire ou modification substantielle dépassant le périmètre initial de la prestation pourra faire l'objet d'une facturation complémentaire.</p>
              <p>Une fois une étape validée par le client, toute modification ultérieure importante de cette étape pourra être considérée comme une prestation supplémentaire.</p>
              <p>Le client s'engage à effectuer les validations nécessaires dans un délai raisonnable afin de permettre la poursuite du projet.</p>
            </ArticleCard>

            <ArticleCard id="livraison" num="09" title="Livraison et mise en ligne">
              <p>La livraison du projet intervient lorsque les prestations prévues au devis ont été réalisées et que les éventuelles corrections incluses dans la prestation ont été effectuées.</p>
              <p>Lorsque le solde est dû à la livraison, la mise en ligne définitive du site peut être conditionnée au règlement intégral du solde.</p>
              <p>Les accès, fichiers ou éléments nécessaires à l'exploitation du projet sont transmis au client selon les modalités prévues dans le devis.</p>
            </ArticleCard>

            <ArticleCard id="propriete" num="10" title="Propriété intellectuelle">
              <p>Sauf disposition contraire prévue au devis, les éléments créés spécifiquement pour le client dans le cadre de la prestation lui sont cédés après règlement intégral du prix convenu.</p>
              <p>Cette cession ne concerne pas les outils, bibliothèques, frameworks, composants, logiciels, ressources sous licence ou éléments tiers utilisés pour réaliser le projet et dont L'Agence de Scott ne détient pas les droits.</p>
              <p>Les modalités précises d'utilisation ou de cession des éléments graphiques, textes, photographies, codes sources ou autres créations peuvent être précisées dans le devis.</p>
            </ArticleCard>

            <ArticleCard id="references" num="11" title="Références et portfolio">
              <p>Sauf opposition expresse du client, L'Agence de Scott pourra présenter le projet réalisé dans son portfolio, sur son site internet <strong className="text-white">lagencedescott.fr</strong> et sur ses supports de communication, uniquement à titre de référence professionnelle.</p>
              <p>Toute demande de confidentialité particulière pourra être prise en compte avant la réalisation du projet.</p>
            </ArticleCard>

            <ArticleCard id="maintenance" num="12" title="Maintenance et hébergement">
              <p>Sauf mention contraire sur le devis, les prestations de création ou de refonte de site ne comprennent pas nécessairement une prestation de maintenance continue.</p>
              <p>Lorsque l'hébergement, le nom de domaine, la maintenance ou d'autres services récurrents sont inclus, leurs conditions sont précisées dans le devis ou dans une offre spécifique.</p>
              <p>Les services fournis par des prestataires tiers restent soumis à leurs propres conditions générales et peuvent être indépendants de L'Agence de Scott.</p>
            </ArticleCard>

            <ArticleCard id="responsabilite" num="13" title="Responsabilité">
              <p>L'Agence de Scott s'engage à réaliser les prestations avec sérieux et conformément aux éléments convenus avec le client.</p>
              <p>L'Agence de Scott ne pourra toutefois être tenue responsable des dysfonctionnements résultant notamment :</p>
              <ul>
                <li>d'une mauvaise utilisation du site ou de l'application par le client ;</li>
                <li>d'une modification effectuée par le client ou un tiers ;</li>
                <li>d'un dysfonctionnement d'un service tiers ;</li>
                <li>d'une interruption de service de l'hébergeur ou du fournisseur de nom de domaine ;</li>
                <li>d'informations ou contenus erronés fournis par le client ;</li>
                <li>d'un événement indépendant de sa volonté.</li>
              </ul>
            </ArticleCard>

            <ArticleCard id="resiliation" num="14" title="Résiliation">
              <p>En cas d'abandon du projet à l'initiative du client après acceptation du devis, les sommes déjà versées restent acquises à L'Agence de Scott au titre du travail engagé, sous réserve des dispositions légales applicables.</p>
              <p>Si le client souhaite mettre fin au projet avant son achèvement, les prestations déjà réalisées et les éventuels frais engagés pourront être facturés.</p>
              <p>En cas de manquement grave de l'une des parties à ses obligations, l'autre partie pourra demander la résiliation du contrat après mise en demeure restée sans effet dans un délai raisonnable.</p>
            </ArticleCard>

            <ArticleCard id="force-majeure" num="15" title="Force majeure">
              <p>L'Agence de Scott ne pourra être tenue responsable d'un retard ou d'une impossibilité d'exécution résultant d'un événement de force majeure ou d'un événement indépendant raisonnablement de son contrôle.</p>
              <p>Les délais seront alors adaptés en fonction de la durée de l'événement concerné.</p>
            </ArticleCard>

            <ArticleCard id="litiges" num="16" title="Droit applicable et litiges" highlight>
              <p>Les présentes CGV sont soumises au <strong className="text-white">droit français</strong>.</p>
              <p>En cas de différend, les parties s'engagent à rechercher en priorité une solution amiable. Vous pouvez contacter L'Agence de Scott à <a href="mailto:contact@lagencedescott.fr" className="text-sun-400 hover:text-white font-semibold">contact@lagencedescott.fr</a> ou au <a href="tel:+33664821835" className="text-sun-400 hover:text-white font-semibold">06 64 82 18 35</a>.</p>
              <p>Pour les clients professionnels, à défaut de résolution amiable, le litige pourra être soumis aux juridictions compétentes conformément aux règles de droit applicables.</p>
              <p>Pour les clients consommateurs, les dispositions légales relatives à la protection des consommateurs et aux modes de règlement des litiges restent applicables, y compris le recours à un médiateur de la consommation.</p>
            </ArticleCard>

            <ArticleCard id="acceptation" num="17" title="Acceptation" highlight>
              <p>La signature du devis par le client vaut acceptation des présentes Conditions Générales de Vente.</p>
              <p>Le client reconnaît avoir pris connaissance des présentes CGV avant la validation de sa commande.</p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <a
                  href="mailto:contact@lagencedescott.fr?subject=Demande%20de%20devis%20%E2%80%94%20L%27Agence%20de%20Scott"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-sun-500 hover:bg-white text-navy-900 font-bold text-sm uppercase tracking-wider transition-colors"
                >
                  <Mail className="w-4 h-4" /> Demander un devis
                </a>
                <button
                  onClick={onClose}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-white/15 hover:border-white/40 text-white font-bold text-sm uppercase tracking-wider transition-colors"
                >
                  Fermer
                </button>
              </div>
            </ArticleCard>

            {/* Legal footer */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-sm text-slate-500 leading-relaxed">
              <p>
                <strong className="text-slate-300">L'Agence de Scott</strong> — Jordan Schmidt, EI — 12 rue Jacques Leonhart, 68550 Saint-Amarin — SIRET 105 686 240 00018 —{' '}
                <a href="mailto:contact@lagencedescott.fr" className="text-sun-400 hover:underline">contact@lagencedescott.fr</a> —{' '}
                <a href="https://lagencedescott.fr" target="_blank" rel="noreferrer" className="text-sun-400 hover:underline">lagencedescott.fr</a>
              </p>
              <p className="mt-3 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-sun-500 shrink-0" />
                <span>Lien partageable vers ce document : <span className="text-slate-300 font-semibold">lagencedescott.fr/#cgv</span></span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Back to top */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-20 w-11 h-11 bg-sun-500 text-navy-900 rounded-full flex items-center justify-center shadow-2xl hover:bg-white transition-colors"
            aria-label="Retour en haut"
          >
            <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ArticleCard({
  id,
  num,
  title,
  highlight = false,
  children,
}: {
  id: string;
  num: string;
  title: string;
  highlight?: boolean;
  children: ReactNode;
}) {
  return (
    <motion.section
      id={`cgv-${id}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5 }}
      className="scroll-mt-28 rounded-[2rem] border p-8 md:p-10 relative overflow-hidden bg-white/[0.03] border-white/10 data-[highlight=true]:bg-sun-500/[0.06] data-[highlight=true]:border-sun-500/25"
      data-highlight={highlight}
    >
      <div className="flex items-start gap-5 mb-6">
        <span aria-hidden="true" className="font-display text-5xl md:text-6xl font-black text-white/[0.08] leading-none select-none">{num}</span>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sun-400 mb-1">Article {parseInt(num, 10)}</p>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight">{title}</h2>
        </div>
      </div>
      <div className="space-y-4 text-[16.5px] leading-relaxed text-slate-300 [&_ul]:space-y-2 [&_ul]:pl-1 [&_li]:relative [&_li]:pl-6 [&_li]:before:content-['✦'] [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:text-sun-500 [&_li]:before:text-sm">
        {children}
      </div>
    </motion.section>
  );
}
