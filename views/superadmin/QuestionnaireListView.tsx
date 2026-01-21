import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Copy, Trash2, Eye, EyeOff, ClipboardList, 
  List, MessageSquare, Layers, Search, FileText, CheckCircle2 
} from 'lucide-react';
import { useQuestionnaires } from '../../src/hooks/useQuestionnaires';
import { useToast } from '../../src/hooks/use-toast';
import { Card } from '../../components/Card';
import type { QuestionnaireListItem, QuestionnaireFilter, QuestionnaireUIStyle } from '../../src/types/questionnaire';

interface QuestionnaireListViewProps {
  onBack: () => void;
  onEdit: (id: string) => void;
}

const UI_STYLE_ICONS: Record<QuestionnaireUIStyle, React.ReactNode> = {
  step: <List size={20} />,
  chat: <MessageSquare size={20} />,
  swipe: <Layers size={20} />,
};

const UI_STYLE_LABELS: Record<QuestionnaireUIStyle, string> = {
  step: 'Step Form',
  chat: 'Chat Style',
  swipe: 'Swipe Cards',
};

const UI_STYLE_COLORS: Record<QuestionnaireUIStyle, { bg: string; text: string }> = {
  step: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  chat: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
  swipe: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400' },
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

  // Calculate stats
  const stats = {
    total: questionnaires.length,
    published: questionnaires.filter(q => q.isPublished).length,
    drafts: questionnaires.filter(q => !q.isPublished).length,
    system: questionnaires.filter(q => q.isSystem).length,
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 rounded-3xl p-8 mb-8 text-white shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack} 
              className="text-white/70 hover:text-white transition-colors text-sm"
            >
              ← Dashboard
            </button>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all border border-white/30 font-medium"
          >
            <Plus size={20} />
            Nuovo Questionario
          </button>
        </div>

        <div className="flex items-center gap-5 mt-6">
          <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
            <ClipboardList className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Questionnaire Manager</h1>
            <p className="text-white/70 mt-1">Gestisci questionari dinamici, scoring e stili di visualizzazione</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-white/70 text-sm">Totali</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="text-3xl font-bold text-emerald-300">{stats.published}</div>
            <div className="text-white/70 text-sm">Pubblicati</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="text-3xl font-bold text-amber-300">{stats.drafts}</div>
            <div className="text-white/70 text-sm">Bozze</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="text-3xl font-bold text-blue-300">{stats.system}</div>
            <div className="text-white/70 text-sm">Sistema</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Cerca questionari..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-800 border-0 rounded-2xl shadow-soft text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-indigo-500/30 transition-all"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-2xl p-1.5 shadow-soft">
          {(['all', 'published', 'draft', 'system'] as QuestionnaireFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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
        <div className="text-center py-16">
          <div className="animate-spin w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Caricamento...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredQuestionnaires.length === 0 && (
        <Card padding="xl" className="text-center">
          <div className="p-6 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl w-24 h-24 mx-auto flex items-center justify-center mb-6">
            <FileText size={40} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Nessun questionario trovato</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {filter !== 'all' ? 'Prova a cambiare i filtri o ' : ''}
            Inizia creando il tuo primo questionario per raccogliere dati strutturati
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            <Plus size={20} />
            Crea Questionario
          </button>
        </Card>
      )}

      {/* Questionnaire Grid */}
      {!loading && filteredQuestionnaires.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredQuestionnaires.map(q => (
            <Card
              key={q.id}
              padding="none"
              className="overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Card Header with gradient accent */}
              <div className={`h-2 ${q.isPublished ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`} />
              
              <div className="p-5">
                {/* Icon and Title */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${UI_STYLE_COLORS[q.uiStyle].bg} ${UI_STYLE_COLORS[q.uiStyle].text}`}>
                      {UI_STYLE_ICONS[q.uiStyle]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {q.title}
                      </h3>
                      <p className="text-xs text-muted-foreground font-mono">{q.slug}</p>
                    </div>
                  </div>
                  {q.isSystem && (
                    <span className="text-xs px-2.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full font-medium">
                      Sistema
                    </span>
                  )}
                </div>

                {/* Description */}
                {q.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{q.description}</p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Layers size={14} />
                    {q.sectionCount}
                  </span>
                  <span>•</span>
                  <span>{q.questionCount} domande</span>
                  <span>•</span>
                  <span className="font-mono text-xs">v{q.version}</span>
                </div>

                {/* Status and Style badges */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium ${
                    q.isPublished 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {q.isPublished ? <CheckCircle2 size={12} /> : <EyeOff size={12} />}
                    {q.isPublished ? 'Pubblicato' : 'Bozza'}
                  </span>
                  <span className={`text-xs px-2.5 py-1.5 rounded-full ${UI_STYLE_COLORS[q.uiStyle].bg} ${UI_STYLE_COLORS[q.uiStyle].text} font-medium`}>
                    {UI_STYLE_LABELS[q.uiStyle]}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-border/50">
                  <button
                    onClick={() => onEdit(q.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm rounded-xl font-medium hover:shadow-lg transition-all"
                  >
                    <Edit size={14} />
                    Modifica
                  </button>
                  <button
                    onClick={() => handleDuplicate(q.id)}
                    className="p-2.5 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors"
                    title="Duplica"
                  >
                    <Copy size={18} />
                  </button>
                  <button
                    onClick={() => handleTogglePublish(q.id, q.isPublished)}
                    className={`p-2.5 rounded-xl transition-colors ${
                      q.isPublished 
                        ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20' 
                        : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                    }`}
                    title={q.isPublished ? 'Disattiva' : 'Pubblica'}
                  >
                    {q.isPublished ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  {!q.isSystem && (
                    <button
                      onClick={() => handleDelete(q.id, q.title, q.isSystem)}
                      className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                      title="Elimina"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <Card padding="none" className="w-full max-w-lg overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 text-white">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Plus size={20} />
                </div>
                Nuovo Questionario
              </h2>
              <p className="text-white/70 mt-1 text-sm">Crea un nuovo questionario dinamico</p>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Titolo *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => {
                    setNewTitle(e.target.value);
                    setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                  }}
                  placeholder="es. Test di Engagement"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 border-0 rounded-xl text-foreground focus:ring-2 focus:ring-indigo-500/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Slug (URL) *</label>
                <input
                  type="text"
                  value={newSlug}
                  onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="es. test-engagement"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 border-0 rounded-xl text-foreground font-mono text-sm focus:ring-2 focus:ring-indigo-500/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Stile UI</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['step', 'chat', 'swipe'] as QuestionnaireUIStyle[]).map(style => (
                    <button
                      key={style}
                      onClick={() => setNewUiStyle(style)}
                      className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                        newUiStyle === style 
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-lg' 
                          : 'border-slate-200 dark:border-gray-700 hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className={`p-3 rounded-xl ${
                        newUiStyle === style 
                          ? `${UI_STYLE_COLORS[style].bg} ${UI_STYLE_COLORS[style].text}` 
                          : 'bg-slate-100 dark:bg-gray-700 text-muted-foreground'
                      }`}>
                        {UI_STYLE_ICONS[style]}
                      </div>
                      <span className={`text-sm font-medium ${newUiStyle === style ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground'}`}>
                        {UI_STYLE_LABELS[style]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-6 bg-slate-50 dark:bg-gray-800/50 border-t border-border/50">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-3 rounded-xl text-foreground font-medium hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleCreate}
                disabled={loading || !newTitle.trim() || !newSlug.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Crea Questionario
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
