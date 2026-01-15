import React, { useState } from 'react';
import { 
  Check, X, ChevronDown, ChevronUp, Briefcase, GraduationCap, 
  Award, Languages, Wrench, User, Loader2, Sparkles 
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { CVParsedData } from '../../src/components/karma/CVImportBanner';

interface CVReviewScreenProps {
  parsedData: CVParsedData;
  onConfirm: (selectedData: CVParsedData) => Promise<void>;
  onBack: () => void;
}

export const CVReviewScreen: React.FC<CVReviewScreenProps> = ({
  parsedData,
  onConfirm,
  onBack,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    profile: true,
    experiences: true,
    education: true,
    skills: true,
    certifications: true,
    languages: true,
  });

  // Selection state
  const [selectedProfile, setSelectedProfile] = useState(true);
  const [selectedExperiences, setSelectedExperiences] = useState<number[]>(
    parsedData.experiences.map((_, i) => i)
  );
  const [selectedEducation, setSelectedEducation] = useState<number[]>(
    parsedData.education.map((_, i) => i)
  );
  const [selectedSkills, setSelectedSkills] = useState<number[]>(
    parsedData.skills.map((_, i) => i)
  );
  const [selectedCertifications, setSelectedCertifications] = useState<number[]>(
    parsedData.certifications.map((_, i) => i)
  );
  const [selectedLanguages, setSelectedLanguages] = useState<number[]>(
    parsedData.languages.map((_, i) => i)
  );

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleItem = (
    list: number[],
    setList: React.Dispatch<React.SetStateAction<number[]>>,
    index: number
  ) => {
    if (list.includes(index)) {
      setList(list.filter(i => i !== index));
    } else {
      setList([...list, index]);
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    
    const selectedData: CVParsedData = {
      profileData: selectedProfile ? parsedData.profileData : undefined,
      experiences: selectedExperiences.map(i => parsedData.experiences[i]),
      education: selectedEducation.map(i => parsedData.education[i]),
      skills: selectedSkills.map(i => parsedData.skills[i]),
      certifications: selectedCertifications.map(i => parsedData.certifications[i]),
      languages: selectedLanguages.map(i => parsedData.languages[i]),
    };

    try {
      await onConfirm(selectedData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalSelected = 
    (selectedProfile ? 1 : 0) +
    selectedExperiences.length +
    selectedEducation.length +
    selectedSkills.length +
    selectedCertifications.length +
    selectedLanguages.length;

  const SectionHeader = ({ 
    icon: Icon, 
    title, 
    count, 
    selectedCount,
    sectionKey 
  }: { 
    icon: any; 
    title: string; 
    count: number;
    selectedCount: number;
    sectionKey: string;
  }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-xl"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-jnana-sage/10 flex items-center justify-center">
          <Icon size={20} className="text-jnana-sage" />
        </div>
        <div className="text-left">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">
            {selectedCount} di {count} selezionati
          </p>
        </div>
      </div>
      {expandedSections[sectionKey] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
    </button>
  );

  const CheckboxItem = ({ 
    checked, 
    onChange, 
    children 
  }: { 
    checked: boolean; 
    onChange: () => void; 
    children: React.ReactNode;
  }) => (
    <label className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/30 cursor-pointer transition-colors">
      <div 
        onClick={(e) => { e.preventDefault(); onChange(); }}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
          checked 
            ? 'bg-jnana-sage border-jnana-sage' 
            : 'border-border hover:border-jnana-sage/50'
        }`}
      >
        {checked && <Check size={14} className="text-white" />}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </label>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-jnana-sage to-jnana-sageDark flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">Revisione Dati CV</h1>
              <p className="text-sm text-muted-foreground">Seleziona cosa importare nel tuo profilo</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{totalSelected} elementi selezionati</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Profile Data */}
        {parsedData.profileData && (
          <Card className="overflow-hidden">
            <SectionHeader 
              icon={User} 
              title="Dati Personali" 
              count={1} 
              selectedCount={selectedProfile ? 1 : 0}
              sectionKey="profile"
            />
            {expandedSections.profile && (
              <div className="px-4 pb-4">
                <CheckboxItem checked={selectedProfile} onChange={() => setSelectedProfile(!selectedProfile)}>
                  <div className="space-y-1">
                    {parsedData.profileData.firstName && (
                      <p><span className="text-muted-foreground">Nome:</span> {parsedData.profileData.firstName} {parsedData.profileData.lastName}</p>
                    )}
                    {parsedData.profileData.headline && (
                      <p><span className="text-muted-foreground">Headline:</span> {parsedData.profileData.headline}</p>
                    )}
                    {parsedData.profileData.location && (
                      <p><span className="text-muted-foreground">Località:</span> {parsedData.profileData.location}</p>
                    )}
                    {parsedData.profileData.yearsExperience && (
                      <p><span className="text-muted-foreground">Esperienza:</span> {parsedData.profileData.yearsExperience} anni</p>
                    )}
                  </div>
                </CheckboxItem>
              </div>
            )}
          </Card>
        )}

        {/* Experiences */}
        {parsedData.experiences.length > 0 && (
          <Card className="overflow-hidden">
            <SectionHeader 
              icon={Briefcase} 
              title="Esperienze Lavorative" 
              count={parsedData.experiences.length} 
              selectedCount={selectedExperiences.length}
              sectionKey="experiences"
            />
            {expandedSections.experiences && (
              <div className="px-4 pb-4 space-y-1">
                {parsedData.experiences.map((exp, i) => (
                  <div key={i}>
                    <CheckboxItem 
                      checked={selectedExperiences.includes(i)} 
                      onChange={() => toggleItem(selectedExperiences, setSelectedExperiences, i)}
                    >
                      <div>
                        <p className="font-medium text-foreground">{exp.role}</p>
                        <p className="text-sm text-muted-foreground">{exp.company}</p>
                        <p className="text-xs text-muted-foreground">
                          {exp.startDate} - {exp.isCurrent ? 'Presente' : exp.endDate}
                        </p>
                      </div>
                    </CheckboxItem>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Education */}
        {parsedData.education.length > 0 && (
          <Card className="overflow-hidden">
            <SectionHeader 
              icon={GraduationCap} 
              title="Formazione" 
              count={parsedData.education.length} 
              selectedCount={selectedEducation.length}
              sectionKey="education"
            />
            {expandedSections.education && (
              <div className="px-4 pb-4 space-y-1">
                {parsedData.education.map((edu, i) => (
                  <div key={i}>
                    <CheckboxItem 
                      checked={selectedEducation.includes(i)} 
                      onChange={() => toggleItem(selectedEducation, setSelectedEducation, i)}
                    >
                      <div>
                        <p className="font-medium text-foreground">{edu.degree}</p>
                        <p className="text-sm text-muted-foreground">{edu.institution}</p>
                        {edu.fieldOfStudy && <p className="text-xs text-muted-foreground">{edu.fieldOfStudy}</p>}
                      </div>
                    </CheckboxItem>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Skills */}
        {parsedData.skills.length > 0 && (
          <Card className="overflow-hidden">
            <SectionHeader 
              icon={Wrench} 
              title="Competenze" 
              count={parsedData.skills.length} 
              selectedCount={selectedSkills.length}
              sectionKey="skills"
            />
            {expandedSections.skills && (
              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-2">
                  {parsedData.skills.map((skill, i) => (
                    <button
                      key={i}
                      onClick={() => toggleItem(selectedSkills, setSelectedSkills, i)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedSkills.includes(i)
                          ? 'bg-jnana-sage text-white'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Certifications */}
        {parsedData.certifications.length > 0 && (
          <Card className="overflow-hidden">
            <SectionHeader 
              icon={Award} 
              title="Certificazioni" 
              count={parsedData.certifications.length} 
              selectedCount={selectedCertifications.length}
              sectionKey="certifications"
            />
            {expandedSections.certifications && (
              <div className="px-4 pb-4 space-y-1">
                {parsedData.certifications.map((cert, i) => (
                  <div key={i}>
                    <CheckboxItem 
                      checked={selectedCertifications.includes(i)} 
                      onChange={() => toggleItem(selectedCertifications, setSelectedCertifications, i)}
                    >
                      <p className="font-medium text-foreground">{cert.name}</p>
                    </CheckboxItem>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Languages */}
        {parsedData.languages.length > 0 && (
          <Card className="overflow-hidden">
            <SectionHeader 
              icon={Languages} 
              title="Lingue" 
              count={parsedData.languages.length} 
              selectedCount={selectedLanguages.length}
              sectionKey="languages"
            />
            {expandedSections.languages && (
              <div className="px-4 pb-4 space-y-1">
                {parsedData.languages.map((lang, i) => (
                  <div key={i}>
                    <CheckboxItem 
                      checked={selectedLanguages.includes(i)} 
                      onChange={() => toggleItem(selectedLanguages, setSelectedLanguages, i)}
                    >
                      <p className="font-medium text-foreground">{lang.language}</p>
                    </CheckboxItem>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-card border-t p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <Button variant="ghost" onClick={onBack} disabled={isSubmitting}>
            ← Indietro
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isSubmitting || totalSelected === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                Importazione...
              </>
            ) : (
              <>
                <Check size={18} className="mr-2" />
                Importa {totalSelected} elementi
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
