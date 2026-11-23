import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Database,
  Download,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Shield,
  Sun,
  Trash2,
  Upload,
  User,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { api, withFileAuth } from '../lib/api';
import type { SessionInfo, UserPreferences } from '../types/workspace';

type SettingsTab = 'profile' | 'appearance' | 'privacy' | 'notifications' | 'data';

export function SettingsPage() {
  const {
    user,
    workspace,
    updateProfile,
    updateItem,
    deleteItem,
    restoreWorkspace,
    logout,
    notify,
  } = useWorkspace();

  const [tab, setTab] = useState<SettingsTab>('profile');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setBio(user.bio);
    }
  }, [user]);

  useEffect(() => {
    if (tab === 'privacy') {
      api
        .getSessions()
        .then((res) => setSessions(res.sessions))
        .catch(() => {});
    }
  }, [tab]);

  if (!user || !workspace) return null;
  const prefs = user.preferences;

  const trashedDocs = workspace.documents.filter((d) => d.isTrashed);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({ name, email, bio });
      notify('Profile settings saved');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to update profile', 'error');
    }
  };

  const handleExportAll = async () => {
    const data = await api.exportBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `memo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    notify('Full workspace backup downloaded');
  };

  const handleRestoreFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const nextWs = parsed.workspace || parsed;
      await restoreWorkspace(nextWs);
      notify('Workspace restored from backup');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Invalid backup file', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight">Settings</h1>
        <p className="text-[13px] text-[var(--text-secondary)]">
          Customize your workspace, privacy controls, and backups.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <aside className="lg:col-span-3 rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-2.5 space-y-1">
          {(
            [
              ['profile', 'Profile', User],
              ['appearance', 'Appearance', Palette],
              ['privacy', 'Privacy & Security', Shield],
              ['notifications', 'Notifications', Bell],
              ['data', 'Data Management', Database],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`w-full text-left px-3 py-2.5 rounded-[8px] text-[13px] flex items-center gap-2.5 ${
                tab === id
                  ? 'bg-[var(--sage-soft)] text-[var(--sage-dark)] font-semibold'
                  : 'text-[var(--text-main)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </aside>

        <section className="lg:col-span-9 rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 sm:p-6">
          {tab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-5 max-w-lg">
              <h2 className="text-[18px] font-semibold">Profile Information</h2>
              <div className="flex items-center gap-4">
                <img
                  src={withFileAuth(user.avatarUrl)}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-full object-cover border border-[var(--border-color)]"
                />
                <div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="h-[36px] px-3.5 rounded-[8px] border border-[var(--border-color)] text-[13px] font-semibold hover:bg-[var(--bg-secondary)]"
                  >
                    Change profile image
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const up = await api.uploadFile(f);
                        await updateProfile({ avatarUrl: up.url });
                        notify('Profile photo updated');
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                  Display name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-main)] border border-[var(--border-color)] text-[14px]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-main)] border border-[var(--border-color)] text-[14px]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                  Personal bio
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-3 rounded-[8px] bg-[var(--bg-main)] border border-[var(--border-color)] text-[13px]"
                />
              </div>

              <button
                type="submit"
                className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[13px] font-semibold"
              >
                Save Changes
              </button>
            </form>
          )}

          {tab === 'appearance' && (
            <div className="space-y-6 max-w-lg">
              <h2 className="text-[18px] font-semibold">Appearance</h2>

              <div>
                <p className="text-[13px] font-medium mb-2.5">Theme Mode</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {(
                    [
                      ['light', 'Light', Sun],
                      ['dark', 'Dark', Moon],
                      ['system', 'System', Monitor],
                    ] as const
                  ).map(([val, label, Icon]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => updateProfile({ preferences: { theme: val } })}
                      className={`p-3 rounded-[10px] border flex items-center justify-center gap-2 text-[13px] font-semibold ${
                        prefs.theme === val
                          ? 'bg-[var(--sage-soft)] border-[var(--sage)] text-[var(--sage-dark)]'
                          : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[13px] font-medium mb-2.5">Primary Accent Color</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(
                    [
                      ['sage', 'Sage', '#89977A'],
                      ['rose', 'Dusty Rose', '#C98F91'],
                      ['lavender', 'Lavender', '#8E7FA8'],
                      ['ochre', 'Warm Ochre', '#C79B55'],
                    ] as const
                  ).map(([val, label, hex]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => updateProfile({ preferences: { accentColor: val } })}
                      className={`p-3 rounded-[10px] border flex items-center gap-2 text-[12.5px] font-semibold ${
                        prefs.accentColor === val
                          ? 'border-[var(--sage)] bg-[var(--sage-soft)]/50'
                          : 'border-[var(--border-color)] bg-[var(--bg-main)]'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: hex }}
                      />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[13px] font-medium mb-2.5">Layout Density</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {(['comfortable', 'compact'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => updateProfile({ preferences: { layoutDensity: d } })}
                      className={`p-3 rounded-[10px] border text-[13px] font-semibold capitalize ${
                        prefs.layoutDensity === d
                          ? 'bg-[var(--sage-soft)] border-[var(--sage)] text-[var(--sage-dark)]'
                          : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-[18px] font-semibold">Privacy & Security</h2>
                <p className="text-[12.5px] text-[var(--text-secondary)] mt-1">
                  Manage active sessions and what workspace modules the AI Assistant may read.
                </p>
              </div>

              <div className="space-y-2.5">
                <h3 className="text-[14px] font-semibold">AI Data Access Controls</h3>
                {(
                  [
                    ['aiAllowNotes', 'Allow AI Assistant to read Notes'],
                    ['aiAllowDocuments', 'Allow AI Assistant to read Document metadata & text'],
                    ['aiAllowTasks', 'Allow AI Assistant to read Tasks'],
                    ['aiAllowJournal', 'Allow AI Assistant to read Journal entries'],
                    ['aiAllowStudy', 'Allow AI Assistant to read Study Hub'],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center justify-between p-3 rounded-[9px] bg-[var(--bg-main)] border border-[var(--border-color)] text-[13px] cursor-pointer"
                  >
                    <span>{label}</span>
                    <input
                      type="checkbox"
                      checked={prefs[key]}
                      onChange={() =>
                        updateProfile({
                          preferences: { [key]: !prefs[key] } as Partial<UserPreferences>,
                        })
                      }
                      className="accent-[var(--sage)] w-4 h-4"
                    />
                  </label>
                ))}
              </div>

              <div className="space-y-2.5">
                <h3 className="text-[14px] font-semibold">Active Sessions</h3>
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-[9px] bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-between gap-3 text-[12.5px]"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {s.device} {s.current ? '(Current session)' : ''}
                      </p>
                      <p className="text-[var(--text-muted)] tabular-nums">
                        Last active: {s.lastActiveAt.slice(0, 16).replace('T', ' ')}
                      </p>
                    </div>
                    {!s.current && (
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await api.revokeSession(s.id);
                          setSessions(res.sessions);
                          notify('Session revoked');
                        }}
                        className="px-2.5 py-1 rounded-[7px] text-[var(--error)] hover:bg-[var(--blush)]/45 font-semibold"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="space-y-4 max-w-lg">
              <h2 className="text-[18px] font-semibold">Notification Preferences</h2>
              {(
                [
                  ['taskReminders', 'Task deadline reminders'],
                  ['calendarReminders', 'Calendar event alerts'],
                  ['dailySummaries', 'Morning daily desk summary'],
                  ['weeklyReports', 'Weekly progress & finance digest'],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center justify-between p-3.5 rounded-[9px] bg-[var(--bg-main)] border border-[var(--border-color)] text-[13.5px] cursor-pointer"
                >
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={prefs[key]}
                    onChange={() =>
                      updateProfile({
                        preferences: { [key]: !prefs[key] } as Partial<UserPreferences>,
                      })
                    }
                    className="accent-[var(--sage)] w-4 h-4"
                  />
                </label>
              ))}
            </div>
          )}

          {tab === 'data' && (
            <div className="space-y-6">
              <h2 className="text-[18px] font-semibold">Data Management & Backup</h2>

              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleExportAll}
                  className="p-4 rounded-[10px] bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[var(--sage)] text-left flex items-start gap-3"
                >
                  <Download className="w-5 h-5 text-[var(--sage-dark)] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[14px] font-semibold">Export All Data (Backup)</p>
                    <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                      Download a complete JSON snapshot of your entire workspace.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => restoreInputRef.current?.click()}
                  className="p-4 rounded-[10px] bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[var(--sage)] text-left flex items-start gap-3"
                >
                  <Upload className="w-5 h-5 text-[var(--info)] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[14px] font-semibold">Import / Restore Backup</p>
                    <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                      Restore notes, tasks, journal, and trackers from a JSON backup.
                    </p>
                  </div>
                </button>
                <input
                  ref={restoreInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleRestoreFile(f);
                    e.target.value = '';
                  }}
                />
              </div>

              {/* Document Trash management */}
              <div className="space-y-2.5">
                <h3 className="text-[14px] font-semibold">Document Trash ({trashedDocs.length})</h3>
                {trashedDocs.length === 0 ? (
                  <p className="text-[12.5px] text-[var(--text-muted)]">No files in trash.</p>
                ) : (
                  <div className="space-y-2">
                    {trashedDocs.map((d) => (
                      <div
                        key={d.id}
                        className="p-3 rounded-[9px] bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-between text-[13px]"
                      >
                        <span className="truncate">{d.name}</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => updateItem('documents', d.id, { isTrashed: false })}
                            className="text-[var(--sage-dark)] font-semibold flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Restore
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteItem('documents', d.id)}
                            className="text-[var(--error)] font-semibold"
                          >
                            Purge
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Delete Account */}
              <div className="pt-4 border-t border-[var(--border-color)]">
                <h3 className="text-[14px] font-semibold text-[var(--error)]">Danger Zone</h3>
                <p className="text-[12.5px] text-[var(--text-secondary)] mt-1">
                  Permanently delete your account, uploaded files, and all personal workspace data.
                </p>
                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="mt-3 h-[38px] px-4 rounded-[9px] bg-[var(--blush)] text-[#8A4E50] text-[13px] font-semibold flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </button>
                ) : (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await api.deleteAccount();
                        await logout();
                      }}
                      className="h-[38px] px-4 rounded-[9px] bg-[var(--error)] text-white text-[13px] font-semibold"
                    >
                      Confirm Permanent Deletion
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="h-[38px] px-4 rounded-[9px] border border-[var(--border-color)] text-[13px]"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
