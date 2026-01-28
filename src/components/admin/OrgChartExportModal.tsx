import React, { useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { X, Download, FileText, Loader2, Building2, Users } from 'lucide-react';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { 
  OrgChartExportOptions, 
  DEFAULT_EXPORT_OPTIONS, 
  EXPORT_OPTIONS_META 
} from '../../types/orgChartExport';
import { OrgChartPrintView } from './OrgChartPrintView';
import { exportOrgChartToPdf } from '../../services/orgChartExportService';
import type { CompanyProfile, User } from '../../../types';
import { toast } from '../../hooks/use-toast';

interface OrgChartExportModalProps {
  company: CompanyProfile;
  users: User[];
  onClose: () => void;
}

export const OrgChartExportModal: React.FC<OrgChartExportModalProps> = ({
  company,
  users,
  onClose,
}) => {
  const [options, setOptions] = useState<OrgChartExportOptions>(DEFAULT_EXPORT_OPTIONS);
  const [isExporting, setIsExporting] = useState(false);

  const toggleOption = (key: keyof OrgChartExportOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const nodeOptions = EXPORT_OPTIONS_META.filter(o => o.category === 'node');
  const employeeOptions = EXPORT_OPTIONS_META.filter(o => o.category === 'employee');

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Create a hidden container for rendering
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '1600px';
      container.style.backgroundColor = '#ffffff';
      document.body.appendChild(container);

      // Render the print view
      const root = createRoot(container);
      
      await new Promise<void>((resolve) => {
        root.render(
          <OrgChartPrintView
            company={company}
            users={users}
            options={options}
            onRenderComplete={resolve}
          />
        );
      });

      // Wait for fonts, images, and Tree component to fully render
      await new Promise(r => setTimeout(r, 1500));

      // Generate PDF
      await exportOrgChartToPdf(container, company, options);

      // Cleanup
      root.unmount();
      document.body.removeChild(container);

      toast({
        title: 'PDF Esportato',
        description: 'L\'organigramma è stato scaricato con successo',
      });

      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Errore Export',
        description: 'Impossibile generare il PDF. Riprova.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="text-primary" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold dark:text-gray-100">Esporta Organigramma</h3>
              <p className="text-sm text-muted-foreground">Seleziona le informazioni da includere</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isExporting}
          >
            <X className="text-gray-400 hover:text-gray-600" size={20} />
          </button>
        </div>

        {/* Node Level Options */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={16} className="text-primary" />
            <h4 className="font-bold text-gray-700 dark:text-gray-200">Informazioni Nodo</h4>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {nodeOptions.map(opt => (
              <label
                key={opt.key}
                className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  options[opt.key]
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={options[opt.key]}
                  onChange={() => toggleOption(opt.key)}
                  className="mt-0.5 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 dark:text-gray-100 text-sm">
                    {opt.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {opt.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Employee Level Options */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-emerald-600" />
            <h4 className="font-bold text-gray-700 dark:text-gray-200">Informazioni Dipendenti</h4>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {employeeOptions.map(opt => (
              <label
                key={opt.key}
                className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  options[opt.key]
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={options[opt.key]}
                  onChange={() => toggleOption(opt.key)}
                  className="mt-0.5 w-4 h-4 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 dark:text-gray-100 text-sm">
                    {opt.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {opt.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button 
            variant="ghost" 
            onClick={onClose}
            disabled={isExporting}
            className="flex-1"
          >
            Annulla
          </Button>
          <Button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Download size={16} />
                Genera PDF
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};
