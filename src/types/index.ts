// ─── Patient ────────────────────────────────────────────────────────

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  dateOfAdmission: string;
  nhsNumber?: string;
  roomNumber?: string;
  wardId: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Observations & Scoring ─────────────────────────────────────────

export type ConsciousnessLevel = 'Alert' | 'Confusion' | 'Voice' | 'Pain' | 'Unresponsive';
export type OxygenDelivery = 'Air' | 'Oxygen';
export type SpO2Scale = 1 | 2;

export interface Observation {
  id: string;
  patientId: string;
  recordedAt: string;
  recordedBy: string; // staff name for audit trail
  declined: boolean; // patient declined observations

  respirationRate: number;
  spO2: number;
  spO2Scale: SpO2Scale;
  oxygenDelivery: OxygenDelivery;
  systolicBP: number;
  diastolicBP?: number;
  pulse: number;
  consciousness: ConsciousnessLevel;
  temperature: number;
  weight?: number;

  scores: ParameterScores;
  totalScore: number;
  riskLevel: RiskLevel;
}

export interface ParameterScores {
  respirationRate: number;
  spO2: number;
  oxygenDelivery: number;
  systolicBP: number;
  pulse: number;
  consciousness: number;
  temperature: number;
}

// ─── Risk Levels ────────────────────────────────────────────────────

export type RiskLevel = 'low' | 'low-medium' | 'medium' | 'high';

export interface ClinicalResponse {
  riskLevel: RiskLevel;
  label: string;
  description: string;
  colour: string; // Tailwind colour class
}

// ─── Ward & Auth ────────────────────────────────────────────────────

export interface Ward {
  id: string;
  name: string;
  unitName: string;
  trustName: string;
  adminEmail: string;
  wardCode: string; // 4-digit code shared with staff
  subscriptionStatus: 'active' | 'inactive' | 'trial';
  cycleStartDate: string;
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  ward: Ward | null;
  firstName: string;
  lastName: string;
  staffName: string; // "FirstName LastName" for display & audit
  initials: string;  // "AB" for NEWS chart
}

// ─── Chart ──────────────────────────────────────────────────────────

export interface ChartEntry {
  timestamp: string;
  observation: Observation;
}

export interface PatientChart {
  patient: Patient;
  entries: ChartEntry[];
  cycleStart: string;
  cycleEnd: string;
}
