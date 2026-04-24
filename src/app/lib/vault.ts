import { analyzePasswordStrength } from './password-tools';
import { analyzeServiceRisk } from './phishing';

export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface EntryHistoryEvent {
  id: string;
  action: string;
  at: string;
}

export interface VaultEntry {
  id: string;
  service: string;
  username: string;
  password: string;
  url: string;
  category: string;
  tags: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string | null;
  passwordScore: number;
  entropyBits: number;
  crackTimeLabel: string;
  passwordWarnings: string[];
  domainWarnings: string[];
  history: EntryHistoryEvent[];
}

export interface AuditEvent {
  id: string;
  type: string;
  message: string;
  severity: AuditSeverity;
  at: string;
}

export interface VaultSnapshot {
  entries: VaultEntry[];
  auditTrail: AuditEvent[];
  preferences: {
    language: 'fr' | 'en';
  };
}

export interface AuthRecord {
  version: number;
  username: string;
  profileName: string;
  createdAt: string;
  verifierSalt: string;
  verifierHash: string;
  encryptionSalt: string;
  failedAttempts: number;
  totalFailedAttempts: number;
  lockUntil: number | null;
}

export interface UserSummary {
  username: string;
  profileName: string;
  createdAt: string;
}

interface StoredVaultPayload {
  version: number;
  iv: string;
  ciphertext: string;
}

interface LegacyEntry {
  id: string;
  service: string;
  username: string;
  password: string;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const PBKDF2_ITERATIONS = 250_000;

export const SESSION_TIMEOUT_MS = 3 * 60 * 60 * 1000;
export const SESSION_WARNING_MS = 5 * 60 * 1000;

export const USERS_LIST_KEY = 'msp.users';

const LEGACY_KEYS = {
  auth: 'msp.auth',
  vault: 'msp.vault',
  legacyEntries: 'vaultEntries',
  legacyUnlock: 'isUnlocked',
};

export function normalizeUsername(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 40) || 'user';
}

function getUserAuthKey(username: string) {
  return `msp.auth.${username}`;
}

function getUserVaultKey(username: string) {
  return `msp.vault.${username}`;
}

function bytesToBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function createRandomBase64(size: number) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytesToBase64(bytes);
}

function buildId() {
  return crypto.randomUUID();
}

export function nowIso() {
  return new Date().toISOString();
}

function lockDurationForFailures(failedAttempts: number) {
  if (failedAttempts >= 10) return 24 * 60 * 60 * 1000;
  if (failedAttempts >= 5) return 60 * 60 * 1000;
  if (failedAttempts >= 3) return 15 * 60 * 1000;
  return 0;
}

export function getLockDurationMs(failedAttempts: number) {
  return lockDurationForFailures(failedAttempts);
}

async function getPasswordMaterial(password: string) {
  return crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits', 'deriveKey']);
}

export async function deriveVerifierHash(password: string, salt: string) {
  const material = await getPasswordMaterial(password);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: base64ToBytes(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    material,
    256
  );
  return bytesToBase64(new Uint8Array(bits));
}

export async function deriveEncryptionKey(password: string, salt: string) {
  const material = await getPasswordMaterial(password);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: base64ToBytes(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function createAuthRecord(username: string, profileName: string, password: string): Promise<AuthRecord> {
  const verifierSalt = createRandomBase64(16);
  const encryptionSalt = createRandomBase64(16);
  return {
    version: 1,
    username,
    profileName,
    createdAt: nowIso(),
    verifierSalt,
    verifierHash: await deriveVerifierHash(password, verifierSalt),
    encryptionSalt,
    failedAttempts: 0,
    totalFailedAttempts: 0,
    lockUntil: null,
  };
}

export async function encryptSnapshot(snapshot: VaultSnapshot, key: CryptoKey): Promise<StoredVaultPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(JSON.stringify(snapshot))
  );
  return { version: 1, iv: bytesToBase64(iv), ciphertext: bytesToBase64(new Uint8Array(ciphertext)) };
}

export async function decryptSnapshot(payload: StoredVaultPayload, key: CryptoKey): Promise<VaultSnapshot> {
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(payload.iv) },
    key,
    base64ToBytes(payload.ciphertext)
  );
  return JSON.parse(decoder.decode(decrypted)) as VaultSnapshot;
}

export function loadUserList(): UserSummary[] {
  const raw = localStorage.getItem(USERS_LIST_KEY);
  if (raw) {
    try { return JSON.parse(raw) as UserSummary[]; } catch { return []; }
  }

  const legacyRaw = localStorage.getItem(LEGACY_KEYS.auth);
  if (legacyRaw) {
    try {
      const auth = JSON.parse(legacyRaw) as Partial<AuthRecord>;
      const profileName = auth.profileName || 'Utilisateur';
      const username = auth.username || normalizeUsername(profileName);
      const createdAt = auth.createdAt || nowIso();
      const summary: UserSummary = { username, profileName, createdAt };
      const migrated = [summary];
      localStorage.setItem(USERS_LIST_KEY, JSON.stringify(migrated));
      const authWithUsername = { ...auth, username };
      localStorage.setItem(getUserAuthKey(username), JSON.stringify(authWithUsername));
      const legacyVault = localStorage.getItem(LEGACY_KEYS.vault);
      if (legacyVault) localStorage.setItem(getUserVaultKey(username), legacyVault);
      localStorage.removeItem(LEGACY_KEYS.auth);
      localStorage.removeItem(LEGACY_KEYS.vault);
      return migrated;
    } catch { return []; }
  }

  return [];
}

export function saveUserList(users: UserSummary[]) {
  localStorage.setItem(USERS_LIST_KEY, JSON.stringify(users));
}

