import React from 'react';
import { MousePointer, Square, Monitor, Trash2, Thermometer, RotateCcw } from 'lucide-react';
import type { CanvasMode } from '@/types/spacesync';

interface CanvasToolbarProps {
  mode: CanvasMode;
  setMode: (mode: CanvasMode) => void;
  zoom: number;
  setZoom: (fn: (z: number) => number) => void;
  heatmapMode?: boolean;
  onToggleHeatmap?: () => void;
  selectedRoomId?: string;
  selectedDeskId?: string;
  onDeleteRoom: () => void;
  onDeleteDesk: () => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  mode,
  setMode,
  zoom,
  setZoom,
  heatmapMode,
  onToggleHeatmap,
  selectedRoomId,
  selectedDeskId,
  onDeleteRoom,
  onDeleteDesk,
}) => {
  return (
    <div className="flex items-center gap-0.5 p-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-soft">
      {/* Drawing tools group */}
      <div className="flex items-center gap-0.5 bg-gray-100/40 dark:bg-gray-700/40 rounded-lg p-0.5">
        <ToolButton active={mode === 'select'} onClick={() => setMode('select')} icon={<MousePointer size={18} />} label="Seleziona" shortcut="1" />
        <ToolButton active={mode === 'draw-room'} onClick={() => setMode('draw-room')} icon={<Square size={18} />} label="Disegna Stanza" shortcut="2" />
        <ToolButton active={mode === 'place-desk'} onClick={() => setMode('place-desk')} icon={<Monitor size={18} />} label="Posiziona Scrivania" shortcut="3" />
      </div>

      <Separator label="Zoom" />

      {/* Zoom group */}
      <div className="flex items-center gap-1.5">
        <input
          type="range"
          min={30}
          max={200}
          value={Math.round(zoom * 100)}
          onChange={(e) => setZoom(() => parseInt(e.target.value) / 100)}
          className="w-20 h-1.5 accent-jnana-sage cursor-pointer"
          title="Zoom"
        />
        <button
          onClick={() => setZoom(() => 1)}
          className="text-xs font-mono text-gray-500 dark:text-gray-400 hover:text-jnana-text dark:hover:text-gray-100 min-w-[3rem] text-center transition-colors"
          title="Reset zoom a 100%"
        >
          {Math.round(zoom * 100)}%
        </button>
      </div>

      {/* Heatmap */}
      {onToggleHeatmap && (
        <>
          <Separator label="Vista" />
          <ToolButton
            active={heatmapMode}
            onClick={onToggleHeatmap}
            icon={<Thermometer size={18} />}
            label="Heatmap"
          />
        </>
      )}

      {/* Destructive actions */}
      {(selectedRoomId || selectedDeskId) && (
        <>
          <Separator label="Azioni" />
          {selectedDeskId && (
            <button
              onClick={onDeleteDesk}
              className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 size={15} />
              <span className="hidden sm:inline">Scrivania</span>
            </button>
          )}
          {selectedRoomId && (
            <button
              onClick={onDeleteRoom}
              className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 size={15} />
              <span className="hidden sm:inline">Stanza</span>
            </button>
          )}
        </>
      )}
    </div>
  );
};

const ToolButton: React.FC<{
  active?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
}> = ({ active, onClick, icon, label, shortcut }) => (
  <button
    onClick={onClick}
    title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all min-w-[36px] min-h-[36px] ${
      active
        ? 'bg-jnana-sage text-white shadow-md scale-[1.02]'
        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-jnana-text dark:hover:text-gray-100'
    }`}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

const Separator: React.FC<{ label?: string }> = ({ label }) => (
  <div className="flex flex-col items-center mx-1.5">
    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
    {label && <span className="text-[8px] text-gray-400/60 dark:text-gray-500/60 uppercase tracking-wider mt-0.5">{label}</span>}
  </div>
);
