import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  Star,
  Brain,
  Target,
  Heart,
  AlertTriangle,
  ExternalLink,
  Linkedin,
  Github,
  Globe,
  FileText,
  Award,
  FolderOpen,
  User,
  Clock,
  GraduationCap,
  Building2,
  Languages,
  BadgeCheck
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { useKarmaAdminSearch, KarmaSearchResult } from '../../src/hooks/useKarmaAdminSearch';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

interface KarmaProfileDetailViewProps {
  userId: string;
  onBack: () => void;
}

export const KarmaProfileDetailView: React.FC<KarmaProfileDetailViewProps> = ({ userId, onBack }) => {
  const { fetchProfile } = useKarmaAdminSearch();
  const [profileData, setProfileData] = useState<KarmaSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      const data = await fetchProfile(userId);
      setProfileData(data);
      setIsLoading(false);
    };
    loadProfile();
  }, [userId, fetchProfile]);

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna alla lista
        </Button>
        <Card className="p-8 text-center">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Profilo non trovato</p>
        </Card>
      </div>
    );
  }

  const { profile, hasRiasec, hasKarma, skillsCount } = profileData;

  // Prepare RIASEC chart data
  const riasecChartData = profile.riasecScore ? [
    { dimension: 'R - Realistico', value: profile.riasecScore.R, fullMark: 10 },
    { dimension: 'I - Investigativo', value: profile.riasecScore.I, fullMark: 10 },
    { dimension: 'A - Artistico', value: profile.riasecScore.A, fullMark: 10 },
    { dimension: 'S - Sociale', value: profile.riasecScore.S, fullMark: 10 },
    { dimension: 'E - Intraprendente', value: profile.riasecScore.E, fullMark: 10 },
    { dimension: 'C - Convenzionale', value: profile.riasecScore.C, fullMark: 10 },
  ] : [];

  // Proficiency level labels
  const proficiencyLabels: Record<number, string> = {
    1: 'Base',
    2: 'Intermedio',
    3: 'Competente',
    4: 'Avanzato',
    5: 'Esperto',
  };

  // Platform icons
  const platformIcons: Record<string, React.ReactNode> = {
    linkedin: <Linkedin className="w-4 h-4" />,
    github: <Github className="w-4 h-4" />,
    portfolio: <Globe className="w-4 h-4" />,
    twitter: <Globe className="w-4 h-4" />,
    other: <ExternalLink className="w-4 h-4" />,
  };

  // Language proficiency labels
  const languageProficiencyLabels: Record<string, string> = {
    native: 'Madrelingua',
    fluent: 'Fluente (C1-C2)',
    professional: 'Professionale (B2)',
    intermediate: 'Intermedio (B1)',
    basic: 'Base (A1-A2)',
  };

  // Helper: calculate experience duration
  const calculateDuration = (startDate?: string, endDate?: string, isCurrent?: boolean): string => {
    if (!startDate) return '';
    const start = new Date(startDate);
    const end = isCurrent ? new Date() : (endDate ? new Date(endDate) : new Date());
    const months = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years === 0) return `${remainingMonths} mesi`;
    if (remainingMonths === 0) return `${years} ${years === 1 ? 'anno' : 'anni'}`;
    return `${years} ${years === 1 ? 'anno' : 'anni'}, ${remainingMonths} mesi`;
  };

  // Helper: format date
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('it-IT', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Back Button */}
      <Button variant="ghost" onClick={onBack} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Torna alla lista
      </Button>

      {/* Profile Header */}
      <Card className="p-6 mb-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white font-bold text-3xl overflow-hidden flex-shrink-0">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              (profile.firstName?.[0] || profile.email[0]).toUpperCase()
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                {profile.firstName && profile.lastName 
                  ? `${profile.firstName} ${profile.lastName}`
                  : profile.email}
              </h1>
              {profile.lookingForWork && (
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-full">
                  In cerca di lavoro
                </span>
              )}
            </div>
            
            {profile.headline && (
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-3">{profile.headline}</p>
            )}
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {profile.email}
              </span>
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {profile.location}
                </span>
              )}
              {profile.jobTitle && (
                <span className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  {profile.jobTitle}
                </span>
              )}
              {profile.yearsExperience !== undefined && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {profile.yearsExperience} anni esperienza
                </span>
              )}
              {profile.preferredWorkType && (
                <span className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  {profile.preferredWorkType === 'remote' ? 'Remoto' : 
                   profile.preferredWorkType === 'hybrid' ? 'Ibrido' : 
                   profile.preferredWorkType === 'onsite' ? 'In sede' : 'Qualsiasi'}
                </span>
              )}
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-col gap-2">
            {hasRiasec && (
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded flex items-center gap-1">
                <Target className="w-4 h-4" />
                RIASEC
              </span>
            )}
            {hasKarma && (
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm rounded flex items-center gap-1">
                <Brain className="w-4 h-4" />
                Karma AI
              </span>
            )}
            {skillsCount > 0 && (
              <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-sm rounded flex items-center gap-1">
                <Star className="w-4 h-4" />
                {skillsCount} skills
              </span>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-300">{profile.bio}</p>
          </div>
        )}
      </Card>

      {/* Work Experiences */}
      {profile.experiences && profile.experiences.length > 0 && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-500" />
            Esperienze Lavorative ({profile.experiences.length})
          </h2>
          <div className="space-y-4">
            {profile.experiences.map((exp) => (
              <div 
                key={exp.id}
                className="relative pl-6 pb-4 border-l-2 border-blue-200 dark:border-blue-800 last:pb-0"
              >
                <div className="absolute -left-2 top-0 w-4 h-4 bg-blue-500 rounded-full" />
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white uppercase">
                    {exp.role}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2 mt-1">
                    <Building2 className="w-4 h-4" />
                    {exp.company}
                    {exp.location && (
                      <>
                        <span className="text-gray-400">•</span>
                        <MapPin className="w-3 h-3" />
                        {exp.location}
                      </>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(exp.startDate)} - {exp.isCurrent ? 'Presente' : formatDate(exp.endDate)}
                    <span className="text-gray-400 ml-1">({calculateDuration(exp.startDate, exp.endDate, exp.isCurrent)})</span>
                  </p>
                  {exp.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">{exp.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Education */}
      {profile.education && profile.education.length > 0 && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-green-500" />
            Formazione ({profile.education.length})
          </h2>
          <div className="space-y-4">
            {profile.education.map((edu) => (
              <div 
                key={edu.id}
                className="relative pl-6 pb-4 border-l-2 border-green-200 dark:border-green-800 last:pb-0"
              >
                <div className="absolute -left-2 top-0 w-4 h-4 bg-green-500 rounded-full" />
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white uppercase">
                    {edu.degree}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2 mt-1">
                    <Building2 className="w-4 h-4" />
                    {edu.institution}
                  </p>
                  {edu.fieldOfStudy && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {edu.fieldOfStudy}
                    </p>
                  )}
                  {(edu.startYear || edu.endYear) && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {edu.startYear || '?'} - {edu.endYear || 'Presente'}
                    </p>
                  )}
                  {edu.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">{edu.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Certifications */}
      {profile.certifications && profile.certifications.length > 0 && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-amber-500" />
            Certificazioni ({profile.certifications.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {profile.certifications.map((cert) => (
              <div 
                key={cert.id}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <Award className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 dark:text-white">{cert.name}</p>
                  {cert.issuingOrganization && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{cert.issuingOrganization}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-400">
                    {cert.issueDate && <span>Rilasciata: {formatDate(cert.issueDate)}</span>}
                    {cert.expiryDate && <span>• Scade: {formatDate(cert.expiryDate)}</span>}
                  </div>
                  {cert.credentialUrl && (
                    <a 
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-violet-600 hover:underline flex items-center gap-1 mt-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Verifica credenziale
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Hard Skills */}
      {profile.hardSkills && profile.hardSkills.length > 0 && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-violet-500" />
            Competenze Tecniche ({profile.hardSkills.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {profile.hardSkills.map((skill) => (
              <div 
                key={skill.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {skill.skill?.name || skill.customSkillName}
                  </p>
                  {skill.skill?.category && (
                    <p className="text-xs text-gray-500">{skill.skill.category}</p>
                  )}
                </div>
                <span className="text-xs px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded">
                  {proficiencyLabels[skill.proficiencyLevel]}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Languages */}
      {profile.languages && profile.languages.length > 0 && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Languages className="w-5 h-5 text-teal-500" />
            Lingue ({profile.languages.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {profile.languages.map((lang) => (
              <div 
                key={lang.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <p className="font-medium text-gray-800 dark:text-white">{lang.language}</p>
                <span className="text-xs px-2 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded">
                  {languageProficiencyLabels[lang.proficiency] || lang.proficiency}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* RIASEC & Karma AI Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* RIASEC Results */}
        {hasRiasec && profile.riasecScore && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              Profilo RIASEC
            </h2>
            
            {profile.profileCode && (
              <div className="mb-4 text-center">
                <span className="text-3xl font-mono font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                  {profile.profileCode}
                </span>
              </div>
            )}

            <div className="aspect-square max-h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={riasecChartData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis 
                    dataKey="dimension" 
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Karma AI Results */}
        {hasKarma && profile.karmaData && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              Analisi Karma AI
            </h2>

            {/* Summary at the top */}
            {profile.karmaData.summary && (
              <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">Riepilogo AI</p>
                <p className="text-gray-700 dark:text-gray-200">{profile.karmaData.summary}</p>
              </div>
            )}

            {profile.karmaData.seniorityAssessment && (
              <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Seniority Assessment</p>
                <p className="font-semibold text-purple-700 dark:text-purple-300 capitalize">
                  {profile.karmaData.seniorityAssessment}
                </p>
              </div>
            )}

            {profile.karmaData.softSkills && profile.karmaData.softSkills.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  Soft Skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {profile.karmaData.softSkills.map((skill, i) => (
                    <span 
                      key={i}
                      className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.karmaData.primaryValues && profile.karmaData.primaryValues.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  Valori Primari
                </p>
                <div className="flex flex-wrap gap-2">
                  {profile.karmaData.primaryValues.map((value, i) => (
                    <span 
                      key={i}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded"
                    >
                      {value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.karmaData.riskFactors && profile.karmaData.riskFactors.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Fattori di Rischio
                </p>
                <div className="flex flex-wrap gap-2">
                  {profile.karmaData.riskFactors.map((risk, i) => (
                    <span 
                      key={i}
                      className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm rounded"
                    >
                      {risk}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Portfolio */}
      {profile.portfolio && profile.portfolio.length > 0 && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-green-500" />
            Portfolio ({profile.portfolio.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.portfolio.map((item) => (
              <div 
                key={item.id}
                className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="p-2 bg-white dark:bg-gray-700 rounded">
                  {item.itemType === 'cv' ? <FileText className="w-5 h-5 text-blue-500" /> :
                   item.itemType === 'certificate' ? <Award className="w-5 h-5 text-amber-500" /> :
                   <FolderOpen className="w-5 h-5 text-green-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 dark:text-white truncate">{item.title}</p>
                  {item.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    {item.fileUrl && (
                      <a 
                        href={item.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-violet-600 hover:underline flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        Visualizza file
                      </a>
                    )}
                    {item.externalUrl && (
                      <a 
                        href={item.externalUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-violet-600 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Link esterno
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Social Links */}
      {profile.socialLinks && profile.socialLinks.length > 0 && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-500" />
            Link Social
          </h2>
          <div className="flex flex-wrap gap-3">
            {profile.socialLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {platformIcons[link.platform] || <ExternalLink className="w-4 h-4" />}
                <span className="capitalize text-gray-700 dark:text-gray-300">{link.platform}</span>
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* Metadata */}
      <Card className="p-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Registrato: {new Date(profile.createdAt).toLocaleDateString('it-IT')}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Aggiornato: {new Date(profile.updatedAt).toLocaleDateString('it-IT')}
          </span>
          <span className="flex items-center gap-1">
            <User className="w-4 h-4" />
            Visibilità: {profile.profileVisibility === 'subscribers_only' ? 'Solo abbonati' : 'Privato'}
          </span>
        </div>
      </Card>
    </div>
  );
};

export default KarmaProfileDetailView;
