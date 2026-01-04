import React from 'react';
import {
  Hexagon, User, Briefcase, MapPin, Edit, ArrowRight,
  CheckCircle2, Circle, Sparkles, Star, Link2, Eye, 
  AlertCircle, TrendingUp
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useKarmaProfile } from '../../src/hooks/useKarmaProfile';
import type { KarmaProfile } from '../../src/types/karma';

interface KarmaDashboardProps {
  onEditProfile: () => void;
  onStartTest: () => void;
  onViewResults: () => void;
}

export const KarmaDashboard: React.FC<KarmaDashboardProps> = ({
  onEditProfile,
  onStartTest,
  onViewResults,
}) => {
  const { profile, hardSkills, socialLinks, isLoading } = useKarmaProfile();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
      { label: 'Link social', done: socialLinks.length > 0 },
      { label: 'Test RIASEC', done: !!profile.riasecScore },
      { label: 'Colloquio Karma', done: !!profile.karmaData },
    ];
    
    const done = items.filter(i => i.done).length;
    return { percent: Math.round((done / items.length) * 100), items };
  };

  const completion = calculateCompletion();
  const hasCompletedTests = profile.riasecScore && profile.karmaData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-jnana-bg via-white to-jnana-powder/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Hexagon size={32} className="text-jnana-sage" strokeWidth={1.5} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight lowercase">
                karma
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Dashboard</p>
            </div>
          </div>
          
          <Button variant="outline" size="sm" onClick={onEditProfile}>
            <Edit size={16} className="mr-2" />
            Modifica Profilo
          </Button>
        </div>

        {/* Profile Card */}
        <Card className="mb-6 overflow-hidden">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={`${profile.firstName} ${profile.lastName}`}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover border-4 border-white dark:border-gray-700 shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-lg">
                  <User size={40} className="text-gray-400" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {profile.firstName} {profile.lastName}
              </h2>
              
              {profile.headline && (
                <p className="text-gray-600 dark:text-gray-300 mb-3">
                  {profile.headline}
                </p>
              )}

              <div className="flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {profile.location}
                  </span>
                )}
                {profile.yearsExperience && (
                  <span className="flex items-center gap-1">
                    <Briefcase size={14} />
                    {profile.yearsExperience}+ anni exp.
                  </span>
                )}
                {profile.lookingForWork && (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <Eye size={14} />
                    Aperto a opportunità
                  </span>
                )}
              </div>

              {/* RIASEC Code Badge */}
              {profile.profileCode && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-jnana-sage/10 rounded-full">
                  <Hexagon size={14} className="text-jnana-sage" />
                  <span className="text-sm font-bold text-jnana-sage">
                    Profilo {profile.profileCode}
                  </span>
                </div>
              )}
            </div>

            {/* Completion Circle */}
            <div className="flex-shrink-0 text-center">
              <div className="relative w-20 h-20 mx-auto">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
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
              <p className="text-xs text-gray-500 mt-2">Profilo completo</p>
            </div>
          </div>
        </Card>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Test Status Card */}
            <Card>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Sparkles size={20} className="text-jnana-sage" />
                Test Psicoattitudinali
              </h3>

              <div className="space-y-3">
                {/* RIASEC */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Hexagon size={20} className={profile.riasecScore ? 'text-green-500' : 'text-gray-400'} />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Test RIASEC</h4>
                      <p className="text-xs text-gray-500">Interessi professionali</p>
                    </div>
                  </div>
                  {profile.riasecScore ? (
                    <span className="flex items-center gap-1 text-green-500 text-sm">
                      <CheckCircle2 size={16} />
                      Completato
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">Da fare</span>
                  )}
                </div>

                {/* Karma AI */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Sparkles size={20} className={profile.karmaData ? 'text-green-500' : 'text-gray-400'} />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Colloquio Karma AI</h4>
                      <p className="text-xs text-gray-500">Soft skills e valori</p>
                    </div>
                  </div>
                  {profile.karmaData ? (
                    <span className="flex items-center gap-1 text-green-500 text-sm">
                      <CheckCircle2 size={16} />
                      Completato
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">Da fare</span>
                  )}
                </div>
              </div>

              {/* CTA */}
              {!hasCompletedTests && (
                <Button className="w-full mt-4" onClick={onStartTest}>
                  {!profile.riasecScore ? 'Inizia Test RIASEC' : 'Continua con Karma AI'}
                  <ArrowRight size={18} className="ml-2" />
                </Button>
              )}

              {hasCompletedTests && (
                <Button variant="secondary" className="w-full mt-4" onClick={onViewResults}>
                  Vedi i tuoi risultati
                  <ArrowRight size={18} className="ml-2" />
                </Button>
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
                  {hardSkills.slice(0, 8).map(skill => (
                    <span
                      key={skill.id}
                      className="px-3 py-1.5 bg-jnana-sage/10 text-jnana-sage rounded-full text-sm font-medium"
                    >
                      {skill.skill?.name || skill.customSkillName}
                    </span>
                  ))}
                  {hardSkills.length > 8 && (
                    <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full text-sm">
                      +{hardSkills.length - 8} altre
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">
                  Nessuna competenza aggiunta. 
                  <button onClick={onEditProfile} className="text-jnana-sage hover:underline ml-1">
                    Aggiungile ora
                  </button>
                </p>
              )}
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
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
                      <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
                    ) : (
                      <Circle size={18} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${item.done ? 'text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Social Links */}
            <Card>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Link2 size={20} className="text-jnana-sage" />
                Link Social
              </h3>

              {socialLinks.length > 0 ? (
                <div className="space-y-2">
                  {socialLinks.map(link => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Link2 size={14} className="text-gray-500" />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                        {link.url}
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">
                  Nessun link aggiunto.
                  <button onClick={onEditProfile} className="text-jnana-sage hover:underline ml-1">
                    Collegali ora
                  </button>
                </p>
              )}
            </Card>

            {/* Privacy Notice */}
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-1">
                    Profilo Privato
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Il tuo profilo è visibile solo alle aziende con abbonamento attivo. 
                    Nessun dato viene condiviso pubblicamente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
