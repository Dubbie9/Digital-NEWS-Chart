import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Patient } from '@/types';
import { newId } from '@/lib/id';

interface Props {
  onAdd: (patient: Patient) => void;
}

export default function NewPatient({ onAdd }: Props) {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [dateOfAdmission, setDateOfAdmission] = useState(new Date().toISOString().slice(0, 10));
  const [roomNumber, setRoomNumber] = useState('');
  const [nhsNumber, setNhsNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patient: Patient = {
      id: newId('p'),
      firstName,
      lastName,
      dateOfBirth,
      dateOfAdmission,
      nhsNumber: nhsNumber || undefined,
      roomNumber: roomNumber || undefined,
      wardId: 'w1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onAdd(patient);
    navigate(`/patients/${patient.id}`);
  };

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-6 text-2xl font-semibold tracking-tight text-[#0B1E36]">New Patient</h2>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:space-y-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField id="firstName" label="First Name" value={firstName} onChange={setFirstName} required />
          <FormField id="lastName" label="Last Name" value={lastName} onChange={setLastName} required />
        </div>

        <FormField id="dob" label="Date of Birth" type="date" value={dateOfBirth} onChange={setDateOfBirth} required />
        <FormField id="doa" label="Date of Admission" type="date" value={dateOfAdmission} onChange={setDateOfAdmission} required />
        <FormField id="room" label="Room / Bed Number" value={roomNumber} onChange={setRoomNumber} placeholder="e.g. Bed 3" />
        <FormField id="nhs" label="NHS Number (optional)" value={nhsNumber} onChange={setNhsNumber} placeholder="e.g. 943 476 5919" />

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="rounded-full bg-[#0B1E36] px-6 py-2.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/20"
          >
            Add Patient
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-500 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function FormField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-slate-500">
        {label}
      </label>
      {/* autoComplete off: never let the browser store patient details;
          text-base (16px) stops iOS Safari's focus auto-zoom */}
      <input
        id={id}
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-base text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-[#00AEEF] focus:bg-white focus:ring-1 focus:ring-[#00AEEF]"
      />
    </div>
  );
}
