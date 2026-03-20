import type { ParameterScores, RiskLevel } from '@/types';
import { CLINICAL_RESPONSES } from '@/lib/scoring';

interface Props {
  scores: ParameterScores;
  totalScore: number;
  riskLevel: RiskLevel;
}

const PARAM_LABELS: Record<keyof ParameterScores, string> = {
  respirationRate: 'Respiration Rate',
  spO2: 'SpO2',
  oxygenDelivery: 'Air / Oxygen',
  systolicBP: 'Systolic BP',
  pulse: 'Pulse',
  consciousness: 'Consciousness',
  temperature: 'Temperature',
};

function scoreColour(score: number): string {
  if (score === 0) return 'bg-white border-slate-200';
  if (score === 1) return 'bg-[#FFF2AC] border-[#FFF2AC]';
  if (score === 2) return 'bg-[#FCC98A] border-[#FCC98A]';
  return 'bg-[#F69781] border-[#F69781]';
}

export default function ScoreDisplay({ scores, totalScore, riskLevel }: Props) {
  const response = CLINICAL_RESPONSES[riskLevel];

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:space-y-4 sm:p-6">
      <h3 className="text-base font-semibold text-[#0B1E36]">NEWS2 Score Breakdown</h3>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(Object.keys(scores) as (keyof ParameterScores)[]).map((key) => (
          <div
            key={key}
            className={`rounded-xl border p-3 text-center transition-all hover:-translate-y-0.5 ${scoreColour(scores[key])}`}
          >
            <p className="text-xs text-slate-500">{PARAM_LABELS[key]}</p>
            <p className="text-lg font-bold text-[#0B1E36] sm:text-xl">{scores[key]}</p>
          </div>
        ))}
      </div>

      <div className={`rounded-2xl p-4 ${response.colour}`}>
        <p className="text-xl font-bold sm:text-2xl">Total: {totalScore}</p>
        <p className="font-medium">{response.label} Risk</p>
        <p className="text-sm">{response.description}</p>
      </div>
    </div>
  );
}
