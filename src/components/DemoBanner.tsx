import React from 'react';
import { FlaskConical, X } from 'lucide-react';
import { Button } from '../../components/Button';

interface DemoBannerProps {
  onExit: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ onExit }) => (
  <div className="fixed top-0 left-0 right-0 bg-purple-600 text-white py-3 px-4 flex justify-between items-center z-50 shadow-lg">
    <div className="flex items-center gap-3">
      <FlaskConical size={20} className="animate-pulse" />
      <div>
        <span className="font-bold text-sm sm:text-base">MODALITÀ DEMO</span>
        <span className="text-purple-200 text-xs sm:text-sm ml-2">
          — Stai simulando il percorso di un nuovo utente
        </span>
      </div>
    </div>
    <Button 
      size="sm" 
      variant="ghost" 
      onClick={onExit} 
      className="text-white hover:bg-purple-700 border border-purple-400"
    >
      <X size={16} className="mr-1" /> Esci dalla Demo
    </Button>
  </div>
);
