import React, { useEffect } from 'react';
import { ArrowLeft, Briefcase, Users, MapPin, Search, Plus, Award, Target } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { useOpenPositions, OpenPosition } from '../../src/hooks/useOpenPositions';
import { CompanyProfile, User, SeniorityLevel } from '../../types';

interface OpenPositionsViewProps {
  company: CompanyProfile;
  users: User[];
  onBack: () => void;
  onFindCandidates: (positionId: string) => void;
  onEditPosition: (positionId: string) => void;
}

const SENIORITY_LABELS: Record<SeniorityLevel, string> = {
  'Junior': 'Junior',
  'Mid': 'Mid-Level',
  'Senior': 'Senior',
  'Lead': 'Lead',
  'C-Level': 'C-Level',
};

const SENIORITY_COLORS: Record<SeniorityLevel, string> = {
  'Junior': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'Mid': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'Senior': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'Lead': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'C-Level': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

export const OpenPositionsView: React.FC<OpenPositionsViewProps> = ({
  company,
  users,
  onBack,
  onFindCandidates,
  onEditPosition,
}) => {
  const { positions, isLoading, fetchPositions } = useOpenPositions();

  useEffect(() => {
    fetchPositions(company.id);
  }, [company.id, fetchPositions]);

  const renderPositionCard = (position: OpenPosition) => {
    const req = position.requiredProfile;
    const hardSkills = req?.hardSkills || [];
    const softSkills = req?.softSkills || [];
    const seniority = req?.seniority as SeniorityLevel | undefined;

    return (
      <Card key={position.id} className="hover:shadow-lg transition-shadow">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          {/* Position Info */}
          <div className="flex-1 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Briefcase size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {position.jobTitle}
                </h3>
                {position.departmentName && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <MapPin size={14} />
                    {position.departmentName}
                  </p>
                )}
              </div>
            </div>

            {/* Requirements */}
            <div className="flex flex-wrap gap-2">
              {seniority && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${SENIORITY_COLORS[seniority]}`}>
                  {SENIORITY_LABELS[seniority]}
                </span>
              )}
              
              {hardSkills.slice(0, 3).map((skill, i) => (
                <span 
                  key={i}
                  className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                >
                  {skill}
                </span>
              ))}
              {hardSkills.length > 3 && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                  +{hardSkills.length - 3} altre
                </span>
              )}
            </div>

            {/* Soft Skills Preview */}
            {softSkills.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Award size={14} />
                <span>Soft skills: {softSkills.slice(0, 2).join(', ')}{softSkills.length > 2 ? ` +${softSkills.length - 2}` : ''}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => onFindCandidates(position.id)}
              className="flex items-center gap-2"
            >
              <Search size={16} />
              Trova Candidati
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => onEditPosition(position.id)}
              className="text-sm"
            >
              Modifica Requisiti
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="p-2">
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Posizioni Aperte
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {positions.length} {positions.length === 1 ? 'posizione aperta' : 'posizioni aperte'} in {company.name}
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Caricamento posizioni...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && positions.length === 0 && (
        <Card className="text-center py-12">
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-fit mx-auto mb-4">
            <Users size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Nessuna posizione aperta
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
            Crea nuove posizioni dall'organigramma aziendale aggiungendo slot con "Hiring" attivo.
          </p>
          <Button onClick={onBack}>
            <Plus size={16} className="mr-2" />
            Vai all'Organigramma
          </Button>
        </Card>
      )}

      {/* Positions List */}
      {!isLoading && positions.length > 0 && (
        <div className="space-y-4">
          {positions.map(renderPositionCard)}
        </div>
      )}

      {/* Info Card */}
      {!isLoading && positions.length > 0 && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
              <Target size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                Collegamento Jnana ↔ Karma
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Clicca su "Trova Candidati" per cercare profili compatibili tra i talenti Karma. 
                Il matching considera profilo RIASEC, competenze tecniche e seniority.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
