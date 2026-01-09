import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';

export type BotType = 'jnana' | 'karma_talents';

export interface BotObjective {
  id: string;
  label: string;
  enabled: boolean;
}

export interface ProfileInputs {
  riasec_score: boolean;
  experiences: boolean;
  education: boolean;
  hard_skills: boolean;
  bio: boolean;
  headline: boolean;
  portfolio: boolean;
  certifications: boolean;
  languages: boolean;
  company_context?: boolean;
  // Organizational context inputs (for Jnana B2B)
  org_position?: boolean;
  direct_reports?: boolean;
  org_level?: boolean;
}

export interface KarmaBotConfig {
  id: string;
  bot_type: BotType;
  version: number;
  is_active: boolean;
  system_prompt: string;
  objectives: BotObjective[];
  profile_inputs: ProfileInputs;
  model: string;
  max_exchanges: number;
  temperature: number;
  closing_patterns: string[];
  version_notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface KarmaBotDocument {
  id: string;
  bot_type: BotType;
  file_name: string;
  file_path: string;
  file_size_bytes: number;
  mime_type: string;
  extracted_text: string | null;
  extraction_status: 'pending' | 'processing' | 'completed' | 'failed';
  is_active: boolean;
  uploaded_by: string | null;
  created_at: string;
}

export function useKarmaBotConfig(botType: BotType) {
  const [configs, setConfigs] = useState<KarmaBotConfig[]>([]);
  const [activeConfig, setActiveConfig] = useState<KarmaBotConfig | null>(null);
  const [documents, setDocuments] = useState<KarmaBotDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('karma_bot_configs')
        .select('*')
        .eq('bot_type', botType)
        .order('version', { ascending: false });

      if (fetchError) throw fetchError;

      const typedConfigs = (data || []).map(config => ({
        ...config,
        objectives: (config.objectives || []) as unknown as BotObjective[],
        profile_inputs: (config.profile_inputs || {}) as unknown as ProfileInputs,
        closing_patterns: (config.closing_patterns || []) as unknown as string[],
      })) as KarmaBotConfig[];

      setConfigs(typedConfigs);
      setActiveConfig(typedConfigs.find(c => c.is_active) || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento');
    } finally {
      setLoading(false);
    }
  }, [botType]);

  const fetchDocuments = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('karma_bot_documents')
        .select('*')
        .eq('bot_type', botType)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setDocuments((data || []) as KarmaBotDocument[]);
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  }, [botType]);

  useEffect(() => {
    fetchConfigs();
    fetchDocuments();
  }, [fetchConfigs, fetchDocuments]);

  const saveNewVersion = useCallback(async (
    config: Partial<KarmaBotConfig>,
    versionNotes: string
  ): Promise<boolean> => {
    setSaving(true);
    setError(null);

    try {
      // Get current max version
      const maxVersion = configs.length > 0 ? Math.max(...configs.map(c => c.version)) : 0;
      const newVersion = maxVersion + 1;

      // Deactivate all other versions
      await supabase
        .from('karma_bot_configs')
        .update({ is_active: false })
        .eq('bot_type', botType);

      // Insert new version as active
      const { error: insertError } = await supabase
        .from('karma_bot_configs')
        .insert({
          bot_type: botType,
          version: newVersion,
          is_active: true,
          system_prompt: config.system_prompt || '',
          objectives: JSON.parse(JSON.stringify(config.objectives || [])),
          profile_inputs: JSON.parse(JSON.stringify(config.profile_inputs || {})),
          model: config.model || 'google/gemini-2.5-flash',
          max_exchanges: config.max_exchanges || 8,
          temperature: config.temperature || 0.7,
          closing_patterns: JSON.parse(JSON.stringify(config.closing_patterns || [])),
          version_notes: versionNotes,
        });

      if (insertError) throw insertError;

      await fetchConfigs();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel salvataggio');
      return false;
    } finally {
      setSaving(false);
    }
  }, [botType, configs, fetchConfigs]);

  const activateVersion = useCallback(async (versionId: string): Promise<boolean> => {
    setSaving(true);
    setError(null);

    try {
      // Deactivate all versions
      await supabase
        .from('karma_bot_configs')
        .update({ is_active: false })
        .eq('bot_type', botType);

      // Activate selected version
      const { error: updateError } = await supabase
        .from('karma_bot_configs')
        .update({ is_active: true })
        .eq('id', versionId);

      if (updateError) throw updateError;

      await fetchConfigs();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'attivazione');
      return false;
    } finally {
      setSaving(false);
    }
  }, [botType, fetchConfigs]);

  const uploadDocument = useCallback(async (file: File): Promise<boolean> => {
    setSaving(true);
    setError(null);

    try {
      const filePath = `${botType}/${Date.now()}_${file.name}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('karma-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data: insertedDoc, error: insertError } = await supabase
        .from('karma_bot_documents')
        .insert({
          bot_type: botType,
          file_name: file.name,
          file_path: filePath,
          file_size_bytes: file.size,
          mime_type: file.type,
          extraction_status: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Trigger text extraction edge function
      if (insertedDoc) {
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          await fetch(`${supabaseUrl}/functions/v1/extract-document-text`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              document_id: insertedDoc.id,
              file_path: filePath,
              mime_type: file.type,
            }),
          });
        } catch (extractErr) {
          console.error('Text extraction trigger failed:', extractErr);
          // Don't fail the upload if extraction fails - it can be retried
        }
      }

      await fetchDocuments();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento');
      return false;
    } finally {
      setSaving(false);
    }
  }, [botType, fetchDocuments]);

  const deleteDocument = useCallback(async (docId: string, filePath: string): Promise<boolean> => {
    setSaving(true);
    setError(null);

    try {
      // Delete from storage
      await supabase.storage.from('karma-documents').remove([filePath]);

      // Delete record
      const { error: deleteError } = await supabase
        .from('karma_bot_documents')
        .delete()
        .eq('id', docId);

      if (deleteError) throw deleteError;

      await fetchDocuments();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nella cancellazione');
      return false;
    } finally {
      setSaving(false);
    }
  }, [fetchDocuments]);

  const toggleDocumentActive = useCallback(async (docId: string, isActive: boolean): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('karma_bot_documents')
        .update({ is_active: isActive })
        .eq('id', docId);

      if (updateError) throw updateError;

      await fetchDocuments();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'aggiornamento');
      return false;
    }
  }, [fetchDocuments]);

  return {
    configs,
    activeConfig,
    documents,
    loading,
    saving,
    error,
    saveNewVersion,
    activateVersion,
    uploadDocument,
    deleteDocument,
    toggleDocumentActive,
    refetch: fetchConfigs,
  };
}
