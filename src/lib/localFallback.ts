import type {
  CalendarMood,
  CollectionKey,
  SessionInfo,
  UserPreferences,
  UserProfile,
  WorkspaceData,
} from '../types/workspace';

const LOCAL_DB_KEY = 'memo_local_fallback_db_v1';
const LOCAL_TOKEN_PREFIX = 'local-sess-';

interface LocalUserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  avatarUrl: string;
  bio: string;
  emailVerified: boolean;
  verificationCode: string | null;
  resetCode: string | null;
  preferences: UserPreferences;
  createdAt: string;
}

interface LocalSessionRecord {
  token: string;
  id: string;
  userId: string;
  device: string;
  createdAt: string;
  lastActiveAt: string;
}

interface LocalDbSchema {
  users: LocalUserRecord[];
  sessions: LocalSessionRecord[];
  workspaces: Record<string, WorkspaceData>;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  accentColor: 'sage',
  layoutDensity: 'comfortable',
  taskReminders: true,
  calendarReminders: true,
  dailySummaries: true,
  weeklyReports: false,
  twoFactorHint: true,
  aiAllowNotes: true,
  aiAllowDocuments: true,
  aiAllowTasks: true,
  aiAllowJournal: false,
  aiAllowStudy: true,
};

function createEmptyWorkspace(): WorkspaceData {
  return {
    notes: [],
    customNoteCategories: [],
    documents: [],
    tasks: [],
    bookmarks: [],
    journal: [],
    events: [],
    calendarMoods: {},
    transactions: [],
    budgets: [],
    savingsGoals: [],
    studySubjects: [],
    studySessions: [],
    studyAssignments: [],
    flashcardDecks: [],
    timetable: [],
    knowledge: [],
    careerJobs: [],
    careerRecords: [],
    projects: [],
    habits: [],
    goals: [],
    books: [],
    media: [],
    ideas: [],
    gallery: [],
    resources: [],
    emergency: {
      id: 'em-1',
      bloodType: '',
      allergies: '',
      medicalNotes: '',
      insuranceProvider: '',
      insurancePolicyNumber: '',
      homeAddress: '',
      emergencyPlan: '',
      contacts: [],
      importantDocs: [],
    },
    aiThreads: [],
    notifications: [],
  };
}

