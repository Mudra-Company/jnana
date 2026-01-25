import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Save, Eye, EyeOff, Settings, Layers, BarChart3, 
  Plus, Trash2, GripVertical, ChevronDown, ChevronRight,
  Edit2, Check, X, Palette, List, MessageSquare, Sparkles, Play,
  Download, Upload, FileSpreadsheet
} from 'lucide-react';
import { exportQuestionnaireTemplate, importQuestionnaireData, type ImportHooks } from '../../src/services/questionnaireImportExport';
import { SimulationModal } from '../../src/components/questionnaire/SimulationModal';
import { useQuestionnaires } from '../../src/hooks/useQuestionnaires';
import { useToast } from '../../src/hooks/use-toast';
import { Card } from '../../components/Card';
import type {
  Questionnaire,
  QuestionnaireSection,
  Question,
  QuestionOption,
  ScoringDimension,
  QuestionnaireUIStyle,
  SectionType,
  QuestionType,
} from '../../src/types/questionnaire';

// =============================================
// PROPS & CONSTANTS
// =============================================
interface QuestionnaireEditorViewProps {
  questionnaireId: string;
  onBack: () => void;
}

const UI_STYLE_OPTIONS: { value: QuestionnaireUIStyle; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'step', label: 'Step Form', icon: <List size={20} />, color: 'blue' },
  { value: 'chat', label: 'Chat Style', icon: <MessageSquare size={20} />, color: 'purple' },
  { value: 'swipe', label: 'Swipe Cards', icon: <Layers size={20} />, color: 'pink' },
];

const SECTION_TYPE_OPTIONS: { value: SectionType; label: string }[] = [
  { value: 'forced_choice', label: 'Scelta Singola' },
  { value: 'checklist', label: 'Scelta Multipla' },
  { value: 'likert', label: 'Scala Likert' },
  { value: 'open_text', label: 'Testo Libero' },
];

const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'single_choice', label: 'Scelta Singola' },
  { value: 'multiple_choice', label: 'Scelta Multipla' },
  { value: 'likert', label: 'Scala Likert' },
  { value: 'open_text', label: 'Testo Libero' },
  { value: 'binary', label: 'Sì/No' },
];

const DIMENSION_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#64748b',
];

type EditorTab = 'general' | 'sections' | 'scoring';

