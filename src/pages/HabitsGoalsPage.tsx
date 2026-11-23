import React, { useMemo, useState } from 'react';
import { Award, Check, Flame, Plus, Target, Trash2 } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Modal } from '../components/ui/Modal';

export function HabitsGoalsPage() {
  const { workspace, addItem, updateItem, deleteItem, notify } = useWorkspace();
  const habits = workspace?.habits || [];
  const goals = workspace?.goals || [];

  const [habitModal, setHabitModal] = useState(false);
  const [goalModal, setGoalModal] = useState(false);
  const [habTitle, setHabTitle] = useState('');
  const [habFreq, setHabFreq] = useState<'daily' | 'weekly'>('daily');
  const [habCat, setHabCat] = useState('Wellness');

  const [goalTitle, setGoalTitle] = useState('');
  const [goalFrame, setGoalFrame] = useState<'Monthly' | 'Quarterly' | 'Yearly'>('Monthly');
  const [goalDate, setGoalDate] = useState('2026-12-31');
  const [goalMilestones, setGoalMilestones] = useState('');

  const last7Days = useMemo(() => {
    const out: Array<{ iso: string; label: string }> = [];
    const base = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      out.push({
        iso: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      });
    }
    return out;
  }, []);

  const computeStreak = (dates: string[]) => {
    const set = new Set(dates);
    let streak = 0;
    const d = new Date();
    while (set.has(d.toISOString().slice(0, 10))) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  };

  const toggleDate = async (habitId: string, dates: string[], iso: string) => {
    const exists = dates.includes(iso);
    const next = exists ? dates.filter((d) => d !== iso) : [...dates, iso];
    await updateItem('habits', habitId, { completedDates: next });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight">Goals & Habits</h1>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Gentle daily rhythms and meaningful milestones.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setHabitModal(true)}
            className="h-[38px] px-3.5 rounded-[9px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px] font-semibold hover:bg-[var(--bg-secondary)]"
          >
            + Add Habit
          </button>
          <button
            type="button"
            onClick={() => setGoalModal(true)}
            className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[13px] font-semibold"
          >
            + Add Goal
          </button>
        </div>
      </div>

      {/* 7-day Habit Tracker Calendar */}
      <section className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-semibold">Habit Calendar (Last 7 Days)</h2>
          <span className="text-[12px] text-[var(--text-muted)]">Click any day to check off</span>
        </div>

        <table className="w-full min-w-[580px] border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-color)] text-[12px] text-[var(--text-muted)]">
              <th className="py-2 text-left font-semibold">Habit</th>
              <th className="py-2 text-center font-semibold">Streak</th>
              {last7Days.map((d) => (
                <th key={d.iso} className="py-2 text-center font-semibold tabular-nums">
                  <div>{d.label}</div>
                  <div className="text-[10.5px] font-normal">{d.iso.slice(8)}</div>
                </th>
              ))}
              <th className="py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)] text-[13px]">
            {habits.map((h) => {
              const streak = computeStreak(h.completedDates);
              return (
                <tr key={h.id}>
                  <td className="py-3 pr-3">
                    <p className="font-semibold text-[var(--text-main)]">{h.title}</p>
                    <p className="text-[11.5px] text-[var(--text-muted)] capitalize">
                      {h.frequency} · {h.category}
                    </p>
                  </td>
                  <td className="py-3 text-center tabular-nums">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] bg-[var(--sage-soft)] text-[var(--sage-dark)] text-[12px] font-semibold">
                      <Flame className="w-3.5 h-3.5" /> {streak}d
                    </span>
                  </td>
                  {last7Days.map((d) => {
                    const done = h.completedDates.includes(d.iso);
                    return (
                      <td key={d.iso} className="py-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleDate(h.id, h.completedDates, d.iso)}
                          aria-label={`Toggle ${h.title} for ${d.iso}`}
                          className={`w-7 h-7 rounded-[7px] mx-auto flex items-center justify-center border transition-colors ${
                            done
                              ? 'bg-[var(--sage)] border-[var(--sage)] text-white'
                              : 'bg-[var(--bg-main)] border-[var(--border-color)] hover:border-[var(--sage)]'
                          }`}
                        >
                          {done && <Check className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    );
                  })}
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => deleteItem('habits', h.id)}
                      className="p-1 text-[var(--text-muted)] hover:text-[var(--error)]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* My Goals Section */}
      <section className="space-y-3.5">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-[var(--sage-dark)]" />
          <h2 className="text-[18px] font-semibold">My Goals</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((g) => (
            <div
              key={g.id}
              className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-3.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="px-2 py-0.5 rounded-[6px] bg-[var(--sage-soft)] text-[var(--sage-dark)] text-[11px] font-semibold">
                    {g.timeframe}
                  </span>
                  <h3 className="text-[16px] font-semibold mt-2">{g.title}</h3>
                  <p className="text-[12px] text-[var(--text-muted)] tabular-nums mt-0.5">
                    Target {g.targetDate}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteItem('goals', g.id)}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--error)]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[12px] tabular-nums">
                  <span className="text-[var(--text-secondary)]">Progress</span>
                  <span className="font-semibold text-[var(--sage-dark)]">{g.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--sage)]" style={{ width: `${g.progress}%` }} />
                </div>
              </div>

              <div className="space-y-1.5">
                {g.milestones.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={async () => {
                      const nextM = g.milestones.map((x) =>
                        x.id === m.id ? { ...x, done: !x.done } : x
                      );
                      const pct = nextM.length
                        ? Math.round((nextM.filter((x) => x.done).length / nextM.length) * 100)
                        : g.progress;
                      await updateItem('goals', g.id, { milestones: nextM, progress: pct });
                    }}
                    className="w-full text-left flex items-center gap-2.5 text-[13px] py-1"
                  >
                    <span
                      className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${
                        m.done ? 'bg-[var(--sage)] border-[var(--sage)] text-white' : 'border-[var(--text-muted)]'
                      }`}
                    >
                      {m.done && <Check className="w-3 h-3" />}
                    </span>
                    <span className={m.done ? 'line-through text-[var(--text-muted)]' : ''}>
                      {m.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Achievement History */}
      <section className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5">
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-4 h-4 text-[var(--warning)]" />
          <h2 className="text-[16px] font-semibold">Achievement History</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 text-[13px]">
          <div className="p-3 rounded-[9px] bg-[var(--bg-main)] border border-[var(--border-color)]">
            <p className="font-semibold">Total Habit Check-ins</p>
            <p className="text-[20px] font-bold tabular-nums text-[var(--sage-dark)] mt-1">
              {habits.reduce((s, h) => s + h.completedDates.length, 0)}
            </p>
          </div>
          <div className="p-3 rounded-[9px] bg-[var(--bg-main)] border border-[var(--border-color)]">
            <p className="font-semibold">Completed Milestones</p>
            <p className="text-[20px] font-bold tabular-nums text-[var(--sage-dark)] mt-1">
              {goals.reduce((s, g) => s + g.milestones.filter((m) => m.done).length, 0)}
            </p>
          </div>
          <div className="p-3 rounded-[9px] bg-[var(--bg-main)] border border-[var(--border-color)]">
            <p className="font-semibold">Active Habits</p>
            <p className="text-[20px] font-bold tabular-nums text-[var(--sage-dark)] mt-1">
              {habits.length}
            </p>
          </div>
        </div>
      </section>

      <Modal open={habitModal} onClose={() => setHabitModal(false)} title="Add Habit">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await addItem('habits', {
              title: habTitle.trim(),
              frequency: habFreq,
              category: habCat,
              completedDates: [],
            });
            setHabTitle('');
            setHabitModal(false);
            notify('Habit created');
          }}
          className="space-y-3"
        >
          <input
            type="text"
            required
            value={habTitle}
            onChange={(e) => setHabTitle(e.target.value)}
            placeholder="Habit name (e.g., 20-min evening walk)"
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[14px]"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={habFreq}
              onChange={(e) => setHabFreq(e.target.value as 'daily' | 'weekly')}
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
            <input
              type="text"
              value={habCat}
              onChange={(e) => setHabCat(e.target.value)}
              placeholder="Category"
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setHabitModal(false)} className="h-[38px] px-4 rounded-[9px] border border-[var(--border-color)] text-[13px]">
              Cancel
            </button>
            <button type="submit" className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] text-white text-[13px] font-semibold">
              Save Habit
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={goalModal} onClose={() => setGoalModal(false)} title="Create Personal Goal">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const milestones = goalMilestones
              .split('\n')
              .map((l) => l.trim())
              .filter(Boolean)
              .map((l, idx) => ({ id: `gm-${Date.now()}-${idx}`, title: l, done: false }));
            await addItem('goals', {
              title: goalTitle.trim(),
              timeframe: goalFrame,
              progress: 0,
              targetDate: goalDate,
              milestones,
            });
            setGoalTitle('');
            setGoalMilestones('');
            setGoalModal(false);
            notify('Goal added');
          }}
          className="space-y-3"
        >
          <input
            type="text"
            required
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            placeholder="Goal title"
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[14px]"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={goalFrame}
              onChange={(e) => setGoalFrame(e.target.value as typeof goalFrame)}
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
            >
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Yearly">Yearly</option>
            </select>
            <input
              type="date"
              value={goalDate}
              onChange={(e) => setGoalDate(e.target.value)}
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
            />
          </div>
          <textarea
            rows={3}
            value={goalMilestones}
            onChange={(e) => setGoalMilestones(e.target.value)}
            placeholder="Milestones (one per line)"
            className="w-full p-2.5 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setGoalModal(false)} className="h-[38px] px-4 rounded-[9px] border border-[var(--border-color)] text-[13px]">
              Cancel
            </button>
            <button type="submit" className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] text-white text-[13px] font-semibold">
              Save Goal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
