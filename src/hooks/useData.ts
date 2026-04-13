// ─── IndexedDB-Backed Data Hook ────────────────────────────────────
// Replaces the useState arrays in App.tsx. Uses useLiveQuery from
// dexie-react-hooks for reactive updates when IndexedDB changes.

import { useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAuth } from '@/hooks/useAuth';
import { patientRepo, observationRepo } from '@/lib/repositories';
import type { Patient, Observation } from '@/types';

export function useData() {
  const { cryptoKey, staffName } = useAuth();

  const patients = useLiveQuery(
    () => (cryptoKey ? patientRepo.getAll(cryptoKey) : []),
    [cryptoKey],
  ) ?? [];

  const observations = useLiveQuery(
    () => (cryptoKey ? observationRepo.getAll(cryptoKey) : []),
    [cryptoKey],
  ) ?? [];

  const addPatient = useCallback(
    async (patient: Patient) => {
      if (!cryptoKey) return;
      await patientRepo.create(cryptoKey, patient, staffName);
    },
    [cryptoKey, staffName],
  );

  const addObservation = useCallback(
    async (observation: Observation) => {
      if (!cryptoKey) return;
      await observationRepo.create(cryptoKey, observation, staffName);
    },
    [cryptoKey, staffName],
  );

  return { patients, observations, addPatient, addObservation };
}
