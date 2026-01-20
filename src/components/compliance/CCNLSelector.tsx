/**
 * CCNL Selector - Premium styled multi-select for managing active CCNLs
 */
import React, { useState } from 'react';
import { Check, Plus, X, Building2, Loader2 } from 'lucide-react';
import { Card } from '../../../components/Card';
import { CCNL_OPTIONS, CCNLCode, CompanyCCNLSelection } from '../../types/compliance';

interface CCNLSelectorProps {
  selections: CompanyCCNLSelection[];
  onAdd: (code: CCNLCode) => Promise<void>;
  onRemove: (code: CCNLCode) => Promise<void>;
  isLoading?: boolean;
}

export const CCNLSelector: React.FC<CCNLSelectorProps> = ({
  selections,
  onAdd,
  onRemove,
  isLoading = false,
}) => {
  const [isAdding, setIsAdding] = useState<CCNLCode | null>(null);
  const [isRemoving, setIsRemoving] = useState<CCNLCode | null>(null);

  const selectedCodes = new Set(selections.map(s => s.ccnlCode));
  const availableOptions = CCNL_OPTIONS.filter(o => !selectedCodes.has(o.code));

  const handleAdd = async (code: CCNLCode) => {
    setIsAdding(code);
    try {
      await onAdd(code);
    } finally {
      setIsAdding(null);
    }
  };

  const handleRemove = async (code: CCNLCode) => {
    if (code === 'Universale') return;
    setIsRemoving(code);
    try {
      await onRemove(code);
    } finally {
      setIsRemoving(null);
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
          <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h3 className="font-bold text-gray-800 dark:text-gray-200">Contratti Collettivi Applicati</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gestisci i CCNL della tua azienda</p>
        </div>
      </div>

      {/* Selected CCNLs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {selections.map(selection => (
          <div
            key={selection.ccnlCode}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-sm font-medium"
          >
            <Check className="h-4 w-4" />
            <span>{selection.ccnlLabel}</span>
            {selection.ccnlCode !== 'Universale' && (
              <button
                onClick={() => handleRemove(selection.ccnlCode)}
                disabled={isRemoving === selection.ccnlCode}
                className="ml-1 p-0.5 hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded-full transition-colors disabled:opacity-50"
              >
                {isRemoving === selection.ccnlCode ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
              </button>
            )}
            {selection.ccnlCode === 'Universale' && (
              <span className="text-[10px] ml-1 opacity-70">(base)</span>
            )}
          </div>
        ))}
        
        {selections.length === 0 && !isLoading && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nessun CCNL configurato. Aggiungi almeno un contratto collettivo.
          </p>
        )}
      </div>

      {/* Add new CCNL */}
      {availableOptions.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
          <p className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-3 tracking-wide">
            Aggiungi altri CCNL
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {availableOptions.map(option => (
              <button
                key={option.code}
                onClick={() => handleAdd(option.code)}
                disabled={isAdding === option.code || isLoading}
                className="flex items-center gap-3 p-3 text-left border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all disabled:opacity-50"
              >
                {isAdding === option.code ? (
                  <Loader2 className="h-4 w-4 text-emerald-600 animate-spin flex-shrink-0" />
                ) : (
                  <Plus className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{option.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{option.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
