import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Building, 
  Sparkles, 
  Target,
  PieChart,
  Activity,
  Calendar,
  Eye,
  Briefcase,
  MapPin
} from 'lucide-react';
import { Card } from '../../components/Card';
import { supabase } from '../../src/integrations/supabase/client';

interface AnalyticsData {
  totalCompanies: number;
  totalProfiles: number;
  karmaProfiles: number;
  riasecTestsCompleted: number;
  karmaSessionsCompleted: number;
  climateResponsesCompleted: number;
  profileViewsThisMonth: number;
  activeSubscriptions: number;
  newCompaniesThisMonth: number;
  newProfilesThisMonth: number;
  riasecDistribution: Record<string, number>;
  seniorityDistribution: Record<string, number>;
  topLocations: { location: string; count: number }[];
  growthTrend: { month: string; companies: number; profiles: number }[];
}

export const SuperAdminAnalyticsView: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const monthAgoStr = monthAgo.toISOString();

      // Parallel queries for performance
      const [
        companiesResult,
        profilesResult,
        riasecResult,
        karmaResult,
        climateResult,
        subscriptionsResult,
        profileViewsResult,
      ] = await Promise.all([
        supabase.from('companies').select('id, created_at'),
        supabase.from('profiles').select('id, is_karma_profile, location, created_at'),
        supabase.from('riasec_results').select('id, profile_code, submitted_at'),
        supabase.from('karma_sessions').select('id, seniority_assessment, completed_at'),
        supabase.from('climate_responses').select('id, submitted_at'),
        supabase.from('company_subscriptions').select('id, status'),
        supabase.from('profile_views_log').select('id, viewed_at').gte('viewed_at', monthAgoStr),
      ]);

      const companies = companiesResult.data || [];
      const profiles = profilesResult.data || [];
      const riasecTests = riasecResult.data || [];
      const karmaSessions = karmaResult.data || [];
      const climateResponses = climateResult.data || [];
      const subscriptions = subscriptionsResult.data || [];
      const profileViews = profileViewsResult.data || [];

      // Basic counts
      const totalCompanies = companies.length;
      const totalProfiles = profiles.length;
      const karmaProfiles = profiles.filter(p => p.is_karma_profile).length;
      const riasecTestsCompleted = riasecTests.length;
      const karmaSessionsCompleted = karmaSessions.filter(k => k.completed_at).length;
      const climateResponsesCompleted = climateResponses.length;
      const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
      const profileViewsThisMonth = profileViews.length;

      // New this month
      const newCompaniesThisMonth = companies.filter(c => 
        new Date(c.created_at) >= monthAgo
      ).length;
      const newProfilesThisMonth = profiles.filter(p => 
        new Date(p.created_at) >= monthAgo
      ).length;

      // RIASEC distribution (top letter from profile code)
      const riasecDistribution: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
      riasecTests.forEach(test => {
        if (test.profile_code && test.profile_code.length > 0) {
          const topLetter = test.profile_code[0].toUpperCase();
          if (riasecDistribution.hasOwnProperty(topLetter)) {
            riasecDistribution[topLetter]++;
          }
        }
      });

      // Seniority distribution
      const seniorityDistribution: Record<string, number> = {
        'Junior': 0, 'Mid': 0, 'Senior': 0, 'Lead': 0, 'C-Level': 0
      };
      karmaSessions.forEach(session => {
        if (session.seniority_assessment && seniorityDistribution.hasOwnProperty(session.seniority_assessment)) {
          seniorityDistribution[session.seniority_assessment]++;
        }
      });

      // Top locations
      const locationCounts: Record<string, number> = {};
      profiles.forEach(p => {
        if (p.location) {
          locationCounts[p.location] = (locationCounts[p.location] || 0) + 1;
        }
      });
      const topLocations = Object.entries(locationCounts)
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Growth trend (last 6 months)
      const growthTrend: { month: string; companies: number; profiles: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthName = monthStart.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' });
        
        const companiesInMonth = companies.filter(c => {
          const created = new Date(c.created_at);
          return created >= monthStart && created <= monthEnd;
        }).length;
        
        const profilesInMonth = profiles.filter(p => {
          const created = new Date(p.created_at);
          return created >= monthStart && created <= monthEnd;
        }).length;
        
        growthTrend.push({ month: monthName, companies: companiesInMonth, profiles: profilesInMonth });
      }

      setData({
        totalCompanies,
        totalProfiles,
        karmaProfiles,
        riasecTestsCompleted,
        karmaSessionsCompleted,
        climateResponsesCompleted,
        profileViewsThisMonth,
        activeSubscriptions,
        newCompaniesThisMonth,
        newProfilesThisMonth,
        riasecDistribution,
        seniorityDistribution,
        topLocations,
        growthTrend,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: number | string;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    trend?: number;
  }> = ({ title, value, subtitle, icon, color, trend }) => (
    <Card className={`p-6 border-t-4 ${color}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${color.replace('border-t-', 'bg-').replace('-500', '-100')} dark:${color.replace('border-t-', 'bg-').replace('-500', '-900/30')}`}>
            {icon}
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">
              {isLoading ? '...' : value}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            {subtitle && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`w-4 h-4 ${trend < 0 ? 'rotate-180' : ''}`} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </Card>
  );

  const maxRiasec = Math.max(...Object.values(data?.riasecDistribution || { R: 1 }) as number[]);
  const maxSeniority = Math.max(...Object.values(data?.seniorityDistribution || { Junior: 1 }) as number[]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-brand font-bold text-gray-800 dark:text-white">
              Console Super Admin - Analytics
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Statistiche globali della piattaforma in tempo reale
            </p>
          </div>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Aziende Totali"
          value={data?.totalCompanies || 0}
          subtitle={`+${data?.newCompaniesThisMonth || 0} questo mese`}
          icon={<Building className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
          color="border-t-blue-500"
        />
        <StatCard
          title="Profili Karma"
          value={data?.karmaProfiles || 0}
          subtitle={`${data?.totalProfiles || 0} profili totali`}
          icon={<Sparkles className="w-6 h-6 text-violet-600 dark:text-violet-400" />}
          color="border-t-violet-500"
        />
        <StatCard
          title="Test RIASEC"
          value={data?.riasecTestsCompleted || 0}
          subtitle={`${data?.karmaSessionsCompleted || 0} sessioni Karma`}
          icon={<Target className="w-6 h-6 text-green-600 dark:text-green-400" />}
          color="border-t-green-500"
        />
        <StatCard
          title="Visualizzazioni Profili"
          value={data?.profileViewsThisMonth || 0}
          subtitle="Questo mese"
          icon={<Eye className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
          color="border-t-amber-500"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Abbonamenti Attivi"
          value={data?.activeSubscriptions || 0}
          icon={<Activity className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
          color="border-t-emerald-500"
        />
        <StatCard
          title="Climate Survey"
          value={data?.climateResponsesCompleted || 0}
          subtitle="Risposte completate"
          icon={<PieChart className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />}
          color="border-t-cyan-500"
        />
        <StatCard
          title="Nuovi Profili"
          value={data?.newProfilesThisMonth || 0}
          subtitle="Ultimo mese"
          icon={<Calendar className="w-6 h-6 text-pink-600 dark:text-pink-400" />}
          color="border-t-pink-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* RIASEC Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            Distribuzione RIASEC
          </h3>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(data?.riasecDistribution || {}).map(([code, countVal]) => {
                const count = countVal as number;
                const colors: Record<string, string> = {
                  R: 'bg-red-500',
                  I: 'bg-blue-500',
                  A: 'bg-purple-500',
                  S: 'bg-green-500',
                  E: 'bg-amber-500',
                  C: 'bg-gray-500',
                };
                const labels: Record<string, string> = {
                  R: 'Realistico',
                  I: 'Investigativo',
                  A: 'Artistico',
                  S: 'Sociale',
                  E: 'Intraprendente',
                  C: 'Convenzionale',
                };
                const percentage = maxRiasec > 0 ? (count / maxRiasec) * 100 : 0;
                
                return (
                  <div key={code} className="flex items-center gap-3">
                    <span className="w-24 text-sm font-medium text-gray-600 dark:text-gray-400">
                      {code} - {labels[code]}
                    </span>
                    <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${colors[code]} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Seniority Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-purple-500" />
            Distribuzione Seniority (Karma AI)
          </h3>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(data?.seniorityDistribution || {}).map(([level, countVal]) => {
                const count = countVal as number;
                const colors: Record<string, string> = {
                  'Junior': 'bg-green-500',
                  'Mid': 'bg-blue-500',
                  'Senior': 'bg-purple-500',
                  'Lead': 'bg-amber-500',
                  'C-Level': 'bg-red-500',
                };
                const percentage = maxSeniority > 0 ? (count / maxSeniority) * 100 : 0;
                
                return (
                  <div key={level} className="flex items-center gap-3">
                    <span className="w-20 text-sm font-medium text-gray-600 dark:text-gray-400">
                      {level}
                    </span>
                    <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${colors[level]} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Top Locations */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-500" />
            Top Località
          </h3>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : data?.topLocations && data.topLocations.length > 0 ? (
            <div className="space-y-2">
              {data.topLocations.map((loc, index) => (
                <div key={loc.location} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">{loc.location}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                    {loc.count} profili
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              Nessun dato sulla località disponibile
            </p>
          )}
        </Card>

        {/* Growth Trend */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            Trend di Crescita (6 mesi)
          </h3>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Simple bar chart */}
              <div className="flex items-end justify-between h-32 gap-2">
                {data?.growthTrend.map((month, index) => {
                  const maxProfiles = Math.max(...(data?.growthTrend.map(m => m.profiles) || [1]));
                  const height = maxProfiles > 0 ? (month.profiles / maxProfiles) * 100 : 0;
                  
                  return (
                    <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                        {month.profiles}
                      </span>
                      <div 
                        className="w-full bg-gradient-to-t from-amber-500 to-amber-400 rounded-t transition-all duration-500"
                        style={{ height: `${Math.max(height, 5)}%` }}
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {month.month}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-amber-500"></span>
                  Nuovi Profili
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
