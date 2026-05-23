import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring } from 'motion/react';
import {
  Menu, X, ArrowRight, ArrowUpRight, ArrowUp, ChevronUp,
  Globe, Palette, Wrench, Mountain, HeartHandshake,
  Mail, Phone, MapPin, CheckCircle2, ChevronDown, Quote
} from 'lucide-react';

import avatarImg from './assets/images/regenerated_image_1779087486989.png';
import brandLogo from './assets/images/logo.png';
import siteAtelierImg from './assets/images/site_atelier.png';
import siteBoulangerieImg from './assets/images/site_boulangerie.png';
import MentionsLegales from './MentionsLegales';
import Preloader from './Preloader';

const Marquee = ({ text, reverse = false, className = "" }: { text: string[], reverse?: boolean, className?: string }) => {
  return (
    <div className={`flex overflow-hidden whitespace-nowrap py-6 relative z-20 ${className}`}>
      <motion.div 
        animate={{ x: reverse ? ["-25%", "0%"] : ["0%", "-25%"] }}
        transition={{ repeat: Infinity, ease: "linear", duration: 40 }}
        className="flex gap-8 items-center text-white/50 font-display font-bold text-4xl md:text-6xl uppercase tracking-widest"
      >
        {[...Array(4)].map((_, i) => (
          <React.Fragment key={i}>
            {text.map((item, j) => (
              <React.Fragment key={`${i}-${j}`}>
                <span className="hover:text-white transition-colors cursor-default">{item}</span>
                <span className="text-sun-500 text-3xl">✦</span>
              </React.Fragment>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};

const ProjectItem = ({ 
  href, 
  title, 
  tags, 
  img, 
  accentColor = "sun" 
}: { 
  href: string, 
  title: string, 
  tags: string[], 
  img: string, 
  accentColor?: "sun" | "leaf" 
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const xSpring = useSpring(x, springConfig);
  const ySpring = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - 300); // Centered relative to image width (600px)
    y.set(e.clientY - rect.top - 170);  // Centered relative to image height (340px)
  };

  const hoverColorClass = accentColor === "sun" ? "group-hover:text-sun-500" : "group-hover:text-leaf-400";
  const buttonHoverColorClass = accentColor === "sun" ? "group-hover:bg-sun-500" : "group-hover:bg-leaf-400";
  const tagHoverColorClass = accentColor === "sun" ? "group-hover:border-sun-500" : "group-hover:border-leaf-400";

  return (
    <motion.a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 20 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      viewport={{ once: true }} 
      className="border-t border-white/10 py-12 md:py-16 group relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer"
    >
      <div className="z-10 relative">
        <h3 className={`font-display text-4xl md:text-6xl font-bold text-white ${hoverColorClass} transition-colors duration-300`}>
          {title}
        </h3>
        <div className="flex gap-4 mt-6">
          {tags.map(tag => (
            <span key={tag} className={`px-4 py-1.5 rounded-full border border-white/20 text-xs font-bold uppercase tracking-widest text-slate-300 ${tagHoverColorClass} transition-colors`}>
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className={`z-10 bg-white/5 p-4 rounded-full ${buttonHoverColorClass} group-hover:text-navy-900 transition-colors md:block hidden`}>
        <ArrowRight className="w-8 h-8 -rotate-45" />
      </div>
      
      {/* Cursor Following Image */}
      <motion.div 
        style={{ 
          x: xSpring, 
          y: ySpring,
        }}
        className="absolute w-[600px] aspect-video opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0 hidden md:block"
      >
        <img src={img} alt={title} className="w-full h-full object-cover rounded-3xl saturate-150" />
        <div className="absolute inset-0 bg-navy-900/40 rounded-3xl mix-blend-multiply"></div>
      </motion.div>

      {/* Mobile inline preview image */}
      <div className="w-full aspect-video md:hidden rounded-2xl overflow-hidden mt-4 z-10 border border-white/10">
        <img src={img} alt={title} className="w-full h-full object-cover saturate-150" />
      </div>
    </motion.a>
  );
};

function MainContent({ onShowMentions }: { onShowMentions: () => void }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccessfully, setIsSubmittedSuccessfully] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Parallax refs
  const heroRef = useRef(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const yHeroText = useTransform(heroScroll, [0, 1], ["0%", "80%"]);
  const opacityHero = useTransform(heroScroll, [0, 0.8], [1, 0]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setIsMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const message = formData.get('message') as string;
    const rgpd = formData.get('rgpd') as string;

    const newErrors: Record<string, string> = {};
    if (!name || name.trim().length < 2) {
      newErrors.name = "Le nom doit comporter au moins 2 caractères.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      newErrors.email = "Veuillez entrer une adresse email valide.";
    }
    if (!message || message.trim().length < 10) {
      newErrors.message = "Votre message doit comporter au moins 10 caractères.";
    }
    if (!rgpd) {
      newErrors.rgpd = "Vous devez accepter la politique de confidentialité.";
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("https://formsubmit.co/ajax/lagencedescott@gmail.com", {
        method: "POST",
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          message,
          _subject: "Nouveau message de L'Agence de Scott",
          _captcha: "false"
        })
      });

      if (response.ok) {
        setToastType("success");
        setToastMessage("Message envoyé avec succès !");
        setShowToast(true); 
        form.reset(); 
        setIsSubmittedSuccessfully(true);
        setTimeout(() => setShowToast(false), 4000); 
      } else {
        setToastType("info");
        setToastMessage("Veuillez consulter votre boîte mail ou réessayer plus tard.");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 6000);
      }
    } catch (error) {
      setToastType("error");
      setToastMessage("Erreur réseau (FormSubmit indisponible). Veuillez réessayer plus tard.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } finally {
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="bg-navy-900 text-slate-100 font-sans selection:bg-sun-500 selection:text-navy-900 min-h-screen overflow-x-hidden">
      <div className="bg-noise"></div>

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${isScrolled ? 'py-4 bg-navy-900/50 backdrop-blur-xl border-b border-white/5' : 'py-8'}`}
      >
        <div className="max-w-[90rem] mx-auto px-6 flex items-center justify-between">
          <button onClick={() => scrollTo('hero')} className="flex items-center gap-3 group z-50">
            <div className="w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500 bg-white/10 p-0 overflow-hidden shadow-lg border border-white/20">
              <img src={brandLogo} alt="Logo L'Agence de Scott" className="w-full h-full object-cover scale-[1.2]" />
            </div>
            <div className="flex flex-col items-start leading-none tracking-tight hidden sm:flex">
              <span className="font-display font-bold text-lg text-white uppercase bg-clip-text">L'Agence de Scott</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-sun-400 font-bold mt-1">Vallée de la Thur</span>
            </div>
          </button>
          
          <div className="hidden lg:flex items-center gap-6 xl:gap-10">
            {['Services', 'A propos', 'Realisations'].map((item) => (
              <button key={item} onClick={() => scrollTo(item.toLowerCase().replace(' ', ''))} className="text-sm font-bold uppercase tracking-wider text-slate-300 hover:text-sun-400 transition-colors relative group">
                {item}
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-sun-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
              </button>
            ))}
            <button onClick={() => scrollTo('contact')} className="bg-white hover:bg-sun-400 hover:text-navy-900 text-navy-900 text-sm font-bold px-6 xl:px-8 py-3 rounded-full transition-all duration-300 flex items-center gap-2 group">
              Lancer mon projet <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <button className="lg:hidden z-50 text-white p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
          </button>
        </div>
      </motion.nav>

      {/* Fullscreen Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed inset-0 z-30 bg-navy-900 flex flex-col px-6 pt-32 pb-10 lg:hidden overflow-y-auto">
            <div className="flex flex-col gap-8 mt-4 sm:mt-10">
              {['Services', 'A propos', 'Realisations', 'Contact'].map((item, i) => (
                <motion.button 
                  key={item} 
                  initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  onClick={() => scrollTo(item.toLowerCase().replace(' ', ''))} 
                  className="font-display text-4xl sm:text-5xl font-bold text-left text-white hover:text-sun-400 transition-colors uppercase tracking-tighter"
                >
                  {item}
                </motion.button>
              ))}
            </div>
            <div className="mt-auto pt-10 border-t border-white/10 flex flex-col gap-4">
              <a href="mailto:lagencedescott@gmail.com" className="text-lg sm:text-xl font-bold text-white flex items-center gap-3">
                <Mail className="w-5 h-5 text-sun-500" /> lagencedescott@gmail.com
              </a>
              <a href="tel:+33664821835" className="text-lg sm:text-xl font-bold text-white flex items-center gap-3">
                <Phone className="w-5 h-5 text-sun-500" /> 06 64 82 18 35
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section id="hero" ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video autoPlay muted loop playsInline className="w-full h-full object-cover opacity-[0.15] scale-105">
            <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_074327_a4d6275d-82d9-4c83-bfbe-f1fb2213c17c.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-transparent to-navy-900/50"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sun-500/20 rounded-full blur-[120px]"></div>
        </div>

        <motion.div style={{ y: yHeroText, opacity: opacityHero }} className="relative z-10 w-full max-w-[90rem] mx-auto px-6 mt-32 lg:mt-40 flex flex-col items-center text-center">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, ease: "easeOut" }} className="mb-6">
            <span className="inline-block py-2 px-4 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-xs font-bold uppercase tracking-widest text-slate-300">
               Artisan du Digital • Saint-Amarin
             </span>
          </motion.div>
          
          <h1 className="font-display text-[15vw] md:text-[12vw] font-black leading-[0.85] tracking-tighter w-full">
            <motion.span initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }} className="block text-outline opacity-50 relative pr-[10%]">L'AGENCE</motion.span>
            <motion.span initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} className="block text-white relative z-10">DE SCOTT</motion.span>
          </h1>
          
          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.4 }} className="mt-12 text-xl md:text-2xl text-slate-400 font-light max-w-2xl text-center">
             Création de sites internet, design et assistance informatique dans la Vallée de la Thur. <strong className="text-white font-medium">Le digital à taille humaine, proche de chez vous.</strong>
          </motion.p>
          
          <motion.button onClick={() => scrollTo('services')} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }} className="mt-20 w-16 h-16 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-all">
            <ArrowRight className="w-6 h-6 rotate-90" />
          </motion.button>
        </motion.div>
      </section>

      {/* Marquee Banner */}
      <Marquee text={['Créatif', 'Digital', 'Humain', 'Proche', 'Local']} className="border-y border-white/5 bg-navy-800/20" />

      {/* Services (Bento) */}
      <section id="services" className="py-32 relative scroll-mt-28">
        <div className="max-w-[90rem] mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tight">
              MES <span className="text-outline">EXPERTISES.</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-md">Des solutions sur-mesure pour vous accompagner dans votre transition numérique, sans jamais perdre de vue l'humain.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 auto-rows-[minmax(400px,_auto)]">
            {/* Sites Web */}
            <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="md:col-span-2 rounded-[2rem] bg-navy-800 p-10 md:p-14 relative overflow-hidden group border border-white/5">
              <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sun-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 group-hover:bg-sun-500/20 transition-colors duration-700"></div>
              
              <div className="relative z-10 h-full flex flex-col justify-between">
                <Globe className="w-12 h-12 text-sun-400 mb-10 group-hover:scale-110 transition-transform duration-500" />
                <div>
                  <h3 className="font-display text-4xl md:text-5xl font-bold mb-6 text-white leading-tight">Création<br/>Sites Web</h3>
                  <p className="text-slate-400 text-lg md:text-xl max-w-md leading-relaxed mb-8">Vitrines, e-commerce, portfolios. Des sites sur-mesure, performants, faciles à administrer par vous-même et optimisés pour vous rendre visible sur Google.</p>
                  <div className="flex flex-wrap gap-3">
                    {['Site Vitrine', 'Boutique en ligne', 'Sur-mesure', 'Clé en main'].map(tag => (
                      <span key={tag} className="px-5 py-2 rounded-full border border-white/10 bg-white/5 text-sm font-bold uppercase tracking-wider text-slate-300">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Design */}
            <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }} className="rounded-[2rem] bg-navy-800 p-10 md:p-14 relative overflow-hidden group border border-white/5">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-leaf-500/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 group-hover:bg-leaf-500/20 transition-colors duration-700"></div>
              
              <div className="relative z-10 h-full flex flex-col justify-between">
                <Palette className="w-12 h-12 text-leaf-400 mb-10 group-hover:scale-110 transition-transform duration-500" />
                <div>
                  <h3 className="font-display text-3xl md:text-4xl font-bold mb-6 text-white leading-tight">Design &<br/>Graphisme</h3>
                  <p className="text-slate-400 text-lg mb-8 leading-relaxed">Identité visuelle, logos, et supports de communication (cartes, flyers) pour créer un coup de cœur visuel et marquer les esprits.</p>
                  <button onClick={() => scrollTo('contact')} className="w-12 h-12 rounded-full bg-white text-navy-900 flex items-center justify-center group-hover:bg-leaf-400 transition-colors">
                    <ArrowUpRight className="w-6 h-6 group-hover:rotate-45 transition-transform duration-300" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Assistance */}
            <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="md:col-span-3 rounded-[2rem] bg-sun-500 text-navy-900 p-10 md:p-16 relative overflow-hidden group">
              <div className="absolute inset-0 bg-noise opacity-30"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
                <div className="max-w-xl">
                  <div className="w-16 h-16 rounded-2xl bg-navy-900 text-sun-400 flex items-center justify-center mb-8 shadow-2xl">
                    <Wrench className="w-8 h-8" />
                  </div>
                  <h3 className="font-display text-4xl md:text-5xl font-bold mb-6 leading-tight">Assistance Informatique</h3>
                  <p className="text-navy-900/80 text-xl font-medium leading-relaxed">Ordinateur qui rame, virus, installation, paramétrage... Je me déplace chez vous ou je prends la main à distance pour vous simplifier la vie.</p>
                </div>
                
                <div className="w-full md:w-auto bg-white/20 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                  <ul className="space-y-4">
                    {['Intervention à domicile', 'Nettoyage & Dépannage', 'Formation & Conseils'].map(item => (
                      <li key={item} className="flex items-center gap-4 font-bold text-lg">
                        <div className="w-8 h-8 rounded-full bg-navy-900 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-sun-400" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Processus */}
      <section id="processus" className="py-32 relative text-white bg-navy-900 border-t border-white/5 scroll-mt-28">
        <div className="max-w-[90rem] mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tight">MA <span className="text-outline">MÉTHODOLOGIE.</span></h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mt-6">Un processus simple, clair et humain pour mener à bien votre projet.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: "01", title: "Rencontre & Découverte", desc: "On se rencontre (autour d'un café ou en visio) pour bien comprendre vos besoins, votre histoire, et définir les contours du projet." },
              { num: "02", title: "Conception", desc: "Je passe à la création technique ou graphique. Vous êtes impliqué à chaque étape décisive pour s'assurer qu'on va dans la bonne direction." },
              { num: "03", title: "Lancement & Autonomie", desc: "Mise en ligne, tests finaux et formation pour être autonome. Je reste votre voisin disponible pour toute question ou évolution future." }
            ].map((step, i) => (
              <motion.div key={step.num} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }} className="bg-white/5 border border-white/10 p-10 rounded-[2rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 text-[120px] font-display font-black text-white/[0.03] group-hover:text-sun-500/[0.1] transition-colors">{step.num}</div>
                <h3 className="font-bold text-2xl mb-4 text-sun-400">{step.title}</h3>
                <p className="text-slate-400 leading-relaxed relative z-10">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About (Sticky Scroll Layout) */}
      <section id="apropos" className="py-32 relative text-white bg-navy-800 scroll-mt-28">
        <div className="max-w-[90rem] mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-24 relative">
            
            {/* Sticky Left side */}
            <div className="lg:col-span-5 relative">
              <div className="sticky top-32">
                <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-8">VOTRE<br/>VOISIN<br/><span className="text-leaf-400">DIGITAL.</span></h2>
                <div className="aspect-[4/5] rounded-[2rem] overflow-hidden rotate-[-2deg] hover:rotate-0 transition-transform duration-700 shadow-2xl border border-white/10">
                  <img src={avatarImg} alt="Jordan Schmidt" className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-700" />
                </div>
              </div>
            </div>
            
            {/* Scrolling Right side */}
            <div className="lg:col-span-7 pt-10 lg:pt-32 pb-32">
              <div className="space-y-16">
                <div>
                  <h3 className="font-display text-3xl font-bold mb-6 text-sun-400">Le Numérique au Service de l'Humain</h3>
                  <div className="space-y-6 text-xl text-slate-300 font-light leading-relaxed">
                    <p>Je m'appelle <strong className="text-white font-medium">Jordan Schmidt</strong>, et je suis avant tout un habitant de la vallée. C'est ici, à Saint-Amarin, que j'ai choisi de poser mes valises — et mes compétences.</p>
                    <p>Après des années à naviguer dans le monde du numérique, j'ai voulu créer quelque chose de différent : une agence où l'humain est au centre, où chaque projet est traité avec le soin d'un artisan, et où vous n'avez jamais affaire à un interlocuteur lointain. Mon but est de rendre le web accessible aux commerces, artisans, gîtes et associations de notre vallée, sans les tarifs ni la complexité des grandes agences des villes.</p>
                    <p>Que vous ayez besoin d'un site web pour votre gîte, d'un logo pour votre commerce, ou simplement que votre ordinateur refuse de démarrer — je suis là, à quelques minutes de chez vous. <strong className="text-white font-medium italic">Le digital ne devrait jamais être une source de stress.</strong></p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-10">
                  <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
                    <MapPin className="w-10 h-10 text-leaf-400 mb-6" />
                    <h4 className="font-bold text-2xl mb-4">Proximité</h4>
                    <p className="text-slate-400 leading-relaxed">Un accompagnement de proximité, à 2 pas de chez vous, pour échanger de vive voix autour d'un café.</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
                    <HeartHandshake className="w-10 h-10 text-sun-400 mb-6" />
                    <h4 className="font-bold text-2xl mb-4">Simplicité</h4>
                    <p className="text-slate-400 leading-relaxed">Fini le jargon technique. J'explique, je propose, et je m'assure que vous comprenez tout, de A à Z.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects List with Hover Image Reveal */}
      <section id="realisations" className="py-32 bg-navy-900 border-t border-white/5 scroll-mt-28">
        <div className="max-w-[90rem] mx-auto px-6">
          <div className="mb-20">
            <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-6">SÉLECTION<br/><span className="text-outline">DE PROJETS.</span></h2>
            <p className="text-xl text-slate-400 max-w-xl">Une approche artisanale pour des résultats qui font la différence.</p>
          </div>

          <div className="flex flex-col border-b border-white/10">
            <ProjectItem 
              href="https://latelierdescarlett.fr" 
              title="L'Atelier de Scarlett" 
              tags={['Site Vitrine', 'Sur-mesure']} 
              img={siteAtelierImg} 
              accentColor="sun"
            />
            <ProjectItem 
              href="https://nutala.github.io/boulangerie-marion/" 
              title="Boulangerie Marion" 
              tags={['Site Vitrine', 'Maquette']} 
              img={siteBoulangerieImg} 
              accentColor="leaf"
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="temoignages" className="py-32 bg-navy-900 border-t border-white/5 scroll-mt-28">
        <div className="max-w-[90rem] mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <h2 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 md:mb-0">ILS ME FONT<br/><span className="text-outline">CONFIANCE.</span></h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { text: "Jordan a su comprendre exactement ce dont nous avions besoin pour notre boulangerie. Le site est magnifique et très bien référencé. Un vrai pro, toujours à l'écoute et disponible.", name: "Marc D.", role: "Artisan Boulanger", img: "https://picsum.photos/seed/marc/100/100" },
              { text: "La constante disponibilité de Jordan et ses conseils avisés m'ont permis de refondre l'identité de ma boutique sereinement. C'est rassurant d'avoir quelqu'un de compétent à proximité.", name: "Mélissa S.", role: "Créatrice, L'Atelier de Scarlett", img: "https://picsum.photos/seed/melissa/100/100" }
            ].map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }} className="bg-white/5 border border-white/10 p-10 md:p-12 rounded-[2rem] flex flex-col justify-between hover:bg-white/10 transition-colors">
                <Quote className="w-12 h-12 text-sun-500 mb-8 opacity-50" />
                <p className="text-xl md:text-2xl font-light text-slate-300 leading-relaxed mb-10 italic relative z-10">"{t.text}"</p>
                <div className="flex items-center gap-4 mt-auto">
                  <img src={t.img} alt={t.name} className="w-14 h-14 rounded-full object-cover grayscale" />
                  <div>
                    <h4 className="font-bold text-lg text-white">{t.name}</h4>
                    <p className="text-sun-400 text-sm font-bold uppercase tracking-wider">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 relative flex items-center bg-navy-800 scroll-mt-28">
        <div className="absolute inset-0 bg-sun-500 mix-blend-overlay opacity-5"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-sun-500/20 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/3"></div>

        <div className="max-w-[90rem] mx-auto px-6 w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
            
            {/* Left Col */}
            <div>
              <h2 className="font-display text-[15vw] lg:text-[8vw] font-black leading-none mb-10 text-white">
                LET'S<br/>TALK.
              </h2>
              <div className="space-y-8 text-2xl font-light">
                <p className="text-slate-300 max-w-lg">Parlez-moi de votre projet. Un devis, un conseil ou juste pour se rencontrer, je suis à votre écoute.</p>
                <div className="flex flex-col gap-4 font-bold">
                  <a href="mailto:lagencedescott@gmail.com" className="text-sun-400 hover:text-white transition-colors w-fit group">
                    lagencedescott@gmail.com
                    <span className="block w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                  </a>
                  <a href="tel:+33664821835" className="text-white hover:text-sun-400 transition-colors w-fit">
                    06 64 82 18 35
                  </a>
                  <p className="text-lg text-slate-500 mt-4 flex items-start gap-2">
                    <MapPin className="w-6 h-6 shrink-0" /> 12 rue Jacques Leonhart, 68550 Saint-Amarin
                  </p>
                </div>
              </div>
            </div>

            {/* Right Col / Form */}
            <div className="flex items-center justify-center min-h-[480px] w-full">
              <AnimatePresence mode="wait">
                {!isSubmittedSuccessfully ? (
                  <motion.form 
                    key="contact-form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handleSubmit} 
                    className="w-full space-y-8" 
                    noValidate
                  >
                    <div className="space-y-6">
                      <div className="relative group">
                        <input type="text" id="name" name="name" required className="w-full bg-transparent border-b-2 border-white/20 py-4 text-xl text-white placeholder:text-transparent focus:outline-none focus:border-sun-500 peer transition-colors" placeholder="Nom" onChange={() => setFormErrors(prev => ({...prev, name: ''}))} />
                        <label htmlFor="name" className="absolute left-0 top-4 text-xl text-slate-500 peer-focus:-translate-y-8 peer-focus:text-sm peer-focus:text-sun-500 peer-[:not(:placeholder-shown)]:-translate-y-8 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:text-slate-400 transition-all pointer-events-none font-bold">Votre Nom</label>
                        {formErrors.name && <span className="text-red-500 text-xs mt-1 block text-left">{formErrors.name}</span>}
                      </div>
                      
                      <div className="relative group pt-2">
                        <input type="email" id="email" name="email" required className="w-full bg-transparent border-b-2 border-white/20 py-4 text-xl text-white placeholder:text-transparent focus:outline-none focus:border-sun-500 peer transition-colors" placeholder="Email" onChange={() => setFormErrors(prev => ({...prev, email: ''}))} />
                        <label htmlFor="email" className="absolute left-0 top-6 text-xl text-slate-500 peer-focus:top-0 peer-focus:text-sm peer-focus:text-sun-500 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:text-slate-400 transition-all pointer-events-none font-bold">Email</label>
                        {formErrors.email && <span className="text-red-500 text-xs mt-1 block text-left">{formErrors.email}</span>}
                      </div>
                      
                      <div className="relative group pt-6">
                        <textarea id="message" name="message" required rows={3} className="w-full bg-transparent border-b-2 border-white/20 py-4 text-xl text-white placeholder:text-transparent focus:outline-none focus:border-sun-500 peer transition-colors resize-none" placeholder="Message" onChange={() => setFormErrors(prev => ({...prev, message: ''}))}></textarea>
                        <label htmlFor="message" className="absolute left-0 top-10 text-xl text-slate-500 peer-focus:top-4 peer-focus:text-sm peer-focus:text-sun-500 peer-[:not(:placeholder-shown)]:top-4 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:text-slate-400 transition-all pointer-events-none font-bold">Parlez-moi de votre projet</label>
                        {formErrors.message && <span className="text-red-500 text-xs mt-1 block text-left">{formErrors.message}</span>}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3 pt-2 text-left">
                        <input 
                          type="checkbox" 
                          id="rgpd" 
                          name="rgpd" 
                          required 
                          className="mt-1 w-5 h-5 shrink-0 rounded border-white/20 bg-transparent text-sun-500 focus:ring-sun-500 accent-sun-500 cursor-pointer"
                          onChange={() => setFormErrors(prev => ({...prev, rgpd: ''}))}
                        />
                        <label htmlFor="rgpd" className="text-sm text-slate-400 select-none cursor-pointer">
                          J'accepte que mes données soient traitées conformément aux{' '}
                          <button 
                            type="button" 
                            onClick={onShowMentions} 
                            className="text-sun-400 hover:text-white underline font-bold"
                          >
                            mentions légales
                          </button>{' '}
                          dans le but exclusif de répondre à ma demande.
                        </label>
                      </div>
                      {formErrors.rgpd && <span className="text-red-500 text-xs block text-left mt-1">{formErrors.rgpd}</span>}
                    </div>

                    <div className="pt-4">
                      <button type="submit" disabled={isSubmitting} className="w-full py-6 md:py-8 bg-sun-500 hover:bg-white text-navy-900 font-bold text-2xl uppercase tracking-widest rounded-[2rem] transition-all duration-300 disabled:opacity-50 mt-4">
                        {isSubmitting ? 'ENVOI...' : 'Discuter de mon projet'}
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.div 
                    key="success-message"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-10 md:p-14 text-center flex flex-col items-center justify-center min-h-[480px]"
                  >
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 150, damping: 15, delay: 0.1 }}
                      className="w-20 h-20 rounded-full bg-sun-500 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(202,110,13,0.4)]"
                    >
                      <svg className="w-10 h-10 text-navy-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                        <motion.path 
                          initial={{ pathLength: 0 }} 
                          animate={{ pathLength: 1 }} 
                          transition={{ duration: 0.5, delay: 0.3, ease: "easeInOut" }}
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          d="M5 13l4 4L19 7" 
                        />
                      </svg>
                    </motion.div>
                    
                    <h3 className="font-display text-3xl font-bold text-white mb-6">
                      Message envoyé !
                    </h3>
                    
                    <p className="text-slate-300 text-lg leading-relaxed mb-10 max-w-md">
                      Merci pour votre intérêt. Jordan a bien reçu vos informations et prendra contact avec vous très prochainement pour échanger sur votre projet.
                    </p>
                    
                    <button 
                      onClick={() => setIsSubmittedSuccessfully(false)} 
                      className="px-8 py-4 bg-white/15 hover:bg-white/20 text-white font-bold rounded-full transition-colors border border-white/10"
                    >
                      Envoyer un autre message
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Huge Footer Marquee */}
      <Marquee text={['L\'Agence de Scott', 'Vallée de la Thur']} reverse={true} className="pb-12 pt-12 border-none bg-navy-900 text-white/10" />

      {/* Footer Info */}
      <footer className="py-8 bg-navy-900 border-t border-white/5">
        <div className="max-w-[90rem] mx-auto px-6 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-10 h-10 md:w-14 md:h-14 shrink-0 rounded-full flex items-center justify-center bg-white/10 p-0 overflow-hidden border border-white/20">
              <img src={brandLogo} alt="Logo L'Agence de Scott" className="w-full h-full object-cover scale-[1.2]" />
            </div>
            <p className="text-slate-500 font-medium text-center md:text-left">© {new Date().getFullYear()} L'Agence de Scott.</p>
          </div>
          <div className="text-slate-500 text-sm font-medium text-center">
            Pensé et conçu avec <span className="text-red-500 hover:scale-125 transition-transform inline-block">♥</span> par Jordan Schmidt à Saint-Amarin
          </div>
          <div className="flex gap-8 text-sm font-bold tracking-wider text-slate-400 uppercase">
            <button onClick={onShowMentions} className="hover:text-white transition-colors uppercase font-bold text-sm tracking-wider">Mentions Légales</button>
            <a href="https://www.instagram.com/lagencedescott" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a>
            <a href="https://www.facebook.com/profile.php?id=61590341791637" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Facebook</a>
          </div>
        </div>
      </footer>

      {/* Back to top feature */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 w-10 h-10 bg-[#18181b] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-sun-500 hover:scale-105 transition-all group"
            aria-label="Retour en haut"
          >
            <ChevronUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} className="fixed bottom-24 right-8 sm:bottom-10 sm:right-auto sm:left-10 z-50 bg-white text-navy-900 rounded-2xl px-6 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-4 max-w-sm">
            <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${toastType === 'success' ? 'bg-sun-500' : toastType === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}>
              {toastType === 'success' ? <CheckCircle2 className="w-6 h-6 text-white" /> : <div className="text-white font-bold text-xl">!</div>}
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">Notification</p>
              <p className="text-sm font-medium text-slate-500 mt-0.5 leading-snug">{toastMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const [showMentions, setShowMentions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      <AnimatePresence>
        {isLoading && <Preloader key="preloader" onComplete={() => setIsLoading(false)} />}
      </AnimatePresence>
      
      <MainContent onShowMentions={() => setShowMentions(true)} />
      
      <AnimatePresence>
        {showMentions && (
          <MentionsLegales onClose={() => setShowMentions(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
