import React, { useState } from 'react';
import { GraduationCap, Plus, Trash2, Edit2, Check, X, Loader2 } from 'lucide-react';
import { Button } from '../../../components/Button';
import { toast } from '../../hooks/use-toast';
import type { UserEducation } from '../../types/karma';

interface EducationManagerProps {
  education: UserEducation[];
  onAdd: (edu: Omit<UserEducation, 'id' | 'userId' | 'createdAt'>) => Promise<any>;
  onUpdate: (id: string, updates: Partial<UserEducation>) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  readOnly?: boolean;
}

export const EducationManager: React.FC<EducationManagerProps> = ({
  education,
  onAdd,
  onUpdate,
  onRemove,
  readOnly = false,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    startYear: '',
    endYear: '',
    description: '',
  });

  const resetForm = () => {
    setForm({
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startYear: '',
      endYear: '',
      description: '',
    });
  };

  const handleAdd = async () => {
    if (!form.institution.trim() || !form.degree.trim()) return;
    
    setIsSaving(true);
    try {
      await onAdd({
        institution: form.institution,
        degree: form.degree,
        fieldOfStudy: form.fieldOfStudy || undefined,
        startYear: form.startYear ? parseInt(form.startYear) : undefined,
        endYear: form.endYear ? parseInt(form.endYear) : undefined,
        description: form.description || undefined,
        sortOrder: 0,
      });
      
      toast({ title: "Formazione salvata!", description: "Il titolo di studio è stato aggiunto al profilo." });
      resetForm();
      setIsAdding(false);
    } catch (error) {
      toast({ title: "Errore", description: "Impossibile salvare la formazione.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (edu: UserEducation) => {
    setEditingId(edu.id);
    setForm({
      institution: edu.institution,
      degree: edu.degree,
      fieldOfStudy: edu.fieldOfStudy || '',
      startYear: edu.startYear?.toString() || '',
      endYear: edu.endYear?.toString() || '',
      description: edu.description || '',
    });
  };

  const handleUpdate = async () => {
    if (!editingId || !form.institution.trim() || !form.degree.trim()) return;
    
    setIsSaving(true);
    try {
      await onUpdate(editingId, {
        institution: form.institution,
        degree: form.degree,
        fieldOfStudy: form.fieldOfStudy || undefined,
        startYear: form.startYear ? parseInt(form.startYear) : undefined,
        endYear: form.endYear ? parseInt(form.endYear) : undefined,
        description: form.description || undefined,
      });
      
      toast({ title: "Formazione aggiornata!", description: "Le modifiche sono state salvate." });
      setEditingId(null);
      resetForm();
    } catch (error) {
      toast({ title: "Errore", description: "Impossibile aggiornare la formazione.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <GraduationCap size={20} className="text-jnana-sage" />
          Formazione
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
          <input
            type="text"
            placeholder="Istituto *"
            value={form.institution}
            onChange={(e) => setForm({ ...form, institution: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Titolo di studio *"
              value={form.degree}
              onChange={(e) => setForm({ ...form, degree: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
            <input
              type="text"
              placeholder="Campo di studio"
              value={form.fieldOfStudy}
              onChange={(e) => setForm({ ...form, fieldOfStudy: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.startYear}
              onChange={(e) => setForm({ ...form, startYear: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            >
              <option value="">Anno inizio</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select
              value={form.endYear}
              onChange={(e) => setForm({ ...form, endYear: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            >
              <option value="">Anno fine</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={!form.institution.trim() || !form.degree.trim() || isSaving}>
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
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl space-y-3 border border-blue-200 dark:border-blue-800">
          <input
            type="text"
            placeholder="Istituto *"
            value={form.institution}
            onChange={(e) => setForm({ ...form, institution: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Titolo di studio *"
              value={form.degree}
              onChange={(e) => setForm({ ...form, degree: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
            <input
              type="text"
              placeholder="Campo di studio"
              value={form.fieldOfStudy}
              onChange={(e) => setForm({ ...form, fieldOfStudy: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.startYear}
              onChange={(e) => setForm({ ...form, startYear: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            >
              <option value="">Anno inizio</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select
              value={form.endYear}
              onChange={(e) => setForm({ ...form, endYear: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            >
              <option value="">Anno fine</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
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

      {/* Education List */}
      <div className="space-y-3">
        {education.map((edu) => (
          <div
            key={edu.id}
            className={`p-4 bg-gray-50 dark:bg-gray-800 rounded-xl ${editingId === edu.id ? 'hidden' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                <GraduationCap size={18} className="text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-white">{edu.degree}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{edu.institution}</p>
                {edu.fieldOfStudy && (
                  <p className="text-sm text-gray-500">{edu.fieldOfStudy}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {edu.startYear && edu.endYear 
                    ? `${edu.startYear} - ${edu.endYear}`
                    : edu.endYear 
                      ? `${edu.endYear}`
                      : ''
                  }
                </p>
              </div>
              {!readOnly && (
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(edu)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => onRemove(edu.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {education.length === 0 && !isAdding && (
          <p className="text-center text-gray-400 py-6 text-sm">
            {readOnly ? 'Nessuna formazione' : 'Nessuna formazione aggiunta'}
          </p>
        )}
      </div>
    </div>
  );
};
