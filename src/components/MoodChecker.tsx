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
  size?: 'sm' | 'md' | 'lg';
}) {
  const cfg = MOOD_OPTIONS.find((m) => m.id === mood) || MOOD_OPTIONS[4];
  const uid = useId();
  const gradId = `memo-mood-${mood}-${size}-${uid}`;
  const cls = size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-9 h-9' : 'w-11 h-11';

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

const SLIDER_FILL_WIDTHS = ['w-[16%]', 'w-[37%]', 'w-[58%]', 'w-[79%]', 'w-full'];

export function TimedMoodBar() {
  const { user, workspace, updateCalendarMood, notify } = useWorkspace();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [moodIndex, setMoodIndex] = useState(3);
  const [saving, setSaving] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);
  const alreadyLoggedToday = Boolean(workspace?.calendarMoods?.[todayStr]);

  useEffect(() => {
    if (!user || dismissed || alreadyLoggedToday) {
      setVisible(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setVisible(true);
    }, 90000);
    return () => window.clearTimeout(timer);
  }, [user, dismissed, alreadyLoggedToday]);

  if (!visible || dismissed || alreadyLoggedToday) return null;

  const selected = MOOD_OPTIONS[moodIndex] || MOOD_OPTIONS[3];

  return (
    <aside
      aria-label="Mood check-in bar"
      className="fixed bottom-5 left-1/2 lg:left-[calc(50%+115px)] -translate-x-1/2 z-40 w-[calc(100vw-2rem)] max-w-[390px] rounded-[16px] bg-[var(--bg-card)]/95 backdrop-blur-md border border-[var(--border-color)] shadow-[0_18px_44px_rgba(57,54,47,0.18)] p-4 sm:p-5"
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="text-[13.5px] font-semibold text-[var(--text-main)]">
          How’s your mood right now?
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss mood check-in"
          className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-main)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Existing glowing pastel emojis */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3.5">
        {MOOD_OPTIONS.map((m, idx) => {
          const active = idx === moodIndex;
          return (
            <button
              key={m.id}
              type="button"
              aria-label={m.label}
              title={m.label}
              aria-pressed={active}
              onClick={() => setMoodIndex(idx)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-150 hover:scale-110 ${
                active ? `${m.ringClass} scale-105` : 'opacity-75 hover:opacity-100'
              }`}
            >
              <MoodFace mood={m.id} size="md" />
            </button>
          );
        })}
      </div>

      {/* Gradient pill slider bar */}
      <div className="relative h-7 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)]/60 overflow-hidden flex items-center">
        <div
          className={`h-full rounded-full bg-gradient-to-r from-[#EF6245] via-[#E9B450] to-[#74CF85] flex items-center justify-end p-1 transition-all duration-200 ${SLIDER_FILL_WIDTHS[moodIndex]}`}
        >
          <span className="w-7 h-5 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.22)] shrink-0" />
        </div>
        <input
          type="range"
          min={0}
          max={MOOD_OPTIONS.length - 1}
          step={1}
          value={moodIndex}
          onChange={(e) => setMoodIndex(Number(e.target.value))}
          aria-label="Mood level slider"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      <div className="mt-1.5 flex items-center justify-between text-[11px] font-medium text-[var(--text-muted)]">
        <span>Not great</span>
        <span>Amazing</span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[12px] font-medium text-[var(--text-secondary)]">
          Feeling <span className="font-semibold text-[var(--text-main)]">{selected.label}</span>
        </span>
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              await updateCalendarMood(todayStr, selected.id);
              notify(`Mood logged: ${selected.label}`);
              setDismissed(true);
            } catch {
              notify('Unable to save mood', 'error');
            } finally {
              setSaving(false);
            }
          }}
          className="h-[30px] px-3.5 rounded-full bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[12px] font-semibold transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save mood'}
        </button>
      </div>
    </aside>
  );
}

