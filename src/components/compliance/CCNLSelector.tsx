/**
 * CCNL Selector - Multi-select component for choosing applicable CCNLs
 */
import React, { useState } from 'react';
import { Check, Plus, X, Building2 } from 'lucide-react';
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
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Contratti Collettivi Applicati</h3>
      </div>

      {/* Selected CCNLs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {selections.map(selection => (
          <div
            key={selection.ccnlCode}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm"
          >
            <Check className="h-3.5 w-3.5" />
            <span>{selection.ccnlLabel}</span>
            {selection.ccnlCode !== 'Universale' && (
              <button
                onClick={() => handleRemove(selection.ccnlCode)}
                disabled={isRemoving === selection.ccnlCode}
                className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        
        {selections.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground">
            Nessun CCNL configurato. Aggiungi almeno un contratto collettivo.
          </p>
        )}
      </div>

      {/* Add new CCNL */}
      {availableOptions.length > 0 && (
        <div className="border-t border-border pt-4">
          <p className="text-sm text-muted-foreground mb-3">Aggiungi altri CCNL:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {availableOptions.map(option => (
              <button
                key={option.code}
                onClick={() => handleAdd(option.code)}
                disabled={isAdding === option.code || isLoading}
                className="flex items-center gap-2 p-3 text-left border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50"
              >
                <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{option.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{option.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
