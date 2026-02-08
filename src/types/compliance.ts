/**
 * Jnana Compliance - Type Definitions
 * Risk Management module for labor law compliance tracking
 */

// ============================================
// ENUMS & CONSTANTS
// ============================================

export type ComplianceStatus = 'missing' | 'pending' | 'valid' | 'expired';
export type TrafficLightStatus = 'red' | 'yellow' | 'green';
export type DeadlineType = 'fixed_date' | 'recurring' | 'on_event';

export const CCNL_OPTIONS = [
  { code: 'Universale', label: 'Obblighi Universali', description: 'Applicabili a tutte le aziende italiane' },
  { code: 'Metalmeccanico', label: 'CCNL Metalmeccanico', description: 'Industria e artigianato metalmeccanico' },
  { code: 'Commercio', label: 'CCNL Commercio', description: 'Terziario, distribuzione e servizi' },
  { code: 'Chimico', label: 'CCNL Chimico-Farmaceutico', description: 'Industria chimica e farmaceutica' },
  { code: 'Agricoltura', label: 'CCNL Agricoltura', description: 'Settore agricolo e florovivaistico' },
  { code: 'Turismo', label: 'CCNL Turismo', description: 'Alberghi, ristorazione e pubblici esercizi' },
  { code: 'Alimentari', label: 'CCNL Alimentari', description: 'Industria alimentare' },
  { code: 'Edilizia', label: 'CCNL Edilizia', description: 'Costruzioni e cantieristica' },
  { code: 'Trasporti', label: 'CCNL Trasporti e Logistica', description: 'Autotrasporto e logistica' },
] as const;

export type CCNLCode = typeof CCNL_OPTIONS[number]['code'];

export const COMPLIANCE_CATEGORIES = [
  'Sicurezza',
  'Sanità',
  'Privacy',
  'Welfare',
  'Formazione',
] as const;

export type ComplianceCategory = typeof COMPLIANCE_CATEGORIES[number];

// ============================================
// DATABASE ENTITIES
// ============================================

export interface ComplianceRequirement {
  id: string;
  category: ComplianceCategory;
  ccnlScope: string; // Can be any CCNL code from database
  obligationName: string;
  description: string;
  frequency: string;
  frequencyMonths: number | null;
  documentRequired: string;
  deadlineType: DeadlineType;
  fixedDeadlineDay?: number;
  fixedDeadlineMonth?: number;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string; // Made optional for DB compatibility
}

export interface CompanyCCNLSelection {
  id: string;
  companyId: string;
  ccnlCode: CCNLCode;
  ccnlLabel: string;
  isPrimary: boolean;
  createdAt?: string; // Made optional for DB compatibility
}

export interface CompanyComplianceStatusRecord {
  id: string;
  companyId: string;
  requirementId: string;
  status: ComplianceStatus;
  documentUrl?: string;
  documentName?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  validFrom?: string;
  validUntil?: string;
  notes?: string;
  lastReminderSent?: string;
  createdAt?: string; // Made optional for DB compatibility
  updatedAt?: string; // Made optional for DB compatibility
}

export interface ComplianceHistoryEntry {
  id: string;
  complianceStatusId: string;
  action: 'upload' | 'renewal' | 'expiration' | 'reminder_sent' | 'note_added';
  performedBy?: string;
  oldStatus?: ComplianceStatus;
  newStatus?: ComplianceStatus;
  documentUrl?: string;
  notes?: string;
  createdAt: string;
}

// ============================================
// COMPUTED/UI TYPES
// ============================================

export interface ComplianceItem extends CompanyComplianceStatusRecord {
  requirement: ComplianceRequirement;
  trafficLight: TrafficLightStatus;
  daysUntilExpiry: number | null;
  uploaderName?: string;
}

export interface ComplianceRiskScore {
  score: number; // 0-100
  totalObligations: number;
  greenCount: number;
  yellowCount: number;
  redCount: number;
  criticalItems: ComplianceItem[];
  categoryBreakdown: Record<ComplianceCategory, {
    total: number;
    green: number;
    yellow: number;
    red: number;
  }>;
}

export interface ComplianceFilters {
  category?: ComplianceCategory;
  status?: TrafficLightStatus;
  search?: string;
}

// ============================================
// HELPER FUNCTIONS (for use in hooks/components)
// ============================================

/**
 * Calculate traffic light status based on expiry date and current status
 */
export function calculateTrafficLight(
  validUntil: string | null | undefined,
  status: ComplianceStatus
): TrafficLightStatus {
  if (status === 'missing' || !validUntil) return 'red';
  if (status === 'pending') return 'yellow';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(validUntil);
  expiry.setHours(0, 0, 0, 0);
  
  const diffTime = expiry.getTime() - today.getTime();
  const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry < 0) return 'red';      // Expired
  if (daysUntilExpiry <= 30) return 'yellow'; // Expiring soon
  return 'green';                              // Valid
}

/**
 * Calculate days until expiry (negative if already expired)
 */
export function calculateDaysUntilExpiry(validUntil: string | null | undefined): number | null {
  if (!validUntil) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(validUntil);
  expiry.setHours(0, 0, 0, 0);
  
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate suggested expiry date based on frequency
 */
export function calculateExpiryDate(frequencyMonths: number | null, fromDate?: Date): Date | null {
  if (!frequencyMonths) return null;
  
  const date = fromDate ? new Date(fromDate) : new Date();
  date.setMonth(date.getMonth() + frequencyMonths);
  return date;
}

/**
 * Format expiry status for display
 */
export function formatExpiryStatus(
  validUntil: string | null | undefined,
  status: ComplianceStatus
): string {
  if (status === 'missing') return 'Documento mancante';
  if (status === 'pending') return 'In attesa di verifica';
  if (!validUntil) return 'Scadenza non definita';
  
  const days = calculateDaysUntilExpiry(validUntil);
  if (days === null) return 'Scadenza non definita';
  
  if (days < 0) {
    const absDays = Math.abs(days);
    return `Scaduto da ${absDays} ${absDays === 1 ? 'giorno' : 'giorni'}`;
  }
  
  if (days === 0) return 'Scade oggi!';
  if (days === 1) return 'Scade domani';
  if (days <= 7) return `Scade tra ${days} giorni`;
  if (days <= 30) return `Scade tra ${days} giorni`;
  
  const expiryDate = new Date(validUntil);
  return `Scade il ${expiryDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}`;
}
