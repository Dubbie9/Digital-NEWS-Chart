import { Link } from 'react-router-dom';
import type { Patient } from '@/types';

interface Props {
  patients: Patient[];
}

export default function PatientList({ patients }: Props) {
  if (patients.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-[#0B1E36]">Patients</h1>
        <p className="text-slate-400">No patients yet.</p>
        <Link
          to="/patients/new"
          className="inline-flex items-center gap-2 rounded-full bg-[#0B1E36] px-5 py-2.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          + Add Patient
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0B1E36]">Patients</h1>
          <p className="mt-1 text-sm text-slate-400">All registered patients</p>
        </div>
        <Link
          to="/patients/new"
          className="group inline-flex items-center gap-2 rounded-full bg-[#0B1E36] px-5 py-2.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/20"
        >
          + Add Patient
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <ul className="divide-y divide-slate-100">
          {patients.map((patient) => (
            <li key={patient.id}>
              <Link
                to={`/patients/${patient.id}`}
                className="flex items-center justify-between px-4 py-3 transition hover:bg-slate-50 sm:px-6 sm:py-4"
              >
                <span className="text-sm font-medium text-[#0B1E36] transition hover:text-[#00AEEF]">
                  {patient.lastName}, {patient.firstName}
                </span>
                <div className="flex items-center gap-2 sm:gap-4">
                  <span className="hidden text-sm text-slate-400 sm:inline">
                    DOB: {patient.dateOfBirth}
                  </span>
                  <svg className="h-4 w-4 text-slate-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
