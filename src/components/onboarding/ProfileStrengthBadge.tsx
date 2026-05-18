import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';

interface ProfileStrengthBadgeProps {
  userId: string | undefined;
  variant?: 'inline' | 'sticky';
  className?: string;
  onClick?: () => void;
}

/**
 * Shows the user's profile completeness as a 0–100 score using the
 * `calculate_profile_strength(uuid)` SQL function. Use 'sticky' to
 * pin to bottom-right of the viewport.
 */
export const ProfileStrengthBadge: React.FC<ProfileStrengthBadgeProps> = ({
  userId,
  variant = 'inline',
  className = '',
  onClick,
}) => {
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!userId) return;
    (async () => {
      // calculate_profile_strength is exposed via PostgREST as an RPC.
      const { data, error } = await (supabase as any).rpc('calculate_profile_strength', {
        _user_id: userId,
      });
      if (!cancelled && !error && typeof data === 'number') setScore(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (score === null) return null;

  const color = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500';
  const containerCls =
    variant === 'sticky'
      ? 'fixed bottom-6 right-6 z-40 shadow-lg rounded-full bg-white border border-jnana-sage/40 px-4 py-2 flex items-center gap-3 cursor-pointer hover:shadow-xl transition'
      : 'inline-flex items-center gap-3 rounded-full bg-white border border-jnana-sage/40 px-3 py-1.5';

  return (
    <div
      className={`${containerCls} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <Sparkles className="h-4 w-4 text-jnana-charcoal" />
      <div className="flex items-center gap-2">
        <div className="w-24 h-1.5 rounded-full bg-gray-200 overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${score}%` }} />
        </div>
        <span className="text-xs font-semibold text-jnana-text tabular-nums">{score}%</span>
      </div>
      <span className="text-xs text-jnana-text/60 hidden sm:inline">Profilo</span>
    </div>
  );
};

export default ProfileStrengthBadge;