// =============================================
// MAIN COMPONENT
// =============================================
export const QuestionnaireEditorView: React.FC<QuestionnaireEditorViewProps> = ({
  questionnaireId,
  onBack,
}) => {
  const { toast } = useToast();
  const {
    loading,
    fetchQuestionnaire,
    updateQuestionnaire,
    publishQuestionnaire,
    addSection,
    updateSection,
    deleteSection,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    addOption,
    updateOption,
    deleteOption,
    addDimension,
    updateDimension,
    deleteDimension,
    setOptionWeight,
  } = useQuestionnaires();

  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>('general');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [editTitle, setEditTitle] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editUiStyle, setEditUiStyle] = useState<QuestionnaireUIStyle>('step');

  // =============================================
  // LOAD DATA
  // =============================================
  const loadQuestionnaire = async () => {
    const data = await fetchQuestionnaire(questionnaireId);
    if (data) {
      setQuestionnaire(data);
      setEditTitle(data.title);
      setEditSlug(data.slug);
      setEditDescription(data.description || '');
      setEditUiStyle(data.uiStyle);
      if (data.sections && data.sections.length > 0) {
        setExpandedSections(new Set([data.sections[0].id]));
      }
    }
  };

  useEffect(() => {
    loadQuestionnaire();
  }, [questionnaireId]);

  // Close export dialog when clicking outside
  useEffect(() => {
    if (!showExportDialog) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-export-dialog]')) {
        setShowExportDialog(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showExportDialog]);

  // =============================================
  // SAVE HANDLERS
  // =============================================
  const handleSaveGeneral = async () => {
    if (!questionnaire) return;
    setSaving(true);
    
    const success = await updateQuestionnaire(questionnaire.id, {
      title: editTitle,
      slug: editSlug,
      description: editDescription,
      uiStyle: editUiStyle,
    });

    if (success) {
      toast({ title: 'Salvato', description: 'Impostazioni generali aggiornate' });
      loadQuestionnaire();
    } else {
      toast({ title: 'Errore', description: 'Impossibile salvare', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleTogglePublish = async () => {
    if (!questionnaire) return;
    const success = await publishQuestionnaire(questionnaire.id, !questionnaire.isPublished);
    if (success) {
      toast({ 
        title: questionnaire.isPublished ? 'Disattivato' : 'Pubblicato',
        description: questionnaire.isPublished 
          ? 'Il questionario non è più visibile' 
          : 'Il questionario è ora attivo'
      });
      loadQuestionnaire();
    }
  };

  const handleAddSection = async () => {
    if (!questionnaire) return;
    const id = await addSection(questionnaire.id, {
      title: 'Nuova Sezione',
      type: 'forced_choice',
    });
    if (id) {
      toast({ title: 'Sezione aggiunta' });
      loadQuestionnaire();
      setExpandedSections(prev => new Set(prev).add(id));
    }
  };

  const handleUpdateSection = async (sectionId: string, title: string, type: SectionType) => {
    const success = await updateSection(sectionId, { title, type });
    if (success) loadQuestionnaire();
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Eliminare questa sezione e tutte le sue domande?')) return;
    const success = await deleteSection(sectionId);
    if (success) {
      toast({ title: 'Sezione eliminata' });
      loadQuestionnaire();
    }
  };

  const handleAddQuestion = async (sectionId: string) => {
    const id = await addQuestion(sectionId, {
      text: 'Nuova domanda',
      type: 'single_choice',
      isRequired: true,
    });
    if (id) {
      toast({ title: 'Domanda aggiunta' });
      loadQuestionnaire();
      setExpandedQuestions(prev => new Set(prev).add(id));
    }
  };

  const handleUpdateQuestion = async (questionId: string, text: string, type: QuestionType, isRequired: boolean) => {
    const success = await updateQuestion(questionId, { text, type, isRequired });
    if (success) loadQuestionnaire();
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Eliminare questa domanda?')) return;
    const success = await deleteQuestion(questionId);
    if (success) {
      toast({ title: 'Domanda eliminata' });
      loadQuestionnaire();
    }
  };

  const handleAddOption = async (questionId: string) => {
    const id = await addOption(questionId, { text: 'Nuova opzione' });
    if (id) loadQuestionnaire();
  };

  const handleUpdateOption = async (optionId: string, text: string) => {
    const success = await updateOption(optionId, { text });
    if (success) loadQuestionnaire();
  };

  const handleDeleteOption = async (optionId: string) => {
    const success = await deleteOption(optionId);
    if (success) loadQuestionnaire();
  };

  const handleAddDimension = async () => {
    if (!questionnaire) return;
    const id = await addDimension(questionnaire.id, {
      code: `DIM_${(questionnaire.dimensions?.length || 0) + 1}`,
      label: 'Nuova Dimensione',
      color: DIMENSION_COLORS[(questionnaire.dimensions?.length || 0) % DIMENSION_COLORS.length],
    });
    if (id) {
      toast({ title: 'Dimensione aggiunta' });
      loadQuestionnaire();
    }
  };

  const handleUpdateDimension = async (dimId: string, code: string, label: string, color: string) => {
    const success = await updateDimension(dimId, { code, label, color });
    if (success) loadQuestionnaire();
  };

  const handleDeleteDimension = async (dimId: string) => {
    if (!confirm('Eliminare questa dimensione e tutti i pesi associati?')) return;
    const success = await deleteDimension(dimId);
    if (success) {
      toast({ title: 'Dimensione eliminata' });
      loadQuestionnaire();
    }
  };

  const handleSetWeight = async (optionId: string, dimensionId: string, weight: number) => {
    await setOptionWeight(optionId, dimensionId, weight);
    loadQuestionnaire();
  };

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleQuestion = (id: string) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePreview = () => {
    if (!questionnaire?.sections?.length) {
      toast({ 
        title: 'Nessuna domanda', 
        description: 'Aggiungi almeno una sezione con domande',
        variant: 'destructive'
      });
      return;
    }
    setShowSimulation(true);
  };

  // =============================================
  // IMPORT/EXPORT HANDLERS
  // =============================================
  const handleExportTemplate = (includeData: boolean) => {
    if (!questionnaire) return;
    exportQuestionnaireTemplate(questionnaire, includeData);
    setShowExportDialog(false);
    toast({ 
      title: 'Download avviato', 
      description: includeData ? 'Export completo del questionario' : 'Template vuoto scaricato'
    });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !questionnaire) return;

    setImporting(true);
    
    const hooks: ImportHooks = {
      addSection: (qId, data) => addSection(qId, data),
      addQuestion: (sId, data) => addQuestion(sId, data),
      addOption: (qId, data) => addOption(qId, data),
      setOptionWeight: (oId, dId, w) => setOptionWeight(oId, dId, w),
    };

    const result = await importQuestionnaireData(
      file,
      questionnaire.id,
      questionnaire.dimensions || [],
      hooks
    );

    setImporting(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (result.success) {
      toast({
        title: 'Import completato',
        description: `${result.sectionsCreated} sezioni, ${result.questionsCreated} domande, ${result.optionsCreated} opzioni, ${result.weightsCreated} pesi`,
      });
      loadQuestionnaire();
    } else {
      toast({
        title: 'Errori durante import',
        description: result.errors.slice(0, 3).join('; ') + (result.errors.length > 3 ? ` (+${result.errors.length - 3} altri)` : ''),
        variant: 'destructive',
      });
      // Still refresh if some items were created
      if (result.sectionsCreated > 0 || result.questionsCreated > 0) {
        loadQuestionnaire();
      }
    }
  };

  // =============================================
  // LOADING / ERROR STATES
  // =============================================
  if (loading && !questionnaire) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!questionnaire) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-8">
        <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft size={20} />
          Torna alla lista
        </button>
        <Card className="text-center py-16">
          <p className="text-destructive">Questionario non trovato</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header with gradient based on status */}
      <div className={`sticky top-0 z-20 backdrop-blur-xl border-b ${
        questionnaire.isPublished 
          ? 'bg-gradient-to-r from-emerald-50/90 to-teal-50/90 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200/50 dark:border-emerald-800/30'
          : 'bg-gradient-to-r from-amber-50/90 to-yellow-50/90 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200/50 dark:border-amber-800/30'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2.5 hover:bg-white/50 dark:hover:bg-white/10 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-foreground">{questionnaire.title}</h1>
                  {questionnaire.isSystem && (
                    <span className="text-xs px-2.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full font-medium">
                      Sistema
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm">
                  <span className="text-muted-foreground font-mono">v{questionnaire.version}</span>
                  <span className={`flex items-center gap-1.5 font-medium ${
                    questionnaire.isPublished ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {questionnaire.isPublished ? <Eye size={14} /> : <EyeOff size={14} />}
                    {questionnaire.isPublished ? 'Pubblicato' : 'Bozza'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Import/Export Section */}
              <div className="relative" data-export-dialog>
                <button
                  onClick={() => setShowExportDialog(!showExportDialog)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-sm font-medium transition-all"
                >
                  <Download size={16} />
                  Esporta
                </button>
                
                {/* Export Dialog Dropdown */}
                {showExportDialog && (
                  <div className="absolute right-0 mt-2 w-64 bg-card rounded-xl shadow-xl border border-border p-3 z-30">
                    <p className="text-xs text-muted-foreground mb-3">Scegli tipo di export:</p>
                    <button
                      onClick={() => handleExportTemplate(false)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left mb-2"
                    >
                      <FileSpreadsheet size={20} className="text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Template Vuoto</p>
                        <p className="text-xs text-muted-foreground">Solo struttura + esempio</p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleExportTemplate(true)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
                    >
                      <FileSpreadsheet size={20} className="text-emerald-500" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Export Completo</p>
                        <p className="text-xs text-muted-foreground">Include tutti i dati esistenti</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-sm font-medium transition-all disabled:opacity-50"
              >
                {importing ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                Importa
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx,.xls"
                onChange={handleImport}
                className="hidden"
              />

              {/* Preview Button */}
              <button
                onClick={handlePreview}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400 text-sm font-medium transition-all"
              >
                <Play size={16} />
                Anteprima
              </button>

              {/* Publish Button */}
              <button
                onClick={handleTogglePublish}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md ${
                  questionnaire.isPublished
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white'
                }`}
              >
                {questionnaire.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                {questionnaire.isPublished ? 'Disattiva' : 'Pubblica'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mt-5">
            {[
              { id: 'general' as EditorTab, label: 'Generale', icon: Settings },
              { id: 'sections' as EditorTab, label: 'Sezioni e Domande', icon: Layers },
              { id: 'scoring' as EditorTab, label: 'Scoring', icon: BarChart3 },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-white/10'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <div className="max-w-2xl animate-fade-in">
            <Card padding="lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl">
                  <Settings size={24} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Impostazioni Generali</h2>
                  <p className="text-sm text-muted-foreground">Configura le proprietà base del questionario</p>
                </div>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Titolo</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 border-0 rounded-xl text-foreground focus:ring-2 focus:ring-indigo-500/30 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Slug (URL)</label>
                  <input
                    type="text"
                    value={editSlug}
                    onChange={e => setEditSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 border-0 rounded-xl text-foreground font-mono text-sm focus:ring-2 focus:ring-indigo-500/30 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Descrizione</label>
                  <textarea
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 border-0 rounded-xl text-foreground focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">Stile UI</label>
                  <div className="grid grid-cols-3 gap-3">
                    {UI_STYLE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setEditUiStyle(opt.value)}
                        className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                          editUiStyle === opt.value
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-lg'
                            : 'border-slate-200 dark:border-gray-700 hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className={`p-3 rounded-xl ${
                          editUiStyle === opt.value 
                            ? 'bg-indigo-100 dark:bg-indigo-800/50 text-indigo-600 dark:text-indigo-400' 
                            : 'bg-slate-100 dark:bg-gray-700 text-muted-foreground'
                        }`}>
                          {opt.icon}
                        </div>
                        <span className={`text-sm font-medium ${editUiStyle === opt.value ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground'}`}>
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleSaveGeneral}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-50 transition-all"
                  >
                    <Save size={18} />
                    {saving ? 'Salvataggio...' : 'Salva Modifiche'}
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* SECTIONS TAB */}
        {activeTab === 'sections' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl">
                  <Layers size={24} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Sezioni ({questionnaire.sections?.length || 0})
                  </h2>
                  <p className="text-sm text-muted-foreground">Organizza le domande in sezioni tematiche</p>
                </div>
              </div>
              <button
                onClick={handleAddSection}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                <Plus size={18} />
                Aggiungi Sezione
              </button>
            </div>

            {/* Sections List */}
            <div className="space-y-4">
              {questionnaire.sections?.map((section, sIdx) => (
                <SectionEditor
                  key={section.id}
                  section={section}
                  index={sIdx}
                  isExpanded={expandedSections.has(section.id)}
                  onToggle={() => toggleSection(section.id)}
                  onUpdate={(title, type) => handleUpdateSection(section.id, title, type)}
                  onDelete={() => handleDeleteSection(section.id)}
                  onAddQuestion={() => handleAddQuestion(section.id)}
                  expandedQuestions={expandedQuestions}
                  onToggleQuestion={toggleQuestion}
                  onUpdateQuestion={handleUpdateQuestion}
                  onDeleteQuestion={handleDeleteQuestion}
                  onAddOption={handleAddOption}
                  onUpdateOption={handleUpdateOption}
                  onDeleteOption={handleDeleteOption}
                  dimensions={questionnaire.dimensions || []}
                  onSetWeight={handleSetWeight}
                />
              ))}

              {(!questionnaire.sections || questionnaire.sections.length === 0) && (
                <Card padding="xl" className="text-center">
                  <div className="p-6 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl w-20 h-20 mx-auto flex items-center justify-center mb-4">
                    <Layers size={32} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <p className="text-muted-foreground mb-4">Nessuna sezione ancora</p>
                  <button
                    onClick={handleAddSection}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium"
                  >
                    <Plus size={18} />
                    Crea prima sezione
                  </button>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* SCORING TAB */}
        {activeTab === 'scoring' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl">
                  <BarChart3 size={24} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Dimensioni di Scoring ({questionnaire.dimensions?.length || 0})
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Definisci le dimensioni per calcolare i risultati
                  </p>
                </div>
              </div>
              <button
                onClick={handleAddDimension}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                <Plus size={18} />
                Aggiungi Dimensione
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {questionnaire.dimensions?.map(dim => (
                <DimensionEditor
                  key={dim.id}
                  dimension={dim}
                  onUpdate={(code, label, color) => handleUpdateDimension(dim.id, code, label, color)}
                  onDelete={() => handleDeleteDimension(dim.id)}
                />
              ))}
            </div>

            {(!questionnaire.dimensions || questionnaire.dimensions.length === 0) && (
              <Card padding="xl" className="text-center">
                <div className="p-6 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl w-20 h-20 mx-auto flex items-center justify-center mb-4">
                  <Palette size={32} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="text-muted-foreground mb-4">Nessuna dimensione di scoring</p>
                <button
                  onClick={handleAddDimension}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium"
                >
                  <Plus size={18} />
                  Crea prima dimensione
                </button>
              </Card>
            )}

            {/* Weight Summary */}
            {questionnaire.dimensions && questionnaire.dimensions.length > 0 && (
              <Card>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <Sparkles size={18} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-foreground">Configurazione Pesi</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Assegna i pesi alle opzioni dalla tab "Sezioni e Domande". 
                  Espandi una domanda per vedere le opzioni e i pesi per ogni dimensione.
                </p>
                <div className="flex flex-wrap gap-2">
                  {questionnaire.dimensions.map(dim => (
                    <span
                      key={dim.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                      style={{ 
                        backgroundColor: `${dim.color}15`, 
                        color: dim.color,
                        border: `1px solid ${dim.color}30`
                      }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dim.color }} />
                      {dim.code}: {dim.label}
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Simulation Modal */}
      {showSimulation && questionnaire && (
        <SimulationModal
          questionnaire={questionnaire}
          isOpen={showSimulation}
          onClose={() => setShowSimulation(false)}
        />
      )}
    </div>
  );
};

// =============================================
// SECTION EDITOR COMPONENT
// =============================================
interface SectionEditorProps {
  section: QuestionnaireSection;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (title: string, type: SectionType) => void;
  onDelete: () => void;
  onAddQuestion: () => void;
  expandedQuestions: Set<string>;
  onToggleQuestion: (id: string) => void;
  onUpdateQuestion: (id: string, text: string, type: QuestionType, isRequired: boolean) => void;
  onDeleteQuestion: (id: string) => void;
  onAddOption: (questionId: string) => void;
  onUpdateOption: (optionId: string, text: string) => void;
  onDeleteOption: (optionId: string) => void;
  dimensions: ScoringDimension[];
  onSetWeight: (optionId: string, dimensionId: string, weight: number) => void;
}

const SectionEditor: React.FC<SectionEditorProps> = ({
  section,
  index,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
  onAddQuestion,
  expandedQuestions,
  onToggleQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
  dimensions,
  onSetWeight,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title);
  const [editType, setEditType] = useState<SectionType>(section.type);

  const handleSave = () => {
    onUpdate(editTitle, editType);
    setEditMode(false);
  };

  return (
    <Card padding="none" className="overflow-hidden">
      {/* Section Header with gradient */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-800/50 dark:to-gray-800/30 border-b border-slate-200/50 dark:border-gray-700/50">
        <button className="text-slate-400 hover:text-slate-600 cursor-grab">
          <GripVertical size={18} />
        </button>
        
        <button 
          onClick={onToggle} 
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-transform"
          style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        >
          <ChevronDown size={18} />
        </button>

        <span className="flex items-center justify-center w-7 h-7 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg">
          {index + 1}
        </span>

        {editMode ? (
          <div className="flex-1 flex items-center gap-3">
            <input
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-lg text-foreground focus:ring-2 focus:ring-indigo-500/30"
              autoFocus
            />
            <select
              value={editType}
              onChange={e => setEditType(e.target.value as SectionType)}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-lg text-foreground text-sm"
            >
              {SECTION_TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button onClick={handleSave} className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg">
              <Check size={18} />
            </button>
            <button onClick={() => setEditMode(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg">
              <X size={18} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1">
              <span className="font-semibold text-foreground">{section.title}</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-gray-700 rounded-full text-slate-600 dark:text-slate-400 font-medium">
                  {SECTION_TYPE_OPTIONS.find(o => o.value === section.type)?.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {section.questions?.length || 0} domande
                </span>
              </div>
            </div>
            <button
              onClick={() => setEditMode(true)}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>

      {/* Section Content (Questions) */}
      {isExpanded && (
        <div className="p-4 space-y-3 bg-white dark:bg-gray-900/50">
          {section.questions?.map((question, qIdx) => (
            <QuestionEditor
              key={question.id}
              question={question}
              index={qIdx}
              isExpanded={expandedQuestions.has(question.id)}
              onToggle={() => onToggleQuestion(question.id)}
              onUpdate={(text, type, isReq) => onUpdateQuestion(question.id, text, type, isReq)}
              onDelete={() => onDeleteQuestion(question.id)}
              onAddOption={() => onAddOption(question.id)}
              onUpdateOption={onUpdateOption}
              onDeleteOption={onDeleteOption}
              dimensions={dimensions}
              onSetWeight={onSetWeight}
            />
          ))}

          <button
            onClick={onAddQuestion}
            className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-gray-700 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-700 flex items-center justify-center gap-2 transition-colors"
          >
            <Plus size={18} />
            Aggiungi Domanda
          </button>
        </div>
      )}
    </Card>
  );
};

// =============================================
// QUESTION EDITOR COMPONENT
// =============================================
interface QuestionEditorProps {
  question: Question;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (text: string, type: QuestionType, isRequired: boolean) => void;
  onDelete: () => void;
  onAddOption: () => void;
  onUpdateOption: (optionId: string, text: string) => void;
  onDeleteOption: (optionId: string) => void;
  dimensions: ScoringDimension[];
  onSetWeight: (optionId: string, dimensionId: string, weight: number) => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  index,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
  dimensions,
  onSetWeight,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState(question.text);
  const [editType, setEditType] = useState<QuestionType>(question.type);
  const [editRequired, setEditRequired] = useState(question.isRequired);

  const handleSave = () => {
    onUpdate(editText, editType, editRequired);
    setEditMode(false);
  };

  return (
    <div className="bg-slate-50 dark:bg-gray-800/50 border border-slate-200/50 dark:border-gray-700/50 rounded-xl overflow-hidden">
      {/* Question Header */}
      <div className="flex items-start gap-3 p-4">
        <span className="flex items-center justify-center w-6 h-6 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-md mt-0.5">
          {index + 1}
        </span>
        
        <button 
          onClick={onToggle} 
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-transform mt-0.5"
          style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        >
          <ChevronDown size={16} />
        </button>

        {editMode ? (
          <div className="flex-1 space-y-3">
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-lg text-foreground text-sm focus:ring-2 focus:ring-indigo-500/30 resize-none"
              autoFocus
            />
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={editType}
                onChange={e => setEditType(e.target.value as QuestionType)}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-lg text-foreground text-xs"
              >
                {QUESTION_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={editRequired}
                  onChange={e => setEditRequired(e.target.checked)}
                  className="rounded border-slate-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                />
                Obbligatoria
              </label>
              <button onClick={handleSave} className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg">
                <Check size={16} />
              </button>
              <button onClick={() => setEditMode(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg">
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1">
              <p className="text-sm text-foreground leading-relaxed">{question.text}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full font-medium">
                  {QUESTION_TYPE_OPTIONS.find(o => o.value === question.type)?.label}
                </span>
                {question.isRequired && (
                  <span className="text-xs px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full font-medium">
                    * Obbligatoria
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {question.options?.length || 0} opzioni
                </span>
              </div>
            </div>
            <button
              onClick={() => setEditMode(true)}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>

      {/* Options */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 ml-10 space-y-2">
          {question.options?.map((option, oIdx) => (
            <OptionEditor
              key={option.id}
              option={option}
              index={oIdx}
              onUpdate={(text) => onUpdateOption(option.id, text)}
              onDelete={() => onDeleteOption(option.id)}
              dimensions={dimensions}
              onSetWeight={(dimId, weight) => onSetWeight(option.id, dimId, weight)}
            />
          ))}

          {(question.type === 'single_choice' || question.type === 'multiple_choice' || question.type === 'binary') && (
            <button
              onClick={onAddOption}
              className="w-full py-2 text-xs border border-dashed border-slate-200 dark:border-gray-700 rounded-lg text-slate-400 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-700 flex items-center justify-center gap-1 transition-colors"
            >
              <Plus size={14} />
              Aggiungi Opzione
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// =============================================
// OPTION EDITOR COMPONENT
// =============================================
interface OptionEditorProps {
  option: QuestionOption;
  index: number;
  onUpdate: (text: string) => void;
  onDelete: () => void;
  dimensions: ScoringDimension[];
  onSetWeight: (dimensionId: string, weight: number) => void;
}

const OptionEditor: React.FC<OptionEditorProps> = ({
  option,
  index,
  onUpdate,
  onDelete,
  dimensions,
  onSetWeight,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState(option.text);
  const [showWeights, setShowWeights] = useState(false);

  const handleSave = () => {
    onUpdate(editText);
    setEditMode(false);
  };

  const getWeightForDimension = (dimId: string) => {
    return option.weights?.find(w => w.dimensionId === dimId)?.weight || 0;
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-slate-200/50 dark:border-gray-700/50 rounded-lg p-3">
      <div className="flex items-center gap-3">
        <span className="flex items-center justify-center w-5 h-5 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 text-[10px] font-bold rounded">
          {String.fromCharCode(65 + index)}
        </span>
        
        {editMode ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={editText}
              onChange={e => setEditText(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-600 rounded-lg text-foreground text-sm focus:ring-2 focus:ring-indigo-500/30"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            <button onClick={handleSave} className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg">
              <Check size={14} />
            </button>
            <button onClick={() => setEditMode(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg">
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 min-w-0">
              <span className="text-sm text-foreground">{option.text}</span>
              {/* Inline weight preview badges when not in edit mode and has weights */}
              {!showWeights && option.weights && option.weights.filter(w => w.weight !== 0).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {option.weights.filter(w => w.weight !== 0).slice(0, 4).map(w => {
                    const dim = dimensions.find(d => d.id === w.dimensionId);
                    return (
                      <span 
                        key={w.id}
                        className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                        style={{ 
                          backgroundColor: `${dim?.color}15`, 
                          color: dim?.color 
                        }}
                      >
                        {dim?.code}: {w.weight > 0 ? '+' : ''}{w.weight}
                      </span>
                    );
                  })}
                  {option.weights.filter(w => w.weight !== 0).length > 4 && (
                    <span className="text-[9px] text-muted-foreground">
                      +{option.weights.filter(w => w.weight !== 0).length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Weight Count Badge */}
            {option.weights && option.weights.filter(w => w.weight !== 0).length > 0 && (
              <span 
                className="px-2 py-0.5 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-full flex items-center gap-1"
                title={`${option.weights.filter(w => w.weight !== 0).length} dimensioni impattate`}
              >
                <BarChart3 size={10} />
                {option.weights.filter(w => w.weight !== 0).length}
              </span>
            )}

            {dimensions.length > 0 && (
              <button
                onClick={() => setShowWeights(!showWeights)}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  showWeights 
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-700'
                }`}
                title="Gestisci pesi scoring"
              >
                <Palette size={14} />
              </button>
            )}
            <button
              onClick={() => setEditMode(true)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>

      {/* Weight inputs */}
      {showWeights && dimensions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-gray-700/50 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {dimensions.map(dim => (
            <div key={dim.id} className="flex items-center gap-2 bg-slate-50 dark:bg-gray-900/50 rounded-lg px-2 py-1.5">
              <span
                className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white dark:ring-gray-800"
                style={{ backgroundColor: dim.color }}
              />
              <span className="text-xs text-muted-foreground truncate flex-1">{dim.code}</span>
              <input
                type="number"
                value={getWeightForDimension(dim.id)}
                onChange={e => onSetWeight(dim.id, Number(e.target.value))}
                className="w-14 px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 rounded-md text-foreground text-center focus:ring-2 focus:ring-indigo-500/30"
                step="0.1"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// =============================================
// DIMENSION EDITOR COMPONENT
// =============================================
interface DimensionEditorProps {
  dimension: ScoringDimension;
  onUpdate: (code: string, label: string, color: string) => void;
  onDelete: () => void;
}

const DimensionEditor: React.FC<DimensionEditorProps> = ({
  dimension,
  onUpdate,
  onDelete,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editCode, setEditCode] = useState(dimension.code);
  const [editLabel, setEditLabel] = useState(dimension.label);
  const [editColor, setEditColor] = useState(dimension.color || '#3b82f6');

  const handleSave = () => {
    onUpdate(editCode, editLabel, editColor);
    setEditMode(false);
  };

  return (
    <Card 
      padding="md" 
      className="relative overflow-hidden"
      style={{ borderTop: `3px solid ${dimension.color}` }}
    >
      {editMode ? (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground font-medium">Codice</label>
            <input
              type="text"
              value={editCode}
              onChange={e => setEditCode(e.target.value.toUpperCase().replace(/\s/g, '_'))}
              className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-gray-800 border-0 rounded-lg text-foreground font-mono text-sm focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-medium">Etichetta</label>
            <input
              type="text"
              value={editLabel}
              onChange={e => setEditLabel(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-gray-800 border-0 rounded-lg text-foreground text-sm focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-medium">Colore</label>
            <div className="flex items-center gap-3 mt-2">
              <input
                type="color"
                value={editColor}
                onChange={e => setEditColor(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border-0"
              />
              <div className="flex gap-1.5 flex-wrap">
                {DIMENSION_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setEditColor(c)}
                    className={`w-6 h-6 rounded-lg transition-transform ${editColor === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg text-sm font-medium"
            >
              Salva
            </button>
            <button
              onClick={() => setEditMode(false)}
              className="flex-1 px-4 py-2 bg-slate-100 dark:bg-gray-700 rounded-lg text-sm text-muted-foreground hover:text-foreground"
            >
              Annulla
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span
              className="w-5 h-5 rounded-lg shrink-0 ring-2 ring-white dark:ring-gray-800 shadow-md"
              style={{ backgroundColor: dimension.color }}
            />
            <span className="font-mono text-sm font-bold text-foreground">{dimension.code}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{dimension.label}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditMode(true)}
              className="flex-1 px-4 py-2 text-sm bg-slate-50 dark:bg-gray-800 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 font-medium transition-colors"
            >
              Modifica
            </button>
            <button
              onClick={onDelete}
              className="px-4 py-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 font-medium transition-colors"
            >
              Elimina
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};
