import React from 'react';
import { BarChart3, TrendingUp, Users, Building, Sparkles, Target } from 'lucide-react';
import { Card } from '../../components/Card';

interface SuperAdminAnalyticsViewProps {
  // Future: add props for actual analytics data
}

export const SuperAdminAnalyticsView: React.FC<SuperAdminAnalyticsViewProps> = () => {
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
              Statistiche globali della piattaforma
            </p>
          </div>
        </div>
      </div>

      {/* Placeholder Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 border-t-4 border-t-blue-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Building className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">--</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Aziende Totali</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-t-4 border-t-violet-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
              <Sparkles className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">--</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Profili Karma</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-t-4 border-t-green-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">--</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Test Completati</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-t-4 border-t-amber-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">--</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Match Effettuati</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Coming Soon Message */}
      <Card className="p-12 text-center">
        <BarChart3 size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Analytics Dashboard
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Coming soon - Statistiche dettagliate su utilizzo piattaforma, trend di crescita, 
          performance aziende e metriche di matching.
        </p>
      </Card>
    </div>
  );
};
