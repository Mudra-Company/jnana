import React from 'react';
import { Sparkles, User, Wrench, FolderOpen, Eye, ArrowRight } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';

interface KarmaSectionProps {
  onCta: () => void;
}

export const KarmaSection: React.FC<KarmaSectionProps> = ({ onCta }) => {
  const features = [
    {
      icon: User,
      title: 'Profilo Completo',
      description: 'Non solo esperienze lavorative. Scopri le tue attitudini con test RIASEC e colloqui AI che raccontano chi sei.',
    },
    {
      icon: Wrench,
      title: 'Hard Skills Verificabili',
      description: 'Catalogo di competenze con livelli di proficiency reali. Mostra cosa sai fare, non solo dove hai lavorato.',
    },
    {
      icon: FolderOpen,
      title: 'Portfolio Integrato',
      description: 'CV, certificati, progetti, link. Tutto in un unico posto, pronto da condividere con un click.',
    },
    {
      icon: Eye,
      title: 'Visibilità ai Recruiter',
      description: 'Le aziende che usano Jnana cercano talenti come te. Matching automatico basato su fit reale, non keyword.',
    },
  ];

  return (
    <section className="py-24 px-4 bg-gradient-to-br from-violet-50 via-white to-violet-100/50 dark:from-gray-900 dark:via-gray-800 dark:to-violet-950/20">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-16">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h2 className="font-brand text-4xl font-bold text-violet-600 dark:text-violet-400">
                KARMA
              </h2>
            </div>
            <p className="text-xl text-jnana-text/70 dark:text-gray-400 max-w-xl">
              Tu non sei un CV. Sei molto di più.<br />
              <span className="text-jnana-text dark:text-white font-medium">Per i Talenti.</span>
            </p>
          </div>
          
          <Button
            onClick={onCta}
            className="mt-6 md:mt-0 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-all hover:scale-105"
          >
            Crea il Tuo Profilo Gratuito
            <ArrowRight className="w-4 h-4 ml-2 inline-block" />
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group p-6 bg-white dark:bg-gray-800 border border-violet-100 dark:border-violet-900/30 hover:border-violet-300 dark:hover:border-violet-700 transition-all hover:shadow-xl"
            >
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:bg-violet-600 group-hover:text-white dark:group-hover:bg-violet-600 transition-all">
                  <feature.icon className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-jnana-text dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-jnana-text/60 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Value Proposition */}
        <div className="mt-12 text-center">
          <p className="text-lg text-jnana-text/60 dark:text-gray-400">
            <span className="text-violet-600 dark:text-violet-400 font-semibold">100%</span> gratuito • 
            <span className="text-violet-600 dark:text-violet-400 font-semibold"> Sempre</span> sotto il tuo controllo • 
            <span className="text-violet-600 dark:text-violet-400 font-semibold">Zero</span> spam
          </p>
        </div>
      </div>
    </section>
  );
};
