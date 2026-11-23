import React, { useMemo, useState } from 'react';
import { Library, Link2, Plus, Search, Trash2 } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import type { KnowledgeEntry } from '../types/workspace';

const SECTIONS = [
  'All Knowledge',
  'Research',
  'Articles',
  'Lessons',
  'Concepts',
  'Quotes',
  'Vocabulary',
  'References',
] as const;

export function KnowledgeLibraryPage() {
  const { workspace, addItem, updateItem, deleteItem, notify } = useWorkspace();
  const entries = workspace?.knowledge || [];

  const [section, setSection] = useState<(typeof SECTIONS)[number]>('All Knowledge');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(entries[0]?.id || null);
  const [modalOpen, setModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [source, setSource] = useState('');
  const [category, setCategory] = useState<KnowledgeEntry['category']>('Concepts');
  const [tagsText, setTagsText] = useState('');
  const [relatedIds, setRelatedIds] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (section !== 'All Knowledge' && e.category !== section) return false;
      if (
        q &&
        !e.title.toLowerCase().includes(q) &&
        !e.content.toLowerCase().includes(q) &&
        !e.tags.some((t) => t.toLowerCase().includes(q))
      ) {
        return false;
      }
      return true;
    });
  }, [entries, section, search]);

  const active = entries.find((e) => e.id === selectedId) || filtered[0] || null;

  // Backlinks & related topic suggestions
  const backlinks = useMemo(() => {
    if (!active) return [];
    return entries.filter((e) => e.id !== active.id && e.relatedIds.includes(active.id));
  }, [entries, active]);

  const suggested = useMemo(() => {
    if (!active) return [];
    return entries.filter(
      (e) =>
        e.id !== active.id &&
        !active.relatedIds.includes(e.id) &&
        e.tags.some((t) => active.tags.includes(t))
    );
  }, [entries, active]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight">Knowledge Library</h1>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Connect concepts, references, quotes, and research into a living personal network.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[13px] font-semibold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Entry
        </button>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {SECTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSection(s)}
            className={`px-3 py-1.5 rounded-[8px] text-[12.5px] font-medium whitespace-nowrap shrink-0 ${
              section === s
                ? 'bg-[var(--lavender)] text-[#574970] font-semibold'
                : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-5 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search knowledge & tags..."
              className="w-full h-[38px] pl-9 pr-3 rounded-[9px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={Library}
              title="Build your personal encyclopedia."
              description="Save distilled concepts, quotes, vocabulary, and link related ideas together."
              actionLabel="Add first knowledge note"
              onAction={() => setModalOpen(true)}
              tone="lavender"
            />
          ) : (
            <div className="space-y-2.5">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-left p-4 rounded-[12px] border transition-colors ${
                    active?.id === item.id
                      ? 'bg-[var(--bg-card)] border-[#8E7FA8]'
                      : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[#8E7FA8]/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-[6px] bg-[var(--lavender)] text-[#574970] text-[11px] font-medium">
                      {item.category}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] tabular-nums">
                      {item.createdAt.slice(0, 10)}
                    </span>
                  </div>
                  <h3 className="text-[15px] font-semibold mt-2">{item.title}</h3>
                  <p className="text-[12.5px] text-[var(--text-secondary)] mt-1 line-clamp-2">
                    {item.content}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-7">
          {active ? (
            <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="px-2 py-0.5 rounded-[6px] bg-[var(--lavender)] text-[#574970] text-[11px] font-medium">
                    {active.category}
                  </span>
                  <h2 className="font-editorial text-[24px] text-[var(--text-main)] mt-2">
                    {active.title}
                  </h2>
                  {active.source && (
                    <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                      Source: {active.source}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => deleteItem('knowledge', active.id)}
                  className="p-1.5 rounded-[7px] text-[var(--error)] hover:bg-[var(--blush)]/45"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[14px] leading-relaxed text-[var(--text-main)] whitespace-pre-wrap">
                {active.content}
              </p>

              <div className="text-[12px] text-[var(--text-secondary)]">
                {active.tags.map((t) => `#${t}`).join('  ')}
              </div>

              <div className="pt-4 border-t border-[var(--border-color)] grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[12px] font-semibold text-[var(--text-main)] flex items-center gap-1.5 mb-2">
                    <Link2 className="w-3.5 h-3.5 text-[#6C5E85]" />
                    Connected Entries & Backlinks
                  </p>
                  <div className="space-y-1.5">
                    {[
                      ...entries.filter((e) => active.relatedIds.includes(e.id)),
                      ...backlinks,
                    ].map((rel) => (
                      <button
                        key={rel.id}
                        type="button"
                        onClick={() => setSelectedId(rel.id)}
                        className="w-full text-left px-2.5 py-1.5 rounded-[7px] bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[#8E7FA8] text-[12.5px] font-medium"
                      >
                        {rel.title}
                      </button>
                    ))}
                    {active.relatedIds.length === 0 && backlinks.length === 0 && (
                      <p className="text-[12px] text-[var(--text-muted)]">No linked topics yet.</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-[12px] font-semibold text-[var(--text-main)] mb-2">
                    Suggested Related Topics
                  </p>
                  <div className="space-y-1.5">
                    {suggested.length === 0 ? (
                      <p className="text-[12px] text-[var(--text-muted)]">
                        Share matching tags across entries to surface suggestions.
                      </p>
                    ) : (
                      suggested.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={async () => {
                            await updateItem('knowledge', active.id, {
                              relatedIds: [...active.relatedIds, s.id],
                            });
                            notify(`Linked "${s.title}"`);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-[7px] bg-[var(--lavender)]/35 hover:bg-[var(--lavender)]/60 text-[12px]"
                        >
                          + Link “{s.title}”
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-10 text-center text-[13px] text-[var(--text-secondary)]">
              Select a knowledge entry to inspect its notes and backlinks.
            </div>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Knowledge Entry">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const tags = tagsText
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean);
            const created = await addItem('knowledge', {
              title: title.trim(),
              content: content.trim(),
              source: source.trim(),
              category,
              tags,
              relatedIds,
              createdAt: new Date().toISOString(),
            });
            setSelectedId(created.id);
            setTitle('');
            setContent('');
            setSource('');
            setTagsText('');
            setRelatedIds([]);
            setModalOpen(false);
            notify('Knowledge entry saved');
          }}
          className="space-y-3"
        >
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Concept or note title"
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[14px]"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as KnowledgeEntry['category'])}
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
            >
              {SECTIONS.filter((s) => s !== 'All Knowledge').map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Source / Book / URL"
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
            />
          </div>
          <textarea
            rows={4}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Distilled insight or quote…"
            className="w-full p-2.5 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
          />
          <input
            type="text"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="Tags (comma-separated: ux, typography)"
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
          />
          {entries.length > 0 && (
            <div>
              <p className="text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                Link related entries
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {entries.map((ent) => {
                  const chosen = relatedIds.includes(ent.id);
                  return (
                    <button
                      key={ent.id}
                      type="button"
                      onClick={() =>
                        setRelatedIds((prev) =>
                          chosen ? prev.filter((x) => x !== ent.id) : [...prev, ent.id]
                        )
                      }
                      className={`px-2 py-1 rounded-[6px] text-[11.5px] border ${
                        chosen
                          ? 'bg-[var(--lavender)] border-[#8E7FA8] text-[#574970]'
                          : 'border-[var(--border-color)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {ent.title}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="h-[38px] px-4 rounded-[9px] border border-[var(--border-color)] text-[13px]">
              Cancel
            </button>
            <button type="submit" className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] text-white text-[13px] font-semibold">
              Save Entry
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
