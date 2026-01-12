import React, { useState } from 'react';
import { FileUp, Sparkles, Check, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../../../components/Button';
import { supabase } from '../../integrations/supabase/client';
import type { ParsedCVData, UserExperience, UserEducation, UserCertification, UserLanguage } from '../../types/karma';

interface CVImportBannerProps {
  mode?: 'full' | 'compact';
  onImportComplete: (data: {
    profileData?: Partial<{ firstName: string; lastName: string; headline: string; bio: string; location: string; yearsExperience: number }>;
    experiences?: Omit<UserExperience, 'id' | 'userId' | 'createdAt'>[];
    education?: Omit<UserEducation, 'id' | 'userId' | 'createdAt'>[];
    certifications?: Omit<UserCertification, 'id' | 'userId' | 'createdAt'>[];
    languages?: Omit<UserLanguage, 'id' | 'userId' | 'createdAt'>[];
    skills?: string[];
  }) => Promise<void>;
  onSkip?: () => void;
  // NEW: Props for uploading CV to portfolio
  onUploadFile?: (file: File) => Promise<string | null>;
  onAddPortfolioItem?: (item: { itemType: 'cv'; title: string; description?: string; fileUrl?: string; sortOrder: number }) => Promise<any>;
}

export const CVImportBanner: React.FC<CVImportBannerProps> = ({ 
  mode = 'full', 
  onImportComplete, 
  onSkip,
  onUploadFile,
  onAddPortfolioItem,
}) => {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'parsing' | 'done' | 'error'>('idle');
  const [parseProgress, setParseProgress] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setStatus('uploading');
      setError(null);
      setParseProgress([]);

      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);

      const base64 = await base64Promise;
      setStatus('parsing');
      setParseProgress(['Analisi del CV in corso...']);

      // Call CV parser edge function
      const { data, error: parseError } = await supabase.functions.invoke('cv-parser', {
        body: {
          fileBase64: base64,
          fileType: file.type,
          fileName: file.name,
        },
      });

      if (parseError) throw parseError;
      if (data?.error) throw new Error(data.error);

      // Extract parsed data from response (edge function returns { data: ParsedCVData })
      const parsed = (data?.data || data) as ParsedCVData;
      
      // Calculate years of experience if not provided by AI
      if (!parsed.yearsExperience && parsed.experiences?.length > 0) {
        const parseDate = (dateStr: string | undefined): Date | null => {
          if (!dateStr) return null;
          // Handle MM/YYYY format
          const mmYyyy = dateStr.match(/^(\d{1,2})\/(\d{4})$/);
          if (mmYyyy) return new Date(parseInt(mmYyyy[2]), parseInt(mmYyyy[1]) - 1);
          // Handle YYYY format
          if (/^\d{4}$/.test(dateStr)) return new Date(parseInt(dateStr), 0);
          // Try standard parsing
          const d = new Date(dateStr);
          return isNaN(d.getTime()) ? null : d;
        };
        
        const allStartDates = parsed.experiences
          .map(exp => parseDate(exp.startDate))
          .filter((d): d is Date => d !== null);
        
        if (allStartDates.length > 0) {
          const earliest = new Date(Math.min(...allStartDates.map(d => d.getTime())));
          const now = new Date();
          parsed.yearsExperience = Math.floor((now.getTime() - earliest.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        }
      }

      // Build progress messages
      const progress: string[] = [];
      if (parsed.firstName || parsed.lastName) progress.push(`✓ Dati personali estratti`);
      if (parsed.experiences?.length) progress.push(`✓ ${parsed.experiences.length} esperienze lavorative trovate`);
      if (parsed.education?.length) progress.push(`✓ ${parsed.education.length} titoli di studio trovati`);
      if (parsed.skills?.length) progress.push(`✓ ${parsed.skills.length} competenze identificate`);
      if (parsed.certifications?.length) progress.push(`✓ ${parsed.certifications.length} certificazioni trovate`);
      if (parsed.languages?.length) progress.push(`✓ ${parsed.languages.length} lingue rilevate`);

      setParseProgress(progress);

      // Transform parsed data to match our types
      const experiences: Omit<UserExperience, 'id' | 'userId' | 'createdAt'>[] = (parsed.experiences || []).map((exp, idx) => {
        // Handle "Present", "Presente", "Current", "Attuale" - convert to undefined for DB (will be null)
        const endDateLower = (exp.endDate || '').toLowerCase().trim();
        const isCurrentJob = !exp.endDate || 
          endDateLower === 'present' ||
          endDateLower === 'presente' ||
          endDateLower === 'current' ||
          endDateLower === 'attuale' ||
          endDateLower === 'oggi' ||
          endDateLower === 'ad oggi';
        
        return {
          company: exp.company,
          role: exp.role,
          startDate: exp.startDate,
          endDate: isCurrentJob ? undefined : exp.endDate,
          isCurrent: isCurrentJob,
          description: exp.description,
          sortOrder: idx,
        };
      });

      const education: Omit<UserEducation, 'id' | 'userId' | 'createdAt'>[] = (parsed.education || []).map((edu, idx) => ({
        institution: edu.institution,
        degree: edu.degree,
        fieldOfStudy: edu.field,
        endYear: edu.year,
        sortOrder: idx,
      }));

      const certifications: Omit<UserCertification, 'id' | 'userId' | 'createdAt'>[] = (parsed.certifications || []).map(name => ({
        name,
      }));

      const languages: Omit<UserLanguage, 'id' | 'userId' | 'createdAt'>[] = (parsed.languages || []).map(lang => ({
        language: lang,
        proficiency: 'professional' as const,
      }));

      setStatus('done');

      // Save CV to portfolio if handlers are provided
      if (onUploadFile && onAddPortfolioItem) {
        try {
          const fileUrl = await onUploadFile(file);
          if (fileUrl) {
            await onAddPortfolioItem({
              itemType: 'cv',
              title: `CV - ${new Date().toLocaleDateString('it-IT')}`,
              description: 'Curriculum Vitae importato automaticamente',
              fileUrl,
              sortOrder: 0,
            });
          }
        } catch (portfolioError) {
          console.error('Failed to save CV to portfolio:', portfolioError);
          // Don't fail the whole import, just log the error
        }
      }

      // Call the onImportComplete with all data
      await onImportComplete({
        profileData: {
          firstName: parsed.firstName,
          lastName: parsed.lastName,
          headline: parsed.headline,
          bio: parsed.bio,
          location: parsed.location,
          yearsExperience: parsed.yearsExperience,
        },
        experiences,
        education,
        certifications,
        languages,
        skills: parsed.skills,
      });

    } catch (err: any) {
      console.error('CV parse error:', err);
      setStatus('error');
      setError(err.message || 'Errore durante l\'analisi del CV');
    }
  };

  // Compact mode - just a small button
  if (mode === 'compact') {
    if (status === 'uploading' || status === 'parsing') {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={14} className="animate-spin" />
          <span>{status === 'uploading' ? 'Caricamento...' : 'Analisi CV...'}</span>
        </div>
      );
    }

    if (status === 'done') {
      return (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <Check size={14} />
          <span>CV aggiornato!</span>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
          <label className="text-sm text-primary hover:underline cursor-pointer">
            Riprova
            <input
              type="file"
              accept=".pdf,.doc,.docx,image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>
      );
    }

    return (
      <label className="text-sm text-primary hover:underline cursor-pointer flex items-center gap-1.5">
        <RefreshCw size={14} />
        Ricarica CV
        <input
          type="file"
          accept=".pdf,.doc,.docx,image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </label>
    );
  }

  // Full mode below
  if (status === 'done') {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
            <Check size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-green-800 dark:text-green-300">CV Importato con successo!</h3>
            <p className="text-sm text-green-600 dark:text-green-400">I dati sono stati aggiunti al tuo profilo</p>
          </div>
        </div>
        <div className="space-y-1 text-sm text-green-700 dark:text-green-400">
          {parseProgress.map((msg, i) => (
            <p key={i}>{msg}</p>
          ))}
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
            <AlertCircle size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-red-800 dark:text-red-300">Errore durante l'importazione</h3>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setStatus('idle')}>Riprova</Button>
          {onSkip && <Button variant="ghost" size="sm" onClick={onSkip}>Compila manualmente</Button>}
        </div>
      </div>
    );
  }

  if (status === 'uploading' || status === 'parsing') {
    return (
      <div className="bg-gradient-to-r from-jnana-sage/10 to-jnana-powder/30 dark:from-jnana-sage/20 dark:to-gray-800 border border-jnana-sage/30 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-jnana-sage/20 flex items-center justify-center">
            <Loader2 size={24} className="text-jnana-sage animate-spin" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 dark:text-white">
              {status === 'uploading' ? 'Caricamento in corso...' : 'Analisi CV con AI...'}
            </h3>
            <div className="space-y-1 mt-2">
              {parseProgress.map((msg, i) => (
                <p key={i} className="text-sm text-jnana-sage flex items-center gap-2">
                  <Check size={14} /> {msg}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-jnana-sage/10 to-jnana-powder/30 dark:from-jnana-sage/20 dark:to-gray-800 border-2 border-dashed border-jnana-sage/40 rounded-2xl p-6 transition-all hover:border-jnana-sage/60">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-jnana-sage/20 flex items-center justify-center flex-shrink-0">
          <Sparkles size={32} className="text-jnana-sage" />
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            Inizia velocemente con il tuo CV
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Carica il tuo CV e l'intelligenza artificiale compilerà automaticamente il tuo profilo: 
            esperienze, formazione, competenze e molto altro.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="cursor-pointer inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none rounded-full tracking-wide bg-jnana-sage text-white hover:bg-jnana-sageDark hover:shadow-glow hover:-translate-y-0.5 shadow-sm px-8 py-3 text-sm">
            <FileUp size={18} className="mr-2" />
            Carica CV
            <input
              type="file"
              accept=".pdf,.doc,.docx,image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
          {onSkip && (
            <Button variant="ghost" size="sm" onClick={onSkip}>
              Compila manualmente
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};