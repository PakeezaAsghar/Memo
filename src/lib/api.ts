import type {
  CalendarMood,
  CollectionKey,
  SessionInfo,
  UserPreferences,
  UserProfile,
  WorkspaceData,
} from '../types/workspace';

const TOKEN_KEY = 'myspace_session_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(path, { ...options, headers });
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text || 'Unexpected server response.' };
  }

  if (!res.ok) {
    const err = new Error(
      typeof data.error === 'string' ? data.error : `Request failed (${res.status})`
    ) as Error & { status?: number; payload?: Record<string, unknown> };
    err.status = res.status;
    err.payload = data;
    throw err;
  }

  return data as T;
}

export const api = {
  login: (email: string, password: string) =>
    apiRequest<{ token: string; user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string) =>
    apiRequest<{ message: string; email: string; verificationPreviewCode?: string }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      }
    ),

  verifyEmail: (email: string, code: string) =>
    apiRequest<{ token: string; user: UserProfile }>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),

  resendVerification: (email: string) =>
    apiRequest<{ message: string; verificationPreviewCode?: string }>(
      '/api/auth/resend-verification',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      }
    ),

  forgotPassword: (email: string) =>
    apiRequest<{ message: string; resetPreviewCode?: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (email: string, code: string, newPassword: string) =>
    apiRequest<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword }),
    }),

  logout: () => apiRequest<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  getSessions: () => apiRequest<{ sessions: SessionInfo[] }>('/api/auth/sessions'),

  revokeSession: (sessionId: string) =>
    apiRequest<{ sessions: SessionInfo[] }>(`/api/auth/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    }),

  deleteAccount: () => apiRequest<{ ok: boolean }>('/api/auth/account', { method: 'DELETE' }),

  getWorkspace: () => apiRequest<{ user: UserProfile; workspace: WorkspaceData }>('/api/workspace'),

  updateProfile: (
    patch: Partial<Pick<UserProfile, 'name' | 'email' | 'avatarUrl' | 'bio'>> & {
      preferences?: Partial<UserPreferences>;
    }
  ) =>
    apiRequest<{ user: UserProfile }>('/api/workspace/profile', {
      method: 'PUT',
      body: JSON.stringify(patch),
    }),

  createItem: <T extends { id?: string }>(collection: CollectionKey, item: T) =>
    apiRequest<{ item: T & { id: string } }>(`/api/workspace/${collection}`, {
      method: 'POST',
      body: JSON.stringify(item),
    }),

  updateItem: <T>(collection: CollectionKey, id: string, patch: Partial<T>) =>
    apiRequest<{ item: T }>(`/api/workspace/${collection}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    }),

  deleteItem: (collection: CollectionKey, id: string) =>
    apiRequest<{ ok: boolean }>(`/api/workspace/${collection}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  bulkReplace: <T>(collection: CollectionKey, items: T[]) =>
    apiRequest<{ items: T[] }>(`/api/workspace/bulk/${collection}`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),

  updateCustomNoteCategories: (categories: string[]) =>
    apiRequest<{ customNoteCategories: string[] }>('/api/workspace/customNoteCategories', {
      method: 'PUT',
      body: JSON.stringify({ categories }),
    }),

  updateCalendarMood: (date: string, mood: CalendarMood | null) =>
    apiRequest<{ calendarMoods: Record<string, CalendarMood> }>('/api/workspace/calendarMoods', {
      method: 'PUT',
      body: JSON.stringify({ date, mood }),
    }),

  updateEmergency: (emergency: WorkspaceData['emergency']) =>
    apiRequest<{ emergency: WorkspaceData['emergency'] }>('/api/workspace/emergency', {
      method: 'PUT',
      body: JSON.stringify(emergency),
    }),

  exportBackup: () =>
    apiRequest<{ exportedAt: string; app: string; user: UserProfile; workspace: WorkspaceData }>(
      '/api/workspace/export',
      { method: 'POST' }
    ),

  restoreBackup: (workspace: WorkspaceData) =>
    apiRequest<{ workspace: WorkspaceData }>('/api/workspace/restore', {
      method: 'POST',
      body: JSON.stringify({ workspace }),
    }),

  uploadFile: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiRequest<{
      name: string;
      storedFilename: string;
      mimeType: string;
      size: number;
      url: string;
      extractedText: string;
    }>('/api/upload', {
      method: 'POST',
      body: form,
    });
  },

  aiChat: (payload: {
    message: string;
    history: Array<{ role: 'user' | 'assistant'; text: string }>;
    authorizedScopes: string[];
    attachmentText?: string;
    attachmentName?: string;
  }) =>
    apiRequest<{ reply: string }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getSharedDocument: (shareToken: string) =>
    apiRequest<{
      document: {
        name: string;
        mimeType: string;
        size: number;
        uploadedAt: string;
        downloadUrl: string;
        previewUrl: string;
      };
    }>(`/api/share/${encodeURIComponent(shareToken)}`),
};

export function withFileAuth(url: string): string {
  if (!url.startsWith('/api/files/')) return url;
  const token = getStoredToken();
  if (!token) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}token=${encodeURIComponent(token)}`;
}
