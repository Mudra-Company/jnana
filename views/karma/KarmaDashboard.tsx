import React from 'react';
import {
  Hexagon, User, Briefcase, MapPin, Edit, ArrowRight,
  CheckCircle2, Circle, Sparkles, Star, Link2, Eye, EyeOff,
  AlertCircle, TrendingUp, LogOut, GraduationCap, Award,
  Languages, Building2, Linkedin, Github, Globe, ExternalLink,
  Home, FileText, Image, FolderOpen
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useKarmaProfile } from '../../src/hooks/useKarmaProfile';
import type { SocialPlatform } from '../../src/types/karma';

interface KarmaDashboardProps {
  onEditProfile: () => void;
  onStartTest: () => void;
  onViewResults: () => void;
  onLogout?: () => void;
  onGoHome?: () => void;
}

export const KarmaDashboard: React.FC<KarmaDashboardProps> = ({
  onEditProfile,
  onStartTest,
  onViewResults,
  onLogout,
  onGoHome,
}) => {
  const { 
    profile, 
    hardSkills, 
    socialLinks, 
    experiences, 
    education, 
    certifications, 
    languages,
    portfolio,
    isLoading 
  } = useKarmaProfile();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-jnana-bg via-white to-jnana-powder/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="animate-spin h-8 w-8 border-4 border-jnana-sage border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  // Calculate profile completion
  const calculateCompletion = (): { percent: number; items: { label: string; done: boolean }[] } => {
    const items = [
      { label: 'Nome e cognome', done: !!(profile.firstName && profile.lastName) },
      { label: 'Headline', done: !!profile.headline },
      { label: 'Foto profilo', done: !!profile.avatarUrl },
      { label: 'Bio', done: !!profile.bio },
      { label: 'Competenze', done: hardSkills.length > 0 },
      { label: 'Esperienze lavorative', done: experiences.length > 0 },
      { label: 'Formazione', done: education.length > 0 },
      { label: 'Link social', done: socialLinks.length > 0 },
      { label: 'Test RIASEC', done: !!profile.riasecScore },
      { label: 'Colloquio Karma', done: !!profile.karmaData },
    ];
    
    const done = items.filter(i => i.done).length;
    return { percent: Math.round((done / items.length) * 100), items };
  };

  const completion = calculateCompletion();
  const hasCompletedTests = profile.riasecScore && profile.karmaData;

  const getPlatformIcon = (platform: SocialPlatform) => {
    switch (platform) {
      case 'linkedin': return Linkedin;
      case 'github': return Github;
      case 'portfolio': return Globe;
      default: return Link2;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' });
  };

  const PROFICIENCY_LABELS: Record<string, string> = {
    native: 'Madrelingua',
    fluent: 'Fluente',
    professional: 'Professionale',
    intermediate: 'Intermedio',
    basic: 'Base',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-jnana-bg via-white to-jnana-powder/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Hexagon size={28} className="text-jnana-sage" strokeWidth={1.5} />
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight lowercase">
                karma
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={onGoHome}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Home size={16} />
              Home
            </button>
            <Button variant="outline" size="sm" onClick={onEditProfile}>
              <Edit size={16} className="mr-2" />
              Modifica
            </Button>
            {onLogout && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onLogout} 
                className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <LogOut size={16} className="mr-2" />
                Esci
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Profile Header Card */}
        <Card className="mb-6 overflow-hidden">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0 relative">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={`${profile.firstName} ${profile.lastName}`}
                  className="w-28 h-28 md:w-36 md:h-36 rounded-2xl object-cover border-4 border-white dark:border-gray-700 shadow-xl"
                />
              ) : (
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-gradient-to-br from-jnana-sage/20 to-jnana-powder flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-xl">
                  <User size={48} className="text-jnana-sage/50" />
                </div>
              )}
              
              {/* Status Badge */}
              {profile.lookingForWork && (
                <div className="absolute -bottom-2 -right-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                  <Eye size={12} />
                  Disponibile
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {profile.firstName || 'Nome'} {profile.lastName || 'Cognome'}
                  </h2>
                  
                  {profile.headline ? (
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-3">
                      {profile.headline}
                    </p>
                  ) : (
                    <p className="text-lg text-gray-400 dark:text-gray-500 mb-3 italic">
                      Aggiungi una headline...
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                    {profile.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {profile.location}
                      </span>
                    )}
                    {profile.yearsExperience !== undefined && profile.yearsExperience > 0 && (
                      <span className="flex items-center gap-1">
                        <Briefcase size={14} />
                        {profile.yearsExperience}+ anni esp.
                      </span>
                    )}
                    {profile.preferredWorkType && profile.preferredWorkType !== 'any' && (
                      <span className="flex items-center gap-1">
                        <Home size={14} />
                        {profile.preferredWorkType === 'remote' ? 'Full Remote' : 
                         profile.preferredWorkType === 'hybrid' ? 'Ibrido' : 'In Sede'}
                      </span>
                    )}
                  </div>

                  {/* RIASEC + Badges */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {profile.profileCode && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-jnana-sage/10 rounded-full">
                        <Hexagon size={14} className="text-jnana-sage" />
                        <span className="text-sm font-bold text-jnana-sage">
                          {profile.profileCode}
                        </span>
                      </span>
                    )}
                    {hardSkills.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                        <Star size={14} className="text-blue-500" />
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {hardSkills.length} skill{hardSkills.length > 1 ? 's' : ''}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Completion Circle */}
                <div className="hidden md:block flex-shrink-0 text-center">
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle
                        cx="40" cy="40" r="36"
                        stroke="currentColor" strokeWidth="6" fill="none"
                        className="text-gray-200 dark:text-gray-700"
                      />
                      <circle
                        cx="40" cy="40" r="36"
                        stroke="currentColor" strokeWidth="6" fill="none"
                        strokeDasharray={226}
                        strokeDashoffset={226 - (226 * completion.percent) / 100}
                        className="text-jnana-sage transition-all duration-500"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-900 dark:text-white">
                      {completion.percent}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Profilo completo</p>
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {profile.bio}
                </p>
              )}

              {/* Social Links */}
              {socialLinks.length > 0 && (
                <div className="flex gap-2 mt-4">
                  {socialLinks.map(link => {
                    const Icon = getPlatformIcon(link.platform);
                    return (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-jnana-sage hover:bg-jnana-sage/10 transition-colors"
                        title={link.platform}
                      >
                        <Icon size={18} />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Experiences */}
            <Card>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Briefcase size={20} className="text-jnana-sage" />
                Esperienze Lavorative
              </h3>

              {experiences.length > 0 ? (
                <div className="space-y-4">
                  {experiences.slice(0, 3).map((exp, idx) => (
                    <div key={exp.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <Building2 size={18} className="text-gray-500" />
                        </div>
                        {idx < experiences.length - 1 && idx < 2 && (
                          <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{exp.role}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{exp.company}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDate(exp.startDate)} - {exp.isCurrent ? 'Presente' : formatDate(exp.endDate)}
                          {exp.location && ` · ${exp.location}`}
                        </p>
                        {exp.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {experiences.length > 3 && (
                    <button 
                      onClick={onEditProfile}
                      className="text-sm text-jnana-sage hover:underline"
                    >
                      Vedi tutte le {experiences.length} esperienze →
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Briefcase size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-gray-400 text-sm mb-3">Nessuna esperienza aggiunta</p>
                  <Button variant="outline" size="sm" onClick={onEditProfile}>
                    Aggiungi esperienze
                  </Button>
                </div>
              )}
            </Card>

            {/* Education */}
            <Card>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <GraduationCap size={20} className="text-jnana-sage" />
                Formazione
              </h3>

              {education.length > 0 ? (
                <div className="space-y-3">
                  {education.slice(0, 2).map(edu => (
                    <div key={edu.id} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <GraduationCap size={18} className="text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{edu.degree}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{edu.institution}</p>
                        {edu.fieldOfStudy && (
                          <p className="text-xs text-gray-500">{edu.fieldOfStudy}</p>
                        )}
                        {edu.endYear && (
                          <p className="text-xs text-gray-500 mt-1">{edu.endYear}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {education.length > 2 && (
                    <button 
                      onClick={onEditProfile}
                      className="text-sm text-jnana-sage hover:underline"
                    >
                      Vedi tutti i {education.length} titoli →
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-400 text-sm">
                    Nessuna formazione aggiunta. 
                    <button onClick={onEditProfile} className="text-jnana-sage hover:underline ml-1">
                      Aggiungila ora
                    </button>
                  </p>
                </div>
              )}
            </Card>

            {/* Skills */}
            <Card>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Star size={20} className="text-jnana-sage" />
                Competenze
              </h3>

              {hardSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {hardSkills.map(skill => (
                    <span
                      key={skill.id}
                      className="px-3 py-1.5 bg-jnana-sage/10 text-jnana-sage rounded-full text-sm font-medium flex items-center gap-1"
                    >
                      {skill.skill?.name || skill.customSkillName}
                      <span className="text-xs opacity-60">
                        {'★'.repeat(skill.proficiencyLevel)}
                      </span>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-400 text-sm">
                    Nessuna competenza aggiunta. 
                    <button onClick={onEditProfile} className="text-jnana-sage hover:underline ml-1">
                      Aggiungile ora
                    </button>
                  </p>
                </div>
              )}
            </Card>

            {/* Certifications */}
            {certifications.length > 0 && (
              <Card>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Award size={20} className="text-jnana-sage" />
                  Certificazioni
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {certifications.slice(0, 4).map(cert => (
                    <div key={cert.id} className="flex gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-800/30 flex items-center justify-center flex-shrink-0">
                        <Award size={16} className="text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">{cert.name}</h4>
                        {cert.issuingOrganization && (
                          <p className="text-xs text-gray-500 truncate">{cert.issuingOrganization}</p>
                        )}
                        {cert.credentialUrl && (
                          <a
                            href={cert.credentialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-jnana-sage hover:underline mt-1"
                          >
                            Vedi <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Portfolio Section */}
            {portfolio.length > 0 && (
              <Card>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FolderOpen size={20} className="text-jnana-sage" />
                  Portfolio
                </h3>
                <div className="space-y-3">
                  {portfolio.map(item => {
                    const getItemIcon = () => {
                      switch (item.itemType) {
                        case 'cv': return FileText;
                        case 'certificate': return Award;
                        case 'image': return Image;
                        default: return FileText;
                      }
                    };
                    const ItemIcon = getItemIcon();
                    const getItemLabel = () => {
                      switch (item.itemType) {
                        case 'cv': return 'CV';
                        case 'certificate': return 'Certificato';
                        case 'image': return 'Immagine';
                        case 'project': return 'Progetto';
                        default: return 'Documento';
                      }
                    };
                    
                    return (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                          <ItemIcon size={18} className="text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                            {item.title}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {getItemLabel()} • {formatDate(item.createdAt)}
                          </p>
                        </div>
                        {(item.fileUrl || item.externalUrl) && (
                          <a
                            href={item.fileUrl || item.externalUrl || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-lg bg-jnana-sage/10 flex items-center justify-center text-jnana-sage hover:bg-jnana-sage/20 transition-colors"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Test Status Card */}
            <Card>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Sparkles size={20} className="text-jnana-sage" />
                Test Psicoattitudinali
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Hexagon size={18} className={profile.riasecScore ? 'text-green-500' : 'text-gray-400'} />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">Test RIASEC</h4>
                      <p className="text-xs text-gray-500">Interessi professionali</p>
                    </div>
                  </div>
                  {profile.riasecScore ? (
                    <CheckCircle2 size={18} className="text-green-500" />
                  ) : (
                    <Circle size={18} className="text-gray-300" />
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Sparkles size={18} className={profile.karmaData ? 'text-green-500' : 'text-gray-400'} />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">Karma AI</h4>
                      <p className="text-xs text-gray-500">Soft skills e valori</p>
                    </div>
                  </div>
                  {profile.karmaData ? (
                    <CheckCircle2 size={18} className="text-green-500" />
                  ) : (
                    <Circle size={18} className="text-gray-300" />
                  )}
                </div>
              </div>

              {!hasCompletedTests ? (
                <Button className="w-full mt-4" onClick={onStartTest}>
                  {!profile.riasecScore ? 'Inizia Test RIASEC' : 'Continua con Karma AI'}
                  <ArrowRight size={18} className="ml-2" />
                </Button>
              ) : (
                <Button variant="secondary" className="w-full mt-4" onClick={onViewResults}>
                  Vedi i tuoi risultati
                  <ArrowRight size={18} className="ml-2" />
                </Button>
              )}
            </Card>

            {/* Languages */}
            {languages.length > 0 && (
              <Card>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Languages size={20} className="text-jnana-sage" />
                  Lingue
                </h3>
                <div className="space-y-2">
                  {languages.map(lang => (
                    <div key={lang.id} className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">{lang.language}</span>
                      <span className="text-sm text-gray-500">
                        {PROFICIENCY_LABELS[lang.proficiency] || lang.proficiency}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Profile Completion Checklist */}
            <Card>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-jnana-sage" />
                Completa il Profilo
              </h3>

              <div className="space-y-2">
                {completion.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    {item.done ? (
                      <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                    ) : (
                      <Circle size={16} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${item.done ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Visibility Status Card */}
            {profile.profileVisibility === 'subscribers_only' ? (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <div className="flex items-start gap-3">
                  <Eye size={18} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-800 dark:text-green-300 text-sm mb-1">
                      Profilo Visibile
                    </h4>
                    <p className="text-xs text-green-700 dark:text-green-400">
                      Il tuo profilo è visibile alle aziende in cerca di talenti.
                      {profile.lookingForWork && " Sei segnalato come 'in cerca di lavoro'."}
                    </p>
                    <button 
                      onClick={onEditProfile} 
                      className="text-xs text-green-600 dark:text-green-500 hover:underline mt-2 font-medium"
                    >
                      Modifica preferenze →
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 text-sm mb-1">
                      Profilo Privato
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Il tuo profilo non è visibile alle aziende. Attiva la visibilità per essere trovato.
                    </p>
                    <button 
                      onClick={onEditProfile} 
                      className="text-xs text-jnana-sage hover:underline mt-2 font-medium"
                    >
                      Attiva visibilità →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
