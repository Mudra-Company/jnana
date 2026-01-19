/**
 * Main hook for Jnana Compliance functionality
 * Handles fetching, uploading, and managing compliance status
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../integrations/supabase/client';
import {
  ComplianceRequirement,
  CompanyComplianceStatusRecord,
  ComplianceItem,
  ComplianceRiskScore,
  ComplianceFilters,
  ComplianceCategory,
  TrafficLightStatus,
  calculateTrafficLight,
  calculateDaysUntilExpiry,
  calculateExpiryDate,
  COMPLIANCE_CATEGORIES,
} from '../types/compliance';
import { useCompanyCCNL } from './useCompanyCCNL';

interface UseComplianceReturn {
  items: ComplianceItem[];
  filteredItems: ComplianceItem[];
  riskScore: ComplianceRiskScore;
  isLoading: boolean;
  error: string | null;
  filters: ComplianceFilters;
  setFilters: (filters: ComplianceFilters) => void;
  uploadDocument: (requirementId: string, file: File) => Promise<void>;
  renewObligation: (statusId: string, newValidUntil: Date, file?: File, notes?: string) => Promise<void>;
  updateNotes: (statusId: string, notes: string) => Promise<void>;
  refetch: () => Promise<void>;
  ccnl: ReturnType<typeof useCompanyCCNL>;
}

export function useCompliance(companyId: string | undefined): UseComplianceReturn {
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([]);
  const [statuses, setStatuses] = useState<CompanyComplianceStatusRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ComplianceFilters>({});

  const ccnl = useCompanyCCNL(companyId);

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!companyId) {
      setRequirements([]);
      setStatuses([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch requirements
      const { data: reqData, error: reqError } = await supabase
        .from('compliance_requirements')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (reqError) throw reqError;

      const mappedRequirements: ComplianceRequirement[] = (reqData || []).map(row => ({
        id: row.id,
        category: row.category as ComplianceCategory,
        ccnlScope: row.ccnl_scope,
        obligationName: row.obligation_name,
        description: row.description,
        frequency: row.frequency,
        frequencyMonths: row.frequency_months,
        documentRequired: row.document_required,
        deadlineType: row.deadline_type as 'fixed_date' | 'recurring' | 'on_event',
        fixedDeadlineDay: row.fixed_deadline_day ?? undefined,
        fixedDeadlineMonth: row.fixed_deadline_month ?? undefined,
        isActive: row.is_active ?? true,
        sortOrder: row.sort_order ?? 0,
        createdAt: row.created_at,
      }));

      setRequirements(mappedRequirements);

      // Fetch statuses for this company
      const { data: statusData, error: statusError } = await supabase
        .from('company_compliance_status')
        .select('*')
        .eq('company_id', companyId);

      if (statusError) throw statusError;

      const mappedStatuses: CompanyComplianceStatusRecord[] = (statusData || []).map(row => ({
        id: row.id,
        companyId: row.company_id,
        requirementId: row.requirement_id,
        status: row.status as 'missing' | 'pending' | 'valid' | 'expired',
        documentUrl: row.document_url ?? undefined,
        documentName: row.document_name ?? undefined,
        uploadedBy: row.uploaded_by ?? undefined,
        uploadedAt: row.uploaded_at ?? undefined,
        validFrom: row.valid_from ?? undefined,
        validUntil: row.valid_until ?? undefined,
        notes: row.notes ?? undefined,
        lastReminderSent: row.last_reminder_sent ?? undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      setStatuses(mappedStatuses);
    } catch (err) {
      console.error('Error fetching compliance data:', err);
      setError('Errore nel caricamento dei dati compliance');
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Combine requirements with statuses and filter by company CCNLs
  const items: ComplianceItem[] = useMemo(() => {
    if (!companyId || ccnl.isLoading) return [];

    // Get active CCNL codes (always include 'Universale')
    const activeCCNLs = new Set(['Universale', ...ccnl.selections.map(s => s.ccnlCode)]);

    // Filter requirements by active CCNLs
    const filteredReqs = requirements.filter(req => activeCCNLs.has(req.ccnlScope));

    return filteredReqs.map(req => {
      const status = statuses.find(s => s.requirementId === req.id);
      
      const baseStatus: CompanyComplianceStatusRecord = status || {
        id: '',
        companyId,
        requirementId: req.id,
        status: 'missing',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const trafficLight = calculateTrafficLight(baseStatus.validUntil, baseStatus.status);
      const daysUntilExpiry = calculateDaysUntilExpiry(baseStatus.validUntil);

      return {
        ...baseStatus,
        requirement: req,
        trafficLight,
        daysUntilExpiry,
      };
    });
  }, [companyId, requirements, statuses, ccnl.selections, ccnl.isLoading]);

  // Apply filters
  const filteredItems: ComplianceItem[] = useMemo(() => {
    return items.filter(item => {
      if (filters.category && item.requirement.category !== filters.category) return false;
      if (filters.status && item.trafficLight !== filters.status) return false;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchesName = item.requirement.obligationName.toLowerCase().includes(search);
        const matchesDesc = item.requirement.description.toLowerCase().includes(search);
        if (!matchesName && !matchesDesc) return false;
      }
      return true;
    });
  }, [items, filters]);

  // Calculate risk score
  const riskScore: ComplianceRiskScore = useMemo(() => {
    const total = items.length;
    if (total === 0) {
      return {
        score: 100,
        totalObligations: 0,
        greenCount: 0,
        yellowCount: 0,
        redCount: 0,
        criticalItems: [],
        categoryBreakdown: {} as Record<ComplianceCategory, { total: number; green: number; yellow: number; red: number }>,
      };
    }

    const counts = { green: 0, yellow: 0, red: 0 };
    const categoryBreakdown: Record<string, { total: number; green: number; yellow: number; red: number }> = {};
    const criticalItems: ComplianceItem[] = [];

    // Initialize category breakdown
    COMPLIANCE_CATEGORIES.forEach(cat => {
      categoryBreakdown[cat] = { total: 0, green: 0, yellow: 0, red: 0 };
    });

    items.forEach(item => {
      counts[item.trafficLight]++;
      
      const cat = item.requirement.category;
      if (categoryBreakdown[cat]) {
        categoryBreakdown[cat].total++;
        categoryBreakdown[cat][item.trafficLight]++;
      }

      if (item.trafficLight === 'red') {
        criticalItems.push(item);
      }
    });

    // Score: green = 100 points, yellow = 50 points, red = 0 points
    const weights = { green: 100, yellow: 50, red: 0 };
    const sum = items.reduce((acc, item) => acc + weights[item.trafficLight], 0);
    const score = Math.round(sum / total);

    return {
      score,
      totalObligations: total,
      greenCount: counts.green,
      yellowCount: counts.yellow,
      redCount: counts.red,
      criticalItems: criticalItems.sort((a, b) => (a.daysUntilExpiry ?? -999) - (b.daysUntilExpiry ?? -999)),
      categoryBreakdown: categoryBreakdown as Record<ComplianceCategory, { total: number; green: number; yellow: number; red: number }>,
    };
  }, [items]);

  // Upload document for a requirement
  const uploadDocument = useCallback(async (requirementId: string, file: File) => {
    if (!companyId) throw new Error('Company ID is required');

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    // Find the requirement to get frequency
    const requirement = requirements.find(r => r.id === requirementId);
    if (!requirement) throw new Error('Requirement not found');

    // Upload file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${requirementId}_${Date.now()}.${fileExt}`;
    const filePath = `${companyId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('compliance-docs')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('compliance-docs')
      .getPublicUrl(filePath);

    const documentUrl = urlData.publicUrl;
    const now = new Date();
    const validUntil = calculateExpiryDate(requirement.frequencyMonths);

    // Check if status record exists
    const existingStatus = statuses.find(s => s.requirementId === requirementId);

    if (existingStatus && existingStatus.id) {
      // Update existing
      const { error: updateError } = await supabase
        .from('company_compliance_status')
        .update({
          status: 'valid',
          document_url: documentUrl,
          document_name: file.name,
          uploaded_by: user.id,
          uploaded_at: now.toISOString(),
          valid_from: now.toISOString().split('T')[0],
          valid_until: validUntil?.toISOString().split('T')[0] ?? null,
          updated_at: now.toISOString(),
        })
        .eq('id', existingStatus.id);

      if (updateError) throw updateError;

      // Log history
      await supabase.from('company_compliance_history').insert({
        compliance_status_id: existingStatus.id,
        action: 'upload',
        performed_by: user.id,
        old_status: existingStatus.status,
        new_status: 'valid',
        document_url: documentUrl,
      });
    } else {
      // Insert new
      const { data: insertedStatus, error: insertError } = await supabase
        .from('company_compliance_status')
        .insert({
          company_id: companyId,
          requirement_id: requirementId,
          status: 'valid',
          document_url: documentUrl,
          document_name: file.name,
          uploaded_by: user.id,
          uploaded_at: now.toISOString(),
          valid_from: now.toISOString().split('T')[0],
          valid_until: validUntil?.toISOString().split('T')[0] ?? null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Log history
      if (insertedStatus) {
        await supabase.from('company_compliance_history').insert({
          compliance_status_id: insertedStatus.id,
          action: 'upload',
          performed_by: user.id,
          old_status: 'missing',
          new_status: 'valid',
          document_url: documentUrl,
        });
      }
    }

    await fetchData();
  }, [companyId, requirements, statuses, fetchData]);

  // Renew an obligation
  const renewObligation = useCallback(async (
    statusId: string,
    newValidUntil: Date,
    file?: File,
    notes?: string
  ) => {
    if (!companyId) throw new Error('Company ID is required');

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    const existingStatus = statuses.find(s => s.id === statusId);
    if (!existingStatus) throw new Error('Status not found');

    let documentUrl = existingStatus.documentUrl;
    let documentName = existingStatus.documentName;

    // Upload new file if provided
    if (file) {
      const requirement = requirements.find(r => r.id === existingStatus.requirementId);
      const fileExt = file.name.split('.').pop();
      const fileName = `${existingStatus.requirementId}_${Date.now()}.${fileExt}`;
      const filePath = `${companyId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('compliance-docs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('compliance-docs')
        .getPublicUrl(filePath);

      documentUrl = urlData.publicUrl;
      documentName = file.name;
    }

    const now = new Date();

    const { error: updateError } = await supabase
      .from('company_compliance_status')
      .update({
        status: 'valid',
        document_url: documentUrl,
        document_name: documentName,
        uploaded_by: user.id,
        uploaded_at: now.toISOString(),
        valid_from: now.toISOString().split('T')[0],
        valid_until: newValidUntil.toISOString().split('T')[0],
        notes: notes || existingStatus.notes,
        updated_at: now.toISOString(),
      })
      .eq('id', statusId);

    if (updateError) throw updateError;

    // Log history
    await supabase.from('company_compliance_history').insert({
      compliance_status_id: statusId,
      action: 'renewal',
      performed_by: user.id,
      old_status: existingStatus.status,
      new_status: 'valid',
      document_url: documentUrl,
      notes: notes || undefined,
    });

    await fetchData();
  }, [companyId, requirements, statuses, fetchData]);

  // Update notes
  const updateNotes = useCallback(async (statusId: string, notes: string) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    const { error: updateError } = await supabase
      .from('company_compliance_status')
      .update({
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', statusId);

    if (updateError) throw updateError;

    // Log history
    await supabase.from('company_compliance_history').insert({
      compliance_status_id: statusId,
      action: 'note_added',
      performed_by: user.id,
      notes,
    });

    await fetchData();
  }, [fetchData]);

  return {
    items,
    filteredItems,
    riskScore,
    isLoading: isLoading || ccnl.isLoading,
    error: error || ccnl.error,
    filters,
    setFilters,
    uploadDocument,
    renewObligation,
    updateNotes,
    refetch: fetchData,
    ccnl,
  };
}
