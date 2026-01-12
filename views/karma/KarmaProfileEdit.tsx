import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  User, Camera, MapPin, Briefcase, Save, ArrowLeft,
  Plus, Star, Linkedin, Github, Globe, Link2, Trash2, X, Sparkles, Info
} from 'lucide-react';
import { Button } from '../../components/Button';
import { toast } from '../../src/hooks/use-toast';
import { Card } from '../../components/Card';
import { useKarmaProfile } from '../../src/hooks/useKarmaProfile';
import { useHardSkillsCatalog } from '../../src/hooks/useHardSkillsCatalog';
import { PortfolioManager } from '../../src/components/karma/PortfolioManager';
import { CVImportBanner } from '../../src/components/karma/CVImportBanner';
import { ExperienceManager } from '../../src/components/karma/ExperienceManager';
import { EducationManager } from '../../src/components/karma/EducationManager';
import { CertificationManager } from '../../src/components/karma/CertificationManager';
import { LanguagesManager } from '../../src/components/karma/LanguagesManager';
import { VisibilitySettingsCard } from '../../src/components/karma/VisibilitySettingsCard';
import type { WorkType, SocialPlatform, ParsedCVData, ProfileVisibility } from '../../src/types/karma';

interface KarmaProfileEditProps {
  onBack: () => void;
  onSave: () => void;
}

