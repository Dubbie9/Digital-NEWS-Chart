// ─── Encryption Module ─────────────────────────────────────────────
// AES-GCM-256 encryption with PBKDF2 key derivation.
// All sensitive data is encrypted before IndexedDB storage.
// The CryptoKey is held in-memory only during an authenticated session.

const PBKDF2_ITERATIONS = 600_000;
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;

export interface EncryptedPayload {
  iv: string;         // base64-encoded 12-byte IV
  ciphertext: string; // base64-encoded ciphertext
}

// ─── Helpers ───────────────────────────────────────────────────────

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ─── Salt Generation ───────────────────────────────────────────────

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

export function saltToBase64(salt: Uint8Array): string {
  return toBase64(salt.buffer);
}

export function saltFromBase64(base64: string): Uint8Array {
  return fromBase64(base64);
}

// ─── Key Derivation ────────────────────────────────────────────────

export async function deriveKey(
  pin: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  );
}

// ─── PIN Hashing (for verification, separate from encryption key) ──

export async function hashPin(
  pin: string,
  salt: Uint8Array,
): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH,
  );

  return toBase64(bits);
}

// ─── Encryption ────────────────────────────────────────────────────

export async function encrypt(
  key: CryptoKey,
  data: unknown,
): Promise<EncryptedPayload> {
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(data));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext,
  );

  return {
    iv: toBase64(iv.buffer),
    ciphertext: toBase64(ciphertext),
  };
}

// ─── Decryption ────────────────────────────────────────────────────

export async function decrypt<T>(
  key: CryptoKey,
  payload: EncryptedPayload,
): Promise<T> {
  const iv = fromBase64(payload.iv);
  const ciphertext = fromBase64(payload.ciphertext);

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext,
  );

  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(plaintext)) as T;
}
