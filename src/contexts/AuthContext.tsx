// ─── Auth Context ──────────────────────────────────────────────────
// Manages PIN-based authentication with in-memory CryptoKey.
// The key exists only while the user is authenticated — on lock or
// logout it is cleared, making IndexedDB data inaccessible.

import {
  createContext,
  useState,
  useCallback,
  useEffect,
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

// ─── Context Shape ─────────────────────────────────────────────────

export interface AuthContextValue {
  isAuthenticated: boolean;
  isSetup: boolean;
  isLocked: boolean;
  isLoading: boolean;
  ward: Ward | null;
  firstName: string;
  lastName: string;
  staffName: string;
  initials: string;
  cryptoKey: CryptoKey | null;

  setup: (
    ward: Ward,
    firstName: string,
    lastName: string,
    pin: string,
  ) => Promise<string>; // returns ward code
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
  lock: () => void;
  resetApp: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Helpers ───────────────────────────────────────────────────────

function extractInitials(first: string, last: string): string {
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}

function generateWardCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// ─── Provider ──────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSetup, setIsSetup] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [ward, setWard] = useState<Ward | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);

  const staffName = firstName && lastName ? `${firstName} ${lastName}` : '';
  const initials = firstName && lastName ? extractInitials(firstName, lastName) : '';

  // Check if app has been set up on mount
  useEffect(() => {
    (async () => {
      try {
        const authRecord = await db.auth.get('primary');
        if (authRecord) {
          setIsSetup(true);
          setFirstName(authRecord.firstName);
          setLastName(authRecord.lastName);
        }
      } catch {
        // DB not available yet — first run
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Auto-lock on inactivity
  const lock = useCallback(() => {
    if (!isAuthenticated) return;
    setCryptoKey(null);
    setWard(null);
    setIsAuthenticated(false);
    setIsLocked(true);
  }, [isAuthenticated]);

  useInactivity(INACTIVITY_TIMEOUT, lock, isAuthenticated);

  // ─── Setup (first run) ─────────────────────────────────────────

  const setup = useCallback(
    async (
      wardData: Ward,
      first: string,
      last: string,
      pin: string,
    ): Promise<string> => {
      const pinSalt = generateSalt();
      const keySalt = generateSalt();

      // Hash PIN for verification
      const pinHashValue = await hashPin(pin, pinSalt);

      // Derive encryption key
      const key = await deriveKey(pin, keySalt);

      // Generate ward code and update ward
      const wardCode = generateWardCode();
      const fullWard: Ward = { ...wardData, wardCode };

      // Encrypt ward data
      const encryptedWard = await encrypt(key, fullWard);

      // Store auth record
      const authRecord: AuthRecord = {
        id: 'primary',
        pinHash: pinHashValue,
        pinSalt: saltToBase64(pinSalt),
        keySalt: saltToBase64(keySalt),
        wardData: JSON.stringify(encryptedWard),
        firstName: first,
        lastName: last,
      };
      await db.auth.put(authRecord);

      // Request persistent storage
      if (navigator.storage?.persist) {
        await navigator.storage.persist();
      }

      // Set state
      setCryptoKey(key);
      setWard(fullWard);
      setFirstName(first);
      setLastName(last);
      setIsSetup(true);
      setIsAuthenticated(true);
      setIsLocked(false);

      // Audit log
      await writeAuditLog(key, 'login', `${first} ${last}`, 'Initial setup');

      return wardCode;
    },
    [],
  );

  // ─── Login (PIN entry) ─────────────────────────────────────────

  const login = useCallback(async (pin: string): Promise<boolean> => {
    const authRecord = await db.auth.get('primary');
    if (!authRecord) return false;

    // Verify PIN
    const pinSalt = saltFromBase64(authRecord.pinSalt);
    const pinHashValue = await hashPin(pin, pinSalt);
    if (pinHashValue !== authRecord.pinHash) return false;

    // Derive encryption key
    const keySalt = saltFromBase64(authRecord.keySalt);
    const key = await deriveKey(pin, keySalt);

    // Decrypt ward data
    const encryptedWard: EncryptedPayload = JSON.parse(authRecord.wardData);
    const wardData = await decrypt<Ward>(key, encryptedWard);

    // Set state
    setCryptoKey(key);
    setWard(wardData);
    setFirstName(authRecord.firstName);
    setLastName(authRecord.lastName);
    setIsAuthenticated(true);
    setIsLocked(false);

    // Audit log
    await writeAuditLog(
      key,
      'login',
      `${authRecord.firstName} ${authRecord.lastName}`,
    );

    return true;
  }, []);

  // ─── Logout ────────────────────────────────────────────────────

  const logout = useCallback(() => {
    setCryptoKey(null);
    setWard(null);
    setIsAuthenticated(false);
    setIsLocked(false);
    // isSetup stays true — user can log back in with PIN
  }, []);

  // ─── Reset App (delete all data) ──────────────────────────────

  const resetApp = useCallback(async () => {
    await db.delete();
    await db.open();
    setCryptoKey(null);
    setWard(null);
    setFirstName('');
    setLastName('');
    setIsAuthenticated(false);
    setIsSetup(false);
    setIsLocked(false);
  }, []);

  // ─── Context value ─────────────────────────────────────────────

  const value: AuthContextValue = {
    isAuthenticated,
    isSetup,
    isLocked,
    isLoading,
    ward,
    firstName,
    lastName,
    staffName,
    initials,
    cryptoKey,
    setup,
    login,
    logout,
    lock,
    resetApp,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export { AuthContext };
