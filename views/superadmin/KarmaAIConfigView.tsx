import React, { useState, useEffect } from 'react';
import { Bot, FileText, History, Settings, Upload, Trash2, CheckCircle, XCircle, Save, RefreshCw, Eye, ToggleLeft, ToggleRight, Layers, Clock, FileCheck } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { useKarmaBotConfig, BotType, KarmaBotConfig, BotObjective, ProfileInputs } from '../../src/hooks/useKarmaBotConfig';

interface KarmaAIConfigViewProps {
  onBack: () => void;
}

const BOT_TABS: { id: BotType; label: string; description: string }[] = [
  { id: 'karma_talents', label: 'Karma Talents (B2C)', description: 'Colloqui per candidati esterni' },
  { id: 'jnana', label: 'Jnana (B2B)', description: 'Colloqui per dipendenti aziendali' },
];

const PROFILE_INPUT_LABELS: Record<keyof ProfileInputs, string> = {
  riasec_score: 'Punteggio RIASEC',
  experiences: 'Esperienze lavorative',
  education: 'Formazione',
  hard_skills: 'Competenze tecniche',
  bio: 'Bio',
  headline: 'Headline',
  portfolio: 'Portfolio',
  certifications: 'Certificazioni',
  languages: 'Lingue',
  company_context: 'Contesto aziendale',
};

