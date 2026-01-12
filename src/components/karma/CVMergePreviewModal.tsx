import React, { useState, useMemo } from 'react';
import { X, Check, FileText, GraduationCap, Award, Languages, Wrench, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../../../components/Button';
import type { UserExperience, UserEducation, UserCertification, UserLanguage, UserHardSkill } from '../../types/karma';

// Types for parsed CV data
interface ParsedExperience {
  company: string;
  role: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
  sortOrder: number;
}

interface ParsedEducation {
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  endYear?: number;
  sortOrder: number;
}

interface ParsedCertification {
  name: string;
}

interface ParsedLanguage {
  language: string;
  proficiency: string;
}

export interface CVMergeData {
  experiences: ParsedExperience[];
  education: ParsedEducation[];
  certifications: ParsedCertification[];
  languages: ParsedLanguage[];
  skills: string[];
}

export interface SelectedMergeData {
  experiences: ParsedExperience[];
  education: ParsedEducation[];
  certifications: ParsedCertification[];
  languages: ParsedLanguage[];
  skills: string[];
}

interface CVMergePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  parsedData: CVMergeData;
  existingData: {
    experiences: UserExperience[];
    education: UserEducation[];
    certifications: UserCertification[];
    languages: UserLanguage[];
    hardSkills: UserHardSkill[];
  };
  onConfirm: (selectedData: SelectedMergeData) => Promise<void>;
  isImporting?: boolean;
}

// Duplicate detection helpers
const normalizeString = (s: string | undefined | null): string => 
  (s || '').toLowerCase().trim();

const isExpDuplicate = (exp: ParsedExperience, existing: UserExperience[]): boolean =>
  existing.some(e => 
    normalizeString(e.company) === normalizeString(exp.company) &&
    normalizeString(e.role) === normalizeString(exp.role)
  );

const isEduDuplicate = (edu: ParsedEducation, existing: UserEducation[]): boolean =>
  existing.some(e =>
    normalizeString(e.institution) === normalizeString(edu.institution) &&
    normalizeString(e.degree) === normalizeString(edu.degree)
  );

const isCertDuplicate = (cert: ParsedCertification, existing: UserCertification[]): boolean =>
  existing.some(c => normalizeString(c.name) === normalizeString(cert.name));

const isLangDuplicate = (lang: ParsedLanguage, existing: UserLanguage[]): boolean =>
  existing.some(l => normalizeString(l.language) === normalizeString(lang.language));

const isSkillDuplicate = (skillName: string, existing: UserHardSkill[]): boolean =>
  existing.some(s => 
    normalizeString(s.skill?.name) === normalizeString(skillName) ||
    normalizeString(s.customSkillName) === normalizeString(skillName)
  );

