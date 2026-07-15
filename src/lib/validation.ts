// ─── Zod Validation Schemas ────────────────────────────────────────
// Mirrors existing TypeScript interfaces exactly. Validates data
// before encryption/storage to ensure data integrity.

import { z } from 'zod';

export const WardSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  unitName: z.string().min(1),
  trustName: z.string().min(1),
  adminEmail: z.string().email(),
  wardCode: z.string().regex(/^\d{4}$/),
  subscriptionStatus: z.enum(['active', 'inactive', 'trial']),
  cycleStartDate: z.string(),
  createdAt: z.string(),
});

export const PatientSchema = z.object({
  id: z.string().min(1),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string(),
  dateOfAdmission: z.string(),
  nhsNumber: z.string().optional(),
  roomNumber: z.string().optional(),
  wardId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ParameterScoresSchema = z.object({
  respirationRate: z.number(),
  spO2: z.number(),
  oxygenDelivery: z.number(),
  systolicBP: z.number(),
  pulse: z.number(),
  consciousness: z.number(),
  temperature: z.number(),
});

export const ObservationSchema = z.object({
  id: z.string().min(1),
  patientId: z.string(),
  recordedAt: z.string(),
  recordedBy: z.string(),
  declined: z.boolean(),
  respirationRate: z.number(),
  spO2: z.number(),
  spO2Scale: z.union([z.literal(1), z.literal(2)]),
  oxygenDelivery: z.enum(['Air', 'Oxygen']),
  systolicBP: z.number(),
  diastolicBP: z.number().optional(),
  pulse: z.number(),
  consciousness: z.enum(['Alert', 'Confusion', 'Voice', 'Pain', 'Unresponsive']),
  temperature: z.number(),
  weight: z.number().optional(),
  scores: ParameterScoresSchema,
  totalScore: z.number(),
  riskLevel: z.enum(['low', 'low-medium', 'medium', 'high']),
});

export const AuditLogSchema = z.object({
  id: z.string().min(1),
  timestamp: z.string(),
  action: z.enum([
    'login',
    'logout',
    'create_patient',
    'update_patient',
    'delete_patient',
    'create_observation',
    'view_patient',
    'export_data',
    'import_data',
  ]),
  staffName: z.string(),
  details: z.string().optional(),
});

export type AuditAction = z.infer<typeof AuditLogSchema>['action'];
