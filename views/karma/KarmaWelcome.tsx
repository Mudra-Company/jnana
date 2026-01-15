import React, { useState } from 'react';
import { Sparkles, FileUp, PenLine, Clock, ArrowRight, Loader2, Check } from 'lucide-react';
import { Button } from '../../components/Button';
import { CVImportBanner, CVParsedData } from '../../src/components/karma/CVImportBanner';

interface KarmaWelcomeProps {
  userName?: string;
  onChooseCV: () => void;
  onChooseManual: () => void;
  onCVParsed: (data: CVParsedData) => void;
}

export const KarmaWelcome: React.FC<KarmaWelcomeProps> = ({
  userName,
  onChooseCV,
  onChooseManual,
  onCVParsed,
}) => {
  const [showCVUpload, setShowCVUpload] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  const handleCVPreview = (data: CVParsedData) => {
    setIsParsing(false);
    onCVParsed(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-jnana-sage/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-jnana-sage to-jnana-sageDark shadow-lg mb-6">
            <Sparkles size={40} className="text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Benvenuto in Karma{userName ? `, ${userName}` : ''}!
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Costruisci il tuo profilo professionale in pochi minuti e fatti trovare dalle migliori aziende.
          </p>
        </div>

        {/* CV Upload Section (shown when user clicks on CV card) */}
        {showCVUpload ? (
          <div className="max-w-2xl mx-auto">
            <CVImportBanner
              mode="full"
              onPreviewData={handleCVPreview}
              onSkip={() => setShowCVUpload(false)}
            />
            <div className="text-center mt-6">
              <button
                onClick={() => setShowCVUpload(false)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Torna alle opzioni
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Choice Cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Card A: CV Upload - Recommended */}
              <button
                onClick={() => setShowCVUpload(true)}
                className="group relative bg-card border-2 border-jnana-sage rounded-3xl p-8 text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-jnana-sageDark"
              >
                {/* Recommended Badge */}
                <div className="absolute -top-3 left-6 px-4 py-1 bg-jnana-sage text-white text-xs font-semibold rounded-full">
                  ⭐ Consigliato
                </div>

                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-jnana-sage/20 to-jnana-sage/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <FileUp size={28} className="text-jnana-sage" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-1">
                      Veloce con AI
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock size={14} />
                      <span>~2 minuti</span>
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground mb-6">
                  Carica il tuo CV e lascia che l'intelligenza artificiale compili il profilo per te. 
                  Potrai sempre modificare i dati estratti.
                </p>

                <div className="flex items-center text-jnana-sage font-semibold group-hover:gap-3 gap-2 transition-all">
                  <span>Carica CV</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Card B: Manual */}
              <button
                onClick={onChooseManual}
                className="group bg-card border border-border rounded-3xl p-8 text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-muted-foreground/50"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <PenLine size={28} className="text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-1">
                      Compila Manualmente
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock size={14} />
                      <span>~5-10 minuti</span>
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground mb-6">
                  Preferisci inserire i tuoi dati passo dopo passo? Nessun problema, 
                  ti guideremo attraverso ogni sezione del tuo profilo.
                </p>

                <div className="flex items-center text-muted-foreground font-semibold group-hover:gap-3 gap-2 transition-all group-hover:text-foreground">
                  <span>Inizia</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>

            {/* Info Footer */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                🔒 I tuoi dati sono al sicuro. Potrai sempre modificarli o eliminarli in qualsiasi momento.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
