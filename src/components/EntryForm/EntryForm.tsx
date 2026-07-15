import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { ConsciousnessLevel, Observation, OxygenDelivery, SpO2Scale } from '@/types';
import {
  calculateParameterScores,
  totalScore,
  hasAnyScoreOf3,
  determineRiskLevel,
  CLINICAL_RESPONSES,
} from '@/lib/scoring';
import { newId } from '@/lib/id';

interface Props {
  onSave: (observation: Observation) => void;
  staffName: string;
}

export default function EntryForm({ onSave, staffName }: Props) {
  const { id: patientId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [respirationRate, setRespirationRate] = useState('');
  const [spO2, setSpO2] = useState('');
  const [spO2Scale, setSpO2Scale] = useState<SpO2Scale>(1);
  const [oxygenDelivery, setOxygenDelivery] = useState<OxygenDelivery>('Air');
  const [systolicBP, setSystolicBP] = useState('');
  const [pulse, setPulse] = useState('');
  const [consciousness, setConsciousness] = useState<ConsciousnessLevel>('Alert');
  const [temperature, setTemperature] = useState('');

  const canScore =
    respirationRate && spO2 && systolicBP && pulse && temperature;

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
    if (!liveScores || liveTotal === null || !liveRisk || !patientId) return;

    const observation: Observation = {
      id: newId('o'),
      patientId,
      recordedAt: new Date().toISOString(),
      recordedBy: staffName,
      declined: false,
      respirationRate: Number(respirationRate),
      spO2: Number(spO2),
      spO2Scale,
      oxygenDelivery,
      systolicBP: Number(systolicBP),
      pulse: Number(pulse),
      consciousness,
      temperature: Number(temperature),
      scores: liveScores,
      totalScore: liveTotal,
      riskLevel: liveRisk,
    };

    onSave(observation);
    navigate(`/patients/${patientId}`);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-4 text-xl font-semibold tracking-tight text-[#0B1E36] sm:mb-6 sm:text-2xl">Record Observation</h2>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:space-y-5 sm:p-6">
        <p className="text-xs text-slate-400">
          Recording as: <span className="font-medium text-[#0B1E36]">{staffName}</span>
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField label="Respiration Rate (breaths/min)" value={respirationRate} onChange={setRespirationRate} />
          <NumberField label="SpO2 (%)" value={spO2} onChange={setSpO2} />

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">SpO2 Scale</label>
            <select
              value={spO2Scale}
              onChange={(e) => setSpO2Scale(Number(e.target.value) as SpO2Scale)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-base text-slate-800 outline-none transition-all focus:border-[#00AEEF] focus:bg-white focus:ring-1 focus:ring-[#00AEEF]"
            >
              <option value={1}>Scale 1</option>
              <option value={2}>Scale 2 (Hypercapnic)</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Air / Oxygen</label>
            <select
              value={oxygenDelivery}
              onChange={(e) => setOxygenDelivery(e.target.value as OxygenDelivery)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-base text-slate-800 outline-none transition-all focus:border-[#00AEEF] focus:bg-white focus:ring-1 focus:ring-[#00AEEF]"
            >
              <option value="Air">Air</option>
              <option value="Oxygen">Oxygen</option>
            </select>
          </div>

          <NumberField label="Systolic BP (mmHg)" value={systolicBP} onChange={setSystolicBP} />
          <NumberField label="Pulse (bpm)" value={pulse} onChange={setPulse} />

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Consciousness</label>
            <select
              value={consciousness}
              onChange={(e) => setConsciousness(e.target.value as ConsciousnessLevel)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-base text-slate-800 outline-none transition-all focus:border-[#00AEEF] focus:bg-white focus:ring-1 focus:ring-[#00AEEF]"
            >
              <option value="Alert">Alert</option>
              <option value="Confusion">Confusion</option>
              <option value="Voice">Voice</option>
              <option value="Pain">Pain</option>
              <option value="Unresponsive">Unresponsive</option>
            </select>
          </div>

          <NumberField label="Temperature (°C)" value={temperature} onChange={setTemperature} step="0.1" />
        </div>

        {clinicalResponse && (
          <div className={`rounded-2xl p-4 ${clinicalResponse.colour}`}>
            <p className="text-lg font-bold">NEWS2 Score: {liveTotal}</p>
            <p className="text-sm font-medium">{clinicalResponse.label} Risk</p>
            <p className="text-sm">{clinicalResponse.description}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-full bg-[#0B1E36] px-6 py-2.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/20"
          >
            Save Observation
          </button>
          <button
            type="button"
            onClick={() => navigate(`/patients/${patientId}`)}
            className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-500 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-500">{label}</label>
      <input
        type="number"
        required
        step={step}
        inputMode={step ? 'decimal' : 'numeric'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-base text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-[#00AEEF] focus:bg-white focus:ring-1 focus:ring-[#00AEEF]"
      />
    </div>
  );
}
