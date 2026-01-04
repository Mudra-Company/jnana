import React, { useState, useCallback } from 'react';
import { 
  Hexagon, ArrowRight, ArrowLeft, User, MapPin, Briefcase, 
  Upload, Camera, Check, Link2, Linkedin, Github, Globe,
  Sparkles, Star
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useKarmaProfile } from '../../src/hooks/useKarmaProfile';
import { useHardSkillsCatalog } from '../../src/hooks/useHardSkillsCatalog';

interface KarmaOnboardingProps {
  onComplete: () => void;
  onSkip?: () => void;
}

type OnboardingStep = 1 | 2 | 3 | 4 | 5;

const TOTAL_STEPS = 5;

export const KarmaOnboarding: React.FC<KarmaOnboardingProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    headline: '',
    location: '',
    bio: '',
    yearsExperience: 0,
    lookingForWork: true,
    preferredWorkType: 'any' as 'remote' | 'hybrid' | 'onsite' | 'any',
  });
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<{ skillId: string; name: string; level: number }[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [socialLinks, setSocialLinks] = useState<{ platform: string; url: string }[]>([]);
  
  const { updateProfile, uploadAvatar, addHardSkill, upsertSocialLink } = useKarmaProfile();
  const { skills, searchSkills, isLoading: skillsLoading } = useHardSkillsCatalog();
  const [skillSearch, setSkillSearch] = useState('');

  const filteredSkills = skillSearch 
    ? skills.filter(s => 
        s.name.toLowerCase().includes(skillSearch.toLowerCase()) &&
        !selectedSkills.some(ss => ss.skillId === s.id)
      )
    : [];

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddSkill = (skillId: string, skillName: string) => {
    if (!selectedSkills.some(s => s.skillId === skillId)) {
      setSelectedSkills([...selectedSkills, { skillId, name: skillName, level: 3 }]);
    }
    setSkillSearch('');
  };

  const handleAddCustomSkill = () => {
    if (customSkill.trim() && !selectedSkills.some(s => s.name.toLowerCase() === customSkill.toLowerCase())) {
      setSelectedSkills([...selectedSkills, { skillId: '', name: customSkill.trim(), level: 3 }]);
      setCustomSkill('');
    }
  };

  const handleRemoveSkill = (index: number) => {
    setSelectedSkills(selectedSkills.filter((_, i) => i !== index));
  };

  const handleSkillLevelChange = (index: number, level: number) => {
    const updated = [...selectedSkills];
    updated[index].level = level;
    setSelectedSkills(updated);
  };

  const handleAddSocialLink = (platform: string) => {
    if (!socialLinks.some(l => l.platform === platform)) {
      setSocialLinks([...socialLinks, { platform, url: '' }]);
    }
  };

  const handleSocialLinkChange = (platform: string, url: string) => {
    setSocialLinks(socialLinks.map(l => l.platform === platform ? { ...l, url } : l));
  };

  const handleRemoveSocialLink = (platform: string) => {
    setSocialLinks(socialLinks.filter(l => l.platform !== platform));
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((currentStep + 1) as OnboardingStep);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as OnboardingStep);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    
    try {
      // Step 1: Update profile basic info
      await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        headline: formData.headline,
        location: formData.location,
        bio: formData.bio,
        yearsExperience: formData.yearsExperience,
        lookingForWork: formData.lookingForWork,
        preferredWorkType: formData.preferredWorkType,
        isKarmaProfile: true,
        profileVisibility: 'subscribers_only',
      });

      // Step 2: Upload avatar if provided
      if (avatarFile) {
        await uploadAvatar(avatarFile);
      }

      // Step 3: Add skills
      for (const skill of selectedSkills) {
        if (skill.skillId) {
          await addHardSkill(skill.skillId, undefined, skill.level);
        } else {
          await addHardSkill(undefined, skill.name, skill.level);
        }
      }

      // Step 4: Add social links
      for (const link of socialLinks) {
        if (link.url.trim()) {
          await upsertSocialLink(link.platform as any, link.url);
        }
      }

      onComplete();
    } catch (error) {
      console.error('Onboarding error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i + 1 === currentStep
              ? 'w-8 bg-jnana-sage'
              : i + 1 < currentStep
              ? 'w-2 bg-jnana-sage'
              : 'w-2 bg-gray-200 dark:bg-gray-700'
          }`}
        />
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Iniziamo dalle basi
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Raccontaci chi sei per creare il tuo profilo professionale
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nome *
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-jnana-sage focus:border-transparent transition-all"
            placeholder="Mario"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Cognome *
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-jnana-sage focus:border-transparent transition-all"
            placeholder="Rossi"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Headline professionale
        </label>
        <input
          type="text"
          value={formData.headline}
          onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-jnana-sage focus:border-transparent transition-all"
          placeholder="Senior Software Engineer | React & TypeScript"
        />
        <p className="text-xs text-gray-400 mt-1">
          Una breve descrizione che ti rappresenta professionalmente
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <MapPin size={14} className="inline mr-1" />
            Località
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-jnana-sage focus:border-transparent transition-all"
            placeholder="Milano, Italia"
          />
        </div>
        <div className="w-32">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Briefcase size={14} className="inline mr-1" />
            Esperienza
          </label>
          <select
            value={formData.yearsExperience}
            onChange={(e) => setFormData({ ...formData, yearsExperience: parseInt(e.target.value) })}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-jnana-sage focus:border-transparent transition-all"
          >
            <option value={0}>0-1 anni</option>
            <option value={2}>2-3 anni</option>
            <option value={4}>4-5 anni</option>
            <option value={6}>6-10 anni</option>
            <option value={10}>10+ anni</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          La tua foto profilo
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Un volto aumenta del 70% le possibilità di essere contattati
        </p>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative mb-6">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="Avatar preview"
              className="w-40 h-40 rounded-full object-cover border-4 border-jnana-sage shadow-lg"
            />
          ) : (
            <div className="w-40 h-40 rounded-full bg-gray-100 dark:bg-gray-800 border-4 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
              <User size={48} className="text-gray-400" />
            </div>
          )}
          
          <label className="absolute bottom-2 right-2 w-10 h-10 bg-jnana-sage text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-jnana-sageDark transition-colors shadow-lg">
            <Camera size={18} />
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </label>
        </div>

        {avatarPreview && (
          <button
            onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
            className="text-sm text-red-500 hover:text-red-600"
          >
            Rimuovi foto
          </button>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Bio
        </label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-jnana-sage focus:border-transparent transition-all resize-none"
          placeholder="Parlaci di te, dei tuoi interessi e della tua esperienza..."
        />
        <p className="text-xs text-gray-400 mt-1">
          {formData.bio.length}/500 caratteri
        </p>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Le tue competenze
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Aggiungi le skill che ti contraddistinguono
        </p>
      </div>

      {/* Search skills */}
      <div className="relative">
        <input
          type="text"
          value={skillSearch}
          onChange={(e) => setSkillSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-jnana-sage focus:border-transparent transition-all"
          placeholder="Cerca competenze (es. React, Python, Project Management...)"
        />
        
        {filteredSkills.length > 0 && skillSearch && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto z-10">
            {filteredSkills.slice(0, 8).map(skill => (
              <button
                key={skill.id}
                onClick={() => handleAddSkill(skill.id, skill.name)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
              >
                <span className="text-gray-900 dark:text-white">{skill.name}</span>
                {skill.category && (
                  <span className="text-xs text-gray-400">{skill.category}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Custom skill */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customSkill}
          onChange={(e) => setCustomSkill(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddCustomSkill()}
          className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-jnana-sage focus:border-transparent transition-all"
          placeholder="Aggiungi una skill personalizzata..."
        />
        <Button variant="secondary" onClick={handleAddCustomSkill} disabled={!customSkill.trim()}>
          Aggiungi
        </Button>
      </div>

      {/* Selected skills */}
      <div className="space-y-3">
        {selectedSkills.map((skill, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
          >
            <span className="flex-1 font-medium text-gray-900 dark:text-white">
              {skill.name}
            </span>
            
            {/* Proficiency level */}
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(level => (
                <button
                  key={level}
                  onClick={() => handleSkillLevelChange(index, level)}
                  className={`w-6 h-6 rounded-full transition-all ${
                    level <= skill.level
                      ? 'bg-jnana-sage text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                  }`}
                >
                  <Star size={12} className="mx-auto" fill={level <= skill.level ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
            
            <button
              onClick={() => handleRemoveSkill(index)}
              className="text-gray-400 hover:text-red-500"
            >
              ✕
            </button>
          </div>
        ))}

        {selectedSkills.length === 0 && (
          <p className="text-center text-gray-400 py-8">
            Nessuna competenza aggiunta. Inizia a cercare o aggiungi le tue skill.
          </p>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Link e social
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Collega i tuoi profili per mostrare il tuo lavoro
        </p>
      </div>

      {/* Quick add buttons */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {[
          { platform: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'bg-blue-600' },
          { platform: 'github', label: 'GitHub', icon: Github, color: 'bg-gray-900' },
          { platform: 'portfolio', label: 'Portfolio', icon: Globe, color: 'bg-jnana-sage' },
        ].map(({ platform, label, icon: Icon, color }) => (
          <button
            key={platform}
            onClick={() => handleAddSocialLink(platform)}
            disabled={socialLinks.some(l => l.platform === platform)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-white ${color} disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Social links list */}
      <div className="space-y-3">
        {socialLinks.map(link => {
          const Icon = link.platform === 'linkedin' ? Linkedin : link.platform === 'github' ? Github : Globe;
          return (
            <div key={link.platform} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                <Icon size={20} />
              </div>
              <input
                type="url"
                value={link.url}
                onChange={(e) => handleSocialLinkChange(link.platform, e.target.value)}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-jnana-sage focus:border-transparent transition-all"
                placeholder={`URL ${link.platform}...`}
              />
              <button
                onClick={() => handleRemoveSocialLink(link.platform)}
                className="text-gray-400 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          );
        })}

        {socialLinks.length === 0 && (
          <p className="text-center text-gray-400 py-8">
            Clicca sui pulsanti sopra per aggiungere i tuoi profili social
          </p>
        )}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Preferenze lavorative
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Aiutaci a trovare le opportunità giuste per te
        </p>
      </div>

      {/* Looking for work toggle */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              Sto cercando lavoro
            </h4>
            <p className="text-sm text-gray-500">
              Le aziende abbonate vedranno che sei disponibile
            </p>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={formData.lookingForWork}
              onChange={(e) => setFormData({ ...formData, lookingForWork: e.target.checked })}
              className="sr-only"
            />
            <div className={`w-14 h-8 rounded-full transition-colors ${formData.lookingForWork ? 'bg-jnana-sage' : 'bg-gray-300 dark:bg-gray-600'}`}>
              <div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform mt-1 ${formData.lookingForWork ? 'translate-x-7' : 'translate-x-1'}`} />
            </div>
          </div>
        </label>
      </div>

      {/* Work type preference */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Modalità di lavoro preferita
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'remote', label: 'Full Remote', desc: 'Lavoro da casa' },
            { value: 'hybrid', label: 'Ibrido', desc: 'Mix ufficio/casa' },
            { value: 'onsite', label: 'In Sede', desc: 'Solo ufficio' },
            { value: 'any', label: 'Indifferente', desc: 'Qualsiasi modalità' },
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setFormData({ ...formData, preferredWorkType: option.value as any })}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                formData.preferredWorkType === option.value
                  ? 'border-jnana-sage bg-jnana-sage/5'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <h4 className={`font-medium ${formData.preferredWorkType === option.value ? 'text-jnana-sage' : 'text-gray-900 dark:text-white'}`}>
                {option.label}
              </h4>
              <p className="text-sm text-gray-500">{option.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-8 p-6 bg-gradient-to-br from-jnana-sage/10 to-transparent rounded-2xl border border-jnana-sage/20">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-jnana-sage/20 rounded-xl">
            <Sparkles className="text-jnana-sage" size={24} />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-1">
              Quasi pronto!
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Dopo la registrazione potrai completare il test RIASEC e il colloquio AI Karma per un profilo ancora più completo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-jnana-bg via-white to-jnana-powder/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <Hexagon size={48} className="text-jnana-sage mx-auto mb-3" strokeWidth={1.5} />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight lowercase">
            karma
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Crea il tuo profilo professionale
          </p>
        </div>

        {renderStepIndicator()}

        <Card className="mb-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          {currentStep > 1 ? (
            <Button variant="ghost" onClick={handlePrev}>
              <ArrowLeft size={18} className="mr-2" />
              Indietro
            </Button>
          ) : (
            <Button variant="ghost" onClick={onSkip}>
              Salta
            </Button>
          )}

          {currentStep < TOTAL_STEPS ? (
            <Button 
              onClick={handleNext}
              disabled={currentStep === 1 && (!formData.firstName || !formData.lastName)}
            >
              Avanti
              <ArrowRight size={18} className="ml-2" />
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Salvataggio...
                </>
              ) : (
                <>
                  <Check size={18} className="mr-2" />
                  Completa
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
