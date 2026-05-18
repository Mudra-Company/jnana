import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../src/integrations/supabase/client';
import { SimulatorProvider, useSimulator } from '../../src/simulator/SimulatorContext';
import { SimulatorBanner } from '../../src/simulator/SimulatorBanner';
import { KarmaWelcome } from '../karma/KarmaWelcome';
import { CVReviewScreen } from '../karma/CVReviewScreen';
import { KarmaTestRiasec } from '../karma/KarmaTestRiasec';
import { KarmaTestChat } from '../karma/KarmaTestChat';
import { PostOnboardingPromo } from '../karma/PostOnboardingPromo';
import { KarmaOnboardingDemo } from './KarmaOnboardingDemo';
import { KarmaResultsDemo } from './KarmaResultsDemo';
import { calculateProfileCode } from '../../services/riasecService';
import type { CVParsedData } from '../../src/components/karma/CVImportBanner';
import type { ChatMessage, RiasecScore, KarmaData } from '../../types';

type Step =
  | 'welcome'
  | 'cv-review'
  | 'onboarding'
  | 'post-onboarding'
  | 'riasec'
  | 'chat'
  | 'results';

const SimulatorB2CInner: React.FC = () => {
  const sim = useSimulator();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('welcome');

  const exit = () => navigate('/superadmin');

  const handleCVParsed = (data: CVParsedData) => {
    sim.setCV(data);
    setStep('cv-review');
  };

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
          scenario: 'discovery',
          simulation: true,
        },
      });
      if (data) karma = data;
    } catch (e) {
      console.warn('[Simulator] karma-analyze failed', e);
    }
    sim.setKarma({ transcript, ...karma } as KarmaData);
    setStep('results');
  };

  return (
    <div className="min-h-screen bg-background">
      <SimulatorBanner mode="b2c" onExit={exit} />

      {step === 'welcome' && (
        <KarmaWelcome
          userName={sim.profile.firstName || undefined}
          onChooseCV={() => setStep('onboarding')}
          onChooseManual={() => setStep('onboarding')}
          onCVParsed={handleCVParsed}
        />
      )}

      {step === 'cv-review' && sim.profile.cv && (
        <CVReviewScreen
          parsedData={sim.profile.cv}
          onConfirm={() => setStep('onboarding')}
          onSkip={() => setStep('onboarding')}
        />
      )}

      {step === 'onboarding' && (
        <KarmaOnboardingDemo
          onComplete={() => setStep('post-onboarding')}
          onSkip={() => setStep('post-onboarding')}
        />
      )}

      {step === 'post-onboarding' && (
        <PostOnboardingPromo
          onStartRiasec={() => setStep('riasec')}
          onSkip={() => setStep('results')}
        />
      )}

      {step === 'riasec' && (
        <KarmaTestRiasec
          onComplete={handleRiasecComplete}
          onBack={() => setStep('post-onboarding')}
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

      {step === 'results' && <KarmaResultsDemo onExit={exit} />}
    </div>
  );
};

export const SimulatorB2CView: React.FC = () => (
  <SimulatorProvider mode="b2c">
    <SimulatorB2CInner />
  </SimulatorProvider>
);

export default SimulatorB2CView;
