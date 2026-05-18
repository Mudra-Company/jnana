import React from 'react';
import { FlaskConical, X } from 'lucide-react';

interface SimulatorBannerProps {
  mode: 'b2c' | 'b2b';
  onExit: () => void;
}

export const SimulatorBanner: React.FC<SimulatorBannerProps> = ({ mode, onExit }) => {
  const label = mode === 'b2c' ? 'Anteprima B2C (Karma)' : 'Anteprima B2B (Invitato)';
  return (
    <div className="sticky top-0 z-50 bg-purple-600 text-white px-4 py-2 flex items-center justify-between shadow">
      <div className="flex items-center gap-2 text-sm">
        <FlaskConical size={16} />
        <span className="font-medium">{label}</span>
        <span className="opacity-80 hidden sm:inline">— stai simulando il percorso utente. Nessun dato viene salvato.</span>
      </div>
      <button
        onClick={onExit}
        className="flex items-center gap-1 text-sm bg-white/15 hover:bg-white/25 px-3 py-1 rounded-md transition-colors"
      >
        <X size={14} /> Esci dall'anteprima
      </button>
    </div>
  );
};
