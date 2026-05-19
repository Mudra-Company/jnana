/**
 * MyProfileView — Nuovo cockpit personale del dipendente.
 * Tab: Io, Il mio Ruolo, Il mio Team, Crescita, Dati & Privacy.
 */
import React, { useState, useMemo } from 'react';
import { User as UserIcon, Briefcase, Users, Sprout, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import type { User, CompanyProfile } from '../../types';
import { ProfileHeader } from '../../src/components/profile/ProfileHeader';
import { IoTab } from '../../src/components/profile/IoTab';
import { MyRoleTab } from '../../src/components/profile/MyRoleTab';
import { MyTeamTab } from '../../src/components/profile/MyTeamTab';
import { useMyTeam } from '../../src/hooks/useMyTeam';
import { usePeerRatings } from '../../src/hooks/usePeerRatings';

interface MyProfileViewProps {
  user: User;
  company: CompanyProfile | null;
  onBack: () => void;
  onStartRiasec: () => void;
  onStartKarma: () => void;
  onStartClimate: () => void;
  /** Se true, è un admin/altro utente che visualizza il profilo (read-only). */
  isReadOnly?: boolean;
  /** Id dell'utente che sta visualizzando (per peer rating quando non è il proprio profilo). */
  viewerUserId?: string;
}

type TabKey = 'io' | 'role' | 'team' | 'growth' | 'data';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'io', label: 'Io', icon: UserIcon },
  { key: 'role', label: 'Il mio Ruolo', icon: Briefcase },
  { key: 'team', label: 'Il mio Team', icon: Users },
  { key: 'growth', label: 'Crescita', icon: Sprout },
  { key: 'data', label: 'Dati & Privacy', icon: ShieldCheck },
];

export const MyProfileView: React.FC<MyProfileViewProps> = ({
  user, company, onBack, onStartRiasec, onStartKarma, onStartClimate,
  isReadOnly = false, viewerUserId,
}) => {
  const [tab, setTab] = useState<TabKey>('io');

  const companyId = user.companyId || null;
  const { data: team } = useMyTeam(user.id, companyId);
  // I peer rating restano privati al "viewer"; in read-only li disabilitiamo a livello UI.
  const { getRatingFor, upsertRating, deleteRating } = usePeerRatings(viewerUserId ?? user.id);

  const climateAvg = useMemo(() => {
    const c: any = user.climateData;
    if (!c) return null;
    if (typeof c.overallAverage === 'number') return c.overallAverage;
    if (c.sectionAverages) {
      const vals = Object.values(c.sectionAverages).filter(v => typeof v === 'number') as number[];
      if (vals.length) return vals.reduce((a, b) => a + b, 0) / vals.length;
    }
    return null;
  }, [user.climateData]);

  return (
    <div className="min-h-screen bg-jnana-bg py-6 px-4">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-jnana-text/60 hover:text-jnana-text mb-4"
        >
          <ArrowLeft size={16} /> Indietro
        </button>

        <ProfileHeader
          firstName={user.firstName}
          lastName={user.lastName}
          avatarUrl={(user as any).avatarUrl ?? null}
          roleTitle={team.myRoleTitle ?? user.jobTitle ?? null}
          orgNodeName={team.myOrgNodeName}
          companyName={company?.name ?? null}
          isCulturalDriver={false}
          isInfluencer={false}
        />

        {/* Tab nav */}
        <div className="border-b border-jnana-sage/15 mb-6">
          <nav className="flex gap-1 overflow-x-auto">
            {TABS.map(({ key, label, icon: Icon }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors inline-flex items-center gap-2 whitespace-nowrap ${
                    active
                      ? 'border-jnana-sage text-jnana-sageDark'
                      : 'border-transparent text-jnana-text/60 hover:text-jnana-text'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              );
            })}
          </nav>
        </div>

        {tab === 'io' && (
          <IoTab
            user={user}
            climateIndex={climateAvg}
            onOpenRiasec={onStartRiasec}
            onOpenKarma={onStartKarma}
            onOpenClimate={onStartClimate}
          />
        )}

        {tab === 'role' && <MyRoleTab user={user} roleId={team.myRoleId} />}

        {tab === 'team' && (
          <MyTeamTab
            team={team}
            companyId={companyId}
            myUserId={user.id}
            getRatingFor={getRatingFor}
            onUpsertRating={upsertRating}
            onDeleteRating={deleteRating}
          />
        )}

        {tab === 'growth' && (
          <Card>
            <h3 className="font-heading font-bold text-jnana-text mb-2">Crescita</h3>
            <p className="text-sm text-jnana-text/70">
              Qui potrai dichiarare i ruoli interni a cui aspiri, le skill che vuoi sviluppare e la tua disponibilità a job rotation o relocation. <em>In preparazione.</em>
            </p>
          </Card>
        )}

        {tab === 'data' && (
          <Card>
            <h3 className="font-heading font-bold text-jnana-text mb-2">Dati & Privacy</h3>
            <p className="text-sm text-jnana-text/70">
              Dati anagrafici, visibilità del profilo, documenti di compliance, storico test ed export PDF. <em>In preparazione.</em>
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};
