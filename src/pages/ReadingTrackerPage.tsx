import React, { useMemo, useRef, useState } from 'react';
import { BookOpen, Plus, Star, Trash2, Upload } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { api, withFileAuth } from '../lib/api';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import type { BookItem } from '../types/workspace';

const BOOK_TABS: Array<'All' | BookItem['category']> = [
  'All',
  'Currently Reading',
  'Want to Read',
  'Completed',
  'On Hold',
];

export function ReadingTrackerPage() {
  const { workspace, addItem, updateItem, deleteItem, notify } = useWorkspace();
  const books = workspace?.books || [];

  const [tab, setTab] = useState<'All' | BookItem['category']>('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BookItem | null>(null);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState<BookItem['category']>('Want to Read');
  const [currentPage, setCurrentPage] = useState('0');
  const [totalPages, setTotalPages] = useState('250');
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const coverRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () => books.filter((b) => tab === 'All' || b.category === tab),
    [books, tab]
  );

  const completedCount = books.filter((b) => b.category === 'Completed').length;
  const yearlyReadingGoal = 12;

  const openNew = () => {
    setEditing(null);
    setTitle('');
    setAuthor('');
    setCategory('Want to Read');
    setCurrentPage('0');
    setTotalPages('240');
    setRating(0);
    setNotes('');
    setCoverUrl('');
    setModalOpen(true);
  };

  const openEdit = (b: BookItem) => {
    setEditing(b);
    setTitle(b.title);
    setAuthor(b.author);
    setCategory(b.category);
    setCurrentPage(String(b.currentPage));
    setTotalPages(String(b.totalPages));
    setRating(b.rating);
    setNotes(b.notes);
    setCoverUrl(b.coverUrl || '');
    setModalOpen(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight">Reading Tracker</h1>
          <p className="text-[13px] text-[var(--text-secondary)]">
            Your digital library, page progress, and margin notes.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[13px] font-semibold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Book
        </button>
      </div>

      {/* Reading goal & stats */}
      <div className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold">2026 Reading Goal</p>
          <p className="text-[12px] text-[var(--text-secondary)] tabular-nums">
            {completedCount} of {yearlyReadingGoal} books completed ·{' '}
            {books.filter((b) => b.category === 'Currently Reading').length} currently reading
          </p>
        </div>
        <div className="w-full sm:w-64 h-2.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--sage)]"
            style={{ width: `${Math.min(100, Math.round((completedCount / yearlyReadingGoal) * 100))}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {BOOK_TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-[8px] text-[12.5px] font-medium whitespace-nowrap shrink-0 ${
              tab === t
                ? 'bg-[var(--sage-soft)] text-[var(--sage-dark)] font-semibold'
                : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Every shelf begins with a favorite book."
          description="Track what you want to read next, log pages, and save reflections."
          actionLabel="Add your first book"
          onAction={openNew}
          tone="sage"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((book) => {
            const pct = book.totalPages
              ? Math.min(100, Math.round((book.currentPage / book.totalPages) * 100))
              : 0;
            return (
              <div
                key={book.id}
                onClick={() => openEdit(book)}
                className="cursor-pointer rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4 flex gap-4 hover:border-[var(--sage)] transition-colors"
              >
                {book.coverUrl ? (
                  <img
                    src={withFileAuth(book.coverUrl)}
                    alt={book.title}
                    referrerPolicy="no-referrer"
                    className="w-20 h-28 object-cover rounded-[8px] border border-[var(--border-color)] shrink-0"
                  />
                ) : (
                  <div className="w-20 h-28 rounded-[8px] bg-[var(--sage-soft)] border border-[var(--border-color)] p-2 flex flex-col justify-between shrink-0">
                    <span className="font-editorial text-[12px] text-[var(--sage-dark)] leading-tight line-clamp-3">
                      {book.title}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] truncate">
                      {book.author}
                    </span>
                  </div>
                )}

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-medium text-[var(--sage-dark)]">
                        {book.category}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteItem('books', book.id);
                        }}
                        className="p-1 text-[var(--text-muted)] hover:text-[var(--error)]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h3 className="text-[15px] font-semibold line-clamp-1 mt-0.5">{book.title}</h3>
                    <p className="text-[12px] text-[var(--text-secondary)] truncate">{book.author}</p>
                    <div className="flex items-center gap-0.5 mt-1.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`w-3.5 h-3.5 ${
                            n <= book.rating
                              ? 'fill-[var(--warning)] text-[var(--warning)]'
                              : 'text-[var(--border-color)]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1 pt-2">
                    <div className="flex justify-between text-[11px] text-[var(--text-muted)] tabular-nums">
                      <span>
                        p. {book.currentPage}/{book.totalPages}
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--sage)]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Update Book' : 'Add Book'}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const payload = {
              title: title.trim(),
              author: author.trim(),
              category,
              coverUrl: coverUrl || undefined,
              currentPage: Number(currentPage) || 0,
              totalPages: Math.max(1, Number(totalPages) || 200),
              rating,
              notes: notes.trim(),
              updatedAt: new Date().toISOString().slice(0, 10),
            };
            if (editing) {
              await updateItem('books', editing.id, payload);
              notify('Book updated');
            } else {
              await addItem('books', payload);
              notify('Book added to library');
            }
            setModalOpen(false);
          }}
          className="space-y-3"
        >
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Book title"
            className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[14px]"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              required
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author"
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as BookItem['category'])}
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
            >
              <option value="Want to Read">Want to Read</option>
              <option value="Currently Reading">Currently Reading</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </select>
            <input
              type="number"
              value={currentPage}
              onChange={(e) => setCurrentPage(e.target.value)}
              placeholder="Current page"
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
            />
            <input
              type="number"
              value={totalPages}
              onChange={(e) => setTotalPages(e.target.value)}
              placeholder="Total pages"
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[var(--text-secondary)]">Rating:</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)}>
                <Star
                  className={`w-4 h-4 ${
                    n <= rating ? 'fill-[var(--warning)] text-[var(--warning)]' : 'text-[var(--text-muted)]'
                  }`}
                />
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 px-3 py-2 rounded-[8px] border border-dashed border-[var(--border-color)] cursor-pointer text-[12.5px]">
            <Upload className="w-4 h-4 text-[var(--sage-dark)]" />
            <span>{coverUrl ? 'Cover attached' : 'Upload cover image (optional)'}</span>
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const up = await api.uploadFile(f);
                  setCoverUrl(up.url);
                }
              }}
            />
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Personal reading notes & favorite quotes"
            className="w-full p-2.5 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="h-[38px] px-4 rounded-[9px] border border-[var(--border-color)] text-[13px]">
              Cancel
            </button>
            <button type="submit" className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] text-white text-[13px] font-semibold">
              Save Book
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
