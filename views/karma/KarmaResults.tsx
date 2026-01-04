import React from 'react';
import {
  Hexagon, ArrowLeft, Briefcase, Award, Sparkles,
  TrendingUp, Shield, AlertTriangle, CheckCircle, Target
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useKarmaProfile } from '../../src/hooks/useKarmaProfile';
import { RIASEC_DESCRIPTIONS } from '../../data/riasecContent';

// Dimension colors for the chart
const dimensionColors: Record<string, string> = {
  R: '#4A6741',
  I: '#5B7E9A',
  A: '#9A5B7E',
  S: '#7E9A5B',
  E: '#9A7E5B',
  C: '#5B9A7E',
};
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';

interface KarmaResultsProps {
  onBack: () => void;
  onEditProfile: () => void;
}

const DIMENSIONS = ['R', 'I', 'A', 'S', 'E', 'C'] as const;

export const KarmaResults: React.FC<KarmaResultsProps> = ({ onBack, onEditProfile }) => {
  const { profile, isLoading } = useKarmaProfile();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-jnana-sage border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile || !profile.riasecScore) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Nessun risultato disponibile</p>
          <Button onClick={onBack}>Torna alla Dashboard</Button>
        </div>
      </div>
    );
  }

  const { riasecScore, profileCode, karmaData } = profile;

  // Prepare radar chart data
  const radarData = DIMENSIONS.map(dim => ({
    dimension: dim,
    value: riasecScore[dim],
    fullMark: 100,
  }));

  // Get top 3 dimensions
  const sortedDimensions = [...DIMENSIONS].sort((a, b) => riasecScore[b] - riasecScore[a]);
  const topThree = sortedDimensions.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-jnana-bg via-white to-jnana-powder/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Torna alla Dashboard</span>
          </button>
        </div>

        {/* Profile Code Hero */}
        <Card className="mb-6 text-center py-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Hexagon size={48} className="text-jnana-sage" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              Profilo {profileCode || topThree.join('-')}
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Questo è il tuo profilo professionale basato sui test RIASEC e sul colloquio Karma AI
          </p>
        </Card>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Radar Chart */}
          <Card>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Target size={20} className="text-jnana-sage" />
              Profilo RIASEC
            </h3>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis
                    dataKey="dimension"
                    tick={{ fill: '#6b7280', fontSize: 14, fontWeight: 'bold' }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="#6B9080"
                    fill="#6B9080"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Dimension breakdown */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {DIMENSIONS.map(dim => (
                <div key={dim} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: dimensionColors[dim] }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {RIASEC_DESCRIPTIONS[dim]?.title || dim}
                  </span>
                  <span className="ml-auto text-sm font-bold text-gray-900 dark:text-white">
                    {riasecScore[dim]}%
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Right: Top Dimensions */}
          <Card>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Award size={20} className="text-jnana-sage" />
              Le Tue Attitudini Principali
            </h3>

            <div className="space-y-4">
              {topThree.map((dim, index) => (
                <div key={dim} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: dimensionColors[dim] }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">
                        {RIASEC_DESCRIPTIONS[dim]?.title || dim}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {riasecScore[dim]}% di affinità
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {RIASEC_DESCRIPTIONS[dim]?.description || ''}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Karma AI Results */}
        {karmaData && (
          <>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4 flex items-center gap-2">
              <Sparkles size={24} className="text-jnana-sage" />
              Analisi Karma AI
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Soft Skills */}
              <Card>
                <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <CheckCircle size={18} className="text-green-500" />
                  Soft Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {karmaData.softSkills?.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  )) || <p className="text-gray-400 text-sm">Non disponibili</p>}
                </div>
              </Card>

              {/* Primary Values */}
              <Card>
                <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Shield size={18} className="text-blue-500" />
                  Valori Principali
                </h3>
                <div className="flex flex-wrap gap-2">
                  {karmaData.primaryValues?.map((value, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm"
                    >
                      {value}
                    </span>
                  )) || <p className="text-gray-400 text-sm">Non disponibili</p>}
                </div>
              </Card>

              {/* Risk Factors */}
              <Card>
                <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-500" />
                  Aree di Attenzione
                </h3>
                <div className="flex flex-wrap gap-2">
                  {karmaData.riskFactors?.map((risk, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-sm"
                    >
                      {risk}
                    </span>
                  )) || <p className="text-gray-400 text-sm">Nessuna</p>}
                </div>
              </Card>
            </div>

            {/* Summary */}
            {karmaData.summary && (
              <Card className="mt-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <TrendingUp size={18} className="text-jnana-sage" />
                  Riepilogo
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {karmaData.summary}
                </p>

                {karmaData.seniorityAssessment && (
                  <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-jnana-sage/10 rounded-full">
                    <Briefcase size={16} className="text-jnana-sage" />
                    <span className="text-sm font-medium text-jnana-sage">
                      Livello: {karmaData.seniorityAssessment}
                    </span>
                  </div>
                )}
              </Card>
            )}
          </>
        )}

        {/* Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <Button variant="outline" onClick={onEditProfile}>
            Modifica Profilo
          </Button>
          <Button onClick={onBack}>
            Torna alla Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
