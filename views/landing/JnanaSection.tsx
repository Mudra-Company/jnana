import React from 'react';
import { Building, Brain, Network, MessageSquare, Thermometer, ArrowRight } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';

interface JnanaSectionProps {
  onCta: () => void;
}

export const JnanaSection: React.FC<JnanaSectionProps> = ({ onCta }) => {
  const features = [
    {
      icon: Brain,
      title: 'Identity Hub',
      description: 'Mappa le competenze reali del tuo team con test RIASEC scientificamente validati. Scopri attitudini e potenziale nascosto.',
    },
    {
      icon: Network,
      title: 'Organigramma Intelligente',
      description: 'Visualizza non solo chi riporta a chi, ma quali competenze sono dove. Identifica gap e opportunità di crescita.',
    },
    {
      icon: MessageSquare,
      title: 'Karma AI Interview',
      description: 'Colloqui AI che estraggono soft skills, valori e fattori di rischio. Vai oltre il CV, scopri la persona.',
    },
    {
      icon: Thermometer,
      title: 'Climate Survey',
      description: 'Misura il clima aziendale e identifica i Cultural Drivers. Previeni il turnover, costruisci engagement.',
    },
  ];

  return (
    <section className="py-24 px-4 bg-gradient-to-br from-jnana-sage/5 via-jnana-bg to-jnana-powder/20 dark:from-gray-900 dark:via-gray-800 dark:to-jnana-sage/10">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-16">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-jnana-sage flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <h2 className="font-brand text-4xl font-bold text-jnana-sage">
                JNANA
              </h2>
            </div>
            <p className="text-xl text-jnana-text/70 dark:text-gray-400 max-w-xl">
              Comprendi chi sono davvero le tue persone.<br />
              <span className="text-jnana-text dark:text-white font-medium">Per le Aziende.</span>
            </p>
          </div>
          
          <Button
            onClick={onCta}
            className="mt-6 md:mt-0 px-6 py-3 bg-jnana-sage hover:bg-jnana-sageDark text-white rounded-xl font-medium transition-all hover:scale-105"
          >
            Inizia la Demo Gratuita
            <ArrowRight className="w-4 h-4 ml-2 inline-block" />
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group p-6 bg-white dark:bg-gray-800 border border-jnana-sage/10 dark:border-jnana-sage/20 hover:border-jnana-sage/30 dark:hover:border-jnana-sage/40 transition-all hover:shadow-xl"
            >
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-xl bg-jnana-sage/10 dark:bg-jnana-sage/20 flex items-center justify-center text-jnana-sage group-hover:bg-jnana-sage group-hover:text-white transition-all">
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
            <span className="text-jnana-sage font-semibold">+40%</span> di engagement • 
            <span className="text-jnana-sage font-semibold"> -35%</span> di turnover • 
            <span className="text-jnana-sage font-semibold"> 3x</span> faster hiring
          </p>
        </div>
      </div>
    </section>
  );
};
