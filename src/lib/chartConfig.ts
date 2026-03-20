import type { Observation } from '@/types';

// ─── Types ──────────────────────────────────────────────────────────

export interface ValueBand {
  label: string;
  score: number;
  min?: number;
  max?: number;
  match?: string; // for non-numeric params (consciousness, air/oxygen)
}

export interface ChartSection {
  id: string;
  sectionLabel: string;
  paramLabel: string;
  paramKey: string;
  bands: ValueBand[];
  info?: string;
}

// ─── Score colours (matching the reference chart.css) ───────────────

export const SCORE_COLOURS: Record<number, { bg: string; text: string }> = {
  0: { bg: '#ffffff', text: '#333' },
  1: { bg: '#FFF2AC', text: '#333' },
  2: { bg: '#FCC98A', text: '#333' },
  3: { bg: '#F69781', text: '#333' },
};

export const TITLE_BG = '#0066cc';

// ─── Chart sections (matching the reference chart.js `news` object) ─

export const NEWS2_SECTIONS: ChartSection[] = [
  {
    id: 'resp',
    sectionLabel: 'A+B',
    paramLabel: 'Respirations',
    paramKey: 'respirationRate',
    bands: [
      { label: '\u226525', min: 25, max: 200, score: 3 },
      { label: '21\u201324', min: 21, max: 24, score: 2 },
      { label: '18\u201320', min: 18, max: 20, score: 0 },
      { label: '15\u201317', min: 15, max: 17, score: 0 },
      { label: '12\u201314', min: 12, max: 14, score: 0 },
      { label: '9\u201311', min: 9, max: 11, score: 1 },
      { label: '\u22648', min: 0, max: 8, score: 3 },
    ],
  },
  {
    id: 'sat1',
    sectionLabel: 'A+B',
    paramLabel: 'SpO\u2082 Scale 1',
    paramKey: 'spO2',
    info: 'Oxygen saturation %',
    bands: [
      { label: '\u226596', min: 96, max: 100, score: 0 },
      { label: '94\u201395', min: 94, max: 95, score: 1 },
      { label: '92\u201393', min: 92, max: 93, score: 2 },
      { label: '\u226491', min: 0, max: 91, score: 3 },
    ],
  },
  {
    id: 'sat2',
    sectionLabel: '',
    paramLabel: 'SpO\u2082 Scale 2',
    paramKey: 'spO2',
    info: 'Use Scale 2 if target range is 88\u201392%',
    bands: [
      { label: '\u226597 on O\u2082', min: 97, max: 100, score: 3 },
      { label: '95\u201396 on O\u2082', min: 95, max: 96, score: 2 },
      { label: '93\u201394 on O\u2082', min: 93, max: 94, score: 1 },
      { label: '\u226593 on air', min: 93, max: 100, score: 0 },
      { label: '88\u201392', min: 88, max: 92, score: 0 },
      { label: '86\u201387', min: 86, max: 87, score: 1 },
      { label: '84\u201385', min: 84, max: 85, score: 2 },
      { label: '\u226483', min: 0, max: 83, score: 3 },
    ],
  },
  {
    id: 'airox',
    sectionLabel: '',
    paramLabel: 'Air or Oxygen?',
    paramKey: 'oxygenDelivery',
    bands: [
      { label: 'Air', match: 'Air', score: 0 },
      { label: 'Oxygen', match: 'Oxygen', score: 2 },
    ],
  },
  {
    id: 'bp',
    sectionLabel: 'C',
    paramLabel: 'Blood Pressure',
    paramKey: 'systolicBP',
    info: 'Systolic BP mmHg',
    bands: [
      { label: '\u2265220', min: 220, max: 500, score: 3 },
      { label: '201\u2013219', min: 201, max: 219, score: 0 },
      { label: '181\u2013200', min: 181, max: 200, score: 0 },
      { label: '161\u2013180', min: 161, max: 180, score: 0 },
      { label: '141\u2013160', min: 141, max: 160, score: 0 },
      { label: '121\u2013140', min: 121, max: 140, score: 0 },
      { label: '111\u2013120', min: 111, max: 120, score: 0 },
      { label: '101\u2013110', min: 101, max: 110, score: 1 },
      { label: '91\u2013100', min: 91, max: 100, score: 2 },
      { label: '81\u201390', min: 81, max: 90, score: 3 },
      { label: '71\u201380', min: 71, max: 80, score: 3 },
      { label: '61\u201370', min: 61, max: 70, score: 3 },
      { label: '51\u201360', min: 51, max: 60, score: 3 },
      { label: '\u226450', min: 0, max: 50, score: 3 },
    ],
  },
  {
    id: 'pulse',
    sectionLabel: 'C',
    paramLabel: 'Pulse',
    paramKey: 'pulse',
    info: 'Beats/min',
    bands: [
      { label: '\u2265131', min: 131, max: 500, score: 3 },
      { label: '121\u2013130', min: 121, max: 130, score: 2 },
      { label: '111\u2013120', min: 111, max: 120, score: 2 },
      { label: '101\u2013110', min: 101, max: 110, score: 1 },
      { label: '91\u2013100', min: 91, max: 100, score: 1 },
      { label: '81\u201390', min: 81, max: 90, score: 0 },
      { label: '71\u201380', min: 71, max: 80, score: 0 },
      { label: '61\u201370', min: 61, max: 70, score: 0 },
      { label: '51\u201360', min: 51, max: 60, score: 0 },
      { label: '41\u201350', min: 41, max: 50, score: 1 },
      { label: '31\u201340', min: 31, max: 40, score: 3 },
      { label: '\u226430', min: 0, max: 30, score: 3 },
    ],
  },
  {
    id: 'acvpu',
    sectionLabel: 'D',
    paramLabel: 'Consciousness',
    paramKey: 'consciousness',
    info: 'ACVPU',
    bands: [
      { label: 'Alert', match: 'Alert', score: 0 },
      { label: 'Confusion', match: 'Confusion', score: 3 },
      { label: 'Voice', match: 'Voice', score: 3 },
      { label: 'Pain', match: 'Pain', score: 3 },
      { label: 'Unresponsive', match: 'Unresponsive', score: 3 },
    ],
  },
  {
    id: 'temp',
    sectionLabel: 'E',
    paramLabel: 'Temperature',
    paramKey: 'temperature',
    info: '°C',
    bands: [
      { label: '>=39.1°C', min: 39.1, max: 50, score: 2 },
      { label: '38.1-39.0°C', min: 38.1, max: 39.0, score: 1 },
      { label: '37.1-38.0°C', min: 37.1, max: 38.0, score: 0 },
      { label: '36.1-37.0°C', min: 36.1, max: 37.0, score: 0 },
      { label: '35.1-36.0°C', min: 35.1, max: 36.0, score: 1 },
      { label: '<=35.0°C', min: 0, max: 35.0, score: 3 },
    ],
  },
];

