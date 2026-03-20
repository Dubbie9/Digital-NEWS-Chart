import type { Patient, Observation, ConsciousnessLevel, OxygenDelivery, SpO2Scale } from '@/types';
import {
  calculateParameterScores,
  totalScore as calcTotal,
  hasAnyScoreOf3,
  determineRiskLevel,
} from './scoring';

// ─── Seeded random for reproducible data ────────────────────────────

let _seed = 42;
function rand(): number {
  _seed = (_seed * 16807 + 0) % 2147483647;
  return (_seed - 1) / 2147483646;
}
function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}
function randFloat(min: number, max: number, decimals = 1): number {
  return Number((rand() * (max - min) + min).toFixed(decimals));
}
function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

// ─── Helpers ────────────────────────────────────────────────────────

function makeObservation(
  id: string,
  patientId: string,
  recordedBy: string,
  recordedAt: string,
  vitals: {
    respirationRate: number;
    spO2: number;
    systolicBP: number;
    diastolicBP?: number;
    pulse: number;
    temperature: number;
    consciousness: ConsciousnessLevel;
    oxygenDelivery: OxygenDelivery;
    spO2Scale: SpO2Scale;
    weight?: number;
  },
): Observation {
  const scores = calculateParameterScores(
    vitals.respirationRate,
    vitals.spO2,
    vitals.spO2Scale,
    vitals.oxygenDelivery,
    vitals.systolicBP,
    vitals.pulse,
    vitals.consciousness,
    vitals.temperature,
  );
  const total = calcTotal(scores);
  const riskLevel = determineRiskLevel(total, hasAnyScoreOf3(scores));

  return {
    id,
    patientId,
    recordedAt,
    recordedBy,
    ...vitals,
    scores,
    totalScore: total,
    riskLevel,
    declined: false,
  };
}

function makeDeclinedObservation(
  id: string,
  patientId: string,
  recordedBy: string,
  recordedAt: string,
): Observation {
  return {
    id,
    patientId,
    recordedAt,
    recordedBy,
    declined: true,
    respirationRate: 0,
    spO2: 0,
    spO2Scale: 1,
    oxygenDelivery: 'Air',
    systolicBP: 0,
    pulse: 0,
    consciousness: 'Alert',
    temperature: 0,
    scores: { respirationRate: 0, spO2: 0, oxygenDelivery: 0, systolicBP: 0, pulse: 0, consciousness: 0, temperature: 0 },
    totalScore: 0,
    riskLevel: 'low',
  };
}

// ─── Staff names ────────────────────────────────────────────────────

const STAFF = [
  'Nurse Sarah Jones',
  'Nurse David Clark',
  'Nurse Emma Wilson',
  'Dr. Khan',
  'Nurse Priya Sharma',
  'Nurse Tom Richards',
  'Nurse Amara Osei',
];

// ─── Patient profiles with typical vital ranges ─────────────────────

interface PatientProfile {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  admitDate: string;
  nhsNumber?: string;
  room: string;
  respRange: [number, number];
  spO2Range: [number, number];
  bpRange: [number, number];
  pulseRange: [number, number];
  tempRange: [number, number];
  scale: SpO2Scale;
  o2: OxygenDelivery;
  consciousness: ConsciousnessLevel;
  weight: number;
  declineRate: number;
}

