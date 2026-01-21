import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Save, Eye, EyeOff, Settings, Layers, HelpCircle, 
  Plus, Trash2, GripVertical, ChevronDown, ChevronRight,
  Edit2, Copy, Check, X, Palette
} from 'lucide-react';
import { useQuestionnaires } from '../../src/hooks/useQuestionnaires';
import { useToast } from '../../src/hooks/use-toast';
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
// PROPS
// =============================================
interface QuestionnaireEditorViewProps {
  questionnaireId: string;
  onBack: () => void;
}

// =============================================
// CONSTANTS
// =============================================
const UI_STYLE_OPTIONS: { value: QuestionnaireUIStyle; label: string }[] = [
  { value: 'step', label: 'Step Form' },
  { value: 'chat', label: 'Chat Style' },
  { value: 'swipe', label: 'Swipe Cards' },
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

type EditorTab = 'general' | 'sections' | 'scoring' | 'preview';

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
      // Expand first section by default
      if (data.sections && data.sections.length > 0) {
        setExpandedSections(new Set([data.sections[0].id]));
      }
    }
  };

  useEffect(() => {
    loadQuestionnaire();
  }, [questionnaireId]);

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

  // =============================================
  // SECTION HANDLERS
  // =============================================
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

  // =============================================
  // QUESTION HANDLERS
  // =============================================
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

  // =============================================
  // OPTION HANDLERS
  // =============================================
  const handleAddOption = async (questionId: string) => {
    const id = await addOption(questionId, { text: 'Nuova opzione' });
    if (id) {
      loadQuestionnaire();
    }
  };

  const handleUpdateOption = async (optionId: string, text: string) => {
    const success = await updateOption(optionId, { text });
    if (success) loadQuestionnaire();
  };

  const handleDeleteOption = async (optionId: string) => {
    const success = await deleteOption(optionId);
    if (success) loadQuestionnaire();
  };

  // =============================================
  // DIMENSION HANDLERS
  // =============================================
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

  // =============================================
  // WEIGHT HANDLERS
  // =============================================
  const handleSetWeight = async (optionId: string, dimensionId: string, weight: number) => {
    await setOptionWeight(optionId, dimensionId, weight);
    loadQuestionnaire();
  };

  // =============================================
  // TOGGLE HELPERS
  // =============================================
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

  // =============================================
  // LOADING STATE
  // =============================================
  if (loading && !questionnaire) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!questionnaire) {
    return (
      <div className="min-h-screen bg-background p-8">
        <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft size={20} />
          Torna alla lista
        </button>
        <div className="text-center py-16">
          <p className="text-destructive">Questionario non trovato</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">{questionnaire.title}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>v{questionnaire.version}</span>
                <span>•</span>
                <span className={questionnaire.isPublished ? 'text-green-600' : 'text-yellow-600'}>
                  {questionnaire.isPublished ? 'Pubblicato' : 'Bozza'}
                </span>
                {questionnaire.isSystem && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600">Sistema</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTogglePublish}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                questionnaire.isPublished
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
              }`}
            >
              {questionnaire.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
              {questionnaire.isPublished ? 'Disattiva' : 'Pubblica'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-4 max-w-7xl mx-auto">
          {[
            { id: 'general' as EditorTab, label: 'Generale', icon: Settings },
            { id: 'sections' as EditorTab, label: 'Sezioni e Domande', icon: Layers },
            { id: 'scoring' as EditorTab, label: 'Scoring', icon: HelpCircle },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Impostazioni Generali</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Titolo</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Slug (URL)</label>
                  <input
                    type="text"
                    value={editSlug}
                    onChange={e => setEditSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Descrizione</label>
                  <textarea
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Stile UI</label>
                  <div className="grid grid-cols-3 gap-3">
                    {UI_STYLE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setEditUiStyle(opt.value)}
                        className={`p-3 rounded-lg border-2 text-center transition-colors ${
                          editUiStyle === opt.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-muted-foreground'
                        }`}
                      >
                        <span className="text-sm font-medium">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleSaveGeneral}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Save size={16} />
                    {saving ? 'Salvataggio...' : 'Salva Modifiche'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTIONS TAB */}
        {activeTab === 'sections' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Sezioni ({questionnaire.sections?.length || 0})
              </h2>
              <button
                onClick={handleAddSection}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                <Plus size={16} />
                Aggiungi Sezione
              </button>
            </div>

            {/* Sections List */}
            <div className="space-y-3">
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
                <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
                  <Layers size={40} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-4">Nessuna sezione ancora</p>
                  <button
                    onClick={handleAddSection}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
                  >
                    <Plus size={16} />
                    Crea prima sezione
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SCORING TAB */}
        {activeTab === 'scoring' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Dimensioni di Scoring ({questionnaire.dimensions?.length || 0})
                </h2>
                <p className="text-sm text-muted-foreground">
                  Definisci le dimensioni per calcolare i risultati del questionario
                </p>
              </div>
              <button
                onClick={handleAddDimension}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                <Plus size={16} />
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
              <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
                <Palette size={40} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">Nessuna dimensione di scoring</p>
                <button
                  onClick={handleAddDimension}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
                >
                  <Plus size={16} />
                  Crea prima dimensione
                </button>
              </div>
            )}

            {/* Weight Summary */}
            {questionnaire.dimensions && questionnaire.dimensions.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Configurazione Pesi</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Assegna i pesi alle opzioni dalla tab "Sezioni e Domande". 
                  Espandi una domanda per vedere le opzioni e i pesi per ogni dimensione.
                </p>
                <div className="flex flex-wrap gap-2">
                  {questionnaire.dimensions.map(dim => (
                    <span
                      key={dim.id}
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm"
                      style={{ 
                        backgroundColor: `${dim.color}20`, 
                        color: dim.color,
                        border: `1px solid ${dim.color}40`
                      }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dim.color }} />
                      {dim.code}: {dim.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
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
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center gap-3 p-4 bg-muted/30">
        <button className="text-muted-foreground cursor-grab">
          <GripVertical size={18} />
        </button>
        
        <button onClick={onToggle} className="text-muted-foreground hover:text-foreground">
          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>

        {editMode ? (
          <div className="flex-1 flex items-center gap-3">
            <input
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="flex-1 px-2 py-1 border border-border rounded bg-background text-foreground"
              autoFocus
            />
            <select
              value={editType}
              onChange={e => setEditType(e.target.value as SectionType)}
              className="px-2 py-1 border border-border rounded bg-background text-foreground text-sm"
            >
              {SECTION_TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-50 rounded">
              <Check size={18} />
            </button>
            <button onClick={() => setEditMode(false)} className="p-1 text-muted-foreground hover:bg-muted rounded">
              <X size={18} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1">
              <span className="font-medium text-foreground">{section.title}</span>
              <span className="ml-2 text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                {SECTION_TYPE_OPTIONS.find(o => o.value === section.type)?.label}
              </span>
              <span className="ml-2 text-xs text-muted-foreground">
                ({section.questions?.length || 0} domande)
              </span>
            </div>
            <button
              onClick={() => setEditMode(true)}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-destructive hover:bg-destructive/10 rounded"
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>

      {/* Section Content (Questions) */}
      {isExpanded && (
        <div className="p-4 border-t border-border space-y-3">
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
            className="w-full py-2 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-muted-foreground flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Aggiungi Domanda
          </button>
        </div>
      )}
    </div>
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
    <div className="bg-muted/20 border border-border rounded-lg overflow-hidden">
      {/* Question Header */}
      <div className="flex items-start gap-3 p-3">
        <span className="text-xs text-muted-foreground font-mono mt-1">Q{index + 1}</span>
        
        <button onClick={onToggle} className="text-muted-foreground hover:text-foreground mt-0.5">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {editMode ? (
          <div className="flex-1 space-y-2">
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={2}
              className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-sm"
              autoFocus
            />
            <div className="flex items-center gap-3">
              <select
                value={editType}
                onChange={e => setEditType(e.target.value as QuestionType)}
                className="px-2 py-1 border border-border rounded bg-background text-foreground text-xs"
              >
                {QUESTION_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <label className="flex items-center gap-1 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={editRequired}
                  onChange={e => setEditRequired(e.target.checked)}
                  className="rounded"
                />
                Obbligatoria
              </label>
              <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-50 rounded">
                <Check size={16} />
              </button>
              <button onClick={() => setEditMode(false)} className="p-1 text-muted-foreground hover:bg-muted rounded">
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1">
              <p className="text-sm text-foreground">{question.text}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                  {QUESTION_TYPE_OPTIONS.find(o => o.value === question.type)?.label}
                </span>
                {question.isRequired && (
                  <span className="text-xs text-amber-600">* Obbligatoria</span>
                )}
                <span className="text-xs text-muted-foreground">
                  ({question.options?.length || 0} opzioni)
                </span>
              </div>
            </div>
            <button
              onClick={() => setEditMode(true)}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={onDelete}
              className="p-1 text-destructive hover:bg-destructive/10 rounded"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>

      {/* Options */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 ml-8 space-y-2">
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
              className="w-full py-1.5 text-xs border border-dashed border-border rounded text-muted-foreground hover:text-foreground hover:border-muted-foreground flex items-center justify-center gap-1"
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
    <div className="bg-background border border-border rounded-md p-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground font-mono w-4">{String.fromCharCode(65 + index)}</span>
        
        {editMode ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={editText}
              onChange={e => setEditText(e.target.value)}
              className="flex-1 px-2 py-1 border border-border rounded bg-background text-foreground text-xs"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            <button onClick={handleSave} className="p-0.5 text-green-600 hover:bg-green-50 rounded">
              <Check size={14} />
            </button>
            <button onClick={() => setEditMode(false)} className="p-0.5 text-muted-foreground hover:bg-muted rounded">
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <span className="flex-1 text-xs text-foreground">{option.text}</span>
            {dimensions.length > 0 && (
              <button
                onClick={() => setShowWeights(!showWeights)}
                className={`p-1 rounded text-xs ${showWeights ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                title="Gestisci pesi scoring"
              >
                <Palette size={12} />
              </button>
            )}
            <button
              onClick={() => setEditMode(true)}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={onDelete}
              className="p-1 text-destructive hover:bg-destructive/10 rounded"
            >
              <Trash2 size={12} />
            </button>
          </>
        )}
      </div>

      {/* Weight inputs */}
      {showWeights && dimensions.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border grid grid-cols-2 sm:grid-cols-3 gap-2">
          {dimensions.map(dim => (
            <div key={dim.id} className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: dim.color }}
              />
              <span className="text-[10px] text-muted-foreground truncate">{dim.code}</span>
              <input
                type="number"
                value={getWeightForDimension(dim.id)}
                onChange={e => onSetWeight(dim.id, Number(e.target.value))}
                className="w-12 px-1 py-0.5 text-xs border border-border rounded bg-background text-foreground text-center"
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
    <div className="bg-card border border-border rounded-xl p-4">
      {editMode ? (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Codice</label>
            <input
              type="text"
              value={editCode}
              onChange={e => setEditCode(e.target.value.toUpperCase().replace(/\s/g, '_'))}
              className="w-full px-2 py-1 border border-border rounded bg-background text-foreground font-mono text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Etichetta</label>
            <input
              type="text"
              value={editLabel}
              onChange={e => setEditLabel(e.target.value)}
              className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Colore</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={editColor}
                onChange={e => setEditColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <div className="flex gap-1">
                {DIMENSION_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setEditColor(c)}
                    className={`w-5 h-5 rounded ${editColor === c ? 'ring-2 ring-offset-1 ring-primary' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm"
            >
              Salva
            </button>
            <button
              onClick={() => setEditMode(false)}
              className="px-3 py-1.5 border border-border rounded text-sm text-muted-foreground"
            >
              Annulla
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span
              className="w-4 h-4 rounded-full shrink-0"
              style={{ backgroundColor: dimension.color }}
            />
            <span className="font-mono text-sm font-semibold text-foreground">{dimension.code}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{dimension.label}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditMode(true)}
              className="flex-1 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"
            >
              Modifica
            </button>
            <button
              onClick={onDelete}
              className="px-3 py-1.5 text-xs text-destructive border border-destructive/30 rounded hover:bg-destructive/10"
            >
              Elimina
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
