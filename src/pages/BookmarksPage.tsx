import React, { useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  Download,
  Edit2,
  ExternalLink,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import type { BookmarkItem } from '../types/workspace';

const BOOKMARK_CATEGORIES = [
  'All Links',
  'Learning',
  'Development',
  'Design',
  'Tools',
  'Research',
  'Personal',
];

export function BookmarksPage() {
  const { workspace, addItem, updateItem, deleteItem, notify } = useWorkspace();
  const bookmarks = workspace?.bookmarks || [];

  const [category, setCategory] = useState('All Links');
  const [search, setSearch] = useState('');
  const [onlyFav, setOnlyFav] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BookmarkItem | null>(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [itemCat, setItemCat] = useState('Learning');
  const importRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookmarks.filter((b) => {
      if (category !== 'All Links' && b.category !== category) return false;
      if (onlyFav && !b.isFavorite) return false;
      if (
        q &&
        !b.title.toLowerCase().includes(q) &&
        !b.domain.toLowerCase().includes(q) &&
        !b.description.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [bookmarks, category, search, onlyFav]);

  const openNew = () => {
    setEditing(null);
    setTitle('');
    setUrl('');
    setDescription('');
    setItemCat(category === 'All Links' ? 'Learning' : category);
    setModalOpen(true);
  };

  const openEdit = (bm: BookmarkItem) => {
    setEditing(bm);
    setTitle(bm.title);
    setUrl(bm.url);
    setDescription(bm.description);
    setItemCat(bm.category);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.startsWith('http') ? url.trim() : `https://${url.trim()}`;
    let domain = cleanUrl;
    try {
      domain = new URL(cleanUrl).hostname.replace(/^www\./, '');
    } catch {
      // keep raw
    }
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    if (editing) {
      await updateItem('bookmarks', editing.id, {
        title: title.trim() || domain,
        url: cleanUrl,
        domain,
        description: description.trim(),
        category: itemCat,
        faviconUrl,
      });
      notify('Bookmark updated');
    } else {
      await addItem('bookmarks', {
        title: title.trim() || domain,
        url: cleanUrl,
        domain,
        description: description.trim(),
        category: itemCat,
        faviconUrl,
        isFavorite: false,
        createdAt: new Date().toISOString(),
      });
      notify('Bookmark saved');
    }
    setModalOpen(false);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(bookmarks, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'memo-bookmarks.json';
    a.click();
    notify('Bookmarks exported');
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error('Invalid bookmark JSON array.');
      let added = 0;
      for (const item of parsed) {
        if (item.url && item.title) {
          let domain = item.domain || '';
          try {
            domain = domain || new URL(item.url).hostname.replace(/^www\./, '');
          } catch {
            domain = item.url;
          }
          await addItem('bookmarks', {
            title: String(item.title),
            url: String(item.url),
            domain,
            description: String(item.description || ''),
            category: String(item.category || 'Tools'),
            faviconUrl: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
            isFavorite: Boolean(item.isFavorite),
            createdAt: new Date().toISOString(),
          });
          added++;
        }
      }
      notify(`Imported ${added} bookmark(s)`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Import failed', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight">Bookmarks</h1>
          <p className="text-[13px] text-[var(--text-secondary)]">Save. Access. Explore.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => importRef.current?.click()}
            className="h-[38px] px-3.5 rounded-[9px] bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] text-[13px] font-semibold flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={handleExport}
            className="h-[38px] px-3.5 rounded-[9px] bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] text-[13px] font-semibold flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            type="button"
            onClick={openNew}
            className="h-[38px] px-4 rounded-[9px] bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[13px] font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Link
          </button>
        </div>
      </div>

      {/* Category tabs + Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {BOOKMARK_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-[8px] text-[12.5px] font-medium whitespace-nowrap shrink-0 transition-colors ${
                category === c
                  ? 'bg-[var(--sage-soft)] text-[var(--sage-dark)] font-semibold'
                  : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search links..."
              className="w-full h-[38px] pl-9 pr-3 rounded-[9px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px] focus:outline-none focus:border-[var(--sage)]"
            />
          </div>
          <button
            type="button"
            onClick={() => setOnlyFav((v) => !v)}
            className={`h-[38px] px-3 rounded-[9px] border text-[13px] font-medium flex items-center gap-1.5 ${
              onlyFav
                ? 'bg-[var(--pale-yellow)] border-[var(--warning)]/40 text-[var(--text-main)]'
                : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)]'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            Favorites
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Save the things worth coming back to."
          description="Keep your favorite reading essays, tools, design references, and documentation neatly organized."
          actionLabel="Add a bookmark"
          onAction={openNew}
          tone="yellow"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((bm) => (
            <div
              key={bm.id}
              className="rounded-[12px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4 flex flex-col justify-between gap-3 hover:border-[var(--sage)]/70 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-[8px] bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center shrink-0 overflow-hidden">
                      <img
                        src={bm.faviconUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-5 h-5 object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <a
                        href={bm.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[14.5px] font-semibold text-[var(--text-main)] hover:text-[var(--sage-dark)] line-clamp-1"
                      >
                        {bm.title}
                      </a>
                      <p className="text-[11.5px] text-[var(--text-muted)] truncate">{bm.domain}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Favorite bookmark"
                    onClick={() => updateItem('bookmarks', bm.id, { isFavorite: !bm.isFavorite })}
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--warning)] shrink-0"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        bm.isFavorite ? 'fill-[var(--warning)] text-[var(--warning)]' : ''
                      }`}
                    />
                  </button>
                </div>

                {bm.description && (
                  <p className="text-[12.5px] text-[var(--text-secondary)] mt-3 line-clamp-2 leading-relaxed">
                    {bm.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded-[6px] bg-[var(--bg-secondary)] text-[11px] font-medium text-[var(--text-secondary)]">
                  {bm.category}
                </span>
                <div className="flex items-center gap-1">
                  <a
                    href={bm.url}
                    target="_blank"
                    rel="noreferrer"
                    title="Open website"
                    className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[var(--sage-dark)] hover:bg-[var(--sage-soft)]"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    title="Edit"
                    onClick={() => openEdit(bm)}
                    className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Delete"
                    onClick={() => deleteItem('bookmarks', bm.id)}
                    className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[var(--error)] hover:bg-[var(--blush)]/45"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Bookmark' : 'Add Bookmark'}
      >
        <form onSubmit={handleSave} className="space-y-3.5">
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
              Website URL
            </label>
            <input
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[14px]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article or tool name"
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[14px]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
              Category
            </label>
            <select
              value={itemCat}
              onChange={(e) => setItemCat(e.target.value)}
              className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[13px]"
            >
              {BOOKMARK_CATEGORIES.filter((c) => c !== 'All Links').map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
              Personal description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why did you save this?"
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
              Save Link
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