const AVAILABLE_MODELS = [
  { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (Veloce)' },
  { id: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro (Avanzato)' },
  { id: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash Preview' },
  { id: 'openai/gpt-5-mini', label: 'GPT-5 Mini' },
];

const TEMPLATE_VARIABLES = [
  '{{firstName}}', '{{lastName}}', '{{profileCode}}', '{{headline}}', 
  '{{bio}}', '{{experiences}}', '{{education}}', '{{skills}}', 
  '{{jobTitle}}', '{{companyContext}}'
];

export default function KarmaAIConfigView({ onBack }: KarmaAIConfigViewProps) {
  const [activeBotType, setActiveBotType] = useState<BotType>('karma_talents');
  const [editedConfig, setEditedConfig] = useState<Partial<KarmaBotConfig> | null>(null);
  const [versionNotes, setVersionNotes] = useState('');
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const {
    configs,
    activeConfig,
    documents,
    loading,
    saving,
    error,
    saveNewVersion,
    activateVersion,
    uploadDocument,
    deleteDocument,
    toggleDocumentActive,
  } = useKarmaBotConfig(activeBotType);

  // Initialize edited config when active config loads
  useEffect(() => {
    if (activeConfig) {
      setEditedConfig({
        system_prompt: activeConfig.system_prompt,
        objectives: [...activeConfig.objectives],
        profile_inputs: { ...activeConfig.profile_inputs },
        model: activeConfig.model,
        max_exchanges: activeConfig.max_exchanges,
        temperature: activeConfig.temperature,
        closing_patterns: [...activeConfig.closing_patterns],
      });
    }
  }, [activeConfig]);

  const handleSave = async () => {
    if (!editedConfig || !versionNotes.trim()) {
      alert('Inserisci una nota di versione per salvare');
      return;
    }
    
    const success = await saveNewVersion(editedConfig, versionNotes);
    if (success) {
      setVersionNotes('');
    }
  };

  const handleObjectiveToggle = (objectiveId: string) => {
    if (!editedConfig?.objectives) return;
    
    setEditedConfig({
      ...editedConfig,
      objectives: editedConfig.objectives.map(obj =>
        obj.id === objectiveId ? { ...obj, enabled: !obj.enabled } : obj
      ),
    });
  };

  const handleProfileInputToggle = (inputKey: keyof ProfileInputs) => {
    if (!editedConfig?.profile_inputs) return;
    
    setEditedConfig({
      ...editedConfig,
      profile_inputs: {
        ...editedConfig.profile_inputs,
        [inputKey]: !editedConfig.profile_inputs[inputKey],
      },
    });
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    for (let i = 0; i < files.length; i++) {
      const file = files[i] as File;
      if (allowedTypes.includes(file.type)) {
        await uploadDocument(file);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const activeDocumentsCount = documents.filter(d => d.is_active).length;
  const lastUpdate = activeConfig?.created_at ? formatDate(activeConfig.created_at) : 'N/A';

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header - Aligned with SuperAdminDashboard */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Bot className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-3xl font-brand font-bold text-gray-800 dark:text-white">
              Karma AI Config
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            Gestisci il backend dei bot conversazionali con configurazioni dinamiche.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={onBack}
        >
          ← Torna alla dashboard
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border-t-4 border-t-emerald-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Versione Attiva</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                v{activeConfig?.version || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-t-4 border-t-blue-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Documenti Attivi</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {activeDocumentsCount}
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-t-4 border-t-purple-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <History className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Totale Versioni</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {configs.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-t-4 border-t-amber-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ultimo Update</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                {lastUpdate}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Bot Type Tabs */}
      <div className="flex gap-2 mb-6">
        {BOT_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveBotType(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeBotType === tab.id
                ? 'bg-emerald-500 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {tab.label}
            {activeConfig?.version && activeBotType === tab.id && (
              <span className="ml-2 text-xs opacity-70">v{activeConfig.version}</span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* System Prompt */}
          <Card className="border-t-4 border-t-emerald-500">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">System Prompt</h2>
            </div>
            
            <div className="mb-3 flex flex-wrap gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Variabili disponibili:</span>
              {TEMPLATE_VARIABLES.map(v => (
                <span key={v} className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs rounded font-mono">
                  {v}
                </span>
              ))}
            </div>

            <textarea
              value={editedConfig?.system_prompt || ''}
              onChange={e => setEditedConfig({ ...editedConfig, system_prompt: e.target.value })}
              className="w-full h-80 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 font-mono text-sm text-gray-800 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Inserisci il system prompt..."
            />
          </Card>

          {/* Objectives */}
          <Card className="border-t-4 border-t-blue-500">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Obiettivi del Colloquio</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {editedConfig?.objectives?.map(obj => (
                <label
                  key={obj.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    obj.enabled
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={obj.enabled}
                    onChange={() => handleObjectiveToggle(obj.id)}
                    className="sr-only"
                  />
                  {obj.enabled ? (
                    <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                  <span className={obj.enabled ? 'text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
                    {obj.label}
                  </span>
                </label>
              ))}
            </div>
          </Card>

          {/* Profile Inputs */}
          <Card className="border-t-4 border-t-purple-500">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Input Profilo</h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">(cosa legge il bot)</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {editedConfig?.profile_inputs && Object.entries(editedConfig.profile_inputs).map(([key, enabled]) => (
                <label
                  key={key}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-sm ${
                    enabled
                      ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => handleProfileInputToggle(key as keyof ProfileInputs)}
                    className="sr-only"
                  />
                  {enabled ? (
                    <ToggleRight className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  ) : (
                    <ToggleLeft className="h-4 w-4 text-gray-400" />
                  )}
                  <span className={enabled ? 'text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
                    {PROFILE_INPUT_LABELS[key as keyof ProfileInputs] || key}
                  </span>
                </label>
              ))}
            </div>
          </Card>

          {/* Model Settings */}
          <Card className="border-t-4 border-t-amber-500">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Impostazioni Modello</h2>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Modello AI</label>
                <select
                  value={editedConfig?.model || 'google/gemini-2.5-flash'}
                  onChange={e => setEditedConfig({ ...editedConfig, model: e.target.value })}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {AVAILABLE_MODELS.map(model => (
                    <option key={model.id} value={model.id}>{model.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Max Scambi</label>
                <input
                  type="number"
                  min={4}
                  max={20}
                  value={editedConfig?.max_exchanges || 8}
                  onChange={e => setEditedConfig({ ...editedConfig, max_exchanges: parseInt(e.target.value) })}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Temperature</label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.1}
                  value={editedConfig?.temperature || 0.7}
                  onChange={e => setEditedConfig({ ...editedConfig, temperature: parseFloat(e.target.value) })}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Save Section */}
          <Card className="border-t-4 border-t-emerald-500">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Salva Modifiche</h3>
            
            <textarea
              value={versionNotes}
              onChange={e => setVersionNotes(e.target.value)}
              placeholder="Note di versione (obbligatorio)..."
              className="w-full h-20 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white text-sm resize-none mb-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />

            <Button
              onClick={handleSave}
              disabled={saving || !versionNotes.trim()}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salva come v{(activeConfig?.version || 0) + 1}
            </Button>
          </Card>

          {/* Documents */}
          <Card className="border-t-4 border-t-blue-500">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Knowledge Base</h3>
            </div>

            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-all mb-4 ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <Upload className="h-6 w-6 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Trascina PDF, DOCX o TXT
              </p>
            </div>

            {/* Document List */}
            <div className="space-y-2">
              {documents.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Nessun documento caricato
                </p>
              ) : (
                documents.map(doc => (
                  <div
                    key={doc.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      doc.is_active 
                        ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600' 
                        : 'bg-gray-50/50 dark:bg-gray-800 border-gray-200/50 dark:border-gray-700 opacity-60'
                    }`}
                  >
                    <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 dark:text-white truncate">{doc.file_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(doc.file_size_bytes)} • {doc.extraction_status}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleDocumentActive(doc.id, !doc.is_active)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      title={doc.is_active ? 'Disattiva' : 'Attiva'}
                    >
                      {doc.is_active ? (
                        <ToggleRight className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteDocument(doc.id, doc.file_path)}
                      className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Version History */}
          <Card className="border-t-4 border-t-purple-500">
            <button
              onClick={() => setShowVersionHistory(!showVersionHistory)}
              className="flex items-center gap-2 w-full text-left"
            >
              <History className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex-1">Cronologia Versioni</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {showVersionHistory ? '▲' : '▼'}
              </span>
            </button>

            {showVersionHistory && (
              <div className="mt-4 space-y-2">
                {configs.map(config => (
                  <div
                    key={config.id}
                    className={`p-3 rounded-lg border ${
                      config.is_active
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-800 dark:text-white">
                        v{config.version}
                        {config.is_active && (
                          <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">(attiva)</span>
                        )}
                      </span>
                      {!config.is_active && (
                        <button
                          onClick={() => activateVersion(config.id)}
                          className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          Ripristina
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(config.created_at)}</p>
                    {config.version_notes && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                        "{config.version_notes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
