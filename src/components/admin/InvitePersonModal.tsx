import React, { useState, useEffect } from 'react';
import { UserPlus, Loader2, X, Copy, Check, Mail } from 'lucide-react';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { supabase } from '../../integrations/supabase/client';
import { toast } from '../../hooks/use-toast';
import { useCompanyRoles } from '../../hooks/useCompanyRoles';

interface InvitePersonModalProps {
  isOpen: boolean;
  companyId: string;
  companyName: string;
  /** Pre-selected role id when opened from a role/position context. */
  defaultRoleId?: string | null;
  /** Pre-selected org node id when opened from org chart. */
  defaultOrgNodeId?: string | null;
  onClose: () => void;
  onInvited?: (memberId: string) => void;
}

export const InvitePersonModal: React.FC<InvitePersonModalProps> = ({
  isOpen,
  companyId,
  companyName,
  defaultRoleId = null,
  defaultOrgNodeId = null,
  onClose,
  onInvited,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState<string | null>(defaultRoleId);
  const [personalMessage, setPersonalMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptUrl, setAcceptUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { roles, fetchRoles } = useCompanyRoles();

  useEffect(() => {
    if (isOpen) {
      fetchRoles(companyId);
      setRoleId(defaultRoleId);
      setAcceptUrl(null);
      setCopied(false);
    }
  }, [isOpen, companyId, defaultRoleId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !firstName) return;
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-invite', {
        body: {
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          companyId,
          roleId: roleId || undefined,
          orgNodeId: defaultOrgNodeId || undefined,
          personalMessage: personalMessage.trim() || undefined,
        },
      });
      if (error || data?.error) {
        const reason = data?.error ?? error?.message ?? 'unknown';
        toast({
          title: 'Errore invito',
          description:
            reason === 'already_member'
              ? 'Questa persona è già membro o invitata.'
              : reason === 'forbidden'
              ? 'Non hai i permessi per invitare in questa azienda.'
              : `Impossibile creare l'invito (${reason}).`,
          variant: 'destructive',
        });
        return;
      }
      setAcceptUrl(data.acceptUrl);
      toast({
        title: 'Invito inviato ✉️',
        description: `Email inviata a ${email}. Scade tra 14 giorni.`,
      });
      onInvited?.(data.memberId);
    } catch (err: any) {
      toast({
        title: 'Errore',
        description: err?.message ?? 'Errore durante l\'invio dell\'invito',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyLink = async () => {
    if (!acceptUrl) return;
    await navigator.clipboard.writeText(acceptUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg animate-scale-in">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-jnana-sage/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-jnana-sage" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Invita una persona</h3>
              <p className="text-sm text-gray-500">in {companyName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {acceptUrl ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                Invito creato con successo. La persona riceverà un'email con istruzioni per
                creare l'account.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                Link diretto (valido 14 giorni)
              </label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={acceptUrl}
                  className="flex-1 px-3 py-2 text-xs border rounded-lg bg-gray-50 dark:bg-gray-800"
                />
                <Button variant="ghost" onClick={copyLink} className="!px-3">
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={onClose}>Chiudi</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Nome *</label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-jnana-sage/20 focus:border-jnana-sage outline-none"
                  placeholder="Mario"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cognome</label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-jnana-sage/20 focus:border-jnana-sage outline-none"
                  placeholder="Rossi"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-jnana-sage/20 focus:border-jnana-sage outline-none"
                  placeholder="mario.rossi@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Ruolo (opzionale)
              </label>
              <select
                value={roleId ?? ''}
                onChange={(e) => setRoleId(e.target.value || null)}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
              >
                <option value="">— Nessun ruolo specifico —</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
              {roleId && (
                <p className="mt-1 text-xs text-gray-500">
                  Al momento dell'accettazione la persona sarà assegnata a questo ruolo.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Messaggio personale (opzionale)
              </label>
              <textarea
                value={personalMessage}
                onChange={(e) => setPersonalMessage(e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-jnana-sage/20 focus:border-jnana-sage outline-none resize-none"
                placeholder="Ciao Mario, ti aspettiamo nel nostro team..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Annulla
              </Button>
              <Button type="submit" disabled={isSubmitting || !email || !firstName}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Invio...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" /> Invia invito
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};
