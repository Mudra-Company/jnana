/**
 * MyTeamTab — Mostra responsabile, peer, riportanti diretti, dipartimento allargato.
 * Permette di assegnare voti di compatibilità ai colleghi tramite PeerRatingModal.
 */
import React, { useState } from 'react';
import { Crown, Sparkles, Star, Users, ChevronDown } from 'lucide-react';
import { Card } from '../../../components/Card';
import type { TeamPerson, MyTeamData } from '../../hooks/useMyTeam';
import type { PeerRating } from '../../hooks/usePeerRatings';
import { PeerRatingModal } from './PeerRatingModal';

interface MyTeamTabProps {
  team: MyTeamData;
  companyId: string | null;
  myUserId: string;
  getRatingFor: (userId: string) => PeerRating | undefined;
  onUpsertRating: (input: {
    ratedUserId: string;
    companyId: string;
    rating: number;
    tags?: string[];
    note?: string | null;
  }) => Promise<{ success: boolean; error?: string }>;
  onDeleteRating: (ratedUserId: string) => Promise<{ success: boolean; error?: string }>;
}

const fullName = (p: TeamPerson) =>
  `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || p.email;

const initials = (p: TeamPerson) =>
  `${(p.firstName?.[0] ?? '').toUpperCase()}${(p.lastName?.[0] ?? '').toUpperCase()}` || '–';

const Avatar: React.FC<{ p: TeamPerson; size?: number }> = ({ p, size = 48 }) => (
  p.avatarUrl
    ? <img src={p.avatarUrl} alt="" className="rounded-full object-cover" style={{ width: size, height: size }} />
    : (
      <div
        className="rounded-full bg-jnana-powder/40 text-jnana-sageDark flex items-center justify-center font-heading font-bold"
        style={{ width: size, height: size, fontSize: size / 2.6 }}
      >
        {initials(p)}
      </div>
    )
);

const PersonCard: React.FC<{
  p: TeamPerson;
  existingRating?: PeerRating;
  onRate: (p: TeamPerson) => void;
}> = ({ p, existingRating, onRate }) => (
  <div className="bg-white border border-jnana-sage/10 rounded-xl p-3 flex items-center gap-3 hover:shadow-soft transition-shadow">
    <div className="relative">
      <Avatar p={p} />
      {p.isInfluencer && (
        <div className="absolute -top-1 -right-1 bg-jnana-sage text-white rounded-full p-0.5" title="Influencer">
          <Sparkles size={10} />
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-semibold text-jnana-text truncate">{fullName(p)}</div>
      <div className="text-xs text-jnana-text/60 truncate">{p.roleTitle}</div>
    </div>
    <button
      onClick={() => onRate(p)}
      className="shrink-0 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-jnana-bg hover:bg-jnana-powder/40 text-jnana-text/80"
      title="Valuta compatibilità (privato)"
    >
      <Star
        size={14}
        className={existingRating ? 'fill-amber-400 text-amber-400' : 'text-jnana-sage'}
      />
      {existingRating ? `${existingRating.rating}/5` : 'Valuta'}
    </button>
  </div>
);

export const MyTeamTab: React.FC<MyTeamTabProps> = ({
  team, companyId, getRatingFor, onUpsertRating, onDeleteRating,
}) => {
  const [target, setTarget] = useState<TeamPerson | null>(null);
  const [siblingsOpen, setSiblingsOpen] = useState(false);

  const openRating = (p: TeamPerson) => setTarget(p);
  const closeRating = () => setTarget(null);

  return (
    <div className="space-y-6">
      {/* Manager */}
      <Card>
        <h3 className="text-xs font-bold uppercase tracking-wider text-jnana-text/60 mb-3 flex items-center gap-1.5">
          <Crown size={14} className="text-jnana-sage" /> Il mio responsabile
        </h3>
        {team.manager ? (
          <div className="flex items-center gap-4">
            <Avatar p={team.manager} size={64} />
            <div className="flex-1 min-w-0">
              <div className="font-heading font-bold text-jnana-text text-lg">{fullName(team.manager)}</div>
              <div className="text-sm text-jnana-text/70">{team.manager.roleTitle}</div>
              <div className="text-xs text-jnana-text/50">{team.manager.email}</div>
            </div>
            <button
              onClick={() => openRating(team.manager!)}
              className="text-xs px-3 py-1.5 rounded-full bg-jnana-bg hover:bg-jnana-powder/40 inline-flex items-center gap-1"
            >
              <Star
                size={14}
                className={getRatingFor(team.manager.userId) ? 'fill-amber-400 text-amber-400' : 'text-jnana-sage'}
              />
              Valuta compatibilità
            </button>
          </div>
        ) : (
          <p className="text-sm text-jnana-text/50 italic">Non hai un responsabile assegnato nell'organigramma.</p>
        )}
      </Card>

      {/* Peers */}
      <Card>
        <h3 className="text-xs font-bold uppercase tracking-wider text-jnana-text/60 mb-3 flex items-center gap-1.5">
          <Users size={14} className="text-jnana-sage" />
          I miei colleghi
          {team.myOrgNodeName && <span className="text-jnana-text/40">· {team.myOrgNodeName}</span>}
        </h3>
        {team.peers.length === 0 ? (
          <p className="text-sm text-jnana-text/50 italic">Nessun collega diretto in questo team.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {team.peers.map(p => (
              <PersonCard
                key={p.userId}
                p={p}
                existingRating={getRatingFor(p.userId)}
                onRate={openRating}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Direct reports */}
      {team.directReports.length > 0 && (
        <Card>
          <h3 className="text-xs font-bold uppercase tracking-wider text-jnana-text/60 mb-3">
            Riportano a me
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {team.directReports.map(p => (
              <PersonCard
                key={p.userId}
                p={p}
                existingRating={getRatingFor(p.userId)}
                onRate={openRating}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Department siblings */}
      {team.departmentSiblings.length > 0 && (
        <Card>
          <button
            onClick={() => setSiblingsOpen(s => !s)}
            className="w-full flex items-center justify-between"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-jnana-text/60 flex items-center gap-1.5">
              Dipartimento allargato
              <span className="text-jnana-text/40">({team.departmentSiblings.length})</span>
            </h3>
            <ChevronDown
              size={16}
              className={`text-jnana-text/50 transition-transform ${siblingsOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {siblingsOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              {team.departmentSiblings.map(p => (
                <PersonCard
                  key={p.userId}
                  p={p}
                  existingRating={getRatingFor(p.userId)}
                  onRate={openRating}
                />
              ))}
            </div>
          )}
        </Card>
      )}

      {target && companyId && (
        <PeerRatingModal
          isOpen={!!target}
          onClose={closeRating}
          colleagueName={fullName(target)}
          colleagueRoleTitle={target.roleTitle}
          existing={getRatingFor(target.userId)}
          onSave={(input) => onUpsertRating({
            ratedUserId: target.userId,
            companyId,
            rating: input.rating,
            tags: input.tags,
            note: input.note,
          })}
          onDelete={() => onDeleteRating(target.userId)}
        />
      )}
    </div>
  );
};
