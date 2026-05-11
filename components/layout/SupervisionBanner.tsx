import React from 'react';
import { Settings } from 'lucide-react';

interface Props {
  companyName: string;
  onExit: () => void;
}

export const SupervisionBanner: React.FC<Props> = ({ companyName, onExit }) => (
  <div className="bg-amber-600 text-white px-4 py-2 text-sm font-bold flex justify-between items-center shadow-md relative z-[60]">
    <div className="flex items-center gap-2">
      <Settings size={16} />
      <span>MODALITÀ SUPERVISIONE: Stai operando come Admin in {companyName}</span>
    </div>
    <button
      onClick={onExit}
      className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs uppercase tracking-wider transition-colors"
    >
      Esci da {companyName}
    </button>
  </div>
);
