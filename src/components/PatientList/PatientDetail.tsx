import { useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Patient, Observation } from '@/types';
import ScoreDisplay from '@/components/ScoreDisplay/ScoreDisplay';
import NEWS2VisualChart, { type ChartDisplayMode } from '@/components/Chart/NEWS2VisualChart';
import Chart from '@/components/Chart/Chart';
import ObservationHistory from '@/components/Chart/ObservationHistory';
import { exportPatientObservations } from '@/lib/exportCsv';
import { exportChartAsPDF } from '@/lib/pdf';
import { useAuth } from '@/hooks/useAuth';
import ObservationModal from '@/components/EntryForm/ObservationModal';

interface Props {
  patients: Patient[];
  observations: Observation[];
  staffName: string;
  onAddObservation: (observation: Observation) => void;
}

type TabId = 'chart' | 'table' | 'history';

const TABS: { id: TabId; label: string }[] = [
  { id: 'chart', label: 'NEWS2 Chart' },
  { id: 'table', label: 'Data Table' },
  { id: 'history', label: 'History' },
];

function getMonthLabel(year: number, month: number): string {
  return new Date(year, month).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export default function PatientDetail({ patients, observations, staffName, onAddObservation }: Props) {
  const { id } = useParams<{ id: string }>();
  const { ward } = useAuth();
  const chartRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabId>('chart');
  const [showObsModal, setShowObsModal] = useState(false);
  const [chartMode, setChartMode] = useState<ChartDisplayMode>('dots');
  const now = new Date();
  const [chartYear, setChartYear] = useState(now.getFullYear());
  const [chartMonth, setChartMonth] = useState(now.getMonth());
  const patient = patients.find((p) => p.id === id);

  if (!patient) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-[#0B1E36]">Patient Not Found</h1>
        <Link to="/patients" className="text-[#00AEEF] transition hover:underline">
          Back to patients
        </Link>
      </div>
    );
  }

  const patientObs = observations
    .filter((o) => o.patientId === patient.id)
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

  const latestObs = patientObs[patientObs.length - 1];

  // Get all months that have observations
  const availableMonths = Array.from(
    new Set(patientObs.map((o) => {
      const d = new Date(o.recordedAt);
      return `${d.getFullYear()}-${d.getMonth()}`;
    })),
  ).map((key) => {
    const [y, m] = key.split('-').map(Number);
    return { year: y, month: m };
  }).sort((a, b) => a.year - b.year || a.month - b.month);

  const goToPrevMonth = () => {
    if (chartMonth === 0) {
      setChartMonth(11);
      setChartYear(chartYear - 1);
    } else {
      setChartMonth(chartMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (chartMonth === 11) {
      setChartMonth(0);
      setChartYear(chartYear + 1);
    } else {
      setChartMonth(chartMonth + 1);
    }
  };

  const isCurrentMonth = chartYear === now.getFullYear() && chartMonth === now.getMonth();

  return (
    <div className="space-y-6">
      {/* Patient header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#0B1E36] sm:text-2xl">
            {patient.lastName}, {patient.firstName}
          </h1>
          <p className="mt-0.5 text-xs text-slate-400 sm:mt-1 sm:text-sm">
            DOB: {patient.dateOfBirth}
            {patient.nhsNumber && <span className="ml-3 sm:ml-4">NHS: {patient.nhsNumber}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => exportPatientObservations(patient, patientObs)}
            className="group inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm"
          >
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
              <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
            </svg>
            Excel
          </button>
          <button
            onClick={() => exportChartAsPDF('news-chart', patient, ward?.name || 'Unknown Ward')}
            className="group inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm"
          >
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.59L7.47 9.56a.75.75 0 00-1.06 1.06l3.25 3.25a.75.75 0 001.06 0l3.25-3.25a.75.75 0 10-1.06-1.06l-1.78 1.78V6.75z" clipRule="evenodd" />
            </svg>
            PDF
          </button>
          <button
            onClick={() => setShowObsModal(true)}
            className="group inline-flex items-center gap-1.5 rounded-full bg-[#00AEEF] px-3 py-2 text-xs font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#00AEEF]/20 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm"
          >
            + Record Obs
          </button>
        </div>
      </div>

      {/* Latest score */}
      {latestObs && (
        <ScoreDisplay
          scores={latestObs.scores}
          totalScore={latestObs.totalScore}
          riskLevel={latestObs.riskLevel}
        />
      )}

      {/* Tabs */}
      <div className="flex flex-col gap-2 border-b border-slate-200 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
        <nav className="-mb-px flex overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-t-lg px-3 py-2 text-xs font-medium transition sm:px-4 sm:py-2.5 sm:text-sm ${
                activeTab === tab.id
                  ? 'border-b-2 border-[#00AEEF] text-[#00AEEF]'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Dots / Numbers toggle */}
        {activeTab === 'chart' && (
          <div className="mb-2 flex items-center gap-0.5 self-start rounded-full border border-slate-200 bg-slate-50 p-0.5 text-xs sm:mb-0 sm:self-auto">
            <button
              onClick={() => setChartMode('dots')}
              className={`rounded-full px-2.5 py-1 font-medium transition sm:px-3 sm:py-1.5 ${
                chartMode === 'dots'
                  ? 'bg-[#0B1E36] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Dots
            </button>
            <button
              onClick={() => setChartMode('numbers')}
              className={`rounded-full px-2.5 py-1 font-medium transition sm:px-3 sm:py-1.5 ${
                chartMode === 'numbers'
                  ? 'bg-[#0B1E36] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Numbers
            </button>
          </div>
        )}
      </div>

      {/* Tab content */}
      {activeTab === 'chart' && (
        <>
          {/* Month navigation */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:px-4">
            <button
              onClick={goToPrevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
              </svg>
            </button>

            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-[#0B1E36]">
                {getMonthLabel(chartYear, chartMonth)}
              </h3>
              {!isCurrentMonth && (
                <button
                  onClick={() => { setChartYear(now.getFullYear()); setChartMonth(now.getMonth()); }}
                  className="rounded-full bg-[#00AEEF]/10 px-2.5 py-0.5 text-[10px] font-medium text-[#00AEEF] transition hover:bg-[#00AEEF]/20"
                >
                  Current
                </button>
              )}
            </div>

            <button
              onClick={goToNextMonth}
              disabled={isCurrentMonth}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Available months quick picker */}
          {availableMonths.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {availableMonths.map(({ year: y, month: m }) => (
                <button
                  key={`${y}-${m}`}
                  onClick={() => { setChartYear(y); setChartMonth(m); }}
                  className={`rounded-full px-3 py-1 text-[10px] font-medium transition ${
                    chartYear === y && chartMonth === m
                      ? 'bg-[#0B1E36] text-white'
                      : 'border border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {new Date(y, m).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}
                </button>
              ))}
            </div>
          )}

          <NEWS2VisualChart
            ref={chartRef}
            id="news-chart"
            observations={patientObs}
            displayMode={chartMode}
            year={chartYear}
            month={chartMonth}
          />
        </>
      )}
      {activeTab === 'table' && (
        <Chart
          observations={patientObs}
          patientName={`${patient.firstName} ${patient.lastName}`}
        />
      )}
      {activeTab === 'history' && <ObservationHistory observations={patientObs} />}

      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-[#00AEEF] transition hover:underline">
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
        </svg>
        Back to dashboard
      </Link>

      {/* Observation modal */}
      {showObsModal && (
        <ObservationModal
          patientId={patient.id}
          patientName={`${patient.lastName}, ${patient.firstName}`}
          staffName={staffName}
          onSave={onAddObservation}
          onClose={() => setShowObsModal(false)}
        />
      )}
    </div>
  );
}
