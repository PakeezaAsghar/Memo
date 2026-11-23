import React, { useState } from 'react';
import {
  Bell,
  Bookmark,
  BookOpen,
  Briefcase,
  Calendar,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  FileText,
  Film,
  FolderKanban,
  GraduationCap,
  Heart,
  HelpCircle,
  Home,
  Image as ImageIcon,
  Library,
  Lightbulb,
  LogOut,
  Menu,
  NotebookPen,
  Plus,
  Settings,
  ShieldAlert,
  Sparkles,
  StickyNote,
  Target,
  Wallet,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import type { PageId } from '../types/workspace';
import { BrandMark } from './BrandMark';
import { TimedMoodBar } from './MoodChecker';
import { withFileAuth } from '../lib/api';

interface NavEntry {
  id: PageId;
  label: string;
  icon: LucideIcon;
}

const MAIN_NAV: NavEntry[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
  { id: 'journal', label: 'Journal', icon: NotebookPen },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'finance', label: 'Finance', icon: Wallet },
];

const EXPLORE_NAV: NavEntry[] = [
  { id: 'study', label: 'Study Hub', icon: GraduationCap },
  { id: 'knowledge', label: 'Knowledge Library', icon: Library },
  { id: 'career', label: 'Career Hub', icon: Briefcase },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'habits', label: 'Goals & Habits', icon: Target },
  { id: 'reading', label: 'Reading Tracker', icon: BookOpen },
  { id: 'media', label: 'Music & Movies', icon: Film },
  { id: 'ideas', label: 'Idea Bank', icon: Lightbulb },
  { id: 'gallery', label: 'Gallery', icon: ImageIcon },
];

