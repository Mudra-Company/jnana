/**
 * IoTab — Sintesi identitaria della persona: RIASEC, soft skill, valori, clima.
 * Riusa la grafica essenziale già nota; per il dettaglio rimanda al test relativo.
 */
import React from 'react';
import { Hexagon, Sparkles, Shield, ThermometerSun, ArrowRight } from 'lucide-react';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import type { User } from '../../../types';

interface IoTabProps {
  user: User;
  climateIndex?: number | null;
  onOpenRiasec: () => void;
  onOpenKarma: () => void;
  onOpenClimate: () => void;
}

const DIM_LABELS: Record<string, string> = {
  R: 'Realistico',
  I: 'Investigativo',
  A: 'Artistico',
  S: 'Sociale',
  E: 'Intraprendente',
  C: 'Convenzionale',
};

export const IoTab: React.FC<IoTabProps> = ({ user, climateIndex, onOpenRiasec, onOpenKarma, onOpenClimate }) => {
  const riasec = (user.results ?? null) as any;
  const dims = riasec
    ? Object.entries(riasec)
        .map(([k, v]) => ({ k, v: Number(v) || 0 }))
        .sort((a, b) => b.v - a.v)
        .slice(0, 3)
    : [];

  const karma = (user.karmaData ?? {}) as any;
  const softSkills: string[] = karma.softSkills ?? [];
  const values: string[] = karma.primaryValues ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* RIASEC */}
      <Card className="lg:col-span-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-bold text-jnana-text flex items-center gap-2">
            <Hexagon size={18} className="text-jnana-sage" />
            Profilo attitudinale
          </h3>
          <button
            onClick={onOpenRiasec}
            className="text-xs text-jnana-sage hover:text-jnana-sageDark inline-flex items-center gap-1"
          >
            Dettaglio <ArrowRight size={12} />
          </button>
        </div>
        {dims.length === 0 ? (
          <div className="text-sm text-jnana-text/60">
            Non hai ancora completato il test RIASEC.
            <div className="mt-3">
              <Button onClick={onOpenRiasec}>Compila ora</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {dims.map(({ k, v }, i) => (
              <div key={k} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-jnana-sage/15 text-jnana-sageDark text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-jnana-text">{DIM_LABELS[k] ?? k}</span>
                <span className="text-sm font-semibold text-jnana-sageDark tabular-nums">{v}/30</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Karma — soft skills */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-bold text-jnana-text flex items-center gap-2">
            <Sparkles size={18} className="text-jnana-sage" />
            Soft skill
          </h3>
          <button
            onClick={onOpenKarma}
            className="text-xs text-jnana-sage hover:text-jnana-sageDark inline-flex items-center gap-1"
          >
            Karma AI <ArrowRight size={12} />
          </button>
        </div>
        {softSkills.length === 0 ? (
          <div className="text-sm text-jnana-text/60">
            Completa il colloquio Karma AI per vedere le tue soft skill.
            <div className="mt-3">
              <Button onClick={onOpenKarma}>Avvia colloquio</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {softSkills.map((s, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-full text-xs bg-jnana-sage/10 text-jnana-sageDark"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* Valori */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-bold text-jnana-text flex items-center gap-2">
            <Shield size={18} className="text-jnana-sage" />
            Valori
          </h3>
        </div>
        {values.length === 0 ? (
          <p className="text-sm text-jnana-text/60">
            I tuoi valori emergeranno dal colloquio Karma AI.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {values.map((v, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-full text-xs bg-jnana-powder/40 text-jnana-text"
              >
                {v}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* Clima */}
      <Card className="lg:col-span-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-jnana-sage/10 flex items-center justify-center">
              <ThermometerSun size={18} className="text-jnana-sage" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-jnana-text">Il mio clima percepito</h3>
              <p className="text-xs text-jnana-text/60">
                {climateIndex != null
                  ? `Ultimo indice: ${climateIndex.toFixed(1)}/5 — visibile solo a te.`
                  : 'Non hai ancora compilato il sondaggio clima.'}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={onOpenClimate}>
            {climateIndex != null ? 'Ricompila' : 'Compila ora'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
