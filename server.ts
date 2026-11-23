import 'dotenv/config';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { db, UPLOADS_DIR } from './server/db.ts';
import type { StoredUser } from './server/db.ts';
import type { CalendarMood, CollectionKey, WorkspaceData } from './src/types/workspace.ts';

const VALID_CALENDAR_MOODS = new Set<CalendarMood>(['upset', 'sad', 'neutral', 'good', 'great']);

interface AuthRequest extends Request {
  authUser?: StoredUser;
  authToken?: string;
}

const VALID_COLLECTIONS = new Set<string>([
  'notes',
  'documents',
  'tasks',
  'bookmarks',
  'journal',
  'events',
  'transactions',
  'budgets',
  'savingsGoals',
  'studySubjects',
  'studySessions',
  'studyAssignments',
  'flashcardDecks',
  'timetable',
  'knowledge',
  'careerJobs',
  'careerRecords',
  'projects',
  'habits',
  'goals',
  'books',
  'media',
  'ideas',
  'gallery',
  'resources',
  'aiThreads',
  'notifications',
]);

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  const queryToken = req.query.token;
  if (typeof queryToken === 'string' && queryToken.trim()) {
    return queryToken.trim();
  }
  return null;
}

function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const found = db.getSessionByToken(token);
  if (!found) {
    res.status(401).json({ error: 'Session expired or invalid.' });
    return;
  }
  req.authUser = found.user;
  req.authToken = token;
  next();
}