function createClaireSeedWorkspace(): WorkspaceData {
  const now = new Date();
  const fmt = (offsetDays: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  };
  const todayStr = fmt(0);
  const yesterdayStr = fmt(-1);
  const tomorrowStr = fmt(1);
  const inThreeDays = fmt(3);

  return {
    ...createEmptyWorkspace(),
    notes: [
      {
        id: 'note-1',
        title: 'Editorial Layout & Typography Notes',
        contentHtml:
          '<p>Keep line lengths calm, pair soft sage accents with warm parchment surfaces, and give checklists generous breathing room.</p>',
        plainText:
          'Keep line lengths calm, pair soft sage accents with warm parchment surfaces, and give checklists generous breathing room.',
        category: 'Study',
        isPinned: true,
        isFavorite: true,
        isArchived: false,
        wordCount: 19,
        attachments: [],
        updatedAt: todayStr,
        createdAt: yesterdayStr,
      },
      {
        id: 'note-2',
        title: 'Weekend Studio Checklist',
        contentHtml:
          '<p>Refresh reading shelf, sort Figma prototype frames, and sketch morning journaling prompts.</p>',
        plainText:
          'Refresh reading shelf, sort Figma prototype frames, and sketch morning journaling prompts.',
        category: 'Personal',
        isPinned: false,
        isFavorite: false,
        isArchived: false,
        wordCount: 13,
        attachments: [],
        updatedAt: yesterdayStr,
        createdAt: yesterdayStr,
      },
    ],
    tasks: [
      {
        id: 'task-1',
        title: 'Review HCI field study notes',
        description: 'Summarize participant quotes and tag key insights.',
        category: 'Study',
        priority: 'high',
        dueDate: todayStr,
        completed: false,
        recurring: 'none',
        subtasks: [],
        order: 0,
        createdAt: yesterdayStr,
      },
      {
        id: 'task-2',
        title: 'Curate weekend playlist',
        description: 'Add ambient instrumental tracks for deep focus.',
        category: 'Personal',
        priority: 'low',
        dueDate: tomorrowStr,
        completed: true,
        recurring: 'none',
        subtasks: [],
        order: 1,
        createdAt: yesterdayStr,
      },
    ],
    bookmarks: [
      {
        id: 'bm-1',
        title: 'Laws of UX',
        url: 'https://lawsofux.com',
        domain: 'lawsofux.com',
        description: 'Collection of best practices designers consider when building interfaces.',
        category: 'Design',
        faviconUrl: 'https://www.google.com/s2/favicons?domain=lawsofux.com&sz=64',
        isFavorite: true,
        createdAt: yesterdayStr,
      },
    ],
    journal: [
      {
        id: 'jr-1',
        title: 'Quiet Sunday Sketchbook',
        contentHtml:
          '<p>Spent an hour by the window outlining interface rhythms and sipping jasmine tea.</p>',
        plainText:
          'Spent an hour by the window outlining interface rhythms and sipping jasmine tea.',
        mood: 'calm',
        category: 'Reflection',
        tags: ['calm', 'design'],
        isDraft: false,
        entryDate: todayStr,
        createdAt: todayStr,
      },
    ],
    events: [
      {
        id: 'ev-1',
        title: 'Design Critique Session',
        date: todayStr,
        startTime: '14:00',
        endTime: '15:00',
        category: 'university',
        description: 'Weekly studio feedback on interactive prototypes.',
        location: 'Studio Hall 204',
      },
      {
        id: 'ev-2',
        title: 'Coffee & Reading Hour',
        date: inThreeDays,
        startTime: '09:30',
        endTime: '10:30',
        category: 'personal',
        description: 'Read two chapters of The Design of Everyday Things.',
      },
    ],
    calendarMoods: {
      [yesterdayStr]: 'good',
    },
    habits: [
      {
        id: 'hab-1',
        title: 'Morning stretch & hydration',
        frequency: 'daily',
        category: 'Wellness',
        completedDates: [todayStr, yesterdayStr],
      },
      {
        id: 'hab-2',
        title: 'Read 20 pages',
        frequency: 'daily',
        category: 'Learning',
        completedDates: [yesterdayStr],
      },
    ],
    media: [
      {
        id: 'med-1',
        mediaType: 'music',
        title: 'Daylight Focus',
        creator: 'Kemin Joki',
        genre: 'Ambient',
        year: '2025',
        status: 'Current',
        rating: 5,
        isFavorite: true,
        notes: 'Warm instrumental background for studio writing.',
        updatedAt: todayStr,
      },
      {
        id: 'med-2',
        mediaType: 'movie',
        title: 'Past Lives',
        creator: 'Celine Song',
        genre: 'Drama',
        year: '2023',
        status: 'Completed',
        rating: 5,
        isFavorite: true,
        notes: 'Thoughtful pacing and understated visual storytelling.',
        updatedAt: yesterdayStr,
      },
      {
        id: 'med-3',
        mediaType: 'music',
        title: 'Horizon Tape',
        creator: 'Kristin',
        genre: 'Lo-Fi',
        year: '2024',
        status: 'Queue',
        rating: 4,
        isFavorite: false,
        notes: 'Soft analog tape textures.',
        updatedAt: yesterdayStr,
      },
      {
        id: 'med-4',
        mediaType: 'music',
        title: 'Cassette Dreams',
        creator: 'Marvin Black',
        genre: 'Indie Electronic',
        year: '2024',
        status: 'Queue',
        rating: 4,
        isFavorite: false,
        notes: '',
        updatedAt: yesterdayStr,
      },
      {
        id: 'med-5',
        mediaType: 'movie',
        title: 'Aftersun',
        creator: 'Charlotte Wells',
        genre: 'Drama',
        year: '2022',
        status: 'Queue',
        rating: 5,
        isFavorite: true,
        notes: 'Saved for a quiet Friday evening.',
        updatedAt: yesterdayStr,
      },
    ],
    books: [
      {
        id: 'book-1',
        title: 'The Design of Everyday Things',
        author: 'Don Norman',
        category: 'Currently Reading',
        currentPage: 142,
        totalPages: 368,
        rating: 5,
        notes: 'Key chapters on affordances and signifiers.',
        updatedAt: todayStr,
      },
    ],
    notifications: [
      {
        id: 'notif-1',
        title: 'Welcome to Claire’s Space',
        detail: 'Your notes, calendar, habits, and media library are ready.',
        time: 'Just now',
        read: false,
        targetPage: 'dashboard',
      },
    ],
  };
}

function loadDb(): LocalDbSchema {
  try {
    const raw = localStorage.getItem(LOCAL_DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LocalDbSchema>;
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.sessions) && parsed.workspaces) {
        return ensureClaireUser({
          users: parsed.users,
          sessions: parsed.sessions,
          workspaces: parsed.workspaces,
        });
      }
    }
  } catch {
    // ignore storage errors and reseed
  }
  const seeded = ensureClaireUser({ users: [], sessions: [], workspaces: {} });
  saveDb(seeded);
  return seeded;
}

