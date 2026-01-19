/**
 * Compliance Card - Individual obligation row with traffic light status
 */
import React, { useRef } from 'react';
import { Upload, FileText, RefreshCw, MoreVertical, Calendar, AlertCircle } from 'lucide-react';
import { ComplianceItem, formatExpiryStatus } from '../../types/compliance';

interface ComplianceCardProps {
  item: ComplianceItem;
  onUpload: (file: File) => void;
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
  
  const { requirement, trafficLight, status, documentUrl, documentName } = item;

  const getTrafficLightColor = () => {
    switch (trafficLight) {
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      case 'red': return 'bg-red-500';
    }
  };

  const getTrafficLightBorder = () => {
    switch (trafficLight) {
      case 'green': return 'border-l-green-500';
      case 'yellow': return 'border-l-yellow-500';
      case 'red': return 'border-l-red-500';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const expiryStatus = formatExpiryStatus(item.validUntil, status);
  const hasDocument = !!documentUrl;

  return (
    <div className={`bg-card border border-border rounded-lg p-4 border-l-4 ${getTrafficLightBorder()} hover:shadow-md transition-shadow`}>
      <div className="flex items-start gap-4">
        {/* Traffic Light Indicator */}
        <div className="flex-shrink-0 mt-1">
          <div className={`w-3 h-3 rounded-full ${getTrafficLightColor()} shadow-sm`} />
        </div>

        {/* Content */}
        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-medium text-foreground line-clamp-1">
                {requirement.obligationName}
              </h4>
              <p className="text-sm text-muted-foreground mt-0.5">
                {requirement.category} • {requirement.frequency}
              </p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground whitespace-nowrap">
              {requirement.ccnlScope}
            </span>
          </div>

          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {requirement.description}
          </p>

          {/* Status & Actions Row */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2 text-sm">
              {trafficLight === 'red' && <AlertCircle className="h-4 w-4 text-red-500" />}
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className={trafficLight === 'red' ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
                {expiryStatus}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {hasDocument && (
                <button
                  onClick={onViewDocument}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-md transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Documento</span>
                </button>
              )}

              {hasDocument && status !== 'missing' && (
                <button
                  onClick={onRenew}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted rounded-md transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline">Rinnova</span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                <span>{isUploading ? 'Caricamento...' : 'Upload'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
