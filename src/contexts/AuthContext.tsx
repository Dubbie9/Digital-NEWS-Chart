// ─── Auth Context ──────────────────────────────────────────────────
// Two-layer auth: (1) Ward PIN unlocks encryption, (2) Staff name login.
// Staff can sign out (back to name entry) without locking the ward.
// Auto-lock after inactivity re-locks the ward (requires PIN again).

import {
  createContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { db, type AuthRecord } from '@/lib/db';
import {
  deriveKey,
  hashPin,
  encrypt,
  decrypt,
  generateSalt,
  saltToBase64,
  saltFromBase64,
  type EncryptedPayload,
} from '@/lib/crypto';
import { writeAuditLog } from '@/lib/audit';
import { useInactivity } from '@/hooks/useInactivity';
import type { Ward } from '@/types';

// ─── Recent Staff (localStorage, not sensitive) ────────────────────

interface RecentStaff {
  firstName: string;
  lastName: string;
}

const RECENT_STAFF_KEY = 'news2_recent_staff';
const MAX_RECENT = 5;

function loadRecentStaff(): RecentStaff[] {
  try {
    const raw = localStorage.getItem(RECENT_STAFF_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentStaff(staff: RecentStaff[]) {
  localStorage.setItem(RECENT_STAFF_KEY, JSON.stringify(staff));
}

function addToRecentStaff(first: string, last: string) {
  const recent = loadRecentStaff().filter(
    (s) => !(s.firstName.toLowerCase() === first.toLowerCase() && s.lastName.toLowerCase() === last.toLowerCase()),
  );
  recent.unshift({ firstName: first, lastName: last });
  saveRecentStaff(recent.slice(0, MAX_RECENT));
}

// ─── Context Shape ─────────────────────────────────────────────────

export interface UnlockResult {
  ok: boolean;
  /** Set when PIN entry is temporarily locked out after repeated failures */
  retryAfterSeconds?: number;
}

export interface AuthContextValue {
  // Ward-level state
  isSetup: boolean;      // ward has been set up with PIN
  isWardUnlocked: boolean; // PIN entered, encryption key available
  isLocked: boolean;     // auto-locked (needs PIN again)
  isLoading: boolean;

  // Staff-level state
  isAuthenticated: boolean; // staff has logged in with name
  firstName: string;
  lastName: string;
  staffName: string;
  initials: string;

  // Ward info
  ward: Ward | null;
  hospitalName: string;
  wardDisplayName: string;
  cryptoKey: CryptoKey | null;

  // Recent staff for quick login
  recentStaff: RecentStaff[];

  // Actions
  setup: (hospitalName: string, wardName: string, pin: string) => Promise<void>;
  unlockWard: (pin: string) => Promise<UnlockResult>;
  staffLogin: (firstName: string, lastName: string) => void;
  staffLogout: () => void;  // back to staff name entry, ward stays unlocked
  lock: () => void;         // auto-lock: clears key, needs PIN
  resetApp: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Helpers ───────────────────────────────────────────────────────

function extractInitials(first: string, last: string): string {
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// PIN brute-force protection: after MAX_FREE_ATTEMPTS consecutive failures,
// PIN entry locks out with an exponentially growing delay.
const MAX_FREE_ATTEMPTS = 5;
const BASE_LOCKOUT_MS = 30 * 1000;
const MAX_LOCKOUT_MS = 5 * 60 * 1000;

// ─── Provider ──────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSetup, setIsSetup] = useState(false);
  const [isWardUnlocked, setIsWardUnlocked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [ward, setWard] = useState<Ward | null>(null);
  const [hospitalName, setHospitalName] = useState('');
  const [wardDisplayName, setWardDisplayName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [recentStaff, setRecentStaff] = useState<RecentStaff[]>([]);

  const staffName = firstName && lastName ? `${firstName} ${lastName}` : '';
  const initials = firstName && lastName ? extractInitials(firstName, lastName) : '';

  // Check if app has been set up on mount
  useEffect(() => {
    (async () => {
      try {
        const authRecord = await db.auth.get('primary');
        if (authRecord) {
          setIsSetup(true);
          setHospitalName(authRecord.hospitalName);
          setWardDisplayName(authRecord.wardName);
        }
      } catch {
        // DB not available yet — first run
      } finally {
        setIsLoading(false);
      }
    })();
    setRecentStaff(loadRecentStaff());
  }, []);

  // Auto-lock on inactivity — keeps staff name, just locks encryption
  const lock = useCallback(() => {
    if (!isWardUnlocked) return;
    setCryptoKey(null);
    setWard(null);
    setIsWardUnlocked(false);
    setIsLocked(true);
    // Keep firstName, lastName, isAuthenticated intact so after
    // PIN re-entry the staff is immediately back in their session
  }, [isWardUnlocked]);

  useInactivity(INACTIVITY_TIMEOUT, lock, isWardUnlocked);

  // ─── Setup (first run) ─────────────────────────────────────────

  const setup = useCallback(
    async (hospital: string, wardName: string, pin: string): Promise<void> => {
      const pinSalt = generateSalt();
      const keySalt = generateSalt();

      const pinHashValue = await hashPin(pin, pinSalt);
      const key = await deriveKey(pin, keySalt);

      const wardData: Ward = {
        id: `w${Date.now()}`,
        name: wardName,
        unitName: '',
        trustName: hospital,
        adminEmail: '',
        wardCode: '',
        subscriptionStatus: 'trial',
        cycleStartDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      const encryptedWard = await encrypt(key, wardData);

      const authRecord: AuthRecord = {
        id: 'primary',
        pinHash: pinHashValue,
        pinSalt: saltToBase64(pinSalt),
        keySalt: saltToBase64(keySalt),
        wardData: JSON.stringify(encryptedWard),
        hospitalName: hospital,
        wardName: wardName,
      };
      await db.auth.put(authRecord);

      if (navigator.storage?.persist) {
        await navigator.storage.persist();
      }

      setCryptoKey(key);
      setWard(wardData);
      setHospitalName(hospital);
      setWardDisplayName(wardName);
      setIsSetup(true);
      setIsWardUnlocked(true);
      setIsLocked(false);
      // Staff not yet logged in — they'll enter name next
    },
    [],
  );

  // ─── Unlock Ward (PIN entry) ───────────────────────────────────

  const unlockWard = useCallback(async (pin: string): Promise<UnlockResult> => {
    const authRecord = await db.auth.get('primary');
    if (!authRecord) return { ok: false };

    // Enforce lockout window from previous failed attempts
    const lockedUntil = authRecord.lockUntil ? Date.parse(authRecord.lockUntil) : 0;
    if (Date.now() < lockedUntil) {
      return {
        ok: false,
        retryAfterSeconds: Math.ceil((lockedUntil - Date.now()) / 1000),
      };
    }

    const pinSalt = saltFromBase64(authRecord.pinSalt);
    const pinHashValue = await hashPin(pin, pinSalt);
    if (pinHashValue !== authRecord.pinHash) {
      const failedAttempts = (authRecord.failedAttempts ?? 0) + 1;
      let retryAfterSeconds: number | undefined;
      let lockUntil = '';
      if (failedAttempts >= MAX_FREE_ATTEMPTS) {
        const lockMs = Math.min(
          BASE_LOCKOUT_MS * 2 ** (failedAttempts - MAX_FREE_ATTEMPTS),
          MAX_LOCKOUT_MS,
        );
        lockUntil = new Date(Date.now() + lockMs).toISOString();
        retryAfterSeconds = Math.ceil(lockMs / 1000);
      }
      await db.auth.update('primary', { failedAttempts, lockUntil });
      return { ok: false, retryAfterSeconds };
    }

    // Correct PIN — reset the failure counter
    await db.auth.update('primary', { failedAttempts: 0, lockUntil: '' });

    const keySalt = saltFromBase64(authRecord.keySalt);
    const key = await deriveKey(pin, keySalt);

    const encryptedWard: EncryptedPayload = JSON.parse(authRecord.wardData);
    const wardData = await decrypt<Ward>(key, encryptedWard);

    setCryptoKey(key);
    setWard(wardData);
    setHospitalName(authRecord.hospitalName);
    setWardDisplayName(authRecord.wardName);
    setIsWardUnlocked(true);
    setIsLocked(false);

    // If staff was already logged in before lock, restore their session
    if (firstName && lastName) {
      setIsAuthenticated(true);
    }

    return { ok: true };
  }, [firstName, lastName]);

  // ─── Staff Login (name only) ───────────────────────────────────

  const staffLogin = useCallback((first: string, last: string) => {
    setFirstName(first);
    setLastName(last);
    setIsAuthenticated(true);
    addToRecentStaff(first, last);
    setRecentStaff(loadRecentStaff());

    // Audit log
    if (cryptoKey) {
      writeAuditLog(cryptoKey, 'login', `${first} ${last}`);
    }
  }, [cryptoKey]);

  // ─── Staff Logout (back to name entry, ward stays unlocked) ────

  const staffLogout = useCallback(() => {
    if (cryptoKey) {
      writeAuditLog(cryptoKey, 'logout', staffName);
    }
    setFirstName('');
    setLastName('');
    setIsAuthenticated(false);
    // Ward stays unlocked — next staff member can log in without PIN
  }, [cryptoKey, staffName]);

  // ─── Reset App (delete all data) ──────────────────────────────

  const resetApp = useCallback(async () => {
    await db.delete();
    await db.open();
    localStorage.removeItem(RECENT_STAFF_KEY);
    setCryptoKey(null);
    setWard(null);
    setFirstName('');
    setLastName('');
    setHospitalName('');
    setWardDisplayName('');
    setIsAuthenticated(false);
    setIsWardUnlocked(false);
    setIsSetup(false);
    setIsLocked(false);
    setRecentStaff([]);
  }, []);

  // ─── Context value ─────────────────────────────────────────────

  const value: AuthContextValue = useMemo(() => ({
    isSetup,
    isWardUnlocked,
    isAuthenticated,
    isLocked,
    isLoading,
    ward,
    hospitalName,
    wardDisplayName,
    firstName,
    lastName,
    staffName,
    initials,
    cryptoKey,
    recentStaff,
    setup,
    unlockWard,
    staffLogin,
    staffLogout,
    lock,
    resetApp,
  }), [
    isSetup, isWardUnlocked, isAuthenticated, isLocked, isLoading,
    ward, hospitalName, wardDisplayName, firstName, lastName,
    staffName, initials, cryptoKey, recentStaff,
    setup, unlockWard, staffLogin, staffLogout, lock, resetApp,
  ]);

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export { AuthContext };
