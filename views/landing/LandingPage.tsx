import React from 'react';
import { HeroSection } from './HeroSection';
import { ProblemSection } from './ProblemSection';
import { JnanaSection } from './JnanaSection';
import { KarmaSection } from './KarmaSection';
import { BridgeSection } from './BridgeSection';
import { SocialProofSection } from './SocialProofSection';
import { FooterSection } from './FooterSection';

interface LandingPageProps {
  onSelectJnana: () => void;
  onSelectKarma: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectJnana, onSelectKarma }) => {
  return (
    <div className="min-h-screen bg-jnana-bg dark:bg-gray-900 overflow-x-hidden">
      <HeroSection onSelectJnana={onSelectJnana} onSelectKarma={onSelectKarma} />
      <ProblemSection />
      <JnanaSection onCta={onSelectJnana} />
      <KarmaSection onCta={onSelectKarma} />
      <BridgeSection />
      <SocialProofSection />
      <FooterSection onSelectJnana={onSelectJnana} onSelectKarma={onSelectKarma} />
    </div>
  );
};
