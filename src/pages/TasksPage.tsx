import React, { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Check,
  CheckSquare,
  GripVertical,
  Kanban,
  List,
  Plus,
  Repeat,
  Search,
  Trash2,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import type { TaskItem } from '../types/workspace';

const PRIORITY_STYLE: Record<TaskItem['priority'], { label: string; cls: string }> = {
  high: { label: 'High', cls: 'bg-[var(--blush)] text-[#8A4E50]' },
  medium: { label: 'Medium', cls: 'bg-[var(--pale-yellow)] text-[#7C5F29]' },
  low: { label: 'Low', cls: 'bg-[var(--sage-soft)] text-[var(--sage-dark)]' },
};

export function TasksPage() {
  const { workspace, addItem, updateItem, deleteItem, bulkUpdate, notify } = useWorkspace();
  const tasks = workspace?.tasks || [];

  const [tab, setTab] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');
  const [view, setView] = useState<'list' | 'board' | 'calendar'>('list');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Personal');
  const [priority, setPriority] = useState<TaskItem['priority']>('medium');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [recurring, setRecurring] = useState<TaskItem['recurring']>('none');
  const [reminderTime, setReminderTime] = useState('');
  const [subtaskText, setSubtaskText] = useState('');

  const todayStr = new Date().toISOString().slice(0, 10);

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks
      .filter((t) => {
        if (tab === 'today' && t.dueDate !== todayStr) return false;
        if (tab === 'upcoming' && (t.completed || t.dueDate < todayStr)) return false;
        if (tab === 'completed' && !t.completed) return false;
        if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
        if (
          q &&
          !t.title.toLowerCase().includes(q) &&
          !t.category.toLowerCase().includes(q) &&
          !t.description.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.order - b.order);
  }, [tasks, tab, priorityFilter, search, todayStr]);

  const weeklyCompletedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progressPct = totalCount ? Math.round((weeklyCompletedCount / totalCount) * 100) : 0;

  const openNew = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setCategory('Personal');
    setPriority('medium');
    setDueDate(todayStr);
    setRecurring('none');
    setReminderTime('');
    setSubtaskText('');
    setModalOpen(true);
  };

  const openEdit = (t: TaskItem) => {
    setEditingTask(t);
    setTitle(t.title);
    setDescription(t.description);
    setCategory(t.category);
    setPriority(t.priority);
    setDueDate(t.dueDate);
    setRecurring(t.recurring);
    setReminderTime(t.reminderTime || '');
    setSubtaskText(t.subtasks.map((s) => s.title).join('\n'));
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const subtasks = subtaskText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, i) => ({
        id: editingTask?.subtasks[i]?.id || `st-${Date.now()}-${i}`,
        title: line,
        done: editingTask?.subtasks[i]?.done || false,
      }));

    if (editingTask) {
      await updateItem('tasks', editingTask.id, {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        dueDate,
        recurring,
        reminderTime: reminderTime || undefined,
        subtasks,
      });
      notify('Task updated');
    } else {
      await addItem('tasks', {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        dueDate,
        completed: false,
        recurring,
        reminderTime: reminderTime || undefined,
        subtasks,
        order: tasks.length,
        createdAt: new Date().toISOString(),
      });
      notify('Task added');
    }
    setModalOpen(false);
  };

  const handleDropOnTask = async (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const list = [...tasks].sort((a, b) => a.order - b.order);
    const fromIdx = list.findIndex((t) => t.id === dragId);
    const toIdx = list.findIndex((t) => t.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);
    const reindexed = list.map((t, idx) => ({ ...t, order: idx }));
    setDragId(null);
    await bulkUpdate('tasks', reindexed);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[var(--text-main)]">
            Tasks
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Plan. Prioritize. Get it done.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[13px] font-semibold flex items-center gap-1.5 self-start sm:self-auto whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Weekly progress summary */}
      <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold text-[var(--text-main)]">
            Weekly Progress Summary
          </p>
          <p className="text-[12px] text-[var(--text-secondary)] tabular-nums">
            {weeklyCompletedCount} of {totalCount} tasks completed ({progressPct}%)
          </p>
        </div>
        <div className="w-full sm:w-64 h-2.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--sage)] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Controls: tabs + search + priority filter + view switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center p-1 rounded-[9px] bg-[var(--bg-secondary)]">
          {(['all', 'today', 'upcoming', 'completed'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-[7px] text-[12.5px] font-medium capitalize transition-colors whitespace-nowrap ${
                tab === t
                  ? 'bg-[var(--bg-card)] text-[var(--text-main)] font-semibold shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 flex-1 sm:flex-initial justify-end">
          <div className="relative min-w-[180px] flex-1 sm:w-52">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full h-[38px] pl-9 pr-3 rounded-[9px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px] focus:outline-none focus:border-[var(--sage)]"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)}
            aria-label="Filter by priority"
            className="h-[38px] px-3 rounded-[9px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
          >
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <div className="flex items-center p-0.5 rounded-[9px] bg-[var(--bg-card)] border border-[var(--border-color)]">
            <button
              type="button"
              onClick={() => setView('list')}
              title="List view"
              className={`w-8 h-8 rounded-[7px] flex items-center justify-center ${
                view === 'list' ? 'bg-[var(--sage-soft)] text-[var(--sage-dark)]' : 'text-[var(--text-secondary)]'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setView('board')}
              title="Board view"
              className={`w-8 h-8 rounded-[7px] flex items-center justify-center ${
                view === 'board' ? 'bg-[var(--sage-soft)] text-[var(--sage-dark)]' : 'text-[var(--text-secondary)]'
              }`}
            >
              <Kanban className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setView('calendar')}
              title="Calendar view"
              className={`w-8 h-8 rounded-[7px] flex items-center justify-center ${
                view === 'calendar' ? 'bg-[var(--sage-soft)] text-[var(--sage-dark)]' : 'text-[var(--text-secondary)]'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="A fresh start. What needs to get done?"
          description="Organize your priorities with due dates, subtasks, and recurring reminders."
          actionLabel="Add your first task"
          onAction={openNew}
          tone="sage"
        />
      ) : view === 'list' ? (
        <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] divide-y divide-[var(--border-color)]">
          {filteredTasks.map((task) => {
            const pStyle = PRIORITY_STYLE[task.priority];
            return (
              <div
                key={task.id}
                draggable
                onDragStart={() => setDragId(task.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDropOnTask(task.id)}
                className="p-4 flex items-start gap-3 hover:bg-[var(--bg-secondary)]/35 transition-colors"
              >
                <GripVertical className="w-4 h-4 text-[var(--text-muted)] mt-1 cursor-grab shrink-0 hidden sm:block" />
                <button
                  type="button"
                  onClick={() => updateItem('tasks', task.id, { completed: !task.completed })}
                  className={`w-5 h-5 mt-0.5 rounded-[6px] border flex items-center justify-center shrink-0 transition-colors ${
                    task.completed
                      ? 'bg-[var(--sage)] border-[var(--sage)] text-white'
                      : 'border-[var(--text-muted)]'
                  }`}
                >
                  {task.completed && <Check className="w-3.5 h-3.5" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(task)}
                      className={`text-left text-[14.5px] font-semibold hover:text-[var(--sage-dark)] ${
                        task.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-main)]'
                      }`}
                    >
                      {task.title}
                    </button>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-[6px] text-[11px] font-semibold ${pStyle.cls}`}>
                        {pStyle.label}
                      </span>
                      <span className="text-[12px] text-[var(--text-muted)] tabular-nums">
                        {task.category} · {task.dueDate}
                      </span>
                      {task.recurring !== 'none' && (
                        <span title={`Repeats ${task.recurring}`} className="inline-flex">
                          <Repeat className="w-3.5 h-3.5 text-[var(--sage-dark)]" />
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteItem('tasks', task.id)}
                        aria-label="Delete task"
                        className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--error)]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-[12.5px] text-[var(--text-secondary)] mt-1">
                      {task.description}
                    </p>
                  )}
                  {task.subtasks.length > 0 && (
                    <div className="mt-2.5 space-y-1 pl-1">
                      {task.subtasks.map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => {
                            const nextSubs = task.subtasks.map((s) =>
                              s.id === st.id ? { ...s, done: !s.done } : s
                            );
                            updateItem('tasks', task.id, { subtasks: nextSubs });
                          }}
                          className="flex items-center gap-2 text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-main)]"
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center ${
                              st.done ? 'bg-[var(--sage)] border-[var(--sage)] text-white' : 'border-[var(--text-muted)]'
                            }`}
                          >
                            {st.done && <Check className="w-2.5 h-2.5" />}
                          </span>
                          <span className={st.done ? 'line-through text-[var(--text-muted)]' : ''}>
                            {st.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : view === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['high', 'medium', 'low'] as const).map((prio) => {
            const colTasks = filteredTasks.filter((t) => t.priority === prio);
            return (
              <div
                key={prio}
                onDragOver={(e) => e.preventDefault()}
                onDrop={async () => {
                  if (dragId) {
                    await updateItem('tasks', dragId, { priority: prio });
                    setDragId(null);
                  }
                }}
                className="rounded-[12px] bg-[var(--bg-secondary)]/70 border border-[var(--border-color)] p-3.5 space-y-2.5"
              >
                <div className="flex items-center justify-between px-1">
                  <span className={`px-2 py-0.5 rounded-[6px] text-[12px] font-semibold ${PRIORITY_STYLE[prio].cls}`}>
                    {PRIORITY_STYLE[prio].label} Priority
                  </span>
                  <span className="text-[12px] text-[var(--text-muted)] tabular-nums">
                    {colTasks.length}
                  </span>
                </div>
                {colTasks.map((t) => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={() => setDragId(t.id)}
                    onClick={() => openEdit(t)}
                    className="cursor-pointer p-3.5 rounded-[10px] bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--sage)] transition-colors"
                  >
                    <p className={`text-[13.5px] font-semibold ${t.completed ? 'line-through text-[var(--text-muted)]' : ''}`}>
                      {t.title}
                    </p>
                    <p className="text-[11.5px] text-[var(--text-muted)] mt-1.5 tabular-nums">
                      {t.category} · {t.dueDate}
                    </p>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {Array.from(new Set(filteredTasks.map((t) => t.dueDate)))
            .sort()
            .map((date) => (
              <div
                key={date}
                className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4"
              >
                <h3 className="text-[14px] font-semibold text-[var(--sage-dark)] tabular-nums mb-2">
                  {date}
                </h3>
                <div className="divide-y divide-[var(--border-color)]">
                  {filteredTasks
                    .filter((t) => t.dueDate === date)
                    .map((t) => (
                      <div key={t.id} className="py-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => updateItem('tasks', t.id, { completed: !t.completed })}
                          className="flex items-center gap-2.5 text-left"
                        >
                          <Check className={`w-4 h-4 ${t.completed ? 'text-[var(--sage)]' : 'text-[var(--text-muted)]'}`} />
                          <span className={t.completed ? 'line-through text-[var(--text-muted)]' : ''}>
                            {t.title}
                          </span>
                        </button>
                        <span className={`px-2 py-0.5 rounded-[6px] text-[11px] font-medium ${PRIORITY_STYLE[t.priority].cls}`}>
                          {PRIORITY_STYLE[t.priority].label}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Task Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'New Task'}
      >
        <form onSubmit={handleSave} className="space-y-3.5">
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
              Task title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[14px]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskItem['priority'])}
                className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                Due date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                Recurring
              </label>
              <select
                value={recurring}
                onChange={(e) => setRecurring(e.target.value as TaskItem['recurring'])}
                className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
              Reminder time (optional)
            </label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
              Subtasks (one per line)
            </label>
            <textarea
              rows={3}
              value={subtaskText}
              onChange={(e) => setSubtaskText(e.target.value)}
              placeholder="Step 1&#10;Step 2"
              className="w-full p-2.5 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
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
              {editingTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