const storage = multer.diskStorage({
  destination: (req: AuthRequest, _file, cb) => {
    const userId = req.authUser?.id || 'anonymous';
    const dest = path.join(UPLOADS_DIR, userId);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const unique = `${Date.now()}-${safeName}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '15mb' }));

  // ---------- AUTH ROUTES ----------
  app.post('/api/auth/register', (req, res) => {
    try {
      const { name, email, password } = req.body || {};
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        res.status(400).json({ error: 'Please provide your name (at least 2 characters).' });
        return;
      }
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        res.status(400).json({ error: 'Please provide a valid email address.' });
        return;
      }
      if (!password || typeof password !== 'string' || password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters.' });
        return;
      }
      const { user, verificationCode } = db.registerUser(name, email, password);
      res.status(201).json({
        message: 'Account created. Please verify your email address.',
        email: user.email,
        verificationPreviewCode: verificationCode,
      });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Registration failed.' });
    }
  });

  app.post('/api/auth/verify-email', (req, res) => {
    try {
      const { email, code } = req.body || {};
      if (!email || !code) {
        res.status(400).json({ error: 'Email and verification code are required.' });
        return;
      }
      const user = db.verifyEmail(String(email), String(code));
      const session = db.createSession(user.id, req.headers['user-agent'] || 'Web Browser');
      res.json({
        token: session.token,
        user: db.toPublicUser(user),
      });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Verification failed.' });
    }
  });

  app.post('/api/auth/resend-verification', (req, res) => {
    try {
      const { email } = req.body || {};
      if (!email) {
        res.status(400).json({ error: 'Email is required.' });
        return;
      }
      const code = db.resendVerification(String(email));
      res.json({ message: 'Verification code refreshed.', verificationPreviewCode: code });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Could not resend code.' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
      }
      const user = db.authenticate(String(email), String(password));
      if (!user.emailVerified) {
        res.status(403).json({
          error: 'Please verify your email address before signing in.',
          requiresVerification: true,
          email: user.email,
          verificationPreviewCode: user.verificationCode,
        });
        return;
      }
      const ua = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'].slice(0, 60) : 'Web Browser';
      const session = db.createSession(user.id, ua);
      res.json({
        token: session.token,
        user: db.toPublicUser(user),
      });
    } catch (err) {
      res.status(401).json({ error: err instanceof Error ? err.message : 'Invalid credentials.' });
    }
  });

  app.post('/api/auth/forgot-password', (req, res) => {
    try {
      const { email } = req.body || {};
      if (!email) {
        res.status(400).json({ error: 'Please enter your email address.' });
        return;
      }
      const code = db.createPasswordReset(String(email));
      res.json({
        message: 'Password reset code generated.',
        resetPreviewCode: code,
      });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Unable to initiate reset.' });
    }
  });

  app.post('/api/auth/reset-password', (req, res) => {
    try {
      const { email, code, newPassword } = req.body || {};
      if (!email || !code || !newPassword || String(newPassword).length < 6) {
        res.status(400).json({ error: 'Valid email, reset code, and password (6+ chars) are required.' });
        return;
      }
      db.resetPassword(String(email), String(code), String(newPassword));
      res.json({ message: 'Password updated successfully. You may now sign in.' });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Password reset failed.' });
    }
  });

  app.post('/api/auth/logout', requireAuth, (req: AuthRequest, res) => {
    if (req.authToken) db.logoutToken(req.authToken);
    res.json({ ok: true });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthRequest, res) => {
    res.json({ user: db.toPublicUser(req.authUser!) });
  });

  app.get('/api/auth/sessions', requireAuth, (req: AuthRequest, res) => {
    res.json({ sessions: db.listSessions(req.authUser!.id, req.authToken!) });
  });

  app.delete('/api/auth/sessions/:sessionId', requireAuth, (req: AuthRequest, res) => {
    db.revokeSession(req.authUser!.id, String(req.params.sessionId));
    res.json({ sessions: db.listSessions(req.authUser!.id, req.authToken!) });
  });

  app.delete('/api/auth/account', requireAuth, (req: AuthRequest, res) => {
    db.deleteAccount(req.authUser!.id);
    res.json({ ok: true });
  });

  // ---------- PROFILE & PREFERENCES ----------
  app.put('/api/workspace/profile', requireAuth, (req: AuthRequest, res) => {
    try {
      const updated = db.updateUserProfile(req.authUser!.id, req.body || {});
      res.json({ user: updated });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Profile update failed.' });
    }
  });

  // ---------- WORKSPACE DATA ROUTES ----------
  app.get('/api/workspace', requireAuth, (req: AuthRequest, res) => {
    const workspace = db.getWorkspace(req.authUser!.id);
    res.json({
      user: db.toPublicUser(req.authUser!),
      workspace,
    });
  });

  app.put('/api/workspace/customNoteCategories', requireAuth, (req: AuthRequest, res) => {
    const ws = db.getWorkspace(req.authUser!.id);
    const categories = Array.isArray(req.body?.categories)
      ? req.body.categories.filter((c: unknown): c is string => typeof c === 'string' && c.trim().length > 0)
      : ws.customNoteCategories;
    ws.customNoteCategories = categories;
    db.setWorkspace(req.authUser!.id, ws);
    res.json({ customNoteCategories: ws.customNoteCategories });
  });

  app.put('/api/workspace/calendarMoods', requireAuth, (req: AuthRequest, res) => {
    const date = typeof req.body?.date === 'string' ? req.body.date.trim() : '';
    const mood = req.body?.mood as CalendarMood | null | undefined;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: 'Valid YYYY-MM-DD date is required.' });
      return;
    }
    if (mood !== null && mood !== undefined && !VALID_CALENDAR_MOODS.has(mood)) {
      res.status(400).json({ error: 'Invalid mood value.' });
      return;
    }
    const ws = db.getWorkspace(req.authUser!.id);
    const nextMoods: Record<string, CalendarMood> = { ...(ws.calendarMoods || {}) };
    if (mood === null || mood === undefined) {
      delete nextMoods[date];
    } else {
      nextMoods[date] = mood;
    }
    ws.calendarMoods = nextMoods;
    db.setWorkspace(req.authUser!.id, ws);
    res.json({ calendarMoods: ws.calendarMoods });
  });

  app.put('/api/workspace/emergency', requireAuth, (req: AuthRequest, res) => {
    const ws = db.getWorkspace(req.authUser!.id);
    ws.emergency = { ...ws.emergency, ...(req.body || {}) };
    db.setWorkspace(req.authUser!.id, ws);
    res.json({ emergency: ws.emergency });
  });

  app.post('/api/workspace/export', requireAuth, (req: AuthRequest, res) => {
    const ws = db.getWorkspace(req.authUser!.id);
    res.json({
      exportedAt: new Date().toISOString(),
      app: 'Memo',
      user: db.toPublicUser(req.authUser!),
      workspace: ws,
    });
  });

  app.post('/api/workspace/restore', requireAuth, (req: AuthRequest, res) => {
    const payload = req.body?.workspace;
    if (!payload || typeof payload !== 'object' || !Array.isArray(payload.notes) || !Array.isArray(payload.tasks)) {
      res.status(400).json({ error: 'Invalid Memo backup JSON format.' });
      return;
    }
    const current = db.getWorkspace(req.authUser!.id);
    const merged: WorkspaceData = {
      ...current,
      ...payload,
      media: Array.isArray(payload.media) ? payload.media : current.media || [],
    };
    db.setWorkspace(req.authUser!.id, merged);
    res.json({ workspace: merged });
  });

  app.post('/api/workspace/:collection', requireAuth, (req: AuthRequest, res) => {
    const collection = String(req.params.collection) as CollectionKey;
    if (!VALID_COLLECTIONS.has(collection)) {
      res.status(400).json({ error: `Unknown collection: ${collection}` });
      return;
    }
    const ws = db.getWorkspace(req.authUser!.id);
    const list = ws[collection] as unknown as Array<{ id: string }>;
    const item = {
      ...req.body,
      id: req.body?.id || `${collection.slice(0, 3)}-${crypto.randomUUID().slice(0, 8)}`,
    };
    list.unshift(item);
    db.setWorkspace(req.authUser!.id, ws);
    res.status(201).json({ item });
  });

  app.put('/api/workspace/:collection/:id', requireAuth, (req: AuthRequest, res) => {
    const collection = String(req.params.collection) as CollectionKey;
    const id = String(req.params.id);
    if (!VALID_COLLECTIONS.has(collection)) {
      res.status(400).json({ error: `Unknown collection: ${collection}` });
      return;
    }
    const ws = db.getWorkspace(req.authUser!.id);
    const list = ws[collection] as unknown as Array<{ id: string }>;
    const idx = list.findIndex((entry) => entry.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Item not found.' });
      return;
    }
    list[idx] = { ...list[idx], ...req.body, id };
    db.setWorkspace(req.authUser!.id, ws);
    res.json({ item: list[idx] });
  });

  app.delete('/api/workspace/:collection/:id', requireAuth, (req: AuthRequest, res) => {
    const collection = String(req.params.collection) as CollectionKey;
    const id = String(req.params.id);
    if (!VALID_COLLECTIONS.has(collection)) {
      res.status(400).json({ error: `Unknown collection: ${collection}` });
      return;
    }
    const ws = db.getWorkspace(req.authUser!.id);
    const list = ws[collection] as unknown as Array<{ id: string }>;
    const filtered = list.filter((entry) => entry.id !== id);
    (ws[collection] as unknown as Array<{ id: string }>) = filtered;
    db.setWorkspace(req.authUser!.id, ws);
    res.json({ ok: true });
  });

  app.post('/api/workspace/bulk/:collection', requireAuth, (req: AuthRequest, res) => {
    const collection = String(req.params.collection) as CollectionKey;
    if (!VALID_COLLECTIONS.has(collection) || !Array.isArray(req.body?.items)) {
      res.status(400).json({ error: 'Invalid bulk update request.' });
      return;
    }
    const ws = db.getWorkspace(req.authUser!.id);
    (ws[collection] as unknown) = req.body.items;
    db.setWorkspace(req.authUser!.id, ws);
    res.json({ items: req.body.items });
  });

  // ---------- FILE UPLOAD & SERVING ----------
  app.post('/api/upload', requireAuth, upload.single('file'), (req: AuthRequest, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided.' });
      return;
    }
    const userId = req.authUser!.id;
    const url = `/api/files/${userId}/${encodeURIComponent(req.file.filename)}`;
    let extractedText = '';
    if (
      req.file.mimetype.startsWith('text/') ||
      req.file.mimetype === 'application/json' ||
      req.file.originalname.endsWith('.md') ||
      req.file.originalname.endsWith('.csv')
    ) {
      try {
        extractedText = fs.readFileSync(req.file.path, 'utf8').slice(0, 6000);
      } catch {
        extractedText = '';
      }
    }
    res.status(201).json({
      name: req.file.originalname,
      storedFilename: req.file.filename,
      mimeType: req.file.mimetype || 'application/octet-stream',
      size: req.file.size,
      url,
      extractedText,
    });
  });

  app.get('/api/files/:userId/:filename', (req, res) => {
    const userId = path.basename(String(req.params.userId));
    const filename = path.basename(decodeURIComponent(String(req.params.filename)));
    const filePath = path.join(UPLOADS_DIR, userId, filename);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'File not found.' });
      return;
    }

    const token = extractBearerToken(req);
    const shareToken = typeof req.query.share === 'string' ? req.query.share : '';
    let authorized = false;
    if (token) {
      const sess = db.getSessionByToken(token);
      if (sess && sess.user.id === userId) authorized = true;
    }
    if (!authorized && shareToken) {
      const shared = db.findDocumentByShareToken(shareToken);
      if (shared && shared.userId === userId) authorized = true;
    }

    if (!authorized) {
      res.status(401).json({ error: 'Unauthorized file access.' });
      return;
    }

    if (req.query.download === '1') {
      res.download(filePath, filename);
    } else {
      res.sendFile(filePath);
    }
  });

  app.get('/api/share/:shareToken', (req, res) => {
    const found = db.findDocumentByShareToken(String(req.params.shareToken));
    if (!found) {
      res.status(404).json({ error: 'Shared document link is invalid or revoked.' });
      return;
    }
    res.json({
      document: {
        name: found.doc.name,
        mimeType: found.doc.mimeType,
        size: found.doc.size,
        uploadedAt: found.doc.uploadedAt,
        downloadUrl: `${found.doc.url}?share=${encodeURIComponent(String(req.params.shareToken))}&download=1`,
        previewUrl: `${found.doc.url}?share=${encodeURIComponent(String(req.params.shareToken))}`,
      },
    });
  });

  // ---------- GEMINI AI ASSISTANT ROUTE ----------
  app.post('/api/ai/chat', requireAuth, async (req: AuthRequest, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(503).json({
        error: 'Gemini AI Assistant is not configured yet. Add GEMINI_API_KEY in Settings > Secrets to enable AI responses.',
      });
      return;
    }

    const { message, history = [], authorizedScopes = [], attachmentText = '', attachmentName = '' } =
      req.body || {};
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message prompt is required.' });
      return;
    }

    const ws = db.getWorkspace(req.authUser!.id);
    const scopes = Array.isArray(authorizedScopes) ? authorizedScopes : [];

    const contextSections: string[] = [];
    if (scopes.includes('notes')) {
      const notesSnippet = ws.notes
        .filter((n) => !n.isArchived)
        .slice(0, 12)
        .map((n) => `- [Note: ${n.title}] (${n.category}): ${n.plainText.slice(0, 400)}`)
        .join('\n');
      if (notesSnippet) contextSections.push(`AUTHORIZED NOTES:\n${notesSnippet}`);
    }
    if (scopes.includes('documents')) {
      const docsSnippet = ws.documents
        .filter((d) => !d.isTrashed)
        .slice(0, 12)
        .map((d) => `- [Document: ${d.name}] (${d.folder}): ${d.extractedText || 'Binary/PDF file uploaded by user'}`)
        .join('\n');
      if (docsSnippet) contextSections.push(`AUTHORIZED DOCUMENTS:\n${docsSnippet}`);
    }
    if (scopes.includes('tasks')) {
      const tasksSnippet = ws.tasks
        .slice(0, 15)
        .map((t) => `- [Task: ${t.title}] (${t.completed ? 'Done' : 'Pending'}, ${t.priority} priority, due ${t.dueDate})`)
        .join('\n');
      if (tasksSnippet) contextSections.push(`AUTHORIZED TASKS:\n${tasksSnippet}`);
    }
    if (scopes.includes('journal')) {
      const journalSnippet = ws.journal
        .filter((j) => !j.isDraft)
        .slice(0, 8)
        .map((j) => `- [Journal: ${j.title}] (${j.entryDate}, mood: ${j.mood}): ${j.plainText.slice(0, 350)}`)
        .join('\n');
      if (journalSnippet) contextSections.push(`AUTHORIZED JOURNAL ENTRIES:\n${journalSnippet}`);
    }
    if (scopes.includes('study')) {
      const studySnippet = ws.studySubjects
        .map((s) => `- [Subject: ${s.code} ${s.name}] Progress ${s.progress}%, GPA ${s.gradePoints}`)
        .join('\n');
      const assignSnippet = ws.studyAssignments
        .map((a) => `- [${a.kind}: ${a.title}] due ${a.dueDate} (${a.completed ? 'Done' : 'Pending'})`)
        .join('\n');
      contextSections.push(`AUTHORIZED STUDY HUB:\n${studySnippet}\n${assignSnippet}`);
    }
    if (attachmentText) {
      contextSections.push(`ATTACHED CONTENT (${attachmentName || 'User Attachment'}):\n${String(attachmentText).slice(0, 8000)}`);
    }

    const systemInstruction = [
      `You are the private AI Assistant inside "Memo", a personal productivity workspace belonging to ${req.authUser!.name}.`,
      `CRITICAL PRIVACY RULE: Only reference workspace items included in the AUTHORIZED context below. If the user asks about a section they did not authorize (e.g., Journal when not authorized), politely state that you do not have access unless they toggle that section on.`,
      `CLARITY RULE: Clearly distinguish between saved original content from their workspace (cite the exact title in quotes) and your own AI-generated suggestions, summaries, or action plans.`,
      `Keep tone warm, concise, calm, and practical.`,
      contextSections.length > 0
        ? `\n--- AUTHORIZED WORKSPACE CONTEXT ---\n${contextSections.join('\n\n')}`
        : '\n--- NO WORKSPACE SECTIONS AUTHORIZED FOR THIS QUERY ---',
    ].join('\n');

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const formattedHistory = Array.isArray(history)
        ? history
            .slice(-8)
            .map((m: { role?: string; text?: string }) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text || ''}`)
            .join('\n')
        : '';

      const prompt = formattedHistory
        ? `Previous conversation:\n${formattedHistory}\n\nCurrent User Request:\n${message}`
        : message;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction,
        },
      });

      res.json({
        reply: response.text || 'I could not generate a response for that request.',
      });
    } catch (err) {
      console.error('Gemini API error:', err);
      const msg = err instanceof Error ? err.message : 'AI request failed.';
      res.status(502).json({ error: `AI service error: ${msg}` });
    }
  });

  // ---------- VITE / STATIC SERVING ----------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Memo server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Memo server:', err);
  process.exit(1);
});
