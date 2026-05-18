import React, { useEffect } from 'react';
import { motion } from 'motion/react';

interface Props {
  onComplete: () => void;
}

export default function Preloader({ onComplete }: Props) {
  useEffect(() => {
    // Bloque le scroll pendant le chargement
    document.body.style.overflow = 'hidden';
    
    const timer = setTimeout(() => {
      onComplete();
      document.body.style.overflow = 'auto';
    }, 2000);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = 'auto';
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ y: '-100%', opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-900 pointer-events-none"
    >
      <div className="flex flex-col items-center">
        <div className="overflow-hidden pb-4">
          <motion.div 
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1], delay: 0.2 }}
            className="text-center font-display font-black tracking-tighter leading-none"
          >
            <span className="block text-4xl mb-1 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">L'AGENCE</span>
            <span className="block text-5xl md:text-6xl text-sun-500">DE SCOTT</span>
          </motion.div>
        </div>
        
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden mt-6">
          <motion.div 
            className="h-full bg-sun-500 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
          />
        </div>
      </div>
    </motion.div>
  );
}
