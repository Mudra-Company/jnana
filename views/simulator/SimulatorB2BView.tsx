import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building, Briefcase, ArrowRight, ArrowLeft, CheckCircle2,
  User as UserIcon, Sparkles, ListChecks,
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { supabase } from '../../src/integrations/supabase/client';
import {
  SimulatorProvider, useSimulator,
  type DemoCompany, type DemoRole,
} from '../../src/simulator/SimulatorContext';
import { SimulatorBanner } from '../../src/simulator/SimulatorBanner';
import { KarmaTestRiasec } from '../karma/KarmaTestRiasec';
import { KarmaTestChat } from '../karma/KarmaTestChat';
import { ClimateTestView } from '../user/ClimateTestView';
import { KarmaResultsDemo } from './KarmaResultsDemo';
import { calculateProfileCode } from '../../services/riasecService';
import type { ChatMessage, RiasecScore, KarmaData, ClimateData, User } from '../../types';

const DEFAULT_COMPANY: DemoCompany = {
  id: 'demo-company',
  name: 'Anteprima S.p.A.',
  cultureValues: ['Innovation', 'Trust', 'Growth'],
};

const DEFAULT_ROLE: DemoRole = {
  id: 'demo-role',
  title: 'Senior Product Designer',
  seniority: 'Senior',
  requiredHardSkills: ['Figma', 'Design Systems', 'Prototyping', 'User Research'],
  requiredSoftSkills: ['Collaborazione', 'Pensiero critico', 'Comunicazione'],
};

type Step = 'invite' | 'b2b-onboarding' | 'riasec' | 'chat' | 'climate' | 'results';

// ---- Inline invite mock (no DB) ----
const InviteAcceptDemo: React.FC<{ company: DemoCompany; role: DemoRole; onContinue: () => void }> = ({
  company, role, onContinue,
}) => (
  <div className="min-h-[60vh] flex items-center justify-center p-6">
    <Card className="max-w-lg w-full p-8 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-jnana-sage/20 mb-4">
        <Building className="h-7 w-7 text-jnana-charcoal" />
      </div>
      <h1 className="text-2xl font-brand font-bold mb-2">{company.name} ti ha invitato</h1>
      <p className="text-jnana-text/70 mb-4">
        Sei stato invitato come <strong>{role.title}</strong>. Procedi per completare il tuo profilo.
      </p>
      <Button onClick={onContinue} className="w-full">
        Accetta invito <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
      <p className="text-xs text-jnana-text/50 mt-3">Simulazione — nessun account verrà creato.</p>
    </Card>
  </div>
);

