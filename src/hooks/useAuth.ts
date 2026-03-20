import { useState, useCallback } from 'react';
import type { AuthState, Ward } from '@/types';

const INITIAL_STATE: AuthState = {
  isAuthenticated: false,
  ward: null,
  firstName: '',
  lastName: '',
  staffName: '',
  initials: '',
};

function generateWardCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function extractInitials(firstName: string, lastName: string): string {
  return (
    (firstName.charAt(0) + lastName.charAt(0)).toUpperCase()
  );
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>(INITIAL_STATE);
  const [registeredWards, setRegisteredWards] = useState<Ward[]>([]);

  const signup = useCallback(
    (trustName: string, unitName: string, wardName: string, managerEmail: string, _password: string) => {
      const wardCode = generateWardCode();
      const ward: Ward = {
        id: `w${Date.now()}`,
        name: wardName,
        unitName,
        trustName,
        adminEmail: managerEmail,
        wardCode,
        subscriptionStatus: 'trial',
        cycleStartDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      setRegisteredWards((prev) => [...prev, ward]);
      return wardCode;
    },
    [],
  );

  const login = useCallback(
    (firstName: string, lastName: string, wardCode: string) => {
      // Look up ward by code, or use a default mock ward
      let ward = registeredWards.find((w) => w.wardCode === wardCode);
      if (!ward) {
        // Allow any 4-digit code for demo purposes
        ward = {
          id: 'w1',
          name: 'Ward A1',
          unitName: 'Acute Medicine',
          trustName: 'Example NHS Trust',
          adminEmail: 'admin@example.nhs.uk',
          wardCode,
          subscriptionStatus: 'trial',
          cycleStartDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
      }
      const initials = extractInitials(firstName, lastName);
      const staffName = `${firstName} ${lastName}`;
      setAuth({ isAuthenticated: true, ward, firstName, lastName, staffName, initials });
    },
    [registeredWards],
  );

  const logout = useCallback(() => {
    setAuth(INITIAL_STATE);
  }, []);

  return { ...auth, login, logout, signup };
}
