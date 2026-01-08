import React from 'react';
import { HeroSection } from './HeroSection';
import { ProblemSection } from './ProblemSection';
import { JnanaSection } from './JnanaSection';
import { KarmaSection } from './KarmaSection';
import { BridgeSection } from './BridgeSection';
import { SocialProofSection } from './SocialProofSection';
import { FooterSection } from './FooterSection';
import { Building, ArrowRight, AlertCircle } from 'lucide-react';

interface PendingInvite {
  inviteId: string;
  companyId: string;
  companyName?: string;
}

interface LandingPageProps {
  onSelectJnana: () => void;
  onSelectKarma: () => void;
  pendingInvite?: PendingInvite | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectJnana, onSelectKarma, pendingInvite }) => {
  // If there's a pending invite, show a prominent banner and block KARMA
  if (pendingInvite) {
    return (
      <div className="min-h-screen bg-jnana-bg dark:bg-gray-900 overflow-x-hidden">
        {/* Pending Invite Banner - Fixed at top */}
        <div className="sticky top-0 z-50 bg-gradient-to-r from-jnana-sage to-jnana-sage/80 text-white shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">
                  {pendingInvite.companyName 
                    ? `${pendingInvite.companyName} ti ha invitato!` 
                    : 'Hai un invito aziendale!'}
                </p>
                <p className="text-sm text-white/80">
                  Completa la registrazione per entrare nel team
                </p>
              </div>
            </div>
            <button
              onClick={onSelectJnana}
              className="flex items-center gap-2 bg-white text-jnana-sage px-4 py-2 rounded-lg font-medium hover:bg-white/90 transition-colors"
            >
              Accetta Invito
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <HeroSection onSelectJnana={onSelectJnana} onSelectKarma={onSelectJnana} />
        <ProblemSection />
        <JnanaSection onCta={onSelectJnana} />
        
        {/* KARMA Section - Disabled with overlay */}
        <div className="relative">
          <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl max-w-md text-center">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-jnana-charcoal dark:text-white mb-2">
                Completa prima l'invito aziendale
              </h3>
              <p className="text-sm text-jnana-text/70 dark:text-gray-400 mb-4">
                Hai un invito pendente da {pendingInvite.companyName || 'un\'azienda'}. 
                Completa prima la registrazione JNANA.
              </p>
              <button
                onClick={onSelectJnana}
                className="bg-jnana-sage text-white px-6 py-2 rounded-lg font-medium hover:bg-jnana-sage/90 transition-colors"
              >
                Vai a JNANA
              </button>
            </div>
          </div>
          <KarmaSection onCta={onSelectJnana} />
        </div>
        
        <BridgeSection />
        <SocialProofSection />
        <FooterSection onSelectJnana={onSelectJnana} onSelectKarma={onSelectJnana} />
      </div>
    );
  }

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
