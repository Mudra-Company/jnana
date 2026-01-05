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
  Clock
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

            <ResponsiveContainer width="100%" height={250}>
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
          </Card>
        )}

        {/* Karma AI Results */}
        {hasKarma && profile.karmaData && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              Analisi Karma AI
            </h2>

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

            {profile.karmaData.summary && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Riepilogo</p>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{profile.karmaData.summary}</p>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Hard Skills */}
      {profile.hardSkills && profile.hardSkills.length > 0 && (
        <Card className="p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Hard Skills ({profile.hardSkills.length})
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

      {/* Portfolio */}
      {profile.portfolio && profile.portfolio.length > 0 && (
        <Card className="p-6 mt-6">
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
        <Card className="p-6 mt-6">
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
      <Card className="p-4 mt-6 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Registrato: {new Date(profile.createdAt).toLocaleDateString('it-IT')}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Aggiornato: {new Date(profile.updatedAt).toLocaleDateString('it-IT')}
          </span>
          <span>
            Visibilità: <span className="capitalize">{profile.profileVisibility === 'subscribers_only' ? 'Solo abbonati' : 'Privato'}</span>
          </span>
        </div>
      </Card>
    </div>
  );
};