export const KarmaProfileEdit: React.FC<KarmaProfileEditProps> = ({ onBack, onSave }) => {
  const {
    profile,
    hardSkills,
    portfolio,
    socialLinks,
    experiences,
    education,
    certifications,
    languages,
    isLoading,
    updateProfile,
    uploadAvatar,
    addHardSkill,
    removeHardSkill,
    updateSkillProficiency,
    addPortfolioItem,
    removePortfolioItem,
    uploadPortfolioFile,
    upsertSocialLink,
    removeSocialLink,
    addExperience,
    updateExperience,
    removeExperience,
    addEducation,
    updateEducation,
    removeEducation,
    addCertification,
    updateCertification,
    removeCertification,
    addLanguage,
    updateLanguage,
    removeLanguage,
    importFromCV,
  } = useKarmaProfile();

  const { skills } = useHardSkillsCatalog();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    headline: '',
    location: '',
    region: '',
    bio: '',
    yearsExperience: 0,
    lookingForWork: false,
    preferredWorkType: 'any' as WorkType,
    profileVisibility: 'private' as ProfileVisibility,
    wantsKarmaVisibility: false,
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [skillSearch, setSkillSearch] = useState('');
  const [customSkill, setCustomSkill] = useState('');
  const [newSocialPlatform, setNewSocialPlatform] = useState<SocialPlatform | ''>('');
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [showCVBanner, setShowCVBanner] = useState(true);
  const initialFormData = useRef<typeof formData | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (profile) {
      const newFormData = {
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        headline: profile.headline || '',
        location: profile.location || '',
        region: profile.region || '',
        bio: profile.bio || '',
        yearsExperience: profile.yearsExperience || 0,
        lookingForWork: profile.lookingForWork,
        preferredWorkType: profile.preferredWorkType || 'any',
        profileVisibility: profile.profileVisibility || 'private',
        wantsKarmaVisibility: profile.wantsKarmaVisibility || false,
      };
      setFormData(newFormData);
      initialFormData.current = newFormData;
      setAvatarPreview(profile.avatarUrl || null);
    }
  }, [profile]);

  // Track dirty state
  useEffect(() => {
    if (initialFormData.current) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData.current);
      setIsDirty(hasChanges);
    }
  }, [formData]);

  // Warn on navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const filteredSkills = skillSearch
    ? skills.filter(s =>
        s.name.toLowerCase().includes(skillSearch.toLowerCase()) &&
        !hardSkills.some(hs => hs.skillId === s.id)
      )
    : [];

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Preview
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
      
      // Upload
      await uploadAvatar(file);
    }
  };

  const handleAddSkill = async (skillId: string) => {
    await addHardSkill(skillId, undefined, 3);
    setSkillSearch('');
  };

  const handleAddCustomSkill = async () => {
    if (customSkill.trim()) {
      await addHardSkill(undefined, customSkill.trim(), 3);
      setCustomSkill('');
    }
  };

  const handleAddSocialLink = async () => {
    if (newSocialPlatform && newSocialUrl.trim()) {
      await upsertSocialLink(newSocialPlatform, newSocialUrl.trim());
      setNewSocialPlatform('');
      setNewSocialUrl('');
    }
  };

  // Handle parsed CV data - auto-fill profile and skills
  const handleCVParsed = async (data: ParsedCVData) => {
    // Update form data with parsed info
    setFormData(prev => ({
      ...prev,
      firstName: data.firstName || prev.firstName,
      lastName: data.lastName || prev.lastName,
      headline: data.headline || prev.headline,
      bio: data.bio || prev.bio,
      location: data.location || prev.location,
      yearsExperience: data.yearsExperience || prev.yearsExperience,
    }));

    // Add parsed skills
    if (data.skills && data.skills.length > 0) {
      for (const skillName of data.skills.slice(0, 10)) {
        // Check if skill exists in catalog
        const catalogSkill = skills.find(s => 
          s.name.toLowerCase() === skillName.toLowerCase()
        );
        
        if (catalogSkill) {
          // Check if already added
          const alreadyAdded = hardSkills.some(hs => hs.skillId === catalogSkill.id);
          if (!alreadyAdded) {
            await addHardSkill(catalogSkill.id, undefined, 3);
          }
        } else {
          // Add as custom skill if not already present
          const alreadyCustom = hardSkills.some(hs => 
            hs.customSkillName?.toLowerCase() === skillName.toLowerCase()
          );
          if (!alreadyCustom) {
            await addHardSkill(undefined, skillName, 3);
          }
        }
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        headline: formData.headline,
        location: formData.location,
        region: formData.region,
        bio: formData.bio,
        yearsExperience: formData.yearsExperience,
        lookingForWork: formData.lookingForWork,
        preferredWorkType: formData.preferredWorkType,
        profileVisibility: formData.profileVisibility,
        wantsKarmaVisibility: formData.wantsKarmaVisibility,
      });
      initialFormData.current = formData;
      setIsDirty(false);
      toast({ title: "Profilo salvato!", description: "Le modifiche al profilo sono state salvate con successo." });
      onSave();
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: "Errore", description: "Impossibile salvare il profilo.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (isDirty) {
      if (window.confirm('Hai modifiche non salvate. Vuoi uscire senza salvare?')) {
        onBack();
      }
    } else {
      onBack();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-jnana-sage border-t-transparent rounded-full" />
      </div>
    );
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin': return Linkedin;
      case 'github': return Github;
      case 'portfolio': return Globe;
      default: return Link2;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-jnana-bg via-white to-jnana-powder/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Indietro</span>
            {isDirty && <span className="text-xs text-amber-500 ml-1">(modifiche non salvate)</span>}
          </button>
          
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Salvataggio...
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                Salva
              </>
            )}
          </Button>
        </div>

        {/* CV Import Banner - Full mode for new profiles */}
        {showCVBanner && experiences.length === 0 && education.length === 0 && (
          <div className="mb-6">
            <CVImportBanner
              mode="full"
              onUploadFile={(file) => uploadPortfolioFile(file, 'cv')}
              onAddPortfolioItem={addPortfolioItem}
              onImportComplete={async (data) => {
                // Update local form state
                if (data.profileData) {
                  const newFormData = {
                    firstName: data.profileData?.firstName || formData.firstName,
                    lastName: data.profileData?.lastName || formData.lastName,
                    headline: data.profileData?.headline || formData.headline,
                    bio: data.profileData?.bio || formData.bio,
                    location: data.profileData?.location || formData.location,
                    yearsExperience: data.profileData?.yearsExperience || formData.yearsExperience,
                    lookingForWork: formData.lookingForWork,
                    preferredWorkType: formData.preferredWorkType,
                  };
                  setFormData(newFormData);
                  
                  // Auto-save profile data to database
                  await updateProfile({
                    firstName: newFormData.firstName,
                    lastName: newFormData.lastName,
                    headline: newFormData.headline,
                    bio: newFormData.bio,
                    location: newFormData.location,
                    yearsExperience: newFormData.yearsExperience,
                  });
                }
                
                // Import experiences, education, certifications, languages, skills
                await importFromCV({
                  experiences: data.experiences,
                  education: data.education,
                  certifications: data.certifications,
                  languages: data.languages,
                  skills: data.skills,
                });
                setShowCVBanner(false);
              }}
              onSkip={() => setShowCVBanner(false)}
            />
          </div>
        )}

        {/* Avatar Section */}
        <Card className="mb-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white dark:border-gray-700 shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-lg">
                  <User size={32} className="text-gray-400" />
                </div>
              )}
              
              <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-jnana-sage text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-jnana-sageDark transition-colors shadow-lg">
                <Camera size={14} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex-1">
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                Foto Profilo
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Carica una foto professionale. Formati accettati: JPG, PNG.
              </p>
              
              {/* CV Re-upload option for existing profiles */}
              {(experiences.length > 0 || education.length > 0 || hardSkills.length > 0) && (
                <CVImportBanner
                  mode="compact"
                  onUploadFile={(file) => uploadPortfolioFile(file, 'cv')}
                  onAddPortfolioItem={addPortfolioItem}
                  onImportComplete={async (data) => {
                    // Update local form state
                    if (data.profileData) {
                      const newFormData = {
                        firstName: data.profileData?.firstName || formData.firstName,
                        lastName: data.profileData?.lastName || formData.lastName,
                        headline: data.profileData?.headline || formData.headline,
                        bio: data.profileData?.bio || formData.bio,
                        location: data.profileData?.location || formData.location,
                        yearsExperience: data.profileData?.yearsExperience || formData.yearsExperience,
                        lookingForWork: formData.lookingForWork,
                        preferredWorkType: formData.preferredWorkType,
                      };
                      setFormData(newFormData);
                      
                      // Auto-save profile data to database
                      await updateProfile({
                        firstName: newFormData.firstName,
                        lastName: newFormData.lastName,
                        headline: newFormData.headline,
                        bio: newFormData.bio,
                        location: newFormData.location,
                        yearsExperience: newFormData.yearsExperience,
                      });
                    }
                    
                    // Import experiences, education, certifications, languages, skills
                    await importFromCV({
                      experiences: data.experiences,
                      education: data.education,
                      certifications: data.certifications,
                      languages: data.languages,
                      skills: data.skills,
                    });
                  }}
                />
              )}
            </div>
          </div>
        </Card>

        {/* Basic Info */}
        <Card className="mb-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">
            Informazioni Base
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-jnana-sage focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cognome
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-jnana-sage focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Headline
              </label>
              <input
                type="text"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-jnana-sage focus:border-transparent transition-all"
                placeholder="Es: Senior Developer | React & Node.js"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Briefcase size={14} className="inline mr-1" />
                Anni di esperienza
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={formData.yearsExperience}
                onChange={(e) => setFormData({ ...formData, yearsExperience: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-jnana-sage focus:border-transparent transition-all"
                placeholder="Es: 15"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={6}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-jnana-sage focus:border-transparent transition-all resize-none"
                placeholder="Raccontaci qualcosa di te..."
              />
            </div>
          </div>
        </Card>

        {/* Visibility & Work Preferences - Unified */}
        <VisibilitySettingsCard
          profileVisibility={formData.profileVisibility}
          wantsKarmaVisibility={formData.wantsKarmaVisibility}
          lookingForWork={formData.lookingForWork}
          preferredWorkType={formData.preferredWorkType}
          location={formData.location}
          region={formData.region}
          onVisibilityChange={(visibility, karmaVisibility) => setFormData({ 
            ...formData, 
            profileVisibility: visibility,
            wantsKarmaVisibility: karmaVisibility
          })}
          onLookingForWorkChange={(value) => setFormData({ ...formData, lookingForWork: value })}
          onPreferredWorkTypeChange={(type) => setFormData({ ...formData, preferredWorkType: type })}
          onLocationChange={(location) => setFormData({ ...formData, location: location })}
          onRegionChange={(region) => setFormData({ ...formData, region: region })}
        />

        {/* Skills */}
        <Card className="mb-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">
            Competenze
          </h3>

          {/* Search */}
          <div className="relative mb-4">
            <input
              type="text"
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-jnana-sage focus:border-transparent transition-all"
              placeholder="Cerca competenze..."
            />
            
            {filteredSkills.length > 0 && skillSearch && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto z-10">
                {filteredSkills.slice(0, 6).map(skill => (
                  <button
                    key={skill.id}
                    onClick={() => handleAddSkill(skill.id)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {skill.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom skill */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomSkill()}
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-jnana-sage focus:border-transparent transition-all"
              placeholder="Aggiungi skill personalizzata..."
            />
            <Button variant="secondary" size="sm" onClick={handleAddCustomSkill} disabled={!customSkill.trim()}>
              <Plus size={16} />
            </Button>
          </div>

          {/* Skills list */}
          <div className="space-y-2">
            {hardSkills.map(skill => (
              <div key={skill.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <span className="flex-1 text-gray-900 dark:text-white">
                  {skill.skill?.name || skill.customSkillName}
                </span>
                
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button
                      key={level}
                      onClick={() => updateSkillProficiency(skill.id, level)}
                      className={`w-5 h-5 rounded-full transition-all ${
                        level <= skill.proficiencyLevel
                          ? 'bg-jnana-sage'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <Star size={10} className="mx-auto text-white" fill={level <= skill.proficiencyLevel ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => removeHardSkill(skill.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {hardSkills.length === 0 && (
              <p className="text-center text-gray-400 py-6">
                Nessuna competenza aggiunta
              </p>
            )}
          </div>
        </Card>

        {/* Experiences Section */}
        <Card className="mb-6">
          <ExperienceManager
            experiences={experiences}
            onAdd={addExperience}
            onUpdate={updateExperience}
            onRemove={removeExperience}
          />
        </Card>

        {/* Education Section */}
        <Card className="mb-6">
          <EducationManager
            education={education}
            onAdd={addEducation}
            onUpdate={updateEducation}
            onRemove={removeEducation}
          />
        </Card>

        {/* Certifications Section */}
        <Card className="mb-6">
          <CertificationManager
            certifications={certifications}
            onAdd={addCertification}
            onUpdate={updateCertification}
            onRemove={removeCertification}
          />
        </Card>

        {/* Languages Section */}
        <Card className="mb-6">
          <LanguagesManager
            languages={languages}
            onAdd={addLanguage}
            onUpdate={updateLanguage}
            onRemove={removeLanguage}
          />
        </Card>

        {/* Portfolio Section */}
        <Card className="mb-6">
          <PortfolioManager
            items={portfolio}
            onAddItem={addPortfolioItem}
            onRemoveItem={removePortfolioItem}
            onUploadFile={uploadPortfolioFile}
            onCVParsed={handleCVParsed}
            userId={profile?.id || ''}
          />
        </Card>

        {/* Social Links */}
        <Card className="mb-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">
            Link Social
          </h3>

          {/* Existing links */}
          <div className="space-y-2 mb-4">
            {socialLinks.map(link => {
              const Icon = getPlatformIcon(link.platform);
              return (
                <div key={link.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <Icon size={20} className="text-gray-500" />
                  <span className="flex-1 text-gray-900 dark:text-white truncate">
                    {link.url}
                  </span>
                  <button
                    onClick={() => removeSocialLink(link.platform)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add new link */}
          <div className="flex gap-2">
            <select
              value={newSocialPlatform}
              onChange={(e) => setNewSocialPlatform(e.target.value as SocialPlatform)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-jnana-sage focus:border-transparent transition-all"
            >
              <option value="">Piattaforma</option>
              <option value="linkedin">LinkedIn</option>
              <option value="github">GitHub</option>
              <option value="portfolio">Portfolio</option>
              <option value="twitter">Twitter</option>
              <option value="other">Altro</option>
            </select>
            <input
              type="url"
              value={newSocialUrl}
              onChange={(e) => setNewSocialUrl(e.target.value)}
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-jnana-sage focus:border-transparent transition-all"
              placeholder="URL del profilo..."
            />
            <Button variant="secondary" size="sm" onClick={handleAddSocialLink} disabled={!newSocialPlatform || !newSocialUrl.trim()}>
              <Plus size={16} />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