// ---- Inline B2B onboarding (no DB writes) ----
const B2BOnboardingDemo: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const sim = useSimulator();
  const role = sim.role!;
  const company = sim.company!;
  const [step, setStep] = useState<'welcome' | 'profile' | 'skills' | 'done'>('welcome');
  const [firstName, setFirstName] = useState(sim.profile.firstName);
  const [lastName, setLastName] = useState(sim.profile.lastName);
  const [headline, setHeadline] = useState(sim.profile.headline);
  const [bio, setBio] = useState(sim.profile.bio);
  const [levels, setLevels] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    role.requiredHardSkills.forEach(s => { init[s] = 3; });
    return init;
  });

  const order: Array<typeof step> = ['welcome', 'profile', 'skills', 'done'];
  const progress = ((order.indexOf(step) + 1) / order.length) * 100;

  const goNext = () => {
    if (step === 'welcome') return setStep('profile');
    if (step === 'profile') {
      sim.setProfile({ firstName, lastName, headline, bio });
      return setStep(role.requiredHardSkills.length > 0 ? 'skills' : 'done');
    }
    if (step === 'skills') {
      sim.setSelfSkillLevels(levels);
      return setStep('done');
    }
    if (step === 'done') onDone();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between text-xs text-jnana-text/60 mb-2">
          <span>Step {order.indexOf(step) + 1} di {order.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
          <div className="h-full bg-jnana-charcoal transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {step === 'welcome' && (
        <Card className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-14 w-14 rounded-lg bg-jnana-sage/20 flex items-center justify-center">
              <Building className="h-7 w-7 text-jnana-charcoal" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-jnana-text/60">Benvenuto in</p>
              <h1 className="text-2xl font-brand font-bold">{company.name}</h1>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-jnana-sage/10 mb-4">
            <Briefcase className="h-5 w-5 text-jnana-charcoal mt-0.5" />
            <div>
              <p className="text-xs uppercase tracking-wide text-jnana-text/60">Il tuo ruolo</p>
              <p className="font-semibold">{role.title}</p>
              {role.seniority && <p className="text-sm text-jnana-text/70">Seniority: {role.seniority}</p>}
            </div>
          </div>
          <ul className="space-y-2 text-sm text-jnana-text mb-8">
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-jnana-sage" /> Profilo personale</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-jnana-sage" /> Autovalutazione skill di ruolo</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-jnana-sage" /> Test RIASEC, clima e chat Karma AI</li>
          </ul>
          <Button onClick={goNext} className="ml-auto block">Iniziamo <ArrowRight className="ml-2 h-4 w-4" /></Button>
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
                <input className="w-full px-3 py-2 border rounded-md" value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-jnana-text/70 mb-1 block">Cognome</label>
                <input className="w-full px-3 py-2 border rounded-md" value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm text-jnana-text/70 mb-1 block">Headline professionale</label>
              <input className="w-full px-3 py-2 border rounded-md" value={headline} onChange={e => setHeadline(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-jnana-text/70 mb-1 block">Breve bio</label>
              <textarea className="w-full px-3 py-2 border rounded-md" rows={3} value={bio} onChange={e => setBio(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-between mt-8">
            <Button variant="ghost" onClick={() => setStep('welcome')}><ArrowLeft className="h-4 w-4 mr-2" />Indietro</Button>
            <Button onClick={goNext}>Continua <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </Card>
      )}

      {step === 'skills' && (
        <Card className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <ListChecks className="h-6 w-6 text-jnana-charcoal" />
            <h2 className="text-xl font-brand font-bold">Le skill del tuo ruolo</h2>
          </div>
          <p className="text-sm text-jnana-text/70 mb-6">
            Valuta il tuo livello da 1 a 5 per ciascuna skill richiesta.
          </p>
          <div className="space-y-4">
            {role.requiredHardSkills.map(skill => (
              <div key={skill} className="p-3 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{skill}</span>
                  <span className="text-xs text-jnana-text/60">Livello: {levels[skill]}/5</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(lvl => (
                    <button key={lvl}
                      onClick={() => setLevels(prev => ({ ...prev, [skill]: lvl }))}
                      className={`flex-1 py-2 rounded-md border text-sm transition ${
                        levels[skill] === lvl
                          ? 'bg-jnana-charcoal text-white border-jnana-charcoal'
                          : 'bg-white text-jnana-text border-jnana-sage/30 hover:bg-jnana-sage/10'
                      }`}>{lvl}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-8">
            <Button variant="ghost" onClick={() => setStep('profile')}><ArrowLeft className="h-4 w-4 mr-2" />Indietro</Button>
            <Button onClick={goNext}>Continua <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </Card>
      )}

      {step === 'done' && (
        <Card className="p-8 text-center">
          <Sparkles className="h-12 w-12 text-jnana-sage mx-auto mb-4" />
          <h2 className="text-2xl font-brand font-bold mb-2">Profilo pronto!</h2>
          <p className="text-jnana-text/70 mb-6">Ora i test psicoattitudinali e il colloquio con Karma AI.</p>
          <Button size="lg" onClick={goNext}>Inizia <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </Card>
      )}
    </div>
  );
};

const SimulatorB2BInner: React.FC = () => {
  const sim = useSimulator();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('invite');

  const exit = () => navigate('/superadmin');

  const handleRiasecComplete = (score: RiasecScore) => {
    const code = calculateProfileCode(score);
    sim.setRiasec(score, code);
    setStep('chat');
  };

  const handleChatComplete = async (transcript: ChatMessage[]) => {
    let karma: Partial<KarmaData> = {};
    try {
      const { data } = await supabase.functions.invoke('karma-analyze', {
        body: {
          transcript: transcript.map(m => ({ role: m.role, text: m.text })),
          botType: 'karma_talents',
          scenario: 'role_fit',
          simulation: true,
          roleContext: sim.role,
        },
      });
      if (data) karma = data;
    } catch (e) {
      console.warn('[Simulator] karma-analyze failed', e);
    }
    sim.setKarma({ transcript, ...karma } as KarmaData);
    setStep('climate');
  };

  // ClimateTestView expects a User — we adapt the demo profile
  const climateUser: User = useMemo(() => ({
    id: 'demo-user',
    companyId: sim.company?.id || 'demo-company',
    firstName: sim.profile.firstName || 'Demo',
    lastName: sim.profile.lastName || 'User',
    email: sim.profile.email,
    role: sim.role?.title || 'Demo Role',
    department: 'Demo',
    status: 'in_progress',
  } as unknown as User), [sim.profile, sim.role, sim.company]);

  return (
    <div className="min-h-screen bg-background">
      <SimulatorBanner mode="b2b" onExit={exit} />

      {step === 'invite' && sim.company && sim.role && (
        <InviteAcceptDemo
          company={sim.company}
          role={sim.role}
          onContinue={() => setStep('b2b-onboarding')}
        />
      )}

      {step === 'b2b-onboarding' && (
        <B2BOnboardingDemo onDone={() => setStep('riasec')} />
      )}

      {step === 'riasec' && (
        <KarmaTestRiasec
          onComplete={handleRiasecComplete}
          onBack={() => setStep('b2b-onboarding')}
        />
      )}

      {step === 'chat' && sim.profile.riasecScore && sim.profile.profileCode && (
        <KarmaTestChat
          riasecScore={sim.profile.riasecScore}
          profileCode={sim.profile.profileCode}
          firstName={sim.profile.firstName || 'Demo'}
          headline={sim.profile.headline}
          bio={sim.profile.bio}
          onComplete={handleChatComplete}
          onBack={() => setStep('riasec')}
        />
      )}

      {step === 'climate' && (
        <ClimateTestView
          user={climateUser}
          onComplete={(data: ClimateData) => {
            sim.setClimate(data);
            setStep('results');
          }}
        />
      )}

      {step === 'results' && <KarmaResultsDemo onExit={exit} />}
    </div>
  );
};

export const SimulatorB2BView: React.FC = () => (
  <SimulatorProvider mode="b2b" company={DEFAULT_COMPANY} role={DEFAULT_ROLE}>
    <SimulatorB2BInner />
  </SimulatorProvider>
);

export default SimulatorB2BView;
