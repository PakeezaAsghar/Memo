import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin, Plus, SmilePlus, Trash2 } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { MoodCheckerBar, MoodFace } from '../components/MoodChecker';
import { Modal } from '../components/ui/Modal';
import type { CalendarEvent } from '../types/workspace';

const CAT_BADGES: Record<CalendarEvent['category'], { label: string; cls: string }> = {
  university: { label: 'University', cls: 'bg-[var(--lavender)] text-[#574970]' },
  meeting: { label: 'Meeting', cls: 'bg-[#E5ECF4] text-[#455E7B]' },
  personal: { label: 'Personal', cls: 'bg-[var(--sage-soft)] text-[var(--sage-dark)]' },
  birthday: { label: 'Birthday', cls: 'bg-[var(--blush)] text-[#8A4E50]' },
  reminder: { label: 'Reminder', cls: 'bg-[var(--pale-yellow)] text-[#7C5F29]' },
};

export function CalendarPage() {
  const { workspace, addItem, updateItem, deleteItem, updateCalendarMood, notify } = useWorkspace();
  const events = workspace?.events || [];
  const tasks = workspace?.tasks || [];
  const calendarMoods = workspace?.calendarMoods || {};

  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedMoodDate, setSelectedMoodDate] = useState(todayStr);

  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [cursorDate, setCursorDate] = useState(() => new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [category, setCategory] = useState<CalendarEvent['category']>('personal');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const cursorIso = cursorDate.toISOString().slice(0, 10);

  const openNew = (presetDate?: string) => {
    setEditing(null);
    setTitle('');
    setDate(presetDate || cursorIso);
    setStartTime('10:00');
    setEndTime('11:00');
    setCategory('personal');
    setLocation('');
    setDescription('');
    setModalOpen(true);
  };

  const openEdit = (ev: CalendarEvent) => {
    setEditing(ev);
    setTitle(ev.title);
    setDate(ev.date);
    setStartTime(ev.startTime);
    setEndTime(ev.endTime);
    setCategory(ev.category);
    setLocation(ev.location || '');
    setDescription(ev.description);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: title.trim(),
      date,
      startTime,
      endTime,
      category,
      location: location.trim() || undefined,
      description: description.trim(),
    };
    if (editing) {
      await updateItem('events', editing.id, payload);
      notify('Event updated');
    } else {
      await addItem('events', payload);
      notify('Event added to calendar');
    }
    setModalOpen(false);
  };

  const year = cursorDate.getFullYear();
  const month = cursorDate.getMonth();
  const firstDayOffset = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Compute week days for Week view
  const weekDays = useMemo(() => {
    const start = new Date(cursorDate);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(start);
      d.setDate(start.getDate() + idx);
      return d.toISOString().slice(0, 10);
    });
  }, [cursorDate]);

  const todaysSchedule = useMemo(
    () =>
      events
        .filter((e) => e.date === todayStr)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [events, todayStr]
  );

  const upcomingEvents = useMemo(
    () =>
      events
        .filter((e) => e.date > todayStr)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5),
    [events, todayStr]
  );

  const overdueTasks = useMemo(
    () => tasks.filter((t) => !t.completed && t.dueDate < todayStr),
    [tasks, todayStr]
  );

  const shiftCursor = (delta: number) => {
    const next = new Date(cursorDate);
    if (viewMode === 'month') next.setMonth(next.getMonth() + delta);
    else if (viewMode === 'week') next.setDate(next.getDate() + delta * 7);
    else next.setDate(next.getDate() + delta);
    setCursorDate(next);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight">Calendar</h1>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Plan your time, make it count.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openNew()}
          className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[13px] font-semibold flex items-center gap-1.5 self-start sm:self-auto whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          New Event
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftCursor(-1)}
            className="w-9 h-9 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center hover:bg-[var(--bg-secondary)]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-[17px] font-semibold min-w-[170px] text-center">
            {cursorDate.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
              ...(viewMode === 'day' ? { day: 'numeric' } : {}),
            })}
          </h2>
          <button
            type="button"
            onClick={() => shiftCursor(1)}
            className="w-9 h-9 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center hover:bg-[var(--bg-secondary)]"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCursorDate(new Date())}
            className="h-9 px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[12.5px] font-medium hover:bg-[var(--bg-secondary)]"
          >
            Today
          </button>
        </div>

        <div className="flex items-center p-1 rounded-[9px] bg-[var(--bg-secondary)]">
          {(['month', 'week', 'day', 'agenda'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setViewMode(m)}
              className={`px-3 py-1.5 rounded-[7px] text-[12.5px] font-medium capitalize transition-colors ${
                viewMode === m
                  ? 'bg-[var(--bg-card)] text-[var(--text-main)] font-semibold'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Main Calendar Area */}
        <section className="lg:col-span-8 rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4 overflow-x-auto">
          {viewMode === 'month' && (
            <div className="min-w-[540px]">
              <div className="grid grid-cols-7 gap-1.5 text-center text-[12px] font-semibold text-[var(--text-muted)] pb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: firstDayOffset }).map((_, i) => (
                  <div key={`pad-${i}`} className="min-h-[86px] rounded-[8px] bg-[var(--bg-main)]/40" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const day = idx + 1;
                  const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayEvents = events.filter((e) => e.date === iso);
                  const dayTasks = tasks.filter((t) => t.dueDate === iso && !t.completed);
                  const isToday = iso === todayStr;
                  const dayMood = calendarMoods[iso];
                  const isMoodTarget = selectedMoodDate === iso;

                  return (
                    <div
                      key={iso}
                      onClick={() => openNew(iso)}
                      className={`group min-h-[86px] p-1.5 rounded-[8px] border cursor-pointer transition-colors ${
                        isToday
                          ? 'bg-[var(--sage-soft)]/35 border-[var(--sage)]'
                          : 'bg-[var(--bg-main)]/55 border-[var(--border-color)] hover:border-[var(--sage)]/60'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span
                          className={`text-[11.5px] tabular-nums font-semibold ${
                            isToday ? 'text-[var(--sage-dark)]' : 'text-[var(--text-secondary)]'
                          }`}
                        >
                          {day}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMoodDate(iso);
                          }}
                          title={dayMood ? `Mood on ${iso}: ${dayMood} (click to change)` : `Log mood for ${iso}`}
                          aria-label={dayMood ? `Change mood for ${iso}` : `Log mood for ${iso}`}
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                            dayMood
                              ? isMoodTarget
                                ? 'ring-1 ring-[var(--sage)] scale-105'
                                : 'hover:scale-110'
                              : isMoodTarget
                                ? 'border border-[var(--sage)] text-[var(--sage-dark)] bg-[var(--bg-card)]/80'
                                : 'opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--sage-dark)] hover:bg-[var(--bg-card)]'
                          }`}
                        >
                          {dayMood ? <MoodFace mood={dayMood} size="sm" /> : <SmilePlus className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(ev);
                            }}
                            className={`w-full text-left px-1.5 py-0.5 rounded text-[10.5px] font-medium truncate ${CAT_BADGES[ev.category].cls}`}
                          >
                            {ev.startTime} {ev.title}
                          </button>
                        ))}
                        {dayTasks.slice(0, 1).map((tk) => (
                          <div
                            key={tk.id}
                            className="px-1.5 py-0.5 rounded text-[10.5px] bg-[var(--bg-secondary)] text-[var(--text-secondary)] truncate"
                          >
                            ✓ {tk.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Daily Mood Checker */}
              <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                <MoodCheckerBar
                  date={selectedMoodDate}
                  todayStr={todayStr}
                  activeMood={calendarMoods[selectedMoodDate]}
                  onResetToday={() => setSelectedMoodDate(todayStr)}
                  onSelectMood={async (nextMood, label) => {
                    try {
                      await updateCalendarMood(selectedMoodDate, nextMood);
                      notify(nextMood ? `Mood logged: ${label}` : 'Mood cleared');
                    } catch {
                      notify('Unable to save mood', 'error');
                    }
                  }}
                />
              </div>
            </div>
          )}

          {viewMode === 'week' && (
            <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
              {weekDays.map((iso) => {
                const dayEvents = events
                  .filter((e) => e.date === iso)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));
                const dObj = new Date(`${iso}T12:00:00`);
                return (
                  <div
                    key={iso}
                    className={`p-2.5 rounded-[10px] border min-h-[220px] ${
                      iso === todayStr
                        ? 'bg-[var(--sage-soft)]/30 border-[var(--sage)]'
                        : 'bg-[var(--bg-main)]/50 border-[var(--border-color)]'
                    }`}
                  >
                    <p className="text-[12px] font-semibold text-[var(--text-main)] tabular-nums mb-2">
                      {dObj.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                    </p>
                    <div className="space-y-1.5">
                      {dayEvents.map((ev) => (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => openEdit(ev)}
                          className={`w-full text-left p-2 rounded-[7px] text-[11.5px] ${CAT_BADGES[ev.category].cls}`}
                        >
                          <p className="font-semibold truncate">{ev.title}</p>
                          <p className="opacity-80 tabular-nums">{ev.startTime}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === 'day' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-semibold tabular-nums">Schedule for {cursorIso}</h3>
                <button
                  type="button"
                  onClick={() => openNew(cursorIso)}
                  className="text-[12px] font-semibold text-[var(--sage-dark)] hover:underline"
                >
                  + Add event
                </button>
              </div>
              {events.filter((e) => e.date === cursorIso).length === 0 ? (
                <p className="py-10 text-center text-[13px] text-[var(--text-secondary)]">
                  No events scheduled on this day.
                </p>
              ) : (
                events
                  .filter((e) => e.date === cursorIso)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => openEdit(ev)}
                      className="cursor-pointer p-3.5 rounded-[10px] bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[var(--sage)] flex items-start justify-between gap-3"
                    >
                      <div>
                        <span className={`px-2 py-0.5 rounded-[6px] text-[11px] font-medium ${CAT_BADGES[ev.category].cls}`}>
                          {CAT_BADGES[ev.category].label}
                        </span>
                        <h4 className="text-[15px] font-semibold mt-1.5">{ev.title}</h4>
                        {ev.description && (
                          <p className="text-[12.5px] text-[var(--text-secondary)] mt-1">
                            {ev.description}
                          </p>
                        )}
                      </div>
                      <span className="text-[12px] font-mono-num text-[var(--text-secondary)] shrink-0">
                        {ev.startTime}–{ev.endTime}
                      </span>
                    </div>
                  ))
              )}
            </div>
          )}

          {viewMode === 'agenda' && (
            <div className="divide-y divide-[var(--border-color)]">
              {[...events]
                .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))
                .map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => openEdit(ev)}
                    className="py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-[var(--bg-secondary)]/45 px-2 rounded-[8px]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[12px] font-mono-num text-[var(--text-muted)] w-24 shrink-0">
                        {ev.date}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold truncate">{ev.title}</p>
                        <p className="text-[12px] text-[var(--text-secondary)] truncate">
                          {ev.startTime}–{ev.endTime}
                          {ev.location ? ` · ${ev.location}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-[6px] text-[11px] font-medium shrink-0 ${CAT_BADGES[ev.category].cls}`}>
                      {CAT_BADGES[ev.category].label}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </section>

        {/* Right panel: Today's schedule, Upcoming events, Overdue tasks */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
            <h3 className="text-[15px] font-semibold mb-3">Today’s Schedule</h3>
            {todaysSchedule.length === 0 ? (
              <p className="text-[12.5px] text-[var(--text-secondary)]">Clear schedule today.</p>
            ) : (
              <div className="space-y-2.5">
                {todaysSchedule.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => openEdit(ev)}
                    className="w-full text-left p-3 rounded-[9px] bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[var(--sage)]"
                  >
                    <p className="text-[13.5px] font-semibold text-[var(--text-main)]">{ev.title}</p>
                    <div className="mt-1 flex items-center gap-3 text-[11.5px] text-[var(--text-secondary)] tabular-nums">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {ev.startTime}–{ev.endTime}
                      </span>
                      {ev.location && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3" /> {ev.location}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
            <h3 className="text-[15px] font-semibold mb-3">Upcoming Events</h3>
            <div className="divide-y divide-[var(--border-color)]">
              {upcomingEvents.map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => openEdit(ev)}
                  className="w-full text-left py-2.5 flex items-center justify-between gap-2"
                >
                  <span className="text-[13px] font-medium truncate">{ev.title}</span>
                  <span className="text-[11.5px] text-[var(--text-muted)] tabular-nums shrink-0">
                    {ev.date}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
            <h3 className="text-[15px] font-semibold mb-2">Overdue Tasks</h3>
            {overdueTasks.length === 0 ? (
              <p className="text-[12.5px] text-[var(--sage-dark)]">No overdue tasks.</p>
            ) : (
              <div className="space-y-2">
                {overdueTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 rounded-[8px] bg-[var(--blush)]/35 text-[12.5px] flex items-center justify-between gap-2"
                  >
                    <span className="font-medium truncate">{t.title}</span>
                    <span className="text-[11px] text-[#8A4E50] tabular-nums shrink-0">
                      {t.dueDate}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Create / Edit Event Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Event' : 'New Event'}
      >
        <form onSubmit={handleSave} className="space-y-3.5">
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
              Event title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[14px]"
            />
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-[40px] px-2.5 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                Start
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full h-[40px] px-2.5 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                End
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full h-[40px] px-2.5 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CalendarEvent['category'])}
                className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
              >
                <option value="university">University</option>
                <option value="meeting">Meeting</option>
                <option value="personal">Personal</option>
                <option value="birthday">Birthday</option>
                <option value="reminder">Reminder</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                Location (optional)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Room or cafe"
                className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
              />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            {editing ? (
              <button
                type="button"
                onClick={async () => {
                  await deleteItem('events', editing.id);
                  setModalOpen(false);
                  notify('Event removed');
                }}
                className="h-[38px] px-3 rounded-[9px] text-[var(--error)] hover:bg-[var(--blush)]/45 text-[13px] font-semibold flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="h-[38px] px-4 rounded-[9px] border border-[var(--border-color)] text-[13px] font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] text-white text-[13px] font-semibold"
              >
                Save Event
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
