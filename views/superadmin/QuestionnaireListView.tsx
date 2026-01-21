import React, { useState, useEffect } from 'react';
import { Plus, Edit, Copy, Trash2, Eye, EyeOff, Settings, List, MessageSquare, Layers, Search } from 'lucide-react';
import { useQuestionnaires } from '../../src/hooks/useQuestionnaires';
import { useToast } from '../../src/hooks/use-toast';
import type { QuestionnaireListItem, QuestionnaireFilter, QuestionnaireUIStyle } from '../../src/types/questionnaire';

interface QuestionnaireListViewProps {
  onBack: () => void;
  onEdit: (id: string) => void;
}

const UI_STYLE_ICONS: Record<QuestionnaireUIStyle, React.ReactNode> = {
  step: <List size={16} />,
  chat: <MessageSquare size={16} />,
  swipe: <Layers size={16} />,
};

const UI_STYLE_LABELS: Record<QuestionnaireUIStyle, string> = {
  step: 'Step Form',
  chat: 'Chat Style',
  swipe: 'Swipe Cards',
};

export const QuestionnaireListView: React.FC<QuestionnaireListViewProps> = ({ onBack, onEdit }) => {
  const { toast } = useToast();
  const {
    loading,
    fetchQuestionnaires,
    createQuestionnaire,
    deleteQuestionnaire,
    publishQuestionnaire,
    duplicateQuestionnaire,
  } = useQuestionnaires();

  const [questionnaires, setQuestionnaires] = useState<QuestionnaireListItem[]>([]);
  const [filter, setFilter] = useState<QuestionnaireFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newUiStyle, setNewUiStyle] = useState<QuestionnaireUIStyle>('step');

  // Load questionnaires
  const loadQuestionnaires = async () => {
    const data = await fetchQuestionnaires(filter);
    setQuestionnaires(data);
  };

  useEffect(() => {
    loadQuestionnaires();
  }, [filter]);

  // Filter by search
  const filteredQuestionnaires = questionnaires.filter(q => 
    q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handlers
  const handleCreate = async () => {
    if (!newTitle.trim() || !newSlug.trim()) {
      toast({ title: 'Errore', description: 'Titolo e slug sono obbligatori', variant: 'destructive' });
      return;
    }

    const id = await createQuestionnaire({
      title: newTitle,
      slug: newSlug.toLowerCase().replace(/\s+/g, '-'),
      uiStyle: newUiStyle,
    });

    if (id) {
      toast({ title: 'Successo', description: 'Questionario creato' });
      setShowCreateModal(false);
      setNewTitle('');
      setNewSlug('');
      onEdit(id);
    } else {
      toast({ title: 'Errore', description: 'Impossibile creare il questionario', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string, title: string, isSystem: boolean) => {
    if (isSystem) {
      toast({ title: 'Errore', description: 'I questionari di sistema non possono essere eliminati', variant: 'destructive' });
      return;
    }
    
    if (!confirm(`Sei sicuro di voler eliminare "${title}"? Questa azione è irreversibile.`)) return;

    const success = await deleteQuestionnaire(id);
    if (success) {
      toast({ title: 'Successo', description: 'Questionario eliminato' });
      loadQuestionnaires();
    } else {
      toast({ title: 'Errore', description: 'Impossibile eliminare il questionario', variant: 'destructive' });
    }
  };

  const handleTogglePublish = async (id: string, currentlyPublished: boolean) => {
    const success = await publishQuestionnaire(id, !currentlyPublished);
    if (success) {
      toast({ 
        title: 'Successo', 
        description: currentlyPublished ? 'Questionario disattivato' : 'Questionario pubblicato' 
      });
      loadQuestionnaires();
    }
  };

  const handleDuplicate = async (id: string) => {
    const newId = await duplicateQuestionnaire(id);
    if (newId) {
      toast({ title: 'Successo', description: 'Questionario duplicato' });
      loadQuestionnaires();
    } else {
      toast({ title: 'Errore', description: 'Impossibile duplicare il questionario', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1">
            ← Torna alla Dashboard
          </button>
          <h1 className="text-3xl font-bold text-foreground">Questionnaire Manager</h1>
          <p className="text-muted-foreground">Gestisci questionari dinamici, scoring e stili di visualizzazione</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          Nuovo Questionario
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cerca questionari..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {(['all', 'published', 'draft', 'system'] as QuestionnaireFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === f 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'all' && 'Tutti'}
              {f === 'published' && 'Pubblicati'}
              {f === 'draft' && 'Bozze'}
              {f === 'system' && 'Sistema'}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Caricamento...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredQuestionnaires.length === 0 && (
        <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed border-border">
          <Settings size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Nessun questionario trovato</h3>
          <p className="text-muted-foreground mb-4">
            {filter !== 'all' ? 'Prova a cambiare i filtri o ' : ''}
            Inizia creando il tuo primo questionario
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            <Plus size={18} />
            Crea Questionario
          </button>
        </div>
      )}

      {/* Questionnaire Grid */}
      {!loading && filteredQuestionnaires.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredQuestionnaires.map(q => (
            <div
              key={q.id}
              className="bg-card border border-border rounded-xl p-5 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {UI_STYLE_ICONS[q.uiStyle]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground line-clamp-1">{q.title}</h3>
                    <p className="text-xs text-muted-foreground">{q.slug}</p>
                  </div>
                </div>
                {q.isSystem && (
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                    Sistema
                  </span>
                )}
              </div>

              {/* Description */}
              {q.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{q.description}</p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span>{q.sectionCount} sezioni</span>
                <span>{q.questionCount} domande</span>
                <span>v{q.version}</span>
              </div>

              {/* Status badge */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                  q.isPublished 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {q.isPublished ? <Eye size={12} /> : <EyeOff size={12} />}
                  {q.isPublished ? 'Pubblicato' : 'Bozza'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {UI_STYLE_LABELS[q.uiStyle]}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <button
                  onClick={() => onEdit(q.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90"
                >
                  <Edit size={14} />
                  Modifica
                </button>
                <button
                  onClick={() => handleDuplicate(q.id)}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                  title="Duplica"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => handleTogglePublish(q.id, q.isPublished)}
                  className={`p-2 rounded-lg ${
                    q.isPublished 
                      ? 'text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20' 
                      : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                  }`}
                  title={q.isPublished ? 'Disattiva' : 'Pubblica'}
                >
                  {q.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {!q.isSystem && (
                  <button
                    onClick={() => handleDelete(q.id, q.title, q.isSystem)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                    title="Elimina"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Nuovo Questionario</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Titolo *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => {
                    setNewTitle(e.target.value);
                    // Auto-generate slug
                    setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                  }}
                  placeholder="es. Test di Engagement"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Slug (URL) *</label>
                <input
                  type="text"
                  value={newSlug}
                  onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="es. test-engagement"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Stile UI</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['step', 'chat', 'swipe'] as QuestionnaireUIStyle[]).map(style => (
                    <button
                      key={style}
                      onClick={() => setNewUiStyle(style)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                        newUiStyle === style 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      <div className={newUiStyle === style ? 'text-primary' : 'text-muted-foreground'}>
                        {UI_STYLE_ICONS[style]}
                      </div>
                      <span className="text-xs font-medium">{UI_STYLE_LABELS[style]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted"
              >
                Annulla
              </button>
              <button
                onClick={handleCreate}
                disabled={loading || !newTitle.trim() || !newSlug.trim()}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                Crea
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
