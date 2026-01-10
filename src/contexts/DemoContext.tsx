import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, RiasecScore, ChatMessage, ClimateData, KarmaData } from '../../types';
import { calculateProfileCode } from '../../services/riasecService';
import { supabase } from '../integrations/supabase/client';
import { toast } from '../hooks/use-toast';

interface DemoContextType {
  isDemoMode: boolean;
  demoUser: User | null;
  
  // Actions
  startDemoMode: (companyId?: string) => void;
  exitDemoMode: () => void;
  handleDemoTestComplete: (score: RiasecScore) => void;
  handleDemoClimateComplete: (climateData: ClimateData) => void;
  handleDemoKarmaComplete: (transcript: ChatMessage[]) => Promise<void>;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoUser, setDemoUser] = useState<User | null>(null);

  const startDemoMode = useCallback((companyId?: string) => {
    const user: User = {
      id: 'demo_user_temp_' + Date.now(),
      firstName: 'Demo',
      lastName: 'User',
      email: 'demo@test.jnana.app',
      companyId: companyId || 'demo_company',
      status: 'pending',
    };
    setDemoUser(user);
    setIsDemoMode(true);
    
    toast({
      title: "Modalità Demo attivata",
      description: "Stai simulando il percorso di un nuovo utente. I dati NON vengono salvati.",
    });
  }, []);

  const exitDemoMode = useCallback(() => {
    setIsDemoMode(false);
    setDemoUser(null);
    
    toast({
      title: "Demo terminata",
      description: "Sei tornato alla Console Super Admin.",
    });
  }, []);

  const handleDemoTestComplete = useCallback((score: RiasecScore) => {
    if (!demoUser) return;
    
    const profileCode = calculateProfileCode(score);
    
    setDemoUser(prev => prev ? {
      ...prev,
      results: score,
      profileCode,
      status: 'test_completed',
      submissionDate: new Date().toISOString().split('T')[0],
    } : null);
  }, [demoUser]);

  const handleDemoClimateComplete = useCallback((climateData: ClimateData) => {
    setDemoUser(prev => prev ? {
      ...prev,
      climateData,
    } : null);
  }, []);

  const handleDemoKarmaComplete = useCallback(async (transcript: ChatMessage[]) => {
    if (!demoUser) return;

    let karmaDataPartial: Partial<KarmaData> = {};
    try {
      const { data, error } = await supabase.functions.invoke('karma-analyze', {
        body: { transcript: transcript.map(m => ({ role: m.role, text: m.text })) }
      });
      
      if (!error && data) {
        karmaDataPartial = data;
      }
    } catch (e) {
      console.error('[Demo] Error calling karma-analyze:', e);
    }

    setDemoUser(prev => prev ? {
      ...prev,
      status: 'completed',
      karmaData: {
        transcript,
        summary: karmaDataPartial.summary,
        softSkills: karmaDataPartial.softSkills,
        primaryValues: karmaDataPartial.primaryValues,
        riskFactors: karmaDataPartial.riskFactors,
        seniorityAssessment: karmaDataPartial.seniorityAssessment,
      },
    } : null);
  }, [demoUser]);

  return (
    <DemoContext.Provider value={{
      isDemoMode,
      demoUser,
      startDemoMode,
      exitDemoMode,
      handleDemoTestComplete,
      handleDemoClimateComplete,
      handleDemoKarmaComplete,
    }}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemoContext = () => {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemoContext must be used within a DemoProvider');
  }
  return context;
};