function saveDb(db: LocalDbSchema) {
  try {
    localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db));
  } catch {
    // ignore quota errors
  }
}

function ensureClaireUser(db: LocalDbSchema): LocalDbSchema {
  const existing = db.users.find((u) => u.id === 'user-claire' || u.email === 'claire@myspace.app');
  if (!existing) {
    const createdAt = new Date().toISOString();
    db.users.push({
      id: 'user-claire',
      name: 'Claire Lin',
      email: 'claire@myspace.app',
      password: 'MySpace2026!',
      avatarUrl: '/src/assets/images/avatar_owner_1795116544586.jpg',
      bio: 'Design student, reader, and collector of quiet ideas.',
      emailVerified: true,
      verificationCode: null,
      resetCode: null,
      preferences: { ...DEFAULT_PREFERENCES },
      createdAt,
    });
  }
  if (!db.workspaces['user-claire']) {
    db.workspaces['user-claire'] = createClaireSeedWorkspace();
  }
  return db;
}

function toPublicUser(u: LocalUserRecord): UserProfile {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatarUrl: u.avatarUrl,
    bio: u.bio,
    emailVerified: u.emailVerified,
    preferences: u.preferences,
    createdAt: u.createdAt,
  };
}

function makeErr(message: string, status = 400, payload: Record<string, unknown> = {}) {
  const err = new Error(message) as Error & { status?: number; payload?: Record<string, unknown> };
  err.status = status;
  err.payload = { error: message, ...payload };
  return err;
}

function requireLocalAuth(db: LocalDbSchema, token: string | null) {
  if (!token) throw makeErr('Authentication required.', 401);
  const sess = db.sessions.find((s) => s.token === token);
  if (!sess) throw makeErr('Session expired. Please sign in again.', 401);
  const user = db.users.find((u) => u.id === sess.userId);
  if (!user) throw makeErr('Account not found.', 401);
  sess.lastActiveAt = new Date().toISOString();
  saveDb(db);
  return { user, session: sess };
}

export function isLocalToken(token: string | null): boolean {
  return Boolean(token && token.startsWith(LOCAL_TOKEN_PREFIX));
}

