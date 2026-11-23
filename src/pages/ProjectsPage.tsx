import React, { useRef, useState } from 'react';
import {
  Calendar,
  Check,
  FolderKanban,
  Grid,
  Kanban,
  Link2,
  List,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { api, withFileAuth } from '../lib/api';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import type { ProjectItem } from '../types/workspace';

const STATUS_BADGE: Record<ProjectItem['status'], string> = {
  Planning: 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]',
  'In Progress': 'bg-[var(--sage-soft)] text-[var(--sage-dark)]',
  Review: 'bg-[var(--pale-yellow)] text-[#7C5F29]',
  Completed: 'bg-[#DCE8D8] text-[#4C6846]',
};

export function ProjectsPage() {
  const { workspace, addItem, updateItem, deleteItem, notify } = useWorkspace();
  const projects = workspace?.projects || [];

  const [view, setView] = useState<'grid' | 'list' | 'kanban' | 'timeline'>('grid');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [deadline, setDeadline] = useState(() => new Date().toISOString().slice(0, 10));
  const [coverImage, setCoverImage] = useState('');
  const [newMilestone, setNewMilestone] = useState('');
  const coverRef = useRef<HTMLInputElement>(null);

  const activeProject = projects.find((p) => p.id === selectedId) || null;

  const uploadCover = async (file: File, targetProject?: ProjectItem) => {
    try {
      const up = await api.uploadFile(file);
      if (targetProject) {
        await updateItem('projects', targetProject.id, { coverImage: up.url });
        notify('Project cover updated');
      } else {
        setCoverImage(up.url);
      }
    } catch {
      notify('Cover upload failed', 'error');
    }
  };

  if (activeProject) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className="text-[13px] font-semibold text-[var(--sage-dark)] hover:underline"
        >
          ← Back to all projects
        </button>

        <div className="rounded-[14px] bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
          {activeProject.coverImage && (
            <img
              src={withFileAuth(activeProject.coverImage)}
              alt={activeProject.title}
              referrerPolicy="no-referrer"
              className="w-full h-48 object-cover border-b border-[var(--border-color)]"
            />
          )}
          <div className="p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className={`px-2 py-0.5 rounded-[6px] text-[11px] font-semibold ${STATUS_BADGE[activeProject.status]}`}>
                  {activeProject.status}
                </span>
                <h1 className="text-[26px] font-bold mt-2">{activeProject.title}</h1>
                <p className="text-[13.5px] text-[var(--text-secondary)] mt-1">
                  {activeProject.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => coverRef.current?.click()}
                  className="h-[36px] px-3 rounded-[8px] border border-[var(--border-color)] text-[12.5px] font-medium flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Cover Image
                </button>
                <input
                  ref={coverRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadCover(f, activeProject);
                    e.target.value = '';
                  }}
                />
                <select
                  value={activeProject.status}
                  onChange={(e) =>
                    updateItem('projects', activeProject.id, {
                      status: e.target.value as ProjectItem['status'],
                    })
                  }
                  className="h-[36px] px-2.5 rounded-[8px] bg-[var(--bg-main)] border border-[var(--border-color)] text-[12.5px]"
                >
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Milestones & Notes */}
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <div className="flex justify-between text-[13px] font-semibold mb-1.5 tabular-nums">
                    <span>Milestones</span>
                    <span>{activeProject.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden mb-3">
                    <div
                      className="h-full rounded-full bg-[var(--sage)] transition-all"
                      style={{ width: `${activeProject.progress}%` }}
                    />
                  </div>
                  <div className="space-y-2">
                    {activeProject.milestones.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={async () => {
                          const next = activeProject.milestones.map((x) =>
                            x.id === m.id ? { ...x, done: !x.done } : x
                          );
                          const doneCount = next.filter((x) => x.done).length;
                          const pct = next.length ? Math.round((doneCount / next.length) * 100) : 0;
                          await updateItem('projects', activeProject.id, {
                            milestones: next,
                            progress: pct,
                          });
                        }}
                        className="w-full p-2.5 rounded-[8px] bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center gap-2.5 text-left text-[13px]"
                      >
                        <span
                          className={`w-4 h-4 rounded-[4px] border flex items-center justify-center ${
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
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!newMilestone.trim()) return;
                      const next = [
                        ...activeProject.milestones,
                        { id: `pm-${Date.now()}`, title: newMilestone.trim(), done: false },
                      ];
                      const pct = Math.round(
                        (next.filter((x) => x.done).length / next.length) * 100
                      );
                      await updateItem('projects', activeProject.id, {
                        milestones: next,
                        progress: pct,
                        activity: [
                          {
                            id: `pa-${Date.now()}`,
                            text: `Added milestone: ${newMilestone.trim()}`,
                            at: new Date().toISOString().slice(0, 10),
                          },
                          ...activeProject.activity,
                        ],
                      });
                      setNewMilestone('');
                    }}
                    className="flex gap-2 mt-2.5"
                  >
                    <input
                      type="text"
                      value={newMilestone}
                      onChange={(e) => setNewMilestone(e.target.value)}
                      placeholder="Add milestone…"
                      className="flex-1 h-[36px] px-3 rounded-[8px] bg-[var(--bg-main)] border border-[var(--border-color)] text-[13px]"
                    />
                    <button
                      type="submit"
                      className="h-[36px] px-3 rounded-[8px] bg-[var(--sage)] text-white text-[12.5px] font-semibold"
                    >
                      Add
                    </button>
                  </form>
                </div>

                <div>
                  <h3 className="text-[14px] font-semibold mb-1.5">Project Notes</h3>
                  <textarea
                    rows={4}
                    value={activeProject.notes}
                    onChange={(e) =>
                      updateItem('projects', activeProject.id, { notes: e.target.value })
                    }
                    className="w-full p-3 rounded-[9px] bg-[var(--bg-main)] border border-[var(--border-color)] text-[13px]"
                  />
                </div>
              </div>

              {/* Links & Activity */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 rounded-[10px] bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2">
                  <p className="text-[12px] font-semibold text-[var(--text-secondary)]">
                    Timeline
                  </p>
                  <p className="text-[13px] tabular-nums">
                    {activeProject.startDate} → {activeProject.deadline}
                  </p>
                </div>

                <div className="p-4 rounded-[10px] bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2">
                  <p className="text-[12px] font-semibold text-[var(--text-secondary)]">Links</p>
                  {activeProject.links.length === 0 ? (
                    <p className="text-[12px] text-[var(--text-muted)]">No reference links.</p>
                  ) : (
                    activeProject.links.map((l) => (
                      <a
                        key={l.id}
                        href={l.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-[13px] text-[var(--sage-dark)] hover:underline"
                      >
                        <Link2 className="w-3.5 h-3.5" /> {l.label}
                      </a>
                    ))
                  )}
                </div>

                <div className="p-4 rounded-[10px] bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2">
                  <p className="text-[12px] font-semibold text-[var(--text-secondary)]">
                    Activity History
                  </p>
                  <div className="space-y-1.5 text-[12px]">
                    {activeProject.activity.map((act) => (
                      <div key={act.id} className="flex justify-between gap-2">
                        <span>{act.text}</span>
                        <span className="text-[var(--text-muted)] tabular-nums shrink-0">
                          {act.at}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight">Projects</h1>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Track creative work, milestones, and deliverables.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 rounded-[9px] bg-[var(--bg-card)] border border-[var(--border-color)]">
            {(
              [
                ['grid', Grid],
                ['list', List],
                ['kanban', Kanban],
                ['timeline', Calendar],
              ] as const
            ).map(([id, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                title={`${id} view`}
                className={`w-8 h-8 rounded-[7px] flex items-center justify-center ${
                  view === id
                    ? 'bg-[var(--sage-soft)] text-[var(--sage-dark)]'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[13px] font-semibold flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Every big project starts with one milestone."
          description="Organize your creative builds, research papers, and portfolio projects."
          actionLabel="Create your first project"
          onAction={() => setModalOpen(true)}
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className="cursor-pointer rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden hover:border-[var(--sage)] transition-colors flex flex-col justify-between"
            >
              {p.coverImage && (
                <img
                  src={withFileAuth(p.coverImage)}
                  alt={p.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-36 object-cover border-b border-[var(--border-color)]"
                />
              )}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded-[6px] text-[11px] font-semibold ${STATUS_BADGE[p.status]}`}>
                      {p.status}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteItem('projects', p.id);
                      }}
                      className="p-1 text-[var(--text-muted)] hover:text-[var(--error)]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="text-[16px] font-semibold mt-2">{p.title}</h3>
                  <p className="text-[12.5px] text-[var(--text-secondary)] mt-1 line-clamp-2">
                    {p.description}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[11.5px] tabular-nums text-[var(--text-muted)]">
                    <span>{p.startDate} → {p.deadline}</span>
                    <span className="font-semibold text-[var(--text-main)]">{p.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--sage)]" style={{ width: `${p.progress}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : view === 'list' ? (
        <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] divide-y divide-[var(--border-color)]">
          {projects.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-[var(--bg-secondary)]/35"
            >
              <div className="min-w-0">
                <h3 className="text-[14.5px] font-semibold">{p.title}</h3>
                <p className="text-[12px] text-[var(--text-secondary)] truncate">{p.description}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 tabular-nums">
                <span className={`px-2 py-0.5 rounded-[6px] text-[11px] font-semibold ${STATUS_BADGE[p.status]}`}>
                  {p.status}
                </span>
                <span className="text-[12px] text-[var(--text-muted)]">{p.deadline}</span>
                <span className="text-[13px] font-semibold">{p.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      ) : view === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
          {(['Planning', 'In Progress', 'Review', 'Completed'] as const).map((st) => (
            <div
              key={st}
              className="rounded-[12px] bg-[var(--bg-secondary)]/65 border border-[var(--border-color)] p-3 space-y-2.5"
            >
              <p className="text-[12.5px] font-semibold px-1">{st}</p>
              {projects
                .filter((p) => p.status === st)
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    className="w-full text-left p-3 rounded-[10px] bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--sage)]"
                  >
                    <p className="text-[13.5px] font-semibold">{p.title}</p>
                    <p className="text-[11.5px] text-[var(--text-muted)] mt-1 tabular-nums">
                      {p.progress}% · Due {p.deadline}
                    </p>
                  </button>
                ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-4">
          {[...projects]
            .sort((a, b) => a.startDate.localeCompare(b.startDate))
            .map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className="cursor-pointer space-y-1.5"
              >
                <div className="flex justify-between text-[13px]">
                  <span className="font-semibold">{p.title}</span>
                  <span className="text-[var(--text-muted)] tabular-nums">
                    {p.startDate} → {p.deadline}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--sage)]" style={{ width: `${Math.max(8, p.progress)}%` }} />
                </div>
              </div>
            ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Project">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await addItem('projects', {
              title: title.trim(),
              description: description.trim(),
              coverImage: coverImage || undefined,
              progress: 0,
              startDate,
              deadline,
              status: 'Planning',
              milestones: [],
              notes: '',
              links: [],
              activity: [{ id: `pa-${Date.now()}`, text: 'Project created', at: startDate }],
            });
            setTitle('');
            setDescription('');
            setCoverImage('');
            setModalOpen(false);
            notify('Project created');
          }}
          className="space-y-3"
        >
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Project title"
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[14px]"
          />
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What are you building?"
            className="w-full p-2.5 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] text-[var(--text-secondary)] mb-1">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-[38px] px-2.5 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
              />
            </div>
            <div>
              <label className="block text-[11.5px] text-[var(--text-secondary)] mb-1">Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full h-[38px] px-2.5 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 px-3 py-2 rounded-[8px] border border-dashed border-[var(--border-color)] cursor-pointer text-[12.5px]">
            <Upload className="w-4 h-4 text-[var(--sage-dark)]" />
            <span>{coverImage ? 'Cover image attached' : 'Upload cover image (optional)'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadCover(f);
              }}
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="h-[38px] px-4 rounded-[9px] border border-[var(--border-color)] text-[13px]">
              Cancel
            </button>
            <button type="submit" className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] text-white text-[13px] font-semibold">
              Create Project
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