export function addUserToList(username: string, profileName: string, createdAt: string) {
  const users = loadUserList();
  if (!users.find((u) => u.username === username)) {
    users.push({ username, profileName, createdAt });
    saveUserList(users);
  }
  return users;
}

export function removeUserFromList(username: string) {
  const users = loadUserList().filter((u) => u.username !== username);
  saveUserList(users);
  localStorage.removeItem(getUserAuthKey(username));
  localStorage.removeItem(getUserVaultKey(username));
  return users;
}

export function loadAuthRecord(username: string): AuthRecord | null {
  const raw = localStorage.getItem(getUserAuthKey(username));
  return raw ? (JSON.parse(raw) as AuthRecord) : null;
}

export function saveAuthRecord(auth: AuthRecord, username: string) {
  localStorage.setItem(getUserAuthKey(username), JSON.stringify(auth));
}

export function loadStoredVault(username: string): StoredVaultPayload | null {
  const raw = localStorage.getItem(getUserVaultKey(username));
  return raw ? (JSON.parse(raw) as StoredVaultPayload) : null;
}

export function saveStoredVault(payload: StoredVaultPayload, username: string) {
  localStorage.setItem(getUserVaultKey(username), JSON.stringify(payload));
}

export function createAuditEvent(type: string, message: string, severity: AuditSeverity = 'info'): AuditEvent {
  return { id: buildId(), type, message, severity, at: nowIso() };
}

export function createEntryFromInput(input: {
  service: string;
  username: string;
  password: string;
  url?: string;
  category?: string;
  tags?: string[];
  notes?: string;
}): VaultEntry {
  const createdAt = nowIso();
  const passwordAnalysis = analyzePasswordStrength(input.password);
  const riskAnalysis = analyzeServiceRisk(input.service, input.url);
  return {
    id: buildId(),
    service: input.service.trim(),
    username: input.username.trim(),
    password: input.password,
    url: input.url?.trim() || '',
    category: input.category?.trim() || 'Personnel',
    tags: [...new Set((input.tags || []).map((tag) => tag.trim()).filter(Boolean))],
    notes: input.notes?.trim() || '',
    createdAt,
    updatedAt: createdAt,
    lastAccessedAt: null,
    passwordScore: passwordAnalysis.score,
    entropyBits: passwordAnalysis.entropyBits,
    crackTimeLabel: passwordAnalysis.crackTimeLabel,
    passwordWarnings: passwordAnalysis.warnings,
    domainWarnings: riskAnalysis.warnings,
    history: [{ id: buildId(), action: 'Entrée créée', at: createdAt }],
  };
}

export function updateEntryWithAnalysis(entry: VaultEntry, updates: Partial<VaultEntry>, actionLabel: string) {
  const password = updates.password ?? entry.password;
  const service = updates.service ?? entry.service;
  const url = updates.url ?? entry.url;
  const passwordAnalysis = analyzePasswordStrength(password);
  const riskAnalysis = analyzeServiceRisk(service, url);
  return {
    ...entry,
    ...updates,
    updatedAt: nowIso(),
    passwordScore: passwordAnalysis.score,
    entropyBits: passwordAnalysis.entropyBits,
    crackTimeLabel: passwordAnalysis.crackTimeLabel,
    passwordWarnings: passwordAnalysis.warnings,
    domainWarnings: riskAnalysis.warnings,
    history: [
      { id: buildId(), action: actionLabel, at: nowIso() },
      ...entry.history,
    ].slice(0, 12),
  };
}

export function createEmptySnapshot(): VaultSnapshot {
  return { entries: [], auditTrail: [], preferences: { language: 'fr' } };
}

export function createSeedEntries() {
  const raw = localStorage.getItem(LEGACY_KEYS.legacyEntries);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as LegacyEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e) => e.service && e.password)
      .map((e) => createEntryFromInput({ service: e.service, username: e.username, password: e.password }));
  } catch { return []; }
}

export function clearLegacyStorage() {
  localStorage.removeItem(LEGACY_KEYS.legacyEntries);
  localStorage.removeItem(LEGACY_KEYS.legacyUnlock);
}

export function registerFailedAttempt(auth: AuthRecord) {
  const failedAttempts = auth.failedAttempts + 1;
  const lockDuration = lockDurationForFailures(failedAttempts);
  return {
    ...auth,
    failedAttempts,
    totalFailedAttempts: auth.totalFailedAttempts + 1,
    lockUntil: lockDuration ? Date.now() + lockDuration : null,
  };
}

export function resetFailedAttempts(auth: AuthRecord) {
  return { ...auth, failedAttempts: 0, lockUntil: null };
}

export function getSecuritySummary(entries: VaultEntry[]) {
  const weakEntries = entries.filter((entry) => entry.passwordScore < 60);
  const suspiciousEntries = entries.filter((entry) => entry.domainWarnings.length > 0);
  const passwordUsage = new Map<string, number>();
  entries.forEach((entry) => {
    passwordUsage.set(entry.password, (passwordUsage.get(entry.password) || 0) + 1);
  });
  const reusedPasswords = Array.from(passwordUsage.values()).filter((count) => count > 1).length;
  return { totalEntries: entries.length, weakEntries, suspiciousEntries, reusedPasswords };
}

export function formatRelativeLockTime(lockUntil: number) {
  const deltaMs = Math.max(0, lockUntil - Date.now());
  const totalMinutes = Math.ceil(deltaMs / 60000);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  return `${Math.ceil(totalMinutes / 60)} h`;
}

export function createEncryptedBackupExport(username: string) {
  return JSON.stringify(
    { exportedAt: nowIso(), auth: loadAuthRecord(username), vault: loadStoredVault(username) },
    null,
    2
  );
}