export async function handleLocalFallback(
  path: string,
  options: RequestInit = {},
  token: string | null
): Promise<unknown> {
  const method = (options.method || 'GET').toUpperCase();
  const db = loadDb();

  let body: Record<string, unknown> = {};
  if (typeof options.body === 'string' && options.body.trim()) {
    try {
      body = JSON.parse(options.body) as Record<string, unknown>;
    } catch {
      body = {};
    }
  }

  // ---------- AUTH ----------
  if (path === '/api/auth/login' && method === 'POST') {
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const user = db.users.find((u) => u.email.toLowerCase() === email);
    if (!user || user.password !== password) {
      throw makeErr('Invalid email or password.', 401);
    }
    if (!user.emailVerified) {
      throw makeErr('Please verify your email address before signing in.', 403, {
        requiresVerification: true,
        email: user.email,
        verificationPreviewCode: user.verificationCode,
      });
    }
    const now = new Date().toISOString();
    const newToken = `${LOCAL_TOKEN_PREFIX}${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    db.sessions.push({
      token: newToken,
      id: `sess-${Date.now().toString(36)}`,
      userId: user.id,
      device: 'Browser Session',
      createdAt: now,
      lastActiveAt: now,
    });
    saveDb(db);
    return { token: newToken, user: toPublicUser(user) };
  }

  if (path === '/api/auth/register' && method === 'POST') {
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (name.length < 2) throw makeErr('Please provide your name (at least 2 characters).', 400);
    if (!email.includes('@')) throw makeErr('Please provide a valid email address.', 400);
    if (password.length < 6) throw makeErr('Password must be at least 6 characters.', 400);
    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      throw makeErr('An account with this email already exists.', 400);
    }
    const id = `user-${Date.now().toString(36)}`;
    const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
    const user: LocalUserRecord = {
      id,
      name,
      email,
      password,
      avatarUrl: '/src/assets/images/avatar_owner_1795116544586.jpg',
      bio: '',
      emailVerified: false,
      verificationCode,
      resetCode: null,
      preferences: { ...DEFAULT_PREFERENCES },
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    db.workspaces[id] = createEmptyWorkspace();
    saveDb(db);
    return {
      message: 'Account created. Please verify your email address.',
      email: user.email,
      verificationPreviewCode: verificationCode,
    };
  }

  if (path === '/api/auth/verify-email' && method === 'POST') {
    const email = String(body.email || '').trim().toLowerCase();
    const code = String(body.code || '').trim();
    const user = db.users.find((u) => u.email.toLowerCase() === email);
    if (!user) throw makeErr('Account not found.', 400);
    if (!user.verificationCode || user.verificationCode !== code) {
      throw makeErr('Invalid verification code.', 400);
    }
    user.emailVerified = true;
    user.verificationCode = null;
    const now = new Date().toISOString();
    const newToken = `${LOCAL_TOKEN_PREFIX}${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    db.sessions.push({
      token: newToken,
      id: `sess-${Date.now().toString(36)}`,
      userId: user.id,
      device: 'Browser Session',
      createdAt: now,
      lastActiveAt: now,
    });
    saveDb(db);
    return { token: newToken, user: toPublicUser(user) };
  }

  if (path === '/api/auth/resend-verification' && method === 'POST') {
    const email = String(body.email || '').trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === email);
    if (!user) throw makeErr('Account not found.', 400);
    const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
    user.verificationCode = verificationCode;
    saveDb(db);
    return { message: 'Verification code refreshed.', verificationPreviewCode: verificationCode };
  }

  if (path === '/api/auth/forgot-password' && method === 'POST') {
    const email = String(body.email || '').trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === email);
    if (!user) throw makeErr('No account found with that email.', 400);
    const resetCode = String(Math.floor(100000 + Math.random() * 900000));
    user.resetCode = resetCode;
    saveDb(db);
    return { message: 'Password reset code generated.', resetPreviewCode: resetCode };
  }

  if (path === '/api/auth/reset-password' && method === 'POST') {
    const email = String(body.email || '').trim().toLowerCase();
    const code = String(body.code || '').trim();
    const newPassword = String(body.newPassword || '');
    const user = db.users.find((u) => u.email.toLowerCase() === email);
    if (!user || !user.resetCode || user.resetCode !== code) {
      throw makeErr('Invalid or expired reset code.', 400);
    }
    if (newPassword.length < 6) throw makeErr('Password must be at least 6 characters.', 400);
    user.password = newPassword;
    user.resetCode = null;
    saveDb(db);
    return { message: 'Password updated successfully. You may now sign in.' };
  }

  if (path === '/api/auth/logout' && method === 'POST') {
    if (token) {
      db.sessions = db.sessions.filter((s) => s.token !== token);
      saveDb(db);
    }
    return { ok: true };
  }

  if (path === '/api/auth/sessions' && method === 'GET') {
    const { user } = requireLocalAuth(db, token);
    const sessions: SessionInfo[] = db.sessions
      .filter((s) => s.userId === user.id)
      .map((s) => ({
        id: s.id,
        device: s.device,
        createdAt: s.createdAt,
        lastActiveAt: s.lastActiveAt,
        current: s.token === token,
      }));
    return { sessions };
  }

  if (path.startsWith('/api/auth/sessions/') && method === 'DELETE') {
    const { user } = requireLocalAuth(db, token);
    const sid = decodeURIComponent(path.replace('/api/auth/sessions/', ''));
    db.sessions = db.sessions.filter((s) => !(s.userId === user.id && s.id === sid));
    saveDb(db);
    const sessions: SessionInfo[] = db.sessions
      .filter((s) => s.userId === user.id)
      .map((s) => ({
        id: s.id,
        device: s.device,
        createdAt: s.createdAt,
        lastActiveAt: s.lastActiveAt,
        current: s.token === token,
      }));
    return { sessions };
  }

  if (path === '/api/auth/account' && method === 'DELETE') {
    const { user } = requireLocalAuth(db, token);
    db.users = db.users.filter((u) => u.id !== user.id);
    db.sessions = db.sessions.filter((s) => s.userId !== user.id);
    delete db.workspaces[user.id];
    saveDb(db);
    return { ok: true };
  }

  // ---------- WORKSPACE ----------
  const { user } = requireLocalAuth(db, token);
  const ws = db.workspaces[user.id] || createEmptyWorkspace();
  db.workspaces[user.id] = ws;

  if (path === '/api/workspace' && method === 'GET') {
    return { user: toPublicUser(user), workspace: ws };
  }

  if (path === '/api/workspace/profile' && method === 'PUT') {
    if (typeof body.name === 'string' && body.name.trim()) user.name = body.name.trim();
    if (typeof body.email === 'string' && body.email.trim()) user.email = body.email.trim().toLowerCase();
    if (typeof body.avatarUrl === 'string') user.avatarUrl = body.avatarUrl;
    if (typeof body.bio === 'string') user.bio = body.bio;
    if (body.preferences && typeof body.preferences === 'object') {
      user.preferences = { ...user.preferences, ...(body.preferences as Partial<UserPreferences>) };
    }
    saveDb(db);
    return { user: toPublicUser(user) };
  }

  if (path === '/api/workspace/customNoteCategories' && method === 'PUT') {
    const categories = Array.isArray(body.categories)
      ? body.categories.filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
      : ws.customNoteCategories;
    ws.customNoteCategories = categories;
    saveDb(db);
    return { customNoteCategories: ws.customNoteCategories };
  }

  if (path === '/api/workspace/calendarMoods' && method === 'PUT') {
    const date = typeof body.date === 'string' ? body.date.trim() : '';
    const mood = body.mood as CalendarMood | null | undefined;
    const nextMoods: Record<string, CalendarMood> = { ...(ws.calendarMoods || {}) };
    if (mood === null || mood === undefined) {
      delete nextMoods[date];
    } else {
      nextMoods[date] = mood;
    }
    ws.calendarMoods = nextMoods;
    saveDb(db);
    return { calendarMoods: ws.calendarMoods };
  }

  if (path === '/api/workspace/emergency' && method === 'PUT') {
    ws.emergency = { ...ws.emergency, ...(body as Partial<WorkspaceData['emergency']>) };
    saveDb(db);
    return { emergency: ws.emergency };
  }

  if (path === '/api/workspace/export' && method === 'POST') {
    return {
      exportedAt: new Date().toISOString(),
      app: 'Memo',
      user: toPublicUser(user),
      workspace: ws,
    };
  }

  if (path === '/api/workspace/restore' && method === 'POST') {
    const payload = body.workspace as WorkspaceData | undefined;
    if (!payload || !Array.isArray(payload.notes) || !Array.isArray(payload.tasks)) {
      throw makeErr('Invalid Memo backup JSON format.', 400);
    }
    const merged = { ...createEmptyWorkspace(), ...payload };
    db.workspaces[user.id] = merged;
    saveDb(db);
    return { workspace: merged };
  }

  if (path.startsWith('/api/workspace/bulk/') && method === 'POST') {
    const collection = path.replace('/api/workspace/bulk/', '') as CollectionKey;
    const items = Array.isArray(body.items) ? body.items : [];
    (ws[collection] as unknown) = items;
    saveDb(db);
    return { items };
  }

  if (path.startsWith('/api/workspace/')) {
    const parts = path.replace('/api/workspace/', '').split('/');
    const collection = parts[0] as CollectionKey;
    const itemId = parts[1] ? decodeURIComponent(parts[1]) : null;
    const list = (ws[collection] as unknown as Array<{ id: string }>) || [];

    if (method === 'POST' && !itemId) {
      const created = {
        ...body,
        id:
          typeof body.id === 'string' && body.id
            ? body.id
            : `${collection.slice(0, 3)}-${Math.random().toString(36).slice(2, 10)}`,
      };
      (ws[collection] as unknown as Array<Record<string, unknown>>) = [created, ...list];
      saveDb(db);
      return { item: created };
    }

    if (method === 'PUT' && itemId) {
      let updatedItem: Record<string, unknown> | null = null;
      const nextList = list.map((item) => {
        if (item.id === itemId) {
          updatedItem = { ...item, ...body, id: itemId };
          return updatedItem;
        }
        return item;
      });
      if (!updatedItem) throw makeErr('Item not found.', 404);
      (ws[collection] as unknown) = nextList;
      saveDb(db);
      return { item: updatedItem };
    }

    if (method === 'DELETE' && itemId) {
      (ws[collection] as unknown) = list.filter((item) => item.id !== itemId);
      saveDb(db);
      return { ok: true };
    }
  }

  if (path === '/api/upload' && method === 'POST' && options.body instanceof FormData) {
    const file = options.body.get('file');
    if (file instanceof File) {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });
      return {
        name: file.name,
        storedFilename: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        url: dataUrl,
        extractedText: '',
      };
    }
  }

  if (path === '/api/ai/chat' && method === 'POST') {
    return {
      reply:
        'AI Assistant requires the Node backend server with GEMINI_API_KEY configured. All your local workspace features remain fully available.',
    };
  }

  throw makeErr('Endpoint not found.', 404);
}
