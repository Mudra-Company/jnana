import React from 'react';
import { Building, Sparkles, Linkedin, Twitter, Mail } from 'lucide-react';
import { Button } from '../../components/Button';

interface FooterSectionProps {
  onSelectJnana: () => void;
  onSelectKarma: () => void;
}

export const FooterSection: React.FC<FooterSectionProps> = ({ onSelectJnana, onSelectKarma }) => {
  return (
    <footer className="bg-jnana-text dark:bg-gray-950 text-white">
      {/* Final CTA */}
      <div className="py-16 px-4 border-b border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
            Pronto a cambiare il modo in cui valorizzi il capitale umano?
          </h2>
          <p className="text-white/70 mb-8 text-lg">
            Inizia oggi. È gratis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={onSelectJnana}
              className="px-8 py-4 bg-jnana-sage hover:bg-jnana-sageDark text-white rounded-xl font-medium transition-all hover:scale-105"
            >
              <Building className="w-5 h-5 mr-2 inline-block" />
              Prova Jnana
              <span className="text-sm opacity-70 ml-1">(Aziende)</span>
            </Button>
            <Button
              onClick={onSelectKarma}
              className="px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-all hover:scale-105"
            >
              <Sparkles className="w-5 h-5 mr-2 inline-block" />
              Crea Profilo Karma
              <span className="text-sm opacity-70 ml-1">(Talenti)</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer Links */}
      <div className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <h3 className="font-brand text-2xl font-bold mb-4">
                <span className="bg-gradient-to-r from-jnana-sage to-violet-400 bg-clip-text text-transparent">
                  MUDRA
                </span>
              </h3>
              <p className="text-white/60 max-w-sm mb-4">
                People Analytics Platform.<br />
                Il nuovo modo di valorizzare il capitale umano.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-white/40 hover:text-white transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="text-white/40 hover:text-white transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="mailto:info@mudra.io" className="text-white/40 hover:text-white transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-bold text-white/80 mb-4">Prodotti</h4>
              <ul className="space-y-2 text-white/50">
                <li><a href="#" className="hover:text-white transition-colors">Jnana per Aziende</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Karma per Talenti</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white/80 mb-4">Azienda</h4>
              <ul className="space-y-2 text-white/50">
                <li><a href="#" className="hover:text-white transition-colors">Chi Siamo</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Termini di Servizio</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contatti</a></li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-8 border-t border-white/10 text-center text-white/40 text-sm">
            © {new Date().getFullYear()} Mudra People Analytics. Tutti i diritti riservati.
          </div>
        </div>
      </div>
    </footer>
  );
};
