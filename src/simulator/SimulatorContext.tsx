import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ChatMessage, ClimateData, KarmaData, RiasecScore } from '../../types';
import type { CVParsedData } from '../components/karma/CVImportBanner';

/**
 * In-memory state for the onboarding simulator (super admin sales/QA tool).
 * Nothing here is persisted to Supabase — every action lives only in React state.
 */

export type SimulatorMode = 'b2c' | 'b2b';

export interface DemoSkill {
  skillId?: string;
  name: string;
  level: number; // 1-5
}

export interface DemoSocialLink {
  platform: string;
  url: string;
}

export interface DemoCompany {
  id: string;
  name: string;
  logoUrl?: string | null;
  cultureValues?: string[];
}

export interface DemoRole {
  id: string;
  title: string;
  requiredHardSkills: string[];
  requiredSoftSkills: string[];
  seniority?: string | null;
}

export interface DemoProfile {
  firstName: string;
  lastName: string;
  email: string;
  headline: string;
  location: string;
  bio: string;
  yearsExperience: number;
  lookingForWork: boolean;
  preferredWorkType: 'remote' | 'hybrid' | 'onsite' | 'any';
  avatarDataUrl: string | null;
  skills: DemoSkill[];
  socialLinks: DemoSocialLink[];
  cv?: CVParsedData;
  riasecScore?: RiasecScore;
  profileCode?: string;
  karmaData?: KarmaData;
  climateData?: ClimateData;
  // B2B-only
  selfSkillLevels?: Record<string, number>;
}

interface SimulatorContextValue {
  mode: SimulatorMode;
  profile: DemoProfile;
  company: DemoCompany | null;
  role: DemoRole | null;
  setProfile: (patch: Partial<DemoProfile>) => void;
  addSkill: (s: DemoSkill) => void;
  removeSkill: (name: string) => void;
  setSkills: (skills: DemoSkill[]) => void;
  setAvatar: (dataUrl: string | null) => void;
  setSocialLink: (platform: string, url: string) => void;
  removeSocialLink: (platform: string) => void;
  setCV: (cv: CVParsedData) => void;
  setRiasec: (score: RiasecScore, code: string) => void;
  setKarma: (data: KarmaData) => void;
  setClimate: (data: ClimateData) => void;
  setSelfSkillLevels: (levels: Record<string, number>) => void;
  reset: () => void;
}

const defaultProfile: DemoProfile = {
  firstName: '',
  lastName: '',
  email: 'demo@anteprima.app',
  headline: '',
  location: '',
  bio: '',
  yearsExperience: 0,
  lookingForWork: true,
  preferredWorkType: 'any',
  avatarDataUrl: null,
  skills: [],
  socialLinks: [],
};

const SimulatorContext = createContext<SimulatorContextValue | null>(null);

export const SimulatorProvider: React.FC<{
  mode: SimulatorMode;
  company?: DemoCompany | null;
  role?: DemoRole | null;
  children: React.ReactNode;
}> = ({ mode, company = null, role = null, children }) => {
  const [profile, setProfileState] = useState<DemoProfile>(defaultProfile);

  const setProfile = useCallback((patch: Partial<DemoProfile>) => {
    setProfileState(prev => ({ ...prev, ...patch }));
  }, []);

  const addSkill = useCallback((s: DemoSkill) => {
    setProfileState(prev => {
      if (prev.skills.some(x => x.name.toLowerCase() === s.name.toLowerCase())) return prev;
      return { ...prev, skills: [...prev.skills, s] };
    });
  }, []);

  const removeSkill = useCallback((name: string) => {
    setProfileState(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s.name !== name),
    }));
  }, []);

  const setSkills = useCallback((skills: DemoSkill[]) => {
    setProfileState(prev => ({ ...prev, skills }));
  }, []);

  const setAvatar = useCallback((dataUrl: string | null) => {
    setProfileState(prev => ({ ...prev, avatarDataUrl: dataUrl }));
  }, []);

  const setSocialLink = useCallback((platform: string, url: string) => {
    setProfileState(prev => {
      const exists = prev.socialLinks.some(l => l.platform === platform);
      const next = exists
        ? prev.socialLinks.map(l => (l.platform === platform ? { ...l, url } : l))
        : [...prev.socialLinks, { platform, url }];
      return { ...prev, socialLinks: next };
    });
  }, []);

  const removeSocialLink = useCallback((platform: string) => {
    setProfileState(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.filter(l => l.platform !== platform),
    }));
  }, []);

  const setCV = useCallback((cv: CVParsedData) => {
    setProfileState(prev => ({
      ...prev,
      cv,
      firstName: cv.profileData?.firstName || prev.firstName,
      lastName: cv.profileData?.lastName || prev.lastName,
      headline: cv.profileData?.headline || prev.headline,
      bio: cv.profileData?.bio || prev.bio,
      location: cv.profileData?.location || prev.location,
      yearsExperience: cv.profileData?.yearsExperience ?? prev.yearsExperience,
      skills:
        cv.skills && cv.skills.length > 0
          ? cv.skills.map(name => ({ name, level: 3 }))
          : prev.skills,
    }));
  }, []);

  const setRiasec = useCallback((score: RiasecScore, code: string) => {
    setProfileState(prev => ({ ...prev, riasecScore: score, profileCode: code }));
  }, []);

  const setKarma = useCallback((data: KarmaData) => {
    setProfileState(prev => ({ ...prev, karmaData: data }));
  }, []);

  const setClimate = useCallback((data: ClimateData) => {
    setProfileState(prev => ({ ...prev, climateData: data }));
  }, []);

  const setSelfSkillLevels = useCallback((levels: Record<string, number>) => {
    setProfileState(prev => ({ ...prev, selfSkillLevels: levels }));
  }, []);

  const reset = useCallback(() => setProfileState(defaultProfile), []);

  const value = useMemo<SimulatorContextValue>(
    () => ({
      mode,
      profile,
      company,
      role,
      setProfile,
      addSkill,
      removeSkill,
      setSkills,
      setAvatar,
      setSocialLink,
      removeSocialLink,
      setCV,
      setRiasec,
      setKarma,
      setClimate,
      setSelfSkillLevels,
      reset,
    }),
    [
      mode, profile, company, role,
      setProfile, addSkill, removeSkill, setSkills, setAvatar,
      setSocialLink, removeSocialLink, setCV, setRiasec, setKarma,
      setClimate, setSelfSkillLevels, reset,
    ],
  );

  return <SimulatorContext.Provider value={value}>{children}</SimulatorContext.Provider>;
};

export function useSimulator(): SimulatorContextValue {
  const ctx = useContext(SimulatorContext);
  if (!ctx) throw new Error('useSimulator must be used inside <SimulatorProvider>');
  return ctx;
}
