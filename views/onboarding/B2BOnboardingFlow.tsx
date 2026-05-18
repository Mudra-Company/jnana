import React, { useEffect, useMemo, useState } from 'react';
import {
  Building, Briefcase, ArrowRight, ArrowLeft, CheckCircle2, Loader2,
  User as UserIcon, Sparkles, ListChecks,
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { supabase } from '../../src/integrations/supabase/client';
import { useAuth } from '../../src/hooks/useAuth';

interface B2BOnboardingFlowProps {
  /** Called when the user is ready to start the RIASEC test. */
  onStartRiasec: () => void;
  /** Called if the user clicks "skip for now" (route them to their result page). */
  onSkip?: () => void;
}

type StepId = 'welcome' | 'profile' | 'skills' | 'done';

interface RoleInfo {
  id: string;
  title: string;
  required_hard_skills: string[];
  required_soft_skills: string[];
  seniority?: string | null;
}

interface CompanyInfo {
  id: string;
  name: string;
  logo_url?: string | null;
}

/**
 * Role-aware multi-step onboarding for B2B users (invited via company).
 * After this wizard, the user proceeds to RIASEC → Climate → Karma role_fit
 * (orchestrated by App.tsx through the existing USER_TEST flow).
 */
export const B2BOnboardingFlow: React.FC<B2BOnboardingFlowProps> = ({ onStartRiasec, onSkip }) => {
  const { user, profile, membership } = useAuth();
  const [step, setStep] = useState<StepId>('welcome');
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [role, setRole] = useState<RoleInfo | null>(null);
  const [managerName, setManagerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Step 2 — profile
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [headline, setHeadline] = useState<string>((profile as any)?.headline || '');
  const [bio, setBio] = useState<string>((profile as any)?.bio || '');

  // Step 3 — skills self-rating (observedLevel 1–5 vs required)
  const [skillLevels, setSkillLevels] = useState<Record<string, number>>({});

  // Load company + role context for the invited member
  useEffect(() => {
    if (!user || !membership?.company_id) return;
    (async () => {
      setLoading(true);
      try {
        const [{ data: companyData }, { data: roleAssignment }] = await Promise.all([
          supabase
            .from('companies')
            .select('id, name, logo_url')
            .eq('id', membership.company_id)
            .maybeSingle(),
          supabase
            .from('company_role_assignments')
            .select('role_id, company_roles(id, title, required_hard_skills, required_soft_skills, seniority)')
            .eq('user_id', user.id)
            .eq('assignment_type', 'primary')
            .order('start_date', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (companyData) setCompany(companyData as CompanyInfo);

        const r: any = (roleAssignment as any)?.company_roles;
        if (r) {
          const ri: RoleInfo = {
            id: r.id,
            title: r.title,
            required_hard_skills: Array.isArray(r.required_hard_skills) ? r.required_hard_skills : [],
            required_soft_skills: Array.isArray(r.required_soft_skills) ? r.required_soft_skills : [],
            seniority: r.seniority,
          };
          setRole(ri);
          const initial: Record<string, number> = {};
          ri.required_hard_skills.forEach(s => { initial[s] = 3; });
          setSkillLevels(initial);
        }

        // Manager = company admin (best-effort)
        const { data: admins } = await supabase
          .from('company_members')
          .select('placeholder_first_name, placeholder_last_name, user_id')
          .eq('company_id', membership.company_id)
          .eq('role', 'admin')
          .limit(1);
        if (admins && admins.length > 0) {
          const a: any = admins[0];
          setManagerName(`${a.placeholder_first_name || ''} ${a.placeholder_last_name || ''}`.trim() || null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id, membership?.company_id]);

  const stepsOrder: StepId[] = ['welcome', 'profile', 'skills', 'done'];
  const stepIndex = stepsOrder.indexOf(step);
  const progress = ((stepIndex + 1) / stepsOrder.length) * 100;

  const goNext = async () => {
    if (step === 'welcome') return setStep('profile');
    if (step === 'profile') {
      if (!user) return;
      setSaving(true);
      try {
        await supabase
          .from('profiles')
          .update({
            first_name: firstName || null,
            last_name: lastName || null,
            headline: headline || null,
            bio: bio || null,
          })
          .eq('id', user.id);
      } finally {
        setSaving(false);
      }
      return setStep(role && role.required_hard_skills.length > 0 ? 'skills' : 'done');
    }
    if (step === 'skills') {
      if (!user) return;
      setSaving(true);
      try {
        // Persist the user's self-declared skill levels as custom skills.
        const rows = Object.entries(skillLevels).map(([name, level]) => ({
          user_id: user.id,
          custom_skill_name: name,
          proficiency_level: level,
        }));
        if (rows.length > 0) {
          await supabase.from('user_hard_skills').upsert(rows as any, {
            onConflict: 'user_id,custom_skill_name',
            ignoreDuplicates: false,
          });
        }
        // Mark onboarding step
        await supabase.from('onboarding_progress').upsert(
          {
            user_id: user.id,
            company_id: membership?.company_id,
            flow: 'b2b',
            current_step: 'skills_done',
            completed_steps: ['welcome', 'profile', 'skills'],
          } as any,
          { onConflict: 'user_id,company_id' } as any,
        );
      } finally {
        setSaving(false);
      }
      return setStep('done');
    }
    if (step === 'done') {
      onStartRiasec();
    }
  };

  const goPrev = () => {
    const idx = stepsOrder.indexOf(step);
    if (idx > 0) setStep(stepsOrder[idx - 1]);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-jnana-charcoal" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-jnana-text/60 mb-2">
          <span>Step {stepIndex + 1} di {stepsOrder.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
          <div className="h-full bg-jnana-charcoal transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {step === 'welcome' && (
        <Card className="p-8">
          <div className="flex items-center gap-4 mb-6">
            {company?.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="h-14 w-14 rounded-lg object-cover" />
            ) : (
              <div className="h-14 w-14 rounded-lg bg-jnana-sage/20 flex items-center justify-center">
                <Building className="h-7 w-7 text-jnana-charcoal" />
              </div>
            )}
            <div>
              <p className="text-xs uppercase tracking-wide text-jnana-text/60">Benvenuto in</p>
              <h1 className="text-2xl font-brand font-bold">{company?.name || 'la tua azienda'}</h1>
            </div>
          </div>
          <p className="text-jnana-text mb-4">
            Ti accompagniamo in un percorso di 6–10 minuti per aiutarti a inserirti al meglio nel team.
          </p>
          {role && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-jnana-sage/10 mb-4">
              <Briefcase className="h-5 w-5 text-jnana-charcoal mt-0.5" />
              <div>
                <p className="text-xs uppercase tracking-wide text-jnana-text/60">Il tuo ruolo</p>
                <p className="font-semibold">{role.title}</p>
                {role.seniority && <p className="text-sm text-jnana-text/70">Seniority: {role.seniority}</p>}
              </div>
            </div>
          )}
          {managerName && (
            <p className="text-sm text-jnana-text/70 mb-6">Riferimento: <strong>{managerName}</strong></p>
          )}
          <ul className="space-y-2 text-sm text-jnana-text mb-8">
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-jnana-sage" /> Completi il tuo profilo personale</li>
            {role && role.required_hard_skills.length > 0 && (
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-jnana-sage" /> Auto-valuti le skill richieste dal ruolo</li>
            )}
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-jnana-sage" /> Fai il test RIASEC (~6 min) e una chat con Karma AI</li>
          </ul>
          <div className="flex justify-between gap-3">
            {onSkip && <Button variant="ghost" onClick={onSkip}>Salta per ora</Button>}
            <Button onClick={goNext} className="ml-auto">
              Iniziamo <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {step === 'profile' && (
        <Card className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <UserIcon className="h-6 w-6 text-jnana-charcoal" />
            <h2 className="text-xl font-brand font-bold">Il tuo profilo</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-jnana-text/70 mb-1 block">Nome</label>
                <input
                  className="w-full px-3 py-2 border rounded-md"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-jnana-text/70 mb-1 block">Cognome</label>
                <input
                  className="w-full px-3 py-2 border rounded-md"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-jnana-text/70 mb-1 block">Headline professionale</label>
              <input
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Es: Senior Product Designer, focus mobile"
                value={headline}
                onChange={e => setHeadline(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-jnana-text/70 mb-1 block">Breve bio (opzionale)</label>
              <textarea
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                placeholder="Cosa ti appassiona, in cosa sei più forte?"
                value={bio}
                onChange={e => setBio(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-between mt-8">
            <Button variant="ghost" onClick={goPrev}><ArrowLeft className="h-4 w-4 mr-2" />Indietro</Button>
            <Button onClick={goNext} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continua <ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
          </div>
        </Card>
      )}

      {step === 'skills' && role && (
        <Card className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <ListChecks className="h-6 w-6 text-jnana-charcoal" />
            <h2 className="text-xl font-brand font-bold">Le skill del tuo ruolo</h2>
          </div>
          <p className="text-sm text-jnana-text/70 mb-6">
            Per ognuna, valuta il tuo livello attuale da 1 (principiante) a 5 (esperto). Aiuta noi e il tuo team a
            individuare le aree di crescita.
          </p>
          <div className="space-y-4">
            {role.required_hard_skills.map(skill => (
              <div key={skill} className="p-3 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{skill}</span>
                  <span className="text-xs text-jnana-text/60">Livello: {skillLevels[skill] ?? 3}/5</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSkillLevels(prev => ({ ...prev, [skill]: lvl }))}
                      className={`flex-1 py-2 rounded-md border text-sm transition ${
                        (skillLevels[skill] ?? 3) === lvl
                          ? 'bg-jnana-charcoal text-white border-jnana-charcoal'
                          : 'bg-white text-jnana-text border-jnana-sage/30 hover:bg-jnana-sage/10'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-8">
            <Button variant="ghost" onClick={goPrev}><ArrowLeft className="h-4 w-4 mr-2" />Indietro</Button>
            <Button onClick={goNext} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continua <ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
          </div>
        </Card>
      )}

      {step === 'done' && (
        <Card className="p-8 text-center">
          <Sparkles className="h-12 w-12 text-jnana-sage mx-auto mb-4" />
          <h2 className="text-2xl font-brand font-bold mb-2">Profilo pronto!</h2>
          <p className="text-jnana-text/70 mb-6">
            Ora ti chiediamo di fare il test RIASEC (~6 min) e una breve chat con Karma AI per completare il match
            con il tuo ruolo.
          </p>
          <Button size="lg" onClick={onStartRiasec}>
            Inizia il test RIASEC <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Card>
      )}
    </div>
  );
};

export default B2BOnboardingFlow;
