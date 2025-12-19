import { supabase } from '../integrations/supabase/client';
import type { Tables } from '../integrations/supabase/types';
import type { RiasecScore, ChatMessage, ClimateData } from '../../types';

type RiasecResult = Tables<'riasec_results'>;
type KarmaSession = Tables<'karma_sessions'>;
type ClimateResponse = Tables<'climate_responses'>;

export const useTestResults = () => {

  const saveRiasecResult = async (
    userId: string, 
    companyId: string | null, 
    score: RiasecScore, 
    profileCode: string,
    rawAnswers?: Record<string, any>
  ): Promise<RiasecResult | null> => {
    try {
      const { data, error } = await supabase
        .from('riasec_results')
        .insert({
          user_id: userId,
          company_id: companyId,
          score_r: score.R,
          score_i: score.I,
          score_a: score.A,
          score_s: score.S,
          score_e: score.E,
          score_c: score.C,
          profile_code: profileCode,
          raw_answers: rawAnswers || {},
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error saving RIASEC result:', err);
      return null;
    }
  };

  const saveKarmaSession = async (
    userId: string,
    companyId: string | null,
    transcript: ChatMessage[],
    analysis: {
      summary?: string;
      softSkills?: string[];
      primaryValues?: string[];
      riskFactors?: string[];
      seniorityAssessment?: 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'C-Level';
    }
  ): Promise<KarmaSession | null> => {
    try {
      const { data, error } = await supabase
        .from('karma_sessions')
        .insert({
          user_id: userId,
          company_id: companyId,
          transcript: transcript as any,
          summary: analysis.summary,
          soft_skills: analysis.softSkills || [],
          primary_values: analysis.primaryValues || [],
          risk_factors: analysis.riskFactors || [],
          seniority_assessment: analysis.seniorityAssessment,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error saving Karma session:', err);
      return null;
    }
  };

  const saveClimateResponse = async (
    userId: string,
    companyId: string | null,
    climateData: ClimateData
  ): Promise<ClimateResponse | null> => {
    try {
      const { data, error } = await supabase
        .from('climate_responses')
        .insert({
          user_id: userId,
          company_id: companyId,
          raw_scores: climateData.rawScores as any,
          section_averages: climateData.sectionAverages as any,
          overall_average: climateData.overallAverage,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error saving climate response:', err);
      return null;
    }
  };

  const updateMemberStatus = async (
    userId: string, 
    companyId: string, 
    status: 'pending' | 'invited' | 'test_completed' | 'completed'
  ) => {
    try {
      const { error } = await supabase
        .from('company_members')
        .update({ status })
        .eq('user_id', userId)
        .eq('company_id', companyId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating member status:', err);
      return false;
    }
  };

  return {
    saveRiasecResult,
    saveKarmaSession,
    saveClimateResponse,
    updateMemberStatus,
  };
};
