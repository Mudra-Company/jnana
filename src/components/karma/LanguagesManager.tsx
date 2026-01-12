import React, { useState, useRef, useEffect } from 'react';
import { Languages, Plus, Trash2, Check, X, Loader2, Edit2 } from 'lucide-react';
import { Button } from '../../../components/Button';
import { toast } from '../../hooks/use-toast';
import type { UserLanguage, LanguageProficiency } from '../../types/karma';

interface LanguagesManagerProps {
  languages: UserLanguage[];
  onAdd: (lang: Omit<UserLanguage, 'id' | 'userId' | 'createdAt'>) => Promise<any>;
  onUpdate: (id: string, updates: Partial<UserLanguage>) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  readOnly?: boolean;
}

const PROFICIENCY_LABELS: Record<LanguageProficiency, string> = {
  native: 'Madrelingua',
  fluent: 'Fluente',
  professional: 'Professionale',
  intermediate: 'Intermedio',
  basic: 'Base',
};

const PROFICIENCY_COLORS: Record<LanguageProficiency, string> = {
  native: 'bg-green-500',
  fluent: 'bg-blue-500',
  professional: 'bg-indigo-500',
  intermediate: 'bg-amber-500',
  basic: 'bg-gray-400',
};

const COMMON_LANGUAGES = [
  'Italiano', 'Inglese', 'Spagnolo', 'Francese', 'Tedesco', 
  'Portoghese', 'Cinese', 'Giapponese', 'Russo', 'Arabo'
];

export const LanguagesManager: React.FC<LanguagesManagerProps> = ({
  languages,
  onAdd,
  onUpdate,
  onRemove,
  readOnly = false,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);
  const editFormRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({
    language: '',
    proficiency: 'intermediate' as LanguageProficiency,
  });

  const resetForm = () => {
    setForm({
      language: '',
      proficiency: 'intermediate',
    });
  };

  // Scroll to edit form when editing starts
  useEffect(() => {
    if (editingId && editFormRef.current) {
      setShowHighlight(true);
      editFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const timer = setTimeout(() => setShowHighlight(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [editingId]);

  const handleAdd = async () => {
    if (!form.language.trim()) return;
    
    setIsSaving(true);
    try {
      await onAdd({
        language: form.language,
        proficiency: form.proficiency,
      });
      
      toast({ title: "Lingua salvata!", description: "La lingua è stata aggiunta al profilo." });
      resetForm();
      setIsAdding(false);
    } catch (error) {
      toast({ title: "Errore", description: "Impossibile salvare la lingua.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (lang: UserLanguage) => {
    setEditingId(lang.id);
    setForm({
      language: lang.language,
      proficiency: lang.proficiency,
    });
  };

  const handleUpdate = async () => {
    if (!editingId || !form.language.trim()) return;
    
    setIsSaving(true);
    try {
      await onUpdate(editingId, {
        language: form.language,
        proficiency: form.proficiency,
      });
      
      toast({ title: "Lingua aggiornata!", description: "Le modifiche sono state salvate." });
      setEditingId(null);
      resetForm();
    } catch (error) {
      toast({ title: "Errore", description: "Impossibile aggiornare la lingua.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleProficiencyChange = async (langId: string, newProficiency: LanguageProficiency) => {
    await onUpdate(langId, { proficiency: newProficiency });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Languages size={20} className="text-jnana-sage" />
          Lingue
        </h3>
        {!readOnly && !isAdding && (
          <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)}>
            <Plus size={16} className="mr-1" /> Aggiungi
          </Button>
        )}
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Lingua"
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
              list="language-suggestions"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
            <datalist id="language-suggestions">
              {COMMON_LANGUAGES.filter(l => 
                !languages.some(lang => lang.language.toLowerCase() === l.toLowerCase())
              ).map(lang => (
                <option key={lang} value={lang} />
              ))}
            </datalist>
          </div>
          <select
            value={form.proficiency}
            onChange={(e) => setForm({ ...form, proficiency: e.target.value as LanguageProficiency })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
          >
            {Object.entries(PROFICIENCY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={!form.language.trim() || isSaving}>
              {isSaving ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Check size={14} className="mr-1" />}
              {isSaving ? 'Salvataggio...' : 'Salva'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setIsAdding(false); resetForm(); }} disabled={isSaving}>
              <X size={14} className="mr-1" /> Annulla
            </Button>
          </div>
        </div>
      )}

      {/* Edit Form */}
      {editingId && (
        <div 
          ref={editFormRef}
          className={`mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl space-y-3 border-2 border-blue-400 dark:border-blue-600 transition-all duration-300 ${showHighlight ? 'ring-4 ring-blue-300 dark:ring-blue-700 ring-opacity-50' : ''}`}
        >
          <div className="flex items-center gap-2 mb-2 text-blue-700 dark:text-blue-300 text-sm font-medium">
            <Edit2 size={14} />
            Modifica lingua
          </div>
          <input
            type="text"
            placeholder="Lingua"
            value={form.language}
            onChange={(e) => setForm({ ...form, language: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
          />
          <select
            value={form.proficiency}
            onChange={(e) => setForm({ ...form, proficiency: e.target.value as LanguageProficiency })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
          >
            {Object.entries(PROFICIENCY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleUpdate} disabled={isSaving}>
              {isSaving ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Check size={14} className="mr-1" />}
              {isSaving ? 'Salvataggio...' : 'Aggiorna'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setEditingId(null); resetForm(); }} disabled={isSaving}>
              <X size={14} className="mr-1" /> Annulla
            </Button>
          </div>
        </div>
      )}

      {/* Languages List */}
      <div className="space-y-2">
        {languages.map((lang) => (
          <div
            key={lang.id}
            className={`flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl ${editingId === lang.id ? 'hidden' : ''}`}
          >
            <div className={`w-2 h-2 rounded-full ${PROFICIENCY_COLORS[lang.proficiency]}`} />
            <span className="flex-1 font-medium text-gray-900 dark:text-white">
              {lang.language}
            </span>
            {!readOnly ? (
              <>
                <select
                  value={lang.proficiency}
                  onChange={(e) => handleProficiencyChange(lang.id, e.target.value as LanguageProficiency)}
                  className="text-sm px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400"
                >
                  {Object.entries(PROFICIENCY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleEdit(lang)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => onRemove(lang.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </>
            ) : (
              <span className="text-sm text-gray-500">{PROFICIENCY_LABELS[lang.proficiency]}</span>
            )}
          </div>
        ))}

        {languages.length === 0 && !isAdding && (
          <p className="text-center text-gray-400 py-6 text-sm">
            {readOnly ? 'Nessuna lingua' : 'Nessuna lingua aggiunta'}
          </p>
        )}
      </div>
    </div>
  );
};
