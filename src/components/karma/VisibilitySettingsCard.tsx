import React from 'react';
import { Eye, EyeOff, Info, MapPin, Briefcase, Home } from 'lucide-react';
import { Card } from '../../../components/Card';
import type { ProfileVisibility, WorkType } from '../../types/karma';

// Italian regions for dropdown
const ITALIAN_REGIONS = [
  'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna',
  'Friuli-Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche',
  'Molise', 'Piemonte', 'Puglia', 'Sardegna', 'Sicilia', 'Toscana',
  'Trentino-Alto Adige', 'Umbria', "Valle d'Aosta", 'Veneto',
  'Estero'
];

interface VisibilitySettingsCardProps {
  profileVisibility: ProfileVisibility;
  lookingForWork: boolean;
  preferredWorkType: WorkType;
  location: string;
  region?: string;
  onVisibilityChange: (visibility: ProfileVisibility) => void;
  onLookingForWorkChange: (value: boolean) => void;
  onPreferredWorkTypeChange: (type: WorkType) => void;
  onLocationChange: (location: string) => void;
  onRegionChange: (region: string) => void;
}

export const VisibilitySettingsCard: React.FC<VisibilitySettingsCardProps> = ({
  profileVisibility,
  lookingForWork,
  preferredWorkType,
  location,
  region,
  onVisibilityChange,
  onLookingForWorkChange,
  onPreferredWorkTypeChange,
  onLocationChange,
  onRegionChange,
}) => {
  const isVisible = profileVisibility === 'subscribers_only';

  return (
    <Card className="mb-6">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        {isVisible ? (
          <Eye size={20} className="text-green-600" />
        ) : (
          <EyeOff size={20} className="text-gray-500" />
        )}
        Visibilità Profilo
      </h3>

      {/* Main Toggle */}
      <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer mb-4">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white">
            Rendi il mio profilo visibile alle aziende
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isVisible 
              ? 'Il tuo profilo appare nei risultati di ricerca'
              : 'Solo tu puoi vedere il tuo profilo'
            }
          </p>
        </div>
        <div className="relative">
          <input
            type="checkbox"
            checked={isVisible}
            onChange={(e) => onVisibilityChange(e.target.checked ? 'subscribers_only' : 'private')}
            className="sr-only"
          />
          <div className={`w-14 h-8 rounded-full transition-colors ${isVisible ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
            <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform mt-1 ${isVisible ? 'translate-x-7' : 'translate-x-1'}`} />
          </div>
        </div>
      </label>

      {/* Info Box - Always visible */}
      <div className={`p-4 rounded-xl mb-4 ${isVisible ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}>
        <div className="flex items-start gap-3">
          <Info size={18} className={isVisible ? 'text-green-600 dark:text-green-400' : 'text-gray-500'} />
          <div className="text-sm">
            {isVisible ? (
              <>
                <p className="font-medium text-green-800 dark:text-green-300 mb-2">
                  Le aziende potranno vedere:
                </p>
                <ul className="text-green-700 dark:text-green-400 space-y-1 list-disc list-inside mb-3">
                  <li>Il tuo profilo completo (nome, foto, bio, esperienze, skills)</li>
                  <li>I risultati dei tuoi test RIASEC e Karma AI (punteggi e soft skills)</li>
                  <li>Le tue preferenze lavorative</li>
                </ul>
                <p className="text-green-600 dark:text-green-500 font-medium">
                  NON vedranno:
                </p>
                <ul className="text-green-600 dark:text-green-500 space-y-1 list-disc list-inside">
                  <li>Le singole risposte ai questionari</li>
                  <li>La trascrizione completa della chat Karma</li>
                </ul>
              </>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                Attiva la visibilità per apparire nei risultati di ricerca delle aziende e ricevere opportunità lavorative in linea con il tuo profilo.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Work Preferences - Only show when visible */}
      {isVisible && (
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Briefcase size={16} />
            Preferenze di Ricerca
          </h4>

          {/* Looking for work toggle */}
          <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer">
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                Sto cercando attivamente lavoro
              </h5>
              <p className="text-xs text-gray-500">
                Mostra un badge "Disponibile" sul tuo profilo
              </p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={lookingForWork}
                onChange={(e) => onLookingForWorkChange(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-12 h-7 rounded-full transition-colors ${lookingForWork ? 'bg-jnana-sage' : 'bg-gray-300 dark:bg-gray-600'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform mt-1 ${lookingForWork ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
            </div>
          </label>

          {/* Work Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
              <Home size={14} />
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
                  type="button"
                  onClick={() => onPreferredWorkTypeChange(option.value as WorkType)}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    preferredWorkType === option.value
                      ? 'border-jnana-sage bg-jnana-sage/5 text-jnana-sage'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <MapPin size={14} />
                Città
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => onLocationChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-jnana-sage focus:border-transparent transition-all"
                placeholder="Es: Milano"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Regione
              </label>
              <select
                value={region || ''}
                onChange={(e) => onRegionChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-jnana-sage focus:border-transparent transition-all"
              >
                <option value="">Seleziona...</option>
                {ITALIAN_REGIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
