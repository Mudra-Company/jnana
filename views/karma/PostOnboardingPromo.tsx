import React, { useState } from 'react';
import { Sparkles, Brain, Target, Clock, ArrowRight, Check } from 'lucide-react';
import { Button } from '../../components/Button';

interface PostOnboardingPromoProps {
  onStartRiasec: () => void;
  onSkip: () => void;
}

export const PostOnboardingPromo: React.FC<PostOnboardingPromoProps> = ({
  onStartRiasec,
  onSkip,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-jnana-sage/5 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl text-center">
        {/* Success Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium mb-8">
          <Check size={16} />
          Profilo creato con successo!
        </div>

        {/* Header */}
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Completa il tuo profilo con i test psicoattitudinali
        </h1>
        <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
          Scopri le tue inclinazioni professionali e aumenta le possibilità di trovare il lavoro perfetto per te.
        </p>

        {/* Test Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* RIASEC Test */}
          <div className="bg-card border rounded-2xl p-6 text-left">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center flex-shrink-0">
                <Target size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Test RIASEC</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock size={14} />
                  <span>~5 minuti</span>
                </div>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              Identifica i tuoi interessi professionali e scopri quali carriere sono più adatte al tuo profilo.
            </p>
          </div>

          {/* Karma AI Test */}
          <div className="bg-card border rounded-2xl p-6 text-left">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center flex-shrink-0">
                <Brain size={24} className="text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Karma AI</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock size={14} />
                  <span>~10 minuti</span>
                </div>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              Un'intervista AI per valutare le tue soft skills, i tuoi valori e il livello di seniority.
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" onClick={onStartRiasec}>
            <Sparkles size={18} className="mr-2" />
            Inizia Test RIASEC
            <ArrowRight size={18} className="ml-2" />
          </Button>
          <Button variant="ghost" onClick={onSkip}>
            Lo farò dopo
          </Button>
        </div>

        {/* Info */}
        <p className="text-sm text-muted-foreground mt-8">
          💡 I recruiter preferiscono candidati con profili completi. I test aumentano la tua visibilità del 40%!
        </p>
      </div>
    </div>
  );
};
