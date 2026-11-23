import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  Check,
  ChevronDown,
  Copy,
  FolderInput,
  Paperclip,
  Pin,
  Plus,
  Search,
  Star,
  StickyNote,
  Trash2,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { api, withFileAuth } from '../lib/api';
import { EmptyState } from '../components/ui/EmptyState';
import { RichTextEditor } from '../components/ui/RichTextEditor';
import type { NoteItem } from '../types/workspace';

const BASE_CATEGORIES = [
  'All Notes',
  'Study',
  'Ideas',
  'Personal',
  'Projects',
  'Work',
  'Important',
  'Archived',
];

const CATEGORY_BADGE_TONE: Record<string, string> = {
  Study: 'bg-[var(--lavender)] text-[#574970]',
  Ideas: 'bg-[var(--pale-yellow)] text-[#7C5F29]',
  Personal: 'bg-[var(--blush)] text-[#8A4E50]',
  Projects: 'bg-[var(--sage-soft)] text-[var(--sage-dark)]',
  Work: 'bg-[#E5ECF4] text-[#455E7B]',
  Important: 'bg-[var(--peach)] text-[#875332]',
};

const STICKY_NOTE_STYLES = [
  {
    tilt: '-rotate-2',
    offset: '',
    fastener: 'pin' as const,
    tapeColor: '',
    curl: true,
  },
  {
    tilt: 'rotate-2',
    offset: 'sm:translate-y-3',
    fastener: 'none' as const,
    tapeColor: '',
    curl: false,
  },
  {
    tilt: '-rotate-3',
    offset: '',
    fastener: 'pin' as const,
    tapeColor: '',
    curl: false,
  },
  {
    tilt: 'rotate-3',
    offset: 'sm:translate-y-3',
    fastener: 'tape' as const,
    tapeColor: 'bg-[#EE7773]/85',
    curl: true,
  },
  {
    tilt: '-rotate-2',
    offset: '',
    fastener: 'clip' as const,
    tapeColor: '',
    curl: true,
  },
  {
    tilt: 'rotate-2',
    offset: 'sm:translate-y-2',
    fastener: 'tape' as const,
    tapeColor: 'bg-[#EB8B38]/85',
    curl: false,
  },
];

