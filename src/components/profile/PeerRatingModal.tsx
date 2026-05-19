/**
 * PeerRatingModal — finestra per assegnare 1-5 stelle di compatibilità
 * collaborativa a un collega, con tag e nota opzionale.
 */
import React, { useState, useEffect } from 'react';
import { X, Star, Lock } from 'lucide-react';
import { Button } from '../../../components/Button';
import { PEER_RATING_TAGS } from '../../hooks/usePeerRatings';
import type { PeerRating } from '../../hooks/usePeerRatings';

interface PeerRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  colleagueName: string;
  colleagueRoleTitle: string | null;
  existing?: PeerRating;
  onSave: (input: { rating: number; tags: string[]; note: string | null }) => Promise<{ success: boolean; error?: string }>;
  onDelete?: () => Promise<{ success: boolean; error?: string }>;
}

export const PeerRatingModal: React.FC<PeerRatingModalProps> = ({
  isOpen, onClose, colleagueName, colleagueRoleTitle, existing, onSave, onDelete,
}) => {
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [note, setNote] = useState(existing?.note ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRating(existing?.rating ?? 0);
      setTags(existing?.tags ?? []);
      setNote(existing?.note ?? '');
      setError(null);
    }
  }, [isOpen, existing]);

  if (!isOpen) return null;

  const toggleTag = (t: string) =>
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const handleSave = async () => {
    if (rating < 1) {
      setError('Seleziona almeno una stella.');
      return;
    }
    setSaving(true);
    const res = await onSave({ rating, tags, note: note.trim() || null });
    setSaving(false);
    if (res.success) onClose();
    else setError(res.error || 'Errore nel salvataggio.');
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setSaving(true);
    const res = await onDelete();
    setSaving(false);
    if (res.success) onClose();
    else setError(res.error || 'Errore eliminazione.');
  };

  const visual = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-soft w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-heading font-bold text-jnana-text text-lg">
              Compatibilità con {colleagueName}
            </h2>
            {colleagueRoleTitle && (
              <p className="text-xs text-jnana-text/60">{colleagueRoleTitle}</p>
            )}
          </div>
          <button onClick={onClose} className="text-jnana-text/50 hover:text-jnana-text">
            <X size={20} />
          </button>
        </div>

        <div className="bg-jnana-bg rounded-lg p-3 mb-4 flex items-start gap-2 text-xs text-jnana-text/70">
          <Lock size={14} className="text-jnana-sage shrink-0 mt-0.5" />
          <span>
            Il tuo voto è <strong>privato</strong>: non è visibile a {colleagueName} né ai colleghi.
            HR e SpaceSync vedono solo aggregati con almeno 3 voti, in forma anonima.
          </span>
        </div>

        <p className="text-sm text-jnana-text mb-2">Quanto è fluida la vostra collaborazione?</p>
        <div className="flex items-center gap-1 mb-4">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHoverRating(n)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(n)}
              className="p-1"
              aria-label={`${n} stelle`}
            >
              <Star
                size={32}
                className={n <= visual ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-jnana-text/60">
            {visual > 0 ? `${visual}/5` : ''}
          </span>
        </div>

        <p className="text-sm text-jnana-text mb-2">Tag (opzionali)</p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {PEER_RATING_TAGS.map(t => {
            const active = tags.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                  active
                    ? 'bg-jnana-sage text-white border-jnana-sage'
                    : 'bg-white text-jnana-text/70 border-gray-200 hover:border-jnana-sage'
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>

        <p className="text-sm text-jnana-text mb-2">Nota privata (opzionale)</p>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={2}
          placeholder="Solo tu vedrai questa nota"
          className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-jnana-sage/30 focus:border-jnana-sage resize-none"
        />

        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

        <div className="flex items-center justify-between mt-5">
          {existing && onDelete ? (
            <button
              onClick={handleDelete}
              className="text-xs text-red-500 hover:text-red-700"
              disabled={saving}
            >
              Rimuovi voto
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>Annulla</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvataggio…' : existing ? 'Aggiorna' : 'Salva'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
