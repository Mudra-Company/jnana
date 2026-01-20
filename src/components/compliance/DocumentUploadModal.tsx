/**
 * Document Upload Modal - Confirmation modal for compliance document uploads
 * Allows user to set expiry date, notes, and confirm upload
 */
import React, { useState, useMemo } from 'react';
import { X, Upload, Calendar, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { ComplianceRequirement, calculateExpiryDate } from '../../types/compliance';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: UploadConfirmData) => Promise<void>;
  file: File;
  requirement: ComplianceRequirement;
}

export interface UploadConfirmData {
  file: File;
  validFrom: string;
  validUntil: string | null;
  notes: string;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  file,
  requirement,
}) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate default expiry date based on requirement frequency
  const defaultExpiryDate = useMemo(() => {
    const expiry = calculateExpiryDate(requirement.frequencyMonths);
    return expiry ? expiry.toISOString().split('T')[0] : null;
  }, [requirement.frequencyMonths]);

  const [validFrom, setValidFrom] = useState(today);
  const [validUntil, setValidUntil] = useState(defaultExpiryDate || '');
  const [noExpiry, setNoExpiry] = useState(!requirement.frequencyMonths);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    return '📎';
  };

  const handleSubmit = async () => {
    setError(null);
    
    // Validation
    if (!validFrom) {
      setError('La data di emissione è obbligatoria');
      return;
    }
    
    if (!noExpiry && !validUntil) {
      setError('La data di scadenza è obbligatoria');
      return;
    }

    if (!noExpiry && validUntil && validUntil <= validFrom) {
      setError('La data di scadenza deve essere successiva alla data di emissione');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm({
        file,
        validFrom,
        validUntil: noExpiry ? null : validUntil,
        notes,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il caricamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-200" padding="none">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <Upload className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
              Carica Documento
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Requirement Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
              Obbligo
            </p>
            <p className="font-semibold text-gray-800 dark:text-gray-200">
              {requirement.obligationName}
            </p>
          </div>

          {/* File Info */}
          <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <span className="text-2xl">{getFileIcon(file.type)}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 dark:text-gray-200 truncate">
                {file.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatFileSize(file.size)}
              </p>
            </div>
            <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>

          {/* Date Fields */}
          <div className="grid grid-cols-2 gap-4">
            {/* Valid From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Calendar className="inline h-4 w-4 mr-1.5 text-gray-400" />
                Data Emissione
              </label>
              <input
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Valid Until */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Calendar className="inline h-4 w-4 mr-1.5 text-gray-400" />
                Data Scadenza
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                disabled={noExpiry}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* No Expiry Checkbox */}
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={noExpiry}
              onChange={(e) => setNoExpiry(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            Questo obbligo non ha scadenza (adempimento una tantum)
          </label>

          {/* Frequency hint */}
          {requirement.frequencyMonths && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              💡 Frequenza rinnovo: ogni {requirement.frequencyMonths} mesi
            </p>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              📝 Note (opzionale)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Aggiungi eventuali note..."
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Annulla
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="!bg-emerald-600 hover:!bg-emerald-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Caricamento...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Conferma Upload
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};