const PROFILES: PatientProfile[] = [
  { id: 'p1', firstName: 'Margaret', lastName: 'Thompson', dob: '1948-03-15', admitDate: '2026-02-10', nhsNumber: '943 476 5919', room: 'Bed 3', respRange: [14, 18], spO2Range: [96, 99], bpRange: [120, 140], pulseRange: [68, 80], tempRange: [36.4, 37.2], scale: 1, o2: 'Air', consciousness: 'Alert', weight: 68, declineRate: 0.05 },
  { id: 'p2', firstName: 'James', lastName: 'Patel', dob: '1962-11-22', admitDate: '2026-02-10', nhsNumber: '654 321 0987', room: 'Bed 7', respRange: [18, 26], spO2Range: [89, 96], bpRange: [90, 120], pulseRange: [85, 130], tempRange: [37.0, 39.5], scale: 1, o2: 'Oxygen', consciousness: 'Alert', weight: 85, declineRate: 0.08 },
  { id: 'p3', firstName: 'Dorothy', lastName: 'Williams', dob: '1955-07-08', admitDate: '2026-02-10', room: 'Bed 12', respRange: [16, 20], spO2Range: [88, 93], bpRange: [130, 150], pulseRange: [75, 90], tempRange: [36.2, 37.0], scale: 2, o2: 'Oxygen', consciousness: 'Alert', weight: 72, declineRate: 0.1 },
  { id: 'p4', firstName: 'Robert', lastName: 'Singh', dob: '1970-05-30', admitDate: '2026-02-11', nhsNumber: '112 233 4455', room: 'Bed 1', respRange: [12, 16], spO2Range: [97, 100], bpRange: [115, 135], pulseRange: [60, 75], tempRange: [36.5, 37.0], scale: 1, o2: 'Air', consciousness: 'Alert', weight: 78, declineRate: 0.03 },
  { id: 'p5', firstName: 'Patricia', lastName: "O'Brien", dob: '1943-12-01', admitDate: '2026-02-12', nhsNumber: '998 877 6655', room: 'Bed 5', respRange: [15, 22], spO2Range: [92, 97], bpRange: [100, 130], pulseRange: [70, 100], tempRange: [36.0, 38.0], scale: 1, o2: 'Air', consciousness: 'Alert', weight: 62, declineRate: 0.12 },
  { id: 'p6', firstName: 'Ahmed', lastName: 'Hassan', dob: '1958-09-14', admitDate: '2026-02-13', nhsNumber: '223 344 5566', room: 'Bed 8', respRange: [16, 20], spO2Range: [94, 98], bpRange: [110, 140], pulseRange: [65, 85], tempRange: [36.3, 37.5], scale: 1, o2: 'Air', consciousness: 'Alert', weight: 82, declineRate: 0.05 },
  { id: 'p7', firstName: 'Susan', lastName: 'Taylor', dob: '1951-04-20', admitDate: '2026-02-14', room: 'Bed 10', respRange: [18, 25], spO2Range: [90, 95], bpRange: [95, 115], pulseRange: [90, 120], tempRange: [37.5, 39.0], scale: 1, o2: 'Oxygen', consciousness: 'Alert', weight: 70, declineRate: 0.07 },
  { id: 'p8', firstName: 'Michael', lastName: 'Brown', dob: '1975-01-10', admitDate: '2026-02-10', nhsNumber: '445 566 7788', room: 'Bed 2', respRange: [13, 17], spO2Range: [96, 99], bpRange: [125, 145], pulseRange: [62, 78], tempRange: [36.5, 37.2], scale: 1, o2: 'Air', consciousness: 'Alert', weight: 90, declineRate: 0.02 },
  { id: 'p9', firstName: 'Elizabeth', lastName: 'Jones', dob: '1938-06-25', admitDate: '2026-02-15', nhsNumber: '556 677 8899', room: 'Bed 14', respRange: [16, 24], spO2Range: [91, 96], bpRange: [100, 125], pulseRange: [75, 110], tempRange: [36.0, 38.5], scale: 1, o2: 'Air', consciousness: 'Alert', weight: 58, declineRate: 0.15 },
  { id: 'p10', firstName: 'William', lastName: 'Davies', dob: '1965-10-03', admitDate: '2026-02-11', nhsNumber: '667 788 9900', room: 'Bed 6', respRange: [14, 19], spO2Range: [95, 98], bpRange: [118, 138], pulseRange: [68, 88], tempRange: [36.4, 37.4], scale: 1, o2: 'Air', consciousness: 'Alert', weight: 76, declineRate: 0.04 },
  { id: 'p11', firstName: 'Mary', lastName: 'Evans', dob: '1950-02-18', admitDate: '2026-02-16', room: 'Bed 11', respRange: [15, 20], spO2Range: [93, 97], bpRange: [105, 130], pulseRange: [70, 95], tempRange: [36.2, 37.8], scale: 1, o2: 'Air', consciousness: 'Alert', weight: 65, declineRate: 0.06 },
  { id: 'p12', firstName: 'George', lastName: 'Wilson', dob: '1945-08-12', admitDate: '2026-02-17', nhsNumber: '778 889 0011', room: 'Bed 15', respRange: [17, 23], spO2Range: [89, 94], bpRange: [95, 120], pulseRange: [80, 115], tempRange: [36.8, 38.8], scale: 2, o2: 'Oxygen', consciousness: 'Alert', weight: 74, declineRate: 0.1 },
  { id: 'p13', firstName: 'Helen', lastName: 'Moore', dob: '1960-03-28', admitDate: '2026-02-18', nhsNumber: '889 900 1122', room: 'Bed 4', respRange: [12, 16], spO2Range: [96, 99], bpRange: [120, 140], pulseRange: [60, 78], tempRange: [36.5, 37.2], scale: 1, o2: 'Air', consciousness: 'Alert', weight: 66, declineRate: 0.03 },
  { id: 'p14', firstName: 'Thomas', lastName: 'Anderson', dob: '1972-07-05', admitDate: '2026-02-19', nhsNumber: '900 011 2233', room: 'Bed 9', respRange: [15, 20], spO2Range: [94, 98], bpRange: [110, 135], pulseRange: [65, 85], tempRange: [36.3, 37.5], scale: 1, o2: 'Air', consciousness: 'Alert', weight: 88, declineRate: 0.04 },
  { id: 'p15', firstName: 'Joan', lastName: 'White', dob: '1940-11-15', admitDate: '2026-02-20', room: 'Bed 13', respRange: [16, 22], spO2Range: [90, 95], bpRange: [100, 128], pulseRange: [72, 105], tempRange: [36.0, 38.2], scale: 1, o2: 'Air', consciousness: 'Alert', weight: 60, declineRate: 0.13 },
];

