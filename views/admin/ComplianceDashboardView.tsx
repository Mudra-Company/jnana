/**
 * Jnana Compliance Dashboard - Main view for compliance management
 */
import React, { useState } from 'react';
import { Shield, Filter, Search, AlertTriangle, CheckCircle, XCircle, RefreshCw, Settings } from 'lucide-react';
import { useCompliance } from '../../src/hooks/useCompliance';
import { ComplianceProgress } from '../../src/components/compliance/ComplianceProgress';
import { ComplianceCard } from '../../src/components/compliance/ComplianceCard';
import { CCNLSelector } from '../../src/components/compliance/CCNLSelector';
import { TrafficLightStatus, COMPLIANCE_CATEGORIES, ComplianceCategory, CCNL_OPTIONS } from '../../src/types/compliance';
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

  // Show CCNL config if not configured
  const needsConfiguration = !compliance.ccnl.hasConfigured && !compliance.isLoading;

  // Apply filters
  React.useEffect(() => {
    compliance.setFilters({
      status: activeTab === 'all' ? undefined : activeTab,
      category: categoryFilter || undefined,
      search: searchQuery || undefined,
    });
  }, [activeTab, categoryFilter, searchQuery]);

  const handleUpload = async (requirementId: string, file: File) => {
    setUploadingId(requirementId);
    try {
      await compliance.uploadDocument(requirementId, file);
      toast({
        title: 'Documento caricato',
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

  const handleAddCCNL = async (code: string) => {
    try {
      // Always add Universale first if not present
      if (!compliance.ccnl.selections.some(s => s.ccnlCode === 'Universale')) {
        await compliance.ccnl.addCCNL('Universale', true);
      }
      if (code !== 'Universale') {
        await compliance.ccnl.addCCNL(code as any);
      }
      toast({ title: 'CCNL aggiunto', description: 'Il contratto è stato aggiunto con successo.' });
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    }
  };

  const tabs: { id: TabFilter; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'all', label: 'Tutti', icon: <Shield className="h-4 w-4" />, count: compliance.items.length },
    { id: 'red', label: 'Critici', icon: <XCircle className="h-4 w-4" />, count: compliance.riskScore.redCount },
    { id: 'yellow', label: 'In Scadenza', icon: <AlertTriangle className="h-4 w-4" />, count: compliance.riskScore.yellowCount },
    { id: 'green', label: 'OK', icon: <CheckCircle className="h-4 w-4" />, count: compliance.riskScore.greenCount },
  ];

  // Initial configuration screen
  if (needsConfiguration) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Configura la Compliance</h1>
            <p className="text-muted-foreground">
              Seleziona i CCNL applicabili alla tua azienda per visualizzare gli obblighi di legge da monitorare.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-foreground mb-4">Seleziona i tuoi CCNL</h3>
            <div className="space-y-3">
              {CCNL_OPTIONS.map(option => (
                <button
                  key={option.code}
                  onClick={() => handleAddCCNL(option.code)}
                  className="w-full flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left"
                >
                  <div>
                    <p className="font-medium text-foreground">{option.label}</p>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                  {option.code === 'Universale' && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Obbligatorio</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Compliance Dashboard
              </h1>
              {companyName && (
                <p className="text-muted-foreground">{companyName}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => compliance.refetch()}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Aggiorna"
              >
                <RefreshCw className="h-5 w-5 text-muted-foreground" />
              </button>
              <button
                onClick={() => setShowCCNLConfig(!showCCNLConfig)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-lg transition-colors"
              >
                <Settings className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground hidden sm:inline">Configura CCNL</span>
              </button>
            </div>
          </div>

          {/* Risk Score Widget */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <ComplianceProgress riskScore={compliance.riskScore} isLoading={compliance.isLoading} />
            </div>
            
            {/* CCNL Config (collapsible) */}
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
        </div>
      </div>

      {/* Filters & Tabs */}
      <div className="bg-card border-b border-border px-6 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Tabs */}
            <div className="flex gap-1 bg-muted p-1 rounded-lg">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  <span className="text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search & Category Filter */}
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-grow sm:flex-grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cerca obbligo..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value as ComplianceCategory | '')}
                className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Tutte le categorie</option>
                {COMPLIANCE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Items List */}
      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {compliance.isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
                  <div className="h-5 bg-muted rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-2/3 mb-4"></div>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : compliance.filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Nessun obbligo trovato</h3>
              <p className="text-muted-foreground">
                {searchQuery || categoryFilter 
                  ? 'Prova a modificare i filtri di ricerca.'
                  : 'Configura i tuoi CCNL per visualizzare gli obblighi.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {compliance.filteredItems.map(item => (
                <ComplianceCard
                  key={item.requirement.id}
                  item={item}
                  onUpload={(file) => handleUpload(item.requirement.id, file)}
                  onRenew={() => {/* TODO: Open renewal modal */}}
                  onViewDocument={() => item.documentUrl && window.open(item.documentUrl, '_blank')}
                  isUploading={uploadingId === item.requirement.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
