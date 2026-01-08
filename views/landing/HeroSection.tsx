import React from 'react';
import { Building, Sparkles, ArrowDown } from 'lucide-react';
import { Button } from '../../components/Button';

interface HeroSectionProps {
  onSelectJnana: () => void;
  onSelectKarma: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onSelectJnana, onSelectKarma }) => {
  const scrollToJnana = () => {
    document.getElementById('jnana-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToKarma = () => {
    document.getElementById('karma-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToContent = () => {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-jnana-sage/10 via-jnana-bg to-violet-100/30 dark:from-gray-900 dark:via-gray-800 dark:to-violet-950/30" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-jnana-sage/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-jnana-sage/5 to-violet-500/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Logo */}
        <h1 className="font-brand text-6xl md:text-8xl font-bold tracking-tight mb-4">
          <span className="bg-gradient-to-r from-jnana-sage to-violet-600 bg-clip-text text-transparent">
            MUDRA
          </span>
        </h1>
        
        {/* Tagline */}
        <p className="text-xl md:text-2xl text-jnana-text/70 dark:text-gray-400 mb-8 font-heading">
          Il nuovo modo di valorizzare il capitale umano
        </p>
        
        {/* Main Copy */}
        <p className="text-lg md:text-xl text-jnana-text/60 dark:text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed">
          Le persone non sono risorse. Sono talenti da scoprire.<br />
          Le aziende non sono strutture. Sono ecosistemi da coltivare.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={scrollToJnana}
            className="group relative px-8 py-4 bg-jnana-sage hover:bg-jnana-sageDark text-white rounded-xl text-lg font-medium transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Building className="w-5 h-5 mr-2 inline-block" />
            Scopri Jnana
            <span className="block text-sm font-normal opacity-80">Per le Aziende</span>
          </Button>
          
          <Button
            onClick={scrollToKarma}
            className="group relative px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-lg font-medium transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Sparkles className="w-5 h-5 mr-2 inline-block" />
            Scopri Karma
            <span className="block text-sm font-normal opacity-80">Per i Talenti</span>
          </Button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <button
        onClick={scrollToContent}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-jnana-text/40 dark:text-gray-600 hover:text-jnana-text/60 dark:hover:text-gray-400 transition-colors animate-bounce"
      >
        <ArrowDown className="w-6 h-6" />
      </button>
    </section>
  );
};