// ─── Band matching ──────────────────────────────────────────────────

export function findMatchingBandIndex(
  section: ChartSection,
  obs: Observation,
): number {
  const value = obs[section.paramKey as keyof Observation];

  // Non-numeric match (consciousness, air/oxygen)
  if (section.bands[0].match !== undefined) {
    const strVal = String(value);
    return section.bands.findIndex((b) => b.match === strVal);
  }

  // SpO2 Scale 2 — depends on oxygen delivery
  if (section.id === 'sat2') {
    const numVal = Number(value);
    const onOxygen = obs.oxygenDelivery === 'Oxygen';
    if (onOxygen) {
      // Check O2-specific bands first (indices 0-2)
      for (let i = 0; i <= 2; i++) {
        const b = section.bands[i];
        if (numVal >= b.min! && numVal <= b.max!) return i;
      }
      // Then general bands (4-7)
      for (let i = 4; i < section.bands.length; i++) {
        const b = section.bands[i];
        if (numVal >= b.min! && numVal <= b.max!) return i;
      }
    } else {
      // On air: check ">=93 on air" first (index 3)
      if (numVal >= 93) return 3;
      // Then general bands (4-7)
      for (let i = 4; i < section.bands.length; i++) {
        const b = section.bands[i];
        if (numVal >= b.min! && numVal <= b.max!) return i;
      }
    }
    return -1;
  }

  // SpO2 Scale 1 — only match if observation used scale 1
  if (section.id === 'sat1') {
    if (obs.spO2Scale !== 1) return -1;
  }

  // Standard numeric range match
  const numVal = Number(value);
  return section.bands.findIndex(
    (b) => b.min !== undefined && b.max !== undefined && numVal >= b.min && numVal <= b.max,
  );
}

/** Should this section be shown for a given set of observations? */
export function sectionHasData(section: ChartSection, observations: Observation[]): boolean {
  if (section.id === 'sat1') {
    return observations.some((o) => o.spO2Scale === 1);
  }
  if (section.id === 'sat2') {
    return observations.some((o) => o.spO2Scale === 2);
  }
  return true;
}
