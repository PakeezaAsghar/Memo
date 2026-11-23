import React, { useMemo, useState } from 'react';
import { ExternalLink, Lightbulb, Plus, Star, Trash2, Upload } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { api, withFileAuth } from '../lib/api';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import type { IdeaItem } from '../types/workspace';

const STATUSES: Array<'All' | IdeaItem['status']> = [
  'All',
  'New',
  'Exploring',
  'In Progress',
  'Completed',
  'Archived',
];

export function IdeaBankPage() {
  const { workspace, addItem, updateItem, deleteItem, notify } = useWorkspace();
  const ideas = workspace?.ideas || [];

  const [statusFilter, setStatusFilter] = useState<'All' | IdeaItem['status']>('All');
  const [modalOpen, setModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Creative');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const filtered = useMemo(
    () => ideas.filter((i) => statusFilter === 'All' || i.status === statusFilter),
    [ideas, statusFilter]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight">Idea Bank</h1>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Collect sparks, side-project concepts, and creative experiments.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[13px] font-semibold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Idea
        </button>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-[8px] text-[12.5px] font-medium whitespace-nowrap shrink-0 ${
              statusFilter === s
                ? 'bg-[var(--lavender)] text-[#574970] font-semibold'
                : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="Capture sparks before they drift away."
          description="Store half-formed concepts, sketches, and reference links until you are ready to build."
          actionLabel="Add your first idea"
          onAction={() => setModalOpen(true)}
          tone="yellow"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((idea) => (
            <div
              key={idea.id}
              className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden flex flex-col justify-between"
            >
              {idea.imageUrl && (
                <img
                  src={withFileAuth(idea.imageUrl)}
                  alt={idea.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-36 object-cover border-b border-[var(--border-color)]"
                />
              )}
              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-medium text-[#574970] bg-[var(--lavender)] px-2 py-0.5 rounded-[6px]">
                      {idea.category}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateItem('ideas', idea.id, { isFavorite: !idea.isFavorite })
                      }
                      className="p-1 text-[var(--text-muted)] hover:text-[var(--warning)]"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          idea.isFavorite ? 'fill-[var(--warning)] text-[var(--warning)]' : ''
                        }`}
                      />
                    </button>
                  </div>
                  <h3 className="text-[15.5px] font-semibold mt-2">{idea.title}</h3>
                  <p className="text-[12.5px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                    {idea.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between gap-2">
                  <select
                    value={idea.status}
                    onChange={(e) =>
                      updateItem('ideas', idea.id, {
                        status: e.target.value as IdeaItem['status'],
                      })
                    }
                    className="h-7 px-2 rounded-[6px] bg-[var(--bg-main)] border border-[var(--border-color)] text-[11.5px] font-medium"
                  >
                    {STATUSES.filter((s) => s !== 'All').map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1">
                    {idea.referenceUrl && (
                      <a
                        href={idea.referenceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[var(--sage-dark)] hover:bg-[var(--sage-soft)]"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteItem('ideas', idea.id)}
                      className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[var(--error)] hover:bg-[var(--blush)]/45"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Save Idea">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await addItem('ideas', {
              title: title.trim(),
              description: description.trim(),
              category,
              status: 'New',
              referenceUrl: referenceUrl.trim() || undefined,
              imageUrl: imageUrl || undefined,
              isFavorite: false,
              createdAt: new Date().toISOString().slice(0, 10),
            });
            setTitle('');
            setDescription('');
            setReferenceUrl('');
            setImageUrl('');
            setModalOpen(false);
            notify('Idea saved');
          }}
          className="space-y-3"
        >
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Idea title"
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[14px]"
          />
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category (Creative, Product, Writing)"
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
          />
          <textarea
            rows={3}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the idea…"
            className="w-full p-2.5 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
          />
          <input
            type="url"
            value={referenceUrl}
            onChange={(e) => setReferenceUrl(e.target.value)}
            placeholder="Reference link (optional)"
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
          />
          <label className="flex items-center gap-2 px-3 py-2 rounded-[8px] border border-dashed border-[var(--border-color)] cursor-pointer text-[12.5px]">
            <Upload className="w-4 h-4 text-[var(--sage-dark)]" />
            <span>{imageUrl ? 'Image attached' : 'Attach image (optional)'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const up = await api.uploadFile(f);
                  setImageUrl(up.url);
                }
              }}
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="h-[38px] px-4 rounded-[9px] border border-[var(--border-color)] text-[13px]">
              Cancel
            </button>
            <button type="submit" className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] text-white text-[13px] font-semibold">
              Save Idea
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
