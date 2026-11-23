import React, { useEffect, useId, useState } from 'react';
import { X } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import type { CalendarMood } from '../types/workspace';

export const MOOD_OPTIONS: Array<{
  id: CalendarMood;
  label: string;
  innerColor: string;
  outerColor: string;
  ringClass: string;
}> = [
  {
    id: 'upset',
    label: 'Upset',
    innerColor: '#FFB0A3',
    outerColor: '#FFE5E0',
    ringClass: 'ring-2 ring-[#F08C7E] ring-offset-2 ring-offset-[var(--bg-card)]',
  },
  {
    id: 'sad',
    label: 'Down',
    innerColor: '#A3CEFF',
    outerColor: '#E3F0FF',
    ringClass: 'ring-2 ring-[#6EAEEB] ring-offset-2 ring-offset-[var(--bg-card)]',
  },
  {
    id: 'neutral',
    label: 'Okay',
    innerColor: '#FFD594',
    outerColor: '#FFF1D9',
    ringClass: 'ring-2 ring-[#E8B25D] ring-offset-2 ring-offset-[var(--bg-card)]',
  },
  {
    id: 'good',
    label: 'Good',
    innerColor: '#98EAFF',
    outerColor: '#E0F9FF',
    ringClass: 'ring-2 ring-[#5CC8E6] ring-offset-2 ring-offset-[var(--bg-card)]',
  },
  {
    id: 'great',
    label: 'Great',
    innerColor: '#A2F0B4',
    outerColor: '#E2FCE8',
    ringClass: 'ring-2 ring-[#65D17B] ring-offset-2 ring-offset-[var(--bg-card)]',
  },
];

