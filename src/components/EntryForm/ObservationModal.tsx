import { useState } from 'react';
import type { ConsciousnessLevel, Observation, OxygenDelivery, SpO2Scale } from '@/types';
import {
  calculateParameterScores,
  totalScore,
  hasAnyScoreOf3,
  determineRiskLevel,
  CLINICAL_RESPONSES,
} from '@/lib/scoring';

interface Props {
  patientId: string;
  patientName: string;
  staffName: string;
  onSave: (observation: Observation) => void;
  onClose: () => void;
}

export default function ObservationModal({ patientId, patientName, staffName, onSave, onClose }: Props) {
  const [temperature, setTemperature] = useState('');
  const [systolicBP, setSystolicBP] = useState('');
  const [diastolicBP, setDiastolicBP] = useState('');
  const [pulse, setPulse] = useState('');
  const [spO2, setSpO2] = useState('');
  const [spO2Scale, setSpO2Scale] = useState<SpO2Scale>(1);
  const [oxygenDelivery, setOxygenDelivery] = useState<OxygenDelivery>('Air');
  const [respirationRate, setRespirationRate] = useState('');
  const [consciousness, setConsciousness] = useState<ConsciousnessLevel>('Alert');
  const [weight, setWeight] = useState('');

  const canScore = temperature && systolicBP && pulse && spO2 && respirationRate;

  const liveScores = canScore
    ? calculateParameterScores(
        Number(respirationRate),
        Number(spO2),
        spO2Scale,
        oxygenDelivery,
        Number(systolicBP),
        Number(pulse),
        consciousness,
        Number(temperature),
      )
    : null;

  const liveTotal = liveScores ? totalScore(liveScores) : null;
  const liveRisk =
    liveScores && liveTotal !== null
      ? determineRiskLevel(liveTotal, hasAnyScoreOf3(liveScores))
      : null;
  const clinicalResponse = liveRisk ? CLINICAL_RESPONSES[liveRisk] : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveScores || liveTotal === null || !liveRisk) return;

    const observation: Observation = {
      id: `o${Date.now()}`,
      patientId,
      recordedAt: new Date().toISOString(),
      recordedBy: staffName,
      declined: false,
      respirationRate: Number(respirationRate),
      spO2: Number(spO2),
      spO2Scale,
      oxygenDelivery,
      systolicBP: Number(systolicBP),
      diastolicBP: diastolicBP ? Number(diastolicBP) : undefined,
      pulse: Number(pulse),
      consciousness,
      temperature: Number(temperature),
      weight: weight ? Number(weight) : undefined,
      scores: liveScores,
      totalScore: liveTotal,
      riskLevel: liveRisk,
    };

    onSave(observation);
    onClose();
  };

  const handleDeclined = () => {
    const observation: Observation = {
      id: `o${Date.now()}`,
      patientId,
      recordedAt: new Date().toISOString(),
      recordedBy: staffName,
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

    onSave(observation);
    onClose();
  };

  const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-[#00AEEF] focus:bg-white focus:ring-1 focus:ring-[#00AEEF]';
  const labelClass = 'mb-1.5 block text-xs font-medium text-slate-500';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="mx-0 w-full max-w-lg overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:mx-4 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00AEEF]/10 text-[#00AEEF]">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#0B1E36]">Record Observation</h2>
              <p className="text-xs text-slate-400">{patientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-h-[60vh] space-y-3 overflow-y-auto px-4 py-3 sm:max-h-[70vh] sm:space-y-4 sm:px-6 sm:py-4">
          <p className="text-xs text-slate-400">
            Recording as: <span className="font-medium text-[#0B1E36]">{staffName}</span>
          </p>

          {/* Temperature */}
          <div>
            <label className={labelClass}>Temperature (°C)</label>
            <input type="number" required step="0.1" value={temperature} onChange={(e) => setTemperature(e.target.value)} className={inputClass} />
          </div>

          {/* Blood Pressure */}
          <div>
            <label className={labelClass}>Blood Pressure (mmHg)</label>
            <div className="flex gap-2">
              <input type="number" required placeholder="Systolic" value={systolicBP} onChange={(e) => setSystolicBP(e.target.value)} className={inputClass} />
              <span className="flex items-center text-slate-300">/</span>
              <input type="number" placeholder="Diastolic" value={diastolicBP} onChange={(e) => setDiastolicBP(e.target.value)} className={inputClass} />
            </div>
          </div>

          {/* Pulse */}
          <div>
            <label className={labelClass}>Pulse (bpm)</label>
            <input type="number" required value={pulse} onChange={(e) => setPulse(e.target.value)} className={inputClass} />
          </div>

          {/* SpO2 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>SpO2 (%)</label>
              <input type="number" required value={spO2} onChange={(e) => setSpO2(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>SpO2 Scale</label>
              <select value={spO2Scale} onChange={(e) => setSpO2Scale(Number(e.target.value) as SpO2Scale)} className={inputClass}>
                <option value={1}>Scale 1</option>
                <option value={2}>Scale 2</option>
              </select>
            </div>
          </div>

          {/* Air / Oxygen */}
          <div>
            <label className={labelClass}>Air / Oxygen</label>
            <select value={oxygenDelivery} onChange={(e) => setOxygenDelivery(e.target.value as OxygenDelivery)} className={inputClass}>
              <option value="Air">Air</option>
              <option value="Oxygen">Oxygen</option>
            </select>
          </div>

          {/* Respiration */}
          <div>
            <label className={labelClass}>Respiration Rate (breaths/min)</label>
            <input type="number" required value={respirationRate} onChange={(e) => setRespirationRate(e.target.value)} className={inputClass} />
          </div>

          {/* Consciousness */}
          <div>
            <label className={labelClass}>Consciousness</label>
            <select value={consciousness} onChange={(e) => setConsciousness(e.target.value as ConsciousnessLevel)} className={inputClass}>
              <option value="Alert">Alert</option>
              <option value="Confusion">Confusion</option>
              <option value="Voice">Voice</option>
              <option value="Pain">Pain</option>
              <option value="Unresponsive">Unresponsive</option>
            </select>
          </div>

          {/* Weight */}
          <div>
            <label className={labelClass}>Weight (kg)</label>
            <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} className={inputClass} />
          </div>

          {/* Live score */}
          {clinicalResponse && (
            <div className={`rounded-2xl p-4 ${clinicalResponse.colour}`}>
              <p className="text-base font-bold">NEWS2 Score: {liveTotal}</p>
              <p className="text-sm font-medium">{clinicalResponse.label} Risk</p>
              <p className="text-xs">{clinicalResponse.description}</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 sm:px-6 sm:py-4">
          <button
            type="button"
            onClick={handleDeclined}
            className="rounded-full bg-red-500 px-5 py-2 text-xs font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-red-600 hover:shadow-md"
          >
            Declined
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-5 py-2 text-xs font-medium text-slate-500 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="rounded-full bg-[#0B1E36] px-5 py-2 text-xs font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/20"
            >
              Save Observation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
