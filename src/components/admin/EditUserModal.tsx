import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { User, Mail, Briefcase, X, Loader2 } from 'lucide-react';
import { useCompanyMembers } from '../../hooks/useCompanyMembers';
import { toast } from '../../hooks/use-toast';

interface EditUserModalProps {
  isOpen: boolean;
  user: {
    id: string;
    memberId?: string;
    firstName: string;
    lastName: string;
    email: string;
    jobTitle?: string;
    status: string;
  } | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ 
  isOpen, 
  user, 
  onClose, 
  onSaved 
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const { updateCompanyMember } = useCompanyMembers();

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setJobTitle(user.jobTitle || '');
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSave = async () => {
    if (!user.memberId) {
      toast({ title: 'Errore', description: 'ID membro non trovato', variant: 'destructive' });
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateCompanyMember(user.memberId, {
        placeholder_first_name: firstName,
        placeholder_last_name: lastName,
        placeholder_email: email,
        job_title: jobTitle || undefined,
      });

      if (result.success) {
        toast({ title: 'Salvato! ✓', description: 'Dati utente aggiornati con successo' });
        await onSaved();
        onClose();
      } else {
        toast({ title: 'Errore', description: result.error || 'Impossibile salvare', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Errore', description: 'Si è verificato un errore', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Only allow editing placeholder users (pending/invited status, not yet registered)
  const canEditEmail = user.status === 'pending' || user.status === 'invited';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md animate-scale-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Modifica Utente</h3>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Nome e Cognome */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-jnana-sage/20"
                  placeholder="Nome"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cognome
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-jnana-sage/20"
                placeholder="Cognome"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!canEditEmail}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-jnana-sage/20 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="email@esempio.com"
              />
            </div>
            {!canEditEmail && (
              <p className="text-xs text-gray-500 mt-1">
                L'email non può essere modificata per utenti già registrati
              </p>
            )}
          </div>

          {/* Posizione */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Posizione / Job Title
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-jnana-sage/20"
                placeholder="Es. Project Manager"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              fullWidth 
              onClick={handleSave} 
              disabled={isSaving || !firstName || !lastName || !email}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                'Salva Modifiche'
              )}
            </Button>
            <Button variant="ghost" onClick={onClose} disabled={isSaving}>
              Annulla
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
