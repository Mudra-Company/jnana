/**
 * OrgChartCanvas
 *
 * Wraps the existing <Tree> rendering in a zoom/pan/scroll canvas.
 * Uses react-zoom-pan-pinch. Provides a floating toolbar with zoom controls,
 * fit-to-screen and collapse/expand-all actions.
 */
import React from 'react';
import {
  TransformWrapper,
  TransformComponent,
  type ReactZoomPanPinchRef,
} from 'react-zoom-pan-pinch';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  ChevronsDownUp,
  ChevronsUpDown,
} from 'lucide-react';

interface OrgChartCanvasProps {
  children: React.ReactNode;
  onCollapseAll?: () => void;
  onExpandAll?: () => void;
}

export const OrgChartCanvas: React.FC<OrgChartCanvasProps> = ({
  children,
  onCollapseAll,
  onExpandAll,
}) => {
  const ref = React.useRef<ReactZoomPanPinchRef | null>(null);
  const [zoomPct, setZoomPct] = React.useState(100);

  return (
    <div className="relative w-full h-full min-h-0 overflow-hidden bg-gray-50/50 dark:bg-gray-900/50">
      <TransformWrapper
        ref={ref}
        initialScale={1}
        minScale={0.2}
        maxScale={2.5}
        limitToBounds={false}
        centerOnInit
        wheel={{ step: 0.1, activationKeys: ['Control', 'Meta'] }}
        doubleClick={{ disabled: true }}
        panning={{ excluded: ['button', 'a', 'input', 'textarea', 'select'] }}
        onTransform={(ref) => setZoomPct(Math.round((ref.state?.scale ?? 1) * 100))}
      >
        {({ zoomIn, zoomOut, resetTransform, centerView }) => (
          <>
            <TransformComponent
              wrapperClass="!w-full !h-full"
              contentClass="!w-max"
            >
              <div className="p-12">{children}</div>
            </TransformComponent>

            {/* Floating Toolbar */}
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-1">
              {onCollapseAll && (
                <button
                  onClick={onCollapseAll}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-100"
                  title="Comprimi tutti"
                  aria-label="Comprimi tutti i nodi"
                >
                  <ChevronsDownUp size={16} />
                </button>
              )}
              {onExpandAll && (
                <button
                  onClick={onExpandAll}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-100"
                  title="Espandi tutti"
                  aria-label="Espandi tutti i nodi"
                >
                  <ChevronsUpDown size={16} />
                </button>
              )}
              <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
              <button
                onClick={() => zoomOut()}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-100"
                title="Zoom out"
                aria-label="Zoom out"
              >
                <ZoomOut size={16} />
              </button>
              <span className="px-2 text-xs font-mono tabular-nums text-gray-600 dark:text-gray-300 min-w-[3.5rem] text-center">
                {zoomPct}%
              </span>
              <button
                onClick={() => zoomIn()}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-100"
                title="Zoom in"
                aria-label="Zoom in"
              >
                <ZoomIn size={16} />
              </button>
              <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
              <button
                onClick={() => centerView()}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-100"
                title="Centra"
                aria-label="Centra organigramma"
              >
                <Maximize2 size={16} />
              </button>
              <button
                onClick={() => resetTransform()}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-100"
                title="Reset zoom"
                aria-label="Reset zoom"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            <div className="absolute bottom-4 left-4 z-20 text-xs text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 backdrop-blur px-2 py-1 rounded-md pointer-events-none">
              Trascina per spostare · Ctrl + rotella per zoom
            </div>
          </>
        )}
      </TransformWrapper>
    </div>
  );
};