export function MoodFace({
  mood,
  size = 'lg',
}: {
  mood: CalendarMood;
  size?: 'sm' | 'lg' | 'xl';
}) {
  const cfg = MOOD_OPTIONS.find((m) => m.id === mood) || MOOD_OPTIONS[4];
  const uid = useId();
  const gradId = `memo-mood-${mood}-${size}-${uid}`;
  const cls = size === 'sm' ? 'w-6 h-6' : size === 'xl' ? 'w-16 h-16' : 'w-11 h-11';

  return (
    <svg viewBox="0 0 44 44" aria-hidden="true" className={cls}>
      <defs>
        <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={cfg.innerColor} stopOpacity="0.96" />
          <stop offset="68%" stopColor={cfg.outerColor} stopOpacity="0.82" />
          <stop offset="100%" stopColor={cfg.outerColor} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="22" cy="22" r="21" fill={`url(#${gradId})`} />
      {/* Eyes */}
      <circle cx="16.5" cy="18.5" r="1.8" fill="#1F2421" />
      <circle cx="27.5" cy="18.5" r="1.8" fill="#1F2421" />
      {/* Mouth */}
      {mood === 'upset' && (
        <path
          d="M 16 28 Q 22 23 28 28"
          fill="none"
          stroke="#1F2421"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      )}
      {mood === 'sad' && (
        <path
          d="M 16.5 27.5 Q 22 23.5 27.5 27.5"
          fill="none"
          stroke="#1F2421"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      )}
      {mood === 'neutral' && (
        <line
          x1="16.5"
          y1="26"
          x2="27.5"
          y2="26"
          stroke="#1F2421"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      )}
      {mood === 'good' && (
        <path
          d="M 16 24.5 Q 22 29.2 28 24.5"
          fill="none"
          stroke="#1F2421"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      )}
      {mood === 'great' && (
        <path
          d="M 15.5 24 Q 22 30.8 28.5 24"
          fill="none"
          stroke="#1F2421"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export function MoodCheckerBar({
  date,
  todayStr,
  activeMood,
  onSelectMood,
  onResetToday,
}: {
  date: string;
  todayStr: string;
  activeMood?: CalendarMood;
  onSelectMood: (nextMood: CalendarMood | null, label: string) => void;
  onResetToday?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-full flex items-center justify-between gap-2">
        <p className="text-[14px] font-semibold text-[var(--text-main)]">
          {date === todayStr
            ? 'How’s your mood today?'
            : `How’s your mood on ${new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}?`}
        </p>
        {date !== todayStr && onResetToday && (
          <button
            type="button"
            onClick={onResetToday}
            className="text-[11.5px] font-semibold text-[var(--sage-dark)] hover:underline"
          >
            Back to today
          </button>
        )}
      </div>
      <div className="flex items-center justify-center gap-4 sm:gap-7 py-1">
        {MOOD_OPTIONS.map((m) => {
          const active = activeMood === m.id;
          return (
            <button
              key={m.id}
              type="button"
              aria-label={m.label}
              title={m.label}
              aria-pressed={active}
              onClick={() => onSelectMood(active ? null : m.id, m.label)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-150 hover:scale-110 ${
                active ? m.ringClass : 'opacity-85 hover:opacity-100'
              }`}
            >
              <MoodFace mood={m.id} size="lg" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

const SLIDER_FILL_CLASSES = [
  'w-[22%] bg-gradient-to-r from-[#EF5D42] to-[#F4845F]',
  'w-[41%] bg-gradient-to-r from-[#EF5D42] via-[#F29659] to-[#E9B35C]',
  'w-[61%] bg-gradient-to-r from-[#EF5D42] via-[#ECAA57] to-[#E3C86B]',
  'w-[80%] bg-gradient-to-r from-[#EF5D42] via-[#E7BA5A] to-[#A7D98A]',
  'w-[100%] bg-gradient-to-r from-[#EF5D42] via-[#E4C25E] to-[#74D187]',
];

const SESSION_MOOD_DELAY_MS = 90_000; // ~1.5 minutes on site

export function SessionMoodBar() {
  const { workspace, updateCalendarMood, notify } = useWorkspace();
  const todayStr = new Date().toISOString().slice(0, 10);
  const alreadyLogged = Boolean(workspace?.calendarMoods?.[todayStr]);
  const storageKey = `memo_mood_prompt_dismissed_${todayStr}`;

  const [visible, setVisible] = useState(false);
  const [moodIdx, setMoodIdx] = useState(3);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!workspace || alreadyLogged) {
      setVisible(false);
      return;
    }
    try {
      if (sessionStorage.getItem(storageKey) === '1') return;
    } catch {
      // ignore sessionStorage access errors
    }

    const timer = window.setTimeout(() => {
      setVisible(true);
    }, SESSION_MOOD_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [workspace, alreadyLogged, storageKey]);

  if (!visible || alreadyLogged) return null;

  const selected = MOOD_OPTIONS[moodIdx] || MOOD_OPTIONS[3];

  const dismiss = () => {
    try {
      sessionStorage.setItem(storageKey, '1');
    } catch {
      // ignore sessionStorage errors
    }
    setVisible(false);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await updateCalendarMood(todayStr, selected.id);
      try {
        sessionStorage.setItem(storageKey, '1');
      } catch {
        // ignore sessionStorage errors
      }
      setVisible(false);
      notify(`Mood logged: ${selected.label}`);
    } catch {
      notify('Unable to save mood', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Daily mood check-in"
      className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40 w-[336px] max-w-[calc(100vw-2rem)] rounded-[18px] bg-[var(--bg-card)]/95 backdrop-blur-md border border-[var(--border-color)] shadow-[0_18px_42px_rgba(57,54,47,0.18)] p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-[var(--text-main)]">How’s your mood today?</p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss mood check-in"
          className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-secondary)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Featured active emoji matching slider */}
      <div className="mt-2 mb-3 flex flex-col items-center">
        <MoodFace mood={selected.id} size="xl" />
        <span className="mt-1 text-[12px] font-semibold text-[var(--text-secondary)]">
          {selected.label}
        </span>
      </div>

      {/* Quick-select emoji stops */}
      <div className="mb-2 px-1 flex items-center justify-between">
        {MOOD_OPTIONS.map((m, idx) => (
          <button
            key={m.id}
            type="button"
            aria-label={m.label}
            title={m.label}
            onClick={() => setMoodIdx(idx)}
            className={`rounded-full p-0.5 transition-transform ${
              moodIdx === idx ? 'scale-115 opacity-100' : 'opacity-65 hover:opacity-100'
            }`}
          >
            <MoodFace mood={m.id} size="sm" />
          </button>
        ))}
      </div>

      {/* Gradient pill slider bar matching reference */}
      <div className="relative h-8 rounded-full bg-[var(--bg-secondary)] p-1 overflow-hidden">
        <div
          className={`h-full rounded-full flex items-center justify-end pr-0.5 transition-all duration-200 ${SLIDER_FILL_CLASSES[moodIdx]}`}
        >
          <span className="w-8 h-6 rounded-full bg-white/95 shadow-[0_2px_6px_rgba(0,0,0,0.20)] shrink-0" />
        </div>
        <input
          type="range"
          min={0}
          max={4}
          step={1}
          value={moodIdx}
          aria-label="Slide to select your mood"
          onChange={(e) => setMoodIdx(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
      </div>

      <div className="mt-1.5 flex items-center justify-between text-[11px] font-medium text-[var(--text-muted)]">
        <span>Not great</span>
        <span>Amazing</span>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={dismiss}
          className="h-[30px] px-3 rounded-full text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
        >
          Later
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="h-[30px] px-4 rounded-full bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[12px] font-semibold transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save mood'}
        </button>
      </div>
    </div>
  );
}

