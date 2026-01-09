import React, { useState, useEffect } from 'react';
import { Bot, FileText, History, Settings, Upload, Trash2, CheckCircle, XCircle, Save, RefreshCw, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
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
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Karma AI Config</h1>
              <p className="text-muted-foreground text-sm">Gestisci il backend dei bot conversazionali</p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Torna alla dashboard
          </button>
        </div>

        {/* Bot Type Tabs */}
        <div className="flex gap-2 mt-4">
          {BOT_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveBotType(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeBotType === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {tab.label}
              {activeConfig?.version && activeBotType === tab.id && (
                <span className="ml-2 text-xs opacity-70">v{activeConfig.version}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* System Prompt */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">System Prompt</h2>
            </div>
            
            <div className="mb-3 flex flex-wrap gap-1">
              <span className="text-xs text-muted-foreground mr-2">Variabili:</span>
              {TEMPLATE_VARIABLES.map(v => (
                <span key={v} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded font-mono">
                  {v}
                </span>
              ))}
            </div>

            <textarea
              value={editedConfig?.system_prompt || ''}
              onChange={e => setEditedConfig({ ...editedConfig, system_prompt: e.target.value })}
              className="w-full h-80 p-4 bg-muted rounded-lg border border-border font-mono text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Inserisci il system prompt..."
            />
          </div>

          {/* Objectives */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Obiettivi del Colloquio</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {editedConfig?.objectives?.map(obj => (
                <label
                  key={obj.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    obj.enabled
                      ? 'bg-primary/10 border-primary'
                      : 'bg-muted border-border hover:border-muted-foreground'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={obj.enabled}
                    onChange={() => handleObjectiveToggle(obj.id)}
                    className="sr-only"
                  />
                  {obj.enabled ? (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className={obj.enabled ? 'text-foreground' : 'text-muted-foreground'}>
                    {obj.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Profile Inputs */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Input Profilo</h2>
              <span className="text-xs text-muted-foreground">(cosa legge il bot)</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {editedConfig?.profile_inputs && Object.entries(editedConfig.profile_inputs).map(([key, enabled]) => (
                <label
                  key={key}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-sm ${
                    enabled
                      ? 'bg-primary/10 border-primary'
                      : 'bg-muted border-border hover:border-muted-foreground'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => handleProfileInputToggle(key as keyof ProfileInputs)}
                    className="sr-only"
                  />
                  {enabled ? (
                    <ToggleRight className="h-4 w-4 text-primary" />
                  ) : (
                    <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={enabled ? 'text-foreground' : 'text-muted-foreground'}>
                    {PROFILE_INPUT_LABELS[key as keyof ProfileInputs] || key}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Model Settings */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Impostazioni Modello</h2>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Modello AI</label>
                <select
                  value={editedConfig?.model || 'google/gemini-2.5-flash'}
                  onChange={e => setEditedConfig({ ...editedConfig, model: e.target.value })}
                  className="w-full p-2 bg-muted rounded-lg border border-border text-foreground text-sm"
                >
                  {AVAILABLE_MODELS.map(model => (
                    <option key={model.id} value={model.id}>{model.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1">Max Scambi</label>
                <input
                  type="number"
                  min={4}
                  max={20}
                  value={editedConfig?.max_exchanges || 8}
                  onChange={e => setEditedConfig({ ...editedConfig, max_exchanges: parseInt(e.target.value) })}
                  className="w-full p-2 bg-muted rounded-lg border border-border text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1">Temperature</label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.1}
                  value={editedConfig?.temperature || 0.7}
                  onChange={e => setEditedConfig({ ...editedConfig, temperature: parseFloat(e.target.value) })}
                  className="w-full p-2 bg-muted rounded-lg border border-border text-foreground text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Save Section */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Salva Modifiche</h3>
            
            <textarea
              value={versionNotes}
              onChange={e => setVersionNotes(e.target.value)}
              placeholder="Note di versione (obbligatorio)..."
              className="w-full h-20 p-3 bg-muted rounded-lg border border-border text-foreground text-sm resize-none mb-3"
            />

            <button
              onClick={handleSave}
              disabled={saving || !versionNotes.trim()}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salva come v{(activeConfig?.version || 0) + 1}
            </button>
          </div>

          {/* Documents */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Knowledge Base</h3>
            </div>

            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-all mb-4 ${
                dragActive
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-muted-foreground'
              }`}
            >
              <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Trascina PDF, DOCX o TXT
              </p>
            </div>

            {/* Document List */}
            <div className="space-y-2">
              {documents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nessun documento caricato
                </p>
              ) : (
                documents.map(doc => (
                  <div
                    key={doc.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      doc.is_active ? 'bg-muted border-border' : 'bg-muted/50 border-border/50 opacity-60'
                    }`}
                  >
                    <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.file_size_bytes)} • {doc.extraction_status}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleDocumentActive(doc.id, !doc.is_active)}
                      className="p-1 hover:bg-background rounded"
                      title={doc.is_active ? 'Disattiva' : 'Attiva'}
                    >
                      {doc.is_active ? (
                        <ToggleRight className="h-4 w-4 text-primary" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteDocument(doc.id, doc.file_path)}
                      className="p-1 text-destructive hover:bg-destructive/10 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Version History */}
          <div className="bg-card rounded-xl border border-border p-6">
            <button
              onClick={() => setShowVersionHistory(!showVersionHistory)}
              className="flex items-center gap-2 w-full text-left"
            >
              <History className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground flex-1">Cronologia Versioni</h3>
              <span className="text-sm text-muted-foreground">
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
                        ? 'bg-primary/10 border-primary'
                        : 'bg-muted border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground">
                        v{config.version}
                        {config.is_active && (
                          <span className="ml-2 text-xs text-primary">(attiva)</span>
                        )}
                      </span>
                      {!config.is_active && (
                        <button
                          onClick={() => activateVersion(config.id)}
                          className="text-xs text-primary hover:underline"
                        >
                          Ripristina
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDate(config.created_at)}</p>
                    {config.version_notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        "{config.version_notes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
