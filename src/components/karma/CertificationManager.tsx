import React, { useState } from 'react';
import { Award, Plus, Trash2, Edit2, Check, X, ExternalLink } from 'lucide-react';
import { Button } from '../../../components/Button';
import type { UserCertification } from '../../types/karma';

interface CertificationManagerProps {
  certifications: UserCertification[];
  onAdd: (cert: Omit<UserCertification, 'id' | 'userId' | 'createdAt'>) => Promise<any>;
  onUpdate: (id: string, updates: Partial<UserCertification>) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  readOnly?: boolean;
}

export const CertificationManager: React.FC<CertificationManagerProps> = ({
  certifications,
  onAdd,
  onUpdate,
  onRemove,
  readOnly = false,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    issuingOrganization: '',
    issueDate: '',
    expiryDate: '',
    credentialId: '',
    credentialUrl: '',
  });

  const resetForm = () => {
    setForm({
      name: '',
      issuingOrganization: '',
      issueDate: '',
      expiryDate: '',
      credentialId: '',
      credentialUrl: '',
    });
  };

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    
    await onAdd({
      name: form.name,
      issuingOrganization: form.issuingOrganization || undefined,
      issueDate: form.issueDate || undefined,
      expiryDate: form.expiryDate || undefined,
      credentialId: form.credentialId || undefined,
      credentialUrl: form.credentialUrl || undefined,
    });
    
    resetForm();
    setIsAdding(false);
  };

  const handleEdit = (cert: UserCertification) => {
    setEditingId(cert.id);
    setForm({
      name: cert.name,
      issuingOrganization: cert.issuingOrganization || '',
      issueDate: cert.issueDate || '',
      expiryDate: cert.expiryDate || '',
      credentialId: cert.credentialId || '',
      credentialUrl: cert.credentialUrl || '',
    });
  };

  const handleUpdate = async () => {
    if (!editingId || !form.name.trim()) return;
    
    await onUpdate(editingId, {
      name: form.name,
      issuingOrganization: form.issuingOrganization || undefined,
      issueDate: form.issueDate || undefined,
      expiryDate: form.expiryDate || undefined,
      credentialId: form.credentialId || undefined,
      credentialUrl: form.credentialUrl || undefined,
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
          <Award size={20} className="text-jnana-sage" />
          Certificazioni
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
            placeholder="Nome certificazione *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
          />
          <input
            type="text"
            placeholder="Ente emittente"
            value={form.issuingOrganization}
            onChange={(e) => setForm({ ...form, issuingOrganization: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Data emissione</label>
              <input
                type="date"
                value={form.issueDate}
                onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Scadenza (opzionale)</label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>
          <input
            type="url"
            placeholder="URL credenziale (opzionale)"
            value={form.credentialUrl}
            onChange={(e) => setForm({ ...form, credentialUrl: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={!form.name.trim()}>
              <Check size={14} className="mr-1" /> Salva
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setIsAdding(false); resetForm(); }}>
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
            placeholder="Nome certificazione *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
          />
          <input
            type="text"
            placeholder="Ente emittente"
            value={form.issuingOrganization}
            onChange={(e) => setForm({ ...form, issuingOrganization: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
          />
          <input
            type="url"
            placeholder="URL credenziale"
            value={form.credentialUrl}
            onChange={(e) => setForm({ ...form, credentialUrl: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
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

      {/* Certifications List */}
      <div className="space-y-3">
        {certifications.map((cert) => (
          <div
            key={cert.id}
            className={`p-4 bg-gray-50 dark:bg-gray-800 rounded-xl ${editingId === cert.id ? 'hidden' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <Award size={18} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-white">{cert.name}</h4>
                {cert.issuingOrganization && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{cert.issuingOrganization}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(cert.issueDate)}
                  {cert.expiryDate && ` · Scade: ${formatDate(cert.expiryDate)}`}
                </p>
                {cert.credentialUrl && (
                  <a
                    href={cert.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-jnana-sage hover:underline mt-1"
                  >
                    Vedi credenziale <ExternalLink size={10} />
                  </a>
                )}
              </div>
              {!readOnly && (
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(cert)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => onRemove(cert.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {certifications.length === 0 && !isAdding && (
          <p className="text-center text-gray-400 py-6 text-sm">
            {readOnly ? 'Nessuna certificazione' : 'Nessuna certificazione aggiunta'}
          </p>
        )}
      </div>
    </div>
  );
};