export function NotesPage() {
  const {
    workspace,
    addItem,
    updateItem,
    deleteItem,
    updateCustomNoteCategories,
    notify,
  } = useWorkspace();

  const notes = workspace?.notes || [];
  const customCategories = workspace?.customNoteCategories || [];
  const [selectedCat, setSelectedCat] = useState<string>('All Notes');
  const [search, setSearch] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(
    () => notes[0]?.id || null
  );
  const [newCatInput, setNewCatInput] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const [saveState, setSaveState] = useState<'Saved' | 'Saving…'>('Saved');
  const [moveMenuOpen, setMoveMenuOpen] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const saveTimerRef = useRef<number | null>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);
  const moveMenuRef = useRef<HTMLDivElement>(null);
  const catMenuRef = useRef<HTMLDivElement>(null);

  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notes
      .filter((n) => {
        if (selectedCat === 'Archived') return n.isArchived;
        if (n.isArchived) return false;
        if (selectedCat !== 'All Notes' && n.category !== selectedCat) return false;
        if (q) {
          return (
            n.title.toLowerCase().includes(q) ||
            n.plainText.toLowerCase().includes(q) ||
            n.category.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [notes, selectedCat, search]);

  const activeNote = useMemo(
    () => notes.find((n) => n.id === selectedNoteId) || filteredNotes[0] || null,
    [notes, selectedNoteId, filteredNotes]
  );

  useEffect(() => {
    if (!selectedNoteId && filteredNotes[0]) {
      setSelectedNoteId(filteredNotes[0].id);
    }
  }, [filteredNotes, selectedNoteId]);

  useEffect(() => {
    setTitleDraft(activeNote?.title || '');
    setMoveMenuOpen(false);
  }, [activeNote?.id, activeNote?.title]);

  useEffect(() => {
    if (!moveMenuOpen) return;
    const handlePointer = (e: MouseEvent) => {
      if (moveMenuRef.current && !moveMenuRef.current.contains(e.target as Node)) {
        setMoveMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoveMenuOpen(false);
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [moveMenuOpen]);

  useEffect(() => {
    if (!catMenuOpen) return;
    const handlePointer = (e: MouseEvent) => {
      if (catMenuRef.current && !catMenuRef.current.contains(e.target as Node)) {
        setCatMenuOpen(false);
        setShowAddCat(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCatMenuOpen(false);
        setShowAddCat(false);
      }
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [catMenuOpen]);

  const createNote = async () => {
    const now = new Date().toISOString();
    const cat =
      selectedCat === 'All Notes' || selectedCat === 'Archived' ? 'Personal' : selectedCat;
    const created = await addItem('notes', {
      title: 'Untitled Note',
      contentHtml: '<p></p>',
      plainText: '',
      category: cat,
      isPinned: false,
      isFavorite: false,
      isArchived: false,
      wordCount: 0,
      attachments: [],
      updatedAt: now,
      createdAt: now,
    });
    setSelectedNoteId(created.id);
    notify('New note created');
  };

  const scheduleAutoSave = (noteId: string, patch: Partial<NoteItem>) => {
    setSaveState('Saving…');
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(async () => {
      await updateItem('notes', noteId, {
        ...patch,
        updatedAt: new Date().toISOString(),
      });
      setSaveState('Saved');
    }, 350);
  };

  const duplicateNote = async (note: NoteItem) => {
    try {
      const now = new Date().toISOString();
      const baseTitle = (titleDraft || note.title || 'Untitled Note').trim();
      const copy = await addItem('notes', {
        title: `${baseTitle} (Copy)`,
        contentHtml: note.contentHtml,
        plainText: note.plainText,
        category: note.category,
        isPinned: false,
        isFavorite: note.isFavorite,
        isArchived: false,
        wordCount: note.wordCount,
        attachments: [...(note.attachments || [])],
        updatedAt: now,
        createdAt: now,
      });
      if (selectedCat === 'Archived') {
        setSelectedCat('All Notes');
      }
      setSelectedNoteId(copy.id);
      notify('Note duplicated');
    } catch {
      notify('Unable to duplicate note', 'error');
    }
  };

  const handleAttach = async (file: File) => {
    if (!activeNote) return;
    setAttaching(true);
    try {
      const up = await api.uploadFile(file);
      const nextAtt = [
        ...(activeNote.attachments || []),
        { id: `att-${Date.now()}`, name: up.name, url: up.url, size: up.size },
      ];
      await updateItem('notes', activeNote.id, {
        attachments: nextAtt,
        updatedAt: new Date().toISOString(),
      });
      notify(`Attached ${up.name}`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Attachment upload failed', 'error');
    } finally {
      setAttaching(false);
    }
  };

  const allCategories = [...BASE_CATEGORIES, ...customCategories];
  const assignableFolders = [
    ...BASE_CATEGORIES.filter((c) => c !== 'All Notes' && c !== 'Archived'),
    ...customCategories,
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-[var(--text-main)]">
            Notes
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Capture. Organize. Remember.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Notebooks category dropdown */}
          <div ref={catMenuRef} className="relative">
            <button
              type="button"
              aria-expanded={catMenuOpen}
              onClick={() => setCatMenuOpen((v) => !v)}
              className="h-[38px] px-3.5 rounded-[9px] bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--sage)] text-[13px] font-medium text-[var(--text-main)] flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <span className="text-[var(--text-muted)]">Notebooks:</span>
              <span className="font-semibold text-[var(--sage-dark)]">{selectedCat}</span>
              <ChevronDown
                className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${
                  catMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {catMenuOpen && (
              <div className="absolute left-0 sm:right-0 sm:left-auto mt-1.5 w-56 p-1.5 rounded-[10px] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-[0_14px_32px_rgba(57,54,47,0.14)] z-30 space-y-0.5">
                <p className="px-2.5 py-1 text-[11px] font-semibold tracking-wider text-[var(--text-muted)]">
                  NOTEBOOKS
                </p>
                {allCategories.map((cat) => {
                  const isActive = selectedCat === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCat(cat);
                        setCatMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-[7px] text-[13px] transition-colors flex items-center justify-between ${
                        isActive
                          ? 'bg-[var(--sage-soft)] text-[var(--sage-dark)] font-semibold'
                          : 'text-[var(--text-main)] hover:bg-[var(--bg-secondary)]'
                      }`}
                    >
                      <span className="truncate">{cat}</span>
                      {isActive && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}

                <div className="pt-1 mt-1 border-t border-[var(--border-color)]">
                  {showAddCat ? (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const trimmed = newCatInput.trim();
                        if (trimmed && !allCategories.includes(trimmed)) {
                          await updateCustomNoteCategories([...customCategories, trimmed]);
                          setSelectedCat(trimmed);
                          notify(`Added notebook "${trimmed}"`);
                        }
                        setNewCatInput('');
                        setShowAddCat(false);
                        setCatMenuOpen(false);
                      }}
                      className="p-1 space-y-1.5"
                    >
                      <input
                        type="text"
                        value={newCatInput}
                        onChange={(e) => setNewCatInput(e.target.value)}
                        placeholder="Folder name"
                        autoFocus
                        className="w-full h-8 px-2 rounded-[7px] bg-[var(--bg-main)] border border-[var(--border-color)] text-[12px] focus:outline-none focus:border-[var(--sage)]"
                      />
                      <div className="flex gap-1">
                        <button
                          type="submit"
                          className="flex-1 h-7 rounded-[6px] bg-[var(--sage)] text-white text-[11px] font-semibold"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddCat(false)}
                          className="px-2 h-7 rounded-[6px] border border-[var(--border-color)] text-[11px]"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddCat(true)}
                      className="w-full px-2.5 py-1.5 rounded-[7px] text-[12px] font-medium text-[var(--sage-dark)] hover:bg-[var(--bg-secondary)] flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Category
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={createNote}
            className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[13px] font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
        </div>
      </div>

      {/* 2-Column desktop layout: Writing pad first, Notes grid after */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Start: Rich Note Editor (Writing Pad) */}
        <section className="lg:col-span-7">
          {activeNote ? (
            <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4 sm:p-5 space-y-4">
              {/* Toolbar actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-2 text-[12px] text-[var(--text-muted)] tabular-nums">
                  <span>{saveState}</span>
                  <span>·</span>
                  <span>{activeNote.wordCount} words</span>
                  <span>·</span>
                  <span>{activeNote.category}</span>
                </div>

                <div className="flex items-center gap-1 relative">
                  <button
                    type="button"
                    title="Pin note"
                    onClick={() =>
                      updateItem('notes', activeNote.id, { isPinned: !activeNote.isPinned })
                    }
                    className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors ${
                      activeNote.isPinned
                        ? 'bg-[var(--sage-soft)] text-[var(--sage-dark)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                    }`}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Favorite note"
                    onClick={() =>
                      updateItem('notes', activeNote.id, { isFavorite: !activeNote.isFavorite })
                    }
                    className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        activeNote.isFavorite ? 'fill-[var(--warning)] text-[var(--warning)]' : ''
                      }`}
                    />
                  </button>
                  <button
                    type="button"
                    title={attaching ? 'Uploading attachment…' : 'Attach file'}
                    disabled={attaching}
                    onClick={() => attachInputRef.current?.click()}
                    className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <input
                    ref={attachInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleAttach(f);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    title="Duplicate note"
                    onClick={() => duplicateNote(activeNote)}
                    className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <div ref={moveMenuRef} className="relative">
                    <button
                      type="button"
                      title="Move to folder"
                      aria-expanded={moveMenuOpen}
                      onClick={() => setMoveMenuOpen((v) => !v)}
                      className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors ${
                        moveMenuOpen
                          ? 'bg-[var(--sage-soft)] text-[var(--sage-dark)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                      }`}
                    >
                      <FolderInput className="w-4 h-4" />
                    </button>
                    {moveMenuOpen && (
                      <div className="absolute right-0 mt-1 w-44 py-1 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-lg z-30">
                        {assignableFolders.map((folder) => {
                          const isCurrent = activeNote.category === folder;
                          return (
                            <button
                              key={folder}
                              type="button"
                              onClick={async () => {
                                try {
                                  await updateItem('notes', activeNote.id, {
                                    category: folder,
                                    updatedAt: new Date().toISOString(),
                                  });
                                  setMoveMenuOpen(false);
                                  if (
                                    selectedCat !== 'All Notes' &&
                                    selectedCat !== 'Archived' &&
                                    selectedCat !== folder
                                  ) {
                                    setSelectedNoteId(null);
                                  }
                                  notify(`Moved to ${folder}`);
                                } catch {
                                  notify('Unable to move note', 'error');
                                }
                              }}
                              className={`w-full text-left px-3 py-1.5 text-[12px] flex items-center justify-between hover:bg-[var(--bg-secondary)] ${
                                isCurrent
                                  ? 'font-semibold text-[var(--sage-dark)] bg-[var(--sage-soft)]/50'
                                  : 'text-[var(--text-main)]'
                              }`}
                            >
                              <span className="truncate">{folder}</span>
                              {isCurrent && <span className="text-[10px]">Current</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    title={activeNote.isArchived ? 'Unarchive' : 'Archive note'}
                    onClick={async () => {
                      try {
                        const nextArchived = !activeNote.isArchived;
                        await updateItem('notes', activeNote.id, {
                          isArchived: nextArchived,
                          updatedAt: new Date().toISOString(),
                        });
                        setSelectedNoteId(null);
                        notify(nextArchived ? 'Note archived' : 'Note restored');
                      } catch {
                        notify('Unable to update archive status', 'error');
                      }
                    }}
                    className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors ${
                      activeNote.isArchived
                        ? 'bg-[var(--sage-soft)] text-[var(--sage-dark)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                    }`}
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Delete note"
                    onClick={async () => {
                      try {
                        await deleteItem('notes', activeNote.id);
                        setSelectedNoteId(null);
                        notify('Note deleted');
                      } catch {
                        notify('Unable to delete note', 'error');
                      }
                    }}
                    className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[var(--error)] hover:bg-[var(--blush)]/45"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={titleDraft}
                onChange={(e) => {
                  const title = e.target.value;
                  setTitleDraft(title);
                  scheduleAutoSave(activeNote.id, { title });
                }}
                placeholder="Note title…"
                className="w-full max-w-[320px] text-[18px] leading-tight font-bold text-[var(--text-main)] bg-transparent focus:outline-none"
              />

              <RichTextEditor
                key={activeNote.id}
                valueHtml={activeNote.contentHtml}
                onChange={(contentHtml, plainText, wordCount) =>
                  scheduleAutoSave(activeNote.id, { contentHtml, plainText, wordCount })
                }
                onError={(msg) => notify(msg, 'error')}
                placeholder="Write freely…"
                minHeightClass="min-h-[300px]"
              />

              {activeNote.attachments.length > 0 && (
                <div className="pt-2 border-t border-[var(--border-color)]">
                  <p className="text-[12px] font-semibold text-[var(--text-secondary)] mb-2">
                    Attachments
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {activeNote.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={withFileAuth(att.url)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-[8px] bg-[var(--bg-main)] border border-[var(--border-color)] text-[12px] text-[var(--text-main)] hover:border-[var(--sage)] flex items-center gap-1.5"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-[var(--sage-dark)]" />
                        <span>{att.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-10 text-center text-[13px] text-[var(--text-secondary)]">
              Select a note to read or edit, or create a new one.
            </div>
          )}
        </section>

        {/* End: Notes List */}
        <section className="lg:col-span-5 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="w-full h-[40px] pl-9 pr-3 rounded-[9px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px] focus:outline-none focus:border-[var(--sage)]"
            />
          </div>

          {filteredNotes.length === 0 ? (
            <EmptyState
              icon={StickyNote}
              title="Your thoughts deserve a home."
              description="Capture lecture snippets, quiet ideas, or checklists in your personal notebook."
              actionLabel="Create your first note"
              onAction={createNote}
              tone="sage"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5 overflow-x-clip px-3 py-4">
              {filteredNotes.map((note, idx) => {
                const isSelected = activeNote?.id === note.id;
                const sticky = STICKY_NOTE_STYLES[idx % STICKY_NOTE_STYLES.length];
                const badgeTone =
                  CATEGORY_BADGE_TONE[note.category] ||
                  'bg-[var(--bg-secondary)] text-[var(--text-secondary)]';
                return (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNoteId(note.id)}
                    className={`relative cursor-pointer p-4 pt-5 min-h-[155px] rounded-[4px] bg-[var(--bg-card)] border flex flex-col transition-all duration-200 shadow-[0_7px_16px_rgba(57,54,47,0.10)] hover:shadow-[0_12px_24px_rgba(57,54,47,0.16)] hover:rotate-0 hover:scale-[1.02] hover:z-10 ${sticky.tilt} ${sticky.offset} ${
                      isSelected
                        ? 'border-[var(--sage)] ring-1 ring-[var(--sage)] z-10'
                        : 'border-[var(--border-color)] hover:border-[var(--sage)]/55'
                    }`}
                  >
                    {sticky.fastener === 'pin' && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center"
                      >
                        <span className="w-4 h-4 rounded-full bg-[radial-gradient(circle_at_35%_30%,#FF9D9D_0%,#E03333_55%,#9E1919_100%)] shadow-[0_3px_5px_rgba(0,0,0,0.28)] border border-white/35" />
                        <span className="w-1.5 h-1.5 -mt-1 rounded-full bg-black/25 blur-[1px]" />
                      </span>
                    )}
                    {sticky.fastener === 'tape' && (
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 z-20 w-12 h-3.5 rounded-[2px] shadow-[0_1px_3px_rgba(0,0,0,0.12)] ${sticky.tapeColor}`}
                      />
                    )}
                    {sticky.fastener === 'clip' && (
                      <svg
                        viewBox="0 0 24 44"
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-3.5 right-4 z-20 w-5 h-8 rotate-12 text-[#78849A] dark:text-[#A9B5C9] drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
                      >
                        <path
                          d="M8 14V31C8 35.4 11.6 39 16 39C20.4 39 24 35.4 24 31V10C24 5.0 20.0 1 15 1C10.0 1 6 5.0 6 10V30"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.1"
                          strokeLinecap="round"
                          transform="translate(-3,0)"
                        />
                      </svg>
                    )}
                    {sticky.curl && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute bottom-0 right-0 w-7 h-7 rounded-tl-[8px] bg-[linear-gradient(135deg,transparent_50%,rgba(57,54,47,0.06)_52%,rgba(255,255,255,0.75)_78%,rgba(57,54,47,0.08)_100%)]"
                      />
                    )}

                    <div className="flex items-start justify-between gap-1.5">
                      <h3 className="text-[14px] font-semibold text-[var(--text-main)] line-clamp-1">
                        {note.isPinned && (
                          <Pin className="w-3.5 h-3.5 inline mr-1 text-[var(--sage-dark)]" />
                        )}
                        {note.title || 'Untitled Note'}
                      </h3>
                      <button
                        type="button"
                        aria-label="Toggle favorite"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateItem('notes', note.id, { isFavorite: !note.isFavorite });
                        }}
                        className="p-0.5 rounded-md text-[var(--text-muted)] hover:text-[var(--warning)] shrink-0"
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            note.isFavorite ? 'fill-[var(--warning)] text-[var(--warning)]' : ''
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-[12px] text-[var(--text-secondary)] mt-1.5 line-clamp-3 leading-snug">
                      {note.plainText || 'No content yet…'}
                    </p>
                    <div className="mt-auto pt-3 flex flex-wrap items-center justify-between gap-1.5">
                      <span className={`px-2 py-0.5 rounded-[5px] text-[10.5px] font-medium ${badgeTone}`}>
                        {note.category}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] tabular-nums">
                        {note.updatedAt.slice(0, 10)} · {note.wordCount} words
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