export const CVMergePreviewModal: React.FC<CVMergePreviewModalProps> = ({
  isOpen,
  onClose,
  parsedData,
  existingData,
  onConfirm,
  isImporting = false,
}) => {
  // Track selected items by category and index
  const [selectedExperiences, setSelectedExperiences] = useState<Set<number>>(new Set());
  const [selectedEducation, setSelectedEducation] = useState<Set<number>>(new Set());
  const [selectedCertifications, setSelectedCertifications] = useState<Set<number>>(new Set());
  const [selectedLanguages, setSelectedLanguages] = useState<Set<number>>(new Set());
  const [selectedSkills, setSelectedSkills] = useState<Set<number>>(new Set());
  
  // Collapsed sections
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Analyze data and pre-select new items
  const analysis = useMemo(() => {
    const expAnalysis = parsedData.experiences.map((exp, idx) => ({
      ...exp,
      idx,
      isDuplicate: isExpDuplicate(exp, existingData.experiences),
    }));
    
    const eduAnalysis = parsedData.education.map((edu, idx) => ({
      ...edu,
      idx,
      isDuplicate: isEduDuplicate(edu, existingData.education),
    }));
    
    const certAnalysis = parsedData.certifications.map((cert, idx) => ({
      ...cert,
      idx,
      isDuplicate: isCertDuplicate(cert, existingData.certifications),
    }));
    
    const langAnalysis = parsedData.languages.map((lang, idx) => ({
      ...lang,
      idx,
      isDuplicate: isLangDuplicate(lang, existingData.languages),
    }));
    
    const skillAnalysis = parsedData.skills.map((skill, idx) => ({
      name: skill,
      idx,
      isDuplicate: isSkillDuplicate(skill, existingData.hardSkills),
    }));
    
    return { expAnalysis, eduAnalysis, certAnalysis, langAnalysis, skillAnalysis };
  }, [parsedData, existingData]);

  // Initialize selection with new items (run once)
  React.useEffect(() => {
    setSelectedExperiences(new Set(
      analysis.expAnalysis.filter(e => !e.isDuplicate).map(e => e.idx)
    ));
    setSelectedEducation(new Set(
      analysis.eduAnalysis.filter(e => !e.isDuplicate).map(e => e.idx)
    ));
    setSelectedCertifications(new Set(
      analysis.certAnalysis.filter(c => !c.isDuplicate).map(c => c.idx)
    ));
    setSelectedLanguages(new Set(
      analysis.langAnalysis.filter(l => !l.isDuplicate).map(l => l.idx)
    ));
    setSelectedSkills(new Set(
      analysis.skillAnalysis.filter(s => !s.isDuplicate).map(s => s.idx)
    ));
  }, [analysis]);

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const toggleItem = (
    set: Set<number>,
    setter: React.Dispatch<React.SetStateAction<Set<number>>>,
    idx: number
  ) => {
    setter(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const selectAllNew = () => {
    setSelectedExperiences(new Set(
      analysis.expAnalysis.filter(e => !e.isDuplicate).map(e => e.idx)
    ));
    setSelectedEducation(new Set(
      analysis.eduAnalysis.filter(e => !e.isDuplicate).map(e => e.idx)
    ));
    setSelectedCertifications(new Set(
      analysis.certAnalysis.filter(c => !c.isDuplicate).map(c => c.idx)
    ));
    setSelectedLanguages(new Set(
      analysis.langAnalysis.filter(l => !l.isDuplicate).map(l => l.idx)
    ));
    setSelectedSkills(new Set(
      analysis.skillAnalysis.filter(s => !s.isDuplicate).map(s => s.idx)
    ));
  };

  const deselectAll = () => {
    setSelectedExperiences(new Set());
    setSelectedEducation(new Set());
    setSelectedCertifications(new Set());
    setSelectedLanguages(new Set());
    setSelectedSkills(new Set());
  };

  const handleConfirm = async () => {
    const selectedData: SelectedMergeData = {
      experiences: parsedData.experiences.filter((_, idx) => selectedExperiences.has(idx)),
      education: parsedData.education.filter((_, idx) => selectedEducation.has(idx)),
      certifications: parsedData.certifications.filter((_, idx) => selectedCertifications.has(idx)),
      languages: parsedData.languages.filter((_, idx) => selectedLanguages.has(idx)),
      skills: parsedData.skills.filter((_, idx) => selectedSkills.has(idx)),
    };
    
    await onConfirm(selectedData);
  };

  // Count stats
  const totalNew = 
    analysis.expAnalysis.filter(e => !e.isDuplicate).length +
    analysis.eduAnalysis.filter(e => !e.isDuplicate).length +
    analysis.certAnalysis.filter(c => !c.isDuplicate).length +
    analysis.langAnalysis.filter(l => !l.isDuplicate).length +
    analysis.skillAnalysis.filter(s => !s.isDuplicate).length;

  const totalDuplicates =
    analysis.expAnalysis.filter(e => e.isDuplicate).length +
    analysis.eduAnalysis.filter(e => e.isDuplicate).length +
    analysis.certAnalysis.filter(c => c.isDuplicate).length +
    analysis.langAnalysis.filter(l => l.isDuplicate).length +
    analysis.skillAnalysis.filter(s => s.isDuplicate).length;

  const totalSelected = 
    selectedExperiences.size + 
    selectedEducation.size + 
    selectedCertifications.size + 
    selectedLanguages.size + 
    selectedSkills.size;

  if (!isOpen) return null;

  const renderCheckbox = (checked: boolean, onChange: () => void, disabled?: boolean) => (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
        ${checked 
          ? 'bg-jnana-sage border-jnana-sage text-white' 
          : 'border-gray-300 dark:border-gray-600 hover:border-jnana-sage'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {checked && <Check size={12} />}
    </button>
  );

  const renderBadge = (isDuplicate: boolean) => (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
      ${isDuplicate 
        ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400' 
        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
      }
    `}>
      {isDuplicate ? 'GIÀ PRESENTE' : 'NUOVO'}
    </span>
  );

  const renderSectionHeader = (
    icon: React.ReactNode,
    title: string,
    sectionKey: string,
    newCount: number,
    totalCount: number
  ) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium text-gray-900 dark:text-white">{title}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ({newCount} nuovi su {totalCount})
        </span>
      </div>
      {collapsedSections.has(sectionKey) ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Verifica i dati estratti dal CV
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {totalNew} nuovi elementi • {totalDuplicates} già presenti
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isImporting}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 p-3 border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={selectAllNew}
            className="text-sm text-jnana-sage hover:underline"
          >
            Seleziona tutti nuovi
          </button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <button
            onClick={deselectAll}
            className="text-sm text-gray-500 hover:underline"
          >
            Deseleziona tutto
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Experiences */}
          {analysis.expAnalysis.length > 0 && (
            <div className="space-y-2">
              {renderSectionHeader(
                <FileText size={18} className="text-blue-500" />,
                'Esperienze Lavorative',
                'experiences',
                analysis.expAnalysis.filter(e => !e.isDuplicate).length,
                analysis.expAnalysis.length
              )}
              
              {!collapsedSections.has('experiences') && (
                <div className="space-y-2 pl-2">
                  {analysis.expAnalysis.map((exp) => (
                    <div
                      key={exp.idx}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors
                        ${selectedExperiences.has(exp.idx)
                          ? 'border-jnana-sage/50 bg-jnana-sage/5'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                        }
                      `}
                    >
                      {renderCheckbox(
                        selectedExperiences.has(exp.idx),
                        () => toggleItem(selectedExperiences, setSelectedExperiences, exp.idx)
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900 dark:text-white truncate">
                            {exp.role}
                          </span>
                          {renderBadge(exp.isDuplicate)}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {exp.company}
                          {exp.startDate && ` • ${exp.startDate}`}
                          {exp.endDate && ` - ${exp.endDate}`}
                          {exp.isCurrent && ' - Presente'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Education */}
          {analysis.eduAnalysis.length > 0 && (
            <div className="space-y-2">
              {renderSectionHeader(
                <GraduationCap size={18} className="text-purple-500" />,
                'Formazione',
                'education',
                analysis.eduAnalysis.filter(e => !e.isDuplicate).length,
                analysis.eduAnalysis.length
              )}
              
              {!collapsedSections.has('education') && (
                <div className="space-y-2 pl-2">
                  {analysis.eduAnalysis.map((edu) => (
                    <div
                      key={edu.idx}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors
                        ${selectedEducation.has(edu.idx)
                          ? 'border-jnana-sage/50 bg-jnana-sage/5'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                        }
                      `}
                    >
                      {renderCheckbox(
                        selectedEducation.has(edu.idx),
                        () => toggleItem(selectedEducation, setSelectedEducation, edu.idx)
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900 dark:text-white truncate">
                            {edu.degree}
                          </span>
                          {renderBadge(edu.isDuplicate)}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {edu.institution}
                          {edu.fieldOfStudy && ` • ${edu.fieldOfStudy}`}
                          {edu.endYear && ` • ${edu.endYear}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Certifications */}
          {analysis.certAnalysis.length > 0 && (
            <div className="space-y-2">
              {renderSectionHeader(
                <Award size={18} className="text-amber-500" />,
                'Certificazioni',
                'certifications',
                analysis.certAnalysis.filter(c => !c.isDuplicate).length,
                analysis.certAnalysis.length
              )}
              
              {!collapsedSections.has('certifications') && (
                <div className="space-y-2 pl-2">
                  {analysis.certAnalysis.map((cert) => (
                    <div
                      key={cert.idx}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors
                        ${selectedCertifications.has(cert.idx)
                          ? 'border-jnana-sage/50 bg-jnana-sage/5'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                        }
                      `}
                    >
                      {renderCheckbox(
                        selectedCertifications.has(cert.idx),
                        () => toggleItem(selectedCertifications, setSelectedCertifications, cert.idx)
                      )}
                      <span className="font-medium text-gray-900 dark:text-white flex-1 truncate">
                        {cert.name}
                      </span>
                      {renderBadge(cert.isDuplicate)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Languages */}
          {analysis.langAnalysis.length > 0 && (
            <div className="space-y-2">
              {renderSectionHeader(
                <Languages size={18} className="text-cyan-500" />,
                'Lingue',
                'languages',
                analysis.langAnalysis.filter(l => !l.isDuplicate).length,
                analysis.langAnalysis.length
              )}
              
              {!collapsedSections.has('languages') && (
                <div className="space-y-2 pl-2">
                  {analysis.langAnalysis.map((lang) => (
                    <div
                      key={lang.idx}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors
                        ${selectedLanguages.has(lang.idx)
                          ? 'border-jnana-sage/50 bg-jnana-sage/5'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                        }
                      `}
                    >
                      {renderCheckbox(
                        selectedLanguages.has(lang.idx),
                        () => toggleItem(selectedLanguages, setSelectedLanguages, lang.idx)
                      )}
                      <span className="font-medium text-gray-900 dark:text-white flex-1">
                        {lang.language}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {lang.proficiency}
                      </span>
                      {renderBadge(lang.isDuplicate)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Skills */}
          {analysis.skillAnalysis.length > 0 && (
            <div className="space-y-2">
              {renderSectionHeader(
                <Wrench size={18} className="text-green-500" />,
                'Competenze',
                'skills',
                analysis.skillAnalysis.filter(s => !s.isDuplicate).length,
                analysis.skillAnalysis.length
              )}
              
              {!collapsedSections.has('skills') && (
                <div className="flex flex-wrap gap-2 pl-2 pt-2">
                  {analysis.skillAnalysis.map((skill) => (
                    <button
                      key={skill.idx}
                      onClick={() => toggleItem(selectedSkills, setSelectedSkills, skill.idx)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                        ${selectedSkills.has(skill.idx)
                          ? 'bg-jnana-sage text-white'
                          : skill.isDuplicate
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                        }
                      `}
                    >
                      {selectedSkills.has(skill.idx) && <Check size={12} />}
                      {skill.name}
                      {skill.isDuplicate && !selectedSkills.has(skill.idx) && (
                        <span className="text-xs opacity-60">(già presente)</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {totalSelected} elementi selezionati
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={isImporting}>
              Annulla
            </Button>
            <Button onClick={handleConfirm} disabled={isImporting || totalSelected === 0}>
              {isImporting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Importazione...
                </>
              ) : (
                `Importa ${totalSelected} elementi`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
