import React, { useEffect, useState } from 'react';
import { Building, ArrowRight, AlertCircle, CheckCircle2, Briefcase, Loader2 } from 'lucide-react';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { supabase } from '../../integrations/supabase/client';

interface InviteAcceptViewProps {
  onProceedToSignup: () => void;
}

type ValidatePayload = {
  valid: boolean;
  reason?: string;
  member?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    jobTitle?: string | null;
    personalMessage?: string | null;
  };
  company?: { id: string; name: string; logo_url?: string | null };
  role?: { id: string; title: string } | null;
};

/**
 * Public page reached via /invite/accept?token=...
 * - Validates the signed invite token via the validate-invite edge function.
 * - On success, stores invite context in localStorage and routes to signup.
 * - AuthView pre-fills email/name from the stored context.
 * - After signup, App.tsx detects the token and calls accept-invite.
 */
export const InviteAcceptView: React.FC<InviteAcceptViewProps> = ({ onProceedToSignup }) => {
  const [state, setState] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const [data, setData] = useState<ValidatePayload | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) {
      setState('invalid');
      setData({ valid: false, reason: 'missing_token' });
      return;
    }

    (async () => {
      try {
        const { data: res, error } = await supabase.functions.invoke('validate-invite', {
          body: { token },
        });
        if (error || !res?.valid) {
          setData((res as ValidatePayload) || { valid: false, reason: 'error' });
          setState('invalid');
          return;
        }
        const payload = res as ValidatePayload;
        // Persist invite context (used by AuthView for prefill + App.tsx for accept-invite)
        localStorage.setItem(
          'pendingInvite',
          JSON.stringify({
            inviteId: payload.member!.id,
            companyId: payload.company!.id,
            companyName: payload.company!.name,
            token,
          }),
        );
        // Force JNANA signup intent
        localStorage.setItem('auth_intent', 'jnana');
        setData(payload);
        setState('valid');
      } catch (e) {
        console.error('validate-invite failed', e);
        setState('invalid');
        setData({ valid: false, reason: 'network_error' });
      }
    })();
  }, []);

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-jnana-bg">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-jnana-charcoal mb-4" />
          <p className="text-jnana-text">Verifico l'invito…</p>
        </div>
      </div>
    );
  }

  if (state === 'invalid' || !data?.valid) {
    const reasonMap: Record<string, string> = {
      missing_token: 'Il link non contiene un invito valido.',
      expired: 'Questo invito è scaduto. Chiedi al tuo referente di rinviartelo.',
      already_accepted: 'Questo invito è già stato accettato. Effettua il login.',
      bad_signature: 'Il link è stato manomesso o è stato copiato in modo errato.',
      malformed: 'Il link non è valido.',
      member_not_found: 'Non troviamo più questo invito. Contatta il tuo referente.',
    };
    const msg = reasonMap[data?.reason || ''] || 'Impossibile validare l\'invito.';
    return (
      <div className="min-h-screen flex items-center justify-center bg-jnana-bg p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-brand font-bold mb-2">Invito non valido</h1>
          <p className="text-jnana-text/70 mb-6">{msg}</p>
          <Button onClick={() => (window.location.href = '/')}>Torna alla home</Button>
        </Card>
      </div>
    );
  }

  const fullName = [data.member?.firstName, data.member?.lastName].filter(Boolean).join(' ');

  return (
    <div className="min-h-screen flex items-center justify-center bg-jnana-bg p-6">
      <Card className="max-w-xl w-full p-8 md:p-10">
        <div className="flex items-center gap-4 mb-6">
          {data.company?.logo_url ? (
            <img src={data.company.logo_url} alt={data.company.name} className="h-14 w-14 rounded-lg object-cover" />
          ) : (
            <div className="h-14 w-14 rounded-lg bg-jnana-sage/20 flex items-center justify-center">
              <Building className="h-7 w-7 text-jnana-charcoal" />
            </div>
          )}
          <div>
            <p className="text-xs uppercase tracking-wide text-jnana-text/60">Hai ricevuto un invito da</p>
            <h1 className="text-2xl font-brand font-bold">{data.company?.name}</h1>
          </div>
        </div>

        <p className="text-jnana-text mb-6">
          Ciao{fullName ? ` ${fullName}` : ''}, sei stato invitato a entrare nel team su <strong>Mudra Jnana</strong>.
        </p>

        {data.role && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-jnana-sage/10 mb-4">
            <Briefcase className="h-5 w-5 text-jnana-charcoal mt-0.5" />
            <div>
              <p className="text-xs uppercase tracking-wide text-jnana-text/60">Ruolo proposto</p>
              <p className="font-semibold">{data.role.title}</p>
            </div>
          </div>
        )}

        {data.member?.personalMessage && (
          <div className="p-4 rounded-lg bg-jnana-bg/40 border border-jnana-sage/30 mb-4 italic text-jnana-text/80">
            "{data.member.personalMessage}"
          </div>
        )}

        <div className="flex items-start gap-2 text-sm text-jnana-text/70 mb-6">
          <CheckCircle2 className="h-4 w-4 text-jnana-sage mt-0.5" />
          <span>
            Creiamo il tuo account in 1 minuto. L'email è già preimpostata: <strong>{data.member?.email}</strong>
          </span>
        </div>

        <Button size="lg" className="w-full" onClick={onProceedToSignup}>
          Accetta e crea account <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Card>
    </div>
  );
};

export default InviteAcceptView;