// ─── Generate patients ──────────────────────────────────────────────

export const MOCK_PATIENTS: Patient[] = PROFILES.map((p) => ({
  id: p.id,
  firstName: p.firstName,
  lastName: p.lastName,
  dateOfBirth: p.dob,
  dateOfAdmission: p.admitDate,
  nhsNumber: p.nhsNumber,
  roomNumber: p.room,
  wardId: 'w1',
  createdAt: `${p.admitDate}T08:00:00Z`,
  updatedAt: '2026-03-18T10:00:00Z',
}));

// ─── Generate 36 days of observations ───────────────────────────────

function generateObservations(): Observation[] {
  const obs: Observation[] = [];
  let obsId = 1;

  const baseDate = new Date('2026-02-10T00:00:00Z');

  for (const profile of PROFILES) {
    const admitDate = new Date(`${profile.admitDate}T08:00:00Z`);

    for (let day = 0; day < 36; day++) {
      const date = new Date(baseDate.getTime() + day * 86400000);
      if (date < admitDate) continue;

      // Declined day
      if (rand() < profile.declineRate) {
        const hour = pick([8, 14, 20]);
        const dt = new Date(date);
        dt.setUTCHours(hour, 0, 0, 0);
        obs.push(makeDeclinedObservation(
          `o${obsId++}`,
          profile.id,
          pick(STAFF),
          dt.toISOString(),
        ));
        continue;
      }

      // 1-2 observations per day
      const timesPerDay = rand() > 0.7 ? 2 : 1;
      const hours = timesPerDay === 2 ? [8, 20] : [pick([8, 10, 14])];

      for (const hour of hours) {
        const dt = new Date(date);
        dt.setUTCHours(hour, randInt(0, 59), 0, 0);

        let consciousness = profile.consciousness;
        if (profile.id === 'p2' && day > 25 && rand() > 0.6) consciousness = 'Confusion';
        if (profile.id === 'p7' && day > 20 && rand() > 0.7) consciousness = 'Voice';
        if (profile.id === 'p9' && day > 28 && rand() > 0.8) consciousness = 'Confusion';

        obs.push(makeObservation(
          `o${obsId++}`,
          profile.id,
          pick(STAFF),
          dt.toISOString(),
          {
            respirationRate: randInt(profile.respRange[0], profile.respRange[1]),
            spO2: randInt(profile.spO2Range[0], profile.spO2Range[1]),
            systolicBP: randInt(profile.bpRange[0], profile.bpRange[1]),
            diastolicBP: randInt(60, 90),
            pulse: randInt(profile.pulseRange[0], profile.pulseRange[1]),
            temperature: randFloat(profile.tempRange[0], profile.tempRange[1]),
            consciousness,
            oxygenDelivery: profile.o2,
            spO2Scale: profile.scale,
            weight: randFloat(profile.weight - 2, profile.weight + 1),
          },
        ));
      }
    }
  }

  return obs;
}

export const MOCK_OBSERVATIONS: Observation[] = generateObservations();
