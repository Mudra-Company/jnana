import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { User, RiasecScore, ChatMessage, ClimateData, KarmaData, JobDatabase } from '../../types';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../integrations/supabase/client';
import { useTestResults } from '../hooks/useTestResults';
import { useProfiles } from '../hooks/useProfiles';
import { calculateProfileCode } from '../../services/riasecService';
import { loadJobDb, saveJobDb } from '../../services/storageService';

// Profile to legacy user adapter
const profileToLegacyUser = (
  profile: any, 
  membership?: any, 
  riasecResult?: any, 
  karmaSession?: any, 
  climateResponse?: any
): User => {
  return {
    id: profile.id,
    firstName: profile.first_name || '',
    lastName: profile.last_name || '',
    email: profile.email,
    gender: profile.gender as 'M' | 'F' | undefined,
    age: profile.age || undefined,
    companyId: membership?.company_id || '',
    jobTitle: membership?.job_title || profile.job_title || '',
    departmentId: membership?.department_id || '',
    status: membership?.status || 'pending',
    memberId: membership?.id || undefined,
    results: riasecResult ? {
      R: riasecResult.score_r,
      I: riasecResult.score_i,
      A: riasecResult.score_a,
      S: riasecResult.score_s,
      E: riasecResult.score_e,
      C: riasecResult.score_c,
    } : undefined,
    profileCode: riasecResult?.profile_code || undefined,
    submissionDate: riasecResult?.submitted_at?.split('T')[0] || undefined,
    karmaData: karmaSession ? {
      transcript: karmaSession.transcript || [],
      summary: karmaSession.summary || '',
      softSkills: karmaSession.soft_skills || [],
      primaryValues: karmaSession.primary_values || [],
      riskFactors: karmaSession.risk_factors || [],
      seniorityAssessment: karmaSession.seniority_assessment,
    } : undefined,
    climateData: climateResponse ? {
      rawScores: climateResponse.raw_scores || {},
      sectionAverages: climateResponse.section_averages || {},
      overallAverage: climateResponse.overall_average || 0,
      submissionDate: climateResponse.submitted_at?.split('T')[0],
    } : undefined,
  };
};

interface UserDataContextType {
  currentUser: User | null;
  jobDb: JobDatabase;
  isLoading: boolean;
  
  // Actions
  refreshUserData: () => Promise<void>;
  handleTestComplete: (score: RiasecScore) => Promise<void>;
  handleClimateComplete: (climateData: ClimateData) => Promise<void>;
  handleKarmaComplete: (transcript: ChatMessage[]) => Promise<void>;
  updateJobDb: (newDb: JobDatabase) => void;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const UserDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, membership, profile, isInitialized } = useAuth();
  const { saveRiasecResult, saveKarmaSession, saveClimateResponse, updateMemberStatus } = useTestResults();
  const { fetchUserWithDetails } = useProfiles(membership?.company_id);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [jobDb, setJobDb] = useState<JobDatabase>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const lastUserIdRef = useRef<string | null>(null);
  const dataLoadedRef = useRef(false);

  // Load job database
  useEffect(() => {
    setJobDb(loadJobDb());
  }, []);

  // Load user data when auth changes
  useEffect(() => {
    if (!isInitialized || !user || !profile) {
      if (isInitialized && !user) {
        setCurrentUser(null);
        lastUserIdRef.current = null;
        dataLoadedRef.current = false;
      }
      return;
    }

    if (lastUserIdRef.current !== user.id || !dataLoadedRef.current) {
      lastUserIdRef.current = user.id;
      dataLoadedRef.current = true;
      loadUserData();
    }
  }, [user?.id, profile?.id, isInitialized]);

  const loadUserData = async () => {
    if (!user || !profile) return;
    
    setIsLoading(true);
    try {
      const userData = await fetchUserWithDetails(user.id);
      if (userData) {
        const legacyUser = profileToLegacyUser(
          userData,
          userData.membership,
          userData.riasecResult,
          userData.karmaSession,
          userData.climateResponse
        );
        setCurrentUser(legacyUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserData = useCallback(async () => {
    await loadUserData();
  }, [user, profile]);

  const handleTestComplete = useCallback(async (score: RiasecScore) => {
    if (!currentUser || !user) return;
    
    const profileCode = calculateProfileCode(score);
    
    await saveRiasecResult(
      user.id,
      membership?.company_id || null,
      score,
      profileCode
    );

    if (membership?.company_id) {
      await updateMemberStatus(user.id, membership.company_id, 'test_completed');
    }

    setCurrentUser(prev => prev ? {
      ...prev,
      status: 'test_completed',
      results: score,
      profileCode,
      submissionDate: new Date().toISOString().split('T')[0],
    } : null);
  }, [currentUser, user, membership, saveRiasecResult, updateMemberStatus]);

  const handleClimateComplete = useCallback(async (climateData: ClimateData) => {
    if (!user) return;

    await saveClimateResponse(
      user.id,
      membership?.company_id || null,
      climateData
    );

    setCurrentUser(prev => prev ? {
      ...prev,
      climateData,
    } : null);
  }, [user, membership, saveClimateResponse]);

  const handleKarmaComplete = useCallback(async (transcript: ChatMessage[]) => {
    if (!currentUser || !user) return;

    let karmaDataPartial: any = {};
    try {
      const { data, error } = await supabase.functions.invoke('karma-analyze', {
        body: { transcript: transcript.map(m => ({ role: m.role, text: m.text })) }
      });
      
      if (!error && data) {
        karmaDataPartial = data;
      }
    } catch (e) {
      console.error('Error calling karma-analyze:', e);
    }

    await saveKarmaSession(
      user.id,
      membership?.company_id || null,
      transcript,
      {
        summary: karmaDataPartial.summary,
        softSkills: karmaDataPartial.softSkills,
        primaryValues: karmaDataPartial.primaryValues,
        riskFactors: karmaDataPartial.riskFactors,
        seniorityAssessment: karmaDataPartial.seniorityAssessment as any,
      }
    );

    if (membership?.company_id) {
      await updateMemberStatus(user.id, membership.company_id, 'completed');
    }

    setCurrentUser(prev => prev ? {
      ...prev,
      status: 'completed',
      karmaData: {
        transcript,
        ...karmaDataPartial,
      },
    } : null);
  }, [currentUser, user, membership, saveKarmaSession, updateMemberStatus]);

  const updateJobDb = useCallback((newDb: JobDatabase) => {
    setJobDb(newDb);
    saveJobDb(newDb);
  }, []);

  return (
    <UserDataContext.Provider value={{
      currentUser,
      jobDb,
      isLoading,
      refreshUserData,
      handleTestComplete,
      handleClimateComplete,
      handleKarmaComplete,
      updateJobDb,
    }}>
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserDataContext = () => {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserDataContext must be used within a UserDataProvider');
  }
  return context;
};

// Re-export adapter
export { profileToLegacyUser };
