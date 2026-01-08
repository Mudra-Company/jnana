import React, { useState, useEffect } from 'react';
import { Building, Sparkles } from 'lucide-react';
import { Button } from '../../components/Button';

interface LandingHeaderProps {
  onLoginJnana: () => void;
  onLoginKarma: () => void;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({ onLoginJnana, onLoginKarma }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show header after scrolling past hero section (80vh)
      setIsScrolled(window.scrollY > window.innerHeight * 0.8);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg' 
          : 'bg-transparent pointer-events-none'
      }`}
    >
      <div className={`max-w-6xl mx-auto px-4 py-3 flex justify-between items-center transition-opacity duration-300 ${
        isScrolled ? 'opacity-100 pointer-events-auto' : 'opacity-0'
      }`}>
        {/* Logo */}
        <h1 className="font-brand text-2xl font-bold">
          <span className="bg-gradient-to-r from-jnana-sage to-violet-600 bg-clip-text text-transparent">
            MUDRA
          </span>
        </h1>

        {/* Login Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onLoginJnana}
            className="px-4 py-2 bg-jnana-sage hover:bg-jnana-sageDark text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
          >
            <Building className="w-4 h-4" />
            Accedi JNANA
          </Button>
          
          <Button
            onClick={onLoginKarma}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Accedi KARMA
          </Button>
        </div>
      </div>
    </header>
  );
};
