import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from './useAuth';
import type { CompanySubscription, SubscriptionPlan } from '../types/karma';

export const useSubscription = (companyId?: string) => {
  const { membership } = useAuth();
  const targetCompanyId = companyId || membership?.company_id;
  
  const [subscription, setSubscription] = useState<CompanySubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all available plans
  const fetchPlans = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('monthly_price_cents');

      if (error) throw error;

      const formattedPlans: SubscriptionPlan[] = (data || []).map(p => ({
        id: p.id,
        name: p.name as SubscriptionPlan['name'],
        displayName: p.display_name,
        description: p.description || undefined,
        features: (p.features as string[]) || [],
        monthlyPriceCents: p.monthly_price_cents,
        annualPriceCents: p.annual_price_cents,
        maxProfileViewsMonthly: p.max_profile_views_monthly || 0,
        canInviteCandidates: p.can_invite_candidates || false,
        canAccessMatching: p.can_access_matching || false,
        canExportData: p.can_export_data || false,
        isActive: p.is_active || true,
        createdAt: p.created_at,
      }));

      setPlans(formattedPlans);
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  // Fetch company subscription
  const fetchSubscription = useCallback(async () => {
    if (!targetCompanyId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('company_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('company_id', targetCompanyId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const formatted: CompanySubscription = {
          id: data.id,
          companyId: data.company_id,
          planId: data.plan_id,
          status: data.status as CompanySubscription['status'],
          currentPeriodStart: data.current_period_start,
          currentPeriodEnd: data.current_period_end,
          profileViewsUsed: data.profile_views_used || 0,
          stripeSubscriptionId: data.stripe_subscription_id || undefined,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          plan: data.plan ? {
            id: data.plan.id,
            name: data.plan.name as SubscriptionPlan['name'],
            displayName: data.plan.display_name,
            description: data.plan.description || undefined,
            features: (data.plan.features as string[]) || [],
            monthlyPriceCents: data.plan.monthly_price_cents,
            annualPriceCents: data.plan.annual_price_cents,
            maxProfileViewsMonthly: data.plan.max_profile_views_monthly || 0,
            canInviteCandidates: data.plan.can_invite_candidates || false,
            canAccessMatching: data.plan.can_access_matching || false,
            canExportData: data.plan.can_export_data || false,
            isActive: data.plan.is_active || true,
            createdAt: data.plan.created_at,
          } : undefined,
        };
        setSubscription(formatted);
      } else {
        setSubscription(null);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [targetCompanyId]);

  // Check if company has active subscription
  const hasActiveSubscription = useCallback((): boolean => {
    return subscription?.status === 'active';
  }, [subscription]);

  // Check if can view more profiles
  const canViewProfiles = useCallback((): boolean => {
    if (!subscription || subscription.status !== 'active') return false;
    if (!subscription.plan) return false;
    
    // Enterprise has unlimited (-1)
    if (subscription.plan.maxProfileViewsMonthly === -1) return true;
    
    return subscription.profileViewsUsed < subscription.plan.maxProfileViewsMonthly;
  }, [subscription]);

  // Get remaining profile views
  const remainingProfileViews = useCallback((): number => {
    if (!subscription || subscription.status !== 'active') return 0;
    if (!subscription.plan) return 0;
    
    // Enterprise has unlimited
    if (subscription.plan.maxProfileViewsMonthly === -1) return Infinity;
    
    return Math.max(0, subscription.plan.maxProfileViewsMonthly - subscription.profileViewsUsed);
  }, [subscription]);

  // Check if can invite candidates
  const canInviteCandidates = useCallback((): boolean => {
    if (!subscription || subscription.status !== 'active') return false;
    return subscription.plan?.canInviteCandidates || false;
  }, [subscription]);

  // Check if can access matching
  const canAccessMatching = useCallback((): boolean => {
    if (!subscription || subscription.status !== 'active') return false;
    return subscription.plan?.canAccessMatching || false;
  }, [subscription]);

  // Increment profile view count (call when viewing a profile)
  const logProfileView = useCallback(async (viewedProfileId: string) => {
    if (!targetCompanyId || !subscription) return false;

    try {
      // Insert view log
      await supabase
        .from('profile_views_log')
        .insert({
          viewer_company_id: targetCompanyId,
          viewed_profile_id: viewedProfileId,
        });

      // Increment counter
      const { error } = await supabase
        .from('company_subscriptions')
        .update({ 
          profile_views_used: (subscription.profileViewsUsed || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);

      if (error) throw error;

      // Update local state
      setSubscription(prev => prev ? {
        ...prev,
        profileViewsUsed: prev.profileViewsUsed + 1,
      } : null);

      return true;
    } catch (err) {
      console.error('Error logging profile view:', err);
      return false;
    }
  }, [targetCompanyId, subscription]);

  useEffect(() => {
    fetchPlans();
    fetchSubscription();
  }, [fetchPlans, fetchSubscription]);

  return {
    subscription,
    plans,
    isLoading,
    error,
    hasActiveSubscription,
    canViewProfiles,
    remainingProfileViews,
    canInviteCandidates,
    canAccessMatching,
    logProfileView,
    refetch: fetchSubscription,
  };
};
