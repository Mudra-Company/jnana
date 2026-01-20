/**
 * CCNL Setup Wizard - Multi-step wizard for initial CCNL configuration
 */
import React, { useState } from 'react';
import { Shield, Check, ArrowRight, ArrowLeft, Building2, Sparkles, FileCheck } from 'lucide-react';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { CCNL_OPTIONS, CCNLCode } from '../../types/compliance';

interface CCNLSetupWizardProps {
  companyName?: string;
  onComplete: (selectedCCNLs: CCNLCode[]) => Promise<void>;
  isLoading?: boolean;
}

export const CCNLSetupWizard: React.FC<CCNLSetupWizardProps> = ({
  companyName,
  onComplete,
  isLoading = false,
}) => {
  const [step, setStep] = useState<'select' | 'confirm'>('select');
  const [selectedCCNLs, setSelectedCCNLs] = useState<Set<CCNLCode>>(new Set(['Universale']));
  const [isConfirming, setIsConfirming] = useState(false);

  const toggleCCNL = (code: CCNLCode) => {
    if (code === 'Universale') return; // Always selected
    
    setSelectedCCNLs(prev => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onComplete(Array.from(selectedCCNLs));
    } finally {
      setIsConfirming(false);
    }
  };

  // Count non-universal selections
  const specificCCNLCount = Array.from(selectedCCNLs).filter(c => c !== 'Universale').length;
  const canProceed = selectedCCNLs.size >= 1; // At minimum Universale

  // Calculate expected obligations (rough estimate)
  const estimatedObligations = selectedCCNLs.size * 8 + 12; // Base + per CCNL

  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6 flex items-center justify-center">
        <div className="max-w-lg w-full">
          <Card className="text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FileCheck className="h-10 w-10 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Riepilogo Configurazione
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Stai per attivare il monitoraggio compliance per {companyName || 'la tua azienda'}
            </p>

            {/* Selected CCNLs */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4 mb-6">
              <p className="text-xs font-bold uppercase text-gray-500 mb-3">CCNL Selezionati</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {Array.from(selectedCCNLs).map(code => {
                  const option = CCNL_OPTIONS.find(o => o.code === code);
                  return (
                    <span
                      key={code}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {option?.label || code}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{selectedCCNLs.size}</span>
                <p className="text-xs text-gray-500 mt-1">Contratti attivi</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">~{estimatedObligations}</span>
                <p className="text-xs text-gray-500 mt-1">Obblighi monitorati</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setStep('select')}
                disabled={isConfirming}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Modifica
              </Button>
              <Button 
                onClick={handleConfirm}
                disabled={isConfirming}
                className="flex-1 !bg-gradient-to-r !from-emerald-500 !to-teal-600 hover:!from-emerald-600 hover:!to-teal-700"
              >
                {isConfirming ? (
                  <>Attivazione...</>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Inizia a Monitorare
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Configura la Compliance
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Seleziona i Contratti Collettivi Nazionali del Lavoro applicabili alla tua azienda per visualizzare gli obblighi da monitorare.
          </p>
        </div>

        {/* CCNL Selection Grid */}
        <Card className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-gray-800 dark:text-gray-200">Seleziona i tuoi CCNL</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Puoi selezionare più CCNL se la tua azienda applica contratti diversi per diverse categorie di lavoratori.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CCNL_OPTIONS.map(option => {
              const isSelected = selectedCCNLs.has(option.code);
              const isUniversale = option.code === 'Universale';
              
              return (
                <button
                  key={option.code}
                  onClick={() => toggleCCNL(option.code)}
                  disabled={isUniversale || isLoading}
                  className={`
                    relative flex items-start gap-4 p-4 text-left rounded-xl border-2 transition-all duration-200
                    ${isSelected 
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600'
                    }
                    ${isUniversale ? 'cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {/* Checkbox */}
                  <div className={`
                    w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors
                    ${isSelected 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600'
                    }
                  `}>
                    {isSelected && <Check className="h-4 w-4" />}
                  </div>

                  {/* Content */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold ${isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300'}`}>
                        {option.label}
                      </p>
                      {isUniversale && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-500 text-white rounded-full">
                          Obbligatorio
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {option.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {specificCCNLCount > 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {selectedCCNLs.size} CCNL selezionati
              </span>
            ) : (
              <span>Seleziona almeno un CCNL specifico (opzionale)</span>
            )}
          </div>
          <Button 
            onClick={() => setStep('confirm')}
            disabled={!canProceed || isLoading}
            className="!bg-gradient-to-r !from-emerald-500 !to-teal-600 hover:!from-emerald-600 hover:!to-teal-700"
          >
            Continua
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};
