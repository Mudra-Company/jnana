import React, { useState, useEffect } from 'react';
import {
  User, Camera, MapPin, Briefcase, Save, ArrowLeft,
  Plus, Star, Linkedin, Github, Globe, Link2, Trash2, X
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useKarmaProfile } from '../../src/hooks/useKarmaProfile';
import { useHardSkillsCatalog } from '../../src/hooks/useHardSkillsCatalog';
import type { WorkType, SocialPlatform } from '../../src/types/karma';

interface KarmaProfileEditProps {
  onBack: () => void;
  onSave: () => void;
}

export const KarmaProfileEdit: React.FC<KarmaProfileEditProps> = ({ onBack, onSave }) => {
  const {
    profile,
    hardSkills,
    socialLinks,
    isLoading,
    updateProfile,
    uploadAvatar,
    addHardSkill,
    removeHardSkill,
    updateSkillProficiency,
    upsertSocialLink,
    removeSocialLink,
  } = useKarmaProfile();

  const { skills } = useHardSkillsCatalog();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    headline: '',
    location: '',
    bio: '',
    yearsExperience: 0,
    lookingForWork: false,
    preferredWorkType: 'any' as WorkType,
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [skillSearch, setSkillSearch] = useState('');
  const [customSkill, setCustomSkill] = useState('');
  const [newSocialPlatform, setNewSocialPlatform] = useState<SocialPlatform | ''>('');
  const [newSocialUrl, setNewSocialUrl] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        headline: profile.headline || '',
        location: profile.location || '',
        bio: profile.bio || '',
        yearsExperience: profile.yearsExperience || 0,
        lookingForWork: profile.lookingForWork,
        preferredWorkType: profile.preferredWorkType || 'any',
      });
      setAvatarPreview(profile.avatarUrl || null);
    }
  }, [profile]);

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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        headline: formData.headline,
        location: formData.location,
        bio: formData.bio,
        yearsExperience: formData.yearsExperience,
        lookingForWork: formData.lookingForWork,
        preferredWorkType: formData.preferredWorkType,
      });
      onSave();
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
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
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Indietro</span>
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
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Carica una foto professionale. Formati accettati: JPG, PNG.
              </p>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <MapPin size={14} className="inline mr-1" />
                  Località
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-jnana-sage focus:border-transparent transition-all"
                  placeholder="Milano, Italia"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Briefcase size={14} className="inline mr-1" />
                  Anni di esperienza
                </label>
                <select
                  value={formData.yearsExperience}
                  onChange={(e) => setFormData({ ...formData, yearsExperience: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-jnana-sage focus:border-transparent transition-all"
                >
                  <option value={0}>0-1 anni</option>
                  <option value={2}>2-3 anni</option>
                  <option value={4}>4-5 anni</option>
                  <option value={6}>6-10 anni</option>
                  <option value={10}>10+ anni</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-jnana-sage focus:border-transparent transition-all resize-none"
                placeholder="Raccontaci qualcosa di te..."
              />
            </div>
          </div>
        </Card>

        {/* Work Preferences */}
        <Card className="mb-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">
            Preferenze Lavorative
          </h3>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Sto cercando lavoro
                </h4>
                <p className="text-sm text-gray-500">
                  Le aziende potranno vedere la tua disponibilità
                </p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.lookingForWork}
                  onChange={(e) => setFormData({ ...formData, lookingForWork: e.target.checked })}
                  className="sr-only"
                />
                <div className={`w-12 h-7 rounded-full transition-colors ${formData.lookingForWork ? 'bg-jnana-sage' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform mt-1 ${formData.lookingForWork ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
              </div>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Modalità di lavoro preferita
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'remote', label: 'Full Remote' },
                  { value: 'hybrid', label: 'Ibrido' },
                  { value: 'onsite', label: 'In Sede' },
                  { value: 'any', label: 'Indifferente' },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setFormData({ ...formData, preferredWorkType: option.value as WorkType })}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      formData.preferredWorkType === option.value
                        ? 'border-jnana-sage bg-jnana-sage/5 text-jnana-sage'
                        : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

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
