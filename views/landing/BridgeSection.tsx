import React from 'react';
import { Building, Sparkles, ArrowRight, Heart, Target, Users } from 'lucide-react';

export const BridgeSection: React.FC = () => {
  return (
    <section className="py-24 px-4 bg-gradient-to-r from-jnana-sage via-jnana-sageDark to-violet-700 dark:from-jnana-sageDark dark:via-gray-800 dark:to-violet-900">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
            Due mondi, un ecosistema
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Quando Jnana e Karma si incontrano, nasce il match perfetto.
          </p>
        </div>

        {/* Visual Bridge */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-[2px] bg-white/30 -translate-y-1/2" />
          <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white items-center justify-center z-10 shadow-2xl">
            <Heart className="w-8 h-8 text-violet-600" />
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-center">
            {/* Jnana Side */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/20 flex items-center justify-center">
                <Building className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-brand text-2xl font-bold text-white mb-2">JNANA</h3>
              <p className="text-white/70 mb-4">Aziende</p>
              <ul className="text-left text-white/80 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-white/60" />
                  Cerca competenze specifiche
                </li>
                <li className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-white/60" />
                  Definisce cultura aziendale
                </li>
              </ul>
            </div>

            {/* Match Description - Mobile */}
            <div className="md:hidden flex justify-center">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-xl">
                <Heart className="w-8 h-8 text-violet-600" />
              </div>
            </div>

            {/* Center Match Info - Desktop */}
            <div className="hidden md:block text-center px-8">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h4 className="font-bold text-white mb-3">Match Intelligente</h4>
                <p className="text-white/70 text-sm leading-relaxed">
                  Non cerchiamo keyword.<br />
                  Cerchiamo fit culturale, competenze reali, valori allineati.
                </p>
              </div>
            </div>

            {/* Karma Side */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/20 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-brand text-2xl font-bold text-white mb-2">KARMA</h3>
              <p className="text-white/70 mb-4">Talenti</p>
              <ul className="text-left text-white/80 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-white/60" />
                  Crea profilo completo
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-white/60" />
                  Scopre opportunità perfette
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Quote */}
        <div className="mt-16 text-center">
          <blockquote className="text-xl text-white/90 italic max-w-3xl mx-auto leading-relaxed">
            "Quando un'azienda cerca un profilo su Jnana, non cerca keyword.<br />
            Cerca competenze reali, soft skills verificate, fit culturale.<br />
            E trova profili Karma che hanno scelto di valorizzarsi davvero."
          </blockquote>
        </div>
      </div>
    </section>
  );
};
