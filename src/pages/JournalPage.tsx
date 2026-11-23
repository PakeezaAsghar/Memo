import React, { useMemo, useRef, useState } from 'react';
import {
  CloudRain,
  Coffee,
  Edit3,
  Frown,
  Image as ImageIcon,
  NotebookPen,
  Plus,
  Smile,
  Sparkles,
  Sun,
  Trash2,
  Zap,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { api, withFileAuth } from '../lib/api';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { RichTextEditor } from '../components/ui/RichTextEditor';
import type { JournalEntry, JournalMood } from '../types/workspace';

const MOOD_META: Record<
  JournalMood,
  { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }
> = {
  happy: { label: 'Happy', icon: Smile, tone: 'bg-[var(--pale-yellow)] text-[#7C5F29]' },
  calm: { label: 'Calm', icon: Sun, tone: 'bg-[var(--sage-soft)] text-[var(--sage-dark)]' },
  productive: { label: 'Productive', icon: Zap, tone: 'bg-[var(--lavender)] text-[#574970]' },
  tired: { label: 'Tired', icon: Coffee, tone: 'bg-[var(--peach)] text-[#875332]' },
  sad: { label: 'Sad', icon: CloudRain, tone: 'bg-[#E5ECF4] text-[#455E7B]' },
  stressed: { label: 'Stressed', icon: Frown, tone: 'bg-[var(--blush)] text-[#8A4E50]' },
};

const PROMPTS = [
  'What small moment today deserves to be remembered?',
  'What gave you energy this week, and what quietly drained it?',
  'Write three things you would tell yourself a month from now.',
  'Describe the atmosphere around you right now in three sensory details.',
];

export function JournalPage() {
  const { workspace, addItem, updateItem, deleteItem, notify } = useWorkspace();
  const entries = workspace?.journal || [];

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMood, setSelectedMood] = useState<JournalMood | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  const [title, setTitle] = useState('');
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [contentHtml, setContentHtml] = useState('<p></p>');
  const [plainText, setPlainText] = useState('');
  const [mood, setMood] = useState<JournalMood>('calm');
  const [category, setCategory] = useState('Reflection');
  const [tagsText, setTagsText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);

  const filteredEntries = useMemo(() => {
    return entries
      .filter((e) => {
        if (selectedCategory !== 'All' && e.category !== selectedCategory) return false;
        if (selectedMood !== 'all' && e.mood !== selectedMood) return false;
        if (selectedDate && e.entryDate !== selectedDate) return false;
        return true;
      })
      .sort((a, b) => b.entryDate.localeCompare(a.entryDate));
  }, [entries, selectedCategory, selectedMood, selectedDate]);

  const moodCounts = useMemo(() => {
    const counts: Record<JournalMood, number> = {
      happy: 0,
      calm: 0,
      productive: 0,
      tired: 0,
      sad: 0,
      stressed: 0,
    };
    entries.forEach((e) => {
      counts[e.mood] = (counts[e.mood] || 0) + 1;
    });
    return counts;
  }, [entries]);

  const openNew = (promptText?: string) => {
    setEditingEntry(null);
    setTitle(promptText ? 'Evening Reflection' : '');
    setEntryDate(new Date().toISOString().slice(0, 10));
    setContentHtml(promptText ? `<p><em>${promptText}</em></p><p></p>` : '<p></p>');
    setPlainText(promptText || '');
    setMood('calm');
    setCategory('Reflection');
    setTagsText('');
    setImageUrl('');
    setEditorOpen(true);
  };

  const openEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setTitle(entry.title);
    setEntryDate(entry.entryDate);
    setContentHtml(entry.contentHtml);
    setPlainText(entry.plainText);
    setMood(entry.mood);
    setCategory(entry.category);
    setTagsText(entry.tags.join(', '));
    setImageUrl(entry.imageUrl || '');
    setEditorOpen(true);
  };

  const saveEntry = async (isDraft: boolean) => {
    const tags = tagsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = {
      title: title.trim() || 'Untitled Reflection',
      contentHtml,
      plainText,
      mood,
      category,
      tags,
      imageUrl: imageUrl || undefined,
      isDraft,
      entryDate,
    };

    if (editingEntry) {
      await updateItem('journal', editingEntry.id, payload);
      notify(isDraft ? 'Draft saved' : 'Journal entry updated');
    } else {
      await addItem('journal', {
        ...payload,
        createdAt: new Date().toISOString(),
      });
      notify(isDraft ? 'Saved as draft' : 'Entry published privately');
    }
    setEditorOpen(false);
  };

  const handleImagePick = async (file: File) => {
    try {
      const up = await api.uploadFile(file);
      setImageUrl(up.url);
      notify('Photo attached to entry');
    } catch {
      notify('Unable to upload image', 'error');
    }
  };

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const ymPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const entryDateSet = new Set(entries.map((e) => e.entryDate));

  return (
    <div className="space-y-5">
      {/* Blush-toned quiet header */}
      <div className="rounded-[14px] bg-[var(--blush)]/40 border border-[var(--rose)]/25 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[var(--text-main)]">
            Journal
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)]">Write. Reflect. Grow.</p>
        </div>
        <button
          type="button"
          onClick={() => openNew()}
          className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[13px] font-semibold flex items-center gap-1.5 self-start sm:self-auto whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          New Entry
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Mini journal calendar, categories, mood filters */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-[14px] font-semibold">
                {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="text-[11px] text-[var(--sage-dark)] hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const iso = `${ymPrefix}-${String(day).padStart(2, '0')}`;
                const hasEntry = entryDateSet.has(iso);
                const active = selectedDate === iso;
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setSelectedDate(active ? null : iso)}
                    className={`h-7 rounded-[6px] text-[11.5px] tabular-nums transition-colors ${
                      active
                        ? 'bg-[var(--rose)] text-white font-semibold'
                        : hasEntry
                        ? 'bg-[var(--blush)] text-[#7C4446] font-semibold'
                        : 'hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4 space-y-1.5">
            <p className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] mb-1">
              CATEGORIES
            </p>
            {['All', 'Reflection', 'Gratitude', 'Creative', 'Memories'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`w-full text-left px-2.5 py-1.5 rounded-[7px] text-[13px] ${
                  selectedCategory === cat
                    ? 'bg-[var(--blush)]/65 text-[#7C4446] font-semibold'
                    : 'text-[var(--text-main)] hover:bg-[var(--bg-secondary)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
            <p className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] mb-2.5">
              MOOD FILTER
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedMood('all')}
                className={`col-span-2 py-1.5 rounded-[7px] text-[12px] font-medium ${
                  selectedMood === 'all'
                    ? 'bg-[var(--sage-soft)] text-[var(--sage-dark)] font-semibold'
                    : 'bg-[var(--bg-main)] text-[var(--text-secondary)]'
                }`}
              >
                All moods
              </button>
              {(Object.keys(MOOD_META) as JournalMood[]).map((m) => {
                const MIcon = MOOD_META[m].icon;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMood(m)}
                    className={`py-1.5 px-2 rounded-[7px] text-[12px] flex items-center gap-1.5 ${
                      selectedMood === m
                        ? MOOD_META[m].tone + ' font-semibold'
                        : 'bg-[var(--bg-main)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                    }`}
                  >
                    <MIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>{MOOD_META[m].label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Center: Editorial journal entries */}
        <section className="lg:col-span-6 space-y-4">
          {filteredEntries.length === 0 ? (
            <EmptyState
              icon={NotebookPen}
              title="Every day has a story."
              description="Keep a private, unhurried record of your reflections, quiet wins, and seasonal memories."
              actionLabel="Write your first entry"
              onAction={() => openNew()}
              tone="blush"
            />
          ) : (
            filteredEntries.map((entry) => {
              const mInfo = MOOD_META[entry.mood];
              const MIcon = mInfo.icon;
              return (
                <article
                  key={entry.id}
                  className="rounded-[14px] bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden"
                >
                  {entry.imageUrl && (
                    <img
                      src={withFileAuth(entry.imageUrl)}
                      alt={entry.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-48 object-cover border-b border-[var(--border-color)]"
                    />
                  )}
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2 text-[12px] text-[var(--text-muted)] tabular-nums">
                      <span>
                        {entry.entryDate} · {entry.category}
                        {entry.isDraft ? ' · Draft' : ''}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-[6px] text-[11px] font-medium inline-flex items-center gap-1 ${mInfo.tone}`}
                      >
                        <MIcon className="w-3 h-3" />
                        {mInfo.label}
                      </span>
                    </div>

                    <h2 className="font-editorial text-[22px] text-[var(--text-main)] mt-2 leading-snug">
                      {entry.title}
                    </h2>

                    <div
                      className="prose-myspace mt-2.5 text-[14px] text-[var(--text-main)]/90 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: entry.contentHtml }}
                    />

                    <div className="mt-4 pt-3 border-t border-[var(--border-color)] flex items-center justify-between gap-2">
                      <span className="text-[11.5px] text-[var(--text-muted)]">
                        {entry.tags.length > 0 ? entry.tags.map((t) => `#${t}`).join('  ') : 'Private entry'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(entry)}
                          className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                          title="Edit entry"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteItem('journal', entry.id)}
                          className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[var(--error)] hover:bg-[var(--blush)]/45"
                          title="Delete entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>

        {/* Right: Mood overview, stats, prompts */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
            <h3 className="text-[14px] font-semibold text-[var(--text-main)] mb-3">
              Monthly Mood Overview
            </h3>
            <div className="space-y-2">
              {(Object.keys(MOOD_META) as JournalMood[]).map((m) => {
                const count = moodCounts[m] || 0;
                const pct = entries.length ? Math.round((count / entries.length) * 100) : 0;
                return (
                  <div key={m} className="space-y-1">
                    <div className="flex justify-between text-[12px] tabular-nums">
                      <span className="text-[var(--text-secondary)]">{MOOD_META[m].label}</span>
                      <span className="font-medium text-[var(--text-main)]">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--rose)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
            <h3 className="text-[14px] font-semibold text-[var(--text-main)] mb-2">
              Journal Statistics
            </h3>
            <div className="grid grid-cols-2 gap-3 text-center pt-1">
              <div className="p-2.5 rounded-[9px] bg-[var(--bg-main)]">
                <p className="text-[20px] font-bold tabular-nums text-[var(--text-main)]">
                  {entries.length}
                </p>
                <p className="text-[11px] text-[var(--text-secondary)]">Total Entries</p>
              </div>
              <div className="p-2.5 rounded-[9px] bg-[var(--bg-main)]">
                <p className="text-[20px] font-bold tabular-nums text-[var(--text-main)]">
                  {entries.reduce((acc, e) => acc + (e.plainText ? e.plainText.split(/\s+/).length : 0), 0)}
                </p>
                <p className="text-[11px] text-[var(--text-secondary)]">Words Written</p>
              </div>
            </div>
          </div>

          <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4 space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[var(--rose)]" />
              <h3 className="text-[14px] font-semibold text-[var(--text-main)]">Writing Prompts</h3>
            </div>
            {PROMPTS.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => openNew(p)}
                className="w-full text-left p-2.5 rounded-[9px] bg-[var(--blush)]/25 hover:bg-[var(--blush)]/55 text-[12px] text-[var(--text-main)] leading-snug transition-colors"
              >
                “{p}”
              </button>
            ))}
          </div>
        </aside>
      </div>

      {/* Journal Entry Editor Modal */}
      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editingEntry ? 'Edit Journal Entry' : 'New Journal Entry'}
        maxWidthClass="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                Entry title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give today a quiet headline…"
                className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                Date
              </label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                How are you feeling?
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(MOOD_META) as JournalMood[]).map((m) => {
                  const MIcon = MOOD_META[m].icon;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMood(m)}
                      className={`px-2.5 py-1.5 rounded-[7px] text-[12px] flex items-center gap-1 border ${
                        mood === m
                          ? `${MOOD_META[m].tone} border-current font-semibold`
                          : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <MIcon className="w-3.5 h-3.5" />
                      {MOOD_META[m].label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-[40px] px-2.5 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
                >
                  <option value="Reflection">Reflection</option>
                  <option value="Gratitude">Gratitude</option>
                  <option value="Creative">Creative</option>
                  <option value="Memories">Memories</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                  Tags (comma)
                </label>
                <input
                  type="text"
                  value={tagsText}
                  onChange={(e) => setTagsText(e.target.value)}
                  placeholder="calm, autumn"
                  className="w-full h-[40px] px-2.5 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
                />
              </div>
            </div>
          </div>

          <RichTextEditor
            valueHtml={contentHtml}
            onChange={(html, plain) => {
              setContentHtml(html);
              setPlainText(plain);
            }}
            placeholder="Write what is on your mind…"
            minHeightClass="min-h-[200px]"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="h-[36px] px-3 rounded-[8px] border border-[var(--border-color)] text-[12.5px] font-medium flex items-center gap-1.5 hover:bg-[var(--bg-secondary)]"
              >
                <ImageIcon className="w-4 h-4" />
                {imageUrl ? 'Change photo' : 'Attach photo'}
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImagePick(f);
                  e.target.value = '';
                }}
              />
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="text-[12px] text-[var(--error)] hover:underline"
                >
                  Remove photo
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => saveEntry(true)}
                className="h-[38px] px-4 rounded-[9px] border border-[var(--border-color)] text-[13px] font-semibold hover:bg-[var(--bg-secondary)]"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => saveEntry(false)}
                className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[13px] font-semibold"
              >
                Publish Privately
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
