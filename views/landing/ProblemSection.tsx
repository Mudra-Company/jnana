import React from 'react';
import { FileText, Network, Search, TrendingUp, Brain, Users, Target, Zap } from 'lucide-react';

export const ProblemSection: React.FC = () => {
  const comparisons = [
    {
      old: { icon: FileText, text: 'CV statici con elenchi di competenze' },
      new: { icon: Brain, text: 'Profili dinamici basati su test scientifici' },
    },
    {
      old: { icon: Network, text: 'Organigrammi gerarchici rigidi' },
      new: { icon: Users, text: 'Mappe di competenze e culture' },
    },
    {
      old: { icon: Search, text: 'Recruiting basato su keyword' },
      new: { icon: Target, text: 'Matching basato su fit reale' },
    },
    {
      old: { icon: TrendingUp, text: 'Sviluppo carriera a "gradini"' },
      new: { icon: Zap, text: 'Crescita basata su potenziale' },
    },
  ];

  return (
    <section className="py-24 px-4 bg-white dark:bg-gray-800">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-jnana-text dark:text-white mb-4">
            I vecchi metodi non funzionano più
          </h2>
          <p className="text-lg text-jnana-text/60 dark:text-gray-400 max-w-2xl mx-auto">
            Il mondo del lavoro è cambiato. È ora di cambiare il modo in cui valutiamo e valorizziamo le persone.
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Old Way Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-red-500 dark:text-red-400 mb-6 flex items-center gap-2">
              <span className="w-8 h-[2px] bg-red-500 dark:bg-red-400" />
              Il Vecchio Modo
            </h3>
            {comparisons.map((item, index) => (
              <div
                key={`old-${index}`}
                className="group flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:scale-110 transition-transform">
                  <item.old.icon className="w-6 h-6" />
                </div>
                <p className="text-jnana-text/70 dark:text-gray-300 line-through decoration-red-400/50">
                  {item.old.text}
                </p>
              </div>
            ))}
          </div>

          {/* New Way Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-jnana-sage dark:text-jnana-sage mb-6 flex items-center gap-2">
              <span className="w-8 h-[2px] bg-jnana-sage" />
              Il Nuovo Modo (Mudra)
            </h3>
            {comparisons.map((item, index) => (
              <div
                key={`new-${index}`}
                className="group flex items-center gap-4 p-4 bg-gradient-to-r from-jnana-sage/5 to-violet-500/5 dark:from-jnana-sage/10 dark:to-violet-500/10 rounded-xl border border-jnana-sage/20 dark:border-jnana-sage/30 transition-all hover:from-jnana-sage/10 hover:to-violet-500/10 dark:hover:from-jnana-sage/20 dark:hover:to-violet-500/20"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-jnana-sage to-violet-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg">
                  <item.new.icon className="w-6 h-6" />
                </div>
                <p className="text-jnana-text dark:text-white font-medium">
                  {item.new.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
