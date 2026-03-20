import type {
  ConsciousnessLevel,
  OxygenDelivery,
  SpO2Scale,
  ParameterScores,
  RiskLevel,
  ClinicalResponse,
} from '@/types';

// ─── Individual parameter scoring ───────────────────────────────────

export function scoreRespirationRate(rate: number): number {
  if (rate <= 8) return 3;
  if (rate <= 11) return 1;
  if (rate <= 20) return 0;
  if (rate <= 24) return 2;
  return 3; // ≥25
}

export function scoreSpO2Scale1(spO2: number): number {
  if (spO2 <= 91) return 3;
  if (spO2 <= 93) return 2;
  if (spO2 <= 95) return 1;
  return 0; // ≥96
}

export function scoreSpO2Scale2(spO2: number, onOxygen: boolean): number {
  if (spO2 <= 83) return 3;
  if (spO2 <= 85) return 2;
  if (spO2 <= 87) return 1;
  if (spO2 <= 92 || (!onOxygen && spO2 >= 93)) return 0;
  if (onOxygen) {
    if (spO2 <= 94) return 1;
    if (spO2 <= 96) return 2;
    return 3; // ≥97 on O2
  }
  return 0;
}

export function scoreSpO2(spO2: number, scale: SpO2Scale, onOxygen: boolean): number {
  return scale === 1 ? scoreSpO2Scale1(spO2) : scoreSpO2Scale2(spO2, onOxygen);
}

export function scoreOxygenDelivery(delivery: OxygenDelivery): number {
  return delivery === 'Oxygen' ? 2 : 0;
}

export function scoreSystolicBP(bp: number): number {
  if (bp <= 90) return 3;
  if (bp <= 100) return 2;
  if (bp <= 110) return 1;
  if (bp <= 219) return 0;
  return 3; // ≥220
}

export function scorePulse(pulse: number): number {
  if (pulse <= 40) return 3;
  if (pulse <= 50) return 1;
  if (pulse <= 90) return 0;
  if (pulse <= 110) return 1;
  if (pulse <= 130) return 2;
  return 3; // ≥131
}

export function scoreConsciousness(level: ConsciousnessLevel): number {
  return level === 'Alert' ? 0 : 3;
}

export function scoreTemperature(temp: number): number {
  if (temp <= 35.0) return 3;
  if (temp <= 36.0) return 1;
  if (temp <= 38.0) return 0;
  if (temp <= 39.0) return 1;
  return 2; // ≥39.1
}

// ─── Aggregate scoring ──────────────────────────────────────────────

export function calculateParameterScores(
  respirationRate: number,
  spO2: number,
  spO2Scale: SpO2Scale,
  oxygenDelivery: OxygenDelivery,
  systolicBP: number,
  pulse: number,
  consciousness: ConsciousnessLevel,
  temperature: number,
): ParameterScores {
  const onOxygen = oxygenDelivery === 'Oxygen';
  return {
    respirationRate: scoreRespirationRate(respirationRate),
    spO2: scoreSpO2(spO2, spO2Scale, onOxygen),
    oxygenDelivery: scoreOxygenDelivery(oxygenDelivery),
    systolicBP: scoreSystolicBP(systolicBP),
    pulse: scorePulse(pulse),
    consciousness: scoreConsciousness(consciousness),
    temperature: scoreTemperature(temperature),
  };
}

export function totalScore(scores: ParameterScores): number {
  return Object.values(scores).reduce((sum, s) => sum + s, 0);
}

export function hasAnyScoreOf3(scores: ParameterScores): boolean {
  return Object.values(scores).some((s) => s === 3);
}

// ─── Risk level determination ───────────────────────────────────────

export function determineRiskLevel(total: number, singleParam3: boolean): RiskLevel {
  if (total >= 7) return 'high';
  if (total >= 5) return 'medium';
  if (singleParam3) return 'low-medium';
  if (total >= 1) return 'low';
  return 'low';
}

export const CLINICAL_RESPONSES: Record<RiskLevel, ClinicalResponse> = {
  low: {
    riskLevel: 'low',
    label: 'Low',
    description: 'Routine monitoring (minimum 12-hourly)',
    colour: 'bg-green-100 text-green-800',
  },
  'low-medium': {
    riskLevel: 'low-medium',
    label: 'Low–Medium',
    description: 'Urgent review by clinician competent in acute illness',
    colour: 'bg-yellow-100 text-yellow-800',
  },
  medium: {
    riskLevel: 'medium',
    label: 'Medium',
    description: 'Urgent response — clinician with acute illness competencies',
    colour: 'bg-orange-100 text-orange-800',
  },
  high: {
    riskLevel: 'high',
    label: 'High',
    description: 'Emergency response — critical care outreach / team',
    colour: 'bg-red-100 text-red-800',
  },
};
