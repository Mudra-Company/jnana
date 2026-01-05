import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  TrendingUp, 
  Briefcase, 
  MapPin, 
  Star,
  Eye,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Target,
  X
} from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { useKarmaStats } from '../../src/hooks/useKarmaStats';
import { useKarmaAdminSearch, KarmaSearchFilters, KarmaSearchResult } from '../../src/hooks/useKarmaAdminSearch';

interface KarmaTalentsViewProps {
  onViewProfile?: (userId: string) => void;
}

export const KarmaTalentsView: React.FC<KarmaTalentsViewProps> = ({ onViewProfile }) => {
  const { stats, isLoading: statsLoading } = useKarmaStats();
  const { results, isLoading: searchLoading, totalCount, search } = useKarmaAdminSearch();
  
  const [filters, setFilters] = useState<KarmaSearchFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Initial load
  useEffect(() => {
    search({}, 0, pageSize);
  }, []);

  const handleSearch = () => {
    const newFilters = { ...filters, query: searchQuery || undefined };
    setFilters(newFilters);
    setPage(0);
    search(newFilters, 0, pageSize);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    search(filters, newPage, pageSize);
  };

  const handleFilterChange = (key: keyof KarmaSearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setPage(0);
    search(newFilters, 0, pageSize);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setPage(0);
    search({}, 0, pageSize);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
            <Sparkles className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Karma Talents</h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400">
          Gestione profili pubblici della piattaforma Karma
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 bg-gradient-to-br from-violet-50 to-white dark:from-violet-900/20 dark:to-gray-800 border-violet-200 dark:border-violet-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 dark:bg-violet-800 rounded-lg">
              <Users className="w-5 h-5 text-violet-600 dark:text-violet-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {statsLoading ? '...' : stats?.totalProfiles || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Profili Totali</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-800 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
              <Target className="w-5 h-5 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {statsLoading ? '...' : stats?.profilesWithTests || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Test Completati</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
              <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {statsLoading ? '...' : stats?.lookingForWork || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">In Cerca di Lavoro</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-gray-800 border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg">
              <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">
                {statsLoading ? '...' : stats?.newThisWeek || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Nuovi (7 giorni)</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Cerca per nome, email o headline..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
          <Button onClick={handleSearch} className="bg-violet-600 hover:bg-violet-700 text-white">
            <Search className="w-4 h-4 mr-2" />
            Cerca
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'border-violet-500 text-violet-600' : ''}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtri
          </Button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.lookingForWorkOnly || false}
                  onChange={(e) => handleFilterChange('lookingForWorkOnly', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Solo in cerca di lavoro</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasCompletedTests || false}
                  onChange={(e) => handleFilterChange('hasCompletedTests', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Con test completati</span>
              </label>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Reset Filtri
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Results */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {totalCount} profili trovati
          </p>
        </div>

        {searchLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-violet-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">Caricamento...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Nessun profilo trovato</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {results.map((result) => (
              <ProfileRow 
                key={result.profile.id} 
                result={result} 
                onView={() => onViewProfile?.(result.profile.id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Precedente
            </Button>
            <span className="text-sm text-gray-500">
              Pagina {page + 1} di {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages - 1}
            >
              Successiva
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </Card>

      {/* Top Skills Sidebar */}
      {stats && stats.topSkills.length > 0 && (
        <div className="mt-6">
          <Card className="p-4">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Top Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {stats.topSkills.slice(0, 8).map((skill) => (
                <span 
                  key={skill.name}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300"
                >
                  {skill.name} ({skill.count})
                </span>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// Profile Row Component
const ProfileRow: React.FC<{ result: KarmaSearchResult; onView: () => void }> = ({ result, onView }) => {
  const { profile, hasRiasec, hasKarma, skillsCount } = result;
  
  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <>
              {(profile.firstName?.[0] || profile.email[0]).toUpperCase()}
            </>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-800 dark:text-white truncate">
              {profile.firstName && profile.lastName 
                ? `${profile.firstName} ${profile.lastName}`
                : profile.email}
            </h4>
            {profile.lookingForWork && (
              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                Disponibile
              </span>
            )}
          </div>
          {profile.headline && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{profile.headline}</p>
          )}
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {profile.location}
              </span>
            )}
            {profile.profileCode && (
              <span className="font-mono bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-1.5 py-0.5 rounded">
                {profile.profileCode}
              </span>
            )}
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2">
          {hasRiasec && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
              RIASEC
            </span>
          )}
          {hasKarma && (
            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded">
              Karma
            </span>
          )}
          {skillsCount > 0 && (
            <span className="text-xs text-gray-500">
              {skillsCount} skills
            </span>
          )}
        </div>

        {/* Actions */}
        <Button variant="outline" size="sm" onClick={onView}>
          <Eye className="w-4 h-4 mr-1" />
          Visualizza
        </Button>
      </div>
    </div>
  );
};
