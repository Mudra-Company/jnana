import React, { useState } from 'react';
import { Briefcase, Plus, Trash2, Edit2, Check, X, Building2 } from 'lucide-react';
import { Button } from '../../../components/Button';
import type { UserExperience } from '../../types/karma';

interface ExperienceManagerProps {
  experiences: UserExperience[];
  onAdd: (exp: Omit<UserExperience, 'id' | 'userId' | 'createdAt'>) => Promise<any>;
  onUpdate: (id: string, updates: Partial<UserExperience>) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  readOnly?: boolean;
}

export const ExperienceManager: React.FC<ExperienceManagerProps> = ({
  experiences,
  onAdd,
  onUpdate,
  onRemove,
  readOnly = false,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    company: '',
    role: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: '',
    location: '',
  });

  const resetForm = () => {
    setForm({
      company: '',
      role: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      description: '',
      location: '',
    });
  };

  const handleAdd = async () => {
    if (!form.company.trim() || !form.role.trim()) return;
    
    await onAdd({
      company: form.company,
      role: form.role,
      startDate: form.startDate || undefined,
      endDate: form.isCurrent ? undefined : form.endDate || undefined,
      isCurrent: form.isCurrent,
      description: form.description || undefined,
      location: form.location || undefined,
      sortOrder: 0,
    });
    
    resetForm();
    setIsAdding(false);
  };

  const handleEdit = (exp: UserExperience) => {
    setEditingId(exp.id);
    setForm({
      company: exp.company,
      role: exp.role,
      startDate: exp.startDate || '',
      endDate: exp.endDate || '',
      isCurrent: exp.isCurrent || false,
      description: exp.description || '',
      location: exp.location || '',
    });
  };

  const handleUpdate = async () => {
    if (!editingId || !form.company.trim() || !form.role.trim()) return;
    
    await onUpdate(editingId, {
      company: form.company,
      role: form.role,
      startDate: form.startDate || undefined,
      endDate: form.isCurrent ? undefined : form.endDate || undefined,
      isCurrent: form.isCurrent,
      description: form.description || undefined,
      location: form.location || undefined,
    });
    
    setEditingId(null);
    resetForm();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Briefcase size={20} className="text-jnana-sage" />
          Esperienze Lavorative
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
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Azienda *"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
            <input
              type="text"
              placeholder="Ruolo *"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="month"
              placeholder="Data inizio"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
            {!form.isCurrent && (
              <input
                type="month"
                placeholder="Data fine"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={form.isCurrent}
              onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })}
              className="rounded border-gray-300"
            />
            Lavoro attualmente qui
          </label>
          <input
            type="text"
            placeholder="Località (opzionale)"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
          />
          <textarea
            placeholder="Descrizione (opzionale)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm resize-none"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={!form.company.trim() || !form.role.trim()}>
              <Check size={14} className="mr-1" /> Salva
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setIsAdding(false); resetForm(); }}>
              <X size={14} className="mr-1" /> Annulla
            </Button>
          </div>
        </div>
      )}

      {/* Edit Form (inline) */}
      {editingId && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl space-y-3 border border-blue-200 dark:border-blue-800">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Azienda *"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
            <input
              type="text"
              placeholder="Ruolo *"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="month"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
            {!form.isCurrent && (
              <input
                type="month"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={form.isCurrent}
              onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })}
              className="rounded border-gray-300"
            />
            Lavoro attualmente qui
          </label>
          <textarea
            placeholder="Descrizione"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm resize-none"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleUpdate}>
              <Check size={14} className="mr-1" /> Aggiorna
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setEditingId(null); resetForm(); }}>
              <X size={14} className="mr-1" /> Annulla
            </Button>
          </div>
        </div>
      )}

      {/* Experiences List */}
      <div className="space-y-3">
        {experiences.map((exp) => (
          <div
            key={exp.id}
            className={`p-4 bg-gray-50 dark:bg-gray-800 rounded-xl ${editingId === exp.id ? 'hidden' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Building2 size={18} className="text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-white">{exp.role}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{exp.company}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(exp.startDate)} - {exp.isCurrent ? 'Presente' : formatDate(exp.endDate)}
                  {exp.location && ` · ${exp.location}`}
                </p>
                {exp.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{exp.description}</p>
                )}
              </div>
              {!readOnly && (
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(exp)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => onRemove(exp.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {experiences.length === 0 && !isAdding && (
          <p className="text-center text-gray-400 py-6 text-sm">
            {readOnly ? 'Nessuna esperienza lavorativa' : 'Nessuna esperienza aggiunta'}
          </p>
        )}
      </div>
    </div>
  );
};
