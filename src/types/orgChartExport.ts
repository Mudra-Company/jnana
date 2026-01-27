// Export options for PDF generation
export interface OrgChartExportOptions {
  // Node level options
  showNodeType: boolean;
  showClimateScore: boolean;
  showSkillGap: boolean;
  showHiringCount: boolean;
  
  // Employee level options
  showEmployeeNames: boolean;
  showJobTitles: boolean;
  showRiasecCode: boolean;
  showCultureFit: boolean;
  showManagerFit: boolean;
  showLeaderBadge: boolean;
}

// Default export options
export const DEFAULT_EXPORT_OPTIONS: OrgChartExportOptions = {
  // Node level - ON by default
  showNodeType: true,
  showClimateScore: true,
  showSkillGap: true,
  showHiringCount: true,
  
  // Employee level - OFF by default
  showEmployeeNames: false,
  showJobTitles: false,
  showRiasecCode: false,
  showCultureFit: false,
  showManagerFit: false,
  showLeaderBadge: false,
};

// Option metadata for UI rendering
export interface ExportOptionMeta {
  key: keyof OrgChartExportOptions;
  label: string;
  description: string;
  category: 'node' | 'employee';
}

export const EXPORT_OPTIONS_META: ExportOptionMeta[] = [
  // Node level
  { key: 'showNodeType', label: 'Tipo nodo', description: 'ROOT, DEPARTMENT, TEAM', category: 'node' },
  { key: 'showClimateScore', label: 'Clima medio', description: 'Punteggio clima del nodo', category: 'node' },
  { key: 'showSkillGap', label: 'Gap competenze', description: 'Percentuale skill gap', category: 'node' },
  { key: 'showHiringCount', label: 'Posizioni aperte', description: 'Numero hiring attivi', category: 'node' },
  
  // Employee level
  { key: 'showEmployeeNames', label: 'Nomi dipendenti', description: 'Nome e cognome', category: 'employee' },
  { key: 'showJobTitles', label: 'Job Title', description: 'Ruolo/posizione', category: 'employee' },
  { key: 'showRiasecCode', label: 'Codice RIASEC', description: 'Es. R-I-A', category: 'employee' },
  { key: 'showCultureFit', label: 'Fit culturale', description: 'Match con valori aziendali', category: 'employee' },
  { key: 'showManagerFit', label: 'Fit manager', description: 'Compatibilità con superiori', category: 'employee' },
  { key: 'showLeaderBadge', label: 'Badge Leader', description: 'Indicatore leadership', category: 'employee' },
];
