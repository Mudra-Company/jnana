/**
 * ProfileHeader — Header identitario condiviso da tutte le tab del profilo.
 * Mostra avatar, nome, ruolo, dipartimento, badge cultural driver/influencer.
 */
import React from 'react';
import { Crown, Sparkles, Briefcase, MapPin, Building2 } from 'lucide-react';
import { Card } from '../../../components/Card';

interface ProfileHeaderProps {
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  roleTitle: string | null;
  orgNodeName: string | null;
  companyName: string | null;
  location?: string | null;
  isCulturalDriver?: boolean;
  isInfluencer?: boolean;
  rightSlot?: React.ReactNode;
}

const initials = (a: string | null, b: string | null) =>
  `${(a?.[0] ?? '').toUpperCase()}${(b?.[0] ?? '').toUpperCase()}` || '–';

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  firstName, lastName, avatarUrl, roleTitle, orgNodeName, companyName,
  location, isCulturalDriver, isInfluencer, rightSlot,
}) => {
  const fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim() || 'Profilo';
  return (
    <Card className="mb-6">
      <div className="flex flex-col md:flex-row md:items-center gap-5">
        <div className="relative shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={fullName}
              className="w-20 h-20 rounded-full object-cover ring-2 ring-jnana-sage/20"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-jnana-powder/40 text-jnana-sageDark flex items-center justify-center font-heading text-2xl font-bold ring-2 ring-jnana-sage/20">
              {initials(firstName, lastName)}
            </div>
          )}
          {isCulturalDriver && (
            <div
              title="Driver culturale dell'azienda"
              className="absolute -top-1 -right-1 bg-amber-400 text-amber-900 rounded-full p-1 shadow-soft"
            >
              <Crown size={14} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl font-heading font-bold text-jnana-text truncate">{fullName}</h1>
            {isInfluencer && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-jnana-sage/10 text-jnana-sageDark"
                title="Influencer riconosciuto"
              >
                <Sparkles size={12} /> Influencer
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-jnana-text/70">
            {roleTitle && (
              <span className="inline-flex items-center gap-1.5">
                <Briefcase size={14} className="text-jnana-sage" />
                {roleTitle}
              </span>
            )}
            {orgNodeName && (
              <span className="inline-flex items-center gap-1.5">
                <Building2 size={14} className="text-jnana-sage" />
                {orgNodeName}
              </span>
            )}
            {companyName && <span className="text-jnana-text/50">· {companyName}</span>}
            {location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} className="text-jnana-sage" />
                {location}
              </span>
            )}
          </div>
        </div>

        {rightSlot && <div className="shrink-0">{rightSlot}</div>}
      </div>
    </Card>
  );
};
