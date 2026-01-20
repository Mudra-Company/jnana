/**
 * Compliance Card - Premium styled obligation row with traffic light status
 */
import React, { useRef, useState } from 'react';
import { Upload, FileText, RefreshCw, Calendar, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { ComplianceItem, formatExpiryStatus } from '../../types/compliance';
import { DocumentUploadModal, UploadConfirmData } from './DocumentUploadModal';

interface ComplianceCardProps {
  item: ComplianceItem;
  onUpload: (file: File, options?: { validFrom?: string; validUntil?: string | null; notes?: string }) => Promise<void>;
  onRenew: () => void;
  onViewDocument?: () => void;
  isUploading?: boolean;
}

export const ComplianceCard: React.FC<ComplianceCardProps> = ({
  item,
  onUpload,
  onRenew,
  onViewDocument,
  isUploading = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { requirement, trafficLight, status, documentUrl } = item;

  const getStatusConfig = () => {
    switch (trafficLight) {
      case 'green': 
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          iconColor: 'text-green-600 dark:text-green-400',
          badgeBg: 'bg-green-100 dark:bg-green-900/30',
          badgeText: 'text-green-700 dark:text-green-300',
          label: 'OK'
        };
      case 'yellow': 
        return {
          icon: Clock,
          bgColor: 'bg-amber-100 dark:bg-amber-900/30',
          iconColor: 'text-amber-600 dark:text-amber-400',
          badgeBg: 'bg-amber-100 dark:bg-amber-900/30',
          badgeText: 'text-amber-700 dark:text-amber-300',
          label: 'In Scadenza'
        };
      case 'red': 
        return {
          icon: AlertCircle,
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          iconColor: 'text-red-600 dark:text-red-400',
          badgeBg: 'bg-red-100 dark:bg-red-900/30',
          badgeText: 'text-red-700 dark:text-red-300',
          label: 'Critico'
        };
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      setIsModalOpen(true);
    }
    // Reset input to allow selecting the same file again
    e.target.value = '';
  };

  const handleConfirmUpload = async (data: UploadConfirmData) => {
    await onUpload(data.file, {
      validFrom: data.validFrom,
      validUntil: data.validUntil,
      notes: data.notes,
    });
    setPendingFile(null);
    setIsModalOpen(false);
  };

  const handleModalClose = () => {
    setPendingFile(null);
    setIsModalOpen(false);
  };

  const expiryStatus = formatExpiryStatus(item.validUntil, status);
  const hasDocument = !!documentUrl;
  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <Card className="hover:shadow-lg transition-all duration-300" padding="md">
      <div className="flex items-start gap-4">
        {/* Status Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bgColor}`}>
          <StatusIcon className={`h-6 w-6 ${config.iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-grow min-w-0">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-grow min-w-0">
              <h4 className="font-bold text-gray-800 dark:text-gray-200 line-clamp-1">
                {requirement.obligationName}
              </h4>
              <div className="flex items-center flex-wrap gap-2 mt-1.5">
                <span className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg font-medium">
                  {requirement.category}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {requirement.frequency}
                </span>
              </div>
            </div>
            <span className="text-xs font-bold uppercase px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg whitespace-nowrap">
              {requirement.ccnlScope}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {requirement.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
            {/* Expiry Status */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className={`text-sm font-medium ${
                trafficLight === 'red' 
                  ? 'text-red-600 dark:text-red-400' 
                  : trafficLight === 'yellow'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {expiryStatus}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {hasDocument && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onViewDocument}
                  className="!text-gray-600 dark:!text-gray-400"
                >
                  <FileText className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">Documento</span>
                </Button>
              )}

              {hasDocument && status !== 'missing' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRenew}
                  className="!text-gray-600 dark:!text-gray-400"
                >
                  <RefreshCw className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">Rinnova</span>
                </Button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="!bg-emerald-600 hover:!bg-emerald-700"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    <span className="hidden sm:inline">Caricamento...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-1.5" />
                    <span>Upload</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Confirmation Modal */}
      {pendingFile && (
        <DocumentUploadModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onConfirm={handleConfirmUpload}
          file={pendingFile}
          requirement={requirement}
        />
      )}
    </Card>
  );
};
