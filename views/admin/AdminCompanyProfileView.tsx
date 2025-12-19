import React, { useState, useEffect } from 'react';
import { Save, ImageIcon, Link as LinkIcon, MapPin, Hash, Heart, Plus, X } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { CompanyProfile } from '../../types';
import { INDUSTRIES } from '../../constants';

interface AdminCompanyProfileViewProps {
  company: CompanyProfile;
  onUpdate: (c: CompanyProfile) => void;
}

export const AdminCompanyProfileView: React.FC<AdminCompanyProfileViewProps> = ({ company, onUpdate }) => {
  // Initialize with company data, ensuring arrays are present
  const [formData, setFormData] = useState<CompanyProfile>(company);
  const [newValue, setNewValue] = useState('');

  // Update local state if the prop changes (e.g. after a save or external update)
  useEffect(() => {
      setFormData(company);
  }, [company]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    alert("Profilo aziendale aggiornato con successo!");
  };

  const addValue = (e?: React.MouseEvent | React.KeyboardEvent) => {
    // Prevent form submission or other default behaviors
    if (e) e.preventDefault();
    
    const trimmedVal = newValue.trim();
    if (!trimmedVal) return;

    const currentValues = formData.cultureValues || [];
    
    // Check for duplicates (case-insensitive)
    if (currentValues.some(v => v.toLowerCase() === trimmedVal.toLowerCase())) {
        alert("Questo valore è già presente nella lista.");
        return;
    }

    setFormData(prev => ({
        ...prev,
        cultureValues: [...(prev.cultureValues || []), trimmedVal]
    }));
    setNewValue('');
  };

  const removeValue = (valToRemove: string) => {
    setFormData(prev => ({
        ...prev,
        cultureValues: prev.cultureValues?.filter(v => v !== valToRemove) || []
    }));
  };

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in pb-24">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-brand font-bold text-jnana-text dark:text-gray-100">Impostazioni Azienda</h1>
          <p className="text-gray-600">Gestisci i dati anagrafici e l'identità visiva.</p>
        </div>
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save size={18} /> Salva Modifiche
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* LEFT COLUMN: IDENTITY & VISUALS */}
        <div className="space-y-6">
          <Card className="flex flex-col items-center text-center p-8">
             <div className="w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center text-gray-400 mb-6 overflow-hidden shadow-inner relative group">
                {formData.logoUrl ? (
                  <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={48} />
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <span className="text-white text-xs font-bold">Modifica URL</span>
                </div>
             </div>
             
             <div className="w-full space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 text-left">Nome Azienda</label>
                  <input 
                    className="w-full p-3 border rounded-xl bg-white text-gray-900 border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:ring-2 focus:ring-jnana-sage outline-none"
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 text-left">URL Logo</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input 
                      className="w-full pl-9 p-3 border rounded-xl bg-white text-gray-900 border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-xs focus:ring-2 focus:ring-jnana-sage outline-none"
                      value={formData.logoUrl || ''} 
                      onChange={e => setFormData({...formData, logoUrl: e.target.value})} 
                      placeholder="https://..."
                    />
                  </div>
                </div>
             </div>
          </Card>

          <Card>
             <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2"><MapPin size={18} className="text-jnana-sage"/> Sede & Contatti</h3>
             <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Indirizzo Sede Legale</label>
                  <input 
                    className="w-full p-3 border rounded-xl bg-white text-gray-900 border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm focus:ring-2 focus:ring-jnana-sage outline-none"
                    value={formData.address || ''} 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                    placeholder="Via Roma 1, Milano"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sito Web</label>
                  <input 
                    className="w-full p-3 border rounded-xl bg-white text-gray-900 border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm focus:ring-2 focus:ring-jnana-sage outline-none"
                    value={formData.website || ''} 
                    onChange={e => setFormData({...formData, website: e.target.value})} 
                    placeholder="www.azienda.it"
                  />
                </div>
             </div>
          </Card>
        </div>

        {/* MIDDLE COLUMN: REGISTRY & DATA */}
        <div className="space-y-6 lg:col-span-2">
           <Card>
              <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2"><Hash size={18} className="text-jnana-sage"/> Dati Anagrafici</h3>
              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Settore Industriale</label>
                    <select 
                      className="w-full p-3 border rounded-xl bg-white text-gray-900 border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm focus:ring-2 focus:ring-jnana-sage outline-none"
                      value={formData.industry} 
                      onChange={e => setFormData({...formData, industry: e.target.value})}
                    >
                      {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dimensione</label>
                    <select 
                      className="w-full p-3 border rounded-xl bg-white text-gray-900 border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm focus:ring-2 focus:ring-jnana-sage outline-none"
                      value={formData.sizeRange} 
                      onChange={e => setFormData({...formData, sizeRange: e.target.value})}
                    >
                      <option value="1-10">1-10 dipendenti</option>
                      <option value="10-50">10-50 dipendenti</option>
                      <option value="50-100">50-100 dipendenti</option>
                      <option value="100-250">100-250 dipendenti</option>
                      <option value="250-500">250-500 dipendenti</option>
                      <option value="500+">Oltre 500</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Anno Fondazione</label>
                    <input 
                      type="number"
                      className="w-full p-3 border rounded-xl bg-white text-gray-900 border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm focus:ring-2 focus:ring-jnana-sage outline-none"
                      value={formData.foundationYear || ''} 
                      onChange={e => setFormData({...formData, foundationYear: parseInt(e.target.value)})} 
                    />
                 </div>
                 <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Partita IVA</label>
                    <input 
                      className="w-full p-3 border rounded-xl bg-white text-gray-900 border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm focus:ring-2 focus:ring-jnana-sage outline-none font-mono"
                      value={formData.vatNumber || ''} 
                      onChange={e => setFormData({...formData, vatNumber: e.target.value})} 
                      placeholder="IT..."
                    />
                 </div>
              </div>
           </Card>

           {/* DNA CULTURALE (DECLARED VALUES) - NEW SECTION */}
           <Card>
              <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2"><Heart size={18} className="text-jnana-sage"/> DNA Culturale (Valori Dichiarati)</h3>
              <p className="text-xs text-gray-500 mb-4">Definisci i valori core della tua azienda. Questi verranno confrontati con i valori reali emersi dai leader nell'Identity Hub.</p>
              
              <div className="flex gap-2 mb-4">
                  <input 
                      className="flex-1 p-3 border rounded-xl bg-white text-gray-900 border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 text-sm focus:ring-2 focus:ring-jnana-sage outline-none"
                      placeholder="Aggiungi un valore (es. Innovazione, Trasparenza...)"
                      value={newValue}
                      onChange={e => setNewValue(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addValue(e)}
                  />
                  <Button type="button" onClick={addValue} className="px-4"><Plus size={20}/></Button>
              </div>

              <div className="flex flex-wrap gap-2">
                  {formData.cultureValues && formData.cultureValues.length > 0 ? (
                      formData.cultureValues.map(val => (
                          <span key={val} className="px-3 py-2 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg text-sm font-bold border border-blue-100 dark:border-blue-800 flex items-center gap-2 animate-scale-in">
                              {val}
                              <button 
                                type="button" 
                                onClick={() => removeValue(val)} 
                                className="text-blue-400 hover:text-red-500 transition-colors p-1 hover:bg-blue-100 rounded-full"
                              >
                                  <X size={14}/>
                              </button>
                          </span>
                      ))
                  ) : (
                      <span className="text-gray-400 text-sm italic py-2">Nessun valore definito. Aggiungine alcuni per iniziare l'analisi culturale.</span>
                  )}
              </div>
           </Card>

           <Card className="flex-1 flex flex-col">
              <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2">Descrizione Pubblica</h3>
              <p className="text-xs text-gray-500 mb-3">Questa descrizione verrà utilizzata per generare contesti nelle simulazioni.</p>
              <textarea 
                className="w-full p-4 border rounded-xl bg-white text-gray-900 border-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 flex-1 min-h-[150px] focus:ring-2 focus:ring-jnana-sage outline-none resize-none leading-relaxed"
                value={formData.description || ''} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                placeholder="Descrivi la missione e la visione dell'azienda..."
              />
           </Card>
        </div>
      </div>
    </div>
  );
};