const MORE_NAV: NavEntry[] = [
  { id: 'ai', label: 'AI Assistant', icon: Sparkles },
  { id: 'resources', label: 'Saved Resources', icon: Heart },
  { id: 'emergency', label: 'Emergency Info', icon: ShieldAlert },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const PAGE_TITLES: Record<PageId, string> = {
  dashboard: 'Dashboard',
  notes: 'Notes',
  documents: 'Documents',
  tasks: 'Tasks',
  bookmarks: 'Bookmarks',
  journal: 'Journal',
  calendar: 'Calendar',
  finance: 'Finance',
  study: 'Study Hub',
  knowledge: 'Knowledge Library',
  career: 'Career Hub',
  projects: 'Projects',
  habits: 'Goals & Habits',
  reading: 'Reading Tracker',
  media: 'Music & Movies',
  ideas: 'Idea Bank',
  gallery: 'Personal Gallery',
  ai: 'AI Assistant',
  resources: 'Saved Resources',
  emergency: 'Emergency Information',
  settings: 'Settings',
  help: 'Help & Support',
};

export function getGreeting(): string {
  const hr = new Date().getHours();
  if (hr < 12) return 'Good morning';
  if (hr < 17) return 'Good afternoon';
  return 'Good evening';
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    user,
    workspace,
    activePage,
    setActivePage,
    openQuickCapture,
    updateItem,
    logout,
  } = useWorkspace();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(true);
  const [moreOpen, setMoreOpen] = useState(true);
  const [quickAddMenuOpen, setQuickAddMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const firstName = user?.name?.split(' ')[0] || 'Friend';
  const notifications = workspace?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.read).length;
  const compact = user?.preferences?.layoutDensity === 'compact';

  const navigate = (page: PageId) => {
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  const renderNavButton = (item: NavEntry) => {
    const Icon = item.icon;
    const isActive = activePage === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => navigate(item.id)}
        className={`w-full h-[38px] px-2.5 rounded-[9px] flex items-center gap-2.5 text-[13px] transition-colors ${
          isActive
            ? 'bg-[var(--sage-soft)] text-[var(--sage-dark)] font-semibold'
            : 'text-[var(--text-main)]/85 hover:bg-[var(--bg-secondary)] font-medium'
        }`}
      >
        <Icon
          className={`w-[17px] h-[17px] shrink-0 ${
            isActive ? 'text-[var(--sage-dark)]' : 'text-[var(--text-secondary)]'
          }`}
        />
        <span className="truncate">{item.label}</span>
      </button>
    );
  };

  const SidebarBody = () => (
    <div className="flex flex-col h-full bg-[var(--bg-sidebar)] border-r border-[var(--border-color)]">
      {/* Top branding + user greeting */}
      <div className="px-4 pt-5 pb-4 border-b border-[var(--border-color)]">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('dashboard')}
            className="text-left focus:outline-none"
          >
            <BrandMark />
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation"
            className="lg:hidden w-8 h-8 rounded-[8px] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2.5">
          <img
            src={withFileAuth(user?.avatarUrl || '/src/assets/images/avatar_owner_1795116544586.jpg')}
            alt={user?.name || 'Profile'}
            referrerPolicy="no-referrer"
            className="w-9 h-9 rounded-full object-cover border border-[var(--border-color)] shrink-0"
          />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[var(--text-main)] truncate">
              {getGreeting()}, {firstName}!
            </p>
            <p className="text-[11px] text-[var(--text-secondary)] truncate">
              Dream big, plan well.
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable navigation groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        <div>
          <p className="px-2.5 mb-1.5 text-[11px] font-semibold tracking-wider text-[var(--text-muted)]">
            MAIN
          </p>
          <div className="space-y-0.5">{MAIN_NAV.map(renderNavButton)}</div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setExploreOpen((v) => !v)}
            className="w-full px-2.5 mb-1.5 flex items-center justify-between text-[11px] font-semibold tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)]"
          >
            <span>EXPLORE</span>
            {exploreOpen ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
          {exploreOpen && <div className="space-y-0.5">{EXPLORE_NAV.map(renderNavButton)}</div>}
        </div>

        <div>
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className="w-full px-2.5 mb-1.5 flex items-center justify-between text-[11px] font-semibold tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)]"
          >
            <span>MORE</span>
            {moreOpen ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
          {moreOpen && <div className="space-y-0.5">{MORE_NAV.map(renderNavButton)}</div>}
        </div>
      </nav>

      {/* Bottom utilities */}
      <div className="p-3 border-t border-[var(--border-color)] space-y-0.5">
        <button
          type="button"
          onClick={() => navigate('help')}
          className={`w-full h-[38px] px-2.5 rounded-[9px] flex items-center gap-2.5 text-[13px] transition-colors ${
            activePage === 'help'
              ? 'bg-[var(--sage-soft)] text-[var(--sage-dark)] font-semibold'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-main)] font-medium'
          }`}
        >
          <HelpCircle className="w-[17px] h-[17px] shrink-0" />
          <span>Help & Support</span>
        </button>
        <button
          type="button"
          onClick={logout}
          className="w-full h-[38px] px-2.5 rounded-[9px] flex items-center gap-2.5 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--blush)]/45 hover:text-[var(--error)] transition-colors"
        >
          <LogOut className="w-[17px] h-[17px] shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex">
      {/* Desktop fixed 230px sidebar */}
      <aside className="hidden lg:block w-[230px] fixed inset-y-0 left-0 z-30">
        <SidebarBody />
      </aside>

      {/* Mobile slide-out drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-[#39362F]/35 backdrop-blur-[1px]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setMobileMenuOpen(false);
          }}
        >
          <div className="w-[260px] h-full">
            <SidebarBody />
          </div>
        </div>
      )}

      {/* Main viewport */}
      <div className="flex-1 lg:pl-[230px] flex flex-col min-w-0">
        {/* Top utility bar */}
        <header className="sticky top-0 z-20 h-[62px] bg-[var(--bg-main)]/92 backdrop-blur-sm border-b border-[var(--border-color)] px-4 sm:px-6 flex items-center justify-between gap-3">
          {/* Left: Breadcrumb / page title */}
          <div className="flex items-center gap-2.5 min-w-0 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden w-9 h-9 rounded-[8px] flex items-center justify-center text-[var(--text-main)] hover:bg-[var(--bg-secondary)]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 text-[13px] min-w-0">
              <button
                type="button"
                onClick={() => navigate('dashboard')}
                className="hidden sm:inline text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              >
                Memo
              </button>
              <span className="hidden sm:inline text-[var(--text-muted)]">/</span>
              <span className="font-semibold text-[var(--text-main)] truncate">
                {PAGE_TITLES[activePage]}
              </span>
            </div>
          </div>

          {/* Right: Quick Add, Notifications, Profile */}
          <div className="flex items-center gap-1.5 shrink-0 relative">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setQuickAddMenuOpen((v) => !v);
                  setNotifOpen(false);
                }}
                aria-label="Quick add"
                className="h-[36px] px-3 rounded-[9px] bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[13px] font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Quick Add</span>
              </button>

              {quickAddMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 py-1.5 rounded-[10px] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-[0_12px_28px_rgba(57,54,47,0.12)] z-40"
                  onMouseLeave={() => setQuickAddMenuOpen(false)}
                >
                  {(
                    [
                      ['note', 'New note'],
                      ['task', 'New task'],
                      ['document', 'Upload document'],
                      ['link', 'Save a link'],
                      ['journal', 'New journal entry'],
                      ['idea', 'New idea'],
                      ['event', 'New event'],
                      ['media', 'Save music or movie'],
                    ] as const
                  ).map(([kind, label]) => (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => {
                        setQuickAddMenuOpen(false);
                        openQuickCapture(kind);
                      }}
                      className="w-full text-left px-3.5 py-2 text-[13px] text-[var(--text-main)] hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((v) => !v);
                  setQuickAddMenuOpen(false);
                }}
                aria-label="Notifications"
                className="w-9 h-9 rounded-[8px] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-main)] transition-colors relative"
              >
                <Bell className="w-[18px] h-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--rose)]" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-[0_14px_32px_rgba(57,54,47,0.12)] z-40 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between">
                    <span className="text-[13px] font-semibold">Notifications</span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {unreadCount} unread
                    </span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-[var(--border-color)]">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-[13px] text-[var(--text-secondary)] text-center">
                        All caught up.
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={async () => {
                            if (!n.read) {
                              await updateItem('notifications', n.id, { read: true });
                            }
                            setNotifOpen(false);
                            navigate(n.targetPage);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-[var(--bg-secondary)]/60 transition-colors ${
                            !n.read ? 'bg-[var(--sage-soft)]/35' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[13px] font-semibold text-[var(--text-main)] truncate">
                              {n.title}
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)] shrink-0">
                              {n.time}
                            </span>
                          </div>
                          <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                            {n.detail}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate('settings')}
              title="Account & Settings"
              className="w-9 h-9 rounded-full overflow-hidden border border-[var(--border-color)] hover:border-[var(--sage)] transition-colors shrink-0"
            >
              <img
                src={withFileAuth(
                  user?.avatarUrl || '/src/assets/images/avatar_owner_1795116544586.jpg'
                )}
                alt={user?.name || 'User avatar'}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        </header>

        {/* Main page content */}
        <main
          className={`flex-1 w-full max-w-[1320px] mx-auto ${
            compact ? 'px-4 pt-4 sm:px-5' : 'px-4 pt-4 sm:px-6 sm:pt-5 lg:px-8 lg:pt-5'
          } pb-24 lg:pb-10`}
        >
          {children}
        </main>
      </div>

      {/* Timed mood check-in bar after 1-2 minutes on site */}
      <TimedMoodBar />

      {/* Mobile Floating Action Button */}
      <button
        type="button"
        onClick={() => openQuickCapture('note')}
        aria-label="Quick capture"
        className="lg:hidden fixed bottom-5 right-5 z-30 w-12 h-12 rounded-full bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white shadow-[0_8px_20px_rgba(100,118,91,0.35)] flex items-center justify-center transition-transform active:scale-95"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}
