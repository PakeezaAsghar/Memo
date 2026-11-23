import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {
  SessionInfo,
  UserPreferences,
  UserProfile,
  WorkspaceData,
} from '../src/types/workspace.ts';
import {
  createDefaultMediaSeed,
  createSeedWorkspace,
  DEFAULT_PREFERENCES,
  ensureSeedFilesForUser,
} from './seed.ts';

export const DATA_DIR = path.resolve(process.cwd(), 'data');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'myspace.json');

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatarUrl: string;
  bio: string;
  emailVerified: boolean;
  verificationCode: string | null;
  resetCode: string | null;
  resetExpiresAt: number | null;
  preferences: UserPreferences;
  createdAt: string;
}

export interface StoredSession {
  token: string;
  id: string;
  userId: string;
  device: string;
  createdAt: string;
  lastActiveAt: string;
}

interface DatabaseSchema {
  users: StoredUser[];
  sessions: StoredSession[];
  workspaces: Record<string, WorkspaceData>;
}

function hashPassword(password: string, existingSalt?: string): string {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

function generateSixDigitCode(): string {
  return String(crypto.randomInt(100000, 999999));
}

class WorkspaceStore {
  private data: DatabaseSchema;

  constructor() {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    this.data = this.load();
    this.ensureDefaultUser();
  }

  private load(): DatabaseSchema {
    if (!fs.existsSync(DB_FILE)) {
      return { users: [], sessions: [], workspaces: {} };
    }
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
      return {
        users: Array.isArray(parsed.users) ? parsed.users : [],
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
        workspaces: parsed.workspaces && typeof parsed.workspaces === 'object' ? parsed.workspaces : {},
      };
    } catch {
      return { users: [], sessions: [], workspaces: {} };
    }
  }

  private save() {
    const tmp = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2), 'utf8');
    fs.renameSync(tmp, DB_FILE);
  }

  private ensureDefaultUser() {
    const demoId = 'user-claire';
    const existing = this.data.users.find((u) => u.id === demoId || u.email === 'claire@myspace.app');
    if (!existing) {
      const now = new Date().toISOString();
      const user: StoredUser = {
        id: demoId,
        name: 'Claire Lin',
        email: 'claire@myspace.app',
        passwordHash: hashPassword('MySpace2026!'),
        avatarUrl: '/src/assets/images/avatar_owner_1795116544586.jpg',
        bio: 'Design student, reader, and collector of quiet ideas.',
        emailVerified: true,
        verificationCode: null,
        resetCode: null,
        resetExpiresAt: null,
        preferences: { ...DEFAULT_PREFERENCES },
        createdAt: now,
      };
      this.data.users.push(user);
      this.data.workspaces[demoId] = createSeedWorkspace(demoId, UPLOADS_DIR);
      this.save();
    } else {
      ensureSeedFilesForUser(existing.id, UPLOADS_DIR);
    }
  }

  public toPublicUser(user: StoredUser): UserProfile {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      emailVerified: user.emailVerified,
      preferences: user.preferences,
      createdAt: user.createdAt,
    };
  }

  public registerUser(name: string, email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    if (this.data.users.some((u) => u.email === normalized)) {
      throw new Error('An account with this email already exists.');
    }
    const id = `user-${crypto.randomUUID().slice(0, 8)}`;
    const verificationCode = generateSixDigitCode();
    const user: StoredUser = {
      id,
      name: name.trim(),
      email: normalized,
      passwordHash: hashPassword(password),
      avatarUrl: '/src/assets/images/avatar_owner_1795116544586.jpg',
      bio: 'Personal digital home.',
      emailVerified: false,
      verificationCode,
      resetCode: null,
      resetExpiresAt: null,
      preferences: { ...DEFAULT_PREFERENCES },
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(user);
    this.data.workspaces[id] = createSeedWorkspace(id, UPLOADS_DIR);
    this.save();
    return { user, verificationCode };
  }

  public verifyEmail(email: string, code: string) {
    const normalized = email.trim().toLowerCase();
    const user = this.data.users.find((u) => u.email === normalized);
    if (!user) throw new Error('Account not found.');
    if (user.emailVerified) return user;
    if (!user.verificationCode || user.verificationCode !== code.trim()) {
      throw new Error('Invalid verification code.');
    }
    user.emailVerified = true;
    user.verificationCode = null;
    this.save();
    return user;
  }

  public resendVerification(email: string) {
    const normalized = email.trim().toLowerCase();
    const user = this.data.users.find((u) => u.email === normalized);
    if (!user) throw new Error('Account not found.');
    const code = generateSixDigitCode();
    user.verificationCode = code;
    this.save();
    return code;
  }

  public createPasswordReset(email: string) {
    const normalized = email.trim().toLowerCase();
    const user = this.data.users.find((u) => u.email === normalized);
    if (!user) throw new Error('No account matches that email address.');
    const code = generateSixDigitCode();
    user.resetCode = code;
    user.resetExpiresAt = Date.now() + 30 * 60 * 1000;
    this.save();
    return code;
  }

  public resetPassword(email: string, code: string, newPassword: string) {
    const normalized = email.trim().toLowerCase();
    const user = this.data.users.find((u) => u.email === normalized);
    if (!user || !user.resetCode || !user.resetExpiresAt) {
      throw new Error('Invalid or expired reset code.');
    }
    if (Date.now() > user.resetExpiresAt) {
      throw new Error('Reset code has expired. Please request a new one.');
    }
    if (user.resetCode !== code.trim()) {
      throw new Error('Incorrect reset code.');
    }
    user.passwordHash = hashPassword(newPassword);
    user.resetCode = null;
    user.resetExpiresAt = null;
    this.save();
    return user;
  }

  public authenticate(email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    const user = this.data.users.find((u) => u.email === normalized);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new Error('Invalid email or password.');
    }
    return user;
  }

  public createSession(userId: string, device: string): StoredSession {
    const now = new Date().toISOString();
    const session: StoredSession = {
      id: `sess-${crypto.randomUUID().slice(0, 8)}`,
      token: crypto.randomBytes(32).toString('hex'),
      userId,
      device: device || 'Web Browser',
      createdAt: now,
      lastActiveAt: now,
    };
    this.data.sessions.push(session);
    this.save();
    return session;
  }

  public getSessionByToken(token: string): { session: StoredSession; user: StoredUser } | null {
    const session = this.data.sessions.find((s) => s.token === token);
    if (!session) return null;
    const user = this.data.users.find((u) => u.id === session.userId);
    if (!user) return null;
    session.lastActiveAt = new Date().toISOString();
    return { session, user };
  }

  public listSessions(userId: string, currentToken: string): SessionInfo[] {
    return this.data.sessions
      .filter((s) => s.userId === userId)
      .map((s) => ({
        id: s.id,
        device: s.device,
        createdAt: s.createdAt,
        lastActiveAt: s.lastActiveAt,
        current: s.token === currentToken,
      }));
  }

  public revokeSession(userId: string, sessionId: string) {
    this.data.sessions = this.data.sessions.filter(
      (s) => !(s.userId === userId && s.id === sessionId)
    );
    this.save();
  }

  public logoutToken(token: string) {
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    this.save();
  }

  public updateUserProfile(
    userId: string,
    patch: Partial<Pick<UserProfile, 'name' | 'email' | 'avatarUrl' | 'bio'>> & {
      preferences?: Partial<UserPreferences>;
    }
  ): UserProfile {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found.');
    if (typeof patch.name === 'string' && patch.name.trim()) user.name = patch.name.trim();
    if (typeof patch.email === 'string' && patch.email.trim()) {
      const nextEmail = patch.email.trim().toLowerCase();
      if (nextEmail !== user.email && this.data.users.some((u) => u.email === nextEmail)) {
        throw new Error('Email is already in use.');
      }
      user.email = nextEmail;
    }
    if (typeof patch.avatarUrl === 'string') user.avatarUrl = patch.avatarUrl;
    if (typeof patch.bio === 'string') user.bio = patch.bio;
    if (patch.preferences) {
      user.preferences = { ...user.preferences, ...patch.preferences };
    }
    this.save();
    return this.toPublicUser(user);
  }

  public getWorkspace(userId: string): WorkspaceData {
    if (!this.data.workspaces[userId]) {
      this.data.workspaces[userId] = createSeedWorkspace(userId, UPLOADS_DIR);
      this.save();
    } else if (!Array.isArray(this.data.workspaces[userId].media)) {
      const today = new Date();
      const iso = (d: Date) => d.toISOString().slice(0, 10);
      const y = new Date(today.getTime() - 86400000);
      const t2 = new Date(today.getTime() - 2 * 86400000);
      this.data.workspaces[userId].media = createDefaultMediaSeed(iso(today), iso(y), iso(t2));
      this.save();
    }
    return this.data.workspaces[userId];
  }

  public setWorkspace(userId: string, next: WorkspaceData): WorkspaceData {
    this.data.workspaces[userId] = next;
    this.save();
    return next;
  }

  public findDocumentByShareToken(shareToken: string) {
    for (const [userId, ws] of Object.entries(this.data.workspaces)) {
      const doc = ws.documents.find((d) => d.shareToken === shareToken && !d.isTrashed);
      if (doc) return { userId, doc };
    }
    return null;
  }

  public deleteAccount(userId: string) {
    this.data.users = this.data.users.filter((u) => u.id !== userId);
    this.data.sessions = this.data.sessions.filter((s) => s.userId !== userId);
    delete this.data.workspaces[userId];
    const userDir = path.join(UPLOADS_DIR, userId);
    if (fs.existsSync(userDir)) {
      fs.rmSync(userDir, { recursive: true, force: true });
    }
    this.save();
  }
}

export const db = new WorkspaceStore();
