import React, { useState } from 'react';
import { Building, Plus, X, Loader2 } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { CompanyProfile, User } from '../../types';
import { INDUSTRIES, SIZE_RANGES } from '../../constants';

interface CreateCompanyData {
  name: string;
  email?: string;
  industry?: string;
  size_range?: string;
  vat_number?: string;
  website?: string;
}

interface SuperAdminDashboardProps {
  companies: CompanyProfile[];
  users: User[];
  onImpersonate: (companyId: string) => void;
  onCreateCompany?: (data: CreateCompanyData) => Promise<boolean>;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ 
  companies, 
  users, 
  onImpersonate,
  onCreateCompany 
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [newSizeRange, setNewSizeRange] = useState('');
  const [newVatNumber, setNewVatNumber] = useState('');
  const [newWebsite, setNewWebsite] = useState('');

  const resetForm = () => {
    setNewName('');
    setNewEmail('');
    setNewIndustry('');
    setNewSizeRange('');
    setNewVatNumber('');
    setNewWebsite('');
  };

  const handleCreate = async () => {
    if (!newName.trim() || !onCreateCompany) return;
    
    setIsCreating(true);
    try {
      const success = await onCreateCompany({
        name: newName.trim(),
        email: newEmail.trim() || undefined,
        industry: newIndustry || undefined,
        size_range: newSizeRange || undefined,
        vat_number: newVatNumber.trim() || undefined,
        website: newWebsite.trim() || undefined,
      });
      
      if (success) {
        resetForm();
        setShowCreateModal(false);
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-brand font-bold text-gray-800 dark:text-white">Console Super Admin</h1>
        <p className="text-gray-500">Gestione multi-tenant e configurazione globale.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map(company => (
          <Card key={company.id} className="hover:shadow-lg transition-shadow border-t-4 border-t-amber-500">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                {company.logoUrl ? (
                  <img 
                    src={company.logoUrl} 
                    alt={company.name} 
                    className="w-full h-full object-contain p-1" 
                  />
                ) : (
                  <Building className="text-gray-500" />
                )}
              </div>
              <Button size="sm" onClick={() => onImpersonate(company.id)}>
                Impersona Admin
              </Button>
            </div>
            <h3 className="font-bold text-lg mb-1">{company.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{company.industry} • {company.sizeRange} dip.</p>
            <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700 pt-4">
              <div>
                <span className="block font-bold text-lg text-gray-800 dark:text-white">
                  {users.filter(u => u.companyId === company.id).length}
                </span>
                <span className="text-xs uppercase text-gray-400">Utenti</span>
              </div>
              <div>
                <span className="block font-bold text-lg text-green-600">
                  {users.filter(u => u.companyId === company.id && u.status === 'completed').length}
                </span>
                <span className="text-xs uppercase text-gray-400">Completati</span>
              </div>
            </div>
          </Card>
        ))}
        
        {/* Add Tenant Card */}
        <Card 
          className="border-dashed border-2 border-gray-300 dark:border-gray-600 bg-transparent flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[200px]" 
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={40} className="mb-2"/>
          <span className="font-bold">Aggiungi Tenant</span>
        </Card>
      </div>

      {/* Create Company Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Crea Nuova Azienda</h2>
              <button
                onClick={() => { setShowCreateModal(false); resetForm(); }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              {/* Company Name - Required */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome Azienda <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Es: Acme Corporation"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Contatto
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Es: admin@azienda.com"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Industry & Size - Side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Settore
                  </label>
                  <select
                    value={newIndustry}
                    onChange={(e) => setNewIndustry(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  >
                    <option value="">Seleziona...</option>
                    {INDUSTRIES.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dimensione
                  </label>
                  <select
                    value={newSizeRange}
                    onChange={(e) => setNewSizeRange(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  >
                    <option value="">Seleziona...</option>
                    {SIZE_RANGES.map(size => (
                      <option key={size} value={size}>{size} dipendenti</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* VAT & Website - Side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Partita IVA
                  </label>
                  <input
                    type="text"
                    value={newVatNumber}
                    onChange={(e) => setNewVatNumber(e.target.value)}
                    placeholder="IT12345678901"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sito Web
                  </label>
                  <input
                    type="text"
                    value={newWebsite}
                    onChange={(e) => setNewWebsite(e.target.value)}
                    placeholder="www.azienda.it"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
              <Button
                variant="outline"
                onClick={() => { setShowCreateModal(false); resetForm(); }}
                disabled={isCreating}
              >
                Annulla
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newName.trim() || isCreating}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                {isCreating ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Creazione...
                  </>
                ) : (
                  'Crea Azienda'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
