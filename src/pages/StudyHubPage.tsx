import React, { useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  CalendarClock,
  Check,
  Clock,
  GraduationCap,
  Layers,
  Plus,
  RotateCw,
  Trash2,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Modal } from '../components/ui/Modal';

export function StudyHubPage() {
  const { workspace, addItem, updateItem, deleteItem, notify } = useWorkspace();
  const subjects = workspace?.studySubjects || [];
  const sessions = workspace?.studySessions || [];
  const assignments = workspace?.studyAssignments || [];
  const decks = workspace?.flashcardDecks || [];
  const timetable = workspace?.timetable || [];

  const [tab, setTab] = useState<'overview' | 'assignments' | 'flashcards' | 'timetable'>('overview');
  const [subjectModal, setSubjectModal] = useState(false);
  const [sessionModal, setSessionModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [timetableModal, setTimetableModal] = useState(false);

  // Flashcard study state
  const [activeDeckId, setActiveDeckId] = useState<string>(decks[0]?.id || '');
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [newCardFront, setNewCardFront] = useState('');
  const [newCardBack, setNewCardBack] = useState('');

  // Forms
  const [subName, setSubName] = useState('');
  const [subCode, setSubCode] = useState('');
  const [subSem, setSubSem] = useState('Fall 2026');
  const [subCredits, setSubCredits] = useState('3');
  const [subGpa, setSubGpa] = useState('3.8');

  const [sessSubId, setSessSubId] = useState(subjects[0]?.id || '');
  const [sessMins, setSessMins] = useState('60');
  const [sessTopic, setSessTopic] = useState('');

  const [asTitle, setAsTitle] = useState('');
  const [asKind, setAsKind] = useState<'assignment' | 'exam' | 'roadmap' | 'certificate'>('assignment');
  const [asSubId, setAsSubId] = useState(subjects[0]?.id || '');
  const [asDate, setAsDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [asNotes, setAsNotes] = useState('');

  const [ttDay, setTtDay] = useState<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat'>('Mon');
  const [ttTime, setTtTime] = useState('10:00 - 11:30');
  const [ttSub, setTtSub] = useState('');
  const [ttRoom, setTtRoom] = useState('');

  const gpa = useMemo(() => {
    const totalCreds = subjects.reduce((s, x) => s + x.creditHours, 0);
    if (!totalCreds) return '0.00';
    const weighted = subjects.reduce((s, x) => s + x.creditHours * x.gradePoints, 0);
    return (weighted / totalCreds).toFixed(2);
  }, [subjects]);

  const weeklyHours = useMemo(() => {
    const mins = sessions.reduce((s, x) => s + x.durationMinutes, 0);
    return (mins / 60).toFixed(1);
  }, [sessions]);

  const studyStreak = useMemo(() => {
    const uniq = new Set(sessions.map((s) => s.date));
    return uniq.size;
  }, [sessions]);

  const activeDeck = decks.find((d) => d.id === activeDeckId) || decks[0] || null;
  const currentCard = activeDeck?.cards[cardIdx] || null;

  return (
    <div className="space-y-5">
      <div className="rounded-[14px] bg-[var(--lavender)]/45 border border-[#8E7FA8]/25 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-[12px] bg-[var(--sage-soft)] text-[var(--sage-dark)] flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight">Study Hub</h1>
            <p className="text-[13px] text-[var(--text-secondary)]">Learn. Practice. Excel.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSessionModal(true)}
            className="h-[38px] px-3.5 rounded-[9px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px] font-semibold hover:bg-[var(--bg-secondary)]"
          >
            + Log Session
          </button>
          <button
            type="button"
            onClick={() => setSubjectModal(true)}
            className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[13px] font-semibold"
          >
            + Add Subject
          </button>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
          <p className="text-[12px] text-[var(--text-secondary)]">Cumulative GPA</p>
          <p className="text-[24px] font-bold tabular-nums text-[var(--sage-dark)] mt-1">{gpa}</p>
        </div>
        <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
          <p className="text-[12px] text-[var(--text-secondary)]">Weekly Study Hours</p>
          <p className="text-[24px] font-bold tabular-nums mt-1">{weeklyHours} hrs</p>
        </div>
        <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
          <p className="text-[12px] text-[var(--text-secondary)]">Study Streak</p>
          <p className="text-[24px] font-bold tabular-nums mt-1">{studyStreak} days</p>
        </div>
        <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
          <p className="text-[12px] text-[var(--text-secondary)]">Upcoming Exams & Tasks</p>
          <p className="text-[24px] font-bold tabular-nums mt-1">
            {assignments.filter((a) => !a.completed).length}
          </p>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex items-center gap-1 p-1 rounded-[9px] bg-[var(--bg-secondary)] w-fit overflow-x-auto max-w-full">
        {(
          [
            ['overview', 'Subjects & Sessions'],
            ['assignments', 'Assignments, Exams & Certificates'],
            ['flashcards', 'Flashcards & Quiz'],
            ['timetable', 'Timetable'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-3 py-1.5 rounded-[7px] text-[12.5px] font-medium whitespace-nowrap ${
              tab === id
                ? 'bg-[var(--bg-card)] text-[var(--text-main)] font-semibold'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 space-y-3.5">
            <h2 className="text-[17px] font-semibold">Enrolled Subjects</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {subjects.map((sub) => {
                const attPct = sub.attendanceTotal
                  ? Math.round((sub.attendanceAttended / sub.attendanceTotal) * 100)
                  : 100;
                return (
                  <div
                    key={sub.id}
                    className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-semibold text-[#574970] bg-[var(--lavender)] px-2 py-0.5 rounded-[6px]">
                          {sub.code} · {sub.semester}
                        </span>
                        <h3 className="text-[15.5px] font-semibold mt-2">{sub.name}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteItem('studySubjects', sub.id)}
                        className="p-1 text-[var(--text-muted)] hover:text-[var(--error)]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[12px] tabular-nums">
                        <span className="text-[var(--text-secondary)]">Course progress</span>
                        <span className="font-semibold">{sub.progress}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={sub.progress}
                        onChange={(e) =>
                          updateItem('studySubjects', sub.id, { progress: Number(e.target.value) })
                        }
                        className="w-full accent-[var(--sage)]"
                      />
                    </div>

                    <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[12px] tabular-nums">
                      <span>
                        {sub.creditHours} credits · GPA {sub.gradePoints.toFixed(1)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateItem('studySubjects', sub.id, {
                            attendanceAttended: sub.attendanceAttended + 1,
                            attendanceTotal: sub.attendanceTotal + 1,
                          })
                        }
                        className="px-2 py-0.5 rounded-[6px] bg-[var(--sage-soft)] text-[var(--sage-dark)] font-medium"
                      >
                        Attendance {attPct}% (+1)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-4 rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-semibold">Recent Study Sessions</h2>
              <Clock className="w-4 h-4 text-[var(--sage-dark)]" />
            </div>
            <div className="divide-y divide-[var(--border-color)]">
              {sessions.map((s) => {
                const subj = subjects.find((x) => x.id === s.subjectId);
                return (
                  <div key={s.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold truncate">{s.topic}</p>
                      <p className="text-[11.5px] text-[var(--text-muted)] tabular-nums">
                        {subj?.code || 'Study'} · {s.date}
                      </p>
                    </div>
                    <span className="text-[12px] font-semibold tabular-nums text-[var(--sage-dark)] shrink-0">
                      {s.durationMinutes}m
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setAssignModal(true)}
              className="h-[36px] px-3.5 rounded-[9px] bg-[var(--sage)] text-white text-[13px] font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Assignment / Exam / Certificate
            </button>
          </div>
          <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] divide-y divide-[var(--border-color)]">
            {assignments.map((a) => {
              const subj = subjects.find((s) => s.id === a.subjectId);
              return (
                <div key={a.id} className="p-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      updateItem('studyAssignments', a.id, { completed: !a.completed })
                    }
                    className="flex items-start gap-3 text-left flex-1 min-w-0"
                  >
                    <span
                      className={`w-5 h-5 mt-0.5 rounded-[5px] border flex items-center justify-center shrink-0 ${
                        a.completed
                          ? 'bg-[var(--sage)] border-[var(--sage)] text-white'
                          : 'border-[var(--text-muted)]'
                      }`}
                    >
                      {a.completed && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-[14px] font-semibold ${a.completed ? 'line-through text-[var(--text-muted)]' : ''}`}>
                        {a.title}
                      </p>
                      <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                        {a.notes}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded-[6px] bg-[var(--lavender)] text-[#574970] text-[11px] font-medium capitalize">
                      {a.kind === 'certificate' && <Award className="w-3 h-3 inline mr-1" />}
                      {a.kind}
                    </span>
                    <span className="text-[12px] text-[var(--text-muted)] tabular-nums">
                      {subj?.code || ''} · {a.dueDate}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteItem('studyAssignments', a.id)}
                      className="p-1 text-[var(--text-muted)] hover:text-[var(--error)]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'flashcards' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#6C5E85]" />
                <h2 className="text-[16px] font-semibold">{activeDeck?.title || 'Flashcards'}</h2>
              </div>
              {activeDeck && (
                <span className="text-[12px] text-[var(--text-muted)] tabular-nums">
                  Card {Math.min(cardIdx + 1, activeDeck.cards.length)} of {activeDeck.cards.length}
                </span>
              )}
            </div>

            {currentCard ? (
              <div
                onClick={() => setFlipped((f) => !f)}
                className="cursor-pointer min-h-[200px] rounded-[12px] bg-[var(--bg-main)] border border-[var(--border-color)] p-6 flex flex-col items-center justify-center text-center transition-colors hover:border-[var(--sage)]"
              >
                <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  {flipped ? 'Answer' : 'Question · Click to flip'}
                </span>
                <p className="font-editorial text-[21px] text-[var(--text-main)] max-w-md leading-snug">
                  {flipped ? currentCard.back : currentCard.front}
                </p>
              </div>
            ) : (
              <p className="py-12 text-center text-[13px] text-[var(--text-secondary)]">
                Add your first flashcard on the right to start quizzing yourself.
              </p>
            )}

            {activeDeck && currentCard && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFlipped(false);
                    setCardIdx((i) => (i - 1 + activeDeck.cards.length) % activeDeck.cards.length);
                  }}
                  className="h-[36px] px-3.5 rounded-[8px] border border-[var(--border-color)] text-[13px] font-semibold"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const updatedCards = activeDeck.cards.map((c) =>
                      c.id === currentCard.id ? { ...c, mastered: !c.mastered } : c
                    );
                    await updateItem('flashcardDecks', activeDeck.id, { cards: updatedCards });
                    notify(currentCard.mastered ? 'Marked for review' : 'Marked as mastered');
                  }}
                  className={`h-[36px] px-3.5 rounded-[8px] text-[13px] font-semibold flex items-center gap-1.5 ${
                    currentCard.mastered
                      ? 'bg-[var(--sage-soft)] text-[var(--sage-dark)]'
                      : 'border border-[var(--border-color)]'
                  }`}
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  {currentCard.mastered ? 'Mastered' : 'Mark Mastered'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFlipped(false);
                    setCardIdx((i) => (i + 1) % activeDeck.cards.length);
                  }}
                  className="h-[36px] px-3.5 rounded-[8px] bg-[var(--sage)] text-white text-[13px] font-semibold"
                >
                  Next Card
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-3.5">
            <h3 className="text-[15px] font-semibold">Quiz & Card Maker</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newCardFront.trim() || !newCardBack.trim()) return;
                const newCard = {
                  id: `card-${Date.now()}`,
                  front: newCardFront.trim(),
                  back: newCardBack.trim(),
                  mastered: false,
                };
                if (activeDeck) {
                  await updateItem('flashcardDecks', activeDeck.id, {
                    cards: [...activeDeck.cards, newCard],
                  });
                } else {
                  const created = await addItem('flashcardDecks', {
                    subjectId: subjects[0]?.id || '',
                    title: 'Study Deck',
                    cards: [newCard],
                  });
                  setActiveDeckId(created.id);
                }
                setNewCardFront('');
                setNewCardBack('');
                notify('Flashcard added');
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                  Prompt / Question
                </label>
                <input
                  type="text"
                  required
                  value={newCardFront}
                  onChange={(e) => setNewCardFront(e.target.value)}
                  placeholder="Define heuristic evaluation"
                  className="w-full h-[38px] px-3 rounded-[8px] bg-[var(--bg-main)] border border-[var(--border-color)] text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                  Answer
                </label>
                <textarea
                  rows={3}
                  required
                  value={newCardBack}
                  onChange={(e) => setNewCardBack(e.target.value)}
                  placeholder="Inspection method checking interface against usability principles…"
                  className="w-full p-2.5 rounded-[8px] bg-[var(--bg-main)] border border-[var(--border-color)] text-[13px]"
                />
              </div>
              <button
                type="submit"
                className="w-full h-[38px] rounded-[9px] bg-[var(--sage)] text-white text-[13px] font-semibold"
              >
                Add to Deck
              </button>
            </form>
          </div>
        </div>
      )}

      {tab === 'timetable' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setTimetableModal(true)}
              className="h-[36px] px-3.5 rounded-[9px] bg-[var(--sage)] text-white text-[13px] font-semibold flex items-center gap-1.5"
            >
              <CalendarClock className="w-4 h-4" />
              Add Class Slot
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const).map((day) => (
              <div
                key={day}
                className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-3.5 space-y-2"
              >
                <h3 className="text-[13.5px] font-semibold text-[var(--sage-dark)]">{day}</h3>
                {timetable
                  .filter((t) => t.day === day)
                  .map((slot) => (
                    <div
                      key={slot.id}
                      className="p-2.5 rounded-[8px] bg-[var(--lavender)]/45 text-[12px] space-y-0.5"
                    >
                      <p className="font-semibold text-[var(--text-main)]">{slot.subjectName}</p>
                      <p className="text-[var(--text-secondary)] tabular-nums">{slot.time}</p>
                      <p className="text-[var(--text-muted)]">{slot.room}</p>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      <Modal open={subjectModal} onClose={() => setSubjectModal(false)} title="Add Subject">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await addItem('studySubjects', {
              name: subName.trim(),
              code: subCode.trim().toUpperCase(),
              semester: subSem,
              creditHours: Number(subCredits) || 3,
              progress: 0,
              gradePoints: Number(subGpa) || 3.8,
              attendanceAttended: 1,
              attendanceTotal: 1,
              accent: 'sage',
            });
            setSubName('');
            setSubCode('');
            setSubjectModal(false);
            notify('Subject added');
          }}
          className="space-y-3"
        >
          <input
            type="text"
            required
            value={subName}
            onChange={(e) => setSubName(e.target.value)}
            placeholder="Subject name"
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[14px]"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              required
              value={subCode}
              onChange={(e) => setSubCode(e.target.value)}
              placeholder="Code (e.g. CS-420)"
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
            />
            <input
              type="text"
              value={subSem}
              onChange={(e) => setSubSem(e.target.value)}
              placeholder="Fall 2026"
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
            />
            <input
              type="number"
              value={subCredits}
              onChange={(e) => setSubCredits(e.target.value)}
              placeholder="Credits"
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
            />
            <input
              type="number"
              step="0.1"
              max="4"
              min="0"
              value={subGpa}
              onChange={(e) => setSubGpa(e.target.value)}
              placeholder="Grade points (4.0)"
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setSubjectModal(false)} className="h-[38px] px-4 rounded-[9px] border border-[var(--border-color)] text-[13px]">
              Cancel
            </button>
            <button type="submit" className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] text-white text-[13px] font-semibold">
              Add Subject
            </button>
          </div>
        </form>
      </Modal>

      {/* Log Session Modal */}
      <Modal open={sessionModal} onClose={() => setSessionModal(false)} title="Log Study Session">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await addItem('studySessions', {
              subjectId: sessSubId || subjects[0]?.id || '',
              durationMinutes: Number(sessMins) || 45,
              date: new Date().toISOString().slice(0, 10),
              topic: sessTopic.trim() || 'Focused review',
            });
            setSessTopic('');
            setSessionModal(false);
            notify('Study session logged');
          }}
          className="space-y-3"
        >
          <select
            value={sessSubId}
            onChange={(e) => setSessSubId(e.target.value)}
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} — {s.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            required
            value={sessMins}
            onChange={(e) => setSessMins(e.target.value)}
            placeholder="Duration in minutes"
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
          />
          <input
            type="text"
            required
            value={sessTopic}
            onChange={(e) => setSessTopic(e.target.value)}
            placeholder="Topic studied"
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setSessionModal(false)} className="h-[38px] px-4 rounded-[9px] border border-[var(--border-color)] text-[13px]">
              Cancel
            </button>
            <button type="submit" className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] text-white text-[13px] font-semibold">
              Save Session
            </button>
          </div>
        </form>
      </Modal>

      {/* Assignment Modal */}
      <Modal open={assignModal} onClose={() => setAssignModal(false)} title="Add Study Item">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await addItem('studyAssignments', {
              subjectId: asSubId || subjects[0]?.id || '',
              title: asTitle.trim(),
              kind: asKind,
              dueDate: asDate,
              completed: false,
              notes: asNotes.trim(),
            });
            setAsTitle('');
            setAsNotes('');
            setAssignModal(false);
            notify('Study milestone added');
          }}
          className="space-y-3"
        >
          <input
            type="text"
            required
            value={asTitle}
            onChange={(e) => setAsTitle(e.target.value)}
            placeholder="Title"
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[14px]"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={asKind}
              onChange={(e) => setAsKind(e.target.value as typeof asKind)}
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
            >
              <option value="assignment">Assignment</option>
              <option value="exam">Exam</option>
              <option value="roadmap">Learning Roadmap</option>
              <option value="certificate">Certificate</option>
            </select>
            <input
              type="date"
              value={asDate}
              onChange={(e) => setAsDate(e.target.value)}
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
            />
          </div>
          <select
            value={asSubId}
            onChange={(e) => setAsSubId(e.target.value)}
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} — {s.name}
              </option>
            ))}
          </select>
          <textarea
            rows={2}
            value={asNotes}
            onChange={(e) => setAsNotes(e.target.value)}
            placeholder="Notes"
            className="w-full p-2.5 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setAssignModal(false)} className="h-[38px] px-4 rounded-[9px] border border-[var(--border-color)] text-[13px]">
              Cancel
            </button>
            <button type="submit" className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] text-white text-[13px] font-semibold">
              Save
            </button>
          </div>
        </form>
      </Modal>

      {/* Timetable Modal */}
      <Modal open={timetableModal} onClose={() => setTimetableModal(false)} title="Add Timetable Class">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await addItem('timetable', {
              day: ttDay,
              time: ttTime,
              subjectName: ttSub.trim(),
              room: ttRoom.trim(),
            });
            setTtSub('');
            setTtRoom('');
            setTimetableModal(false);
            notify('Added to timetable');
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <select
              value={ttDay}
              onChange={(e) => setTtDay(e.target.value as typeof ttDay)}
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
            >
              {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={ttTime}
              onChange={(e) => setTtTime(e.target.value)}
              placeholder="10:00 - 11:30"
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
            />
          </div>
          <input
            type="text"
            required
            value={ttSub}
            onChange={(e) => setTtSub(e.target.value)}
            placeholder="Course name"
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
          />
          <input
            type="text"
            value={ttRoom}
            onChange={(e) => setTtRoom(e.target.value)}
            placeholder="Room / Hall"
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setTimetableModal(false)} className="h-[38px] px-4 rounded-[9px] border border-[var(--border-color)] text-[13px]">
              Cancel
            </button>
            <button type="submit" className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] text-white text-[13px] font-semibold">
              Add Slot
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
