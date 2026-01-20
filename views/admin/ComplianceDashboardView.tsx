/**
 * Jnana Compliance Dashboard - Redesigned main view for compliance management
 */
import React, { useState } from 'react';
import { Shield, Search, AlertTriangle, CheckCircle, XCircle, RefreshCw, Settings, Filter } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { useCompliance } from '../../src/hooks/useCompliance';
import { ComplianceProgress } from '../../src/components/compliance/ComplianceProgress';
import { ComplianceCard } from '../../src/components/compliance/ComplianceCard';
import { CCNLSelector } from '../../src/components/compliance/CCNLSelector';
import { CCNLSetupWizard } from '../../src/components/compliance/CCNLSetupWizard';
import { TrafficLightStatus, COMPLIANCE_CATEGORIES, ComplianceCategory, CCNLCode } from '../../src/types/compliance';
import { useToast } from '../../src/hooks/use-toast';

interface ComplianceDashboardViewProps {
  companyId: string;
  companyName?: string;
}

type TabFilter = 'all' | TrafficLightStatus;

export const ComplianceDashboardView: React.FC<ComplianceDashboardViewProps> = ({ 
  companyId,
  companyName 
}) => {
  const { toast } = useToast();
  const compliance = useCompliance(companyId);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [showCCNLConfig, setShowCCNLConfig] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ComplianceCategory | ''>('');
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // Show CCNL wizard if not configured
  const needsConfiguration = !compliance.ccnl.hasConfigured && !compliance.isLoading;

  // Apply filters
  React.useEffect(() => {
    compliance.setFilters({
      status: activeTab === 'all' ? undefined : activeTab,
      category: categoryFilter || undefined,
      search: searchQuery || undefined,
    });
  }, [activeTab, categoryFilter, searchQuery]);

  const handleUpload = async (
    requirementId: string, 
    file: File, 
    options?: { validFrom?: string; validUntil?: string | null; notes?: string }
  ) => {
    setUploadingId(requirementId);
    try {
      await compliance.uploadDocument(requirementId, file, options);
      toast({
        title: 'Documento caricato ✓',
        description: 'Il documento è stato caricato con successo.',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Errore',
        description: 'Si è verificato un errore durante il caricamento.',
        variant: 'destructive',
      });
    } finally {
      setUploadingId(null);
    }
  };

  const handleWizardComplete = async (selectedCCNLs: CCNLCode[]) => {
    try {
      // Add Universale first as primary
      await compliance.ccnl.addCCNL('Universale', true);
      
      // Add the rest
      for (const code of selectedCCNLs) {
        if (code !== 'Universale') {
          await compliance.ccnl.addCCNL(code);
        }
      }
      
      toast({ 
        title: 'Configurazione completata! 🎉', 
        description: `${selectedCCNLs.length} CCNL configurati con successo.` 
      });
    } catch (error: any) {
      toast({ 
        title: 'Errore', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  };

  const tabs: { id: TabFilter; label: string; icon: React.ReactNode; count: number; color: string }[] = [
    { id: 'all', label: 'Tutti', icon: <Shield className="h-4 w-4" />, count: compliance.items.length, color: '' },
    { id: 'red', label: 'Critici', icon: <XCircle className="h-4 w-4" />, count: compliance.riskScore.redCount, color: 'text-red-600' },
    { id: 'yellow', label: 'In Scadenza', icon: <AlertTriangle className="h-4 w-4" />, count: compliance.riskScore.yellowCount, color: 'text-amber-600' },
    { id: 'green', label: 'OK', icon: <CheckCircle className="h-4 w-4" />, count: compliance.riskScore.greenCount, color: 'text-green-600' },
  ];

  // Show setup wizard if not configured
  if (needsConfiguration) {
    return (
      <CCNLSetupWizard
        companyName={companyName}
        onComplete={handleWizardComplete}
        isLoading={compliance.ccnl.isLoading}
      />
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white">
              <Shield className="h-6 w-6" />
            </div>
            Compliance Dashboard
          </h1>
          {companyName && (
            <p className="text-gray-600 dark:text-gray-400">
              Monitora gli obblighi di legge per {companyName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => compliance.refetch()}
            className="!text-gray-600 dark:!text-gray-400"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Aggiorna
          </Button>
          <Button
            variant={showCCNLConfig ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setShowCCNLConfig(!showCCNLConfig)}
            className={showCCNLConfig ? '!bg-emerald-600' : '!text-gray-600 dark:!text-gray-400'}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configura CCNL
          </Button>
        </div>
      </div>

      {/* Risk Score + CCNL Config Row */}
      <div className={`grid gap-6 ${showCCNLConfig ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
        <div className={showCCNLConfig ? 'lg:col-span-1' : 'max-w-md'}>
          <ComplianceProgress 
            riskScore={compliance.riskScore} 
            companyName={companyName}
            isLoading={compliance.isLoading} 
          />
        </div>
        
        {showCCNLConfig && (
          <div className="lg:col-span-2">
            <CCNLSelector
              selections={compliance.ccnl.selections}
              onAdd={compliance.ccnl.addCCNL}
              onRemove={compliance.ccnl.removeCCNL}
              isLoading={compliance.ccnl.isLoading}
            />
          </div>
        )}
      </div>

      {/* Obligations Section */}
      <div>
        {/* Section Header with border */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
            Elenco Obblighi
          </h2>
        </div>

        {/* Filters Card */}
        <Card className="mb-6" padding="md">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Quick Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all
                    ${activeTab === tab.id
                      ? tab.id === 'red' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' 
                      : tab.id === 'yellow' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                      : tab.id === 'green' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  <span className={`
                    text-xs px-1.5 py-0.5 rounded-full ml-0.5
                    ${activeTab === tab.id
                      ? 'bg-white/50 dark:bg-black/20'
                      : 'bg-gray-200 dark:bg-gray-700'
                    }
                  `}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search & Category */}
            <div className="flex gap-2 w-full lg:w-auto">
              <div className="relative flex-grow lg:flex-grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cerca obbligo..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full lg:w-56 pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:text-white"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value as ComplianceCategory | '')}
                  className="pl-10 pr-8 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer dark:text-white"
                >
                  <option value="">Tutte le categorie</option>
                  {COMPLIANCE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Compliance Items List */}
        {compliance.isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                  <div className="flex-grow">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : compliance.filteredItems.length === 0 ? (
          <Card className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Nessun obbligo trovato</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              {searchQuery || categoryFilter 
                ? 'Prova a modificare i filtri di ricerca per visualizzare altri obblighi.'
                : 'Configura i tuoi CCNL per visualizzare gli obblighi da monitorare.'}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {compliance.filteredItems.map(item => (
              <ComplianceCard
                key={item.requirement.id}
                item={item}
                onUpload={(file, options) => handleUpload(item.requirement.id, file, options)}
                onRenew={() => {/* TODO: Open renewal modal */}}
                onViewDocument={() => item.documentUrl && window.open(item.documentUrl, '_blank')}
                isUploading={uploadingId === item.requirement.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
