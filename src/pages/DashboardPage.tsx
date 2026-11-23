import React, { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  Calendar as CalendarIcon,
  Check,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderPlus,
  NotebookPen,
  Plus,
  Sparkles,
  StickyNote,
  Target,
  Upload,
  Wallet,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { getGreeting } from '../components/AppShell';
import { MOOD_OPTIONS, MoodFace } from '../components/MoodChecker';
import type { PageId } from '../types/workspace';

const DAILY_QUOTES = [
  {
    text: '“A little progress each day adds up to big results.”',
    fillClass: 'fill-[var(--blush)]',
  },
  {
    text: '“Small calm steps build the life you’re quietly creating.”',
    fillClass: 'fill-[#FBF0C9] dark:fill-[#3D3520]',
  },
  {
    text: '“Grow at your own steady pace, like leaves in quiet sun.”',
    fillClass: 'fill-[var(--sage-soft)]',
  },
  {
    text: '“Do what you can today with care, and let that be enough.”',
    fillClass: 'fill-[var(--lavender)]',
  },
  {
    text: '“Clarity comes from keeping your favorite things in one peaceful place.”',
    fillClass: 'fill-[#D8EDE4] dark:fill-[#22342E]',
  },
  {
    text: '“Rested minds notice the gentle details that others rush past.”',
    fillClass: 'fill-[var(--peach)]',
  },
  {
    text: '“Every quiet habit you keep is a promise kept to yourself.”',
    fillClass: 'fill-[#DDEBF7] dark:fill-[#24313D]',
  },
];

const HEX_TAG_PATH =
  'M 73,39 Q 90,24 112,31 L 159,47 Q 181,54 186,77 L 196,125 Q 201,148 184,163 L 147,197 Q 130,212 108,205 L 61,189 Q 39,182 34,159 L 24,111 Q 19,88 36,73 Z';
const HEX_TAG_WITH_HOLE = `${HEX_TAG_PATH} M 94,43 m -6.5,0 a 6.5,6.5 0 1,0 13,0 a 6.5,6.5 0 1,0 -13,0`;

export function DashboardPage() {
  const { user, workspace, setActivePage, openQuickCapture, updateItem, updateCalendarMood, notify } =
    useWorkspace();
  const [miniCalDate, setMiniCalDate] = useState(() => new Date());
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % DAILY_QUOTES.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [quoteIdx]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const firstName = user?.name?.split(' ')[0] || 'Friend';

  const featureCards: Array<{
    title: string;
    subtitle: string;
    page: PageId;
    icon: React.ComponentType<{ className?: string }>;
    tone: string;
  }> = [
    {
      title: 'Notes',
      subtitle: 'Capture ideas.',
      page: 'notes',
      icon: StickyNote,
      tone: 'bg-[var(--sage-soft)] text-[var(--sage-dark)]',
    },
    {
      title: 'Documents',
      subtitle: 'Your files.',
      page: 'documents',
      icon: FileText,
      tone: 'bg-[#E5ECF4] text-[#4C6584]',
    },
    {
      title: 'Tasks',
      subtitle: 'Stay on track.',
      page: 'tasks',
      icon: CheckSquare,
      tone: 'bg-[var(--sage-soft)] text-[var(--sage-dark)]',
    },
    {
      title: 'Bookmarks',
      subtitle: 'Save links.',
      page: 'bookmarks',
      icon: Bookmark,
      tone: 'bg-[var(--pale-yellow)] text-[#8D6E33]',
    },
    {
      title: 'Journal',
      subtitle: 'Write & reflect.',
      page: 'journal',
      icon: NotebookPen,
      tone: 'bg-[var(--blush)] text-[var(--rose)]',
    },
    {
      title: 'Calendar',
      subtitle: 'Plan your days.',
      page: 'calendar',
      icon: CalendarIcon,
      tone: 'bg-[var(--lavender)] text-[#6C5E85]',
    },
    {
      title: 'Finance',
      subtitle: 'Track expenses.',
      page: 'finance',
      icon: Wallet,
      tone: 'bg-[var(--peach)] text-[#8A5F3E]',
    },
    {
      title: 'More Tools',
      subtitle: 'Explore more.',
      page: 'study',
      icon: Sparkles,
      tone: 'bg-[var(--lavender)] text-[#6C5E85]',
    },
  ];

  const todaysTasks = useMemo(() => {
    if (!workspace) return [];
    const todayOnes = workspace.tasks.filter((t) => t.dueDate === todayStr || !t.completed);
    return todayOnes.slice(0, 4);
  }, [workspace, todayStr]);

  const upcomingDeadlines = useMemo(() => {
    if (!workspace) return [];
    const items: Array<{ id: string; title: string; date: string; source: string; page: PageId }> = [];
    workspace.tasks
      .filter((t) => !t.completed && t.dueDate >= todayStr)
      .forEach((t) =>
        items.push({ id: t.id, title: t.title, date: t.dueDate, source: 'Task', page: 'tasks' })
      );
    workspace.studyAssignments
      .filter((a) => !a.completed)
      .forEach((a) =>
        items.push({ id: a.id, title: a.title, date: a.dueDate, source: 'Study', page: 'study' })
      );
    return items.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  }, [workspace, todayStr]);

  const recentNotes = useMemo(
    () =>
      (workspace?.notes || [])
        .filter((n) => !n.isArchived)
        .slice(0, 3),
    [workspace]
  );

  const recentDocs = useMemo(
    () =>
      (workspace?.documents || [])
        .filter((d) => !d.isTrashed)
        .slice(0, 3),
    [workspace]
  );

  const habits = workspace?.habits || [];

  // Mini calendar 7-day curved arc computation centered on miniCalDate
  const arcDays = useMemo(() => {
    const offsets = [-3, -2, -1, 0, 1, 2, 3];
    const weekdayLetters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return offsets.map((offset) => {
      const d = new Date(
        miniCalDate.getFullYear(),
        miniCalDate.getMonth(),
        miniCalDate.getDate() + offset
      );
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      return {
        offset,
        date: d,
        dayNum: d.getDate(),
        weekday: weekdayLetters[d.getDay()],
        iso,
      };
    });
  }, [miniCalDate]);
  const eventDates = useMemo(() => {
    const set = new Set<string>();
    workspace?.events.forEach((e) => set.add(e.date));
    workspace?.tasks.forEach((t) => set.add(t.dueDate));
    return set;
  }, [workspace]);

  const toggleHabitToday = async (habitId: string, dates: string[]) => {
    const has = dates.includes(todayStr);
    const nextDates = has ? dates.filter((d) => d !== todayStr) : [...dates, todayStr];
    await updateItem('habits', habitId, { completedDates: nextDates });
    notify(has ? 'Habit unmarked for today' : 'Habit checked off!');
  };

  return (
    <div className="space-y-6">
      {/* Top welcome section */}
      <section className="rounded-[14px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="max-w-xl">
          <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[var(--text-main)] leading-tight">
            {getGreeting()}, {firstName} ✨
          </h1>
          <p className="text-[14px] text-[var(--text-secondary)] mt-1.5 leading-relaxed">
            Your little corner of the internet. Everything in its place.
          </p>

          {/* Quick Capture strip */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openQuickCapture('note')}
              className="h-[36px] px-3 rounded-[9px] bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[13px] font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Write a note
            </button>
            <button
              type="button"
              onClick={() => openQuickCapture('task')}
              className="h-[36px] px-3 rounded-[9px] bg-[var(--bg-main)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] text-[13px] font-semibold text-[var(--text-main)] flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <CheckSquare className="w-3.5 h-3.5 text-[var(--sage-dark)]" />
              Add a task
            </button>
            <button
              type="button"
              onClick={() => openQuickCapture('link')}
              className="h-[36px] px-3 rounded-[9px] bg-[var(--bg-main)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] text-[13px] font-semibold text-[var(--text-main)] flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Bookmark className="w-3.5 h-3.5 text-[var(--warning)]" />
              Save a link
            </button>
            <button
              type="button"
              onClick={() => openQuickCapture('document')}
              className="h-[36px] px-3 rounded-[9px] bg-[var(--bg-main)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] text-[13px] font-semibold text-[var(--text-main)] flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5 text-[var(--info)]" />
              Upload a file
            </button>
          </div>
        </div>

        {/* Small cozy desk editorial illustration */}
        <div className="w-full md:w-[220px] shrink-0 rounded-[12px] overflow-hidden border border-[var(--border-color)] bg-[var(--bg-secondary)]">
          <img
            src="/src/assets/images/desk_editorial_1795116544232.jpg"
            alt="Cozy desk with open notebook, flowers, and laptop"
            referrerPolicy="no-referrer"
            className="w-full h-[146px] object-cover"
          />
        </div>
      </section>

      {/* Inspirational banner / Stacked Quote Tags */}
      <section className="pt-8 pb-2 flex justify-center">
        <button
          type="button"
          onClick={() => setQuoteIdx((prev) => (prev + 1) % DAILY_QUOTES.length)}
          aria-label="Show next quote card"
          title="Click to flip to the next quote card"
          className="group relative w-[220px] h-[220px] text-center focus:outline-none"
        >
          {/* Back stacked quote tag 2 (deepest) */}
          <svg
            viewBox="0 0 220 220"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 w-full h-full -translate-x-5 translate-y-2 -rotate-[12deg] drop-shadow-[0_6px_12px_rgba(57,54,47,0.10)] transition-transform duration-300 group-hover:-translate-x-6 group-hover:-rotate-[15deg]"
          >
            <path
              d={HEX_TAG_WITH_HOLE}
              fillRule="evenodd"
              className={`transition-colors duration-500 ${
                DAILY_QUOTES[(quoteIdx + 2) % DAILY_QUOTES.length].fillClass
              }`}
            />
          </svg>

          {/* Back stacked quote tag 1 (middle) */}
          <svg
            viewBox="0 0 220 220"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 w-full h-full -translate-x-2.5 translate-y-1 -rotate-[6deg] drop-shadow-[0_8px_14px_rgba(57,54,47,0.12)] transition-transform duration-300 group-hover:-translate-x-3.5 group-hover:-rotate-[8deg]"
          >
            <path
              d={HEX_TAG_WITH_HOLE}
              fillRule="evenodd"
              className={`transition-colors duration-500 ${
                DAILY_QUOTES[(quoteIdx + 1) % DAILY_QUOTES.length].fillClass
              }`}
            />
          </svg>

          {/* Front quote tag card */}
          <div className="relative w-full h-full transition-transform duration-300 group-hover:rotate-1 group-hover:-translate-y-0.5">
            <svg
              viewBox="0 0 220 220"
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 w-full h-full drop-shadow-[0_10px_18px_rgba(57,54,47,0.14)]"
            >
              <path
                d={HEX_TAG_WITH_HOLE}
                fillRule="evenodd"
                className={`transition-colors duration-500 ${DAILY_QUOTES[quoteIdx].fillClass}`}
              />
              <circle
                cx="94"
                cy="43"
                r="6.5"
                fill="none"
                stroke="rgba(57,54,47,0.16)"
                strokeWidth="1.2"
              />
            </svg>

            {/* Knotted coral-pink string through eyelet hole */}
            <svg
              viewBox="0 -48 220 268"
              aria-hidden="true"
              className="pointer-events-none absolute -top-[48px] left-0 w-[220px] h-[268px] z-20 drop-shadow-[0_2px_3px_rgba(57,54,47,0.15)]"
            >
              <path
                d="M 94,43 C 90,28 91,15 96,7"
                fill="none"
                stroke="#F48A87"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 94,43 C 98,30 100,19 97,8"
                fill="none"
                stroke="#F48A87"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 90,11 C 85,5 94,-2 101,5 C 105,9 97,16 90,11 Z"
                fill="none"
                stroke="#F48A87"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 96,4 C 92,-12 91,-31 103,-42"
                fill="none"
                stroke="#F48A87"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <path
                d="M 99,7 C 107,-5 117,-18 126,-29"
                fill="none"
                stroke="#F48A87"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>

            {/* Quote copy */}
            <div className="relative z-10 w-full h-full px-10 pt-10 pb-6 flex items-center justify-center">
              <p
                key={quoteIdx}
                className="font-editorial text-[14.5px] sm:text-[15.5px] leading-snug text-[#3D3A36] dark:text-[var(--text-main)] max-w-[146px]"
              >
                {DAILY_QUOTES[quoteIdx].text}
              </p>
            </div>
          </div>
        </button>
      </section>

      {/* Main 8-card feature grid */}
      <section aria-label="Workspace shortcuts">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.title}
                type="button"
                onClick={() => setActivePage(card.page)}
                className="text-left p-4 rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] hover:-translate-y-0.5 hover:border-[var(--sage)]/60 transition-all duration-150 flex items-start gap-3.5 group"
              >
                <div
                  className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 ${card.tone}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-[15px] font-semibold text-[var(--text-main)] group-hover:text-[var(--sage-dark)] transition-colors">
                    {card.title}
                  </h2>
                  <p className="text-[12.5px] text-[var(--text-secondary)] mt-0.5 truncate">
                    {card.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Lower two-column section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left column */}
        <div className="lg:col-span-7 space-y-5">
          {/* Today's tasks */}
          <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-[16px] font-semibold text-[var(--text-main)]">Today’s tasks</h2>
              <button
                type="button"
                onClick={() => setActivePage('tasks')}
                className="text-[12px] font-semibold text-[var(--sage-dark)] hover:underline"
              >
                View all
              </button>
            </div>
            {todaysTasks.length === 0 ? (
              <p className="text-[13px] text-[var(--text-secondary)] py-4">
                No tasks scheduled yet. Add one using Quick Capture above.
              </p>
            ) : (
              <div className="divide-y divide-[var(--border-color)]">
                {todaysTasks.map((task) => (
                  <div key={task.id} className="py-2.5 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        updateItem('tasks', task.id, { completed: !task.completed })
                      }
                      className="flex items-center gap-3 text-left min-w-0 flex-1"
                    >
                      <span
                        className={`w-[18px] h-[18px] rounded-[5px] border flex items-center justify-center shrink-0 transition-colors ${
                          task.completed
                            ? 'bg-[var(--sage)] border-[var(--sage)] text-white'
                            : 'border-[var(--text-muted)]'
                        }`}
                      >
                        {task.completed && <Check className="w-3 h-3" />}
                      </span>
                      <span
                        className={`text-[13.5px] truncate ${
                          task.completed
                            ? 'line-through text-[var(--text-muted)]'
                            : 'text-[var(--text-main)]'
                        }`}
                      >
                        {task.title}
                      </span>
                    </button>
                    <span className="text-[11px] text-[var(--text-muted)] tabular-nums shrink-0">
                      {task.category} · {task.dueDate}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming deadlines */}
          <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-[16px] font-semibold text-[var(--text-main)]">
                Upcoming deadlines
              </h2>
              <button
                type="button"
                onClick={() => setActivePage('calendar')}
                className="text-[12px] font-semibold text-[var(--sage-dark)] hover:underline"
              >
                Open calendar
              </button>
            </div>
            {upcomingDeadlines.length === 0 ? (
              <p className="text-[13px] text-[var(--text-secondary)] py-3">
                Nothing urgent coming up.
              </p>
            ) : (
              <div className="divide-y divide-[var(--border-color)]">
                {upcomingDeadlines.map((item) => (
                  <button
                    key={`${item.source}-${item.id}`}
                    type="button"
                    onClick={() => setActivePage(item.page)}
                    className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-[var(--bg-secondary)]/45 rounded-[6px] px-1 transition-colors"
                  >
                    <span className="text-[13.5px] font-medium text-[var(--text-main)] truncate">
                      {item.title}
                    </span>
                    <span className="text-[12px] text-[var(--text-secondary)] tabular-nums shrink-0">
                      {item.source} · {item.date}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recently created notes */}
          <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-[16px] font-semibold text-[var(--text-main)]">
                Recently created notes
              </h2>
              <button
                type="button"
                onClick={() => setActivePage('notes')}
                className="text-[12px] font-semibold text-[var(--sage-dark)] hover:underline"
              >
                Open notebook
              </button>
            </div>
            {recentNotes.length === 0 ? (
              <p className="text-[13px] text-[var(--text-secondary)] py-3">No notes yet.</p>
            ) : (
              <div className="grid sm:grid-cols-3 gap-3">
                {recentNotes.map((note) => (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => setActivePage('notes')}
                    className="text-left p-3 rounded-[10px] bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[var(--sage)] transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <p className="text-[13.5px] font-semibold text-[var(--text-main)] line-clamp-1">
                        {note.title}
                      </p>
                      <p className="text-[12px] text-[var(--text-secondary)] mt-1 line-clamp-2">
                        {note.plainText || 'Empty note'}
                      </p>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mt-2.5 tabular-nums">
                      {note.category} · {note.updatedAt.slice(0, 10)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-5 space-y-5">
          {/* Mini calendar */}
          <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 overflow-hidden">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="flex items-baseline gap-2 leading-none">
                <span className="text-[24px] sm:text-[26px] font-bold tracking-tight text-[var(--text-main)]">
                  {miniCalDate.toLocaleDateString('en-US', { month: 'long' })}
                </span>
                <span className="text-[15px] sm:text-[16px] font-normal tabular-nums text-[var(--text-muted)]">
                  {miniCalDate.getFullYear()}
                </span>
              </h2>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      setMiniCalDate(
                        new Date(
                          miniCalDate.getFullYear(),
                          miniCalDate.getMonth(),
                          miniCalDate.getDate() - 7
                        )
                      )
                    }
                    aria-label="Previous week"
                    className="w-7 h-7 rounded-[7px] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setMiniCalDate(
                        new Date(
                          miniCalDate.getFullYear(),
                          miniCalDate.getMonth(),
                          miniCalDate.getDate() + 7
                        )
                      )
                    }
                    aria-label="Next week"
                    className="w-7 h-7 rounded-[7px] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-7 text-center text-[11px] text-[var(--text-muted)] mb-1">
              {arcDays.map((item) => {
                const abs = Math.abs(item.offset);
                const yClasses = [
                  'translate-y-0',
                  'translate-y-[2.5px]',
                  'translate-y-[10px]',
                  'translate-y-[22px]',
                ];
                const opacities = ['opacity-100', 'opacity-85', 'opacity-65', 'opacity-35'];
                return (
                  <div
                    key={`wd-${item.iso}`}
                    className={`py-1 font-medium transition-transform duration-200 ${yClasses[abs]} ${opacities[abs]} ${
                      item.offset === 0 ? 'text-[var(--text-main)] font-semibold' : ''
                    }`}
                  >
                    {item.weekday}
                  </div>
                );
              })}
            </div>

            <div className="relative h-[86px] -mx-5 px-5">
              <svg
                viewBox="0 0 350 86"
                preserveAspectRatio="none"
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 w-full h-full"
              >
                <defs>
                  <linearGradient id="memo-cal-arc-fill" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--bg-secondary)" stopOpacity="0" />
                    <stop offset="18%" stopColor="var(--bg-secondary)" stopOpacity="0.45" />
                    <stop offset="50%" stopColor="var(--bg-secondary)" stopOpacity="0.85" />
                    <stop offset="82%" stopColor="var(--bg-secondary)" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="var(--bg-secondary)" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="memo-cal-arc-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--border-color)" stopOpacity="0" />
                    <stop offset="22%" stopColor="var(--border-color)" stopOpacity="0.55" />
                    <stop offset="50%" stopColor="var(--border-color)" stopOpacity="0.9" />
                    <stop offset="78%" stopColor="var(--border-color)" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="var(--border-color)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0,36 Q 175,-24 350,36 L 350,84 Q 175,24 0,84 Z"
                  fill="url(#memo-cal-arc-fill)"
                />
                <path
                  d="M 0,36 Q 175,-24 350,36"
                  fill="none"
                  stroke="url(#memo-cal-arc-stroke)"
                  strokeWidth="1"
                />
                <path
                  d="M 0,84 Q 175,24 350,84"
                  fill="none"
                  stroke="url(#memo-cal-arc-stroke)"
                  strokeWidth="1"
                />
              </svg>

              <div className="relative z-10 grid grid-cols-7 text-center pt-[6px]">
                {arcDays.map((item) => {
                  const abs = Math.abs(item.offset);
                  const yClasses = [
                    'translate-y-0',
                    'translate-y-[2.5px]',
                    'translate-y-[10px]',
                    'translate-y-[22px]',
                  ];
                  const opacities = ['opacity-100', 'opacity-90', 'opacity-70', 'opacity-35'];
                  const isCenter = item.offset === 0;
                  const isToday = item.iso === todayStr;
                  const hasItem = eventDates.has(item.iso);

                  return (
                    <div
                      key={item.iso}
                      className={`h-[48px] flex items-center justify-center transition-transform duration-200 ${yClasses[abs]} ${opacities[abs]}`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (isCenter) {
                            setActivePage('calendar');
                          } else {
                            setMiniCalDate(item.date);
                          }
                        }}
                        className={`relative w-10 h-10 rounded-full text-[13px] tabular-nums flex flex-col items-center justify-center transition-all ${
                          isCenter
                            ? 'bg-[var(--sage)] text-white font-bold shadow-[0_6px_14px_rgba(128,144,118,0.28)]'
                            : isToday
                              ? 'ring-1 ring-[var(--sage)] text-[var(--sage-dark)] font-semibold hover:bg-[var(--bg-card)]/70'
                              : 'text-[var(--text-main)] font-medium hover:bg-[var(--bg-card)]/70'
                        }`}
                      >
                        <span>{item.dayNum}</span>
                        {hasItem && (
                          <span
                            className={`w-1 h-1 rounded-full -mt-0.5 ${
                              isCenter ? 'bg-white/90' : 'bg-[var(--rose)]'
                            }`}
                          />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mood emojis directly below the date trail */}
            {(() => {
              const activeMoodDate = arcDays[3]?.iso || todayStr;
              const activeMood = workspace?.calendarMoods?.[activeMoodDate];
              return (
                <div className="mt-2 pt-2.5 flex items-center justify-center gap-3 sm:gap-4">
                  {MOOD_OPTIONS.map((m) => {
                    const active = activeMood === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        aria-label={m.label}
                        title={m.label}
                        aria-pressed={active}
                        onClick={async () => {
                          try {
                            const nextMood = active ? null : m.id;
                            await updateCalendarMood(activeMoodDate, nextMood);
                            notify(nextMood ? `Mood logged: ${m.label}` : 'Mood cleared');
                          } catch {
                            notify('Unable to save mood', 'error');
                          }
                        }}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-transform duration-150 hover:scale-110 ${
                          active ? m.ringClass : 'opacity-85 hover:opacity-100'
                        }`}
                      >
                        <MoodFace mood={m.id} size="md" />
                      </button>
                    );
                  })}
                </div>
              );
            })()}

            <div className="mt-3 pt-3 border-t border-[var(--border-color)] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => openQuickCapture('note')}
                className="group inline-flex items-center gap-2 text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-main)] transition-colors py-1"
              >
                <NotebookPen className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--sage-dark)] transition-colors" />
                <span>Add a note...</span>
              </button>
              <button
                type="button"
                onClick={() => openQuickCapture('event')}
                className="h-[32px] px-3.5 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--sage-soft)] border border-[var(--border-color)] hover:border-[var(--sage)]/50 text-[12.5px] font-semibold text-[var(--text-main)] hover:text-[var(--sage-dark)] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Event</span>
              </button>
            </div>
          </div>

          {/* Habit completion */}
          <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[var(--sage-dark)]" />
                <h2 className="text-[15px] font-semibold text-[var(--text-main)]">
                  Habit completion
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActivePage('habits')}
                className="text-[12px] font-semibold text-[var(--sage-dark)] hover:underline"
              >
                Track
              </button>
            </div>
            <div>
              {habits.length === 0 ? (
                <p className="text-[13px] text-[var(--text-secondary)] py-3">
                  No habits tracked yet.
                </p>
              ) : (
                (() => {
                  const visibleHabits = habits.slice(0, 4);
                  return visibleHabits.map((habit, idx) => {
                    const doneToday = habit.completedDates.includes(todayStr);
                    const hasNext = idx < visibleHabits.length - 1;
                    const nextDone = hasNext
                      ? visibleHabits[idx + 1].completedDates.includes(todayStr)
                      : false;

                    let lineCls = 'bg-[var(--border-color)]';
                    if (doneToday && nextDone) {
                      lineCls = 'bg-[var(--success)]';
                    } else if (doneToday && !nextDone) {
                      lineCls = 'bg-gradient-to-b from-[var(--success)] to-[var(--border-color)]';
                    } else if (!doneToday && nextDone) {
                      lineCls = 'bg-gradient-to-b from-[var(--border-color)] to-[var(--success)]';
                    }

                    return (
                      <button
                        key={habit.id}
                        type="button"
                        onClick={() => toggleHabitToday(habit.id, habit.completedDates)}
                        className={`group w-full flex items-stretch gap-3.5 text-left transition-opacity hover:opacity-90 ${
                          hasNext ? 'pb-5' : ''
                        }`}
                      >
                        {/* Left timeline rail + node */}
                        <div className="relative w-7 shrink-0 flex justify-center">
                          {hasNext && (
                            <span
                              aria-hidden="true"
                              className={`absolute top-[14px] -bottom-[14px] left-1/2 -translate-x-1/2 w-[4px] ${lineCls}`}
                            />
                          )}
                          <span className="relative z-10 h-7 w-7 flex items-center justify-center">
                            <span
                              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all group-hover:scale-105 ${
                                doneToday
                                  ? 'bg-[var(--success)] text-white shadow-[0_2px_6px_rgba(113,138,107,0.25)]'
                                  : 'bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-muted)] group-hover:border-[var(--sage)] group-hover:text-[var(--sage-dark)]'
                              }`}
                            >
                              <Check className="w-4 h-4 stroke-[2.5]" />
                            </span>
                          </span>
                        </div>

                        {/* Middle title & metadata */}
                        <div className="min-w-0 flex-1 pt-0.5">
                          <p className="text-[14px] font-semibold text-[var(--text-main)] truncate leading-snug">
                            {habit.title}
                          </p>
                          <div className="mt-0.5 flex items-center gap-3 text-[12px]">
                            <span
                              className={`inline-flex items-center gap-1 font-medium ${
                                doneToday ? 'text-[var(--success)]' : 'text-[var(--warning)]'
                              }`}
                            >
                              <Sparkles className="w-3 h-3" />
                              {habit.category}
                            </span>
                            <span className="text-[var(--text-muted)] tabular-nums capitalize">
                              {habit.frequency} · {habit.completedDates.length}d
                            </span>
                          </div>
                        </div>

                        {/* Right chevron */}
                        <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] shrink-0 mt-1.5 transition-colors" />
                      </button>
                    );
                  });
                })()
              )}
            </div>
          </div>

          {/* Recently uploaded documents */}
          <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-[15px] font-semibold text-[var(--text-main)]">
                Recently uploaded documents
              </h2>
              <button
                type="button"
                onClick={() => setActivePage('documents')}
                className="text-[12px] font-semibold text-[var(--sage-dark)] hover:underline"
              >
                Vault
              </button>
            </div>
            {recentDocs.length === 0 ? (
              <p className="text-[13px] text-[var(--text-secondary)]">No files uploaded yet.</p>
            ) : (
              <div className="divide-y divide-[var(--border-color)]">
                {recentDocs.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setActivePage('documents')}
                    className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-[var(--bg-secondary)]/45 rounded-[6px] px-1 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FolderPlus className="w-4 h-4 text-[var(--info)] shrink-0" />
                      <span className="text-[13px] font-medium text-[var(--text-main)] truncate">
                        {doc.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)] tabular-nums shrink-0">
                      {doc.folder} · {Math.max(1, Math.round(doc.size / 1024))} KB
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
